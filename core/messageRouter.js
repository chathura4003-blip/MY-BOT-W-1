'use strict';

const { commandManager } = require('./commandManager');
const { analytics } = require('./analytics');
const { eventBus } = require('./eventBus');
const { JsonStore } = require('./jsonStore');
const config = require('../config/app');

const usersStore = new JsonStore(config.paths.usersFile, { users: {} });
const aiRulesStore = new JsonStore(config.paths.aiRulesFile, { enabled: false, rules: [] });

function parseText(message) {
  return (
    message.message?.conversation
    || message.message?.extendedTextMessage?.text
    || message.message?.imageMessage?.caption
    || ''
  ).trim();
}

async function handleIncoming({ sessionId, sock, message, pluginHooks = [] }) {
  if (!message?.message) return;

  const from = message.key.remoteJid;
  const sender = message.key.participant || from;
  const text = parseText(message);
  if (!text) return;

  analytics.bumpMessage();
  eventBus.emitSafe('message_received', { sessionId, from, sender, text });

  usersStore.update((data) => ({
    ...data,
    users: {
      ...(data.users || {}),
      [sender]: { lastSeen: new Date().toISOString(), totalMessages: ((data.users || {})[sender]?.totalMessages || 0) + 1 },
    },
  }));

  for (const hook of pluginHooks) {
    await hook({ sessionId, sock, message, text, from, sender });
  }

  const prefix = config.bot.prefix;
  if (!text.startsWith(prefix)) {
    const ai = aiRulesStore.read();
    if (ai.enabled) {
      const rule = (ai.rules || []).find((r) => new RegExp(r.pattern, 'i').test(text));
      if (rule) await sock.sendMessage(from, { text: rule.response }, { quoted: message });
    }
    return;
  }

  const [raw, ...args] = text.slice(prefix.length).split(/\s+/);
  const cmdName = raw.toLowerCase();
  const command = commandManager.resolve(cmdName);
  if (!command) return;

  const permission = commandManager.canRun(command, {
    sender,
    isGroup: from.endsWith('@g.us'),
    isAdmin: sender.startsWith(config.bot.ownerNumber),
  });

  if (!permission.ok) {
    await sock.sendMessage(from, { text: `⛔ ${permission.reason}` }, { quoted: message });
    return;
  }

  analytics.bumpCommand(command.name);
  eventBus.emitSafe('command_executed', { sessionId, command: command.name, sender, from, args });

  const dynamicPayload = {
    command,
    args,
    sessionId,
    sender,
    from,
    text,
    reply: (body) => sock.sendMessage(from, { text: body }, { quoted: message }),
  };

  if (command.type === 'json-response') {
    await dynamicPayload.reply(command.response);
    return;
  }

  eventBus.emitSafe(`command:${command.name}`, dynamicPayload);
}

module.exports = { handleIncoming, usersStore };

'use strict';

const path = require('path');
const {
  default: makeWASocket,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
  DisconnectReason,
} = require('@whiskeysockets/baileys');
const pino = require('pino');

class BotEngine {
  constructor({ config, logger, commands, plugins, events }) {
    this.config = config;
    this.logger = logger;
    this.commands = commands;
    this.plugins = plugins;
    this.events = events;
    this.sessions = new Map();
    this.runtime = new Map();
    this.io = null;
  }

  setIO(io) {
    this.io = io;
    this.logger.on('log', (entry) => io.emit('log', entry));
  }

  async startAll(sessionRecords) {
    for (const record of sessionRecords.filter((s) => s.active)) {
      await this.startSession(record.id);
    }
  }

  async startSession(sessionId) {
    if (this.runtime.has(sessionId)) return this.runtime.get(sessionId);
    const authDir = path.join(this.config.data.sessionRoot, sessionId);
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
      },
      logger: pino({ level: 'silent' }),
      browser: this.config.browser,
      markOnlineOnConnect: true,
    });

    const runtime = { id: sessionId, sock, qr: null, connected: false, user: null };
    this.runtime.set(sessionId, runtime);

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', ({ connection, qr, lastDisconnect }) => {
      if (qr) runtime.qr = qr;
      if (connection === 'open') {
        runtime.connected = true;
        runtime.user = sock.user?.id || null;
        runtime.qr = null;
        this.logger.log('info', `Session ${sessionId} connected as ${runtime.user}`);
      }
      if (connection === 'close') {
        runtime.connected = false;
        const code = lastDisconnect?.error?.output?.statusCode;
        this.logger.log('error', `Session ${sessionId} disconnected (${code || DisconnectReason.connectionClosed})`);
      }
      this.emitStatus();
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;
      for (const msg of messages) {
        try {
          await this.handleMessage(sessionId, sock, msg);
        } catch (err) {
          this.logger.log('error', `Message handling error (${sessionId}): ${err.message}`);
          this.logger.bump('errors');
        }
      }
    });

    sock.ev.on('group-participants.update', async (payload) => {
      await this.events.emit('group.participant', { sessionId, payload });
      await this.plugins.onEvent('group.participant', { sessionId, sock, payload });
    });

    this.emitStatus();
    return runtime;
  }

  async stopSession(sessionId) {
    const runtime = this.runtime.get(sessionId);
    if (!runtime) return;
    runtime.sock.end(new Error('Session stopped'));
    this.runtime.delete(sessionId);
    this.emitStatus();
  }

  getSessionRuntime(sessionId) {
    return this.runtime.get(sessionId) || null;
  }

  listSessions() {
    return [...this.runtime.values()].map((r) => ({
      id: r.id,
      connected: r.connected,
      qr: r.qr,
      user: r.user,
    }));
  }

  emitStatus() {
    if (this.io) this.io.emit('status', this.listSessions());
  }

  async handleMessage(sessionId, sock, msg) {
    if (!msg?.message || !msg.key?.remoteJid) return;
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || from;
    const text = (
      msg.message.conversation
      || msg.message.extendedTextMessage?.text
      || msg.message.imageMessage?.caption
      || ''
    ).trim();
    this.logger.bump('messages');
    await this.events.emit('message.received', { sessionId, from, sender, text });
    const handledByPlugin = await this.plugins.onMessage({ sessionId, sock, msg, from, sender, text });
    if (handledByPlugin) return;

    const matched = this.commands.match(this.config.commandPrefix, text);
    if (!matched) {
      await this.autoReply(sock, from, text);
      return;
    }

    const isGroup = from.endsWith('@g.us');
    const ownerNumber = (process.env.OWNER_NUMBER || '').replace(/\D/g, '');
    const senderNumber = sender.split('@')[0].replace(/\D/g, '');
    const ctx = {
      isGroup,
      isOwner: !!ownerNumber && senderNumber === ownerNumber,
      isAdmin: false,
    };
    if (isGroup) {
      try {
        const meta = await sock.groupMetadata(from);
        const participant = meta.participants.find((p) => p.id === sender);
        ctx.isAdmin = participant?.admin === 'admin' || participant?.admin === 'superadmin';
      } catch (err) {
        this.logger.log('error', `Failed to resolve group admin state: ${err.message}`);
        this.logger.bump('errors');
      }
    }

    const wait = this.commands.checkCooldown(matched.command.name, sender, matched.command.cooldownSec);
    if (wait) {
      await sock.sendMessage(from, { text: `⏳ Cooldown active (${wait}s)` }, { quoted: msg });
      return;
    }

    if (!this.commands.checkPermission(matched.command, ctx)) {
      await sock.sendMessage(from, { text: '🚫 Permission denied.' }, { quoted: msg });
      return;
    }

    let response = matched.command.response || '';
    response = response.replaceAll('{args}', matched.args.join(' '));
    response = response.replaceAll('{sender}', sender.split('@')[0]);
    await sock.sendMessage(from, { text: response || '✅ Done.' }, { quoted: msg });

    this.logger.bump('commands');
    await this.events.emit('command.executed', {
      sessionId,
      command: matched.command.name,
      from,
      sender,
    });
    await this.plugins.onEvent('command.executed', {
      sessionId,
      command: matched.command.name,
      from,
      sender,
    });
  }

  async autoReply(sock, jid, text) {
    const rules = this.sessions.get('aiRules') || [];
    const found = rules.find((rule) => rule.enabled && text.toLowerCase().includes(rule.match.toLowerCase()));
    if (found) {
      await sock.sendMessage(jid, { text: found.reply });
    }
  }

  loadAiRules(rules) {
    this.sessions.set('aiRules', rules || []);
  }

  async sendMessage(sessionId, jid, text) {
    const runtime = this.runtime.get(sessionId);
    if (!runtime) throw new Error('Session not running');
    return runtime.sock.sendMessage(jid, { text });
  }
}

module.exports = { BotEngine };

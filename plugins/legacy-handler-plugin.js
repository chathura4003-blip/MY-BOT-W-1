'use strict';

const { loadCommands, handleCommand, onGroupUpdate } = require('../lib/handler');
const { PREFIX } = require('../config');

let loaded = false;

function extractText(msg) {
  return (
    msg?.message?.conversation
    || msg?.message?.extendedTextMessage?.text
    || msg?.message?.buttonsResponseMessage?.selectedButtonId
    || msg?.message?.templateButtonReplyMessage?.selectedId
    || ''
  ).trim();
}

module.exports = {
  id: 'legacy-handler-plugin',
  description: 'Compatibility bridge to existing lib/handler command modules.',
  enabledByDefault: true,
  async onMessage({ sock, msg, from }) {
    if (!loaded) {
      loadCommands();
      loaded = true;
    }

    const text = extractText(msg);
    const maybeNumericReply = /^\d+$/.test(text);
    const shouldRoute = text.startsWith(PREFIX) || maybeNumericReply || msg?.message?.listResponseMessage;
    if (!shouldRoute) return false;

    const handled = await handleCommand(sock, msg, from, text);
    return !!handled;
  },
  async onEvent(name, payload) {
    if (name === 'group.participant' && typeof onGroupUpdate === 'function') {
      await onGroupUpdate(payload?.sock || null, payload?.payload);
    }
  },
};

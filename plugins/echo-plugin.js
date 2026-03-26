'use strict';

module.exports = {
  id: 'echo-plugin',
  description: 'Simple echo listener for lightweight extensibility demo.',
  enabledByDefault: true,
  async onMessage({ sock, from, text, msg }) {
    if (text.toLowerCase() === '.echo') {
      await sock.sendMessage(from, { text: 'Echo plugin is enabled ✅' }, { quoted: msg });
    }
  },
};

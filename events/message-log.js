'use strict';

module.exports = {
  event: 'message.received',
  async execute({ from, text }) {
    if (text) console.log(`[MESSAGE] ${from}: ${text.slice(0, 80)}`);
  },
};

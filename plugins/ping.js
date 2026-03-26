'use strict';

module.exports = {
  register({ eventBus }) {
    eventBus.on('command:ping', async ({ reply }) => {
      await reply('pong 🏓');
    });
  },
};

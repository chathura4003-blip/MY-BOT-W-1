'use strict';

module.exports = {
  register({ eventBus }) {
    eventBus.on('command:echo', async ({ args, reply }) => {
      await reply(args.join(' ') || 'Nothing to echo.');
    });
  },
};

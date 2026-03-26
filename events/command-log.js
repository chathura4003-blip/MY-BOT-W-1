'use strict';

module.exports = {
  event: 'command.executed',
  async execute({ command, sender, sessionId }) {
    console.log(`[EVENT] ${sessionId}: ${sender} ran ${command}`);
  },
};

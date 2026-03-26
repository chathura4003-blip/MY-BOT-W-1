'use strict';

module.exports = {
  register(eventBus, eventManager, { logger }) {
    eventBus.on('message_received', (payload) => {
      if (!eventManager.isEnabled('message_received')) return;
      logger.info(`Message received from ${payload.sender}`, { sessionId: payload.sessionId });
    });

    eventBus.on('command_executed', (payload) => {
      if (!eventManager.isEnabled('command_executed')) return;
      logger.info(`Command executed: ${payload.command}`, payload);
    });
  },
};

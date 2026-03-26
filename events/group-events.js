'use strict';

module.exports = {
  register(eventBus, eventManager, { logger }) {
    eventBus.on('user_join', ({ participants, id }) => {
      if (!eventManager.isEnabled('user_join')) return;
      logger.info(`Users joined ${id}: ${participants.join(', ')}`);
    });

    eventBus.on('user_leave', ({ participants, id }) => {
      if (!eventManager.isEnabled('user_leave')) return;
      logger.info(`Users left ${id}: ${participants.join(', ')}`);
    });
  },
};

'use strict';

const config = require('../config/app');
const { logger } = require('./logger');
const { eventBus } = require('./eventBus');
const { eventManager } = require('./eventManager');
const { pluginManager } = require('./pluginManager');
const { handleIncoming } = require('./messageRouter');
const { InMemoryQueue } = require('./queue');
const { MultiSessionManager } = require('./sessionManager');
const { createApi } = require('../api/server');
const { analytics } = require('./analytics');

async function startApplication() {
  const broadcastQueue = new InMemoryQueue({ concurrency: 3 });
  let pluginHooks = [];

  const sessionManager = {
    listSessions: () => [],
    getSocket: () => null,
    addSession: async () => {},
    removeSession: () => {},
  };

  const { server, io } = createApi({ sessionManager, broadcastQueue });

  const liveSessionManager = new MultiSessionManager({
    io,
    eventBus,
    onMessage: async ({ sessionId, sock, message }) => {
      await handleIncoming({ sessionId, sock, message, pluginHooks });
    },
    onGroupEvent: async ({ update }) => {
      if (update.action === 'add') eventBus.emitSafe('user_join', update);
      if (update.action === 'remove') eventBus.emitSafe('user_leave', update);
    },
  });

  // Mutate placeholder object (closures keep reference)
  Object.assign(sessionManager, liveSessionManager);

  pluginManager.loadAll({ eventBus, logger });
  pluginHooks = Array.from(pluginManager.runtime.values())
    .filter((plugin) => typeof plugin.onMessage === 'function')
    .map((plugin) => plugin.onMessage);

  eventManager.loadAll(eventBus, { logger });

  eventBus.on('error', ({ event, error }) => {
    analytics.bumpError();
    logger.error(`Event error on ${event}: ${error.message}`);
  });

  await liveSessionManager.startAll();

  server.listen(config.api.port, '0.0.0.0', () => {
    logger.info(`Admin API + panel running on http://0.0.0.0:${config.api.port}`);
  });

  return { sessionManager: liveSessionManager, io };
}

module.exports = { startApplication };

'use strict';

const { startBot } = require('./bot');
const { logger } = require('./core/logger');

process.on('uncaughtException', (err) => logger.error(`Uncaught: ${err.message}`, { stack: err.stack }));
process.on('unhandledRejection', (err) => logger.error(`Unhandled rejection: ${err?.message || err}`));

startBot().catch((error) => {
  logger.error(`Startup failed: ${error.message}`, { stack: error.stack });
  process.exit(1);
});

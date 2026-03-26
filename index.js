'use strict';

const { startBot, getSock } = require('./bot');
const { startDashboard } = require('./dashboard');
const { logger } = require('./logger');
const { getStartupWarnings } = require('./lib/startup-check');

process.on('uncaughtException',  err => logger(`[UNCAUGHT]  ${err.message}\n${err.stack}`));
process.on('unhandledRejection', err => logger(`[UNHANDLED] ${err?.message || err}`));

(async () => {
    try {
        for (const warning of getStartupWarnings()) {
            logger(`[Startup Warning] ${warning}`);
        }

        startDashboard(getSock);
        await startBot();
    } catch (err) {
        logger(`[Index] Fatal startup error: ${err.message}`);
        process.exit(1);
    }
})();

'use strict';

const { startApplication } = require('./core/app');

let appContext = null;

async function startBot() {
  appContext = await startApplication();
  return appContext;
}

function getSock(sessionId = 'default') {
  return appContext?.sessionManager?.getSocket(sessionId) || null;
}

module.exports = { startBot, getSock };

'use strict';

const path = require('path');

const ROOT = path.join(__dirname, '..');

module.exports = {
  rootDir: ROOT,
  bot: {
    name: process.env.BOT_NAME || 'Modular WA Bot',
    prefix: process.env.PREFIX || '.',
    ownerNumber: process.env.OWNER_NUMBER || '10000000000',
    browser: ['ModularWABot', 'Chrome', '131.0'],
  },
  api: {
    port: Number(process.env.PORT || 5000),
    jwtSecret: process.env.JWT_SECRET || 'change-me',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
  },
  admin: {
    username: process.env.ADMIN_USER || 'owner',
    password: process.env.ADMIN_PASS || 'owner123',
  },
  paths: {
    dataDir: path.join(ROOT, 'data'),
    sessionsDir: path.join(ROOT, 'sessions'),
    panelDir: path.join(ROOT, 'panel'),
    commandsFile: path.join(ROOT, 'data', 'commands.json'),
    usersFile: path.join(ROOT, 'data', 'users.json'),
    sessionsFile: path.join(ROOT, 'data', 'sessions.json'),
    logsFile: path.join(ROOT, 'data', 'logs.json'),
    pluginsFile: path.join(ROOT, 'data', 'plugins.json'),
    eventsFile: path.join(ROOT, 'data', 'events.json'),
    analyticsFile: path.join(ROOT, 'data', 'analytics.json'),
    aiRulesFile: path.join(ROOT, 'data', 'ai-rules.json'),
  },
};

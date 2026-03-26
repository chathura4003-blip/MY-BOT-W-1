'use strict';

const path = require('path');

const root = path.join(__dirname, '..');
const dataDir = path.join(root, 'data');

module.exports = {
  root,
  port: parseInt(process.env.PORT || '5000', 10),
  publicBaseUrl: process.env.PUBLIC_BASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'change_this_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
  commandPrefix: process.env.PREFIX || '.',
  defaultSessionName: process.env.DEFAULT_SESSION_NAME || 'primary',
  browser: ['ModularBot', 'Chrome', '131.0'],
  data: {
    dir: dataDir,
    commandsFile: path.join(dataDir, 'commands.json'),
    usersFile: path.join(dataDir, 'users.json'),
    sessionsFile: path.join(dataDir, 'sessions.json'),
    logsFile: path.join(dataDir, 'logs.json'),
    eventsFile: path.join(dataDir, 'events.json'),
    rulesFile: path.join(dataDir, 'ai-rules.json'),
    sessionRoot: path.join(dataDir, 'sessions'),
  },
};

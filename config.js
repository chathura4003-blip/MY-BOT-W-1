'use strict';

const app = require('./config/app');

module.exports = {
  BOT_NAME: app.bot.name,
  PREFIX: app.bot.prefix,
  OWNER_NUMBER: app.bot.ownerNumber,
  JWT_SECRET: app.api.jwtSecret,
  DASHBOARD_PORT: app.api.port,
  PORT: app.api.port,
  ADMIN_USER: app.admin.username,
  ADMIN_PASS: app.admin.password,
  SESSION_DIR: app.paths.sessionsDir,
  BROWSER: app.bot.browser,
};

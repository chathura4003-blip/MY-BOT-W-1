'use strict';

const config = require('./config/app');
const { JsonStore } = require('./core/services/json-store');
const { LogService } = require('./core/services/log-service');
const { AuthService } = require('./core/services/auth-service');
const { CommandService } = require('./core/services/command-service');
const { PluginService } = require('./core/services/plugin-service');
const { EventService } = require('./core/services/event-service');
const { SessionService } = require('./core/services/session-service');
const { BotEngine } = require('./core/engine/bot-engine');
const { createServer } = require('./core/api/server');

async function bootstrap() {
  const logger = new LogService(config.data.logsFile);
  const auth = new AuthService(config.data.usersFile, config.jwtSecret, config.jwtExpiresIn);
  const commands = new CommandService(config.data.commandsFile, logger);
  const plugins = new PluginService(require('path').join(config.root, 'plugins'), logger);
  const events = new EventService(require('path').join(config.root, 'events'), config.data.eventsFile, logger);
  const sessions = new SessionService(config.data.sessionsFile, config.data.sessionRoot);
  const aiRulesStore = new JsonStore(config.data.rulesFile, { rules: [] });

  const bot = new BotEngine({ config, logger, commands, plugins, events });
  bot.loadAiRules(aiRulesStore.read().rules);

  await bot.startAll(sessions.list());

  const { server } = createServer({ config, auth, logger, commands, plugins, events, sessions, bot, aiRulesStore });
  const panelUrl = config.publicBaseUrl || `http://localhost:${config.port}`;

  server.listen(config.port, '0.0.0.0', () => {
    logger.log('info', `Admin API + panel running on ${panelUrl}`);
  });
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});

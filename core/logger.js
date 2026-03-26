'use strict';

const EventEmitter = require('events');
const { JsonStore } = require('./jsonStore');
const config = require('../config/app');

class BotLogger extends EventEmitter {
  constructor() {
    super();
    this.store = new JsonStore(config.paths.logsFile, []);
  }

  log(level, message, meta = {}) {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      ts: new Date().toISOString(),
      level,
      message,
      meta,
    };

    this.store.update((logs) => {
      const next = Array.isArray(logs) ? logs : [];
      next.push(entry);
      return next.slice(-5000);
    });

    const printer = level === 'error' ? console.error : console.log;
    printer(`[${entry.ts}] [${level.toUpperCase()}] ${message}`);
    this.emit('log', entry);
    return entry;
  }

  info(message, meta) { return this.log('info', message, meta); }
  warn(message, meta) { return this.log('warn', message, meta); }
  error(message, meta) { return this.log('error', message, meta); }

  list(limit = 200) {
    const logs = this.store.read();
    return logs.slice(-limit);
  }
}

module.exports = { logger: new BotLogger() };

'use strict';

const { EventEmitter } = require('events');
const { JsonStore } = require('./json-store');

class LogService extends EventEmitter {
  constructor(filePath) {
    super();
    this.store = new JsonStore(filePath, { entries: [], analytics: { messages: 0, commands: 0, errors: 0 } });
    this.maxEntries = 1000;
  }

  log(level, message, meta = {}) {
    const payload = {
      ts: new Date().toISOString(),
      level,
      message,
      meta,
    };
    const db = this.store.read();
    db.entries.push(payload);
    if (db.entries.length > this.maxEntries) {
      db.entries.splice(0, db.entries.length - this.maxEntries);
    }
    this.store.write(db);
    this.emit('log', payload);
    const printer = level === 'error' ? console.error : console.log;
    printer(`[${payload.ts}] [${level.toUpperCase()}] ${message}`);
    return payload;
  }

  bump(metric, amount = 1) {
    const db = this.store.read();
    db.analytics[metric] = (db.analytics[metric] || 0) + amount;
    this.store.write(db);
  }

  getLogs(limit = 200) {
    return this.store.read().entries.slice(-limit);
  }

  getAnalytics() {
    return this.store.read().analytics;
  }
}

module.exports = { LogService };

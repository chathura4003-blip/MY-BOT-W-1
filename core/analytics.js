'use strict';

const { JsonStore } = require('./jsonStore');
const config = require('../config/app');

class Analytics {
  constructor() {
    this.store = new JsonStore(config.paths.analyticsFile, {
      totalMessages: 0,
      commandUsage: {},
      errors: 0,
      sessionsConnected: 0,
      lastUpdatedAt: null,
    });
  }

  bumpMessage() {
    this.store.update((current) => ({
      ...current,
      totalMessages: (current.totalMessages || 0) + 1,
      lastUpdatedAt: new Date().toISOString(),
    }));
  }

  bumpCommand(commandName) {
    this.store.update((current) => ({
      ...current,
      commandUsage: {
        ...(current.commandUsage || {}),
        [commandName]: ((current.commandUsage || {})[commandName] || 0) + 1,
      },
      lastUpdatedAt: new Date().toISOString(),
    }));
  }

  bumpError() {
    this.store.update((current) => ({
      ...current,
      errors: (current.errors || 0) + 1,
      lastUpdatedAt: new Date().toISOString(),
    }));
  }

  setConnectedSessions(count) {
    this.store.update((current) => ({ ...current, sessionsConnected: count, lastUpdatedAt: new Date().toISOString() }));
  }

  getStats() {
    return this.store.read();
  }
}

module.exports = { analytics: new Analytics() };

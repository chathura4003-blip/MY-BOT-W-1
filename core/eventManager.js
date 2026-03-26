'use strict';

const fs = require('fs');
const path = require('path');
const { JsonStore } = require('./jsonStore');
const config = require('../config/app');

class EventManager {
  constructor() {
    this.store = new JsonStore(config.paths.eventsFile, {
      events: {
        message_received: { enabled: true },
        user_join: { enabled: true },
        user_leave: { enabled: true },
        command_executed: { enabled: true },
      },
    });
  }

  isEnabled(name) {
    const events = this.store.read().events || {};
    return events[name]?.enabled !== false;
  }

  setEnabled(name, enabled) {
    this.store.update((data) => ({
      ...data,
      events: { ...(data.events || {}), [name]: { enabled: Boolean(enabled) } },
    }));
  }

  loadAll(eventBus, context) {
    const eventsDir = path.join(config.rootDir, 'events');
    if (!fs.existsSync(eventsDir)) return;
    fs.readdirSync(eventsDir)
      .filter((file) => file.endsWith('.js'))
      .forEach((file) => {
        const eventModule = require(path.join(eventsDir, file));
        if (eventModule?.register) eventModule.register(eventBus, this, context);
      });
  }
}

module.exports = { eventManager: new EventManager() };

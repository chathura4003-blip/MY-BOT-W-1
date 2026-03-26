'use strict';

const fs = require('fs');
const path = require('path');
const { JsonStore } = require('./json-store');

class EventService {
  constructor(eventsDir, eventsFile, logger) {
    this.eventsDir = eventsDir;
    this.logger = logger;
    this.handlers = new Map();
    this.flags = new JsonStore(eventsFile, {
      events: {
        'message.received': true,
        'group.participant': true,
        'command.executed': true,
      },
    });
    this.loadHandlers();
  }

  loadHandlers() {
    this.handlers.clear();
    if (!fs.existsSync(this.eventsDir)) fs.mkdirSync(this.eventsDir, { recursive: true });
    for (const file of fs.readdirSync(this.eventsDir).filter((f) => f.endsWith('.js'))) {
      const full = path.join(this.eventsDir, file);
      delete require.cache[require.resolve(full)];
      const mod = require(full);
      if (!mod.event || typeof mod.execute !== 'function') continue;
      if (!this.handlers.has(mod.event)) this.handlers.set(mod.event, []);
      this.handlers.get(mod.event).push(mod.execute);
    }
  }

  list() {
    return this.flags.read().events;
  }

  setEnabled(eventName, enabled) {
    const db = this.flags.read();
    db.events[eventName] = !!enabled;
    this.flags.write(db);
  }

  async emit(eventName, payload) {
    if (!this.flags.read().events[eventName]) return;
    for (const handler of this.handlers.get(eventName) || []) {
      try {
        await handler(payload);
      } catch (err) {
        this.logger.log('error', `Event handler error ${eventName}: ${err.message}`);
      }
    }
  }
}

module.exports = { EventService };

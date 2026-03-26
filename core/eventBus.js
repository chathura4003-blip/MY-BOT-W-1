'use strict';

const EventEmitter = require('events');

class EventBus extends EventEmitter {
  emitSafe(event, payload) {
    try {
      this.emit(event, payload);
    } catch (error) {
      this.emit('error', { event, error });
    }
  }
}

module.exports = { eventBus: new EventBus() };

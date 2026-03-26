'use strict';

const fs = require('fs');
const path = require('path');
const { JsonStore } = require('./json-store');

class SessionService {
  constructor(filePath, sessionRoot) {
    this.sessionRoot = sessionRoot;
    this.store = new JsonStore(filePath, { sessions: [{ id: 'primary', label: 'Primary Account', active: true, createdAt: Date.now() }] });
    fs.mkdirSync(sessionRoot, { recursive: true });
  }

  list() {
    return this.store.read().sessions;
  }

  add(label) {
    const id = `${label || 'session'}-${Date.now().toString(36)}`.replace(/[^a-z0-9-]/gi, '').toLowerCase();
    const sessions = this.list();
    const session = { id, label: label || id, active: true, createdAt: Date.now() };
    sessions.push(session);
    this.store.write({ sessions });
    return session;
  }

  remove(id) {
    const sessions = this.list().filter((s) => s.id !== id);
    this.store.write({ sessions });
    fs.rmSync(path.join(this.sessionRoot, id), { recursive: true, force: true });
  }

  setActive(id, active) {
    const sessions = this.list().map((s) => (s.id === id ? { ...s, active: !!active } : s));
    this.store.write({ sessions });
  }
}

module.exports = { SessionService };

'use strict';

const { JsonStore } = require('./json-store');

class CommandService {
  constructor(filePath, logger) {
    this.logger = logger;
    this.store = new JsonStore(filePath, { commands: [] });
    this.cooldowns = new Map();
    this.index = new Map();
    this.reload();
  }

  reload() {
    this.index.clear();
    const { commands } = this.store.read();
    for (const command of commands) {
      this.index.set(command.name, command);
      for (const alias of command.aliases || []) this.index.set(alias, command);
    }
    return commands;
  }

  list() {
    return this.store.read().commands;
  }

  save(commands) {
    this.store.write({ commands });
    this.reload();
  }

  upsert(command) {
    const commands = this.list();
    const idx = commands.findIndex((c) => c.name === command.name);
    const next = {
      name: command.name,
      aliases: command.aliases || [],
      response: command.response || '',
      cooldownSec: Number(command.cooldownSec || 0),
      permission: command.permission || 'user',
      category: command.category || 'general',
      enabled: command.enabled !== false,
    };
    if (idx === -1) commands.push(next);
    else commands[idx] = next;
    this.save(commands);
    return next;
  }

  remove(name) {
    this.save(this.list().filter((c) => c.name !== name));
  }

  checkPermission(command, ctx) {
    if (command.permission === 'user') return true;
    if (command.permission === 'admin') return ctx.isAdmin || ctx.isOwner;
    if (command.permission === 'group') return ctx.isGroup;
    return false;
  }

  checkCooldown(name, userId, cooldownSec) {
    if (!cooldownSec) return null;
    const key = `${name}:${userId}`;
    const now = Date.now();
    const expires = this.cooldowns.get(key) || 0;
    if (expires > now) return Math.ceil((expires - now) / 1000);
    this.cooldowns.set(key, now + cooldownSec * 1000);
    return null;
  }

  match(prefix, text) {
    if (!text.startsWith(prefix)) return null;
    const [name, ...args] = text.slice(prefix.length).trim().split(/\s+/);
    const command = this.index.get((name || '').toLowerCase());
    if (!command || command.enabled === false) return null;
    return { command, args };
  }
}

module.exports = { CommandService };

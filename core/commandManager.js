'use strict';

const fs = require('fs');
const { JsonStore } = require('./jsonStore');
const config = require('../config/app');

class CommandManager {
  constructor() {
    this.store = new JsonStore(config.paths.commandsFile, { commands: [] });
    this.cooldowns = new Map();
    this.commands = this.normalize(this.store.read().commands || []);
    this.watchFile();
  }

  normalize(commands) {
    return commands.map((cmd) => ({
      aliases: [],
      permissions: ['user'],
      cooldownSec: 0,
      category: 'general',
      enabled: true,
      response: 'No response configured.',
      ...cmd,
    }));
  }

  watchFile() {
    fs.watchFile(config.paths.commandsFile, { interval: 1000 }, () => {
      const latest = this.store.read();
      this.commands = this.normalize(latest.commands || []);
    });
  }

  getAll() {
    return this.commands;
  }

  saveAll(commands) {
    this.commands = this.normalize(commands);
    return this.store.write({ commands: this.commands });
  }

  upsert(command) {
    const list = this.getAll();
    const idx = list.findIndex((c) => c.name === command.name);
    if (idx >= 0) list[idx] = { ...list[idx], ...command };
    else list.push(command);
    this.saveAll(list);
    return command;
  }

  remove(name) {
    const filtered = this.getAll().filter((cmd) => cmd.name !== name);
    this.saveAll(filtered);
  }

  resolve(name) {
    return this.commands.find((cmd) => cmd.name === name || cmd.aliases.includes(name));
  }

  canRun(command, context) {
    if (!command.enabled) return { ok: false, reason: 'Command disabled.' };
    if (command.permissions.includes('group') && !context.isGroup) return { ok: false, reason: 'Group only.' };
    if (command.permissions.includes('admin') && !context.isAdmin) return { ok: false, reason: 'Admin only.' };

    const cooldownKey = `${context.sender}:${command.name}`;
    const now = Date.now();
    const last = this.cooldowns.get(cooldownKey) || 0;
    const cdMs = (Number(command.cooldownSec) || 0) * 1000;

    if (cdMs > 0 && now - last < cdMs) {
      return { ok: false, reason: `Cooldown active: ${Math.ceil((cdMs - (now - last)) / 1000)}s` };
    }

    this.cooldowns.set(cooldownKey, now);
    return { ok: true };
  }
}

module.exports = { commandManager: new CommandManager() };

'use strict';

const fs = require('fs');
const path = require('path');
const { JsonStore } = require('./jsonStore');
const config = require('../config/app');
const { logger } = require('./logger');

class PluginManager {
  constructor() {
    this.store = new JsonStore(config.paths.pluginsFile, { plugins: {} });
    this.runtime = new Map();
  }

  discover() {
    const dir = path.join(config.rootDir, 'plugins');
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter((file) => file.endsWith('.js'));
  }

  getConfig() {
    const data = this.store.read();
    return data.plugins || {};
  }

  setEnabled(pluginName, enabled) {
    this.store.update((data) => ({
      ...data,
      plugins: { ...(data.plugins || {}), [pluginName]: { enabled: Boolean(enabled) } },
    }));
  }

  loadAll(context) {
    const discovered = this.discover();
    const cfg = this.getConfig();

    discovered.forEach((file) => {
      const pluginPath = path.join(config.rootDir, 'plugins', file);
      const name = file.replace(/\.js$/, '');
      const enabled = cfg[name]?.enabled !== false;
      if (!enabled) return;

      delete require.cache[require.resolve(pluginPath)];
      const plugin = require(pluginPath);
      if (plugin?.register) {
        plugin.register(context);
        this.runtime.set(name, plugin);
        logger.info(`Plugin loaded: ${name}`);
      }
    });
  }

  list() {
    const discovered = this.discover().map((f) => f.replace(/\.js$/, ''));
    const cfg = this.getConfig();
    return discovered.map((name) => ({ name, enabled: cfg[name]?.enabled !== false }));
  }
}

module.exports = { pluginManager: new PluginManager() };

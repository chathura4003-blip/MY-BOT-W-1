'use strict';

const fs = require('fs');
const path = require('path');

class PluginService {
  constructor(pluginDir, logger) {
    this.pluginDir = pluginDir;
    this.logger = logger;
    this.plugins = new Map();
    this.load();
  }

  load() {
    this.plugins.clear();
    if (!fs.existsSync(this.pluginDir)) fs.mkdirSync(this.pluginDir, { recursive: true });
    for (const file of fs.readdirSync(this.pluginDir).filter((f) => f.endsWith('.js'))) {
      const full = path.join(this.pluginDir, file);
      delete require.cache[require.resolve(full)];
      const plugin = require(full);
      if (!plugin.id) continue;
      this.plugins.set(plugin.id, { ...plugin, enabled: plugin.enabledByDefault !== false });
    }
    this.logger.log('info', `Loaded plugins: ${this.plugins.size}`);
  }

  list() {
    return [...this.plugins.values()].map((p) => ({
      id: p.id,
      description: p.description || '',
      enabled: p.enabled,
    }));
  }

  setEnabled(id, enabled) {
    const p = this.plugins.get(id);
    if (!p) return null;
    p.enabled = !!enabled;
    return p;
  }

  async onMessage(ctx) {
    for (const plugin of this.plugins.values()) {
      if (!plugin.enabled || typeof plugin.onMessage !== 'function') continue;
      const handled = await plugin.onMessage(ctx);
      if (handled) return true;
    }
    return false;
  }

  async onEvent(name, payload) {
    for (const plugin of this.plugins.values()) {
      if (!plugin.enabled || typeof plugin.onEvent !== 'function') continue;
      await plugin.onEvent(name, payload);
    }
  }
}

module.exports = { PluginService };

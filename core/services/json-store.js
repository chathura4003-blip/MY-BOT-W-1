'use strict';

const fs = require('fs');
const path = require('path');

class JsonStore {
  constructor(filePath, defaults) {
    this.filePath = filePath;
    this.defaults = defaults;
    this.cache = null;
    this.ensureFile();
  }

  ensureFile() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify(this.defaults, null, 2));
    }
  }

  read() {
    if (this.cache) return this.cache;
    try {
      const parsed = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      this.cache = parsed;
    } catch {
      this.cache = this.defaults;
      this.write(this.cache);
    }
    return this.cache;
  }

  write(data) {
    this.cache = data;
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    return this.cache;
  }

  update(mutator) {
    const current = this.read();
    const next = mutator(structuredClone(current));
    return this.write(next);
  }
}

module.exports = { JsonStore };

'use strict';

const fs = require('fs');
const path = require('path');

class JsonStore {
  constructor(filePath, fallbackData) {
    this.filePath = filePath;
    this.fallbackData = fallbackData;
    this.cache = null;
    this.ensure();
  }

  ensure() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify(this.fallbackData, null, 2));
      this.cache = this.fallbackData;
      return;
    }
    this.cache = this.read();
  }

  read() {
    try {
      const parsed = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      this.cache = parsed;
      return parsed;
    } catch {
      this.cache = this.fallbackData;
      return this.fallbackData;
    }
  }

  write(data) {
    this.cache = data;
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    return data;
  }

  update(mutator) {
    const current = this.read();
    const next = mutator(current) ?? current;
    return this.write(next);
  }
}

module.exports = { JsonStore };

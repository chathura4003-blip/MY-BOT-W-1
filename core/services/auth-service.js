'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { JsonStore } = require('./json-store');

class AuthService {
  constructor(usersFile, jwtSecret, expiresIn) {
    this.jwtSecret = jwtSecret;
    this.expiresIn = expiresIn;
    this.store = new JsonStore(usersFile, {
      users: [
        {
          id: 'owner',
          username: process.env.ADMIN_USER || 'admin',
          passwordHash: this.hash(process.env.ADMIN_PASS || 'admin123'),
          role: 'owner',
        },
      ],
    });
    this.syncOwnerFromEnv();
  }

  hash(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  login(username, password) {
    const user = this.store.read().users.find((u) => u.username === username);
    if (!user || user.passwordHash !== this.hash(password)) return null;
    return jwt.sign({ sub: user.id, role: user.role, username: user.username }, this.jwtSecret, { expiresIn: this.expiresIn });
  }

  verify(token) {
    return jwt.verify(token, this.jwtSecret);
  }

  syncOwnerFromEnv() {
    const username = process.env.ADMIN_USER || 'admin';
    const password = process.env.ADMIN_PASS || 'admin123';
    const db = this.store.read();
    const owner = db.users.find((u) => u.id === 'owner');
    if (!owner) {
      db.users.push({ id: 'owner', username, passwordHash: this.hash(password), role: 'owner' });
      this.store.write(db);
      return;
    }
    if (owner.username !== username || owner.passwordHash !== this.hash(password)) {
      owner.username = username;
      owner.passwordHash = this.hash(password);
      this.store.write(db);
    }
  }
}

module.exports = { AuthService };

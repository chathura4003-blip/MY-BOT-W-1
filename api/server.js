'use strict';

const express = require('express');
const http = require('http');
const path = require('path');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

const config = require('../config/app');
const { logger } = require('../core/logger');
const { analytics } = require('../core/analytics');
const { commandManager } = require('../core/commandManager');
const { pluginManager } = require('../core/pluginManager');
const { eventManager } = require('../core/eventManager');
const { usersStore } = require('../core/messageRouter');

function createAuthToken(user) {
  return jwt.sign(user, config.api.jwtSecret, { expiresIn: config.api.jwtExpiresIn });
}

function createApi({ sessionManager, broadcastQueue }) {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });

  app.use(express.json({ limit: '1mb' }));
  app.use('/', express.static(path.join(config.rootDir, 'panel')));

  const requireAuth = (req, res, next) => {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      req.user = jwt.verify(token, config.api.jwtSecret);
      return next();
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };

  const allowRoles = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    return next();
  };

  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body || {};
    if (username !== config.admin.username || password !== config.admin.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = createAuthToken({ username, role: 'Owner' });
    return res.json({ token, role: 'Owner' });
  });

  app.get('/api/status', requireAuth, (req, res) => {
    res.json({
      ok: true,
      sessions: sessionManager.listSessions(),
      queue: broadcastQueue.getStatus(),
      analytics: analytics.getStats(),
    });
  });

  app.get('/api/logs', requireAuth, (req, res) => {
    res.json({ logs: logger.list(Number(req.query.limit) || 200) });
  });

  app.get('/api/users', requireAuth, (req, res) => {
    res.json(usersStore.read());
  });

  app.get('/api/commands', requireAuth, (req, res) => res.json({ commands: commandManager.getAll() }));
  app.post('/api/commands', requireAuth, allowRoles('Owner', 'Admin'), (req, res) => {
    commandManager.upsert(req.body);
    res.json({ ok: true });
  });
  app.delete('/api/commands/:name', requireAuth, allowRoles('Owner'), (req, res) => {
    commandManager.remove(req.params.name);
    res.json({ ok: true });
  });

  app.get('/api/plugins', requireAuth, (req, res) => res.json({ plugins: pluginManager.list() }));
  app.post('/api/plugins/:name/toggle', requireAuth, allowRoles('Owner', 'Admin'), (req, res) => {
    pluginManager.setEnabled(req.params.name, Boolean(req.body.enabled));
    res.json({ ok: true });
  });

  app.get('/api/events', requireAuth, (req, res) => res.json(eventManager.store.read()));
  app.post('/api/events/:name/toggle', requireAuth, allowRoles('Owner', 'Admin'), (req, res) => {
    eventManager.setEnabled(req.params.name, Boolean(req.body.enabled));
    res.json({ ok: true });
  });

  app.get('/api/sessions', requireAuth, (req, res) => res.json({ sessions: sessionManager.listSessions() }));
  app.post('/api/sessions', requireAuth, allowRoles('Owner', 'Admin'), async (req, res) => {
    const id = req.body?.id;
    if (!id) return res.status(400).json({ error: 'id required' });
    await sessionManager.addSession(id);
    return res.json({ ok: true });
  });
  app.delete('/api/sessions/:id', requireAuth, allowRoles('Owner'), (req, res) => {
    sessionManager.removeSession(req.params.id);
    res.json({ ok: true });
  });

  app.post('/api/messages/send', requireAuth, allowRoles('Owner', 'Admin', 'Moderator'), async (req, res) => {
    const { sessionId = 'default', to, text } = req.body || {};
    const sock = sessionManager.getSocket(sessionId);
    if (!sock) return res.status(404).json({ error: 'Session not connected' });
    await sock.sendMessage(to, { text });
    res.json({ ok: true });
  });

  app.post('/api/messages/broadcast', requireAuth, allowRoles('Owner', 'Admin'), async (req, res) => {
    const { sessionId = 'default', recipients = [], text } = req.body || {};
    const sock = sessionManager.getSocket(sessionId);
    if (!sock) return res.status(404).json({ error: 'Session not connected' });

    const jobs = recipients.map((to) => broadcastQueue.add(() => sock.sendMessage(to, { text })));
    await Promise.allSettled(jobs);
    res.json({ ok: true, queued: recipients.length });
  });

  app.post('/api/restart', requireAuth, allowRoles('Owner'), (req, res) => {
    res.json({ ok: true });
    setTimeout(() => process.exit(0), 750);
  });

  io.on('connection', (socket) => {
    socket.emit('boot', {
      analytics: analytics.getStats(),
      sessions: sessionManager.listSessions(),
    });
  });

  logger.on('log', (entry) => io.emit('log', entry));

  return { app, server, io };
}

module.exports = { createApi };

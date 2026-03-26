'use strict';

const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { QueueService } = require('../services/queue-service');

function roleAtLeast(role, need) {
  const order = ['moderator', 'admin', 'owner'];
  const roleIdx = order.indexOf(role);
  const needIdx = order.indexOf(need);
  if (roleIdx === -1 || needIdx === -1) return false;
  return roleIdx >= needIdx;
}

function createServer(services) {
  const { config, auth, logger, commands, plugins, events, sessions, bot, aiRulesStore } = services;
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });
  const broadcastQueue = new QueueService(1);

  bot.setIO(io);

  app.use(express.json());
  app.use(express.static(path.join(config.root, 'public')));

  function authRequired(minRole = 'moderator') {
    return (req, res, next) => {
      const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
      if (!token) return res.status(401).json({ error: 'Missing token' });
      try {
        const user = auth.verify(token);
        if (!roleAtLeast(user.role, minRole)) return res.status(403).json({ error: 'Forbidden' });
        req.user = user;
        next();
      } catch {
        res.status(401).json({ error: 'Invalid token' });
      }
    };
  }

  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body || {};
    const token = auth.login(username, password);
    if (!token) return res.status(401).json({ error: 'Invalid credentials' });
    return res.json({ token });
  });

  app.get('/api/status', authRequired(), (req, res) => {
    const panelUrl = config.publicBaseUrl || `${req.protocol}://${req.get('host')}`;
    res.json({
      uptime: process.uptime(),
      panelUrl,
      sessions: bot.listSessions(),
      analytics: logger.getAnalytics(),
      queue: { pending: broadcastQueue.queue.length, running: broadcastQueue.running },
    });
  });

  app.get('/api/public-link', authRequired(), (req, res) => {
    const panelUrl = config.publicBaseUrl || `${req.protocol}://${req.get('host')}`;
    res.json({ panelUrl });
  });

  app.get('/api/logs', authRequired(), (req, res) => {
    res.json({ logs: logger.getLogs(Number(req.query.limit || 200)) });
  });

  app.get('/api/commands', authRequired(), (req, res) => res.json({ commands: commands.list() }));
  app.post('/api/commands', authRequired('admin'), (req, res) => {
    res.json({ command: commands.upsert(req.body || {}) });
  });
  app.delete('/api/commands/:name', authRequired('admin'), (req, res) => {
    commands.remove(req.params.name);
    res.json({ ok: true });
  });

  app.get('/api/plugins', authRequired(), (req, res) => res.json({ plugins: plugins.list() }));
  app.patch('/api/plugins/:id', authRequired('admin'), (req, res) => {
    const plugin = plugins.setEnabled(req.params.id, req.body?.enabled);
    if (!plugin) return res.status(404).json({ error: 'Not found' });
    return res.json({ plugin });
  });

  app.get('/api/events', authRequired(), (req, res) => res.json({ events: events.list() }));
  app.patch('/api/events/:name', authRequired('admin'), (req, res) => {
    events.setEnabled(req.params.name, req.body?.enabled);
    res.json({ ok: true });
  });

  app.get('/api/sessions', authRequired(), (req, res) => res.json({ sessions: sessions.list(), runtime: bot.listSessions() }));
  app.post('/api/sessions', authRequired('admin'), async (req, res) => {
    const session = sessions.add(req.body?.label || 'Session');
    await bot.startSession(session.id);
    res.json({ session });
  });
  app.patch('/api/sessions/:id', authRequired('admin'), async (req, res) => {
    sessions.setActive(req.params.id, req.body?.active);
    if (req.body?.active) await bot.startSession(req.params.id);
    else await bot.stopSession(req.params.id);
    res.json({ ok: true });
  });
  app.delete('/api/sessions/:id', authRequired('owner'), async (req, res) => {
    await bot.stopSession(req.params.id);
    sessions.remove(req.params.id);
    res.json({ ok: true });
  });

  app.get('/api/sessions/:id/qr', authRequired(), (req, res) => {
    const rt = bot.getSessionRuntime(req.params.id);
    res.json({ id: req.params.id, qr: rt?.qr || null, connected: !!rt?.connected });
  });

  app.post('/api/messages/send', authRequired('moderator'), async (req, res) => {
    const { sessionId, jid, text } = req.body || {};
    await bot.sendMessage(sessionId, jid, text);
    res.json({ ok: true });
  });

  app.post('/api/messages/broadcast', authRequired('admin'), async (req, res) => {
    const { sessionId, jids = [], text } = req.body || {};
    const tasks = jids.map((jid) => broadcastQueue.add(() => bot.sendMessage(sessionId, jid, text)));
    await Promise.allSettled(tasks);
    res.json({ ok: true, queued: jids.length });
  });

  app.get('/api/ai-rules', authRequired(), (req, res) => res.json(aiRulesStore.read()));
  app.put('/api/ai-rules', authRequired('admin'), (req, res) => {
    const rules = req.body?.rules || [];
    aiRulesStore.write({ rules });
    bot.loadAiRules(rules);
    res.json({ ok: true });
  });

  app.post('/api/restart', authRequired('owner'), (req, res) => {
    res.json({ ok: true });
    setTimeout(() => process.exit(0), 500);
  });

  io.on('connection', (socket) => {
    socket.emit('status', bot.listSessions());
  });

  return { app, server, io };
}

module.exports = { createServer };

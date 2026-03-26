'use strict';

const fs = require('fs');
const path = require('path');
const makeWASocket = require('@whiskeysockets/baileys').default;
const {
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
  DisconnectReason,
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode');
const { Boom } = require('@hapi/boom');

const { JsonStore } = require('./jsonStore');
const { logger } = require('./logger');
const { analytics } = require('./analytics');
const config = require('../config/app');

class MultiSessionManager {
  constructor({ onMessage, onGroupEvent, io, eventBus }) {
    this.onMessage = onMessage;
    this.onGroupEvent = onGroupEvent;
    this.io = io;
    this.eventBus = eventBus;
    this.sessions = new Map();
    this.store = new JsonStore(config.paths.sessionsFile, { sessions: [] });
    if (!fs.existsSync(config.paths.sessionsDir)) fs.mkdirSync(config.paths.sessionsDir, { recursive: true });
  }

  listSessions() {
    return this.store.read().sessions || [];
  }

  persistSession(id, patch = {}) {
    this.store.update((data) => {
      const sessions = data.sessions || [];
      const idx = sessions.findIndex((s) => s.id === id);
      if (idx === -1) sessions.push({ id, enabled: true, createdAt: new Date().toISOString(), ...patch });
      else sessions[idx] = { ...sessions[idx], ...patch };
      return { ...data, sessions };
    });
  }

  async startAll() {
    const stored = this.listSessions();
    if (!stored.length) this.persistSession('default', { enabled: true });
    for (const session of this.listSessions().filter((s) => s.enabled !== false)) {
      await this.startSession(session.id);
    }
  }

  async startSession(sessionId) {
    const authPath = path.join(config.paths.sessionsDir, sessionId);
    const { state, saveCreds } = await useMultiFileAuthState(authPath);
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
      },
      browser: config.bot.browser,
      markOnlineOnConnect: true,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async ({ connection, qr, lastDisconnect }) => {
      if (qr) {
        const qrDataUrl = await qrcode.toDataURL(qr);
        this.persistSession(sessionId, { qr: qrDataUrl, connected: false, lastSeen: new Date().toISOString() });
        this.io?.emit('session:qr', { sessionId, qr: qrDataUrl });
      }

      if (connection === 'open') {
        this.persistSession(sessionId, { connected: true, qr: null, user: sock.user?.id, lastSeen: new Date().toISOString() });
        analytics.setConnectedSessions(this.connectedCount());
        this.io?.emit('session:status', { sessionId, connected: true, user: sock.user?.id });
        logger.info(`Session connected: ${sessionId}`);
      }

      if (connection === 'close') {
        const code = lastDisconnect?.error instanceof Boom ? lastDisconnect.error.output?.statusCode : undefined;
        if (code === DisconnectReason.loggedOut) {
          this.persistSession(sessionId, { connected: false, lastSeen: new Date().toISOString() });
          logger.warn(`Session logged out: ${sessionId}`);
          return;
        }
        this.persistSession(sessionId, { connected: false, lastSeen: new Date().toISOString() });
        setTimeout(() => this.startSession(sessionId), 5000);
      }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;
      for (const message of messages) {
        await this.onMessage({ sessionId, sock, message });
      }
    });

    sock.ev.on('group-participants.update', async (update) => {
      await this.onGroupEvent({ sessionId, sock, update });
    });

    this.sessions.set(sessionId, sock);
    return sock;
  }

  connectedCount() {
    return this.listSessions().filter((s) => s.connected).length;
  }

  async addSession(id) {
    this.persistSession(id, { enabled: true, connected: false });
    return this.startSession(id);
  }

  removeSession(id) {
    const sock = this.sessions.get(id);
    try { sock?.end?.(); } catch {}
    this.sessions.delete(id);
    this.store.update((data) => ({ ...data, sessions: (data.sessions || []).filter((s) => s.id !== id) }));
    const dir = path.join(config.paths.sessionsDir, id);
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  }

  getSocket(id = 'default') {
    return this.sessions.get(id) || null;
  }

  getSockets() {
    return Array.from(this.sessions.entries()).map(([id, sock]) => ({ id, sock }));
  }
}

module.exports = { MultiSessionManager };

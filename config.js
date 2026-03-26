'use strict';

const path = require('path');

function toInt(value, fallback) {
    const num = Number.parseInt(value, 10);
    return Number.isFinite(num) ? num : fallback;
}

function toBool(value, fallback) {
    if (value === undefined || value === null || value === '') return fallback;
    const normalized = String(value).trim().toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
    return fallback;
}

function toEnum(value, allowed, fallback) {
    const normalized = String(value || '').trim().toLowerCase();
    return allowed.includes(normalized) ? normalized : fallback;
}

const PORT = toInt(process.env.PORT, 5000);

module.exports = {
    BOT_NAME: (process.env.BOT_NAME || 'CHATHU MD').trim(),
    OWNER_NUMBER: (process.env.OWNER_NUMBER || '94742514900').replace(/\D/g, ''),
    PREFIX: (process.env.PREFIX || '.').trim() || '.',

    PORT,
    DASHBOARD_PORT: toInt(process.env.DASHBOARD_PORT, PORT),

    ADMIN_USER: (process.env.ADMIN_USER || 'admin').trim(),
    ADMIN_PASS: process.env.ADMIN_PASS || 'admin123',
    JWT_SECRET: process.env.JWT_SECRET || 'secret_token_change_it',

    SESSION_DIR: path.join(__dirname, 'session'),
    DOWNLOAD_DIR: path.join(__dirname, 'downloads'),

    BROWSER: [
        process.env.BROWSER_NAME || 'SupremeBot',
        process.env.BROWSER_PLATFORM || 'Chrome',
        process.env.BROWSER_VERSION || '131.0',
    ],

    AUTO_READ: toBool(process.env.AUTO_READ, true),
    AUTO_TYPING: toBool(process.env.AUTO_TYPING, true),
    NSFW_ENABLED: toBool(process.env.NSFW_ENABLED, true),
    WORK_MODE: toEnum(process.env.WORK_MODE, ['public', 'private'], 'public'),

    SEARCH_CACHE_TTL: toInt(process.env.SEARCH_CACHE_TTL, 300000),
    DOWNLOAD_CACHE_TTL: toInt(process.env.DOWNLOAD_CACHE_TTL, 1800000),
    MSG_CACHE_TTL: toInt(process.env.MSG_CACHE_TTL, 3600000),
};

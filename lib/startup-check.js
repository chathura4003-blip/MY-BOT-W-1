'use strict';

const {
  ADMIN_PASS,
  JWT_SECRET,
  OWNER_NUMBER,
  WORK_MODE,
  DASHBOARD_PORT,
  PORT,
} = require('../config');

const DEFAULT_SECRETS = new Set(['admin123', 'changeme123', 'secret_token_change_it']);

function getStartupWarnings() {
  const warnings = [];

  if (!OWNER_NUMBER || OWNER_NUMBER.length < 8) {
    warnings.push('OWNER_NUMBER is missing or invalid. Owner-only commands may fail.');
  }

  if (DEFAULT_SECRETS.has(ADMIN_PASS)) {
    warnings.push('ADMIN_PASS is still a default value. Change it before deploying publicly.');
  }

  if (DEFAULT_SECRETS.has(JWT_SECRET)) {
    warnings.push('JWT_SECRET is still a default value. Set a strong secret for production.');
  }

  if (WORK_MODE === 'public') {
    warnings.push('WORK_MODE is public. Anyone can interact with the bot unless blocked.');
  }

  if (DASHBOARD_PORT !== PORT) {
    warnings.push(`Dashboard running on ${DASHBOARD_PORT} while app port is ${PORT}. Verify your host mappings.`);
  }

  return warnings;
}

module.exports = { getStartupWarnings };

#!/usr/bin/env node
'use strict';

// Generate a bcrypt hash for ADMIN_PASS. Usage:
//
//   $ npm run hash-pass -- <plaintext-password>
//
// Drop the printed hash straight into the deployment env's ADMIN_PASS
// variable. The dashboard auto-detects bcrypt hashes (`$2a$` / `$2b$` /
// `$2y$`) and uses constant-time comparison; plain text still works for
// local dev.

const bcrypt = require('bcryptjs');

const plaintext = process.argv.slice(2).join(' ').trim();
if (!plaintext) {
    process.stderr.write('Usage: npm run hash-pass -- <plaintext-password>\n');
    process.exit(1);
}

const rounds = Number(process.env.BCRYPT_ROUNDS) || 12;
const hash = bcrypt.hashSync(plaintext, rounds);
process.stdout.write(hash + '\n');

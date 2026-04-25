#!/usr/bin/env node
'use strict';

// Quick `node --check` walker that mirrors what CI does without pulling
// in eslint. It traverses the repo (excluding node_modules / sessions / etc.)
// and parses every `.js` file.
//
//   $ npm run syntax-check
//
// Exit code is non-zero if any file fails to parse.

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set([
    'node_modules',
    '.git',
    '.github',
    'session',
    'sessions',
    'downloads',
    'attachments',
    'work',
    '.devin',
    '.agents',
    '.claude',
    '.cursor',
]);

function* walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (SKIP_DIRS.has(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            yield* walk(full);
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
            yield full;
        }
    }
}

let failures = 0;
let total = 0;
for (const file of walk(ROOT)) {
    total += 1;
    try {
        execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
    } catch (err) {
        failures += 1;
        const stderr = err.stderr ? err.stderr.toString() : err.message;
        process.stderr.write(`✗ ${path.relative(ROOT, file)}\n${stderr}\n`);
    }
}

if (failures) {
    process.stderr.write(`\nSyntax check failed: ${failures}/${total} files have errors.\n`);
    process.exit(1);
}

process.stdout.write(`Syntax check OK — ${total} JS files parsed cleanly.\n`);

'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { CommandService } = require('../core/services/command-service');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cmd-service-'));
const file = path.join(tmp, 'commands.json');

const logger = { log() {} };
const service = new CommandService(file, logger);

service.upsert({
  name: 'ping',
  aliases: ['p'],
  response: 'pong',
  cooldownSec: 1,
  permission: 'user',
  category: 'system',
});

const match = service.match('.', '.ping hello');
assert(match, 'Expected command match');
assert.equal(match.command.name, 'ping');
assert.deepEqual(match.args, ['hello']);

const first = service.checkCooldown('ping', 'u1', 1);
const second = service.checkCooldown('ping', 'u1', 1);
assert.equal(first, null, 'First cooldown call should pass');
assert(second >= 1, 'Second cooldown call should return wait time');

assert.equal(service.checkPermission({ permission: 'admin' }, { isAdmin: false, isOwner: false }), false);
assert.equal(service.checkPermission({ permission: 'admin' }, { isAdmin: true, isOwner: false }), true);

console.log('command-service.test passed');

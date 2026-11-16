const test = require('node:test');
const assert = require('node:assert/strict');
const { emitToUser } = require('../utils/notify');

test('notify utils', async (t) => {
  await t.test('emitToUser emits to user room', () => {
    const calls = [];
    const io = { to: (room) => ({ emit: (event, payload) => calls.push({ room, event, payload }) }) };
    emitToUser(io, '507f1f77bcf86cd799439011', 'notification:new', { ok: true });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].room, 'user:507f1f77bcf86cd799439011');
    assert.equal(calls[0].event, 'notification:new');
  });

  await t.test('emitToUser no-ops without io/user', () => {
    assert.doesNotThrow(() => emitToUser(null, 'x', 'e', {}));
    assert.doesNotThrow(() => emitToUser({}, null, 'e', {}));
  });
});

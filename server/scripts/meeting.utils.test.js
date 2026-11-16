const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { normalizeCode, codeFromId, canJoinScheduled, meetingForClient } = require('../utils/meeting');

test('meeting utils', async (t) => {
  await t.test('normalize/codeFromId', () => {
    assert.equal(normalizeCode('  abc  '), 'abc');
    assert.equal(normalizeCode(null), '');
    const id = new mongoose.Types.ObjectId();
    assert.equal(codeFromId(id), id.toString());
  });

  await t.test('canJoinScheduled', () => {
    const now = new Date('2026-01-01T12:00:00Z');
    assert.equal(canJoinScheduled({ type: 'instant' }, now), true);
    assert.equal(canJoinScheduled({ type: 'scheduled', startsAt: '2026-01-01T11:59:00Z', status: 'scheduled' }, now), true);
    assert.equal(canJoinScheduled({ type: 'scheduled', startsAt: '2026-01-01T12:01:00Z', status: 'scheduled' }, now), false);
    assert.equal(canJoinScheduled({ type: 'scheduled', startsAt: '2026-01-01T11:00:00Z', status: 'ended' }, now), false);
  });

  await t.test('meetingForClient', () => {
    const id = new mongoose.Types.ObjectId();
    const host = new mongoose.Types.ObjectId();
    const out = meetingForClient({
      _id: id,
      type: 'scheduled',
      title: 'T',
      code: 'abc',
      hostId: host,
      status: 'scheduled',
      startsAt: new Date('2026-01-01T00:00:00Z'),
      endsAt: null,
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-01T00:00:00Z'),
    });
    assert.equal(out._id, id.toString());
    assert.equal(out.code, 'abc');
    assert.equal(out.hostId, host.toString());
    assert.equal(out.endsAt, null);
    assert.equal(meetingForClient(null), null);
  });
});

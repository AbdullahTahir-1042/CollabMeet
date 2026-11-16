const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { toId, isId, participantKey, isParticipant, otherParticipantId, safeUser, dmForClient, dmMessageForClient } = require('../utils/dm');

test('dm utils', async (t) => {
  const oid = (s = '507f1f77bcf86cd799439011') => new mongoose.Types.ObjectId(s);
  const a = oid('507f1f77bcf86cd799439011');
  const b = oid('507f1f77bcf86cd799439012');

  await t.test('toId/isId/participantKey', () => {
    assert.equal(toId(a), a.toString());
    assert.equal(toId({ _id: a }), a.toString());
    assert.equal(toId(null), '');
    assert.equal(isId(a.toString()), true);
    assert.equal(isId('nope'), false);
    assert.equal(participantKey(b, a), `${a.toString()}:${b.toString()}`);
  });

  await t.test('participants and safeUser', () => {
    const thread = { participantIds: [a, b], requestedBy: a, requestFor: b, status: 'pending' };
    assert.equal(isParticipant(thread, a), true);
    assert.equal(isParticipant(thread, oid('507f1f77bcf86cd799439099')), false);
    assert.equal(otherParticipantId(thread, a), b.toString());
    assert.deepEqual(safeUser({ _id: a, name: 'N', email: 'e', password: 'x' }), { _id: a.toString(), name: 'N', email: 'e' });
    assert.equal(safeUser(null), null);
  });

  await t.test('dmForClient pending requester hides read receipts and keeps preview', () => {
    const thread = {
      _id: oid('507f1f77bcf86cd799439021'),
      status: 'pending',
      requestedBy: a,
      requestFor: b,
      participantIds: [{ _id: a, name: 'A', email: 'a@x' }, { _id: b, name: 'B', email: 'b@x' }],
      lastMessageText: 'hi',
      lastMessageAt: new Date('2026-01-01T00:00:00Z'),
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    };
    const out = dmForClient(thread, a);
    assert.equal(out.status, 'pending');
    assert.equal(out.isRequester, true);
    assert.equal(out.canSeeReadReceipts, false);
    assert.equal(out.otherUser?._id, b.toString());
    assert.equal(out.lastMessageText, 'hi');
  });

  await t.test('dmForClient active allows read receipts', () => {
    const thread = { _id: oid(), status: 'active', requestedBy: a, requestFor: b, participantIds: [a, b], lastMessageText: 'x' };
    assert.equal(dmForClient(thread, a).canSeeReadReceipts, true);
  });

  await t.test('dmMessageForClient hides read state when not active', () => {
    const msg = { _id: oid(), threadId: oid(), senderId: a, text: 't', createdAt: new Date(), readBy: [b] };
    const pending = dmMessageForClient(msg, { status: 'pending' }, a);
    assert.deepEqual(pending.readBy, []);
    assert.equal(pending.read, false);
    const active = dmMessageForClient(msg, { status: 'active' }, a);
    assert.deepEqual(active.readBy, [b.toString()]);
    assert.equal(active.read, true);
  });
});

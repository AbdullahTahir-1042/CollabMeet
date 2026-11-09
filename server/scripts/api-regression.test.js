/**
 * API regression tests for CollabMeet.
 * Prereqs: server running (default http://localhost:5000/api) + MongoDB reachable by server.
 * Run: npm run test:api
 */
const test = require('node:test');
const assert = require('node:assert/strict');

const base = (process.env.API_BASE || 'http://localhost:5000/api').replace(/\/$/, '');
const run = `${Date.now()}${Math.floor(Math.random() * 1000)}`;

async function j(method, path, body, token) {
  const r = await fetch(base + path, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: r.status, data };
}

async function register(firstName, lastName) {
  const email = `${firstName.toLowerCase()}.${run}.${Math.random().toString(36).slice(2, 6)}@collabmeet-test.local`;
  const res = await j('POST', '/auth/register', { firstName, lastName, email, password: 'Pass123!', confirmPassword: 'Pass123!' });
  assert.equal(res.status, 201, `register failed: ${JSON.stringify(res.data)}`);
  assert.ok(res.data?.token, 'register should return token');
  assert.ok(res.data?.result?._id, 'register should return user');
  return { token: res.data.token, user: res.data.result, email };
}

test('CollabMeet API regressions', async (t) => {
  let serverUp = false;
  try {
    const health = await fetch(base.replace(/\/api$/, '/') || 'http://localhost:5000/');
    serverUp = health.ok;
  } catch {}
  if (!serverUp) {
    t.skip(`Server not reachable at ${base}. Start server + MongoDB, then run npm run test:api`);
    return;
  }

  await t.test('auth guards reject unauthenticated requests', async () => {
    for (const [method, path] of [['GET', '/users/search?q=ab'], ['GET', '/notifications'], ['POST', '/meetings/instant'], ['GET', '/dms']]) {
      const res = await j(method, path, method === 'POST' ? {} : undefined);
      assert.equal(res.status, 401, `${method} ${path} expected 401, got ${res.status}`);
    }
  });

  let a, b;
  await t.test('auth register/login/validation', async () => {
    a = await register('Alpha', 'Tester');
    b = await register('Beta', 'Tester');
    const login = await j('POST', '/auth/login', { email: a.email, password: 'Pass123!' });
    assert.equal(login.status, 200);
    assert.ok(login.data?.token);
    const badPw = await j('POST', '/auth/login', { email: a.email, password: 'wrong' });
    assert.equal(badPw.status, 400);
    const dup = await j('POST', '/auth/register', { firstName: 'Alpha', lastName: 'Tester', email: a.email, password: 'Pass123!', confirmPassword: 'Pass123!' });
    assert.equal(dup.status, 409);
  });

  await t.test('user search requires auth and returns matches', async () => {
    const res = await j('GET', `/users/search?q=${encodeURIComponent(b.user.name.slice(0, 4))}`, null, a.token);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data));
  });

  await t.test('DM request flow: pending privacy, decline silent, resend, accept', async () => {
    const start = await j('POST', '/dms/start', { recipientId: b.user._id, text: 'Hi Beta, first request' }, a.token);
    assert.equal(start.status, 201);
    assert.equal(start.data?.thread?.status, 'pending');
    assert.equal(start.data?.thread?.isRequester, true);
    const threadId = start.data.thread._id;

    const followUp = await j('POST', `/dms/${threadId}/messages`, { text: 'Follow up while pending' }, a.token);
    assert.equal(followUp.status, 201);
    assert.equal(followUp.data?.thread?.status, 'pending');

    const requests = await j('GET', '/dms/requests', null, b.token);
    assert.equal(requests.status, 200);
    assert.ok(requests.data.some((d) => d._id === threadId));

    const bMsgs = await j('GET', `/dms/${threadId}/messages`, null, b.token);
    assert.equal(bMsgs.status, 200);
    assert.equal(bMsgs.data?.thread?.canSeeReadReceipts, false);
    assert.ok((bMsgs.data?.messages?.length || 0) >= 2);

    const bReply = await j('POST', `/dms/${threadId}/messages`, { text: 'reply before accept' }, b.token);
    assert.equal(bReply.status, 409);

    const aMsgs = await j('GET', `/dms/${threadId}/messages`, null, a.token);
    assert.equal(aMsgs.status, 200);
    assert.equal(aMsgs.data?.thread?.canSeeReadReceipts, false);

    const decline = await j('POST', `/dms/${threadId}/decline`, null, b.token);
    assert.equal(decline.status, 200);
    assert.equal(decline.data?.thread?.status, 'declined');

    const notifsAfterDecline = await j('GET', '/notifications', null, a.token);
    assert.equal(notifsAfterDecline.status, 200);
    assert.ok(!notifsAfterDecline.data.some((n) => n.type === 'dm_accepted' && n.data?.threadId === threadId), 'decline must be silent to sender');

    const resend = await j('POST', '/dms/start', { recipientId: b.user._id, text: 'Trying again after decline' }, a.token);
    assert.equal(resend.status, 201);
    assert.equal(resend.data?.thread?.status, 'pending');
    assert.equal(resend.data?.thread?._id, threadId);

    const accept = await j('POST', `/dms/${threadId}/accept`, null, b.token);
    assert.equal(accept.status, 200);
    assert.equal(accept.data?.thread?.status, 'active');

    const activeSend = await j('POST', `/dms/${threadId}/messages`, { text: 'Accepted, hello' }, b.token);
    assert.equal(activeSend.status, 201);
    assert.equal(activeSend.data?.thread?.status, 'active');

    const notifs = await j('GET', '/notifications', null, a.token);
    assert.equal(notifs.status, 200);
    assert.ok(notifs.data.some((n) => n.type === 'dm_accepted'), 'accept should notify requester');

    const outsider = await register('Gamma', 'Tester');
    const forbidden = await j('GET', `/dms/${threadId}/messages`, null, outsider.token);
    assert.equal(forbidden.status, 403);
  });

  await t.test('meetings: instant/scheduled, gating, chat, end deletes chat; legacy retired', async () => {
    const inst = await j('POST', '/meetings/instant', { title: `Instant ${run}` }, a.token);
    assert.equal(inst.status, 201);
    assert.equal(inst.data?.type, 'instant');
    assert.equal(inst.data?.status, 'live');
    assert.ok(inst.data?.code);
    const code = inst.data.code;

    const getI = await j('GET', `/meetings/${code}`, null, b.token);
    assert.equal(getI.status, 200);
    assert.equal(getI.data?.canJoin, true);
    const joinI = await j('POST', `/meetings/${code}/join`, null, b.token);
    assert.equal(joinI.status, 200);

    const m1 = await j('POST', `/meetings/${code}/messages`, { text: 'Meeting hello' }, a.token);
    const m2 = await j('POST', `/meetings/${code}/messages`, { text: 'Meeting reply' }, b.token);
    assert.equal(m1.status, 201);
    assert.equal(m2.status, 201);
    const list = await j('GET', `/meetings/${code}/messages`, null, a.token);
    assert.equal(list.status, 200);
    assert.equal(list.data.length, 2);

    const dms = await j('GET', '/dms', null, a.token);
    assert.equal(dms.status, 200);
    assert.ok(!dms.data.some((d) => (d.lastMessageText || '').includes('Meeting hello')), 'meeting chat must not create DM');

    const end = await j('POST', `/meetings/${code}/end`, null, a.token);
    assert.equal(end.status, 200);
    assert.equal(end.data?.status, 'ended');
    const afterEnd = await j('GET', `/meetings/${code}/messages`, null, a.token);
    assert.equal(afterEnd.status, 200);
    assert.deepEqual(afterEnd.data, []);

    const past = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const badPast = await j('POST', '/meetings/scheduled', { title: 'Past', startsAt: past }, a.token);
    assert.equal(badPast.status, 400);

    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const sch = await j('POST', '/meetings/scheduled', { title: 'Future', startsAt: future }, a.token);
    assert.equal(sch.status, 201);
    assert.equal(sch.data?.status, 'scheduled');
    const getS = await j('GET', `/meetings/${sch.data.code}`, null, b.token);
    assert.equal(getS.data?.canJoin, false);
    const joinS = await j('POST', `/meetings/${sch.data.code}/join`, null, b.token);
    assert.equal(joinS.status, 403);

    const soon = await j('POST', '/meetings/scheduled', { title: 'Soon', startsAt: new Date(Date.now() + 1500).toISOString() }, a.token);
    assert.equal(soon.status, 201);
    await new Promise((r) => setTimeout(r, 1800));
    const getSoon = await j('GET', `/meetings/${soon.data.code}`, null, b.token);
    const joinSoon = await j('POST', `/meetings/${soon.data.code}/join`, null, b.token);
    assert.equal(getSoon.data?.canJoin, true);
    assert.equal(joinSoon.status, 200);
    assert.equal(joinSoon.data?.status, 'live');

    const legacyC = await j('GET', '/conversations', null, a.token);
    const legacyM = await j('POST', '/messages', { message: 'x', convoId: 'x' }, a.token);
    assert.equal(legacyC.status, 200);
    assert.deepEqual(legacyC.data, []);
    assert.equal(legacyM.status, 410);

    const unauth = await j('GET', `/meetings/${code}`, null, null);
    assert.equal(unauth.status, 401);
  });
});

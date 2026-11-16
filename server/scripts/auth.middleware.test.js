const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const jwt = require('jsonwebtoken');

function fresh(modulePath) {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

test('auth middleware', async (t) => {
  const secret = 'test-secret';
  process.env.JWT_SECRET = secret;
  const auth = fresh(path.join(__dirname, '../middleware/auth'));

  const mkRes = () => {
    const r = { statusCode: 200, body: null };
    r.status = (c) => { r.statusCode = c; return r; };
    r.json = (b) => { r.body = b; return r; };
    return r;
  };

  await t.test('rejects missing token', () => {
    const req = { headers: {} };
    const res = mkRes();
    let nextCalled = false;
    auth(req, res, () => { nextCalled = true; });
    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
  });

  await t.test('rejects invalid token', () => {
    const req = { headers: { authorization: 'Bearer bad' } };
    const res = mkRes();
    auth(req, res, () => assert.fail('next called'));
    assert.equal(res.statusCode, 401);
  });

  await t.test('accepts valid token and sets userId', () => {
    const token = jwt.sign({ id: 'user123', email: 'a@b.c' }, secret, { expiresIn: '1h' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mkRes();
    let nextCalled = false;
    auth(req, res, () => { nextCalled = true; });
    assert.equal(nextCalled, true);
    assert.equal(req.userId, 'user123');
  });
});

test('socket auth middleware', async (t) => {
  const secret = 'test-secret-socket';
  process.env.JWT_SECRET = secret;
  const socketAuth = fresh(path.join(__dirname, '../middleware/socketAuth'));

  await t.test('rejects missing token', () => {
    let err = null;
    socketAuth({ handshake: { auth: {}, headers: {} } }, (e) => { err = e; });
    assert.ok(err);
  });

  await t.test('accepts valid token', () => {
    const token = jwt.sign({ id: 'sock-user' }, secret, { expiresIn: '1h' });
    const socket = { handshake: { auth: { token }, headers: {} } };
    let err = 'unset';
    socketAuth(socket, (e) => { err = e; });
    assert.equal(err, undefined);
    assert.equal(socket.userId, 'sock-user');
  });
});

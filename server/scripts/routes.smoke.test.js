const test = require('node:test');
const assert = require('node:assert/strict');

test('route modules export express routers', async (t) => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test';
  for (const mod of ['../routes/auth', '../routes/users', '../routes/dms', '../routes/meetings', '../routes/notifications', '../routes/conversation', '../routes/message']) {
    await t.test(mod, () => {
      const router = require(mod);
      assert.equal(typeof router, 'function');
      assert.ok(router.stack || router.handle, 'expected router middleware');
    });
  }
});
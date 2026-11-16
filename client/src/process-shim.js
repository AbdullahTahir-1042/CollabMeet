/* eslint-disable no-undef, no-restricted-globals */
(function () {
  var g = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this);
  if (typeof g.global === 'undefined') g.global = g;
  if (!g.process) g.process = {};
  if (!g.process.env) g.process.env = {};
  if (typeof g.process.env.NODE_ENV === 'undefined') g.process.env.NODE_ENV = 'development';
  g.process.browser = true;
  if (typeof g.process.version === 'undefined') g.process.version = '';
  g.process.nextTick = function (cb) {
    if (typeof cb !== 'function') throw new TypeError('callback must be a function');
    var len = arguments.length;
    var args = len > 1 ? Array.prototype.slice.call(arguments, 1) : [];
    Promise.resolve().then(function () { cb.apply(null, args); });
  };
  try { if (typeof g.Buffer === 'undefined') g.Buffer = require('buffer/').Buffer; } catch (e) {
    try { if (typeof g.Buffer === 'undefined') g.Buffer = require('buffer').Buffer; } catch (e2) {}
  }
})();

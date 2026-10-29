import test from 'node:test';
import assert from 'node:assert/strict';
import { rotationDegrees } from '../build/scripts/kinetic/rotation.js';
import { Sessions } from '../build/scripts/multiplayer/sessions.js';
test('rotation preserves units and wraps both directions', () => {
  assert.equal(rotationDegrees(60, 0.25), 90);
  assert.equal(rotationDegrees(-60, 0.25), 270);
  assert.equal(rotationDegrees(30, 2), 0);
  assert.equal(rotationDegrees(0, 100), 0);
});
test('rotation rejects invalid input instead of propagating NaN', () => {
  for (const [rpm, seconds] of [[NaN, 1], [Infinity, 1], [1, -1], [1, Infinity]]) {
    assert.throws(() => rotationDegrees(rpm, seconds), RangeError);
  }
});
test('sessions isolate players and reject duplicate UI requests', () => {
  const sessions = new Sessions();
  const a = sessions.acquire('a');
  assert.ok(a);
  assert.equal(sessions.acquire('a'), undefined);
  assert.ok(sessions.acquire('b'));
  sessions.release('a', a);
  assert.ok(sessions.acquire('a'));
});
test('stale asynchronous completion cannot clear a reconnected session', () => {
  const sessions = new Sessions();
  const old = sessions.acquire('a');
  sessions.clear('a');
  const current = sessions.acquire('a');
  sessions.release('a', old);
  assert.equal(sessions.acquire('a'), undefined);
  sessions.release('a', current);
  assert.ok(sessions.acquire('a'));
});

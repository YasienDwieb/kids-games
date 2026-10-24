import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createQueue } from '../studio/queue.mjs';

/** A fake player: each play() waits until the test finishes it (or stop() cuts it off). */
function harness() {
  const played = [];
  let pending = null;
  const q = createQueue({
    play: (item) => {
      played.push(item);
      return new Promise((resolve) => (pending = resolve));
    },
    stop: () => pending?.(false),
    gap: () => Promise.resolve(),
  });
  const tick = () => new Promise((r) => setTimeout(r, 0));
  const finish = async () => {
    pending?.(true);
    await tick();
  };
  return { q, played, finish, tick };
}

test('plays the list in order, once, then stops', async () => {
  const { q, played, finish, tick } = harness();
  q.start(['a', 'b', 'c']);
  await tick();
  await finish();
  await finish();
  await finish();
  assert.deepEqual(played, ['a', 'b', 'c']);
  assert.equal(q.running, false);
});

test('next during a clip moves exactly one clip on', async () => {
  const { q, played, tick } = harness();
  q.start(['a', 'b', 'c', 'd']);
  await tick();
  q.next();
  await tick();
  assert.deepEqual(played, ['a', 'b']);
});

test('next on the second-to-last clip still plays the last one', async () => {
  const { q, played, finish, tick } = harness();
  q.start(['a', 'b', 'c']);
  await tick();
  await finish();
  q.next();
  await tick();
  assert.deepEqual(played, ['a', 'b', 'c']);
  assert.equal(q.running, true);
});

test('prev goes back one clip', async () => {
  const { q, played, finish, tick } = harness();
  q.start(['a', 'b', 'c']);
  await tick();
  await finish();
  q.prev();
  await tick();
  assert.deepEqual(played, ['a', 'b', 'a']);
});

test('pause then resume continues with a single loop', async () => {
  const { q, played, finish, tick } = harness();
  q.start(['a', 'b', 'c']);
  await tick();
  q.toggle(() => []); // pause
  assert.equal(q.running, false);
  await tick();
  q.toggle(() => []); // resume at the same clip
  await tick();
  await finish();
  await finish();
  assert.deepEqual(played, ['a', 'a', 'b', 'c']);
});

test('playing something else ends the queue (no stuck loop)', async () => {
  const { q, played, finish, tick } = harness();
  q.start(['a', 'b']);
  await tick();
  q.stop();
  await finish();
  await tick();
  assert.deepEqual(played, ['a']);
  assert.equal(q.running, false);
});

test('start replaces a running queue', async () => {
  const { q, played, finish, tick } = harness();
  q.start(['a', 'b']);
  await tick();
  q.start(['x', 'y']);
  await tick();
  await finish();
  await finish();
  assert.deepEqual(played, ['a', 'x', 'y']);
});

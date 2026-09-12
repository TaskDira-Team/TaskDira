import test from 'node:test';
import assert from 'node:assert/strict';
import { initialDemo, completeQuest, redeemReward, validDemo, balance, earnedPoints } from './demoState.js';

test('rapid duplicate quest completion awards points once', () => {
  const first = completeQuest(initialDemo(), 'dishes');
  assert.equal(balance(first), 210);
  assert.equal(completeQuest(first, 'dishes'), first);
  assert.equal(completeQuest(first, 'unknown'), first);
});
test('an unaffordable reward cannot be claimed', () => {
  const state = initialDemo();
  assert.equal(redeemReward(state, 'pizza'), state);
  assert.equal(balance(state), 180);
});
test('rewards deduct exactly once while earned experience is preserved', () => {
  const state = completeQuest(completeQuest(initialDemo(), 'dishes'), 'laundry');
  const claimed = redeemReward(state, 'pizza');
  assert.equal(balance(claimed), 0);
  assert.equal(earnedPoints(claimed), 70);
  assert.equal(redeemReward(claimed, 'pizza'), claimed);
  assert.equal(redeemReward(claimed, 'movie'), claimed);
});
test('saved progress survives a JSON round trip', () => {
  const state = redeemReward(completeQuest(initialDemo(), 'plants'), 'movie');
  assert.deepEqual(validDemo(JSON.parse(JSON.stringify(state))), state);
  assert.equal(balance(state), 105);
});
test('corrupt storage is sanitized without inventing points or debt', () => {
  for (const value of [null, false, 'bad', {}, { completed: 3, redeemed: [] }]) assert.deepEqual(validDemo(value), initialDemo());
  assert.deepEqual(validDemo({ completed: ['dishes', 'dishes', 'bad'], redeemed: [] }), { completed: ['dishes'], redeemed: [] });
  assert.deepEqual(validDemo({ completed: [], redeemed: ['pizza', 'movie'] }), initialDemo());
});

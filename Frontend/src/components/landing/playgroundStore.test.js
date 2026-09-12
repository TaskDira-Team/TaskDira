import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlaygroundStore } from './playgroundStore.js';
import { balance, completeQuest, initialDemo, redeemReward } from './demoState.js';

test('house and playground subscribers share points, rewards and reset immediately', () => {
  let persisted = null;
  const store = createPlaygroundStore({ getItem: () => persisted, setItem: (_, raw) => { persisted = raw; }, events: new EventTarget() });
  const house = [], playground = [];
  const unsubscribe = store.subscribe(() => house.push(balance(store.current())));
  store.subscribe(() => playground.push(balance(store.current())));
  store.update(current => completeQuest(current, 'dishes'));
  store.update(current => completeQuest(current, 'plants'));
  store.update(current => completeQuest(current, 'laundry'));
  store.update(current => redeemReward(current, 'pizza'));
  assert.deepEqual(house, [210, 235, 275, 25]);
  assert.deepEqual(playground, house);
  unsubscribe();
  store.update(initialDemo());
  assert.equal(playground.at(-1), 180);
  assert.equal(house.at(-1), 25);
});
test('two controls completing the same chore cannot double-award points', () => {
  let persisted = null;
  const store = createPlaygroundStore({ getItem: () => persisted, setItem: (_, raw) => { persisted = raw; }, events: new EventTarget() });
  store.update(current => completeQuest(current, 'plants'));
  store.update(current => completeQuest(current, 'plants'));
  assert.equal(balance(store.current()), 205);
  assert.deepEqual(store.current().completed, ['plants']);
});
test('corrupt storage and blocked writes still allow session progress', () => {
  const store = createPlaygroundStore({ getItem: () => '{broken', setItem: () => { throw new Error('quota'); }, events: new EventTarget() });
  assert.deepEqual(store.current(), initialDemo());
  store.update(current => completeQuest(current, 'dishes'));
  store.update(current => completeQuest(current, 'plants'));
  assert.equal(balance(store.current()), 235);
});

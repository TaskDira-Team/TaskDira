import test from 'node:test';
import assert from 'node:assert/strict';
import { savedChoresKey, parseSavedChores, toggleSavedChore } from './savedChores.js';

test('bookmarks are isolated by user and household, including separator characters', () => {
  assert.notEqual(savedChoresKey('a:b', 'c'), savedChoresKey('a', 'b:c'));
  assert.notEqual(savedChoresKey(1, 4), savedChoresKey(2, 4));
  assert.notEqual(savedChoresKey(1, 4), savedChoresKey(1, 5));
  assert.equal(savedChoresKey(null, 4), null);
  assert.equal(savedChoresKey(1, undefined), null);
});
test('invalid persisted data is discarded; numeric and string IDs normalize', () => {
  assert.deepEqual(parseSavedChores('{bad'), []);
  assert.deepEqual(parseSavedChores('{"admin":true}'), []);
  assert.deepEqual(parseSavedChores('[1,"1",null,{},"dishes",false]'), ['1', 'dishes']);
});
test('saving and removing survive a storage round trip without changing chores', () => {
  const original = ['1'];
  const saved = toggleSavedChore(original, 2);
  assert.deepEqual(original, ['1']);
  assert.deepEqual(parseSavedChores(JSON.stringify(saved)), ['1', '2']);
  assert.deepEqual(toggleSavedChore(saved, 1), ['2']);
});

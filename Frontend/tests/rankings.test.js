import test from 'node:test';
import assert from 'node:assert/strict';
import { store, hydrateHouseholdMembers, ensureLedgerEntry } from '../src/services/store.js';

const entry = (id, points) => ({ user: { id, fullName: `Fixture ${id}` }, role: 'Member', points, balance: points });

test('authoritative solo roster excludes stale cached members and earns rank 1 of 1', () => {
  store.activeHouseholdId = 900;
  store.members = [{ householdId: 900, userId: 1 }, { householdId: 901, userId: 3 }];
  store.pointsLedger = [];
  ensureLedgerEntry(1, 900).totalPoints = 100;
  ensureLedgerEntry(3, 901).totalPoints = 200;
  const users = hydrateHouseholdMembers([entry(2, 0)]);
  assert.equal(users.length, 1);
  assert.equal(ensureLedgerEntry(2, 900).rank, 1);
  assert.deepEqual(store.members.filter(m => m.householdId === 900).map(m => m.userId), [2]);
  assert.equal(store.pointsLedger.some(l => l.householdId === 900 && l.userId === 1), false);
  assert.equal(ensureLedgerEntry(3, 901).totalPoints, 200);
});

test('ties, roster reorder, removal and empty households produce contiguous participant ranks', () => {
  store.activeHouseholdId = 902;
  for (const roster of [[entry(12, 25), entry(2, 25), entry(3, 50)], [entry(3, 50), entry(2, 25), entry(12, 25)]]) {
    hydrateHouseholdMembers(roster);
    assert.deepEqual([3, 2, 12].map(id => ensureLedgerEntry(id, 902).rank), [1, 2, 3]);
  }
  hydrateHouseholdMembers([entry(12, 25)]);
  assert.equal(ensureLedgerEntry(12, 902).rank, 1);
  hydrateHouseholdMembers([]);
  assert.equal(store.pointsLedger.filter(l => l.householdId === 902).length, 0);
  assert.equal(store.members.filter(m => m.householdId === 902).length, 0);
});

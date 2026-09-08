import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseVoice, activeTourSection } from './tourContent.js';
test('narration only uses a matching language and prefers local voices', () => {
  const remote = { lang: 'en-US', localService: false };
  const local = { lang: 'en-GB', localService: true };
  const hebrew = { lang: 'he-IL', localService: true };
  assert.equal(chooseVoice([remote, local, hebrew], 'en'), local);
  assert.equal(chooseVoice([remote, local], 'he'), null);
  assert.equal(chooseVoice([remote, hebrew], 'he'), hebrew);
  assert.equal(chooseVoice([], 'en'), null);
});
test('scroll narration follows the last section crossing the reading line', () => {
  assert.equal(activeTourSection([{ top: -1000 }, { top: -50 }, { top: 600 }], 350), 1);
  assert.equal(activeTourSection([{ top: 0 }, { top: 350 }, { top: 800 }], 350), 1);
  assert.equal(activeTourSection([{ top: 500 }, { top: Infinity }], 350), 0);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { PROFILE_BADGES, BADGE_TRANSLATIONS, resolveAvatarConfig, getProfileBadge } from '../src/data/avatars.js';

test('every saved badge ID resolves to a stable key with Hebrew and English labels', () => {
  for (const badge of PROFILE_BADGES) {
    const saved = { profileBadgeId: badge.id, baseIconId: 'fox', customField: 'preserved' };
    const resolved = resolveAvatarConfig(saved);
    assert.equal(resolved.profileBadgeId, badge.id);
    assert.equal(resolved.profileBadgeKey, badge.labelKey);
    assert.equal(BADGE_TRANSLATIONS.he[resolved.profileBadgeKey], badge.label);
    assert.equal(BADGE_TRANSLATIONS.en[resolved.profileBadgeKey], badge.labelEn);
    assert.equal(/[\u0590-\u05ff]/.test(badge.labelEn), false);
    assert.equal(resolved.customField, 'preserved');
    assert.deepEqual(saved, { profileBadgeId: badge.id, baseIconId: 'fox', customField: 'preserved' });
  }
});

test('legacy labels and new keys resolve without rewriting existing avatar JSON', () => {
  assert.equal(resolveAvatarConfig({ profileBadgeLabel: 'ציפור בוקר 🌅' }).profileBadgeId, 'early-bird');
  assert.equal(resolveAvatarConfig({ profileBadgeKey: 'badge.night-owl' }).profileBadgeId, 'night-owl');
  assert.equal(resolveAvatarConfig({ profileBadgeId: 'pet-lover', profileBadgeLabel: 'ציפור בוקר 🌅' }).profileBadgeId, 'pet-lover');
  assert.equal(getProfileBadge('invalid').id, 'home-hero');
  assert.equal(resolveAvatarConfig(null).profileBadgeId, 'home-hero');
});

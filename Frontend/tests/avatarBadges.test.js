import test from 'node:test';
import assert from 'node:assert/strict';
import { PROFILE_BADGES, BADGE_TRANSLATIONS, resolveAvatarConfig, getProfileBadge } from '../src/data/avatars.js';
import { AVATAR_ICONS, RING_COLORS, AVATAR_TRANSLATIONS } from '../src/data/avatars.js';
import { STICKER_PRESETS } from '../src/data/stickers.js';

test('every avatar icon, ring, sticker, badge and custom image has stable bilingual labels', () => {
  const keys = [...AVATAR_ICONS, ...RING_COLORS, ...STICKER_PRESETS, ...PROFILE_BADGES].map(item => item.labelKey);
  assert.equal(new Set(keys).size, keys.length);
  for (const key of [...keys, 'avatar.customLabel']) {
    assert.ok(AVATAR_TRANSLATIONS.he[key], `Missing Hebrew ${key}`);
    assert.ok(AVATAR_TRANSLATIONS.en[key], `Missing English ${key}`);
    assert.equal(/[\u0590-\u05ff]/.test(AVATAR_TRANSLATIONS.en[key]), false);
  }
  for (const sticker of STICKER_PRESETS) {
    const resolved = resolveAvatarConfig({ avatarType: 'sticker', stickerId: sticker.id });
    assert.equal(resolved.iconLabelKey, sticker.labelKey);
  }
  assert.equal(resolveAvatarConfig({ avatarType: 'custom', customImageData: 'data:image/png;base64,fixture' }).iconLabelKey, 'avatar.customLabel');
  assert.equal(resolveAvatarConfig({ baseIconId: 'fox', ringColorId: 'rose-pink' }).iconLabelKey, 'avatar.icon.fox');
  assert.equal(resolveAvatarConfig({ ringColorId: 'rose-pink' }).ringLabelKey, 'avatar.ring.rose-pink');
});

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

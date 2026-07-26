import { ALLOWED_AVATAR_MIMES, MAX_AVATAR_UPLOAD_BYTES } from '../data/stickers';

export function validateAvatarUpload(file) {
  if (!file) throw new Error('לא נבחר קובץ');
  if (!ALLOWED_AVATAR_MIMES.includes(file.type)) {
    throw new Error('פורמט לא נתמך. השתמשו ב-PNG, JPG, GIF או WebP');
  }
  if (file.size > MAX_AVATAR_UPLOAD_BYTES) {
    throw new Error('הקובץ גדול מדי (מקסימום 2MB)');
  }
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    validateAvatarUpload(file);
    const reader = new FileReader();
    reader.onload = () => resolve({ dataUrl: reader.result, mimeType: file.type });
    reader.onerror = () => reject(new Error('שגיאה בקריאת הקובץ'));
    reader.readAsDataURL(file);
  });
}

export function buildCustomAvatarConfig(dataUrl, mimeType, ringColorId, profileBadgeId) {
  return {
    avatarType: 'custom',
    customImageData: dataUrl,
    customImageMime: mimeType,
    ringColorId: ringColorId || 'neon-blue',
    profileBadgeId: profileBadgeId || 'home-hero',
    baseIconId: null,
    stickerId: null,
  };
}

export function buildStickerAvatarConfig(stickerId, ringColorId, profileBadgeId) {
  return {
    avatarType: 'sticker',
    stickerId,
    ringColorId: ringColorId || 'neon-blue',
    profileBadgeId: profileBadgeId || 'home-hero',
    baseIconId: null,
    customImageData: null,
    customImageMime: null,
  };
}

export function buildEmojiAvatarConfig(baseIconId, ringColorId, profileBadgeId) {
  return {
    avatarType: 'emoji',
    baseIconId: baseIconId || 'lion',
    ringColorId: ringColorId || 'neon-blue',
    profileBadgeId: profileBadgeId || 'home-hero',
    stickerId: null,
    customImageData: null,
    customImageMime: null,
  };
}

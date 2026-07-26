import { readFileAsDataUrl } from './avatarService';

const MAX_PROOF_BYTES = 3 * 1024 * 1024;

export async function validateProofUpload(file) {
  if (!file) throw new Error('לא נבחר קובץ');
  const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.type)) {
    throw new Error('יש להעלות תמונה (PNG, JPG, WebP, GIF)');
  }
  if (file.size > MAX_PROOF_BYTES) {
    throw new Error('הקובץ גדול מדי (מקסימום 3MB)');
  }
  return readFileAsDataUrl(file);
}

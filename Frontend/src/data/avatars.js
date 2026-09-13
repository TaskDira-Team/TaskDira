import { AVATAR_TYPES, getStickerById } from './stickers.js';

export const AVATAR_ICONS = [
  { id: 'lion', emoji: '🦁', label: 'אריה' },
  { id: 'fox', emoji: '🦊', label: 'שועל' },
  { id: 'hero', emoji: '🦸‍♂️', label: 'גיבור' },
  { id: 'heroine', emoji: '🦸‍♀️', label: 'גיבורה' },
  { id: 'crown', emoji: '👑', label: 'מלך/ה' },
  { id: 'rocket', emoji: '🚀', label: 'טיל' },
  { id: 'wizard', emoji: '🧙', label: 'קוסם' },
  { id: 'unicorn', emoji: '🦄', label: 'חד-קרן' },
  { id: 'soccer', emoji: '⚽', label: 'כדורגל' },
  { id: 'panda', emoji: '🐼', label: 'פנדה' },
  { id: 'cat', emoji: '🐱', label: 'חתול' },
  { id: 'dog', emoji: '🐶', label: 'כלב' },
  { id: 'star', emoji: '⭐', label: 'כוכב' },
  { id: 'rainbow', emoji: '🌈', label: 'קשת' },
  { id: 'dragon', emoji: '🐉', label: 'דרקון' },
  { id: 'robot', emoji: '🤖', label: 'רובוט' },
];

export const RING_COLORS = [
  {
    id: 'neon-blue',
    label: 'Neon Blue',
    labelHe: 'כחול ניאון',
    ring: 'ring-4 ring-cyan-400 shadow-lg shadow-cyan-300/50 avatar-glow-cyan',
    bg: 'bg-gradient-to-br from-cyan-400 to-blue-600',
  },
  {
    id: 'sunset-gold',
    label: 'Sunset Gold',
    labelHe: 'זהב שקיעה',
    ring: 'ring-4 ring-amber-400 shadow-lg shadow-amber-300/50 avatar-glow-yellow',
    bg: 'bg-gradient-to-br from-amber-400 to-orange-500',
  },
  {
    id: 'emerald-green',
    label: 'Emerald Green',
    labelHe: 'ירוק אמרלד',
    ring: 'ring-4 ring-emerald-400 shadow-lg shadow-emerald-300/50',
    bg: 'bg-gradient-to-br from-emerald-400 to-green-600',
  },
  {
    id: 'purple-flame',
    label: 'Purple Flame',
    labelHe: 'להבה סגולה',
    ring: 'ring-4 ring-purple-400 shadow-lg shadow-purple-300/50 avatar-glow-purple',
    bg: 'bg-gradient-to-br from-purple-500 to-fuchsia-600',
  },
  {
    id: 'rose-pink',
    label: 'Rose Pink',
    labelHe: 'ורוד',
    ring: 'ring-4 ring-rose-400 shadow-lg shadow-rose-300/50',
    bg: 'bg-gradient-to-br from-rose-400 to-pink-600',
  },
  {
    id: 'slate-cool',
    label: 'Cool Slate',
    labelHe: 'אפור קר',
    ring: 'ring-3 ring-slate-400 shadow-md',
    bg: 'bg-gradient-to-br from-slate-400 to-slate-600',
  },
];

export const PROFILE_BADGES = [
  { id: 'kitchen-champ', label: 'אלוף המטבח 🍳', labelEn: 'Kitchen champion 🍳' },
  { id: 'cleaning-master', label: 'מאסטר ניקיונות 🧹', labelEn: 'Cleaning master 🧹' },
  { id: 'home-hero', label: 'גיבור הבית 🦸', labelEn: 'Home hero 🦸' },
  { id: 'homework-star', label: 'כוכב שיעורים 📚', labelEn: 'Homework star 📚' },
  { id: 'pet-lover', label: 'אוהב חיות 🐾', labelEn: 'Pet lover 🐾' },
  { id: 'early-bird', label: 'ציפור בוקר 🌅', labelEn: 'Early bird 🌅' },
  { id: 'night-owl', label: 'ינשוף לילה 🦉', labelEn: 'Night owl 🦉' },
  { id: 'team-player', label: 'שחקן קבוצה 🤝', labelEn: 'Team player 🤝' },
].map(badge => ({ ...badge, labelKey: `badge.${badge.id}` }));

export const BADGE_TRANSLATIONS = {
  he: Object.fromEntries(PROFILE_BADGES.map(b => [b.labelKey, b.label])),
  en: Object.fromEntries(PROFILE_BADGES.map(b => [b.labelKey, b.labelEn])),
};

/**
 * The avatar ring palette and the dark-theme kit accent palette were designed
 * separately. This is the single bijection between them — one accent per ring —
 * so every screen colours the same user identically.
 */
export const RING_ACCENT = {
  'neon-blue': 'sky',
  'sunset-gold': 'gold',
  'emerald-green': 'mint',
  'purple-flame': 'grape',
  'rose-pink': 'coral',
  'slate-cool': 'lime',
};

export function getRingAccent(ringColorId, fallback = 'lime') {
  return RING_ACCENT[ringColorId] ?? fallback;
}

export const DEFAULT_AVATAR_CONFIG = {
  avatarType: AVATAR_TYPES.EMOJI,
  baseIconId: 'lion',
  stickerId: null,
  customImageData: null,
  customImageMime: null,
  ringColorId: 'neon-blue',
  profileBadgeId: 'home-hero',
};

export function getAvatarIcon(id) {
  return AVATAR_ICONS.find((a) => a.id === id) || AVATAR_ICONS[0];
}

export function getRingColor(id) {
  return RING_COLORS.find((r) => r.id === id) || RING_COLORS[0];
}

export function getProfileBadge(id) {
  return PROFILE_BADGES.find((b) => b.id === id || b.labelKey === id || b.label === id || b.labelEn === id) || PROFILE_BADGES[2];
}

export function resolveAvatarConfig(config) {
  const base = { ...DEFAULT_AVATAR_CONFIG, ...config };
  const ring = getRingColor(base.ringColorId);
  const profileBadge = getProfileBadge(config?.profileBadgeId || config?.profileBadgeKey || config?.profileBadgeLabel);
  const avatarType = base.avatarType || AVATAR_TYPES.EMOJI;

  const shared = {
    ...base,
    avatarType,
    bg: ring.bg,
    ringClass: ring.ring,
    ringLabel: ring.labelHe,
    profileBadgeLabel: profileBadge.label,
    profileBadgeId: profileBadge.id,
    profileBadgeKey: profileBadge.labelKey,
  };

  if (avatarType === AVATAR_TYPES.CUSTOM && base.customImageData) {
    return {
      ...shared,
      displayType: 'image',
      imageUrl: base.customImageData,
      isAnimated: base.customImageMime === 'image/gif',
      emoji: null,
      iconLabel: 'מדבקה מותאמת',
    };
  }

  if (avatarType === AVATAR_TYPES.STICKER && base.stickerId) {
    const sticker = getStickerById(base.stickerId);
    if (sticker?.type === 'gif') {
      return {
        ...shared,
        displayType: 'image',
        imageUrl: sticker.url,
        isAnimated: true,
        emoji: sticker.preview,
        iconLabel: sticker.label,
        stickerAnimationClass: null,
      };
    }
    if (sticker?.type === 'css') {
      return {
        ...shared,
        displayType: 'sticker',
        imageUrl: null,
        isAnimated: true,
        emoji: sticker.emoji,
        iconLabel: sticker.label,
        stickerAnimationClass: sticker.animationClass,
      };
    }
  }

  const icon = getAvatarIcon(base.baseIconId);
  return {
    ...shared,
    displayType: 'emoji',
    imageUrl: null,
    isAnimated: false,
    emoji: icon.emoji,
    iconLabel: icon.label,
    stickerAnimationClass: null,
  };
}

export const AVATARS = AVATAR_ICONS.map((icon) => ({
  ...icon,
  bg: 'bg-indigo-500',
}));

export function getAvatarById(avatarId) {
  const icon = getAvatarIcon(avatarId);
  return { ...icon, bg: 'bg-indigo-500' };
}

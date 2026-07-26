export const STICKER_PRESETS = [
  {
    id: 'sparkles',
    label: 'ניצוצות',
    type: 'css',
    emoji: '✨',
    animationClass: 'sticker-sparkles',
  },
  {
    id: 'muscle',
    label: 'שרירים',
    type: 'css',
    emoji: '💪',
    animationClass: 'sticker-muscle',
  },
  {
    id: 'dancing-cat',
    label: 'חתול רוקד',
    type: 'css',
    emoji: '🐱',
    animationClass: 'sticker-dance',
  },
  {
    id: 'trophy',
    label: 'גביע',
    type: 'css',
    emoji: '🏆',
    animationClass: 'sticker-trophy',
  },
  {
    id: 'fire',
    label: 'בוער',
    type: 'css',
    emoji: '🔥',
    animationClass: 'sticker-fire',
  },
  {
    id: 'party',
    label: 'מסיבה',
    type: 'css',
    emoji: '🎉',
    animationClass: 'sticker-party',
  },
  {
    id: 'gif-stars',
    label: 'כוכבים GIF',
    type: 'gif',
    url: 'https://media.giphy.com/media/26BRuo6sGiljlGd6w/giphy.gif',
    preview: '⭐',
  },
  {
    id: 'gif-clap',
    label: 'מחיאות כפיים',
    type: 'gif',
    url: 'https://media.giphy.com/media/g9582TYuOTLfW/giphy.gif',
    preview: '👏',
  },
  {
    id: 'gif-cool',
    label: 'Cool 😎',
    type: 'gif',
    url: 'https://media.giphy.com/media/ICOgHjpOYWYo0/giphy.gif',
    preview: '😎',
  },
  {
    id: 'gif-heart',
    label: 'לבבות',
    type: 'gif',
    url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
    preview: '❤️',
  },
];

export const AVATAR_TYPES = {
  EMOJI: 'emoji',
  STICKER: 'sticker',
  CUSTOM: 'custom',
};

export const MAX_AVATAR_UPLOAD_BYTES = 2 * 1024 * 1024;
export const ALLOWED_AVATAR_MIMES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

export function getStickerById(id) {
  return STICKER_PRESETS.find((s) => s.id === id) || null;
}

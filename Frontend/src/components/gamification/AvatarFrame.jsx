const SIZE_MAP = {
  sm: { box: 'w-9 h-9', emoji: 'text-lg' },
  md: { box: 'w-11 h-11', emoji: 'text-xl' },
  lg: { box: 'w-14 h-14', emoji: 'text-2xl' },
  xl: { box: 'w-20 h-20', emoji: 'text-4xl' },
};

export default function AvatarFrame({
  avatar,
  size = 'md',
  showGlow = true,
  glowClass,
  className = '',
}) {
  const s = SIZE_MAP[size] || SIZE_MAP.md;
  const ringClass = showGlow
    ? [glowClass, avatar?.ringClass || 'ring-2 ring-slate-200'].filter(Boolean).join(' ')
    : 'ring-1 ring-slate-200';

  const isImage = avatar?.displayType === 'image' && avatar?.imageUrl;
  const isCssSticker = avatar?.displayType === 'sticker' && avatar?.stickerAnimationClass;

  return (
    <div
      className={`${s.box} ${avatar?.bg ?? 'bg-indigo-500'} rounded-2xl flex items-center justify-center overflow-hidden ${ringClass} transition-all duration-300 ${className}`}
      title={avatar?.profileBadgeLabel || avatar?.iconLabel}
    >
      {isImage ? (
        <img
          src={avatar.imageUrl}
          alt={avatar.iconLabel || 'avatar'}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : isCssSticker ? (
        <span className={`${s.emoji} ${avatar.stickerAnimationClass} select-none`}>
          {avatar.emoji}
        </span>
      ) : (
        <span className={`${s.emoji} select-none`}>{avatar?.emoji ?? '👤'}</span>
      )}
    </div>
  );
}

import AvatarFrame from './AvatarFrame';
import { useI18n } from '../../context/I18nContext';

const sizes = {
  sm: { badge: 'text-[9px] px-1 py-0 -bottom-2 max-w-[72px]' },
  md: { badge: 'text-[10px] px-1.5 py-0.5 -bottom-2 max-w-[88px]' },
  lg: { badge: 'text-xs px-2 py-0.5 -bottom-2.5 max-w-[100px]' },
};

export default function UserAvatar({
  user,
  size = 'md',
  showBadge = false,
  showPoints = false,
  showGlow = false,
  glowOverride,
}) {
  const s = sizes[size];
  const avatar = user.avatar;
  const { p, role } = useI18n();

  return (
    <div className="flex items-center gap-2 min-w-0 max-w-full">
      <div className="relative shrink-0">
        <AvatarFrame
          avatar={avatar}
          size={size}
          showGlow={showGlow}
          glowClass={glowOverride || (showGlow ? user.glow?.ring : undefined)}
        />
        {showBadge && user.badge && (
          <span
            className={`absolute start-1/2 -translate-x-1/2 ${s.badge} ${user.badge.className} rounded-full truncate font-medium shadow-sm z-10`}
            title={user.badge.label}
          >
            {user.badge.emoji}
          </span>
        )}
      </div>
      {showPoints && (
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 break-words">{user.name}</p>
          <p className="text-xs text-slate-500 break-words">
            {p(user.points)}
            {user.familyRole ? ` · ${role(user.familyRole, user.familyRoleLabel)}` : ''}
          </p>
        </div>
      )}
    </div>
  );
}

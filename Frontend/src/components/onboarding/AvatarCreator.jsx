import { useRef, useState } from 'react';
import { Upload, ImageIcon, Smile, Sparkles } from 'lucide-react';
import {
  AVATAR_ICONS,
  RING_COLORS,
  PROFILE_BADGES,
  resolveAvatarConfig,
  DEFAULT_AVATAR_CONFIG,
} from '../../data/avatars';
import { STICKER_PRESETS, AVATAR_TYPES } from '../../data/stickers';
import {
  readFileAsDataUrl,
  buildCustomAvatarConfig,
  buildStickerAvatarConfig,
  buildEmojiAvatarConfig,
} from '../../services/avatarService';
import AvatarFrame from '../gamification/AvatarFrame';
import { useI18n } from '../../context/I18nContext';

const TAB_IDS = [
  { id: 'emoji', labelKey: 'avatar.emoji', icon: Smile },
  { id: 'sticker', labelKey: 'avatar.stickers', icon: Sparkles },
  { id: 'custom', labelKey: 'avatar.upload', icon: Upload },
];

const A_THEME = {
  light: {
    tabBar: 'flex rounded-xl bg-slate-100 p-1 gap-1',
    tabOn: 'bg-white text-indigo-700 shadow-sm',
    tabOff: 'text-slate-600 hover:text-slate-800',
    label: 'block text-sm font-medium text-slate-700 mb-2',
    labelPlain: 'block text-sm font-medium text-slate-700',
    badgeLabel: 'text-sm font-semibold text-indigo-700',
    hint: 'text-xs text-slate-500',
    tile: 'w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center',
    tileLabel: 'text-[10px] font-medium text-slate-600 text-center leading-tight',
    ringLabel: 'text-xs font-medium text-slate-700',
    uploadBox:
      'w-full flex flex-col items-center gap-3 py-8 rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-400 transition-all duration-300',
    uploadRing: 'w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-indigo-300 shadow-lg',
    uploadIconBox: 'w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center',
    uploadIcon: 'h-7 w-7 text-indigo-500',
    uploadCta: 'text-sm font-semibold text-indigo-700 flex items-center justify-center gap-1.5',
    uploadHint: 'text-xs text-slate-500 mt-1',
    uploadError: 'text-xs text-red-600 text-center',
    iconOn: 'bg-indigo-100 ring-2 ring-indigo-500 scale-110',
    iconOff: 'bg-slate-50 hover:bg-slate-100',
    stickerOn: 'border-indigo-500 bg-indigo-50 scale-105 shadow-md',
    stickerOff: 'border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm',
    ringOn: 'border-indigo-500 bg-indigo-50',
    ringOff: 'border-slate-200 hover:border-slate-300',
    badgeOn: 'border-indigo-500 bg-indigo-50 text-indigo-800',
    badgeOff: 'border-slate-200 text-slate-600 hover:border-slate-300',
  },
  dark: {
    tabBar: 'flex rounded-xl bg-white/6 p-1 gap-1',
    tabOn: 'bg-lime text-[#152007] shadow-sm',
    tabOff: 'text-ink-dim hover:text-ink',
    label: 'block text-sm font-bold text-ink-dim mb-2',
    labelPlain: 'block text-sm font-bold text-ink-dim',
    badgeLabel: 'text-sm font-extrabold text-lime',
    hint: 'text-xs text-ink-faint',
    tile: 'w-12 h-12 rounded-xl overflow-hidden bg-white/6 flex items-center justify-center',
    tileLabel: 'text-[10px] font-bold text-ink-dim text-center leading-tight',
    ringLabel: 'text-xs font-bold text-ink-dim',
    uploadBox:
      'w-full flex flex-col items-center gap-3 py-8 rounded-2xl border-2 border-dashed border-lime/35 bg-lime/6 hover:bg-lime/12 hover:border-lime/60 transition-all duration-300',
    uploadRing: 'w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-lime/50 shadow-lg',
    uploadIconBox: 'w-14 h-14 rounded-full bg-lime/15 flex items-center justify-center',
    uploadIcon: 'h-7 w-7 text-lime',
    uploadCta: 'text-sm font-extrabold text-lime flex items-center justify-center gap-1.5',
    uploadHint: 'text-xs text-ink-faint mt-1',
    uploadError: 'text-xs text-coral text-center',
    iconOn: 'bg-lime/20 ring-2 ring-lime scale-110',
    iconOff: 'bg-white/6 hover:bg-white/12',
    stickerOn: 'border-lime bg-lime/12 scale-105 shadow-md',
    stickerOff: 'border-white/12 bg-white/4 hover:border-lime/40',
    ringOn: 'border-lime bg-lime/12',
    ringOff: 'border-white/12 hover:border-white/25',
    badgeOn: 'border-lime bg-lime/12 text-lime',
    badgeOff: 'border-white/12 text-ink-dim hover:border-white/25',
  },
};

export default function AvatarCreator({ config, onChange, variant = 'light' }) {
  const at = A_THEME[variant] ?? A_THEME.light;
  const { t } = useI18n();
  const fileRef = useRef(null);
  const [local, setLocal] = useState({ ...DEFAULT_AVATAR_CONFIG, ...config });
  const [activeTab, setActiveTab] = useState(config?.avatarType || 'emoji');
  const [uploadError, setUploadError] = useState(null);
  const [uploading, setUploading] = useState(false);

  const preview = resolveAvatarConfig(local);

  const emit = (next) => {
    setLocal(next);
    onChange?.(next);
  };

  const updateRing = (ringColorId) => emit({ ...local, ringColorId });
  const updateBadge = (profileBadgeId) => emit({ ...local, profileBadgeId });

  const selectEmoji = (baseIconId) => {
    emit(buildEmojiAvatarConfig(baseIconId, local.ringColorId, local.profileBadgeId));
    setActiveTab('emoji');
  };

  const selectSticker = (stickerId) => {
    emit(buildStickerAvatarConfig(stickerId, local.ringColorId, local.profileBadgeId));
    setActiveTab('sticker');
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const { dataUrl, mimeType } = await readFileAsDataUrl(file);
      emit(buildCustomAvatarConfig(dataUrl, mimeType, local.ringColorId, local.profileBadgeId));
      setActiveTab('custom');
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-2 py-4">
        <AvatarFrame avatar={preview} size="xl" showGlow />
        <p className={at.badgeLabel}>{preview.profileBadgeLabel}</p>
        <p className={at.hint}>
          {preview.iconLabel} · {t('avatar.ring')}: {preview.ringLabel}
          {preview.isAnimated && ` · 🎬 ${t('avatar.animated')}`}
        </p>
      </div>

      <div className={at.tabBar}>
        {TAB_IDS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? at.tabOn
                  : at.tabOff
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t(tab.labelKey)}
            </button>
          );
        })}
      </div>

      {activeTab === 'emoji' && (
        <div>
          <label className={at.label}>{t('avatar.baseIcon')}</label>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {AVATAR_ICONS.map((icon) => (
              <button
                key={icon.id}
                type="button"
                onClick={() => selectEmoji(icon.id)}
                title={icon.label}
                className={`text-2xl p-2 rounded-xl transition-all ${
                  local.avatarType === AVATAR_TYPES.EMOJI && local.baseIconId === icon.id
                    ? at.iconOn
                    : at.iconOff
                }`}
              >
                {icon.emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'sticker' && (
        <div>
          <label className={at.label}>
            {t('avatar.gallery')}
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {STICKER_PRESETS.map((sticker) => (
              <button
                key={sticker.id}
                type="button"
                onClick={() => selectSticker(sticker.id)}
                title={sticker.label}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl border-2 transition-all ${
                  local.avatarType === AVATAR_TYPES.STICKER && local.stickerId === sticker.id
                    ? at.stickerOn
                    : at.stickerOff
                }`}
              >
                <div className={at.tile}>
                  {sticker.type === 'gif' ? (
                    <img
                      src={sticker.url}
                      alt={sticker.label}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className={`text-2xl ${sticker.animationClass}`}>{sticker.emoji}</span>
                  )}
                </div>
                <span className={at.tileLabel}>
                  {sticker.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'custom' && (
        <div className="space-y-3">
          <label className={at.labelPlain}>
            {t('avatar.uploadTitle')}
          </label>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            onChange={handleUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className={at.uploadBox}
          >
            {local.avatarType === AVATAR_TYPES.CUSTOM && local.customImageData ? (
              <div className={at.uploadRing}>
                <img
                  src={local.customImageData}
                  alt="uploaded"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className={at.uploadIconBox}>
                <ImageIcon className={at.uploadIcon} />
              </div>
            )}
            <div className="text-center">
              <p className={at.uploadCta}>
                <Upload className="h-4 w-4" />
                {uploading ? t('avatar.uploading') : t('avatar.uploadCta')}
              </p>
              <p className={at.uploadHint}>{t('avatar.uploadHint')}</p>
            </div>
          </button>
          {uploadError && (
            <p className={at.uploadError}>{uploadError}</p>
          )}
        </div>
      )}

      <div>
        <label className={at.label}>{t('avatar.ringColor')}</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {RING_COLORS.map((ring) => (
            <button
              key={ring.id}
              type="button"
              onClick={() => updateRing(ring.id)}
              className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all text-start ${
                local.ringColorId === ring.id
                  ? at.ringOn
                  : at.ringOff
              }`}
            >
              <div className={`w-8 h-8 rounded-full ${ring.bg} ${ring.ring.split(' ').slice(0, 2).join(' ')} shrink-0`} />
              <span className={at.ringLabel}>{ring.labelHe}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={at.label}>{t('avatar.badge')}</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PROFILE_BADGES.map((badge) => (
            <button
              key={badge.id}
              type="button"
              onClick={() => updateBadge(badge.id)}
              className={`py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition-all text-start ${
                local.profileBadgeId === badge.id
                  ? at.badgeOn
                  : at.badgeOff
              }`}
            >
              {badge.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

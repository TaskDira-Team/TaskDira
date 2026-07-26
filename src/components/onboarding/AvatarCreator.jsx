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

const TABS = [
  { id: 'emoji', label: 'אימוג\'י', icon: Smile },
  { id: 'sticker', label: 'מדבקות / GIF', icon: Sparkles },
  { id: 'custom', label: 'העלאה', icon: Upload },
];

export default function AvatarCreator({ config, onChange }) {
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
        <p className="text-sm font-semibold text-indigo-700">{preview.profileBadgeLabel}</p>
        <p className="text-xs text-slate-500">
          {preview.iconLabel} · טבעת: {preview.ringLabel}
          {preview.isAnimated && ' · 🎬 מונפש'}
        </p>
      </div>

      <div className="flex rounded-xl bg-slate-100 p-1 gap-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'emoji' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">אייקון בסיס</label>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {AVATAR_ICONS.map((icon) => (
              <button
                key={icon.id}
                type="button"
                onClick={() => selectEmoji(icon.id)}
                title={icon.label}
                className={`text-2xl p-2 rounded-xl transition-all ${
                  local.avatarType === AVATAR_TYPES.EMOJI && local.baseIconId === icon.id
                    ? 'bg-indigo-100 ring-2 ring-indigo-500 scale-110'
                    : 'bg-slate-50 hover:bg-slate-100'
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
          <label className="block text-sm font-medium text-slate-700 mb-2">
            גלריית מדבקות ו-GIFs (סגנון WhatsApp)
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
                    ? 'border-indigo-500 bg-indigo-50 scale-105 shadow-md'
                    : 'border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm'
                }`}
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
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
                <span className="text-[10px] font-medium text-slate-600 text-center leading-tight">
                  {sticker.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'custom' && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">
            העלאת תמונה / מדבקה / GIF
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
            className="w-full flex flex-col items-center gap-3 py-8 rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-400 transition-all duration-300"
          >
            {local.avatarType === AVATAR_TYPES.CUSTOM && local.customImageData ? (
              <div className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-indigo-300 shadow-lg">
                <img
                  src={local.customImageData}
                  alt="uploaded"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center">
                <ImageIcon className="h-7 w-7 text-indigo-500" />
              </div>
            )}
            <div className="text-center">
              <p className="text-sm font-semibold text-indigo-700 flex items-center justify-center gap-1.5">
                <Upload className="h-4 w-4" />
                {uploading ? 'מעלה...' : 'העלאת תמונה/מדבקה'}
              </p>
              <p className="text-xs text-slate-500 mt-1">PNG, JPG, GIF, WebP · עד 2MB</p>
            </div>
          </button>
          {uploadError && (
            <p className="text-xs text-red-600 text-center">{uploadError}</p>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">צבע / טבעת זוהרת</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {RING_COLORS.map((ring) => (
            <button
              key={ring.id}
              type="button"
              onClick={() => updateRing(ring.id)}
              className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all text-start ${
                local.ringColorId === ring.id
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className={`w-8 h-8 rounded-full ${ring.bg} ${ring.ring.split(' ').slice(0, 2).join(' ')} shrink-0`} />
              <span className="text-xs font-medium text-slate-700">{ring.labelHe}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">תג פרופיל</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PROFILE_BADGES.map((badge) => (
            <button
              key={badge.id}
              type="button"
              onClick={() => updateBadge(badge.id)}
              className={`py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition-all text-start ${
                local.profileBadgeId === badge.id
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
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

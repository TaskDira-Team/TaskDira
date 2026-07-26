import { useState, useRef } from 'react';
import { X, Camera, Upload, Loader2, ImageIcon, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { modalVariants, overlayVariants } from '../../utils/motion';
import { validateProofUpload } from '../../services/proofService';
import { useI18n } from '../../context/I18nContext';

export default function CompletionProofModal({ task, onSubmit, onAdminComplete, onClose }) {
  const { t, dir } = useI18n();
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFile = async (file) => {
    setError(null);
    try {
      const { dataUrl } = await validateProofUpload(file);
      setPreview(dataUrl);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async () => {
    if (!preview) {
      setError(t('proofRequired'));
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(task.id, preview);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminSkip = async () => {
    if (!onAdminComplete) return;
    setSubmitting(true);
    try {
      await onAdminComplete();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        dir={dir}
        className="relative glass-card rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-sm z-10 rounded-t-3xl sm:rounded-t-2xl">
          <div className="flex items-center gap-2 min-w-0">
            <Camera className="h-5 w-5 text-indigo-600 shrink-0" />
            <h3 className="font-bold text-slate-900 truncate">{t('proofTitle')}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="p-2 rounded-lg hover:bg-slate-100 shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3 min-w-0">
            <p className="text-sm font-semibold text-indigo-900 truncate">{task.title}</p>
            <p className="text-xs text-indigo-600 mt-0.5">{t('proofHint')}</p>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full flex flex-col items-center gap-3 py-10 rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50/40 hover:bg-indigo-50 active:scale-[0.98] transition-all touch-manipulation"
          >
            {preview ? (
              <img src={preview} alt="proof preview" className="w-full max-h-48 object-cover rounded-xl" />
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-indigo-500" />
                </div>
                <div className="text-center px-4">
                  <p className="text-sm font-semibold text-indigo-700 flex items-center justify-center gap-1.5">
                    <Upload className="h-4 w-4" />
                    {t('proofUpload')}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{t('proofCapture')}</p>
                  <p className="text-xs text-slate-400">{t('proofFormats')}</p>
                </div>
              </>
            )}
          </button>

          {error && (
            <p className="text-sm text-red-600 text-center bg-red-50 rounded-xl py-2 px-3">{error}</p>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!preview || submitting}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-medium flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('sendForApproval')}
              </button>
            </div>
            {onAdminComplete && (
              <button
                type="button"
                onClick={handleAdminSkip}
                disabled={submitting}
                className="w-full py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-emerald-100 disabled:opacity-40"
              >
                <CheckCircle className="h-4 w-4" />
                {t('adminDirectApprove')}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

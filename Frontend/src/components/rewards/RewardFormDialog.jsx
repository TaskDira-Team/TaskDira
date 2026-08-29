import { useEffect, useState } from 'react';
import { Dialog, Field, GhostButton, LimeButton, darkControlStyle, fieldClass } from '../ui/kit';
import { useI18n } from '../../context/I18nContext';

/**
 * One form for both creating and editing a reward, replacing the three
 * sequential window.prompt() calls.
 *
 * `cost` (what the wallet pays) stays distinct from `requiredPoints` (the XP
 * standing that unlocks it) — welding them together makes the
 * unaffordable-but-unlocked state unreachable. The old flow expressed that by
 * defaulting cost to the threshold in a third prompt; here cost simply tracks
 * the threshold until the field is edited, so the default survives without a
 * separate step.
 */
export default function RewardFormDialog({ open, reward, busy = false, onSubmit, onClose }) {
  const { t } = useI18n();
  const isEdit = !!reward;

  const [title, setTitle] = useState('');
  const [requiredPoints, setRequiredPoints] = useState('50');
  const [cost, setCost] = useState('50');
  const [costTouched, setCostTouched] = useState(false);

  // Reset whenever the dialog opens so a cancelled edit never leaks into the
  // next one.
  useEffect(() => {
    if (!open) return;
    if (reward) {
      setTitle(reward.title ?? '');
      setRequiredPoints(String(reward.requiredPoints ?? 50));
      setCost(String(reward.cost ?? reward.requiredPoints ?? 50));
      setCostTouched(true);
    } else {
      setTitle('');
      setRequiredPoints('50');
      setCost('50');
      setCostTouched(false);
    }
  }, [open, reward]);

  const handleThreshold = (value) => {
    setRequiredPoints(value);
    if (!costTouched) setCost(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    const points = Number(requiredPoints) || 0;
    const parsedCost = Number(cost);
    const cleanCost = cost.trim() === '' || Number.isNaN(parsedCost) || parsedCost < 0 ? points : parsedCost;

    onSubmit({ title: cleanTitle, requiredPoints: points, cost: cleanCost });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? t('dialog.editReward') : t('dialog.newReward')}
      footer={
        <div className="flex gap-3">
          <GhostButton onClick={onClose} className="flex-1">
            {t('cancel')}
          </GhostButton>
          <LimeButton
            type="submit"
            form="reward-form"
            disabled={busy || !title.trim()}
            className="flex-1"
          >
            {isEdit ? t('dialog.save') : t('dialog.create')}
          </LimeButton>
        </div>
      }
    >
      <form id="reward-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label={t('promptName')} htmlFor="reward-title">
          <input
            id="reward-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder={t('promptRewardName')}
            className={fieldClass}
          />
        </Field>

        <Field label={t('promptRewardThreshold')} htmlFor="reward-threshold">
          <input
            id="reward-threshold"
            type="number"
            min={0}
            value={requiredPoints}
            onChange={(e) => handleThreshold(e.target.value)}
            required
            dir="ltr"
            className={fieldClass}
            style={darkControlStyle}
          />
        </Field>

        <Field
          label={t('promptRewardCost')}
          hint={costTouched ? undefined : t('dialog.rewardCostHint')}
          htmlFor="reward-cost"
        >
          <input
            id="reward-cost"
            type="number"
            min={0}
            value={cost}
            onChange={(e) => {
              setCostTouched(true);
              setCost(e.target.value);
            }}
            dir="ltr"
            className={fieldClass}
            style={darkControlStyle}
          />
        </Field>
      </form>
    </Dialog>
  );
}

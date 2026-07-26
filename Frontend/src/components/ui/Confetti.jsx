import { useEffect } from 'react';
import { fireRewardConfetti } from '../../utils/confetti';

export default function Confetti({ active, variant = 'reward' }) {
  useEffect(() => {
    if (!active) return;
    if (variant === 'reward') fireRewardConfetti();
  }, [active, variant]);

  return null;
}

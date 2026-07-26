const STORAGE_KEY = 'taskdira_sfx';

let audioCtx = null;

function getCtx() {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) audioCtx = new AC();
  return audioCtx;
}

export function isSoundEnabled() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === null ? true : v === '1';
  } catch {
    return true;
  }
}

export function setSoundEnabled(on) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? '1' : '0');
    return true;
  } catch {
    return false;
  }
}

function tone(freq, duration, type = 'sine', gain = 0.08, when = 0) {
  if (!isSoundEnabled()) return;
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});

  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  osc.connect(g);
  g.connect(ctx.destination);
  const t0 = ctx.currentTime + when;
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export function playTaskCompleteSound() {
  tone(523.25, 0.12, 'triangle', 0.07, 0);
  tone(659.25, 0.14, 'triangle', 0.06, 0.09);
  tone(783.99, 0.18, 'sine', 0.05, 0.18);
}

export function playRewardClaimSound() {
  tone(392, 0.1, 'square', 0.04, 0);
  tone(523.25, 0.12, 'square', 0.05, 0.1);
  tone(659.25, 0.14, 'triangle', 0.06, 0.2);
  tone(880, 0.22, 'sine', 0.05, 0.32);
}

const BRAND_COLORS = ["#17675c", "#c65035", "#bda9d8", "#e5be63", "#8faa7f"];

let confettiPromise;

function loadConfetti() {
  if (!confettiPromise) {
    confettiPromise = import("canvas-confetti")
      .then((mod) => mod.default)
      .catch(() => {
        confettiPromise = null;
        return null;
      });
  }
  return confettiPromise;
}

async function fire(particleCount, spread, originY = 0.6) {
  const confetti = await loadConfetti();
  if (!confetti) return;

  confetti({
    particleCount,
    spread,
    origin: { y: originY },
    colors: BRAND_COLORS,
    disableForReducedMotion: true,
    zIndex: 9999,
  });
}

export function fireTaskCompleteConfetti() {
  void (async () => {
    await fire(80, 70, 0.65);
    setTimeout(() => void fire(50, 100, 0.5), 180);
  })();
}

export function fireRewardConfetti() {
  void (async () => {
    const confetti = await loadConfetti();
    if (!confetti) return;

    const duration = 2800;
    const end = Date.now() + duration;

    await fire(120, 100, 0.55);

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.65 },
        colors: BRAND_COLORS,
        disableForReducedMotion: true,
        zIndex: 9999,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.65 },
        colors: BRAND_COLORS,
        disableForReducedMotion: true,
        zIndex: 9999,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };

    frame();
  })();
}

export function fireProofSubmittedConfetti() {
  void fire(40, 60, 0.7);
}

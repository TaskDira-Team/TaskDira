// Many tweens may change a scene in one frame. Paint the final state once.
export function createFrameScheduler(
  paint,
  request = requestAnimationFrame,
  cancel = cancelAnimationFrame,
) {
  let frame = null;
  let disposed = false;
  return {
    request() {
      if (disposed || frame !== null) return;
      frame = request(() => {
        frame = null;
        if (!disposed) paint();
      });
    },
    dispose() {
      disposed = true;
      if (frame !== null) cancel(frame);
      frame = null;
    },
  };
}

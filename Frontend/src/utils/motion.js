export const springTransition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
};

export const cardVariants = {
  initial: { opacity: 0, scale: 0.94, y: 12 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 28 } },
  exit: { opacity: 0, scale: 0.9, x: 30, transition: { duration: 0.22 } },
  move: {
    scale: [1, 1.05, 1],
    y: [0, -4, 0],
    boxShadow: [
      '0 1px 3px rgb(0 0 0 / 0.08)',
      '0 12px 40px rgb(99 102 241 / 0.22)',
      '0 1px 3px rgb(0 0 0 / 0.08)',
    ],
    transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] },
  },
};

export const modalVariants = {
  hidden: { opacity: 0, scale: 0.85, y: 30 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 350, damping: 28 },
  },
  exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } },
};

export const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export const rewardButtonVariants = {
  idle: { scale: 1 },
  tap: { scale: 0.95 },
  success: {
    scale: [1, 1.15, 1],
    transition: { duration: 0.4 },
  },
};

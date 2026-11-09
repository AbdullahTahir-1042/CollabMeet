import { durations, easings, spring, softSpring } from './motion';

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: durations.base, ease: easings.enter } },
  exit: { opacity: 0, transition: { duration: durations.fast } },
};

export const slideUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: durations.slow, ease: easings.enter } },
  exit: { opacity: 0, y: -12, transition: { duration: durations.fast } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: durations.slow, ease: easings.enter } },
  exit: { opacity: 0, scale: 0.97, transition: { duration: durations.fast } },
};

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.045, delayChildren: 0.04 },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: durations.base, ease: easings.enter } },
  exit: { opacity: 0, x: -12, transition: { duration: durations.fast } },
};

export const drawerRight = {
  hidden: { x: '100%', opacity: 0.4 },
  visible: { x: 0, opacity: 1, transition: spring },
  exit: { x: '100%', opacity: 0.2, transition: { duration: durations.base, ease: easings.exit } },
};

export const drawerLeft = {
  hidden: { x: '-100%' },
  visible: { x: 0, transition: softSpring },
  exit: { x: '-100%', transition: { duration: durations.base, ease: easings.exit } },
};

export const modalPop = {
  hidden: { opacity: 0, scale: 0.92, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0, transition: spring },
  exit: { opacity: 0, scale: 0.95, y: 8, transition: { duration: durations.fast } },
};

export const bubblePop = {
  hidden: { opacity: 0, scale: 0.92, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: spring },
};

export const pageTransition = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: durations.slow, ease: easings.enter } },
  exit: { opacity: 0, y: -8, transition: { duration: durations.fast, ease: easings.exit } },
};

export const pressable = {
  whileHover: { y: -1 },
  whileTap: { scale: 0.97 },
  transition: { duration: durations.fast },
};

export const dockUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { ...softSpring, delay: 0.1 } },
  exit: { opacity: 0, y: 32, transition: { duration: durations.base } },
};

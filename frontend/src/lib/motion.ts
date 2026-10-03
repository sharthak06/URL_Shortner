import type { Transition, Variants } from "framer-motion";

/**
 * Standard spring transition for tactile, physical feel.
 */
export const springTransition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 25,
};

export const snappyTransition: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
};

/**
 * Card entrance and exit variants.
 * Strictly uses GPU compositor properties (opacity, transform/scale/y) to avoid layout thrashing.
 */
export const cardEntranceVariants: Variants = {
  hidden: { opacity: 0, y: -12, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springTransition,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: { duration: 0.15, ease: "easeOut" },
  },
};

/**
 * Scroll-reveal variants for sections entering the viewport (rise up, not drop down).
 * Pair with `whileInView="visible"` and `viewport={{ once: true }}`.
 */
export const sectionRevealVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springTransition,
  },
};

/**
 * Staggered container variants for lists.
 */
export const listContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

/**
 * Modal dialog overlay & content variants.
 */
export const modalOverlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

export const modalContentVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springTransition,
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 4,
    transition: { duration: 0.15, ease: "easeOut" },
  },
};

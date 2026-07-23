import type { Variants, Transition } from 'framer-motion'

// ── Shared transition configs ─────────────────────────────────
export const spring: Transition = { type: 'spring', stiffness: 300, damping: 30 }
export const ease: Transition = { duration: 0.2, ease: 'easeOut' }

// ── Page-level transitions ────────────────────────────────────
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
}

export const pageTransition: Transition = { duration: 0.18, ease: 'easeOut' }

// ── Fade ─────────────────────────────────────────────────────
export const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

// ── Slide up from bottom (for modals, toasts) ─────────────────
export const slideUpVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
}

// ── Slide in from left (sidebar overlay on mobile) ────────────
export const slideInLeftVariants: Variants = {
  initial: { x: -260, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -260, opacity: 0 },
}

// ── Scale (popovers, dropdowns) ───────────────────────────────
export const scaleVariants: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.97 },
}

// ── Stagger children ──────────────────────────────────────────
export const staggerParentVariants: Variants = {
  animate: { transition: { staggerChildren: 0.05 } },
}

export const staggerChildVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
}

// ── Hover lift card ───────────────────────────────────────────
export const hoverLift = {
  whileHover: { y: -2, transition: { duration: 0.15 } },
  whileTap: { scale: 0.98 },
}

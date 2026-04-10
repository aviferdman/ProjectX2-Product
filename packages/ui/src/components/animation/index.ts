/**
 * TASK-173: Animation system — barrel export
 *
 * Page transitions, state changes, and loading animations.
 */

// Constants & types
export {
  DURATION,
  EASING,
  STAGGER,
  ENTER_KEYFRAMES,
  VARIANT_EASING,
  VARIANT_DURATION,
  type AnimationVariant,
  type AnimationPhase,
  type PageTransitionVariant,
  type LoadingVariant,
  type AnimationKeyframe,
} from './constants.js';

// Page transition components
export { FadeIn, type FadeInProps } from './FadeIn.js';
export { SlideIn, type SlideInProps, type SlideDirection } from './SlideIn.js';
export { ScaleIn, type ScaleInProps } from './ScaleIn.js';
export { PageTransition, type PageTransitionProps } from './PageTransition.js';

// State change components
export { AnimatePresence, type AnimatePresenceProps } from './AnimatePresence.js';

// Loading components
export { Skeleton, type SkeletonProps, type SkeletonVariant } from './Skeleton.js';
export { Shimmer, type ShimmerProps } from './Shimmer.js';
export { PulseLoader, type PulseLoaderProps } from './PulseLoader.js';

// Stagger
export { StaggerList, type StaggerListProps } from './StaggerList.js';

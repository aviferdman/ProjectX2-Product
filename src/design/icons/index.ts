/**
 * Crewspace Icon System — Public API
 * TASK-127: Create icon set and visual assets
 */

export {
  iconRegistry,
  ICON_CATEGORIES,
  ICON_COUNT,
  getIconData,
  getIconsByCategory,
  hasIcon,
  type IconPathData,
  type IconCategory,
  type IconName,
} from './registry.js';

export {
  iconSize,
  iconStroke,
  iconColor,
  nodeTypeIcons,
  type IconSize,
  type IconStrokeWeight,
  type IconColorToken,
  type NodeType,
} from './tokens.js';

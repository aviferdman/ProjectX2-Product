/**
 * @crewspace/ui — Design system React components
 *
 * This package provides the Crewspace visual design system:
 * - Tailwind theme preset & CSS custom properties
 * - Base UI components (Button, Input, Card, Badge, Modal, Tooltip, Spinner)
 * - Design token constants for programmatic access
 */

// Components
export {
  Button,
  type ButtonProps,
  type ButtonVariant,
  type ButtonSize,
  Input,
  type InputProps,
  Card,
  CardHeader,
  CardBody,
  type CardProps,
  type CardHeaderProps,
  type CardBodyProps,
  Badge,
  type BadgeProps,
  type BadgeVariant,
  Modal,
  type ModalProps,
  Tooltip,
  type TooltipProps,
  Spinner,
  type SpinnerProps,
  // Canvas (TASK-135)
  WorkflowCanvas,
  type WorkflowCanvasProps,
  WorkflowNode,
  WorkflowEdge,
  CanvasBackground,
  type CanvasBackgroundProps,
  CanvasControls,
  type CanvasControlsProps,
  CanvasMinimap,
  type CanvasMinimapProps,
  type CanvasNodeType,
  type NodeStatus,
  type WorkflowNodeData,
  type EdgeVariant,
  type WorkflowEdgeData,
  type BaseNodeProps,
  Z_INDEX,
  CANVAS_CONFIG,
} from './components/index.js';

// Theme
export { crewspaceTailwindPreset, crewspaceTheme } from './theme/index.js';

// Design tokens (programmatic)
export {
  colors,
  sizing,
  radius,
  typography,
  transitions,
} from './theme/tokens.js';

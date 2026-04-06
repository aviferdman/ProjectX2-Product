/**
 * Logging module — barrel export.
 *
 * @packageDocumentation
 */

export {
  BufferTransport,
  ConsoleTransport,
  createAgentLogger,
  createCrewLogger,
  createSilentLogger,
  getLogLevelLabel,
  Logger,
  LogLevel,
  maskSensitiveData,
  parseLogLevel,
} from './logger.js';

export type {
  LogContext,
  LogEntry,
  LoggerConfig,
  LogTransport,
} from './logger.js';

// Performance Metrics
export {
  DEFAULT_MAX_METRICS,
  MetricType,
  PerformanceTimer,
  PerformanceTracker,
  _resetMetricIdCounter,
} from './performance-tracker.js';

export type {
  MetricTokenUsage,
  PerformanceMetric,
  PerformanceMetricInput,
  PerformanceReport,
  PerformanceSummary,
  PerformanceTrackerConfig,
  TimerStartInput,
  TimerStopInput,
} from './performance-tracker.js';

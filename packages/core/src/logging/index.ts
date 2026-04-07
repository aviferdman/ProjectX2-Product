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

export type { LogContext, LogEntry, LoggerConfig, LogTransport } from './logger.js';

// Log Export
export {
  exportLogsToFile,
  exportLogsToStdout,
  FileTransport,
  formatLogEntryAsJson,
  formatLogEntryAsText,
  StdoutTransport,
} from './log-export.js';

export type {
  ExportLogsToFileOptions,
  ExportLogsToStdoutOptions,
  FileTransportConfig,
  LogExportFormat,
  StdoutTransportConfig,
} from './log-export.js';

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

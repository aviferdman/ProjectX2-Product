/**
 * Metrics module — unified performance measurement for Crewspace.
 *
 * Provides four metric dimensions:
 * 1. **Execution Time** — wall-clock timing with percentile statistics
 * 2. **Memory Usage** — heap/RSS tracking with leak detection
 * 3. **Token Efficiency** — LLM token throughput and cost analysis
 * 4. **Workflow Complexity** — structural complexity scoring
 *
 * @packageDocumentation
 */

// Memory Metrics
export {
  captureMemorySnapshot,
  computeMemoryDelta,
  computeMemorySummary,
  DEFAULT_LEAK_THRESHOLD_BYTES,
  DEFAULT_MAX_MEASUREMENTS,
  formatBytes,
  MemoryTracker,
} from './memory-metrics.js';
export type {
  MemoryDelta,
  MemoryMeasurement,
  MemorySnapshot,
  MemorySummary,
  MemoryTrackerConfig,
} from './memory-metrics.js';

// Token Efficiency
export {
  computeTokenEfficiencyReport,
  DEFAULT_MAX_TOKEN_RECORDS,
  TokenEfficiencyTracker,
  _resetTokenRecordIdCounter,
} from './token-efficiency.js';
export type {
  TokenEfficiencyReport,
  TokenEfficiencyTrackerConfig,
  TokenRecord,
  TokenRecordInput,
  TokenTypeBreakdown,
} from './token-efficiency.js';

// Complexity Analysis
export { analyzeComplexity, gradeComplexity } from './complexity-analyzer.js';
export type {
  AgentDescriptor,
  ComplexityGrade,
  ComplexityReport,
  TaskDescriptor,
  WorkflowDescriptor,
} from './complexity-analyzer.js';

// Unified Collector
export {
  computeExecutionTimeSummary,
  DEFAULT_MAX_EXECUTION_TIME_MEASUREMENTS,
  MetricsCollector,
} from './metrics-collector.js';
export type {
  CategoryTimeSummary,
  ExecutionTimeInput,
  ExecutionTimeMeasurement,
  ExecutionTimeSummary,
  MetricsCollectorConfig,
  UnifiedMetricsReport,
} from './metrics-collector.js';

// Performance Metrics Tracker (duration, tokens, API calls)
export {
  ApiCallCategory,
  ApiCallTimer,
  computeApiCallSummary,
  DEFAULT_MAX_RECORDS,
  PerformanceMetricsTracker,
  _resetApiCallIdCounter,
} from './performance-metrics-tracker.js';
export type {
  ApiCallInput,
  ApiCallRecord,
  ApiCallSummary,
  ApiCallTimerStopInput,
  CallRate,
  CategoryBreakdown,
  EndpointBreakdown,
  OperationTokenUsage,
  PerformanceMetricsReport,
  PerformanceMetricsTrackerConfig,
} from './performance-metrics-tracker.js';

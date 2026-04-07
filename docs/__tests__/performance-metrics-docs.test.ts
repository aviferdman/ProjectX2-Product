import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const docsRoot = resolve(__dirname, '..');

describe('Performance Metrics guide page', () => {
  const filePath = join(docsRoot, 'guide', 'performance-metrics.md');

  it('should exist as a docs file', () => {
    expect(existsSync(filePath)).toBe(true);
  });

  it('should have the correct title', () => {
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('# Performance Metrics Tracker');
  });

  it('should document the quick start with import', () => {
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain("import { PerformanceMetricsTracker, ApiCallCategory } from '@crewspace/core'");
  });

  it('should document all API call categories', () => {
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('ApiCallCategory.LLM');
    expect(content).toContain('ApiCallCategory.TOOL');
    expect(content).toContain('ApiCallCategory.HTTP');
    expect(content).toContain('ApiCallCategory.CUSTOM');
  });

  it('should document recordApiCall with code example', () => {
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('recordApiCall');
    expect(content).toContain('durationMs');
    expect(content).toContain('tokenUsage');
  });

  it('should document the timer API', () => {
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('startTimer');
    expect(content).toContain('timer.stop');
  });

  it('should document timeApiCall for async timing', () => {
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('timeApiCall');
  });

  it('should document querying records', () => {
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('getRecords');
    expect(content).toContain('getRecordsByCategory');
    expect(content).toContain('getRecordsByEndpoint');
    expect(content).toContain('getRecordsSince');
    expect(content).toContain('recordCount');
  });

  it('should document reports and summaries', () => {
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('getSummary');
    expect(content).toContain('getCategorySummary');
    expect(content).toContain('getEndpointSummary');
    expect(content).toContain('getCallRate');
    expect(content).toContain('getReport');
  });

  it('should document report fields (percentiles, rates, tokens)', () => {
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('p50');
    expect(content).toContain('p95');
    expect(content).toContain('p99');
    expect(content).toContain('callsPerMinute');
    expect(content).toContain('tokensPerSecond');
  });

  it('should document configuration options', () => {
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('maxRecords');
    expect(content).toContain('10_000');
  });

  it('should document agent integration pattern', () => {
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('Integration with Agents');
    expect(content).toContain("agent.on('agent:llm:start'");
    expect(content).toContain("agent.on('agent:llm:complete'");
  });

  it('should document exporting metrics to JSON', () => {
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('Exporting Metrics');
    expect(content).toContain('Object.fromEntries');
    expect(content).toContain('JSON.stringify');
  });

  it('should document the reset method', () => {
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('reset()');
  });

  it('should link to the API reference', () => {
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('api-reference.md#performancemetricstracker');
  });
});

describe('API reference — PerformanceMetricsTracker section', () => {
  const filePath = join(docsRoot, 'api-reference.md');

  it('should have a PerformanceMetricsTracker section', () => {
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('### PerformanceMetricsTracker');
  });

  it('should document the constructor with config type', () => {
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('new PerformanceMetricsTracker(config?: PerformanceMetricsTrackerConfig)');
  });

  it('should document all public methods', () => {
    const content = readFileSync(filePath, 'utf-8');
    const methods = [
      'recordApiCall',
      'startTimer',
      'timeApiCall',
      'getRecords',
      'getRecordsByCategory',
      'getRecordsByEndpoint',
      'getRecordsSince',
      'getSummary',
      'getCategorySummary',
      'getEndpointSummary',
      'getCallRate',
      'getReport',
      'reset',
    ];
    for (const method of methods) {
      expect(content).toContain(`\`${method}\``);
    }
  });

  it('should document ApiCallInput interface', () => {
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('#### ApiCallInput');
  });

  it('should document ApiCallRecord interface', () => {
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('#### ApiCallRecord');
  });

  it('should document ApiCallSummary interface', () => {
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('#### ApiCallSummary');
  });

  it('should document PerformanceMetricsReport interface', () => {
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('#### PerformanceMetricsReport');
  });

  it('should document ApiCallTimer class', () => {
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('### ApiCallTimer');
  });

  it('should document ApiCallCategory enum', () => {
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('### ApiCallCategory');
    expect(content).toContain("`'llm'`");
    expect(content).toContain("`'tool'`");
    expect(content).toContain("`'http'`");
    expect(content).toContain("`'custom'`");
  });

  it('should document computeApiCallSummary function', () => {
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('### computeApiCallSummary');
  });

  it('should include Performance Metrics in the table of contents', () => {
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('- [Performance Metrics](#performance-metrics)');
    expect(content).toContain('- [PerformanceMetricsTracker](#performancemetricstracker)');
  });

  it('should link to the guide page', () => {
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('guide/performance-metrics.md');
  });
});

describe('VitePress sidebar includes Performance Metrics', () => {
  it('should have Performance Metrics in the sidebar', async () => {
    const configPath = join(docsRoot, '.vitepress', 'config.mts');
    const config = (await import(configPath)).default;
    const sidebar = config.themeConfig?.sidebar;

    const perfSection = sidebar.find(
      (s: { text: string }) => s.text === 'Performance',
    );
    expect(perfSection).toBeDefined();

    const itemTexts = perfSection.items.map(
      (item: { text: string }) => item.text,
    );
    expect(itemTexts).toContain('Performance Metrics');

    const perfMetricsItem = perfSection.items.find(
      (item: { text: string }) => item.text === 'Performance Metrics',
    );
    expect(perfMetricsItem.link).toBe('/guide/performance-metrics');
  });
});

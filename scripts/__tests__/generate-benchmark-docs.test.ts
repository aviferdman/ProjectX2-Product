import { describe, it, expect } from 'vitest';
import {
  categorize,
  groupByCategory,
  generateBenchmarkDocs,
  loadDetailedResults,
  loadBaseline,
  type DetailedResult,
  type Baseline,
} from '../generate-benchmark-docs.js';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makeResult(overrides: Partial<DetailedResult> = {}): DetailedResult {
  return {
    name: 'Test benchmark',
    iterations: 1000,
    totalMs: 10,
    avgMs: 0.01,
    minMs: 0.001,
    maxMs: 0.5,
    p50Ms: 0.008,
    p95Ms: 0.02,
    p99Ms: 0.05,
    opsPerSecond: 100000,
    budget: 50,
    withinBudget: true,
    ...overrides,
  };
}

function makeBaseline(): Baseline {
  return {
    version: 1,
    timestamp: '2026-04-06T12:00:00.000Z',
    entries: {
      'Agent init (minimal config)': { p95Ms: 0.1, avgMs: 0.05, budget: 100 },
    },
  };
}

// ---------------------------------------------------------------------------
// categorize()
// ---------------------------------------------------------------------------

describe('categorize', () => {
  it('should categorize agent benchmarks', () => {
    expect(categorize('Agent init (minimal config)')).toBe('Agent Initialization');
    expect(categorize('Agent.buildSystemPrompt (10 tools)')).toBe('Agent Initialization');
  });

  it('should categorize memory benchmarks', () => {
    expect(categorize('Memory add (empty store)')).toBe('Memory Operations');
    expect(categorize('Memory search (500 entries, text match)')).toBe('Memory Operations');
  });

  it('should categorize task benchmarks', () => {
    expect(categorize('Task init (minimal config)')).toBe('Task Lifecycle');
    expect(categorize('Task state transitions (full lifecycle)')).toBe('Task Lifecycle');
  });

  it('should categorize engine benchmarks', () => {
    expect(categorize('Engine init (minimal config)')).toBe('Execution Engine');
    expect(categorize('Engine run (5 sequential tasks)')).toBe('Execution Engine');
  });

  it('should categorize tool benchmarks', () => {
    expect(categorize('Tool execute (simple, no validation)')).toBe('Tool System');
    expect(categorize('ToolExecutor construction')).toBe('Tool System');
    expect(categorize('ToolRegistry.get (100 tools)')).toBe('Tool System');
  });

  it('should categorize cross-framework comparison benchmarks', () => {
    expect(categorize('Crewspace: Research Assistant Workflow')).toBe('Cross-Framework Comparison');
    expect(categorize('LangChain.js: Research Assistant Workflow')).toBe('Cross-Framework Comparison');
    expect(categorize('CrewAI: Research Assistant Workflow')).toBe('Cross-Framework Comparison');
  });

  it('should default to Other for unknown names', () => {
    expect(categorize('Something unknown')).toBe('Other');
  });
});

// ---------------------------------------------------------------------------
// groupByCategory()
// ---------------------------------------------------------------------------

describe('groupByCategory', () => {
  it('should group results by category', () => {
    const results: DetailedResult[] = [
      makeResult({ name: 'Agent init (minimal config)' }),
      makeResult({ name: 'Agent init (with backstory)' }),
      makeResult({ name: 'Memory add (empty store)' }),
      makeResult({ name: 'Tool execute (simple, no validation)' }),
    ];

    const groups = groupByCategory(results);

    expect(groups.length).toBe(3);
    expect(groups[0]!.name).toBe('Agent Initialization');
    expect(groups[0]!.results.length).toBe(2);
    expect(groups[1]!.name).toBe('Memory Operations');
    expect(groups[1]!.results.length).toBe(1);
    expect(groups[2]!.name).toBe('Tool System');
    expect(groups[2]!.results.length).toBe(1);
  });

  it('should follow the predefined category order', () => {
    const results: DetailedResult[] = [
      makeResult({ name: 'Tool execute (simple)' }),
      makeResult({ name: 'Agent init (minimal config)' }),
      makeResult({ name: 'Engine init (minimal config)' }),
      makeResult({ name: 'Task init (minimal config)' }),
      makeResult({ name: 'Memory add (empty store)' }),
    ];

    const groups = groupByCategory(results);
    const categoryNames = groups.map((g) => g.name);

    expect(categoryNames).toEqual([
      'Agent Initialization',
      'Task Lifecycle',
      'Execution Engine',
      'Memory Operations',
      'Tool System',
    ]);
  });

  it('should return empty array for empty input', () => {
    expect(groupByCategory([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// generateBenchmarkDocs()
// ---------------------------------------------------------------------------

describe('generateBenchmarkDocs', () => {
  const sampleResults: DetailedResult[] = [
    makeResult({ name: 'Agent init (minimal config)', avgMs: 0.01, p95Ms: 0.017, budget: 100 }),
    makeResult({ name: 'Memory add (empty store)', avgMs: 0.009, p95Ms: 0.012, budget: 50 }),
    makeResult({ name: 'Task init (minimal config)', avgMs: 0.01, p95Ms: 0.017, budget: 100 }),
    makeResult({ name: 'Engine init (minimal config)', avgMs: 0.005, p95Ms: 0.006, budget: 100 }),
    makeResult({ name: 'Tool execute (simple, no validation)', avgMs: 0.002, p95Ms: 0.003, budget: 50 }),
    makeResult({
      name: 'Crewspace: Research Assistant Workflow',
      avgMs: 0.2,
      p95Ms: 0.297,
      budget: 5000,
    }),
  ];

  it('should generate markdown with title', () => {
    const md = generateBenchmarkDocs(sampleResults);
    expect(md).toContain('# Benchmarks');
  });

  it('should include the summary section', () => {
    const md = generateBenchmarkDocs(sampleResults);
    expect(md).toContain('## Summary');
    expect(md).toContain('**Total benchmarks:** 6');
    expect(md).toContain('**Passing:** 6 / 6');
    expect(md).toContain('✅ All within budget');
  });

  it('should include baseline timestamp when baseline is provided', () => {
    const baseline = makeBaseline();
    const md = generateBenchmarkDocs(sampleResults, baseline);
    expect(md).toContain('**Baseline timestamp:** 2026-04-06T12:00:00.000Z');
  });

  it('should not include baseline timestamp when no baseline', () => {
    const md = generateBenchmarkDocs(sampleResults);
    expect(md).not.toContain('Baseline timestamp');
  });

  it('should include methodology section', () => {
    const md = generateBenchmarkDocs(sampleResults);
    expect(md).toContain('## Methodology');
    expect(md).toContain('### Measurement Approach');
    expect(md).toContain('### Performance Budgets');
    expect(md).toContain('### Regression Detection');
    expect(md).toContain('### Environment');
  });

  it('should include methodology details', () => {
    const md = generateBenchmarkDocs(sampleResults);
    expect(md).toContain('Warmup');
    expect(md).toContain('performance.now()');
    expect(md).toContain('p95 latency budget');
    expect(md).toContain('baseline.json');
  });

  it('should include results tables for each category', () => {
    const md = generateBenchmarkDocs(sampleResults);
    expect(md).toContain('### Agent Initialization');
    expect(md).toContain('### Memory Operations');
    expect(md).toContain('### Task Lifecycle');
    expect(md).toContain('### Execution Engine');
    expect(md).toContain('### Tool System');
  });

  it('should include framework comparison summary', () => {
    const md = generateBenchmarkDocs(sampleResults);
    expect(md).toContain('### Framework Overhead Comparison');
    expect(md).toContain('Crewspace');
  });

  it('should include cross-framework comparison methodology', () => {
    const md = generateBenchmarkDocs(sampleResults);
    expect(md).toContain('## Cross-Framework Comparison Methodology');
    expect(md).toContain('LangChain.js');
    expect(md).toContain('CrewAI');
    expect(md).toContain('behavioral shim');
  });

  it('should include running instructions', () => {
    const md = generateBenchmarkDocs(sampleResults);
    expect(md).toContain('## Running Benchmarks');
    expect(md).toContain('npm run bench');
    expect(md).toContain('generate-benchmark-docs.ts');
  });

  it('should show failure status when benchmarks exceed budget', () => {
    const failingResults = [
      makeResult({ name: 'Agent init (minimal config)', p95Ms: 200, budget: 100, withinBudget: false }),
    ];

    const md = generateBenchmarkDocs(failingResults);
    expect(md).toContain('❌ Some benchmarks exceed budget');
    expect(md).toContain('❌');
  });

  it('should format operations per second in human-readable units', () => {
    const results = [
      makeResult({ name: 'Memory count (500 entries)', opsPerSecond: 2_610_000 }),
      makeResult({ name: 'Agent init (minimal config)', opsPerSecond: 99_700 }),
      makeResult({ name: 'Engine run (10 sequential tasks)', opsPerSecond: 500 }),
    ];

    const md = generateBenchmarkDocs(results);
    expect(md).toContain('2.6M');
    expect(md).toContain('99.7K');
    expect(md).toContain('500');
  });
});

// ---------------------------------------------------------------------------
// Integration: generated docs file
// ---------------------------------------------------------------------------

describe('generated benchmark docs file', () => {
  const docsRoot = resolve(__dirname, '..', '..', 'docs');
  const benchmarksPath = join(docsRoot, 'guide', 'benchmarks.md');

  it('should exist at docs/guide/benchmarks.md', () => {
    expect(existsSync(benchmarksPath)).toBe(true);
  });

  it('should contain the expected title', () => {
    const content = readFileSync(benchmarksPath, 'utf-8');
    expect(content).toContain('# Benchmarks');
  });

  it('should contain methodology section', () => {
    const content = readFileSync(benchmarksPath, 'utf-8');
    expect(content).toContain('## Methodology');
  });

  it('should contain results section', () => {
    const content = readFileSync(benchmarksPath, 'utf-8');
    expect(content).toContain('## Results');
  });

  it('should contain benchmark result tables', () => {
    const content = readFileSync(benchmarksPath, 'utf-8');
    expect(content).toContain('| Benchmark |');
    expect(content).toContain('Avg (ms)');
    expect(content).toContain('p95 (ms)');
    expect(content).toContain('Budget (ms)');
  });
});

// ---------------------------------------------------------------------------
// I/O functions (with real fixture data)
// ---------------------------------------------------------------------------

describe('loadDetailedResults', () => {
  const fixtureDir = resolve(__dirname, '..', '..', 'packages', 'core');

  it('should load JSONL results from the benchmark output', () => {
    const resultsPath = join(fixtureDir, 'benchmark-results-detailed.jsonl');
    if (!existsSync(resultsPath)) return; // skip if no results file

    const results = loadDetailedResults(resultsPath);
    expect(results.length).toBeGreaterThan(0);

    for (const r of results) {
      expect(r.name).toBeTruthy();
      expect(typeof r.avgMs).toBe('number');
      expect(typeof r.p95Ms).toBe('number');
      expect(typeof r.budget).toBe('number');
      expect(typeof r.withinBudget).toBe('boolean');
    }
  });
});

describe('loadBaseline', () => {
  const fixtureDir = resolve(__dirname, '..', '..', 'packages', 'core', 'benchmarks');

  it('should load the baseline JSON file', () => {
    const baselinePath = join(fixtureDir, 'baseline.json');
    if (!existsSync(baselinePath)) return;

    const baseline = loadBaseline(baselinePath);
    expect(baseline.version).toBe(1);
    expect(typeof baseline.timestamp).toBe('string');
    expect(Object.keys(baseline.entries).length).toBeGreaterThan(0);
  });
});

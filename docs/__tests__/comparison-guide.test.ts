import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const docsRoot = resolve(__dirname, '..');
const comparisonPath = join(docsRoot, 'guide', 'comparison.md');

function getContent(): string {
  return readFileSync(comparisonPath, 'utf-8');
}

describe('Comparison guide content', () => {
  const content = getContent();

  it('should have a top-level heading', () => {
    expect(content).toMatch(/^# Framework Comparison/m);
  });

  it('should include an at-a-glance summary table', () => {
    expect(content).toContain('At a Glance');
    expect(content).toContain('| Feature |');
  });

  it('should cover CrewAI comparison', () => {
    expect(content).toContain('Crewspace vs CrewAI');
    expect(content).toContain('Where Crewspace excels');
    expect(content).toContain('Where CrewAI excels');
    expect(content).toContain('When to choose');
  });

  it('should cover LangChain comparison', () => {
    expect(content).toContain('Crewspace vs LangChain');
    expect(content).toContain('Where LangChain excels');
  });

  it('should cover AutoGen comparison', () => {
    expect(content).toContain('Crewspace vs AutoGen');
    expect(content).toContain('Where AutoGen excels');
  });

  it('should include code comparison snippets for each framework', () => {
    // CrewAI Python snippet
    expect(content).toContain('from crewai import');
    // LangChain snippet
    expect(content).toContain('langchain');
    // AutoGen snippet
    expect(content).toContain('from autogen import');
    // Crewspace snippets
    expect(content).toContain("from '@crewspace/core'");
  });

  it('should include architecture comparison section', () => {
    expect(content).toContain('Architecture Comparison');
    expect(content).toContain('Execution model');
    expect(content).toContain('Error handling');
    expect(content).toContain('Observability');
  });

  it('should include a decision matrix', () => {
    expect(content).toContain('Decision Matrix');
    expect(content).toContain('| Use Case |');
  });

  it('should have a summary section', () => {
    expect(content).toContain('## Summary');
  });

  it('should mention key Crewspace differentiators', () => {
    expect(content).toContain('TypeScript');
    expect(content).toContain('type-safe');
    expect(content).toContain('Zod');
    expect(content).toContain('EventEmitter');
  });

  it('should link to getting started guide', () => {
    expect(content).toContain('/getting-started');
  });
});

describe('Comparison guide structure', () => {
  const content = getContent();

  it('should have balanced pros/cons for each framework', () => {
    const crewaiExcels = content.includes('Where CrewAI excels');
    const langchainExcels = content.includes('Where LangChain excels');
    const autogenExcels = content.includes('Where AutoGen excels');

    expect(crewaiExcels).toBe(true);
    expect(langchainExcels).toBe(true);
    expect(autogenExcels).toBe(true);
  });

  it('should have "when to choose" guidance for each comparison', () => {
    const whenToChooseCount = (content.match(/### When to choose/g) || []).length;
    expect(whenToChooseCount).toBe(3);
  });

  it('should have code comparison sections for each framework', () => {
    const codeComparisonCount = (content.match(/### Code comparison/g) || []).length;
    expect(codeComparisonCount).toBe(3);
  });
});

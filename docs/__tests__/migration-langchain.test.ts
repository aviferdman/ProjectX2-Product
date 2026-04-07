import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const docsRoot = resolve(__dirname, '..');
const migrationPath = join(docsRoot, 'guide', 'migration-langchain.md');

function getContent(): string {
  return readFileSync(migrationPath, 'utf-8');
}

describe('LangChain migration guide existence', () => {
  it('should exist at docs/guide/migration-langchain.md', () => {
    expect(existsSync(migrationPath)).toBe(true);
  });
});

describe('LangChain migration guide content', () => {
  const content = getContent();

  it('should have a top-level heading', () => {
    expect(content).toMatch(/^# Migrating from LangChain/m);
  });

  it('should include a concept mapping table', () => {
    expect(content).toContain('Concept Mapping');
    expect(content).toContain('LangChain Concept');
    expect(content).toContain('Crewspace Equivalent');
  });

  it('should include installation instructions', () => {
    expect(content).toContain('## Installation');
    expect(content).toContain('npm uninstall');
    expect(content).toContain('npm install @crewspace/core');
  });

  it('should cover LLM provider migration', () => {
    expect(content).toContain('Migrating LLM Providers');
    expect(content).toContain('ChatOpenAI');
    expect(content).toContain('createOpenAIProvider');
    expect(content).toContain('ChatAnthropic');
    expect(content).toContain('createAnthropicProvider');
  });

  it('should cover tool migration', () => {
    expect(content).toContain('Migrating Tools');
    expect(content).toContain('StructuredTool');
    expect(content).toContain('defineTool');
  });

  it('should cover agent migration', () => {
    expect(content).toContain('Migrating Agents');
    expect(content).toContain('AgentExecutor');
    expect(content).toContain('new Agent(');
  });

  it('should cover chain-to-crew migration', () => {
    expect(content).toContain('Migrating Chains to Crews');
    expect(content).toContain('RunnableSequence');
    expect(content).toContain('new Crew(');
  });

  it('should cover parallel execution migration', () => {
    expect(content).toContain('Migrating Parallel Execution');
    expect(content).toContain('RunnableParallel');
    expect(content).toContain('ExecutionEngine');
  });

  it('should cover callback-to-event migration', () => {
    expect(content).toContain('Migrating Callbacks to Events');
    expect(content).toContain('BaseCallbackHandler');
    expect(content).toContain('.on(');
  });

  it('should cover streaming migration', () => {
    expect(content).toContain('Migrating Streaming');
    expect(content).toContain('generateStream');
  });

  it('should include a migration checklist', () => {
    expect(content).toContain('Migration Checklist');
    expect(content).toContain('- [ ]');
  });

  it('should document what Crewspace does not replace', () => {
    expect(content).toContain('What Crewspace Does Not Replace');
    expect(content).toContain('Document loaders');
    expect(content).toContain('Vector stores');
    expect(content).toContain('LCEL');
    expect(content).toContain('LangSmith');
    expect(content).toContain('Memory');
  });

  it('should include a RAG workaround tip', () => {
    expect(content).toContain('Need RAG?');
    expect(content).toContain('similaritySearch');
  });

  it('should include getting help links', () => {
    expect(content).toContain('Getting Help');
    expect(content).toContain('/getting-started');
    expect(content).toContain('/guide/core-concepts');
    expect(content).toContain('/guide/tools');
    expect(content).toContain('/guide/comparison');
  });
});

describe('LangChain migration guide code examples', () => {
  const content = getContent();

  it('should have before/after code examples for each section', () => {
    const beforeCount = (content.match(/### Before \(LangChain\)/g) || []).length;
    const afterCount = (content.match(/### After \(Crewspace\)/g) || []).length;

    expect(beforeCount).toBeGreaterThanOrEqual(5);
    expect(afterCount).toBeGreaterThanOrEqual(5);
    expect(beforeCount).toBe(afterCount);
  });

  it('should include LangChain import statements in before examples', () => {
    expect(content).toContain("from '@langchain/openai'");
    expect(content).toContain("from '@langchain/core");
    expect(content).toContain("from 'langchain/agents'");
  });

  it('should include Crewspace import statements in after examples', () => {
    expect(content).toContain("from '@crewspace/core'");
  });

  it('should have key differences callouts after code examples', () => {
    const keyDifferences = (content.match(/\*\*Key differences:\*\*/g) || []).length;
    expect(keyDifferences).toBeGreaterThanOrEqual(3);
  });
});

describe('LangChain migration guide structure', () => {
  const content = getContent();

  it('should have a logical section order', () => {
    const sections = [
      'Concept Mapping',
      'Installation',
      'Migrating LLM Providers',
      'Migrating Tools',
      'Migrating Agents',
      'Migrating Chains to Crews',
      'Migrating Parallel Execution',
      'Migrating Callbacks to Events',
      'Migrating Streaming',
      'Migration Checklist',
      'What Crewspace Does Not Replace',
      'Getting Help',
    ];

    let lastIndex = -1;
    for (const section of sections) {
      const index = content.indexOf(section);
      expect(index, `Section "${section}" should exist`).toBeGreaterThan(-1);
      expect(index, `Section "${section}" should come after previous section`).toBeGreaterThan(
        lastIndex,
      );
      lastIndex = index;
    }
  });

  it('should include resilience decorator migration', () => {
    expect(content).toContain('createRetryProvider');
    expect(content).toContain('createFallbackProvider');
    expect(content).toContain('createUsageTrackingProvider');
  });

  it('should reference the comparison guide', () => {
    expect(content).toContain('/guide/comparison');
  });
});

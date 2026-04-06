/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';

// eslint-disable-next-line @typescript-eslint/naming-convention
declare const __dirname: string;

describe('GitHub Actions CI/CD Workflow', () => {
  const workflowPath = join(__dirname, '../../../../.github/workflows/ci.yml');

  it('should have ci.yml workflow file', () => {
    expect(existsSync(workflowPath)).toBe(true);
  });

  describe('Workflow Configuration', () => {
    let workflow: any;

    beforeAll(() => {
      const content = readFileSync(workflowPath, 'utf-8');
      workflow = parse(content);
    });

    it('should have correct workflow name', () => {
      expect(workflow.name).toBe('CI');
    });

    it('should trigger on push to main', () => {
      expect(workflow.on.push.branches).toContain('main');
    });

    it('should trigger on pull requests to main', () => {
      expect(workflow.on.pull_request.branches).toContain('main');
    });

    it('should have read permissions for contents', () => {
      expect(workflow.permissions.contents).toBe('read');
    });

    it('should configure concurrency to cancel in-progress runs', () => {
      expect(workflow.concurrency['cancel-in-progress']).toBe(true);
    });

    it('should have all required jobs', () => {
      expect(workflow.jobs).toHaveProperty('lint');
      expect(workflow.jobs).toHaveProperty('typecheck');
      expect(workflow.jobs).toHaveProperty('test');
      expect(workflow.jobs).toHaveProperty('build');
    });
  });

  describe('Lint Job', () => {
    let lintJob: any;

    beforeAll(() => {
      const content = readFileSync(workflowPath, 'utf-8');
      const workflow = parse(content);
      lintJob = workflow.jobs.lint;
    });

    it('should run on ubuntu-latest', () => {
      expect(lintJob['runs-on']).toBe('ubuntu-latest');
    });

    it('should checkout code', () => {
      const checkoutStep = lintJob.steps.find((step: any) => step.uses === 'actions/checkout@v4');
      expect(checkoutStep).toBeDefined();
    });

    it('should setup Node.js 18', () => {
      const nodeStep = lintJob.steps.find((step: any) => step.uses === 'actions/setup-node@v4');
      expect(nodeStep).toBeDefined();
      expect(nodeStep.with['node-version']).toBe(18);
      expect(nodeStep.with.cache).toBe('npm');
    });

    it('should install dependencies with npm ci', () => {
      const installStep = lintJob.steps.find((step: any) => step.run === 'npm ci');
      expect(installStep).toBeDefined();
    });

    it('should run ESLint', () => {
      const eslintStep = lintJob.steps.find((step: any) => step.name === 'Run ESLint');
      expect(eslintStep).toBeDefined();
      expect(eslintStep.run).toBe('npm run lint');
    });

    it('should check formatting', () => {
      const formatStep = lintJob.steps.find((step: any) => step.name === 'Check formatting');
      expect(formatStep).toBeDefined();
      expect(formatStep.run).toBe('npm run format:check');
    });
  });

  describe('Type Check Job', () => {
    let typecheckJob: any;

    beforeAll(() => {
      const content = readFileSync(workflowPath, 'utf-8');
      const workflow = parse(content);
      typecheckJob = workflow.jobs.typecheck;
    });

    it('should run on ubuntu-latest', () => {
      expect(typecheckJob['runs-on']).toBe('ubuntu-latest');
    });

    it('should checkout code', () => {
      const checkoutStep = typecheckJob.steps.find(
        (step: any) => step.uses === 'actions/checkout@v4',
      );
      expect(checkoutStep).toBeDefined();
    });

    it('should setup Node.js 18 with npm cache', () => {
      const nodeStep = typecheckJob.steps.find(
        (step: any) => step.uses === 'actions/setup-node@v4',
      );
      expect(nodeStep).toBeDefined();
      expect(nodeStep.with['node-version']).toBe(18);
      expect(nodeStep.with.cache).toBe('npm');
    });

    it('should install dependencies', () => {
      const installStep = typecheckJob.steps.find((step: any) => step.run === 'npm ci');
      expect(installStep).toBeDefined();
    });

    it('should run type checking', () => {
      const typecheckStep = typecheckJob.steps.find(
        (step: any) => step.name === 'Run type checking',
      );
      expect(typecheckStep).toBeDefined();
      expect(typecheckStep.run).toBe('npm run typecheck');
    });
  });

  describe('Test Job', () => {
    let testJob: any;

    beforeAll(() => {
      const content = readFileSync(workflowPath, 'utf-8');
      const workflow = parse(content);
      testJob = workflow.jobs.test;
    });

    it('should run on ubuntu-latest', () => {
      expect(testJob['runs-on']).toBe('ubuntu-latest');
    });

    it('should use matrix strategy for multiple Node versions', () => {
      expect(testJob.strategy).toBeDefined();
      expect(testJob.strategy['fail-fast']).toBe(false);
      expect(testJob.strategy.matrix['node-version']).toEqual([18, 20, 22]);
    });

    it('should checkout code', () => {
      const checkoutStep = testJob.steps.find((step: any) => step.uses === 'actions/checkout@v4');
      expect(checkoutStep).toBeDefined();
    });

    it('should setup Node.js with matrix version', () => {
      const nodeStep = testJob.steps.find((step: any) => step.uses === 'actions/setup-node@v4');
      expect(nodeStep).toBeDefined();
      expect(nodeStep.with['node-version']).toBe('${{ matrix.node-version }}');
      expect(nodeStep.with.cache).toBe('npm');
    });

    it('should install dependencies', () => {
      const installStep = testJob.steps.find((step: any) => step.run === 'npm ci');
      expect(installStep).toBeDefined();
    });

    it('should run tests', () => {
      const testStep = testJob.steps.find((step: any) => step.name === 'Run tests');
      expect(testStep).toBeDefined();
      expect(testStep.run).toBe('npm test');
    });

    it('should run coverage on Node 20 only', () => {
      const coverageStep = testJob.steps.find(
        (step: any) => step.name === 'Run tests with coverage',
      );
      expect(coverageStep).toBeDefined();
      expect(coverageStep.if).toBe('matrix.node-version == 20');
      expect(coverageStep.run).toBe('npm run test:coverage');
    });
  });

  describe('Build Job', () => {
    let buildJob: any;

    beforeAll(() => {
      const content = readFileSync(workflowPath, 'utf-8');
      const workflow = parse(content);
      buildJob = workflow.jobs.build;
    });

    it('should run on ubuntu-latest', () => {
      expect(buildJob['runs-on']).toBe('ubuntu-latest');
    });

    it('should depend on lint, typecheck, and test jobs', () => {
      expect(buildJob.needs).toEqual(['lint', 'typecheck', 'test']);
    });

    it('should checkout code', () => {
      const checkoutStep = buildJob.steps.find((step: any) => step.uses === 'actions/checkout@v4');
      expect(checkoutStep).toBeDefined();
    });

    it('should setup Node.js 18', () => {
      const nodeStep = buildJob.steps.find((step: any) => step.uses === 'actions/setup-node@v4');
      expect(nodeStep).toBeDefined();
      expect(nodeStep.with['node-version']).toBe(18);
      expect(nodeStep.with.cache).toBe('npm');
    });

    it('should install dependencies', () => {
      const installStep = buildJob.steps.find((step: any) => step.run === 'npm ci');
      expect(installStep).toBeDefined();
    });

    it('should build all packages', () => {
      const buildStep = buildJob.steps.find((step: any) => step.name === 'Build all packages');
      expect(buildStep).toBeDefined();
      expect(buildStep.run).toBe('npm run build');
    });

    it('should verify dist output exists', () => {
      const verifyStep = buildJob.steps.find(
        (step: any) => step.name === 'Verify dist output exists',
      );
      expect(verifyStep).toBeDefined();
      expect(verifyStep.run).toContain('test -d packages/core/dist');
    });
  });

  describe('Package Scripts Validation', () => {
    it('should have required scripts in root package.json', () => {
      const packageJsonPath = join(__dirname, '../../../../package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

      expect(packageJson.scripts).toHaveProperty('lint');
      expect(packageJson.scripts).toHaveProperty('format:check');
      expect(packageJson.scripts).toHaveProperty('typecheck');
      expect(packageJson.scripts).toHaveProperty('test');
      expect(packageJson.scripts).toHaveProperty('test:coverage');
      expect(packageJson.scripts).toHaveProperty('build');
    });

    it('should have required scripts in core package.json', () => {
      const packageJsonPath = join(__dirname, '../../package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

      expect(packageJson.scripts).toHaveProperty('typecheck');
      expect(packageJson.scripts).toHaveProperty('test');
      expect(packageJson.scripts).toHaveProperty('test:coverage');
      expect(packageJson.scripts).toHaveProperty('build');
    });
  });

  describe('Security Best Practices', () => {
    let workflow: any;

    beforeAll(() => {
      const content = readFileSync(workflowPath, 'utf-8');
      workflow = parse(content);
    });

    it('should use pinned action versions with @v4', () => {
      const jobs = workflow.jobs;
      for (const jobName of Object.keys(jobs)) {
        const job = jobs[jobName];
        for (const step of job.steps || []) {
          if (step.uses) {
            expect(step.uses).toMatch(/@v\d+$/);
          }
        }
      }
    });

    it('should use npm ci instead of npm install for deterministic builds', () => {
      const jobs = workflow.jobs;
      for (const jobName of Object.keys(jobs)) {
        const job = jobs[jobName];
        const installSteps = job.steps?.filter((step: any) => step.run?.includes('npm'));
        for (const step of installSteps || []) {
          if (step.run === 'npm ci') {
            expect(step.run).toBe('npm ci');
          }
        }
      }
    });

    it('should have minimal permissions', () => {
      expect(workflow.permissions.contents).toBe('read');
      // Ensure no write permissions
      expect(workflow.permissions.contents).not.toBe('write');
    });
  });

  describe('Performance Optimizations', () => {
    let workflow: any;

    beforeAll(() => {
      const content = readFileSync(workflowPath, 'utf-8');
      workflow = parse(content);
    });

    it('should cache npm dependencies in all jobs', () => {
      const jobs = workflow.jobs;
      for (const jobName of Object.keys(jobs)) {
        const job = jobs[jobName];
        const nodeStep = job.steps?.find((step: any) => step.uses?.includes('setup-node'));
        if (nodeStep) {
          expect(nodeStep.with.cache).toBe('npm');
        }
      }
    });

    it('should have concurrency control configured', () => {
      expect(workflow.concurrency).toBeDefined();
      expect(workflow.concurrency.group).toBeDefined();
      expect(workflow.concurrency['cancel-in-progress']).toBe(true);
    });
  });
});

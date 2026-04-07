/**
 * Tests for TASK-069: Checkpoint/Resume system with SQLite
 *
 * Validates the CheckpointStore and CheckpointManager: persistence,
 * retrieval, resume plan building, and lifecycle management.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { CheckpointStore } from '../../../src/engine/checkpoint-store.js';
import { CheckpointManager } from '../../../src/engine/checkpoint-manager.js';
import { ExecutionEngine } from '../../../src/engine/execution-engine.js';
import { Task } from '../../../src/task/task.js';
import { Agent } from '../../../src/agent/agent.js';
import { EngineStatus, ExecutionStrategy } from '../../../src/engine/types.js';
import { TaskStatus, TaskPriority } from '../../../src/types/task.js';
import type { CheckpointData, CheckpointTaskState } from '../../../src/engine/checkpoint-types.js';
import type { TaskResult } from '../../../src/types/task.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTaskResult(agentId: string, output = 'done'): TaskResult {
  return { output, agentId, duration: 100 };
}

function makeCheckpointData(overrides?: Partial<CheckpointData>): CheckpointData {
  const defaults: CheckpointData = {
    id: `cp-test-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    engineId: 'test-engine',
    engineStatus: EngineStatus.COMPLETED,
    strategy: ExecutionStrategy.SEQUENTIAL,
    taskErrorPolicy: 'fail-fast',
    createdAt: new Date().toISOString(),
    tasks: [
      {
        taskId: 'task-a',
        status: TaskStatus.COMPLETED,
        agentId: 'agent-1',
        dependencies: [],
        result: makeTaskResult('agent-1', 'Result A'),
        errorMessage: undefined,
      },
      {
        taskId: 'task-b',
        status: TaskStatus.PENDING,
        agentId: 'agent-1',
        dependencies: ['task-a'],
        result: undefined,
        errorMessage: undefined,
      },
    ],
    status: 'active',
  };

  return { ...defaults, ...overrides };
}

function makeMockAgent(id: string): Agent {
  return new Agent({
    id,
    role: 'Test Agent',
    goal: 'Help with testing',
  });
}

function makeMockTask(id: string, agentId: string, deps: string[] = []): Task {
  return new Task({
    id,
    description: `Task ${id}`,
    expectedOutput: `Output for ${id}`,
    agentId,
    dependencies: deps,
  });
}

// ===========================================================================
// CheckpointStore
// ===========================================================================

describe('TASK-069: CheckpointStore — SQLite checkpoint persistence', () => {
  let store: CheckpointStore;

  beforeEach(() => {
    store = new CheckpointStore({ dbPath: ':memory:' });
  });

  afterEach(() => {
    if (!store.closed) {
      store.close();
    }
  });

  // -------------------------------------------------------------------------
  // Constructor
  // -------------------------------------------------------------------------

  describe('constructor', () => {
    it('should create an in-memory store by default', () => {
      const s = new CheckpointStore();
      expect(s.closed).toBe(false);
      s.close();
    });

    it('should accept explicit :memory: path', () => {
      expect(store.closed).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // save + get
  // -------------------------------------------------------------------------

  describe('save and get', () => {
    it('should persist and retrieve a checkpoint', () => {
      const cp = makeCheckpointData();
      store.save(cp);

      const retrieved = store.get(cp.id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(cp.id);
      expect(retrieved!.engineId).toBe(cp.engineId);
      expect(retrieved!.engineStatus).toBe(cp.engineStatus);
      expect(retrieved!.strategy).toBe(cp.strategy);
      expect(retrieved!.taskErrorPolicy).toBe(cp.taskErrorPolicy);
      expect(retrieved!.status).toBe(cp.status);
      expect(retrieved!.tasks).toHaveLength(2);
    });

    it('should correctly serialize and deserialize task states', () => {
      const cp = makeCheckpointData();
      store.save(cp);

      const retrieved = store.get(cp.id)!;
      const taskA = retrieved.tasks.find((t) => t.taskId === 'task-a')!;
      expect(taskA.status).toBe(TaskStatus.COMPLETED);
      expect(taskA.agentId).toBe('agent-1');
      expect(taskA.dependencies).toEqual([]);
      expect(taskA.result).toEqual(makeTaskResult('agent-1', 'Result A'));
      expect(taskA.errorMessage).toBeUndefined();

      const taskB = retrieved.tasks.find((t) => t.taskId === 'task-b')!;
      expect(taskB.status).toBe(TaskStatus.PENDING);
      expect(taskB.dependencies).toEqual(['task-a']);
      expect(taskB.result).toBeUndefined();
    });

    it('should persist and retrieve metadata', () => {
      const cp = makeCheckpointData({
        metadata: { reason: 'test', count: 42 },
      });
      store.save(cp);

      const retrieved = store.get(cp.id)!;
      expect(retrieved.metadata).toEqual({ reason: 'test', count: 42 });
    });

    it('should return undefined for non-existent checkpoint', () => {
      expect(store.get('non-existent')).toBeUndefined();
    });

    it('should throw on duplicate checkpoint ID', () => {
      const cp = makeCheckpointData();
      store.save(cp);
      expect(() => store.save(cp)).toThrow('already exists');
    });
  });

  // -------------------------------------------------------------------------
  // getLatest
  // -------------------------------------------------------------------------

  describe('getLatest', () => {
    it('should return the most recent checkpoint for an engine', () => {
      const cp1 = makeCheckpointData({
        id: 'cp-1',
        createdAt: '2025-01-01T00:00:00.000Z',
      });
      const cp2 = makeCheckpointData({
        id: 'cp-2',
        createdAt: '2025-01-02T00:00:00.000Z',
      });

      store.save(cp1);
      store.save(cp2);

      const latest = store.getLatest('test-engine');
      expect(latest).toBeDefined();
      expect(latest!.id).toBe('cp-2');
    });

    it('should return undefined when no checkpoints exist', () => {
      expect(store.getLatest('no-engine')).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // list
  // -------------------------------------------------------------------------

  describe('list', () => {
    it('should list checkpoints in descending order', () => {
      for (let i = 0; i < 5; i++) {
        store.save(
          makeCheckpointData({
            id: `cp-${i}`,
            createdAt: `2025-01-0${i + 1}T00:00:00.000Z`,
          }),
        );
      }

      const list = store.list('test-engine');
      expect(list).toHaveLength(5);
      expect(list[0].id).toBe('cp-4');
      expect(list[4].id).toBe('cp-0');
    });

    it('should respect limit parameter', () => {
      for (let i = 0; i < 5; i++) {
        store.save(
          makeCheckpointData({
            id: `cp-${i}`,
            createdAt: `2025-01-0${i + 1}T00:00:00.000Z`,
          }),
        );
      }

      const list = store.list('test-engine', 2);
      expect(list).toHaveLength(2);
    });

    it('should only return checkpoints for the specified engine', () => {
      store.save(makeCheckpointData({ id: 'cp-a', engineId: 'engine-1' }));
      store.save(makeCheckpointData({ id: 'cp-b', engineId: 'engine-2' }));

      expect(store.list('engine-1')).toHaveLength(1);
      expect(store.list('engine-2')).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // updateStatus
  // -------------------------------------------------------------------------

  describe('updateStatus', () => {
    it('should update checkpoint status', () => {
      const cp = makeCheckpointData();
      store.save(cp);

      const updated = store.updateStatus(cp.id, 'resumed');
      expect(updated).toBe(true);

      const retrieved = store.get(cp.id)!;
      expect(retrieved.status).toBe('resumed');
    });

    it('should return false for non-existent checkpoint', () => {
      expect(store.updateStatus('non-existent', 'resumed')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // delete
  // -------------------------------------------------------------------------

  describe('delete', () => {
    it('should delete a checkpoint and its task states', () => {
      const cp = makeCheckpointData();
      store.save(cp);

      const deleted = store.delete(cp.id);
      expect(deleted).toBe(true);
      expect(store.get(cp.id)).toBeUndefined();
    });

    it('should return false for non-existent checkpoint', () => {
      expect(store.delete('non-existent')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // deleteAll
  // -------------------------------------------------------------------------

  describe('deleteAll', () => {
    it('should delete all checkpoints for an engine', () => {
      store.save(makeCheckpointData({ id: 'cp-a' }));
      store.save(makeCheckpointData({ id: 'cp-b' }));
      store.save(makeCheckpointData({ id: 'cp-other', engineId: 'other-engine' }));

      const count = store.deleteAll('test-engine');
      expect(count).toBe(2);
      expect(store.list('test-engine')).toHaveLength(0);
      expect(store.list('other-engine')).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // close
  // -------------------------------------------------------------------------

  describe('close', () => {
    it('should close the database and reject further operations', () => {
      store.close();
      expect(store.closed).toBe(true);
      expect(() => store.get('x')).toThrow('closed');
    });

    it('should be idempotent', () => {
      store.close();
      store.close(); // no-op
      expect(store.closed).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Task state with errors
  // -------------------------------------------------------------------------

  describe('task states with errors', () => {
    it('should persist failed task error messages', () => {
      const cp = makeCheckpointData({
        tasks: [
          {
            taskId: 'fail-task',
            status: TaskStatus.FAILED,
            agentId: 'agent-1',
            dependencies: [],
            result: undefined,
            errorMessage: 'Something went wrong',
          },
        ],
      });
      store.save(cp);

      const retrieved = store.get(cp.id)!;
      const task = retrieved.tasks[0];
      expect(task.status).toBe(TaskStatus.FAILED);
      expect(task.errorMessage).toBe('Something went wrong');
      expect(task.result).toBeUndefined();
    });
  });
});

// ===========================================================================
// CheckpointManager
// ===========================================================================

describe('TASK-069: CheckpointManager — High-level checkpoint/resume API', () => {
  let manager: CheckpointManager;
  let engine: ExecutionEngine;
  let agent: Agent;

  beforeEach(() => {
    manager = new CheckpointManager({ dbPath: ':memory:' });
    engine = new ExecutionEngine({
      id: 'test-engine',
      strategy: ExecutionStrategy.SEQUENTIAL,
    });
    agent = makeMockAgent('agent-1');
    engine.addAgent(agent);
  });

  afterEach(() => {
    manager.close();
  });

  // -------------------------------------------------------------------------
  // createCheckpoint
  // -------------------------------------------------------------------------

  describe('createCheckpoint', () => {
    it('should create a checkpoint from engine state', () => {
      const taskA = makeMockTask('task-a', 'agent-1');
      const taskB = makeMockTask('task-b', 'agent-1', ['task-a']);
      engine.addTask(taskA);
      engine.addTask(taskB);

      const cp = manager.createCheckpoint(engine);

      expect(cp.engineId).toBe('test-engine');
      expect(cp.strategy).toBe(ExecutionStrategy.SEQUENTIAL);
      expect(cp.taskErrorPolicy).toBe('fail-fast');
      expect(cp.tasks).toHaveLength(2);
      expect(cp.id).toMatch(/^cp-test-engine-/);
    });

    it('should capture task statuses accurately', () => {
      const taskA = makeMockTask('task-a', 'agent-1');
      engine.addTask(taskA);

      const cp = manager.createCheckpoint(engine);
      expect(cp.tasks[0].status).toBe(TaskStatus.PENDING);
    });

    it('should include user metadata', () => {
      engine.addTask(makeMockTask('task-a', 'agent-1'));
      const cp = manager.createCheckpoint(engine, { note: 'manual checkpoint' });
      expect(cp.metadata).toEqual({ note: 'manual checkpoint' });
    });

    it('should persist the checkpoint to the store', () => {
      engine.addTask(makeMockTask('task-a', 'agent-1'));
      const cp = manager.createCheckpoint(engine);

      const retrieved = manager.getCheckpoint(cp.id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(cp.id);
    });
  });

  // -------------------------------------------------------------------------
  // createCheckpointFromResult
  // -------------------------------------------------------------------------

  describe('createCheckpointFromResult', () => {
    it('should create checkpoint from a successful run result', () => {
      const taskA = makeMockTask('task-a', 'agent-1');
      const taskB = makeMockTask('task-b', 'agent-1', ['task-a']);
      engine.addTask(taskA);
      engine.addTask(taskB);

      const resultA = makeTaskResult('agent-1', 'Result A');
      const resultB = makeTaskResult('agent-1', 'Result B');

      const runResult = {
        engineId: 'test-engine',
        taskResults: new Map([
          ['task-a', resultA],
          ['task-b', resultB],
        ]),
        failedTasks: new Map<string, Error>(),
        duration: 200,
        success: true,
        strategy: ExecutionStrategy.SEQUENTIAL,
      };

      const cp = manager.createCheckpointFromResult(engine, runResult);

      expect(cp.status).toBe('completed');
      expect(cp.tasks).toHaveLength(2);

      const cpTaskA = cp.tasks.find((t) => t.taskId === 'task-a')!;
      expect(cpTaskA.status).toBe(TaskStatus.COMPLETED);
      expect(cpTaskA.result).toEqual(resultA);

      const cpTaskB = cp.tasks.find((t) => t.taskId === 'task-b')!;
      expect(cpTaskB.status).toBe(TaskStatus.COMPLETED);
      expect(cpTaskB.result).toEqual(resultB);
    });

    it('should create checkpoint from a partially failed run result', () => {
      const taskA = makeMockTask('task-a', 'agent-1');
      const taskB = makeMockTask('task-b', 'agent-1', ['task-a']);
      engine.addTask(taskA);
      engine.addTask(taskB);

      const resultA = makeTaskResult('agent-1', 'Result A');

      const runResult = {
        engineId: 'test-engine',
        taskResults: new Map([['task-a', resultA]]),
        failedTasks: new Map([['task-b', new Error('Execution failed')]]),
        duration: 150,
        success: false,
        strategy: ExecutionStrategy.SEQUENTIAL,
      };

      const cp = manager.createCheckpointFromResult(engine, runResult);

      expect(cp.status).toBe('failed');

      const cpTaskA = cp.tasks.find((t) => t.taskId === 'task-a')!;
      expect(cpTaskA.status).toBe(TaskStatus.COMPLETED);
      expect(cpTaskA.result).toEqual(resultA);

      const cpTaskB = cp.tasks.find((t) => t.taskId === 'task-b')!;
      expect(cpTaskB.status).toBe(TaskStatus.FAILED);
      expect(cpTaskB.errorMessage).toBe('Execution failed');
    });
  });

  // -------------------------------------------------------------------------
  // buildResumePlan
  // -------------------------------------------------------------------------

  describe('buildResumePlan', () => {
    it('should classify tasks into completed, pending, and failed', () => {
      const cp = makeCheckpointData({
        tasks: [
          {
            taskId: 'task-a',
            status: TaskStatus.COMPLETED,
            agentId: 'agent-1',
            dependencies: [],
            result: makeTaskResult('agent-1', 'Done A'),
            errorMessage: undefined,
          },
          {
            taskId: 'task-b',
            status: TaskStatus.FAILED,
            agentId: 'agent-1',
            dependencies: ['task-a'],
            result: undefined,
            errorMessage: 'Oops',
          },
          {
            taskId: 'task-c',
            status: TaskStatus.PENDING,
            agentId: 'agent-1',
            dependencies: ['task-b'],
            result: undefined,
            errorMessage: undefined,
          },
        ],
      });
      manager.store.save(cp);

      const plan = manager.buildResumePlan(cp.id)!;

      expect(plan.checkpointId).toBe(cp.id);
      expect(plan.completedTaskIds).toEqual(['task-a']);
      expect(plan.failedTaskIds).toEqual(['task-b']);
      expect(plan.pendingTaskIds).toContain('task-b');
      expect(plan.pendingTaskIds).toContain('task-c');
      expect(plan.completedResults.size).toBe(1);
      expect(plan.completedResults.get('task-a')).toEqual(makeTaskResult('agent-1', 'Done A'));
    });

    it('should return undefined for non-existent checkpoint', () => {
      expect(manager.buildResumePlan('non-existent')).toBeUndefined();
    });

    it('should mark the checkpoint as resumed', () => {
      const cp = makeCheckpointData();
      manager.store.save(cp);

      manager.buildResumePlan(cp.id);

      const updated = manager.getCheckpoint(cp.id)!;
      expect(updated.status).toBe('resumed');
    });

    it('should include failed tasks in pending list for retry', () => {
      const cp = makeCheckpointData({
        tasks: [
          {
            taskId: 'task-x',
            status: TaskStatus.FAILED,
            agentId: 'agent-1',
            dependencies: [],
            result: undefined,
            errorMessage: 'boom',
          },
        ],
      });
      manager.store.save(cp);

      const plan = manager.buildResumePlan(cp.id)!;
      expect(plan.failedTaskIds).toEqual(['task-x']);
      expect(plan.pendingTaskIds).toContain('task-x');
    });
  });

  // -------------------------------------------------------------------------
  // buildResumePlanFromLatest
  // -------------------------------------------------------------------------

  describe('buildResumePlanFromLatest', () => {
    it('should build plan from the latest checkpoint', () => {
      const cp1 = makeCheckpointData({
        id: 'cp-old',
        createdAt: '2025-01-01T00:00:00.000Z',
        tasks: [
          {
            taskId: 'task-a',
            status: TaskStatus.PENDING,
            agentId: 'agent-1',
            dependencies: [],
            result: undefined,
            errorMessage: undefined,
          },
        ],
      });
      const cp2 = makeCheckpointData({
        id: 'cp-new',
        createdAt: '2025-06-01T00:00:00.000Z',
        tasks: [
          {
            taskId: 'task-a',
            status: TaskStatus.COMPLETED,
            agentId: 'agent-1',
            dependencies: [],
            result: makeTaskResult('agent-1', 'Done'),
            errorMessage: undefined,
          },
        ],
      });

      manager.store.save(cp1);
      manager.store.save(cp2);

      const plan = manager.buildResumePlanFromLatest('test-engine')!;
      expect(plan.checkpointId).toBe('cp-new');
      expect(plan.completedTaskIds).toEqual(['task-a']);
    });

    it('should return undefined when no checkpoints exist', () => {
      expect(manager.buildResumePlanFromLatest('no-engine')).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // Delegation methods
  // -------------------------------------------------------------------------

  describe('delegation methods', () => {
    it('should list checkpoints via listCheckpoints', () => {
      manager.store.save(makeCheckpointData({ id: 'cp-1' }));
      manager.store.save(makeCheckpointData({ id: 'cp-2' }));

      const list = manager.listCheckpoints('test-engine');
      expect(list).toHaveLength(2);
    });

    it('should get latest checkpoint via getLatestCheckpoint', () => {
      manager.store.save(makeCheckpointData({ id: 'cp-1', createdAt: '2025-01-01T00:00:00.000Z' }));
      manager.store.save(makeCheckpointData({ id: 'cp-2', createdAt: '2025-06-01T00:00:00.000Z' }));

      const latest = manager.getLatestCheckpoint('test-engine');
      expect(latest!.id).toBe('cp-2');
    });

    it('should delete a checkpoint via deleteCheckpoint', () => {
      manager.store.save(makeCheckpointData({ id: 'cp-1' }));
      expect(manager.deleteCheckpoint('cp-1')).toBe(true);
      expect(manager.getCheckpoint('cp-1')).toBeUndefined();
    });

    it('should delete all checkpoints via deleteAllCheckpoints', () => {
      manager.store.save(makeCheckpointData({ id: 'cp-1' }));
      manager.store.save(makeCheckpointData({ id: 'cp-2' }));

      const count = manager.deleteAllCheckpoints('test-engine');
      expect(count).toBe(2);
      expect(manager.listCheckpoints('test-engine')).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  describe('edge cases', () => {
    it('should handle checkpoint with no tasks', () => {
      const cp = makeCheckpointData({ tasks: [] });
      manager.store.save(cp);

      const plan = manager.buildResumePlan(cp.id)!;
      expect(plan.completedTaskIds).toEqual([]);
      expect(plan.pendingTaskIds).toEqual([]);
      expect(plan.failedTaskIds).toEqual([]);
      expect(plan.completedResults.size).toBe(0);
    });

    it('should handle checkpoint with all tasks completed', () => {
      const cp = makeCheckpointData({
        tasks: [
          {
            taskId: 'task-a',
            status: TaskStatus.COMPLETED,
            agentId: 'agent-1',
            dependencies: [],
            result: makeTaskResult('agent-1'),
            errorMessage: undefined,
          },
          {
            taskId: 'task-b',
            status: TaskStatus.COMPLETED,
            agentId: 'agent-1',
            dependencies: ['task-a'],
            result: makeTaskResult('agent-1'),
            errorMessage: undefined,
          },
        ],
      });
      manager.store.save(cp);

      const plan = manager.buildResumePlan(cp.id)!;
      expect(plan.completedTaskIds).toHaveLength(2);
      expect(plan.pendingTaskIds).toHaveLength(0);
    });

    it('should handle tasks with complex dependency chains', () => {
      const cp = makeCheckpointData({
        tasks: [
          {
            taskId: 'task-a',
            status: TaskStatus.COMPLETED,
            agentId: 'agent-1',
            dependencies: [],
            result: makeTaskResult('agent-1', 'A'),
            errorMessage: undefined,
          },
          {
            taskId: 'task-b',
            status: TaskStatus.COMPLETED,
            agentId: 'agent-1',
            dependencies: ['task-a'],
            result: makeTaskResult('agent-1', 'B'),
            errorMessage: undefined,
          },
          {
            taskId: 'task-c',
            status: TaskStatus.FAILED,
            agentId: 'agent-1',
            dependencies: ['task-a', 'task-b'],
            result: undefined,
            errorMessage: 'network timeout',
          },
          {
            taskId: 'task-d',
            status: TaskStatus.PENDING,
            agentId: 'agent-1',
            dependencies: ['task-c'],
            result: undefined,
            errorMessage: undefined,
          },
        ],
      });
      manager.store.save(cp);

      const plan = manager.buildResumePlan(cp.id)!;
      expect(plan.completedTaskIds).toEqual(['task-a', 'task-b']);
      expect(plan.failedTaskIds).toEqual(['task-c']);
      expect(plan.pendingTaskIds).toContain('task-c');
      expect(plan.pendingTaskIds).toContain('task-d');
      expect(plan.completedResults.size).toBe(2);
    });

    it('should handle task result with token usage and metadata', () => {
      const richResult: TaskResult = {
        output: 'Detailed result',
        agentId: 'agent-1',
        duration: 500,
        tokenUsage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        metadata: { model: 'gpt-4o', temperature: 0.7 },
      };

      const cp = makeCheckpointData({
        tasks: [
          {
            taskId: 'task-rich',
            status: TaskStatus.COMPLETED,
            agentId: 'agent-1',
            dependencies: [],
            result: richResult,
            errorMessage: undefined,
          },
        ],
      });
      manager.store.save(cp);

      const plan = manager.buildResumePlan(cp.id)!;
      const restored = plan.completedResults.get('task-rich')!;
      expect(restored.tokenUsage).toEqual({
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
      });
      expect(restored.metadata).toEqual({ model: 'gpt-4o', temperature: 0.7 });
    });
  });
});

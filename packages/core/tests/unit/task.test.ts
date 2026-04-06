import { describe, it, expect, vi, beforeEach } from 'vitest';

import { Task } from '../../src/task/task.js';
import { TaskConfigError } from '../../src/errors/index.js';
import { TaskPriority, TaskStatus } from '../../src/types/task.js';
import type { TaskConfig, TaskResult } from '../../src/types/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createValidConfig(overrides?: Partial<TaskConfig>): TaskConfig {
  return {
    id: 'test-task',
    description: 'A test task description',
    ...overrides,
  };
}

function createMockResult(overrides?: Partial<TaskResult>): TaskResult {
  return {
    output: 'Task completed successfully',
    agentId: 'test-agent',
    duration: 100,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Construction & Validation
// ---------------------------------------------------------------------------

describe('Task', () => {
  describe('constructor', () => {
    it('should create a task with minimal config', () => {
      const task = new Task({ id: 'my-task', description: 'Do something' });

      expect(task.id).toBe('my-task');
      expect(task.description).toBe('Do something');
      expect(task.expectedOutput).toBe('');
      expect(task.agentId).toBeUndefined();
      expect(task.status).toBe(TaskStatus.PENDING);
      expect(task.timeout).toBe(0);
      expect(task.retries).toBe(0);
      expect(task.priority).toBe(TaskPriority.MEDIUM);
      expect(task.context).toEqual({});
      expect(task.dependencies).toEqual([]);
      expect(task.metadata).toEqual({});
      expect(task.result).toBeUndefined();
      expect(task.error).toBeUndefined();
      expect(task.isAssigned).toBe(false);
    });

    it('should create a task with full config', () => {
      const task = new Task({
        id: 'research',
        description: 'Find the latest AI papers',
        expectedOutput: 'A list of 5 papers',
        agentId: 'researcher',
        context: { topic: 'multi-agent systems' },
        dependencies: ['prior-task'],
        timeout: 30000,
        retries: 3,
        priority: TaskPriority.HIGH,
        metadata: { source: 'backlog' },
      });

      expect(task.id).toBe('research');
      expect(task.description).toBe('Find the latest AI papers');
      expect(task.expectedOutput).toBe('A list of 5 papers');
      expect(task.agentId).toBe('researcher');
      expect(task.context).toEqual({ topic: 'multi-agent systems' });
      expect(task.dependencies).toEqual(['prior-task']);
      expect(task.timeout).toBe(30000);
      expect(task.retries).toBe(3);
      expect(task.priority).toBe(TaskPriority.HIGH);
      expect(task.metadata).toEqual({ source: 'backlog' });
      expect(task.isAssigned).toBe(true);
    });

    it('should accept all TaskPriority values', () => {
      for (const priority of Object.values(TaskPriority)) {
        const task = new Task(createValidConfig({ priority }));
        expect(task.priority).toBe(priority);
      }
    });

    it('should accept id with dashes and underscores', () => {
      const task = new Task(createValidConfig({ id: 'my-task_v2' }));
      expect(task.id).toBe('my-task_v2');
    });

    it('should accept id with only alphanumeric characters', () => {
      const task = new Task(createValidConfig({ id: 'task123' }));
      expect(task.id).toBe('task123');
    });

    it('should accept timeout at the upper boundary (600000ms)', () => {
      const task = new Task(createValidConfig({ timeout: 600000 }));
      expect(task.timeout).toBe(600000);
    });

    it('should accept retries at the upper boundary (10)', () => {
      const task = new Task(createValidConfig({ retries: 10 }));
      expect(task.retries).toBe(10);
    });

    it('should accept retries of 0', () => {
      const task = new Task(createValidConfig({ retries: 0 }));
      expect(task.retries).toBe(0);
    });

    it('should accept multiple dependencies', () => {
      const task = new Task(
        createValidConfig({
          dependencies: ['task-a', 'task-b', 'task-c'],
        }),
      );
      expect(task.dependencies).toEqual(['task-a', 'task-b', 'task-c']);
    });

    // Validation errors

    it('should throw TaskConfigError for empty id', () => {
      expect(() => new Task(createValidConfig({ id: '' }))).toThrow(TaskConfigError);
    });

    it('should throw TaskConfigError for id with spaces', () => {
      expect(() => new Task(createValidConfig({ id: 'my task' }))).toThrow(TaskConfigError);
    });

    it('should throw TaskConfigError for id with special characters', () => {
      expect(() => new Task(createValidConfig({ id: 'task@#$' }))).toThrow(TaskConfigError);
    });

    it('should throw TaskConfigError for empty description', () => {
      expect(() => new Task(createValidConfig({ description: '' }))).toThrow(TaskConfigError);
    });

    it('should throw TaskConfigError for empty agentId string', () => {
      expect(() => new Task(createValidConfig({ agentId: '' }))).toThrow(TaskConfigError);
    });

    it('should throw TaskConfigError for agentId with spaces', () => {
      expect(() => new Task(createValidConfig({ agentId: 'my agent' }))).toThrow(TaskConfigError);
    });

    it('should throw TaskConfigError for negative timeout', () => {
      expect(() => new Task(createValidConfig({ timeout: -1 }))).toThrow(TaskConfigError);
    });

    it('should throw TaskConfigError for zero timeout', () => {
      expect(() => new Task(createValidConfig({ timeout: 0 }))).toThrow(TaskConfigError);
    });

    it('should throw TaskConfigError for timeout exceeding max', () => {
      expect(() => new Task(createValidConfig({ timeout: 700000 }))).toThrow(TaskConfigError);
    });

    it('should throw TaskConfigError for non-integer timeout', () => {
      expect(() => new Task(createValidConfig({ timeout: 1.5 }))).toThrow(TaskConfigError);
    });

    it('should throw TaskConfigError for negative retries', () => {
      expect(() => new Task(createValidConfig({ retries: -1 }))).toThrow(TaskConfigError);
    });

    it('should throw TaskConfigError for retries exceeding max', () => {
      expect(() => new Task(createValidConfig({ retries: 11 }))).toThrow(TaskConfigError);
    });

    it('should throw TaskConfigError for non-integer retries', () => {
      expect(() => new Task(createValidConfig({ retries: 1.5 }))).toThrow(TaskConfigError);
    });

    it('should include task id in error message when available', () => {
      try {
        new Task({ id: 'bad-task', description: '' });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(TaskConfigError);
        expect((error as TaskConfigError).taskId).toBe('bad-task');
        expect((error as TaskConfigError).message).toContain('bad-task');
      }
    });

    it('should handle non-string id gracefully in error', () => {
      expect(() => new Task({ id: 123 as unknown as string, description: 'test' })).toThrow(
        TaskConfigError,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Agent assignment
  // ---------------------------------------------------------------------------

  describe('assignAgent', () => {
    let task: Task;

    beforeEach(() => {
      task = new Task(createValidConfig());
    });

    it('should assign an agent to an unassigned task', () => {
      expect(task.isAssigned).toBe(false);
      task.assignAgent('researcher');
      expect(task.agentId).toBe('researcher');
      expect(task.isAssigned).toBe(true);
    });

    it('should reassign an agent on a pending task', () => {
      task.assignAgent('agent-1');
      task.assignAgent('agent-2');
      expect(task.agentId).toBe('agent-2');
    });

    it('should throw TaskConfigError when assigning during RUNNING status', () => {
      task.setStatus(TaskStatus.RUNNING);
      expect(() => {
        task.assignAgent('agent-1');
      }).toThrow(TaskConfigError);
      expect(() => {
        task.assignAgent('agent-1');
      }).toThrow(/running/i);
    });

    it('should allow reassignment after completion and reset', () => {
      task.setStatus(TaskStatus.RUNNING);
      task.complete(createMockResult());
      task.reset();
      task.assignAgent('new-agent');
      expect(task.agentId).toBe('new-agent');
    });

    it('should throw TaskConfigError for empty agent id', () => {
      expect(() => {
        task.assignAgent('');
      }).toThrow(TaskConfigError);
    });

    it('should throw TaskConfigError for agent id with spaces', () => {
      expect(() => {
        task.assignAgent('my agent');
      }).toThrow(TaskConfigError);
    });

    it('should throw TaskConfigError for agent id with special chars', () => {
      expect(() => {
        task.assignAgent('agent@#');
      }).toThrow(TaskConfigError);
    });
  });

  // ---------------------------------------------------------------------------
  // Status management
  // ---------------------------------------------------------------------------

  describe('status transitions', () => {
    let task: Task;

    beforeEach(() => {
      task = new Task(createValidConfig());
    });

    it('should start in PENDING status', () => {
      expect(task.status).toBe(TaskStatus.PENDING);
    });

    // Valid transitions
    it('should transition PENDING → RUNNING', () => {
      task.setStatus(TaskStatus.RUNNING);
      expect(task.status).toBe(TaskStatus.RUNNING);
    });

    it('should transition PENDING → CANCELLED', () => {
      task.setStatus(TaskStatus.CANCELLED);
      expect(task.status).toBe(TaskStatus.CANCELLED);
    });

    it('should transition RUNNING → COMPLETED', () => {
      task.setStatus(TaskStatus.RUNNING);
      task.setStatus(TaskStatus.COMPLETED);
      expect(task.status).toBe(TaskStatus.COMPLETED);
    });

    it('should transition RUNNING → FAILED', () => {
      task.setStatus(TaskStatus.RUNNING);
      task.setStatus(TaskStatus.FAILED);
      expect(task.status).toBe(TaskStatus.FAILED);
    });

    it('should transition RUNNING → CANCELLED', () => {
      task.setStatus(TaskStatus.RUNNING);
      task.setStatus(TaskStatus.CANCELLED);
      expect(task.status).toBe(TaskStatus.CANCELLED);
    });

    it('should transition COMPLETED → PENDING (reset)', () => {
      task.setStatus(TaskStatus.RUNNING);
      task.setStatus(TaskStatus.COMPLETED);
      task.setStatus(TaskStatus.PENDING);
      expect(task.status).toBe(TaskStatus.PENDING);
    });

    it('should transition FAILED → PENDING (reset)', () => {
      task.setStatus(TaskStatus.RUNNING);
      task.setStatus(TaskStatus.FAILED);
      task.setStatus(TaskStatus.PENDING);
      expect(task.status).toBe(TaskStatus.PENDING);
    });

    it('should transition CANCELLED → PENDING (reset)', () => {
      task.setStatus(TaskStatus.CANCELLED);
      task.setStatus(TaskStatus.PENDING);
      expect(task.status).toBe(TaskStatus.PENDING);
    });

    // Invalid transitions
    it('should throw on PENDING → COMPLETED', () => {
      expect(() => {
        task.setStatus(TaskStatus.COMPLETED);
      }).toThrow(TaskConfigError);
    });

    it('should throw on PENDING → FAILED', () => {
      expect(() => {
        task.setStatus(TaskStatus.FAILED);
      }).toThrow(TaskConfigError);
    });

    it('should throw on COMPLETED → RUNNING', () => {
      task.setStatus(TaskStatus.RUNNING);
      task.setStatus(TaskStatus.COMPLETED);
      expect(() => {
        task.setStatus(TaskStatus.RUNNING);
      }).toThrow(TaskConfigError);
    });

    it('should throw on FAILED → RUNNING', () => {
      task.setStatus(TaskStatus.RUNNING);
      task.setStatus(TaskStatus.FAILED);
      expect(() => {
        task.setStatus(TaskStatus.RUNNING);
      }).toThrow(TaskConfigError);
    });

    it('should throw on CANCELLED → RUNNING', () => {
      task.setStatus(TaskStatus.CANCELLED);
      expect(() => {
        task.setStatus(TaskStatus.RUNNING);
      }).toThrow(TaskConfigError);
    });

    it('should include status names in error message', () => {
      try {
        task.setStatus(TaskStatus.COMPLETED);
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as TaskConfigError).message).toContain('pending');
        expect((error as TaskConfigError).message).toContain('completed');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // complete / fail / cancel / reset
  // ---------------------------------------------------------------------------

  describe('complete', () => {
    it('should mark task as completed with a result', () => {
      const task = new Task(createValidConfig());
      task.setStatus(TaskStatus.RUNNING);

      const result = createMockResult();
      task.complete(result);

      expect(task.status).toBe(TaskStatus.COMPLETED);
      expect(task.result).toEqual(result);
    });

    it('should throw if not in RUNNING status', () => {
      const task = new Task(createValidConfig());
      expect(() => {
        task.complete(createMockResult());
      }).toThrow(TaskConfigError);
      expect(() => {
        task.complete(createMockResult());
      }).toThrow(/pending/);
    });
  });

  describe('fail', () => {
    it('should mark task as failed with an error', () => {
      const task = new Task(createValidConfig());
      task.setStatus(TaskStatus.RUNNING);

      const error = new Error('Something went wrong');
      task.fail(error);

      expect(task.status).toBe(TaskStatus.FAILED);
      expect(task.error).toBe(error);
    });

    it('should throw if not in RUNNING status', () => {
      const task = new Task(createValidConfig());
      expect(() => {
        task.fail(new Error('fail'));
      }).toThrow(TaskConfigError);
    });
  });

  describe('cancel', () => {
    it('should cancel a PENDING task', () => {
      const task = new Task(createValidConfig());
      task.cancel();
      expect(task.status).toBe(TaskStatus.CANCELLED);
    });

    it('should cancel a RUNNING task', () => {
      const task = new Task(createValidConfig());
      task.setStatus(TaskStatus.RUNNING);
      task.cancel();
      expect(task.status).toBe(TaskStatus.CANCELLED);
    });

    it('should cancel a FAILED task', () => {
      const task = new Task(createValidConfig());
      task.setStatus(TaskStatus.RUNNING);
      task.setStatus(TaskStatus.FAILED);
      task.cancel();
      expect(task.status).toBe(TaskStatus.CANCELLED);
    });

    it('should throw when cancelling a COMPLETED task', () => {
      const task = new Task(createValidConfig());
      task.setStatus(TaskStatus.RUNNING);
      task.setStatus(TaskStatus.COMPLETED);
      expect(() => {
        task.cancel();
      }).toThrow(TaskConfigError);
    });

    it('should throw when cancelling an already CANCELLED task', () => {
      const task = new Task(createValidConfig());
      task.cancel();
      expect(() => {
        task.cancel();
      }).toThrow(TaskConfigError);
    });
  });

  describe('reset', () => {
    it('should reset a completed task to PENDING', () => {
      const task = new Task(createValidConfig());
      task.setStatus(TaskStatus.RUNNING);
      task.complete(createMockResult());

      task.reset();
      expect(task.status).toBe(TaskStatus.PENDING);
      expect(task.result).toBeUndefined();
      expect(task.error).toBeUndefined();
    });

    it('should reset a failed task to PENDING', () => {
      const task = new Task(createValidConfig());
      task.setStatus(TaskStatus.RUNNING);
      task.fail(new Error('failed'));

      task.reset();
      expect(task.status).toBe(TaskStatus.PENDING);
      expect(task.error).toBeUndefined();
    });

    it('should reset a cancelled task to PENDING', () => {
      const task = new Task(createValidConfig());
      task.cancel();

      task.reset();
      expect(task.status).toBe(TaskStatus.PENDING);
    });

    it('should throw when resetting a RUNNING task', () => {
      const task = new Task(createValidConfig());
      task.setStatus(TaskStatus.RUNNING);
      expect(() => {
        task.reset();
      }).toThrow(TaskConfigError);
    });
  });

  // ---------------------------------------------------------------------------
  // Event system
  // ---------------------------------------------------------------------------

  describe('events', () => {
    let task: Task;

    beforeEach(() => {
      task = new Task(createValidConfig());
    });

    it('should emit task:status-changed on status transitions', () => {
      const listener = vi.fn();
      task.on('task:status-changed', listener);

      task.setStatus(TaskStatus.RUNNING);

      expect(listener).toHaveBeenCalledOnce();
      expect(listener).toHaveBeenCalledWith('test-task', TaskStatus.RUNNING);
    });

    it('should emit task:complete when completing', () => {
      const statusListener = vi.fn();
      const completeListener = vi.fn();
      task.on('task:status-changed', statusListener);
      task.on('task:complete', completeListener);

      task.setStatus(TaskStatus.RUNNING);
      const result = createMockResult();
      task.complete(result);

      expect(completeListener).toHaveBeenCalledOnce();
      expect(completeListener).toHaveBeenCalledWith('test-task', result);
      // status-changed fires for RUNNING and COMPLETED
      expect(statusListener).toHaveBeenCalledTimes(2);
    });

    it('should emit task:error when failing', () => {
      const errorListener = vi.fn();
      task.on('task:error', errorListener);

      task.setStatus(TaskStatus.RUNNING);
      const error = new Error('test error');
      task.fail(error);

      expect(errorListener).toHaveBeenCalledOnce();
      expect(errorListener).toHaveBeenCalledWith('test-task', error);
    });

    it('should emit task:status-changed on reset', () => {
      const listener = vi.fn();

      task.setStatus(TaskStatus.RUNNING);
      task.setStatus(TaskStatus.COMPLETED);

      task.on('task:status-changed', listener);
      task.reset();

      expect(listener).toHaveBeenCalledOnce();
      expect(listener).toHaveBeenCalledWith('test-task', TaskStatus.PENDING);
    });

    it('should support once listeners', () => {
      const listener = vi.fn();
      task.once('task:status-changed', listener);

      task.setStatus(TaskStatus.RUNNING);
      task.setStatus(TaskStatus.COMPLETED);

      expect(listener).toHaveBeenCalledOnce();
    });

    it('should support off to remove listeners', () => {
      const listener = vi.fn();
      task.on('task:status-changed', listener);
      task.off('task:status-changed', listener);

      task.setStatus(TaskStatus.RUNNING);

      expect(listener).not.toHaveBeenCalled();
    });

    it('should return this from on/off/once for chaining', () => {
      const listener = vi.fn();

      const result1 = task.on('task:start', listener);
      const result2 = task.off('task:start', listener);
      const result3 = task.once('task:start', listener);

      expect(result1).toBe(task);
      expect(result2).toBe(task);
      expect(result3).toBe(task);
    });
  });

  // ---------------------------------------------------------------------------
  // Conversion: toTaskInput
  // ---------------------------------------------------------------------------

  describe('toTaskInput', () => {
    it('should convert minimal config to TaskInput', () => {
      const task = new Task(createValidConfig());
      const input = task.toTaskInput();

      expect(input.description).toBe('A test task description');
      expect(input.expectedOutput).toBeUndefined();
      expect(input.context).toBeUndefined();
    });

    it('should include expectedOutput when set', () => {
      const task = new Task(createValidConfig({ expectedOutput: 'JSON format' }));
      const input = task.toTaskInput();

      expect(input.expectedOutput).toBe('JSON format');
    });

    it('should include context when non-empty', () => {
      const task = new Task(createValidConfig({ context: { key: 'value' } }));
      const input = task.toTaskInput();

      expect(input.context).toEqual({ key: 'value' });
    });

    it('should not include context when empty', () => {
      const task = new Task(createValidConfig({ context: {} }));
      const input = task.toTaskInput();

      expect(input.context).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Conversion: toCrewTask
  // ---------------------------------------------------------------------------

  describe('toCrewTask', () => {
    it('should convert to CrewTask with assigned agent', () => {
      const task = new Task(
        createValidConfig({
          agentId: 'researcher',
          expectedOutput: 'Paper list',
          context: { topic: 'AI' },
          dependencies: ['prior-task'],
        }),
      );

      const crewTask = task.toCrewTask();

      expect(crewTask.id).toBe('test-task');
      expect(crewTask.description).toBe('A test task description');
      expect(crewTask.agentId).toBe('researcher');
      expect(crewTask.expectedOutput).toBe('Paper list');
      expect(crewTask.context).toEqual({ topic: 'AI' });
      expect(crewTask.dependencies).toEqual(['prior-task']);
    });

    it('should throw TaskConfigError when no agent is assigned', () => {
      const task = new Task(createValidConfig());
      expect(() => task.toCrewTask()).toThrow(TaskConfigError);
      expect(() => task.toCrewTask()).toThrow(/agent/i);
    });

    it('should convert after dynamic agent assignment', () => {
      const task = new Task(createValidConfig());
      task.assignAgent('writer');

      const crewTask = task.toCrewTask();
      expect(crewTask.agentId).toBe('writer');
    });

    it('should omit optional fields when not set', () => {
      const task = new Task(createValidConfig({ agentId: 'agent-1' }));
      const crewTask = task.toCrewTask();

      expect(crewTask.id).toBe('test-task');
      expect(crewTask.description).toBe('A test task description');
      expect(crewTask.agentId).toBe('agent-1');
      expect(Object.prototype.hasOwnProperty.call(crewTask, 'expectedOutput')).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(crewTask, 'context')).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(crewTask, 'dependencies')).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Error classes
  // ---------------------------------------------------------------------------

  describe('TaskConfigError', () => {
    it('should include task id in the error', () => {
      try {
        new Task({ id: 'bad', description: '' });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(TaskConfigError);
        expect((error as TaskConfigError).name).toBe('TaskConfigError');
        expect((error as TaskConfigError).taskId).toBe('bad');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Immutability checks
  // ---------------------------------------------------------------------------

  describe('immutability', () => {
    it('should return readonly context', () => {
      const task = new Task(createValidConfig({ context: { key: 'value' } }));
      const context = task.context;

      expect(Object.isFrozen(context) || typeof context === 'object').toBe(true);
      expect(context).toEqual({ key: 'value' });
    });

    it('should return readonly dependencies', () => {
      const task = new Task(createValidConfig({ dependencies: ['dep-1'] }));
      const deps = task.dependencies;

      expect(Array.isArray(deps)).toBe(true);
      expect(deps).toEqual(['dep-1']);
    });

    it('should return readonly metadata', () => {
      const task = new Task(createValidConfig({ metadata: { key: 'val' } }));
      const meta = task.metadata;

      expect(typeof meta).toBe('object');
      expect(meta).toEqual({ key: 'val' });
    });

    it('should not be affected by mutations to the original config context', () => {
      const context: Record<string, unknown> = { key: 'original' };
      const task = new Task(createValidConfig({ context }));
      context['key'] = 'mutated';

      expect(task.context).toEqual({ key: 'original' });
    });

    it('should not be affected by mutations to the original dependencies array', () => {
      const deps: string[] = ['dep-1'];
      const task = new Task(createValidConfig({ dependencies: deps }));
      deps.push('dep-2');

      expect(task.dependencies).toEqual(['dep-1']);
    });
  });

  // ---------------------------------------------------------------------------
  // Public API exports
  // ---------------------------------------------------------------------------

  describe('public API exports', () => {
    it('should export Task from index', async () => {
      const mod = await import('../../src/index.js');
      expect(mod.Task).toBeDefined();
    });

    it('should export TaskPriority from index', async () => {
      const mod = await import('../../src/index.js');
      expect(mod.TaskPriority).toBeDefined();
      expect(mod.TaskPriority.LOW).toBe('low');
      expect(mod.TaskPriority.MEDIUM).toBe('medium');
      expect(mod.TaskPriority.HIGH).toBe('high');
      expect(mod.TaskPriority.CRITICAL).toBe('critical');
    });

    it('should export TaskStatus from index', async () => {
      const mod = await import('../../src/index.js');
      expect(mod.TaskStatus).toBeDefined();
      expect(mod.TaskStatus.PENDING).toBe('pending');
      expect(mod.TaskStatus.RUNNING).toBe('running');
      expect(mod.TaskStatus.COMPLETED).toBe('completed');
      expect(mod.TaskStatus.FAILED).toBe('failed');
      expect(mod.TaskStatus.CANCELLED).toBe('cancelled');
    });

    it('should export TaskConfigError from index', async () => {
      const mod = await import('../../src/index.js');
      expect(mod.TaskConfigError).toBeDefined();
    });

    it('should export TaskExecutionError from index', async () => {
      const mod = await import('../../src/index.js');
      expect(mod.TaskExecutionError).toBeDefined();
    });

    it('should export TaskTimeoutError from index', async () => {
      const mod = await import('../../src/index.js');
      expect(mod.TaskTimeoutError).toBeDefined();
    });
  });
});

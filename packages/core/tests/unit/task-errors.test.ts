import { describe, it, expect } from 'vitest';

import {
  TaskConfigError,
  TaskExecutionError,
  TaskTimeoutError,
} from '../../src/errors/task-errors.js';

describe('TaskConfigError', () => {
  it('should include task id in message when provided', () => {
    const error = new TaskConfigError('Invalid config', 'my-task');
    expect(error.message).toBe('Task "my-task": Invalid config');
    expect(error.name).toBe('TaskConfigError');
    expect(error.taskId).toBe('my-task');
  });

  it('should use plain message when taskId is omitted', () => {
    const error = new TaskConfigError('Something went wrong');
    expect(error.message).toBe('Something went wrong');
    expect(error.taskId).toBeUndefined();
  });

  it('should be an instance of Error', () => {
    const error = new TaskConfigError('test');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('TaskExecutionError', () => {
  it('should include task id in message', () => {
    const error = new TaskExecutionError('my-task', 'LLM failed');
    expect(error.message).toBe('Task "my-task" execution failed: LLM failed');
    expect(error.name).toBe('TaskExecutionError');
    expect(error.taskId).toBe('my-task');
    expect(error.agentId).toBeUndefined();
    expect(error.cause).toBeUndefined();
  });

  it('should include agent id in message when provided', () => {
    const error = new TaskExecutionError('my-task', 'LLM failed', 'researcher');
    expect(error.message).toBe('Task "my-task" (agent "researcher") execution failed: LLM failed');
    expect(error.agentId).toBe('researcher');
  });

  it('should include cause when provided', () => {
    const cause = new Error('root cause');
    const error = new TaskExecutionError('t1', 'failed', 'a1', cause);
    expect(error.cause).toBe(cause);
  });

  it('should be an instance of Error', () => {
    const error = new TaskExecutionError('t1', 'failed');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('TaskTimeoutError', () => {
  it('should include timeout duration in message', () => {
    const error = new TaskTimeoutError('my-task', 30000);
    expect(error.message).toContain('30000ms');
    expect(error.name).toBe('TaskTimeoutError');
    expect(error.taskId).toBe('my-task');
    expect(error.timeoutMs).toBe(30000);
  });

  it('should include agent id when provided', () => {
    const error = new TaskTimeoutError('my-task', 5000, 'agent-1');
    expect(error.agentId).toBe('agent-1');
    expect(error.message).toContain('agent "agent-1"');
  });

  it('should be an instance of TaskExecutionError', () => {
    const error = new TaskTimeoutError('t1', 1000);
    expect(error).toBeInstanceOf(TaskExecutionError);
  });

  it('should be an instance of Error', () => {
    const error = new TaskTimeoutError('t1', 1000);
    expect(error).toBeInstanceOf(Error);
  });
});

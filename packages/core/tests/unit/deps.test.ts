import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { EventEmitter } from 'eventemitter3';

describe('Dependency Integration (TASK-006)', () => {
  describe('Zod (Schema Validation)', () => {
    it('should import zod successfully', () => {
      expect(z).toBeDefined();
      expect(typeof z.object).toBe('function');
    });

    it('should create and validate schemas', () => {
      const UserSchema = z.object({
        name: z.string(),
        age: z.number().min(0),
      });

      const validUser = { name: 'Alice', age: 30 };
      const result = UserSchema.safeParse(validUser);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validUser);
      }
    });

    it('should detect validation errors', () => {
      const UserSchema = z.object({
        name: z.string(),
        age: z.number().min(0),
      });

      const invalidUser = { name: 'Bob', age: -1 };
      const result = UserSchema.safeParse(invalidUser);

      expect(result.success).toBe(false);
    });

    it('should support complex nested schemas', () => {
      const ConfigSchema = z.object({
        agent: z.object({
          name: z.string(),
          model: z.string(),
          temperature: z.number().min(0).max(2),
        }),
        tools: z.array(z.string()),
      });

      const validConfig = {
        agent: {
          name: 'researcher',
          model: 'gpt-4',
          temperature: 0.7,
        },
        tools: ['web_search', 'calculator'],
      };

      const result = ConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('should support discriminated unions', () => {
      const EventSchema = z.discriminatedUnion('type', [
        z.object({ type: z.literal('start'), timestamp: z.number() }),
        z.object({ type: z.literal('complete'), result: z.string() }),
      ]);

      const startEvent = { type: 'start' as const, timestamp: Date.now() };
      const result = EventSchema.safeParse(startEvent);

      expect(result.success).toBe(true);
    });

    it('should support optional and default values', () => {
      const AgentSchema = z.object({
        name: z.string(),
        model: z.string().default('gpt-4o-mini'),
        temperature: z.number().optional(),
      });

      const agent = { name: 'assistant' };
      const result = AgentSchema.parse(agent);

      expect(result.name).toBe('assistant');
      expect(result.model).toBe('gpt-4o-mini');
      expect(result.temperature).toBeUndefined();
    });
  });

  describe('EventEmitter3 (Event System)', () => {
    it('should import EventEmitter3 successfully', () => {
      expect(EventEmitter).toBeDefined();
      expect(typeof EventEmitter).toBe('function');
    });

    it('should create event emitter instances', () => {
      const emitter = new EventEmitter();
      expect(emitter).toBeInstanceOf(EventEmitter);
    });

    it('should emit and listen to events', () => {
      const emitter = new EventEmitter<{ test: (msg: string) => void }>();
      let received = '';

      emitter.on('test', (msg) => {
        received = msg;
      });

      emitter.emit('test', 'hello');
      expect(received).toBe('hello');
    });

    it('should support multiple listeners', () => {
      const emitter = new EventEmitter<{ test: (value: number) => void }>();
      const values: number[] = [];

      emitter.on('test', (v) => {
        values.push(v * 2);
      });
      emitter.on('test', (v) => {
        values.push(v * 3);
      });

      emitter.emit('test', 5);
      expect(values).toEqual([10, 15]);
    });

    it('should support once listeners', () => {
      const emitter = new EventEmitter<{ test: () => void }>();
      let count = 0;

      emitter.once('test', () => {
        count++;
      });

      emitter.emit('test');
      emitter.emit('test');
      emitter.emit('test');

      expect(count).toBe(1);
    });

    it('should remove listeners', () => {
      const emitter = new EventEmitter<{ test: () => void }>();
      let count = 0;

      const listener = (): void => {
        count++;
      };
      emitter.on('test', listener);

      emitter.emit('test');
      expect(count).toBe(1);

      emitter.off('test', listener);
      emitter.emit('test');
      expect(count).toBe(1); // Should not increment
    });

    it('should support typed event maps', () => {
      interface Events {
        start: (id: string) => void;
        progress: (percent: number) => void;
        complete: (result: string) => void;
        error: (err: Error) => void;
      }

      const emitter = new EventEmitter<Events>();
      let progress = 0;

      emitter.on('progress', (p) => {
        progress = p;
      });

      emitter.emit('progress', 50);
      expect(progress).toBe(50);
    });

    it('should handle async event listeners', async () => {
      const emitter = new EventEmitter<{ test: () => Promise<void> }>();
      const results: string[] = [];

      emitter.on('test', async (): Promise<void> => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        results.push('first');
      });

      emitter.on('test', async (): Promise<void> => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        results.push('second');
      });

      emitter.emit('test');

      // Wait for all async handlers to complete
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(results).toHaveLength(2);
      expect(results).toContain('first');
      expect(results).toContain('second');
    });

    it('should support removeAllListeners', () => {
      const emitter = new EventEmitter<{ test: () => void }>();
      let count = 0;

      emitter.on('test', () => {
        count++;
      });
      emitter.on('test', () => {
        count++;
      });

      emitter.emit('test');
      expect(count).toBe(2);

      emitter.removeAllListeners('test');
      emitter.emit('test');
      expect(count).toBe(2); // Should not increment
    });

    it('should return listener count', () => {
      const emitter = new EventEmitter<{ test: () => void }>();

      expect(emitter.listenerCount('test')).toBe(0);

      emitter.on('test', () => {
        // Test listener
      });
      emitter.on('test', () => {
        // Test listener
      });

      expect(emitter.listenerCount('test')).toBe(2);
    });
  });

  describe('Combined Usage Scenarios', () => {
    it('should validate event payloads with zod', () => {
      interface Events {
        agentStart: (config: unknown) => void;
      }

      const AgentConfigSchema = z.object({
        name: z.string(),
        model: z.string(),
      });

      const emitter = new EventEmitter<Events>();

      emitter.on('agentStart', (config) => {
        const result = AgentConfigSchema.safeParse(config);
        expect(result.success).toBe(true);
      });

      emitter.emit('agentStart', { name: 'test', model: 'gpt-4' });
    });

    it('should create type-safe event-driven workflow', () => {
      interface WorkflowEvents {
        taskCreated: (task: { id: string; type: string }) => void;
        taskStarted: (taskId: string) => void;
        taskCompleted: (taskId: string, result: string) => void;
      }

      const TaskSchema = z.object({
        id: z.string(),
        type: z.enum(['research', 'code', 'test']),
      });

      const emitter = new EventEmitter<WorkflowEvents>();
      const taskStates: string[] = [];

      emitter.on('taskCreated', (task) => {
        const validated = TaskSchema.parse(task);
        taskStates.push(`created:${validated.id}`);
      });

      emitter.on('taskStarted', (id) => {
        taskStates.push(`started:${id}`);
      });

      emitter.on('taskCompleted', (id, result) => {
        taskStates.push(`completed:${id}:${result}`);
      });

      emitter.emit('taskCreated', { id: 'task-1', type: 'research' });
      emitter.emit('taskStarted', 'task-1');
      emitter.emit('taskCompleted', 'task-1', 'success');

      expect(taskStates).toEqual(['created:task-1', 'started:task-1', 'completed:task-1:success']);
    });
  });

  describe('Version Compatibility', () => {
    it('should use zod version 3.x', () => {
      // Check that zod exports the expected v3 API
      expect(z.ZodType).toBeDefined();
      expect(z.BRAND).toBeDefined();
    });

    it('should use eventemitter3 version 5.x', () => {
      // Check that EventEmitter has v5 features
      const emitter = new EventEmitter();
      expect(typeof emitter.eventNames).toBe('function');
    });
  });
});

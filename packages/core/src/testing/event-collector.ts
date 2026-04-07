/**
 * Event collector utility for testing agent and crew lifecycle events.
 *
 * Provides a convenient way to capture events emitted by agents and crews
 * during test workflows, enabling order and payload assertions.
 *
 * @packageDocumentation
 */

import type { Agent } from '../agent/agent.js';
import type { Crew } from '../crew/crew.js';
import type { AgentEventMap } from '../types/agent.js';
import type { CrewEventMap } from '../types/crew.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A recorded event with its name and arguments. */
export interface CollectedEvent<TArgs extends readonly unknown[] = readonly unknown[]> {
  /** The event name. */
  readonly event: string;

  /** The arguments passed to the event listener. */
  readonly args: TArgs;

  /** Timestamp when the event was collected. */
  readonly timestamp: number;
}

// ---------------------------------------------------------------------------
// AgentEventCollector
// ---------------------------------------------------------------------------

/**
 * Collects all lifecycle events from an {@link Agent}.
 *
 * @example
 * ```typescript
 * const collector = new AgentEventCollector(agent);
 * await agent.execute({ description: 'Do something' });
 * expect(collector.eventNames).toContain('agent:complete');
 * expect(collector.events).toHaveLength(5);
 * collector.clear();
 * ```
 */
export class AgentEventCollector {
  private readonly _events: CollectedEvent[] = [];

  constructor(agent: Agent) {
    const events: Array<keyof AgentEventMap> = [
      'agent:start',
      'agent:complete',
      'agent:error',
      'agent:llm:start',
      'agent:llm:complete',
      'agent:tool:start',
      'agent:tool:complete',
      'agent:status-changed',
    ];

    for (const eventName of events) {
      agent.on(eventName, ((...args: unknown[]) => {
        this._events.push({
          event: eventName,
          args: args as readonly unknown[],
          timestamp: Date.now(),
        });
      }) as AgentEventMap[typeof eventName]);
    }
  }

  /** All collected events in chronological order. */
  get events(): readonly CollectedEvent[] {
    return [...this._events];
  }

  /** Just the event names in order. */
  get eventNames(): readonly string[] {
    return this._events.map((e) => e.event);
  }

  /** Number of collected events. */
  get count(): number {
    return this._events.length;
  }

  /** Get events filtered by name. */
  filter(eventName: string): readonly CollectedEvent[] {
    return this._events.filter((e) => e.event === eventName);
  }

  /** Check if a specific event was emitted. */
  has(eventName: string): boolean {
    return this._events.some((e) => e.event === eventName);
  }

  /** Clear all collected events. */
  clear(): void {
    this._events.length = 0;
  }
}

// ---------------------------------------------------------------------------
// CrewEventCollector
// ---------------------------------------------------------------------------

/**
 * Collects all lifecycle events from a {@link Crew}.
 *
 * @example
 * ```typescript
 * const collector = new CrewEventCollector(crew);
 * await crew.run();
 * expect(collector.eventNames).toContain('crew:complete');
 * ```
 */
export class CrewEventCollector {
  private readonly _events: CollectedEvent[] = [];

  constructor(crew: Crew) {
    const events: Array<keyof CrewEventMap> = [
      'crew:start',
      'crew:complete',
      'crew:error',
      'crew:task:start',
      'crew:task:complete',
      'crew:task:error',
      'crew:status-changed',
    ];

    for (const eventName of events) {
      crew.on(eventName, ((...args: unknown[]) => {
        this._events.push({
          event: eventName,
          args: args as readonly unknown[],
          timestamp: Date.now(),
        });
      }) as CrewEventMap[typeof eventName]);
    }
  }

  /** All collected events in chronological order. */
  get events(): readonly CollectedEvent[] {
    return [...this._events];
  }

  /** Just the event names in order. */
  get eventNames(): readonly string[] {
    return this._events.map((e) => e.event);
  }

  /** Number of collected events. */
  get count(): number {
    return this._events.length;
  }

  /** Get events filtered by name. */
  filter(eventName: string): readonly CollectedEvent[] {
    return this._events.filter((e) => e.event === eventName);
  }

  /** Check if a specific event was emitted. */
  has(eventName: string): boolean {
    return this._events.some((e) => e.event === eventName);
  }

  /** Clear all collected events. */
  clear(): void {
    this._events.length = 0;
  }
}

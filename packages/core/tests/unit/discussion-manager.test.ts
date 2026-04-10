import { describe, it, expect, vi, beforeEach } from 'vitest';

import { Agent } from '../../src/agent/agent.js';
import { DiscussionManager } from '../../src/discussion/discussion-manager.js';
import {
  ConvergenceStrategy,
  DiscussionMessageType,
  DiscussionStatus,
} from '../../src/types/discussion.js';
import type { DiscussionMessage, DiscussionResult } from '../../src/types/discussion.js';
import type { LLMProvider, LLMResponse, LLMMessage } from '../../src/types/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let callCount = 0;

function createMockLLMProvider(responses?: string[]): LLMProvider {
  const fn = vi.fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>();

  if (responses) {
    for (const content of responses) {
      fn.mockResolvedValueOnce({
        content,
        tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        finishReason: 'stop',
      });
    }
  } else {
    fn.mockImplementation(async () => ({
      content: `[AGREE] Looks good to me. (call ${String(++callCount)})`,
      tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      finishReason: 'stop',
    }));
  }

  return { name: 'mock-provider', generateText: fn };
}

function createTestAgent(id: string, provider: LLMProvider): Agent {
  return new Agent({
    id,
    role: `Role-${id}`,
    goal: `Goal of ${id}`,
    llmProvider: provider,
  });
}

function buildAgentMap(agents: Agent[]): ReadonlyMap<string, Agent> {
  const map = new Map<string, Agent>();
  for (const a of agents) map.set(a.id, a);
  return map;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DiscussionManager', () => {
  beforeEach(() => {
    callCount = 0;
  });

  describe('validation', () => {
    it('should reject discussion with unknown participants', async () => {
      const provider = createMockLLMProvider();
      const agent = createTestAgent('agent-a', provider);
      const manager = new DiscussionManager(buildAgentMap([agent]));

      await expect(
        manager.runDiscussion({
          id: 'disc-1',
          participantIds: ['agent-a', 'agent-unknown'],
          topic: 'Test',
          maxRounds: 3,
          convergenceStrategy: ConvergenceStrategy.UNANIMOUS,
        }),
      ).rejects.toThrow('unknown participant');
    });

    it('should reject discussion with fewer than 2 participants', async () => {
      const provider = createMockLLMProvider();
      const agent = createTestAgent('agent-a', provider);
      const manager = new DiscussionManager(buildAgentMap([agent]));

      await expect(
        manager.runDiscussion({
          id: 'disc-1',
          participantIds: ['agent-a'],
          topic: 'Test',
          maxRounds: 3,
          convergenceStrategy: ConvergenceStrategy.UNANIMOUS,
        }),
      ).rejects.toThrow('at least 2 participants');
    });
  });

  describe('unanimous convergence', () => {
    it('should converge when all agents agree in the same round', async () => {
      const provider = createMockLLMProvider();
      const agents = [createTestAgent('agent-a', provider), createTestAgent('agent-b', provider)];
      const manager = new DiscussionManager(buildAgentMap(agents));

      const result = await manager.runDiscussion({
        id: 'disc-agree',
        participantIds: ['agent-a', 'agent-b'],
        topic: 'Should we use TypeScript?',
        maxRounds: 5,
        convergenceStrategy: ConvergenceStrategy.UNANIMOUS,
      });

      expect(result.status).toBe(DiscussionStatus.CONVERGED);
      expect(result.convergenceRound).toBe(1);
      expect(result.totalMessages).toBe(2);
      expect(result.rounds).toHaveLength(1);
    });

    it('should reach max rounds when agents never agree', async () => {
      const providerA = createMockLLMProvider([
        '[PROPOSAL] I think we should use Go',
        '[DISAGREE] TypeScript is better',
        '[DISAGREE] Still no',
      ]);
      const providerB = createMockLLMProvider([
        '[DISAGREE] No, TypeScript all the way',
        '[DISAGREE] I insist on TypeScript',
        '[DISAGREE] Not changing my mind',
      ]);
      const agents = [createTestAgent('agent-a', providerA), createTestAgent('agent-b', providerB)];
      const manager = new DiscussionManager(buildAgentMap(agents));

      const result = await manager.runDiscussion({
        id: 'disc-disagree',
        participantIds: ['agent-a', 'agent-b'],
        topic: 'Language choice',
        maxRounds: 3,
        convergenceStrategy: ConvergenceStrategy.UNANIMOUS,
      });

      expect(result.status).toBe(DiscussionStatus.MAX_ROUNDS_REACHED);
      expect(result.convergenceRound).toBeUndefined();
      expect(result.totalMessages).toBe(6);
      expect(result.rounds).toHaveLength(3);
    });
  });

  describe('majority convergence', () => {
    it('should converge when majority agrees', async () => {
      const providerA = createMockLLMProvider(['[AGREE] Sounds good']);
      const providerB = createMockLLMProvider(['[DISAGREE] Not sure']);
      const providerC = createMockLLMProvider(['[AGREE] I agree']);

      const agents = [
        createTestAgent('agent-a', providerA),
        createTestAgent('agent-b', providerB),
        createTestAgent('agent-c', providerC),
      ];
      const manager = new DiscussionManager(buildAgentMap(agents));

      const result = await manager.runDiscussion({
        id: 'disc-majority',
        participantIds: ['agent-a', 'agent-b', 'agent-c'],
        topic: 'Majority test',
        maxRounds: 5,
        convergenceStrategy: ConvergenceStrategy.MAJORITY,
      });

      expect(result.status).toBe(DiscussionStatus.CONVERGED);
      expect(result.convergenceRound).toBe(1);
    });
  });

  describe('events', () => {
    it('should emit all lifecycle events', async () => {
      const provider = createMockLLMProvider();
      const agents = [createTestAgent('agent-a', provider), createTestAgent('agent-b', provider)];
      const manager = new DiscussionManager(buildAgentMap(agents));

      const events: string[] = [];
      manager.on('discussion:start', () => events.push('start'));
      manager.on('discussion:round:start', () => events.push('round:start'));
      manager.on('discussion:message', () => events.push('message'));
      manager.on('discussion:round:complete', () => events.push('round:complete'));
      manager.on('discussion:converged', () => events.push('converged'));
      manager.on('discussion:complete', () => events.push('complete'));

      await manager.runDiscussion({
        id: 'disc-events',
        participantIds: ['agent-a', 'agent-b'],
        topic: 'Events test',
        maxRounds: 5,
        convergenceStrategy: ConvergenceStrategy.UNANIMOUS,
      });

      expect(events).toEqual([
        'start',
        'round:start',
        'message',
        'message',
        'round:complete',
        'converged',
        'complete',
      ]);
    });

    it('should emit discussion:message with correct structure', async () => {
      const providerA = createMockLLMProvider(['[PROPOSAL] Let us start', '[AGREE] Sounds good']);
      const providerB = createMockLLMProvider(['[AGREE] Okay', '[AGREE] Confirmed']);
      const agents = [createTestAgent('agent-a', providerA), createTestAgent('agent-b', providerB)];
      const manager = new DiscussionManager(buildAgentMap(agents));

      const messages: DiscussionMessage[] = [];
      manager.on('discussion:message', (_id, msg) => messages.push(msg));

      await manager.runDiscussion({
        id: 'disc-msg',
        participantIds: ['agent-a', 'agent-b'],
        topic: 'Message test',
        maxRounds: 5,
        convergenceStrategy: ConvergenceStrategy.UNANIMOUS,
      });

      // Round 1: agent-a proposes, agent-b agrees (not unanimous because proposal ≠ agreement)
      // Round 2: both agree → converged
      expect(messages).toHaveLength(4);
      expect(messages[0]!.fromAgentId).toBe('agent-a');
      expect(messages[0]!.toAgentId).toBe('agent-b');
      expect(messages[0]!.type).toBe(DiscussionMessageType.PROPOSAL);
      expect(messages[0]!.round).toBe(1);
      expect(messages[1]!.fromAgentId).toBe('agent-b');
      expect(messages[1]!.type).toBe(DiscussionMessageType.AGREEMENT);
      expect(messages[1]!.round).toBe(1);
      // Round 2 — both agree
      expect(messages[2]!.fromAgentId).toBe('agent-a');
      expect(messages[2]!.type).toBe(DiscussionMessageType.AGREEMENT);
      expect(messages[2]!.round).toBe(2);
      expect(messages[3]!.fromAgentId).toBe('agent-b');
      expect(messages[3]!.type).toBe(DiscussionMessageType.AGREEMENT);
      expect(messages[3]!.round).toBe(2);
    });
  });

  describe('message type parsing', () => {
    it('should parse all message type prefixes', async () => {
      const responses = [
        '[AGREE] Yes',
        '[DISAGREE] No',
        '[REVISE] Changed version',
        '[QUESTION] Why?',
        '[PROPOSAL] New idea',
        'Just a comment without prefix',
      ];
      // 3 agents, 2 rounds
      const provider = createMockLLMProvider(responses);
      const agents = [
        createTestAgent('agent-a', provider),
        createTestAgent('agent-b', provider),
        createTestAgent('agent-c', provider),
      ];
      const manager = new DiscussionManager(buildAgentMap(agents));

      const messages: DiscussionMessage[] = [];
      manager.on('discussion:message', (_id, msg) => messages.push(msg));

      await manager.runDiscussion({
        id: 'disc-types',
        participantIds: ['agent-a', 'agent-b', 'agent-c'],
        topic: 'Parse test',
        maxRounds: 2,
        convergenceStrategy: ConvergenceStrategy.UNANIMOUS,
      });

      expect(messages[0]!.type).toBe(DiscussionMessageType.AGREEMENT);
      expect(messages[1]!.type).toBe(DiscussionMessageType.DISAGREEMENT);
      expect(messages[2]!.type).toBe(DiscussionMessageType.REVISION);
      expect(messages[3]!.type).toBe(DiscussionMessageType.QUESTION);
      expect(messages[4]!.type).toBe(DiscussionMessageType.PROPOSAL);
      expect(messages[5]!.type).toBe(DiscussionMessageType.FEEDBACK);
    });
  });

  describe('initial context', () => {
    it('should include initial context in agent prompts', async () => {
      const provider = createMockLLMProvider();
      const agents = [createTestAgent('agent-a', provider), createTestAgent('agent-b', provider)];
      const manager = new DiscussionManager(buildAgentMap(agents));

      await manager.runDiscussion({
        id: 'disc-ctx',
        participantIds: ['agent-a', 'agent-b'],
        topic: 'Review findings',
        initialContext: 'Previous research found 5 key trends.',
        maxRounds: 5,
        convergenceStrategy: ConvergenceStrategy.UNANIMOUS,
      });

      // Verify the LLM was called with the initial context in the prompt
      const calls = (provider.generateText as ReturnType<typeof vi.fn>).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const firstCallMessages = calls[0]![0] as Array<{ content: string }>;
      const userMessage = firstCallMessages.find((m) => m.content.includes('Previous research'));
      expect(userMessage).toBeDefined();
    });
  });

  describe('initiator ordering', () => {
    it('should put initiator first in round 1', async () => {
      const providerA = createMockLLMProvider(['[AGREE] OK']);
      const providerB = createMockLLMProvider(['[AGREE] OK']);
      const agents = [createTestAgent('agent-a', providerA), createTestAgent('agent-b', providerB)];
      const manager = new DiscussionManager(buildAgentMap(agents));

      const messageOrder: string[] = [];
      manager.on('discussion:message', (_id, msg) => messageOrder.push(msg.fromAgentId));

      await manager.runDiscussion({
        id: 'disc-init',
        participantIds: ['agent-a', 'agent-b'],
        topic: 'Init test',
        maxRounds: 5,
        convergenceStrategy: ConvergenceStrategy.UNANIMOUS,
        initiatorId: 'agent-b',
      });

      expect(messageOrder[0]).toBe('agent-b');
      expect(messageOrder[1]).toBe('agent-a');
    });
  });
});

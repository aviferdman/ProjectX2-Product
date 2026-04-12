/**
 * DiscussionManager — Orchestrates multi-round agent-to-agent discussions.
 *
 * Agents take turns responding within rounds. After each round, convergence
 * is checked using the configured strategy. The discussion continues until
 * agents converge or the maximum number of rounds is reached.
 *
 * @packageDocumentation
 */
import { EventEmitter } from 'eventemitter3';

import type { Agent } from '../agent/agent.js';
import type { LLMProvider } from '../types/llm.js';
import { LLMRole } from '../types/llm.js';
import type {
  DiscussionConfig,
  DiscussionEventMap,
  DiscussionMessage,
  DiscussionResult,
  DiscussionRound,
} from '../types/discussion.js';
import {
  ConvergenceStrategy,
  DiscussionMessageType,
  DiscussionStatus,
} from '../types/discussion.js';

const DEFAULT_STABILITY_THRESHOLD = 2;

/**
 * Orchestrates multi-round discussions between agents.
 *
 * @example
 * ```typescript
 * const manager = new DiscussionManager(agentMap);
 * manager.on('discussion:message', (id, msg) => console.log(msg));
 * const result = await manager.runDiscussion({
 *   id: 'review-1',
 *   participantIds: ['agent-analyst', 'agent-reviewer'],
 *   topic: 'Review the research findings',
 *   maxRounds: 5,
 *   convergenceStrategy: ConvergenceStrategy.UNANIMOUS,
 * });
 * ```
 */
export class DiscussionManager {
  private readonly _emitter: EventEmitter<DiscussionEventMap>;
  private readonly _agents: ReadonlyMap<string, Agent>;
  private readonly _convergenceJudge: LLMProvider | undefined;

  constructor(agents: ReadonlyMap<string, Agent>, convergenceJudge?: LLMProvider) {
    this._emitter = new EventEmitter<DiscussionEventMap>();
    this._agents = agents;
    this._convergenceJudge = convergenceJudge;
  }

  // ---------------------------------------------------------------------------
  // Event system
  // ---------------------------------------------------------------------------

  on<E extends keyof DiscussionEventMap>(event: E, listener: DiscussionEventMap[E]): this {
    this._emitter.on(event, listener as (...args: unknown[]) => void);
    return this;
  }

  off<E extends keyof DiscussionEventMap>(event: E, listener: DiscussionEventMap[E]): this {
    this._emitter.off(event, listener as (...args: unknown[]) => void);
    return this;
  }

  once<E extends keyof DiscussionEventMap>(event: E, listener: DiscussionEventMap[E]): this {
    this._emitter.once(event, listener as (...args: unknown[]) => void);
    return this;
  }

  // ---------------------------------------------------------------------------
  // Run discussion
  // ---------------------------------------------------------------------------

  async runDiscussion(config: DiscussionConfig): Promise<DiscussionResult> {
    // Validate participants
    for (const pid of config.participantIds) {
      if (!this._agents.has(pid)) {
        throw new Error(`Discussion "${config.id}": unknown participant agent "${pid}"`);
      }
    }

    if (config.participantIds.length < 2) {
      throw new Error(`Discussion "${config.id}": at least 2 participants required`);
    }

    const startTime = Date.now();
    const allRounds: DiscussionRound[] = [];
    const allMessages: DiscussionMessage[] = [];
    let status: DiscussionStatus = DiscussionStatus.ACTIVE;
    let convergenceRound: number | undefined;

    this._emit('discussion:start', config.id, config.participantIds);

    try {
      for (let roundNum = 1; roundNum <= config.maxRounds; roundNum++) {
        this._emit('discussion:round:start', config.id, roundNum);

        const roundMessages: DiscussionMessage[] = [];

        // Order participants — initiator goes first in round 1
        const orderedParticipants = this._orderParticipants(config, roundNum);

        for (const agentId of orderedParticipants) {
          const agent = this._agents.get(agentId)!;

          // Build the discussion prompt with full history
          const prompt = this._buildConversationPrompt(config, agent, allMessages, roundNum);

          // Agent responds
          const result = await agent.execute({
            description: prompt,
            expectedOutput:
              'Your response in this discussion. Start your message with one of: [AGREE], [DISAGREE], [REVISE], [QUESTION], or [PROPOSAL] to indicate your stance, then provide your reasoning.',
          });

          const msgType = this._parseMessageType(result.output);
          const nextAgent = this._getNextParticipant(agentId, orderedParticipants);

          const message: DiscussionMessage = {
            id: `${config.id}-r${String(roundNum)}-${agentId}`,
            fromAgentId: agentId,
            toAgentId: nextAgent,
            content: result.output,
            round: roundNum,
            timestamp: Date.now(),
            type: msgType,
          };

          roundMessages.push(message);
          allMessages.push(message);
          this._emit('discussion:message', config.id, message);
        }

        const round: DiscussionRound = {
          roundNumber: roundNum,
          messages: roundMessages,
          timestamp: Date.now(),
        };
        allRounds.push(round);
        this._emit('discussion:round:complete', config.id, round);

        // Check convergence
        const converged = await this._checkConvergence(config, roundMessages, allRounds, roundNum);

        if (converged) {
          status = DiscussionStatus.CONVERGED;
          convergenceRound = roundNum;
          const lastContent = roundMessages[roundMessages.length - 1]?.content ?? '';
          this._emit('discussion:converged', config.id, roundNum, lastContent);
          break;
        }

        if (roundNum === config.maxRounds) {
          status = DiscussionStatus.MAX_ROUNDS_REACHED;
          this._emit('discussion:max-rounds', config.id, config.maxRounds);
        }
      }
    } catch (error) {
      status = DiscussionStatus.ERROR;
      const err = error instanceof Error ? error : new Error(String(error));
      this._emit('discussion:error', config.id, err);
      throw err;
    }

    const finalOutput = this._synthesizeFinalOutput(allMessages);

    const result: DiscussionResult = {
      discussionId: config.id,
      status,
      rounds: allRounds,
      finalOutput,
      totalMessages: allMessages.length,
      participantIds: [...config.participantIds],
      duration: Date.now() - startTime,
      ...(convergenceRound !== undefined ? { convergenceRound } : {}),
    };

    this._emit('discussion:complete', config.id, result);
    return result;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private _orderParticipants(config: DiscussionConfig, roundNum: number): readonly string[] {
    if (roundNum === 1 && config.initiatorId) {
      // Put initiator first, rest follow in original order
      const rest = config.participantIds.filter((id) => id !== config.initiatorId);
      return [config.initiatorId, ...rest];
    }
    return config.participantIds;
  }

  private _buildConversationPrompt(
    config: DiscussionConfig,
    agent: Agent,
    previousMessages: readonly DiscussionMessage[],
    currentRound: number,
  ): string {
    const lines: string[] = [];

    lines.push(`You are participating in a collaborative discussion as "${agent.role}".`);
    lines.push(`Your goal: ${agent.goal}`);
    lines.push('');
    lines.push(`Discussion topic: ${config.topic}`);

    if (config.initialContext) {
      lines.push('');
      lines.push(`Initial context:\n${config.initialContext}`);
    }

    if (previousMessages.length > 0) {
      lines.push('');
      lines.push('--- Discussion History ---');

      let lastRound = 0;
      for (const msg of previousMessages) {
        if (msg.round !== lastRound) {
          lines.push('');
          lines.push(`[Round ${String(msg.round)}]`);
          lastRound = msg.round;
        }
        const fromAgent = this._agents.get(msg.fromAgentId);
        const label = fromAgent ? fromAgent.role : msg.fromAgentId;
        lines.push(`${label}: ${msg.content}`);
      }
      lines.push('--- End History ---');
    }

    lines.push('');
    lines.push(`It is now Round ${String(currentRound)}. Please provide your response.`);
    lines.push(
      'Start with [AGREE], [DISAGREE], [REVISE], [QUESTION], or [PROPOSAL] to indicate your stance, then explain your reasoning.',
    );

    if (currentRound > 1) {
      lines.push(
        'If you are satisfied with the current direction and have no further changes, respond with [AGREE].',
      );
    }

    return lines.join('\n');
  }

  private _parseMessageType(output: string): DiscussionMessageType {
    const trimmed = output.trimStart().toUpperCase();
    if (trimmed.startsWith('[AGREE')) return DiscussionMessageType.AGREEMENT;
    if (trimmed.startsWith('[DISAGREE')) return DiscussionMessageType.DISAGREEMENT;
    if (trimmed.startsWith('[REVISE')) return DiscussionMessageType.REVISION;
    if (trimmed.startsWith('[QUESTION')) return DiscussionMessageType.QUESTION;
    if (trimmed.startsWith('[PROPOSAL')) return DiscussionMessageType.PROPOSAL;
    if (trimmed.startsWith('[ANSWER')) return DiscussionMessageType.ANSWER;
    // First round messages without a tag default to PROPOSAL
    return DiscussionMessageType.FEEDBACK;
  }

  private async _checkConvergence(
    config: DiscussionConfig,
    roundMessages: readonly DiscussionMessage[],
    allRounds: readonly DiscussionRound[],
    roundNum: number,
  ): Promise<boolean> {
    switch (config.convergenceStrategy) {
      case ConvergenceStrategy.UNANIMOUS:
        return roundMessages.every((m) => m.type === DiscussionMessageType.AGREEMENT);

      case ConvergenceStrategy.MAJORITY: {
        const agreeCount = roundMessages.filter(
          (m) => m.type === DiscussionMessageType.AGREEMENT,
        ).length;
        return agreeCount > roundMessages.length / 2;
      }

      case ConvergenceStrategy.STABLE_OUTPUT: {
        const threshold = config.stabilityThreshold ?? DEFAULT_STABILITY_THRESHOLD;
        if (allRounds.length < threshold) return false;

        // Compare the last `threshold` rounds to see if message types are stable
        const recentRounds = allRounds.slice(-threshold);
        const allStable = recentRounds.every((round) =>
          round.messages.every(
            (m) =>
              m.type === DiscussionMessageType.AGREEMENT ||
              m.type === DiscussionMessageType.FEEDBACK,
          ),
        );
        return allStable;
      }

      case ConvergenceStrategy.LLM_JUDGE: {
        if (!this._convergenceJudge) {
          // Fall back to unanimous if no judge configured
          return roundMessages.every((m) => m.type === DiscussionMessageType.AGREEMENT);
        }

        const historyText = roundMessages
          .map((m) => {
            const agent = this._agents.get(m.fromAgentId);
            return `${agent?.role ?? m.fromAgentId}: ${m.content}`;
          })
          .join('\n\n');

        const judgeResponse = await this._convergenceJudge.generateText([
          {
            role: LLMRole.SYSTEM,
            content:
              'You are a discussion moderator. Given the following round of discussion, determine if the participants have reached a satisfactory consensus. Respond with ONLY "CONVERGED" or "CONTINUE".',
          },
          {
            role: LLMRole.USER,
            content: `Topic: ${config.topic}\n\nRound ${String(roundNum)} messages:\n${historyText}`,
          },
        ]);

        return judgeResponse.content.trim().toUpperCase().startsWith('CONVERGED');
      }

      default:
        return false;
    }
  }

  private _synthesizeFinalOutput(allMessages: readonly DiscussionMessage[]): string {
    // Prefer the last AGREEMENT or REVISION message
    for (let i = allMessages.length - 1; i >= 0; i--) {
      const msg = allMessages[i]!;
      if (
        msg.type === DiscussionMessageType.AGREEMENT ||
        msg.type === DiscussionMessageType.REVISION
      ) {
        return msg.content;
      }
    }
    // Fall back to last message
    return allMessages[allMessages.length - 1]?.content ?? '';
  }

  private _getNextParticipant(currentId: string, participantIds: readonly string[]): string {
    const idx = participantIds.indexOf(currentId);
    return participantIds[(idx + 1) % participantIds.length] ?? participantIds[0] ?? currentId;
  }

  private _emit<E extends keyof DiscussionEventMap>(
    event: E,
    ...args: Parameters<DiscussionEventMap[E]>
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this._emitter.emit as (event: string, ...args: any[]) => boolean)(event, ...args);
  }
}

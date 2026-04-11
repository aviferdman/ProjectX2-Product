/**
 * WorkflowChat — Chat sidebar for interacting with the workflow.
 * Lovable-style: users can modify agents/tasks/workflow via natural language.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage, WorkflowState } from '../../types/workflow.js';

interface WorkflowChatProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  isGenerating: boolean;
  workflow: WorkflowState | null;
}

export function WorkflowChat({
  messages,
  onSendMessage,
  isGenerating,
  workflow,
}: WorkflowChatProps): React.JSX.Element {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const el = inputRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSend = useCallback(() => {
    if (!input.trim() || isGenerating) return;
    onSendMessage(input.trim());
    setInput('');
  }, [input, isGenerating, onSendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--cs-border-subtle)] glass-subtle">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[var(--cs-text-primary)] truncate">Workflow Assistant</h3>
          <p className="text-xs text-[var(--cs-text-tertiary)]">
            {isGenerating ? 'Thinking...' : workflow ? `${workflow.agents.length} agents · ${workflow.tasks.length} tasks` : 'Ready to help'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-600/20 border border-indigo-500/20 flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgb(167 139 250)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <p className="text-sm text-[var(--cs-text-secondary)] mb-2">Describe your initiative</p>
            <p className="text-xs text-[var(--cs-text-tertiary)] leading-relaxed">
              Tell me what you want to accomplish and I'll assemble the right team of AI agents.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isGenerating && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--cs-surface-card)]">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Contextual Suggestions */}
      {workflow && !isGenerating && (
        <div className="px-4 pb-2 flex gap-1.5 flex-wrap">
          {workflow.status === 'completed' ? (
            <>
              <QuickAction label="Summarize the results" onClick={() => onSendMessage('Summarize the workflow results')} />
              <QuickAction label="Export as report" onClick={() => onSendMessage('Export the results as a structured report')} />
            </>
          ) : workflow.status === 'failed' ? (
            <>
              <QuickAction label="What went wrong?" onClick={() => onSendMessage('Explain what failed and suggest fixes')} />
              <QuickAction label="Retry failed tasks" onClick={() => onSendMessage('Retry the failed tasks')} />
            </>
          ) : (
            <>
              {workflow.agents.length > 0 && (
                <QuickAction
                  label={`Explain ${workflow.agents[0]?.role ?? 'agent'}'s role`}
                  onClick={() => onSendMessage(`Explain what the ${workflow.agents[0]?.role ?? 'first agent'} does in this workflow`)}
                />
              )}
              {workflow.tasks.length > 0 && (
                <QuickAction
                  label="Show task dependencies"
                  onClick={() => onSendMessage('Show me how the tasks depend on each other')}
                />
              )}
              <QuickAction
                label="Optimize this workflow"
                onClick={() => onSendMessage('Suggest optimizations for this workflow')}
              />
            </>
          )}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-[var(--cs-border-subtle)]">
        <div className="relative rounded-xl border border-[var(--cs-border-default)] bg-[var(--cs-surface-card)] focus-within:border-indigo-500/40 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about the workflow..."
            rows={1}
            className="w-full bg-transparent text-sm text-[var(--cs-text-primary)] placeholder:text-[var(--cs-text-tertiary)] px-3 pt-2.5 pb-9 resize-none outline-none min-h-[40px] max-h-[120px]"
          />
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-2 py-1.5">
            <div className="flex items-center gap-1">
              <button className="p-1 rounded text-[var(--cs-text-tertiary)] hover:text-[var(--cs-text-secondary)] transition-colors" title="Attach">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                </svg>
              </button>
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isGenerating}
              className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/30 disabled:cursor-not-allowed text-white transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }): React.JSX.Element {
  if (message.role === 'system') {
    return (
      <div className="flex items-center gap-2 py-1">
        <div className="h-px flex-1 bg-[var(--cs-surface-card)]" />
        <span className="text-[11px] text-[var(--cs-text-tertiary)] px-2">{message.content}</span>
        <div className="h-px flex-1 bg-[var(--cs-surface-card)]" />
      </div>
    );
  }

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-tr-md bg-indigo-600/90 text-sm text-white leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
      <div className="max-w-[85%] text-sm text-[var(--cs-text-primary)] leading-relaxed">
        <MarkdownLite text={message.content} />
      </div>
    </div>
  );
}

/** Simple markdown rendering for bold and lists. */
function MarkdownLite({ text }: { text: string }): React.JSX.Element {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    if (line.startsWith('•') || line.startsWith('-')) {
      elements.push(
        <div key={i} className="flex gap-2 ml-1 mt-0.5">
          <span className="text-indigo-400 mt-px">•</span>
          <span>{renderBold(line.replace(/^[•\-]\s*/, ''))}</span>
        </div>,
      );
    } else if (/^\d+\./.test(line)) {
      const num = line.match(/^(\d+)\./)?.[1] ?? '';
      elements.push(
        <div key={i} className="flex gap-2 ml-1 mt-0.5">
          <span className="text-indigo-400 font-mono text-xs mt-0.5 w-4">{num}.</span>
          <span>{renderBold(line.replace(/^\d+\.\s*/, ''))}</span>
        </div>,
      );
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(
        <p key={i} className="mt-0.5">
          {renderBold(line)}
        </p>,
      );
    }
  }

  return <>{elements}</>;
}

function renderBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <span key={i} className="font-semibold text-[var(--cs-text-primary)]">
          {part.slice(2, -2)}
        </span>
      );
    }
    return part;
  });
}

function QuickAction({ label, onClick }: { label: string; onClick: () => void }): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      className="px-2.5 py-1 rounded-lg bg-[var(--cs-surface-card)] border border-[var(--cs-border-default)] text-xs text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all focus-ring"
    >
      {label}
    </button>
  );
}

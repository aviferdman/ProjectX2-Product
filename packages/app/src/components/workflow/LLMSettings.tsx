/**
 * LLM Settings dialog — lets users configure their API key and provider.
 */
import React, { useState, useEffect } from 'react';
import { getDefaultLLMConfig, saveLLMConfig } from '../../services/orchestration.js';
import type { LLMConfig } from '../../services/orchestration.js';

interface LLMSettingsProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const PROVIDERS = [
  { value: 'openai' as const, label: 'OpenAI', placeholder: 'sk-…', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
  { value: 'anthropic' as const, label: 'Anthropic', placeholder: 'sk-ant-…', models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'] },
  { value: 'ollama' as const, label: 'Ollama (local)', placeholder: 'No key needed', models: ['llama3', 'mistral', 'codellama', 'mixtral'] },
];

export function LLMSettings({ open, onClose, onSaved }: LLMSettingsProps): React.JSX.Element | null {
  const [config, setConfig] = useState<LLMConfig>(getDefaultLLMConfig());

  useEffect(() => {
    if (open) {
      setConfig(getDefaultLLMConfig());
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
    return undefined;
  }, [open, onClose]);

  if (!open) return null;

  const providerInfo = PROVIDERS.find((p) => p.value === config.provider);

  const handleSave = () => {
    saveLLMConfig(config);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#0f172a] border border-white/10 rounded-xl w-full max-w-md p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">LLM Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Provider selector */}
        <div className="mb-4">
          <label className="block text-sm text-slate-400 mb-1.5">Provider</label>
          <div className="flex gap-2">
            {PROVIDERS.map((p) => (
              <button
                key={p.value}
                onClick={() => {
                  const next: LLMConfig = { ...config, provider: p.value, modelId: p.models[0] ?? '' };
                  if (p.value === 'ollama') {
                    delete next.apiKey;
                  }
                  setConfig(next);
                }}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                  config.provider === p.value
                    ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                    : 'border-white/10 text-slate-400 hover:border-white/20'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* API Key */}
        {config.provider !== 'ollama' && (
          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-1.5">API Key</label>
            <input
              type="password"
              value={config.apiKey ?? ''}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              placeholder={providerInfo?.placeholder ?? 'Enter API key'}
              className="w-full px-3 py-2 rounded-lg bg-[#1e293b] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
            <p className="mt-1 text-xs text-slate-500">
              {config.provider === 'openai'
                ? 'Get your key at platform.openai.com'
                : 'Get your key at console.anthropic.com'}
            </p>
          </div>
        )}

        {/* Base URL (Ollama) */}
        {config.provider === 'ollama' && (
          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-1.5">Base URL</label>
            <input
              type="text"
              value={config.baseUrl ?? 'http://localhost:11434'}
              onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
              placeholder="http://localhost:11434"
              className="w-full px-3 py-2 rounded-lg bg-[#1e293b] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        )}

        {/* Model */}
        <div className="mb-6">
          <label className="block text-sm text-slate-400 mb-1.5">Model</label>
          <select
            value={config.modelId}
            onChange={(e) => setConfig({ ...config, modelId: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-[#1e293b] border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors appearance-none"
          >
            {providerInfo?.models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={config.provider !== 'ollama' && !config.apiKey?.trim()}
            className="flex-1 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

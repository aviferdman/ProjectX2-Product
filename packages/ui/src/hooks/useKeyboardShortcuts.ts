import { useEffect, useCallback, useRef } from 'react';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

/** Modifier keys that can be combined with a key. */
export type ModifierKey = 'ctrl' | 'alt' | 'shift' | 'meta';

/** A single keyboard shortcut binding. */
export interface KeyboardShortcut {
  /** Unique identifier for the shortcut */
  id: string;
  /** The key to listen for (e.g. 'k', 'Escape', '/') */
  key: string;
  /** Modifier keys required (e.g. ['ctrl'], ['ctrl', 'shift']) */
  modifiers?: ModifierKey[];
  /** Handler called when the shortcut is triggered */
  handler: (event: KeyboardEvent) => void;
  /** Human-readable description for help dialog */
  description: string;
  /** Category for grouping in help dialog */
  category?: string;
  /** Whether the shortcut is currently enabled (default: true) */
  enabled?: boolean;
  /** Prevent default browser behavior (default: true) */
  preventDefault?: boolean;
}

export interface UseKeyboardShortcutsOptions {
  /** Array of shortcut definitions */
  shortcuts: KeyboardShortcut[];
  /** Global enable/disable toggle (default: true) */
  enabled?: boolean;
  /** Ignore shortcuts when focus is in input/textarea/contenteditable (default: true) */
  ignoreInputFields?: boolean;
}

export interface UseKeyboardShortcutsResult {
  /** Currently registered shortcuts (for building help UI) */
  shortcuts: KeyboardShortcut[];
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

function isEditableElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  if (INPUT_TAGS.has(target.tagName)) return true;
  if (target.isContentEditable) return true;
  return false;
}

function matchesModifiers(event: KeyboardEvent, modifiers: ModifierKey[] = []): boolean {
  const required = new Set(modifiers);
  if (event.ctrlKey !== required.has('ctrl')) return false;
  if (event.altKey !== required.has('alt')) return false;
  if (event.shiftKey !== required.has('shift')) return false;
  if (event.metaKey !== required.has('meta')) return false;
  return true;
}

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */

export function useKeyboardShortcuts(
  options: UseKeyboardShortcutsOptions,
): UseKeyboardShortcutsResult {
  const { shortcuts, enabled = true, ignoreInputFields = true } = options;

  // Keep a stable ref to avoid re-registering on every render
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const ignoreInputRef = useRef(ignoreInputFields);
  ignoreInputRef.current = ignoreInputFields;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabledRef.current) return;
    if (ignoreInputRef.current && isEditableElement(event.target)) return;

    for (const shortcut of shortcutsRef.current) {
      if (shortcut.enabled === false) continue;

      const keyMatch =
        event.key.toLowerCase() === shortcut.key.toLowerCase() ||
        event.code.toLowerCase() === shortcut.key.toLowerCase();

      if (keyMatch && matchesModifiers(event, shortcut.modifiers)) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        shortcut.handler(event);
        return;
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { shortcuts };
}

/* ------------------------------------------------------------------ */
/* Formatting helpers for UI                                           */
/* ------------------------------------------------------------------ */

const MOD_SYMBOLS: Record<ModifierKey, string> = {
  ctrl: '⌃',
  alt: '⌥',
  shift: '⇧',
  meta: '⌘',
};

/** Format a shortcut for display (e.g. "⌃K" or "⇧?") */
export function formatShortcut(shortcut: Pick<KeyboardShortcut, 'key' | 'modifiers'>): string {
  const mods = (shortcut.modifiers ?? []).map((m) => MOD_SYMBOLS[m]).join('');
  const key = shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key;
  return `${mods}${key}`;
}

/** Group shortcuts by category */
export function groupShortcutsByCategory(
  shortcuts: KeyboardShortcut[],
): Map<string, KeyboardShortcut[]> {
  const groups = new Map<string, KeyboardShortcut[]>();
  for (const s of shortcuts) {
    const cat = s.category ?? 'General';
    const list = groups.get(cat) ?? [];
    list.push(s);
    groups.set(cat, list);
  }
  return groups;
}

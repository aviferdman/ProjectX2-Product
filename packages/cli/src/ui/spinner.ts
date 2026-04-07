/**
 * Spinner abstraction — wraps Ora for progress indicators.
 *
 * Provides a clean interface for starting, stopping, and updating spinners
 * with automatic fallback for non-interactive terminals.
 *
 * @packageDocumentation
 */

import ora, { type Ora, type Options as OraOptions } from 'ora';

/** Minimal spinner interface for CLI progress indication. */
export interface Spinner {
  /** Start the spinner with optional text. */
  start(text?: string): Spinner;
  /** Stop and show a success (✔) message. */
  succeed(text?: string): Spinner;
  /** Stop and show a failure (✖) message. */
  fail(text?: string): Spinner;
  /** Stop and show a warning (⚠) message. */
  warn(text?: string): Spinner;
  /** Stop and show an info (ℹ) message. */
  info(text?: string): Spinner;
  /** Update the spinner text while it's running. */
  setText(text: string): Spinner;
  /** Stop the spinner without a status symbol. */
  stop(): Spinner;
  /** Whether the spinner is currently spinning. */
  readonly isSpinning: boolean;
}

export interface SpinnerOptions {
  /** Initial spinner text. */
  readonly text?: string | undefined;
  /** Disable the spinner (e.g. in quiet mode or non-TTY). */
  readonly disabled?: boolean | undefined;
  /** Stream to write to. Defaults to `process.stderr`. */
  readonly stream?: NodeJS.WritableStream | undefined;
}

/**
 * Creates a new spinner instance.
 *
 * When `disabled` is `true`, returns a no-op spinner that silently
 * ignores all calls — useful for quiet mode or piped output.
 */
export function createSpinner(options?: SpinnerOptions): Spinner {
  if (options?.disabled) {
    return createNoopSpinner();
  }

  const instance: Ora = ora({
    text: options?.text ?? undefined,
    stream: options?.stream ?? process.stderr,
  } as OraOptions);

  return {
    start(text?: string) {
      instance.start(text);
      return this;
    },
    succeed(text?: string) {
      instance.succeed(text);
      return this;
    },
    fail(text?: string) {
      instance.fail(text);
      return this;
    },
    warn(text?: string) {
      instance.warn(text);
      return this;
    },
    info(text?: string) {
      instance.info(text);
      return this;
    },
    setText(text: string) {
      instance.text = text;
      return this;
    },
    stop() {
      instance.stop();
      return this;
    },
    get isSpinning() {
      return instance.isSpinning;
    },
  };
}

/** Creates a no-op spinner that silently ignores all calls. */
function createNoopSpinner(): Spinner {
  return {
    start() {
      return this;
    },
    succeed() {
      return this;
    },
    fail() {
      return this;
    },
    warn() {
      return this;
    },
    info() {
      return this;
    },
    setText() {
      return this;
    },
    stop() {
      return this;
    },
    get isSpinning() {
      return false;
    },
  };
}

export { createNoopSpinner };

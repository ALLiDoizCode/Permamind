/**
 * Progress indicator factory
 * Creates appropriate progress indicators based on terminal environment
 */

import ora, { Ora } from 'ora';

/**
 * Interface for non-interactive spinner (matches Ora API)
 */
export interface INoOpSpinner {
  start(): INoOpSpinner;
  succeed(text?: string): INoOpSpinner;
  fail(text?: string): INoOpSpinner;
  warn(text?: string): INoOpSpinner;
  info(text?: string): INoOpSpinner;
  stop(): INoOpSpinner;
  clear(): INoOpSpinner;
  text: string;
}

/**
 * No-op spinner for non-interactive environments
 * Outputs plain text without ANSI codes
 */
export class NoOpSpinner implements INoOpSpinner {
  public text: string;

  constructor(message: string) {
    this.text = message;
  }

  start(): INoOpSpinner {
    process.stdout.write(`${this.text}\n`);
    return this;
  }

  succeed(text?: string): INoOpSpinner {
    const message = text !== undefined && text !== null && text !== '' ? text : this.text;
    process.stdout.write(`✓ ${message}\n`);
    return this;
  }

  fail(text?: string): INoOpSpinner {
    const message = text !== undefined && text !== null && text !== '' ? text : this.text;
    process.stderr.write(`✗ ${message}\n`);
    return this;
  }

  warn(text?: string): INoOpSpinner {
    const message = text !== undefined && text !== null && text !== '' ? text : this.text;
    process.stdout.write(`⚠ ${message}\n`);
    return this;
  }

  info(text?: string): INoOpSpinner {
    const message = text !== undefined && text !== null && text !== '' ? text : this.text;
    process.stdout.write(`ℹ ${message}\n`);
    return this;
  }

  stop(): INoOpSpinner {
    return this;
  }

  clear(): INoOpSpinner {
    return this;
  }
}

/**
 * Create a progress spinner appropriate for the environment
 * @param message - Initial spinner message
 * @param interactive - Whether to use interactive spinner (ora) or plain text
 * @returns Ora instance or NoOpSpinner
 */
export function createSpinner(message: string, interactive: boolean): Ora | INoOpSpinner {
  if (interactive) {
    try {
      const spinner = ora(message);
      // If ora couldn't create a spinner (non-TTY detected), fall back to NoOpSpinner
      if (spinner === null || spinner === undefined) {
        return new NoOpSpinner(message).start();
      }
      spinner.start();
      return spinner;
    } catch {
      // If ora fails for any reason, fall back to NoOpSpinner
      return new NoOpSpinner(message).start();
    }
  }
  return new NoOpSpinner(message).start();
}

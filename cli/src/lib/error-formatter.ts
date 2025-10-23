/**
 * Error Formatter Module
 *
 * Formats errors for CLI output with configurable stack trace visibility.
 * - Normal mode: Shows only error name, message, and solution
 * - Verbose mode: Shows full stack traces with correlation ID and service context
 */

import { randomUUID } from 'crypto';
import {
  ValidationError,
  FileSystemError,
  ParseError,
  AuthorizationError,
  ConfigurationError,
  NetworkError,
  DependencyError,
} from '../types/errors.js';

/**
 * Error format context
 */
export interface IErrorContext {
  /** Unique correlation ID for this CLI invocation */
  correlationId: string;
  /** Service name */
  service: string;
  /** Command being executed */
  command: string;
  /** CLI version */
  version: string;
}

/**
 * Generate error context for the current CLI session
 *
 * @param command - Command name being executed
 * @returns Error context with correlation ID
 */
export function generateErrorContext(command: string): IErrorContext {
  return {
    correlationId: randomUUID(),
    service: 'agent-skills-cli',
    command,
    version: process.env.npm_package_version || '1.0.0',
  };
}

/**
 * Format error for normal (non-verbose) output
 *
 * Shows error name, message, and solution guidance.
 * Hides stack traces for cleaner user experience.
 *
 * @param error - Error to format
 * @returns Formatted error message
 *
 * @example
 * ```typescript
 * const formatted = formatErrorNormal(new ValidationError(...));
 * console.error(formatted);
 * ```
 */
export function formatErrorNormal(error: Error): string {
  // Extract error type and message
  const errorType = error.name || 'Error';
  const message = error.message;

  // Build formatted output (no stack trace)
  return `${errorType}: ${message}`;
}

/**
 * Format error for verbose output
 *
 * Shows complete error details including stack trace, correlation ID,
 * service context, and structured metadata for debugging.
 *
 * @param error - Error to format
 * @param context - Error context (correlation ID, service, command, version)
 * @returns Formatted error JSON string
 *
 * @example
 * ```typescript
 * const context = generateErrorContext('publish');
 * const formatted = formatErrorVerbose(error, context);
 * console.error(formatted);
 * ```
 */
export function formatErrorVerbose(
  error: Error,
  context: IErrorContext
): string {
  // Base error information
  const errorData: Record<string, unknown> = {
    correlationId: context.correlationId,
    service: context.service,
    command: context.command,
    version: context.version,
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack || 'No stack trace available',
    },
  };

  // Add error-specific metadata
  if (error instanceof ValidationError) {
    errorData.error = {
      ...(errorData.error as Record<string, unknown>),
      field: error.field,
      value: error.value,
      expected: error.expected,
      schemaError: error.schemaError,
    };
  } else if (error instanceof FileSystemError) {
    errorData.error = {
      ...(errorData.error as Record<string, unknown>),
      path: error.path,
    };
  } else if (error instanceof ParseError) {
    errorData.error = {
      ...(errorData.error as Record<string, unknown>),
      yamlContent: error.yamlContent,
    };
  } else if (error instanceof AuthorizationError) {
    errorData.error = {
      ...(errorData.error as Record<string, unknown>),
      address: error.address,
      balance: error.balance,
    };
  } else if (error instanceof ConfigurationError) {
    errorData.error = {
      ...(errorData.error as Record<string, unknown>),
      configKey: error.configKey,
    };
  } else if (error instanceof NetworkError) {
    errorData.error = {
      ...(errorData.error as Record<string, unknown>),
      gatewayUrl: error.gatewayUrl,
      errorType: error.errorType,
      cause: error.cause.message,
    };
  } else if (error instanceof DependencyError) {
    errorData.error = {
      ...(errorData.error as Record<string, unknown>),
      dependencyName: error.dependencyName,
      dependencyPath: error.dependencyPath,
    };
  }

  // Return formatted JSON (pretty-printed for readability)
  return JSON.stringify(errorData, null, 2);
}

/**
 * Format error based on verbose flag
 *
 * Convenience function that chooses formatting strategy based on verbose mode.
 *
 * @param error - Error to format
 * @param verbose - Whether to use verbose formatting
 * @param context - Error context (required for verbose mode)
 * @returns Formatted error string
 *
 * @example
 * ```typescript
 * const context = generateErrorContext('publish');
 * const formatted = formatError(error, true, context);
 * console.error(formatted);
 * ```
 */
export function formatError(
  error: Error,
  verbose: boolean,
  context?: IErrorContext
): string {
  if (verbose) {
    if (!context) {
      throw new Error('Error context required for verbose formatting');
    }
    return formatErrorVerbose(error, context);
  }
  return formatErrorNormal(error);
}

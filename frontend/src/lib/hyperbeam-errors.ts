/**
 * HyperBEAM Error Classes
 *
 * Specialized error types for HyperBEAM HTTP operations.
 * Enables granular error handling and fallback logic.
 */

import type { HyperBEAMErrorContext } from '../types/hyperbeam';

/**
 * Base HyperBEAM Error Class
 * Parent class for all HyperBEAM-specific errors
 */
export class HyperBEAMError extends Error {
  public readonly context: HyperBEAMErrorContext;

  constructor(message: string, context: Partial<HyperBEAMErrorContext>) {
    super(message);
    this.name = 'HyperBEAMError';

    // Complete context with defaults
    this.context = {
      url: context.url || '',
      statusCode: context.statusCode,
      errorType: context.errorType || 'unknown',
      originalError: context.originalError,
      timestamp: context.timestamp || Date.now(),
    };

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, HyperBEAMError.prototype);
  }

  /** Check if error is retryable (transient failure) */
  isRetryable(): boolean {
    // Network errors and 5xx HTTP errors are retryable
    return (
      this.context.errorType === 'network' ||
      this.context.errorType === 'timeout' ||
      (this.context.statusCode !== undefined && this.context.statusCode >= 500)
    );
  }

  /** Check if fallback should be attempted */
  shouldFallback(): boolean {
    // All HyperBEAM errors should trigger fallback to dryrun
    return true;
  }
}

/**
 * Network Error
 * Fetch failed due to network issues (connection refused, DNS failure, etc.)
 */
export class NetworkError extends HyperBEAMError {
  constructor(url: string, originalError: Error) {
    super(`Network request failed: ${originalError.message}`, {
      url,
      errorType: 'network',
      originalError,
    });
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * HTTP Error
 * HTTP request returned non-2xx status code
 */
export class HTTPError extends HyperBEAMError {
  constructor(url: string, statusCode: number, statusText: string) {
    super(`HTTP ${statusCode}: ${statusText}`, {
      url,
      statusCode,
      errorType: 'http',
    });
    this.name = 'HTTPError';
    Object.setPrototypeOf(this, HTTPError.prototype);
  }

  /** Check if error is a client error (4xx) */
  isClientError(): boolean {
    return (
      this.context.statusCode !== undefined &&
      this.context.statusCode >= 400 &&
      this.context.statusCode < 500
    );
  }

  /** Check if error is a server error (5xx) */
  isServerError(): boolean {
    return (
      this.context.statusCode !== undefined && this.context.statusCode >= 500
    );
  }

  /** Check if error is payment required (402) */
  isPaymentRequired(): boolean {
    return this.context.statusCode === 402;
  }
}

/**
 * Parse Error
 * JSON parsing failed (invalid response format)
 */
export class ParseError extends HyperBEAMError {
  constructor(url: string, originalError: Error) {
    super(`Failed to parse JSON response: ${originalError.message}`, {
      url,
      errorType: 'parse',
      originalError,
    });
    this.name = 'ParseError';
    Object.setPrototypeOf(this, ParseError.prototype);
  }
}

/**
 * Timeout Error
 * Request exceeded timeout threshold
 */
export class TimeoutError extends HyperBEAMError {
  constructor(url: string, timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`, {
      url,
      errorType: 'timeout',
    });
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Classify and wrap errors into HyperBEAM error types
 * @param error - Original error object
 * @param url - HyperBEAM URL that failed
 * @returns Typed HyperBEAM error
 */
export function classifyError(error: unknown, url: string): HyperBEAMError {
  // Already a HyperBEAM error
  if (error instanceof HyperBEAMError) {
    return error;
  }

  // Abort error (timeout)
  if (error instanceof Error && error.name === 'AbortError') {
    return new TimeoutError(url, 5000);
  }

  // Network/fetch error
  if (error instanceof TypeError) {
    return new NetworkError(url, error);
  }

  // Generic error
  if (error instanceof Error) {
    return new HyperBEAMError(error.message, {
      url,
      errorType: 'unknown',
      originalError: error,
    });
  }

  // Unknown error type
  return new HyperBEAMError(String(error), {
    url,
    errorType: 'unknown',
  });
}

/**
 * Logger Utility
 *
 * Provides consistent logging interface for CLI operations.
 * Uses stderr for warnings/errors to avoid interfering with stdout data streams.
 */

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

/**
 * Log an error message to stderr
 * @param message - Error message
 * @param error - Optional error object
 */
export function error(message: string, error?: Error): void {
  const timestamp = new Date().toISOString();
  const errorDetails = error ? ` ${error.message}` : '';
  process.stderr.write(`[${timestamp}] [${LogLevel.ERROR}] ${message}${errorDetails}\n`);
}

/**
 * Log a warning message to stderr
 * @param message - Warning message
 */
export function warn(message: string): void {
  const timestamp = new Date().toISOString();
  process.stderr.write(`[${timestamp}] [${LogLevel.WARN}] ${message}\n`);
}

/**
 * Log an info message to stdout
 * @param message - Info message
 */
export function info(message: string): void {
  const timestamp = new Date().toISOString();
  process.stdout.write(`[${timestamp}] [${LogLevel.INFO}] ${message}\n`);
}

/**
 * Current log level (defaults to INFO)
 */
let currentLevel: 'error' | 'warn' | 'info' | 'debug' = 'info';

/**
 * Set the logger level
 * @param level - Log level to set
 */
export function setLevel(level: 'error' | 'warn' | 'info' | 'debug'): void {
  currentLevel = level;
}

/**
 * Log a debug message to stdout (only in debug mode)
 * @param message - Debug message
 * @param metadata - Optional metadata object
 */
export function debug(message: string, metadata?: Record<string, unknown>): void {
  if (currentLevel === 'debug' || process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development') {
    const timestamp = new Date().toISOString();
    const metadataStr = metadata ? ` ${JSON.stringify(metadata)}` : '';
    process.stdout.write(`[${timestamp}] [${LogLevel.DEBUG}] ${message}${metadataStr}\n`);
  }
}

export default {
  error,
  warn,
  info,
  debug,
  setLevel,
};

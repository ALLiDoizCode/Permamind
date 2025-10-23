/**
 * Custom error classes for Agent Skills CLI
 *
 * This module defines specialized error types for different failure scenarios
 * in the manifest parsing and validation workflow.
 *
 * All errors follow the pattern: "[ErrorType] Problem description. -> Solution: Action to take."
 */

/**
 * Standard exit codes for CLI commands
 *
 * - SUCCESS (0): Operation completed successfully or user cancelled intentionally
 * - USER_ERROR (1): User-correctable error (validation, config, authorization)
 * - SYSTEM_ERROR (2): System error (network, file system, unexpected errors)
 */
export enum ExitCode {
  SUCCESS = 0,
  USER_ERROR = 1,
  SYSTEM_ERROR = 2,
}

/**
 * Map error instance to appropriate exit code
 *
 * @param error - Error instance to map
 * @returns Exit code (0, 1, or 2)
 *
 * @example
 * ```typescript
 * try {
 *   await command();
 * } catch (error) {
 *   process.exit(getExitCode(error));
 * }
 * ```
 */
export function getExitCode(error: unknown): number {
  if (error instanceof ValidationError) return ExitCode.USER_ERROR;
  if (error instanceof ConfigurationError) return ExitCode.USER_ERROR;
  if (error instanceof AuthorizationError) return ExitCode.USER_ERROR;
  if (error instanceof DependencyError) return ExitCode.USER_ERROR;
  if (error instanceof UserCancelledError) return ExitCode.SUCCESS;
  if (error instanceof NetworkError) return ExitCode.SYSTEM_ERROR;
  if (error instanceof FileSystemError) return ExitCode.SYSTEM_ERROR;
  if (error instanceof ParseError) return ExitCode.SYSTEM_ERROR;
  return ExitCode.SYSTEM_ERROR; // Default for unexpected errors
}

/**
 * Error thrown when skill manifest fails JSON schema validation
 *
 * Includes contextual metadata about which field failed and what value was provided
 *
 * @example
 * ```typescript
 * throw new ValidationError(
 *   '[ValidationError] Skill name contains uppercase letters. -> Solution: Use only lowercase letters, numbers, and hyphens',
 *   'name',
 *   'My-Skill',
 *   'lowercase letters, numbers, and hyphens',
 *   'name must match pattern ^[a-z0-9-]+$'
 * );
 * ```
 */
export class ValidationError extends Error {
  /**
   * @param message - User-friendly error message with solution guidance (format: "[ValidationError] Problem. -> Solution: Action.")
   * @param field - Name of the field that failed validation
   * @param value - The invalid value that was provided
   * @param expected - Optional description of expected format/value
   * @param schemaError - Optional JSON Schema validation error details
   */
  constructor(
    message: string,
    public field: string,
    public value: unknown,
    public expected?: string,
    public schemaError?: string
  ) {
    super(message);
    this.name = 'ValidationError';
    // Maintains proper stack trace for where error was thrown (V8 engines only)
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, ValidationError);
    }
  }
}

/**
 * Error thrown when file system operations fail
 *
 * Includes the file path that caused the failure for debugging context
 *
 * @example
 * ```typescript
 * throw new FileSystemError(
 *   'SKILL.md not found → Solution: Ensure SKILL.md exists in the skill directory',
 *   '/path/to/skill/SKILL.md'
 * );
 * ```
 */
export class FileSystemError extends Error {
  /**
   * @param message - User-friendly error message with solution guidance
   * @param path - File path that caused the error (sanitized, no sensitive data)
   */
  constructor(
    message: string,
    public path: string
  ) {
    super(message);
    this.name = 'FileSystemError';
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, FileSystemError);
    }
  }
}

/**
 * Error thrown when YAML frontmatter parsing fails
 *
 * Includes a snippet of the YAML content that failed to parse (truncated for security)
 *
 * @example
 * ```typescript
 * throw new ParseError(
 *   'YAML frontmatter is malformed → Solution: Check for syntax errors in the YAML frontmatter',
 *   yamlSnippet
 * );
 * ```
 */
export class ParseError extends Error {
  /**
   * @param message - User-friendly error message with solution guidance
   * @param yamlContent - Snippet of YAML content that failed parsing (max 200 chars for security)
   */
  constructor(
    message: string,
    public yamlContent: string
  ) {
    super(message);
    this.name = 'ParseError';
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, ParseError);
    }
  }
}

/**
 * Error thrown when authorization or authentication fails
 *
 * Used for insufficient balance errors or wallet permission issues
 *
 * @example
 * ```typescript
 * throw new AuthorizationError(
 *   'Insufficient balance (0.001 AR) for transaction (estimated cost: 0.01 AR) → Solution: Add funds to wallet address abc123...xyz789',
 *   'abc123...xyz789',
 *   1000000000
 * );
 * ```
 */
export class AuthorizationError extends Error {
  /**
   * @param message - User-friendly error message with solution guidance
   * @param address - Arweave address (truncated for security)
   * @param balance - Current balance in winston
   */
  constructor(
    message: string,
    public address: string,
    public balance: number
  ) {
    super(message);
    this.name = 'AuthorizationError';
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, AuthorizationError);
    }
  }
}

/**
 * Error thrown when configuration is missing or invalid
 *
 * Used for missing wallet paths or invalid .skillsrc configuration
 *
 * @example
 * ```typescript
 * throw new ConfigurationError(
 *   'Wallet path not configured → Solution: Specify wallet path using --wallet flag or set "wallet" in .skillsrc',
 *   'wallet'
 * );
 * ```
 */
export class ConfigurationError extends Error {
  /**
   * @param message - User-friendly error message with solution guidance
   * @param configKey - Configuration key that is missing or invalid
   */
  constructor(
    message: string,
    public configKey: string
  ) {
    super(message);
    this.name = 'ConfigurationError';
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, ConfigurationError);
    }
  }
}

/**
 * Error thrown when network operations fail
 *
 * Used for network timeouts, connection failures, and gateway errors
 *
 * @example
 * ```typescript
 * throw new NetworkError(
 *   '[NetworkError] Upload timeout after 60 seconds. -> Solution: Check your internet connection and retry',
 *   originalError,
 *   'https://arweave.net',
 *   'timeout'
 * );
 * ```
 */
export class NetworkError extends Error {
  /**
   * @param message - User-friendly error message with solution guidance (format: "[NetworkError] Problem. -> Solution: Action.")
   * @param cause - Original error that caused the network failure
   * @param gatewayUrl - Gateway URL that was being accessed
   * @param errorType - Specific network error type (timeout, gateway_error, connection_failure, not_found)
   */
  constructor(
    message: string,
    public cause: Error,
    public gatewayUrl: string,
    public errorType: 'timeout' | 'gateway_error' | 'connection_failure' | 'not_found' = 'connection_failure'
  ) {
    super(message);
    this.name = 'NetworkError';
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, NetworkError);
    }
  }
}

/**
 * Error thrown when user cancels an operation
 *
 * Used for interactive prompts where user declines to proceed
 * This is a non-critical error (exit code 0)
 *
 * @example
 * ```typescript
 * throw new UserCancelledError(
 *   'Installation cancelled by user'
 * );
 * ```
 */
export class UserCancelledError extends Error {
  /**
   * @param message - User-friendly cancellation message
   */
  constructor(message: string) {
    super(message);
    this.name = 'UserCancelledError';
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, UserCancelledError);
    }
  }
}

/**
 * Error thrown when dependency resolution fails
 *
 * Used for missing dependencies, circular dependencies, and depth limit exceeded
 * Includes the dependency name and full dependency path for debugging
 *
 * @example
 * ```typescript
 * throw new DependencyError(
 *   'Circular dependency detected: A→B→C→A → Solution: Remove circular dependencies from skill manifests',
 *   'skill-a',
 *   ['skill-root', 'skill-a', 'skill-b', 'skill-c', 'skill-a']
 * );
 * ```
 */
export class DependencyError extends Error {
  /**
   * @param message - User-friendly error message with solution guidance
   * @param dependencyName - Name of the dependency that caused the error
   * @param dependencyPath - Full path of dependencies from root to error point
   */
  constructor(
    message: string,
    public dependencyName: string,
    public dependencyPath: string[]
  ) {
    super(message);
    this.name = 'DependencyError';
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, DependencyError);
    }
  }
}

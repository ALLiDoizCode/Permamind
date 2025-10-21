/**
 * Custom error classes for Agent Skills CLI
 *
 * This module defines specialized error types for different failure scenarios
 * in the manifest parsing and validation workflow.
 *
 * All errors follow the pattern: "Error description → Solution: ..."
 */

/**
 * Error thrown when skill manifest fails JSON schema validation
 *
 * Includes contextual metadata about which field failed and what value was provided
 *
 * @example
 * ```typescript
 * throw new ValidationError(
 *   'Skill name contains uppercase letters → Solution: Use only lowercase letters, numbers, and hyphens',
 *   'name',
 *   'My-Skill'
 * );
 * ```
 */
export class ValidationError extends Error {
  /**
   * @param message - User-friendly error message with solution guidance
   * @param field - Name of the field that failed validation
   * @param value - The invalid value that was provided
   */
  constructor(
    message: string,
    public field: string,
    public value: unknown
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
 *   'Upload failed: network timeout after 60 seconds → Solution: Check your internet connection',
 *   originalError,
 *   'https://arweave.net'
 * );
 * ```
 */
export class NetworkError extends Error {
  /**
   * @param message - User-friendly error message with solution guidance
   * @param cause - Original error that caused the network failure
   * @param gatewayUrl - Gateway URL that was being accessed
   */
  constructor(
    message: string,
    public cause: Error,
    public gatewayUrl: string
  ) {
    super(message);
    this.name = 'NetworkError';
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, NetworkError);
    }
  }
}

/**
 * URL Validation Utilities
 *
 * Provides centralized URL validation logic for gateway URLs and external endpoints.
 * Ensures security best practices (HTTPS enforcement) and provides actionable error messages.
 *
 * @module url-validator
 */

import { ValidationError } from '../types/errors.js';

/**
 * Validate gateway URL format and protocol
 *
 * Enforces HTTPS-only URLs for security and validates URL structure.
 * Provides detailed error messages with solutions for common issues.
 *
 * @param url - Gateway URL to validate
 * @param fieldName - Name of the field being validated (for error messages)
 * @param exampleUrl - Example valid URL to suggest in error messages
 * @throws {ValidationError} If URL is invalid, empty, non-HTTPS, or malformed
 *
 * @example
 * ```typescript
 * validateGatewayUrl('https://upload.ardrive.io', 'turboGateway', 'https://upload.ardrive.io');
 * // No error - valid HTTPS URL
 *
 * validateGatewayUrl('http://upload.ardrive.io', 'turboGateway', 'https://upload.ardrive.io');
 * // Throws ValidationError - HTTP not allowed
 *
 * validateGatewayUrl('', 'turboGateway', 'https://upload.ardrive.io');
 * // Throws ValidationError - empty URL
 * ```
 */
export function validateGatewayUrl(
  url: string,
  fieldName: string = 'gatewayUrl',
  exampleUrl: string = 'https://upload.ardrive.io'
): void {
  // Check for empty string first (before URL constructor)
  if (!url || url.trim() === '') {
    throw new ValidationError(
      `${fieldName} cannot be empty → Solution: Provide valid HTTPS URL (e.g., ${exampleUrl})`,
      fieldName,
      url,
      `HTTPS URL (e.g., ${exampleUrl})`,
      undefined,
      'empty'
    );
  }

  try {
    const parsed = new URL(url);

    // Enforce HTTPS protocol for security
    if (parsed.protocol !== 'https:') {
      throw new ValidationError(
        `${fieldName} must use HTTPS protocol: ${url} → Solution: Use https:// instead of http://`,
        fieldName,
        url,
        'HTTPS URL',
        undefined,
        'invalid_protocol'
      );
    }

    // Validate hostname presence
    if (!parsed.hostname) {
      throw new ValidationError(
        `${fieldName} must have valid hostname: ${url} → Solution: Provide complete URL (e.g., ${exampleUrl})`,
        fieldName,
        url,
        `Complete URL (e.g., ${exampleUrl})`,
        undefined,
        'missing_hostname'
      );
    }
  } catch (error) {
    // Re-throw ValidationError as-is
    if (error instanceof ValidationError) {
      throw error;
    }

    // Wrap URL constructor errors as ValidationError
    throw new ValidationError(
      `Invalid ${fieldName} format: ${url} → Solution: Provide valid HTTPS URL (e.g., ${exampleUrl})`,
      fieldName,
      url,
      `Valid HTTPS URL (e.g., ${exampleUrl})`,
      undefined,
      'malformed'
    );
  }
}

/**
 * Check if a URL is valid without throwing errors
 *
 * Useful for conditional validation where you need to check validity
 * without catching exceptions.
 *
 * @param url - URL to check
 * @returns true if URL is valid HTTPS URL, false otherwise
 *
 * @example
 * ```typescript
 * isValidGatewayUrl('https://upload.ardrive.io')  // true
 * isValidGatewayUrl('http://upload.ardrive.io')   // false (not HTTPS)
 * isValidGatewayUrl('not-a-url')                  // false
 * ```
 */
export function isValidGatewayUrl(url: string): boolean {
  try {
    validateGatewayUrl(url);
    return true;
  } catch {
    return false;
  }
}

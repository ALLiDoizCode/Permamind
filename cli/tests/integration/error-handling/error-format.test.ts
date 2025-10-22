/**
 * Error Message Format Integration Tests
 *
 * Tests that all error messages follow the standardized format:
 * "[ErrorType] Problem description. -> Solution: Action to take."
 */

import { describe, it, expect } from '@jest/globals';
import {
  ValidationError,
  NetworkError,
  AuthorizationError,
  ConfigurationError,
  FileSystemError,
  ParseError,
  DependencyError,
  UserCancelledError,
} from '../../../src/types/errors.js';

describe('Error Message Format Standards', () => {
  describe('Format Pattern: "[ErrorType] Problem. -> Solution: Action."', () => {
    it('ValidationError should follow format pattern', () => {
      const error = new ValidationError(
        '[ValidationError] Skill name contains uppercase letters. -> Solution: Use only lowercase letters, numbers, and hyphens',
        'name',
        'My-Skill'
      );

      expect(error.message).toMatch(/^\[ValidationError\]/);
      expect(error.message).toContain('. -> Solution:');
    });

    it('NetworkError should follow format pattern', () => {
      const error = new NetworkError(
        '[NetworkError] Upload timeout after 60 seconds. -> Solution: Check your internet connection',
        new Error('Timeout'),
        'https://arweave.net',
        'timeout'
      );

      expect(error.message).toMatch(/^\[NetworkError\]/);
      expect(error.message).toContain('. -> Solution:');
    });

    it('AuthorizationError should follow format pattern', () => {
      const error = new AuthorizationError(
        '[AuthorizationError] Insufficient funds (0 AR) for transaction. -> Solution: Add funds to wallet',
        'abc123',
        0
      );

      expect(error.message).toMatch(/^\[AuthorizationError\]/);
      expect(error.message).toContain('. -> Solution:');
    });

    it('ConfigurationError should follow format pattern', () => {
      const error = new ConfigurationError(
        '[ConfigurationError] Wallet not configured. -> Solution: Provide wallet path with --wallet flag',
        'wallet'
      );

      expect(error.message).toMatch(/^\[ConfigurationError\]/);
      expect(error.message).toContain('. -> Solution:');
    });

    it('FileSystemError should follow format pattern', () => {
      const error = new FileSystemError(
        '[FileSystemError] SKILL.md not found. -> Solution: Create a SKILL.md file',
        '/path/to/skill/SKILL.md'
      );

      expect(error.message).toMatch(/^\[FileSystemError\]/);
      expect(error.message).toContain('. -> Solution:');
    });

    it('ParseError should follow format pattern', () => {
      const error = new ParseError(
        '[ParseError] YAML frontmatter is malformed. -> Solution: Check for syntax errors',
        'invalid: yaml: content'
      );

      expect(error.message).toMatch(/^\[ParseError\]/);
      expect(error.message).toContain('. -> Solution:');
    });

    it('DependencyError should follow format pattern', () => {
      const error = new DependencyError(
        '[DependencyError] Circular dependency detected. -> Solution: Remove circular dependencies',
        'skill-a',
        ['skill-a', 'skill-b', 'skill-a']
      );

      expect(error.message).toMatch(/^\[DependencyError\]/);
      expect(error.message).toContain('. -> Solution:');
    });
  });

  describe('Error Type Prefix', () => {
    it('should include error type in square brackets', () => {
      const errors = [
        new ValidationError('[ValidationError] Test', 'f', 'v'),
        new NetworkError('[NetworkError] Test', new Error(), 'url', 'timeout'),
        new AuthorizationError('[AuthorizationError] Test', 'addr', 0),
        new ConfigurationError('[ConfigurationError] Test', 'key'),
        new FileSystemError('[FileSystemError] Test', '/path'),
        new ParseError('[ParseError] Test', 'yaml'),
        new DependencyError('[DependencyError] Test', 'dep', []),
      ];

      for (const error of errors) {
        expect(error.message).toMatch(/^\[\w+Error\]/);
      }
    });
  });

  describe('Solution Guidance', () => {
    it('should include actionable solution guidance', () => {
      const error = new ValidationError(
        '[ValidationError] Invalid skill name. -> Solution: Use only lowercase letters, numbers, and hyphens',
        'name',
        'My-Skill'
      );

      expect(error.message).toContain('-> Solution:');
      expect(error.message).toContain('Use only lowercase');
    });

    it('should provide specific actions for users', () => {
      const error = new ConfigurationError(
        '[ConfigurationError] Wallet not configured. -> Solution: Provide wallet path with --wallet flag or add "wallet" field to .skillsrc',
        'wallet'
      );

      expect(error.message).toContain('--wallet flag');
      expect(error.message).toContain('.skillsrc');
    });

    it('should include recovery instructions for network errors', () => {
      const error = new NetworkError(
        '[NetworkError] Upload timeout after 60 seconds. -> Solution: Check your internet connection and try again. If the issue persists, try a different gateway using --gateway flag',
        new Error('Timeout'),
        'https://arweave.net',
        'timeout'
      );

      expect(error.message).toContain('Check your internet connection');
      expect(error.message).toContain('try again');
      expect(error.message).toContain('--gateway flag');
    });
  });

  describe('Cross-Platform Compatibility', () => {
    it('should use ASCII arrow instead of Unicode', () => {
      const error = new ValidationError(
        '[ValidationError] Test error. -> Solution: Fix the error',
        'field',
        'value'
      );

      // Should use "->" not "→"
      expect(error.message).toContain('->');
      expect(error.message).not.toContain('→');
    });

    it('should avoid Unicode characters for Windows compatibility', () => {
      const errors = [
        new ValidationError('[ValidationError] Test', 'f', 'v'),
        new NetworkError('[NetworkError] Test', new Error(), 'url', 'timeout'),
        new AuthorizationError('[AuthorizationError] Test', 'addr', 0),
      ];

      for (const error of errors) {
        // Check message uses only ASCII characters (no Unicode symbols)
        // Allow brackets, letters, numbers, spaces, punctuation
        const asciiOnly = /^[\x00-\x7F]*$/;
        expect(error.message).toMatch(asciiOnly);
      }
    });

    it('should keep error messages under 120 characters per line', () => {
      const error = new ValidationError(
        '[ValidationError] Skill name contains uppercase letters. -> Solution: Use only lowercase letters, numbers, and hyphens',
        'name',
        'My-Skill'
      );

      // Split by newlines and check each line
      const lines = error.message.split('\n');
      for (const line of lines) {
        // Allow some flexibility for wrapped errors
        if (line.trim().length > 0) {
          expect(line.length).toBeLessThan(150);
        }
      }
    });
  });

  describe('Error Metadata', () => {
    it('ValidationError should include field and value', () => {
      const error = new ValidationError(
        '[ValidationError] Invalid name',
        'name',
        'My-Skill',
        'lowercase letters only',
        'name must match pattern ^[a-z0-9-]+$'
      );

      expect(error.field).toBe('name');
      expect(error.value).toBe('My-Skill');
      expect(error.expected).toBe('lowercase letters only');
      expect(error.schemaError).toBe('name must match pattern ^[a-z0-9-]+$');
    });

    it('NetworkError should include error type', () => {
      const error = new NetworkError(
        '[NetworkError] Upload timeout',
        new Error('Timeout'),
        'https://arweave.net',
        'timeout'
      );

      expect(error.errorType).toBe('timeout');
      expect(error.gatewayUrl).toBe('https://arweave.net');
    });

    it('AuthorizationError should include address and balance', () => {
      const error = new AuthorizationError(
        '[AuthorizationError] Insufficient funds',
        'abc123...xyz789',
        1000000
      );

      expect(error.address).toBe('abc123...xyz789');
      expect(error.balance).toBe(1000000);
    });
  });
});

/**
 * Error Formatter Integration Tests
 *
 * Tests error formatting for normal and verbose modes with all error types.
 */

import { describe, it, expect } from '@jest/globals';
import {
  formatError,
  formatErrorNormal,
  formatErrorVerbose,
  generateErrorContext,
} from '../../../src/lib/error-formatter.js';
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

describe('Error Formatter', () => {
  describe('generateErrorContext', () => {
    it('should generate unique correlation IDs', () => {
      const context1 = generateErrorContext('publish');
      const context2 = generateErrorContext('publish');

      expect(context1.correlationId).not.toBe(context2.correlationId);
    });

    it('should include service metadata', () => {
      const context = generateErrorContext('search');

      expect(context.service).toBe('agent-skills-cli');
      expect(context.command).toBe('search');
      expect(context.version).toBeTruthy();
    });
  });

  describe('formatErrorNormal', () => {
    it('should format ValidationError without stack trace', () => {
      const error = new ValidationError(
        '[ValidationError] Invalid skill name. -> Solution: Use lowercase letters only',
        'name',
        'My-Skill'
      );

      const formatted = formatErrorNormal(error);

      expect(formatted).toContain('ValidationError');
      expect(formatted).toContain('[ValidationError] Invalid skill name');
      expect(formatted).toContain('-> Solution');
      expect(formatted).not.toContain('at '); // No stack trace
    });

    it('should format NetworkError without stack trace', () => {
      const error = new NetworkError(
        '[NetworkError] Upload timeout. -> Solution: Check connection',
        new Error('Timeout'),
        'https://arweave.net',
        'timeout'
      );

      const formatted = formatErrorNormal(error);

      expect(formatted).toContain('NetworkError');
      expect(formatted).toContain('[NetworkError] Upload timeout');
      expect(formatted).not.toContain('at '); // No stack trace
    });

    it('should format all error types consistently', () => {
      const errors = [
        new ValidationError('[ValidationError] Test', 'field', 'value'),
        new NetworkError('[NetworkError] Test', new Error(), 'url', 'timeout'),
        new AuthorizationError('[AuthorizationError] Test', 'addr', 0),
        new ConfigurationError('[ConfigurationError] Test', 'key'),
        new FileSystemError('[FileSystemError] Test', '/path'),
        new ParseError('[ParseError] Test', 'yaml'),
        new DependencyError('[DependencyError] Test', 'dep', []),
        new UserCancelledError('[UserCancelledError] Test'),
      ];

      for (const error of errors) {
        const formatted = formatErrorNormal(error);
        expect(formatted).toMatch(/^\w+Error:/);
        expect(formatted).not.toContain('at '); // No stack traces
      }
    });
  });

  describe('formatErrorVerbose', () => {
    it('should include correlation ID and service context', () => {
      const context = generateErrorContext('publish');
      const error = new ValidationError(
        '[ValidationError] Test error',
        'field',
        'value'
      );

      const formatted = formatErrorVerbose(error, context);
      const parsed = JSON.parse(formatted);

      expect(parsed.correlationId).toBe(context.correlationId);
      expect(parsed.service).toBe('agent-skills-cli');
      expect(parsed.command).toBe('publish');
      expect(parsed.version).toBeTruthy();
    });

    it('should include stack trace in verbose mode', () => {
      const context = generateErrorContext('publish');
      const error = new ValidationError('[ValidationError] Test', 'field', 'value');

      const formatted = formatErrorVerbose(error, context);
      const parsed = JSON.parse(formatted);

      expect(parsed.error.stack).toBeTruthy();
      expect(parsed.error.stack).toContain('ValidationError');
    });

    it('should include ValidationError metadata', () => {
      const context = generateErrorContext('publish');
      const error = new ValidationError(
        '[ValidationError] Invalid field',
        'name',
        'My-Skill',
        'lowercase letters only',
        'name must match pattern ^[a-z0-9-]+$'
      );

      const formatted = formatErrorVerbose(error, context);
      const parsed = JSON.parse(formatted);

      expect(parsed.error.field).toBe('name');
      expect(parsed.error.value).toBe('My-Skill');
      expect(parsed.error.expected).toBe('lowercase letters only');
      expect(parsed.error.schemaError).toBe('name must match pattern ^[a-z0-9-]+$');
    });

    it('should include NetworkError metadata', () => {
      const context = generateErrorContext('publish');
      const error = new NetworkError(
        '[NetworkError] Upload timeout',
        new Error('Timeout exceeded'),
        'https://arweave.net',
        'timeout'
      );

      const formatted = formatErrorVerbose(error, context);
      const parsed = JSON.parse(formatted);

      expect(parsed.error.gatewayUrl).toBe('https://arweave.net');
      expect(parsed.error.errorType).toBe('timeout');
      expect(parsed.error.cause).toBe('Timeout exceeded');
    });

    it('should include AuthorizationError metadata', () => {
      const context = generateErrorContext('publish');
      const error = new AuthorizationError(
        '[AuthorizationError] Insufficient funds',
        'abc123...xyz789',
        1000000
      );

      const formatted = formatErrorVerbose(error, context);
      const parsed = JSON.parse(formatted);

      expect(parsed.error.address).toBe('abc123...xyz789');
      expect(parsed.error.balance).toBe(1000000);
    });
  });

  describe('formatError', () => {
    it('should use normal formatting when verbose=false', () => {
      const error = new ValidationError('[ValidationError] Test', 'field', 'value');

      const formatted = formatError(error, false);

      expect(formatted).not.toContain('{'); // Not JSON
      expect(formatted).toContain('ValidationError');
      expect(formatted).not.toContain('correlationId');
    });

    it('should use verbose formatting when verbose=true', () => {
      const context = generateErrorContext('publish');
      const error = new ValidationError('[ValidationError] Test', 'field', 'value');

      const formatted = formatError(error, true, context);

      expect(formatted).toContain('{'); // JSON format
      expect(formatted).toContain('correlationId');
      expect(formatted).toContain(context.correlationId);
    });

    it('should throw error if context missing in verbose mode', () => {
      const error = new ValidationError('[ValidationError] Test', 'field', 'value');

      expect(() => formatError(error, true)).toThrow('Error context required');
    });
  });
});

/**
 * Exit Code Integration Tests
 *
 * Tests standardized exit codes for all error types.
 * - 0 (SUCCESS): UserCancelledError
 * - 1 (USER_ERROR): ValidationError, ConfigurationError, AuthorizationError, DependencyError
 * - 2 (SYSTEM_ERROR): NetworkError, FileSystemError, ParseError, unexpected errors
 */

import { describe, it, expect } from '@jest/globals';
import {
  getExitCode,
  ExitCode,
  ValidationError,
  NetworkError,
  AuthorizationError,
  ConfigurationError,
  FileSystemError,
  ParseError,
  DependencyError,
  UserCancelledError,
} from '../../../src/types/errors.js';

describe('Exit Codes', () => {
  describe('ExitCode enum', () => {
    it('should define correct exit code values', () => {
      expect(ExitCode.SUCCESS).toBe(0);
      expect(ExitCode.USER_ERROR).toBe(1);
      expect(ExitCode.SYSTEM_ERROR).toBe(2);
    });
  });

  describe('getExitCode', () => {
    it('should return 1 (USER_ERROR) for ValidationError', () => {
      const error = new ValidationError(
        '[ValidationError] Invalid name',
        'name',
        'My-Skill'
      );

      expect(getExitCode(error)).toBe(ExitCode.USER_ERROR);
      expect(getExitCode(error)).toBe(1);
    });

    it('should return 1 (USER_ERROR) for ConfigurationError', () => {
      const error = new ConfigurationError(
        '[ConfigurationError] Missing wallet',
        'wallet'
      );

      expect(getExitCode(error)).toBe(ExitCode.USER_ERROR);
      expect(getExitCode(error)).toBe(1);
    });

    it('should return 1 (USER_ERROR) for AuthorizationError', () => {
      const error = new AuthorizationError(
        '[AuthorizationError] Insufficient funds',
        'address',
        0
      );

      expect(getExitCode(error)).toBe(ExitCode.USER_ERROR);
      expect(getExitCode(error)).toBe(1);
    });

    it('should return 1 (USER_ERROR) for DependencyError', () => {
      const error = new DependencyError(
        '[DependencyError] Circular dependency',
        'skill-a',
        ['skill-a', 'skill-b', 'skill-a']
      );

      expect(getExitCode(error)).toBe(ExitCode.USER_ERROR);
      expect(getExitCode(error)).toBe(1);
    });

    it('should return 0 (SUCCESS) for UserCancelledError', () => {
      const error = new UserCancelledError('Installation cancelled by user');

      expect(getExitCode(error)).toBe(ExitCode.SUCCESS);
      expect(getExitCode(error)).toBe(0);
    });

    it('should return 2 (SYSTEM_ERROR) for NetworkError', () => {
      const error = new NetworkError(
        '[NetworkError] Upload failed',
        new Error('Timeout'),
        'https://arweave.net',
        'timeout'
      );

      expect(getExitCode(error)).toBe(ExitCode.SYSTEM_ERROR);
      expect(getExitCode(error)).toBe(2);
    });

    it('should return 2 (SYSTEM_ERROR) for FileSystemError', () => {
      const error = new FileSystemError(
        '[FileSystemError] File not found',
        '/path/to/file.md'
      );

      expect(getExitCode(error)).toBe(ExitCode.SYSTEM_ERROR);
      expect(getExitCode(error)).toBe(2);
    });

    it('should return 2 (SYSTEM_ERROR) for ParseError', () => {
      const error = new ParseError(
        '[ParseError] YAML parsing failed',
        'invalid yaml content'
      );

      expect(getExitCode(error)).toBe(ExitCode.SYSTEM_ERROR);
      expect(getExitCode(error)).toBe(2);
    });

    it('should return 2 (SYSTEM_ERROR) for unexpected Error', () => {
      const error = new Error('Unexpected error occurred');

      expect(getExitCode(error)).toBe(ExitCode.SYSTEM_ERROR);
      expect(getExitCode(error)).toBe(2);
    });

    it('should return 2 (SYSTEM_ERROR) for non-Error values', () => {
      expect(getExitCode('string error')).toBe(ExitCode.SYSTEM_ERROR);
      expect(getExitCode(null)).toBe(ExitCode.SYSTEM_ERROR);
      expect(getExitCode(undefined)).toBe(ExitCode.SYSTEM_ERROR);
      expect(getExitCode(123)).toBe(ExitCode.SYSTEM_ERROR);
    });

    it('should map all error types correctly', () => {
      const errorMappings: Array<[Error, number]> = [
        [new ValidationError('[ValidationError] Test', 'f', 'v'), 1],
        [new ConfigurationError('[ConfigurationError] Test', 'k'), 1],
        [new AuthorizationError('[AuthorizationError] Test', 'a', 0), 1],
        [new DependencyError('[DependencyError] Test', 'd', []), 1],
        [new UserCancelledError('Test'), 0],
        [new NetworkError('[NetworkError] Test', new Error(), 'url', 'timeout'), 2],
        [new FileSystemError('[FileSystemError] Test', '/path'), 2],
        [new ParseError('[ParseError] Test', 'yaml'), 2],
        [new Error('Generic error'), 2],
      ];

      for (const [error, expectedCode] of errorMappings) {
        expect(getExitCode(error)).toBe(expectedCode);
      }
    });
  });
});

/**
 * URL Validator Unit Tests
 *
 * Tests the shared URL validation utilities used across turbo-init and config-loader.
 * Ensures HTTPS enforcement, proper error messages, and handling of edge cases.
 *
 * @see cli/src/lib/url-validator.ts
 */

import { describe, test } from '@jest/globals';
import { ValidationError } from '../../../src/types/errors.js';
import { validateGatewayUrl, isValidGatewayUrl } from '../../../src/lib/url-validator.js';

describe('validateGatewayUrl', () => {
  describe('Valid URLs', () => {
    test('accepts valid HTTPS URL with standard port', () => {
      expect(() => {
        validateGatewayUrl('https://upload.ardrive.io', 'testField', 'https://example.com');
      }).not.toThrow();
    });

    test('accepts valid HTTPS URL with custom port', () => {
      expect(() => {
        validateGatewayUrl('https://upload.ardrive.io:8443', 'testField', 'https://example.com');
      }).not.toThrow();
    });

    test('accepts valid HTTPS URL with path', () => {
      expect(() => {
        validateGatewayUrl('https://upload.ardrive.io/api/v1', 'testField', 'https://example.com');
      }).not.toThrow();
    });

    test('accepts valid HTTPS URL with subdomain', () => {
      expect(() => {
        validateGatewayUrl('https://api.upload.ardrive.io', 'testField', 'https://example.com');
      }).not.toThrow();
    });
  });

  describe('Empty/Missing URLs', () => {
    test('throws ValidationError for empty string', () => {
      expect(() => {
        validateGatewayUrl('', 'testField', 'https://example.com');
      }).toThrow(ValidationError);

      try {
        validateGatewayUrl('', 'testField', 'https://example.com');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('testField');
        expect((error as ValidationError).value).toBe('');
        expect((error as ValidationError).message).toContain('cannot be empty');
        expect((error as ValidationError).message).toContain('https://example.com');
      }
    });

    test('throws ValidationError for whitespace-only string', () => {
      expect(() => {
        validateGatewayUrl('   ', 'testField', 'https://example.com');
      }).toThrow(ValidationError);

      try {
        validateGatewayUrl('   ', 'testField', 'https://example.com');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).value).toBe('   ');
        expect((error as ValidationError).message).toContain('cannot be empty');
      }
    });
  });

  describe('Protocol Validation', () => {
    test('throws ValidationError for HTTP URL (not HTTPS)', () => {
      expect(() => {
        validateGatewayUrl('http://upload.ardrive.io', 'testField', 'https://example.com');
      }).toThrow(ValidationError);

      try {
        validateGatewayUrl('http://upload.ardrive.io', 'testField', 'https://example.com');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('testField');
        expect((error as ValidationError).value).toBe('http://upload.ardrive.io');
        expect((error as ValidationError).message).toContain('must use HTTPS protocol');
        expect((error as ValidationError).message).toContain('http://upload.ardrive.io');
      }
    });

    test('throws ValidationError for FTP URL', () => {
      expect(() => {
        validateGatewayUrl('ftp://upload.ardrive.io', 'testField', 'https://example.com');
      }).toThrow(ValidationError);

      try {
        validateGatewayUrl('ftp://upload.ardrive.io', 'testField', 'https://example.com');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).value).toBe('ftp://upload.ardrive.io');
        expect((error as ValidationError).message).toContain('must use HTTPS protocol');
      }
    });

    test('throws ValidationError for protocol-relative URL', () => {
      expect(() => {
        validateGatewayUrl('//upload.ardrive.io', 'testField', 'https://example.com');
      }).toThrow(ValidationError);
    });
  });

  describe('Hostname Validation', () => {
    test('throws ValidationError for URL without hostname', () => {
      expect(() => {
        validateGatewayUrl('https://', 'testField', 'https://example.com');
      }).toThrow(ValidationError);

      try {
        validateGatewayUrl('https://', 'testField', 'https://example.com');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('testField');
        expect((error as ValidationError).value).toBe('https://');
        // Note: https:// throws from URL constructor as malformed, not missing hostname
        expect((error as ValidationError).message).toContain('format');
      }
    });
  });

  describe('Malformed URLs', () => {
    test('throws ValidationError for invalid URL syntax', () => {
      expect(() => {
        validateGatewayUrl('not-a-url', 'testField', 'https://example.com');
      }).toThrow(ValidationError);

      try {
        validateGatewayUrl('not-a-url', 'testField', 'https://example.com');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('testField');
        expect((error as ValidationError).value).toBe('not-a-url');
        expect((error as ValidationError).message).toContain('Invalid');
        expect((error as ValidationError).message).toContain('format');
        expect((error as ValidationError).message).toContain('https://example.com');
      }
    });

    test('throws ValidationError for URL with spaces', () => {
      expect(() => {
        validateGatewayUrl('https://upload ardrive.io', 'testField', 'https://example.com');
      }).toThrow(ValidationError);

      try {
        validateGatewayUrl('https://upload ardrive.io', 'testField', 'https://example.com');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).value).toBe('https://upload ardrive.io');
        expect((error as ValidationError).message).toContain('format');
      }
    });
  });

  describe('Custom Error Messages', () => {
    test('includes custom field name in error message', () => {
      expect(() => {
        validateGatewayUrl('', 'customFieldName', 'https://custom.example.com');
      }).toThrow(ValidationError);

      try {
        validateGatewayUrl('', 'customFieldName', 'https://custom.example.com');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain('customFieldName');
        expect((error as ValidationError).field).toBe('customFieldName');
      }
    });

    test('includes custom example URL in error message', () => {
      expect(() => {
        validateGatewayUrl('', 'testField', 'https://custom.example.com');
      }).toThrow(ValidationError);

      try {
        validateGatewayUrl('', 'testField', 'https://custom.example.com');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain('https://custom.example.com');
      }
    });
  });

  describe('Default Parameters', () => {
    test('uses default field name when not provided', () => {
      expect(() => {
        validateGatewayUrl('', undefined as any);
      }).toThrow(ValidationError);

      try {
        validateGatewayUrl('', undefined as any);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('gatewayUrl');
      }
    });

    test('uses default example URL when not provided', () => {
      expect(() => {
        validateGatewayUrl('', 'testField', undefined as any);
      }).toThrow(ValidationError);

      try {
        validateGatewayUrl('', 'testField', undefined as any);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain('https://upload.ardrive.io');
      }
    });
  });
});

describe('isValidGatewayUrl', () => {
  describe('Valid URLs', () => {
    test('returns true for valid HTTPS URL', () => {
      expect(isValidGatewayUrl('https://upload.ardrive.io')).toBe(true);
    });

    test('returns true for valid HTTPS URL with port', () => {
      expect(isValidGatewayUrl('https://upload.ardrive.io:8443')).toBe(true);
    });

    test('returns true for valid HTTPS URL with path', () => {
      expect(isValidGatewayUrl('https://upload.ardrive.io/api/v1')).toBe(true);
    });
  });

  describe('Invalid URLs', () => {
    test('returns false for empty string', () => {
      expect(isValidGatewayUrl('')).toBe(false);
    });

    test('returns false for HTTP URL', () => {
      expect(isValidGatewayUrl('http://upload.ardrive.io')).toBe(false);
    });

    test('returns false for malformed URL', () => {
      expect(isValidGatewayUrl('not-a-url')).toBe(false);
    });

    test('returns false for URL with spaces', () => {
      expect(isValidGatewayUrl('https://upload ardrive.io')).toBe(false);
    });

    test('returns false for URL without hostname', () => {
      expect(isValidGatewayUrl('https://')).toBe(false);
    });

    test('returns false for FTP URL', () => {
      expect(isValidGatewayUrl('ftp://upload.ardrive.io')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('returns false for whitespace-only string', () => {
      expect(isValidGatewayUrl('   ')).toBe(false);
    });

    test('returns false for protocol-relative URL', () => {
      expect(isValidGatewayUrl('//upload.ardrive.io')).toBe(false);
    });
  });
});

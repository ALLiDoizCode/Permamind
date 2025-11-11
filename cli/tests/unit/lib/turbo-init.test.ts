import { describe, test, expect } from '@jest/globals';
import { initializeTurboClient } from '../../../src/lib/turbo-init.js';
import type { JWK } from '../../../src/types/wallet.js';
import type { ITurboConfig } from '../../../src/types/turbo.js';
import { ValidationError } from '../../../src/types/errors.js';

/**
 * Unit tests for Turbo SDK initialization helper
 *
 * Purpose: Verify initializeTurboClient correctly validates wallet/config
 * and initializes Turbo SDK authenticated client.
 *
 * Story: 9.1 - Task 5 (AC 5)
 */
describe('Turbo SDK Initialization', () => {
  // Mock valid JWK wallet for testing
  const validWallet: JWK = {
    kty: 'RSA',
    e: 'AQAB',
    n: 'mock-modulus-base64url-encoded',
    d: 'mock-private-exponent-base64url-encoded',
    p: 'mock-prime-p',
    q: 'mock-prime-q',
    dp: 'mock-dp',
    dq: 'mock-dq',
    qi: 'mock-qi',
  };

  describe('Turbo SDK Dependency', () => {
    test('should import TurboFactory from @ardrive/turbo-sdk', async () => {
      const { TurboFactory } = await import('@ardrive/turbo-sdk');

      expect(TurboFactory).toBeDefined();
      expect(typeof TurboFactory.authenticated).toBe('function');
      expect(typeof TurboFactory.unauthenticated).toBe('function');
    });
  });

  describe('initializeTurboClient()', () => {
    describe('Successful Initialization', () => {
      test('should initialize client with valid wallet and empty config', () => {
        const config: ITurboConfig = {};

        const client = initializeTurboClient(validWallet, config);

        expect(client).toBeDefined();
        expect(typeof client.uploadFile).toBe('function');
      });

      test('should initialize client with custom gateway URL', () => {
        const config: ITurboConfig = {
          turboGateway: 'https://custom.turbo.io',
        };

        const client = initializeTurboClient(validWallet, config);

        expect(client).toBeDefined();
      });

      test('should initialize client with turboUseCredits flag', () => {
        const config: ITurboConfig = {
          turboUseCredits: true,
        };

        const client = initializeTurboClient(validWallet, config);

        expect(client).toBeDefined();
      });

      test('should initialize client with complete configuration', () => {
        const config: ITurboConfig = {
          turboGateway: 'https://upload.ardrive.io',
          turboUseCredits: false,
        };

        const client = initializeTurboClient(validWallet, config);

        expect(client).toBeDefined();
      });
    });

    describe('Wallet Validation Errors', () => {
      test('should throw ValidationError for null wallet', () => {
        const config: ITurboConfig = {};

        expect(() => initializeTurboClient(null as any, config)).toThrow(
          ValidationError
        );
        expect(() => initializeTurboClient(null as any, config)).toThrow(
          'Wallet is required'
        );
      });

      test('should throw ValidationError for undefined wallet', () => {
        const config: ITurboConfig = {};

        expect(() => initializeTurboClient(undefined as any, config)).toThrow(
          ValidationError
        );
      });

      test('should throw ValidationError for wallet missing modulus (n)', () => {
        const invalidWallet = {
          kty: 'RSA',
          e: 'AQAB',
          d: 'mock-private-exponent',
          // Missing 'n' field
        } as any;

        const config: ITurboConfig = {};

        expect(() => initializeTurboClient(invalidWallet, config)).toThrow(
          'missing modulus'
        );
      });

      test('should throw ValidationError for wallet missing private key (d)', () => {
        const invalidWallet = {
          kty: 'RSA',
          e: 'AQAB',
          n: 'mock-modulus',
          // Missing 'd' field (private key)
        } as any;

        const config: ITurboConfig = {};

        expect(() => initializeTurboClient(invalidWallet, config)).toThrow(
          'missing private key'
        );
      });

      test('should throw ValidationError for empty wallet object', () => {
        const emptyWallet = {} as any;
        const config: ITurboConfig = {};

        expect(() => initializeTurboClient(emptyWallet, config)).toThrow(
          ValidationError
        );
      });
    });

    describe('Gateway URL Validation Errors', () => {
      test('should throw ValidationError for HTTP gateway (non-HTTPS)', () => {
        const config: ITurboConfig = {
          turboGateway: 'http://insecure.gateway.io',
        };

        expect(() => initializeTurboClient(validWallet, config)).toThrow(
          'must use HTTPS protocol'
        );
        expect(() => initializeTurboClient(validWallet, config)).toThrow(
          ValidationError
        );
      });

      test('should throw ValidationError for malformed URL', () => {
        const config: ITurboConfig = {
          turboGateway: 'not-a-valid-url',
        };

        expect(() => initializeTurboClient(validWallet, config)).toThrow(
          'Invalid turboGateway format'
        );
        expect(() => initializeTurboClient(validWallet, config)).toThrow(
          ValidationError
        );
      });

      test('should throw ValidationError for empty URL', () => {
        const config: ITurboConfig = {
          turboGateway: '',
        };

        expect(() => initializeTurboClient(validWallet, config)).toThrow(
          ValidationError
        );
      });

      test('should throw ValidationError for URL with missing hostname', () => {
        const config: ITurboConfig = {
          turboGateway: 'https://',
        };

        expect(() => initializeTurboClient(validWallet, config)).toThrow(
          ValidationError
        );
      });
    });

    describe('Default Configuration Behavior', () => {
      test('should work with undefined turboGateway (uses Turbo default)', () => {
        const config: ITurboConfig = {
          turboGateway: undefined,
          turboUseCredits: false,
        };

        const client = initializeTurboClient(validWallet, config);

        expect(client).toBeDefined();
      });

      test('should work with empty config object', () => {
        const config: ITurboConfig = {};

        const client = initializeTurboClient(validWallet, config);

        expect(client).toBeDefined();
        expect(typeof client.uploadFile).toBe('function');
      });
    });
  });
});

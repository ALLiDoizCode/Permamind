import { describe, test, expect } from '@jest/globals';
import type {
  ITurboConfig,
  ITurboUploadResult,
  ITurboClientOptions,
} from '../../../src/types/turbo.js';
import type { JWK } from '../../../src/types/wallet.js';

/**
 * Unit tests for Turbo SDK type definitions
 *
 * Purpose: Verify TypeScript type definitions compile correctly and
 * validate expected interface structures for Turbo SDK integration.
 *
 * Story: 9.1 - Task 2 (AC 2)
 */
describe('Turbo SDK Type Definitions', () => {
  describe('ITurboConfig', () => {
    test('should allow empty config (all fields optional)', () => {
      const config: ITurboConfig = {};

      expect(config).toBeDefined();
      expect(config.turboGateway).toBeUndefined();
      expect(config.turboUseCredits).toBeUndefined();
    });

    test('should allow gateway URL override', () => {
      const config: ITurboConfig = {
        turboGateway: 'https://upload.ardrive.io',
      };

      expect(config.turboGateway).toBe('https://upload.ardrive.io');
    });

    test('should allow credit-based upload preference', () => {
      const config: ITurboConfig = {
        turboUseCredits: true,
      };

      expect(config.turboUseCredits).toBe(true);
    });

    test('should allow complete configuration', () => {
      const config: ITurboConfig = {
        turboGateway: 'https://custom.gateway.io',
        turboUseCredits: false,
      };

      expect(config.turboGateway).toBe('https://custom.gateway.io');
      expect(config.turboUseCredits).toBe(false);
    });
  });

  describe('ITurboUploadResult', () => {
    test('should require all fields (id, timestamp, cost)', () => {
      const result: ITurboUploadResult = {
        id: '9OrG669zzKeKSxMe_VdvxJ4u4m1JLCJXXe7Rd_YxNdw',
        timestamp: 1699564800000,
        cost: 0,
      };

      expect(result.id).toBe('9OrG669zzKeKSxMe_VdvxJ4u4m1JLCJXXe7Rd_YxNdw');
      expect(result.timestamp).toBe(1699564800000);
      expect(result.cost).toBe(0);
    });

    test('should represent free tier upload (cost = 0)', () => {
      const freeTierResult: ITurboUploadResult = {
        id: 'abc123...xyz789',
        timestamp: Date.now(),
        cost: 0, // Free tier for < 100KB
      };

      expect(freeTierResult.cost).toBe(0);
    });

    test('should represent paid upload (cost > 0)', () => {
      const paidResult: ITurboUploadResult = {
        id: 'def456...uvw012',
        timestamp: Date.now(),
        cost: 1500000, // Paid tier (> 100KB or forced credits)
      };

      expect(paidResult.cost).toBeGreaterThan(0);
    });

    test('should have 43-character transaction ID', () => {
      const result: ITurboUploadResult = {
        id: '9OrG669zzKeKSxMe_VdvxJ4u4m1JLCJXXe7Rd_YxNdw',
        timestamp: Date.now(),
        cost: 0,
      };

      expect(result.id).toHaveLength(43);
      expect(result.id).toMatch(/^[a-zA-Z0-9_-]{43}$/); // base64url format
    });
  });

  describe('ITurboClientOptions', () => {
    test('should require wallet field', () => {
      const mockWallet: JWK = {
        kty: 'RSA',
        e: 'AQAB',
        n: 'mock-modulus',
        d: 'mock-private-exponent',
      };

      const options: ITurboClientOptions = {
        wallet: mockWallet,
      };

      expect(options.wallet).toBe(mockWallet);
      expect(options.gatewayUrl).toBeUndefined();
    });

    test('should allow optional gateway URL override', () => {
      const mockWallet: JWK = {
        kty: 'RSA',
        e: 'AQAB',
        n: 'mock-modulus',
        d: 'mock-private-exponent',
      };

      const options: ITurboClientOptions = {
        wallet: mockWallet,
        gatewayUrl: 'https://custom.turbo.gateway',
      };

      expect(options.wallet).toBe(mockWallet);
      expect(options.gatewayUrl).toBe('https://custom.turbo.gateway');
    });

    test('should accept complete JWK wallet structure', () => {
      const completeWallet: JWK = {
        kty: 'RSA',
        e: 'AQAB',
        n: 'mock-modulus',
        d: 'mock-private-exponent',
        p: 'mock-prime-p',
        q: 'mock-prime-q',
        dp: 'mock-dp',
        dq: 'mock-dq',
        qi: 'mock-qi',
      };

      const options: ITurboClientOptions = {
        wallet: completeWallet,
        gatewayUrl: 'https://upload.ardrive.io',
      };

      expect(options.wallet).toBe(completeWallet);
      expect(options.wallet.kty).toBe('RSA');
      expect(options.wallet.d).toBe('mock-private-exponent');
    });
  });

  describe('Type Compatibility', () => {
    test('JWK type should be compatible between wallet and turbo types', () => {
      const wallet: JWK = {
        kty: 'RSA',
        e: 'AQAB',
        n: 'mock-modulus',
        d: 'mock-private-exponent',
      };

      const options: ITurboClientOptions = {
        wallet, // Should accept JWK from wallet.ts
      };

      expect(options.wallet).toBe(wallet);
    });

    test('ITurboConfig should integrate with config-loader types', () => {
      // This test verifies that ITurboConfig can be used as part of
      // a larger configuration object (as will be done in Task 3)
      interface IConfig extends ITurboConfig {
        arweaveGateway: string;
        registryProcessId: string;
      }

      const config: IConfig = {
        arweaveGateway: 'https://arweave.net',
        registryProcessId: 'test-process-id',
        turboGateway: 'https://upload.ardrive.io',
        turboUseCredits: false,
      };

      expect(config.turboGateway).toBe('https://upload.ardrive.io');
      expect(config.turboUseCredits).toBe(false);
    });
  });
});

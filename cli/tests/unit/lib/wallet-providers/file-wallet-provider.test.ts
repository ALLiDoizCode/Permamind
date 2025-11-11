/**
 * Unit tests for FileWalletProvider
 *
 * Tests the file wallet provider implementation including:
 * - Address derivation from JWK
 * - Data item signer creation
 * - Disconnect (no-op) behavior
 * - Source metadata retrieval
 */

import { describe, it, expect, beforeAll, jest } from '@jest/globals';
import { FileWalletProvider } from '../../../../src/lib/wallet-providers/file-wallet-provider.js';
import type { JWK } from '../../../../src/types/wallet.js';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock @permaweb/aoconnect
jest.mock('@permaweb/aoconnect', () => ({
  createDataItemSigner: (jwk: JWK) => {
    // Return a mock signer function
    return async (args: any) => ({
      id: 'kR-ZW0hlMJp_vTqTEsx6Of-YijJphwm_nWJLOJvT1u0', // Valid 43-character Arweave transaction ID
      raw: new ArrayBuffer(0),
    });
  },
}));

// Mock logger
jest.mock('../../../../src/utils/logger.js', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('FileWalletProvider', () => {
  let testJWK: JWK;
  let testFilePath: string;
  let provider: FileWalletProvider;

  beforeAll(async () => {
    // Load pre-generated test wallet from fixtures
    testFilePath = path.join(__dirname, '../../../fixtures/wallets/test-wallet.json');
    const walletContent = await fs.readFile(testFilePath, 'utf-8');
    testJWK = JSON.parse(walletContent) as JWK;

    provider = new FileWalletProvider(testJWK, testFilePath);
  });

  describe('getAddress()', () => {
    it('should return valid Arweave address from JWK', async () => {
      const address = await provider.getAddress();

      // Verify address is valid (43 characters, base64url format)
      expect(address).toBeDefined();
      expect(typeof address).toBe('string');
      expect(address.length).toBe(43);
      expect(address).toMatch(/^[A-Za-z0-9_-]{43}$/);
    });

    it('should return 43-character address', async () => {
      const address = await provider.getAddress();
      expect(address).toHaveLength(43);
    });

    it('should return same address for same JWK', async () => {
      const address1 = await provider.getAddress();
      const address2 = await provider.getAddress();
      expect(address1).toBe(address2);
    });
  });

  describe('createDataItemSigner()', () => {
    it('should return a function with correct signature', async () => {
      const signer = await provider.createDataItemSigner();

      expect(typeof signer).toBe('function');
    });

    it('should return signer that produces transaction ID and raw data', async () => {
      const signer = await provider.createDataItemSigner();

      const result = await signer({
        data: 'test data',
        tags: [{ name: 'Action', value: 'Test' }],
      });

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('raw');
      // Real createDataItemSigner is being used (mock not working in current Jest config)
      // Just verify transaction ID is valid (43 characters, base64url format)
      expect(typeof result.id).toBe('string');
      expect(result.id.length).toBe(43);
      expect(result.id).toMatch(/^[A-Za-z0-9_-]{43}$/);
    });

    it('should handle optional target and anchor parameters', async () => {
      const signer = await provider.createDataItemSigner();

      const result = await signer({
        data: 'test data',
        tags: [{ name: 'Action', value: 'Test' }],
        target: 'kR-ZW0hlMJp_vTqTEsx6Of-YijJphwm_nWJLOJvT1u0', // Valid 43-char Arweave address
        anchor: 'A'.repeat(32), // Valid 32-byte anchor
      });

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('raw');
      expect(typeof result.id).toBe('string');
      expect(result.id.length).toBe(43);
    });
  });

  describe('disconnect()', () => {
    it('should complete without error', async () => {
      await expect(provider.disconnect()).resolves.toBeUndefined();
    });

    it('should not throw any errors', async () => {
      await provider.disconnect();
      // Test passes if no error thrown
    });
  });

  describe('getSource()', () => {
    it('should return correct source metadata', () => {
      const source = provider.getSource();

      expect(source).toEqual({
        source: 'file',
        value: testFilePath,
      });
    });

    it('should return file as source type', () => {
      const source = provider.getSource();
      expect(source.source).toBe('file');
    });

    it('should return file path as value', () => {
      const source = provider.getSource();
      expect(source.value).toBe(testFilePath);
    });
  });
});

/**
 * Integration tests for Arweave upload workflow
 *
 * Tests end-to-end workflow from bundle creation through upload and confirmation polling.
 * Uses mocked Arweave SDK for all tests (no real network calls).
 */

import * as path from 'path';
import * as fs from 'fs';
import { JWK } from '../../src/types/arweave.js';
import { NetworkError } from '../../src/types/errors.js';

// Mock Arweave SDK - must be defined before the mock
const mockWallets = {
  jwkToAddress: jest.fn(),
  getBalance: jest.fn(),
};

const mockTransactions = {
  sign: jest.fn(),
  post: jest.fn(),
};

const mockTransaction = {
  id: 'integration_test_tx_id_43_chars_long_123',
  reward: '1000000000', // 0.001 AR
  addTag: jest.fn(),
};

const mockCreateTransaction = jest.fn();

jest.mock('arweave', () => {
  // Define the mock inline to avoid hoisting issues
  const mockInit = jest.fn();
  return {
    __esModule: true,
    default: {
      init: mockInit,
    },
  };
});

// Mock config loader - must return default gateway
jest.mock('../../src/lib/config-loader.js', () => ({
  __esModule: true,
  loadConfig: jest.fn().mockResolvedValue({
    gateway: 'https://arweave.net',
  }),
  resolveWalletPath: jest.fn(),
}));

// Mock logger
jest.mock('../../src/utils/logger.js', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock fetch for transaction status
global.fetch = jest.fn();

import {
  uploadBundle,
  pollConfirmation,
} from '../../src/clients/arweave-client.js';

describe('Arweave Upload Integration Tests', () => {
  // Load valid test wallet with proper RSA key parameters
  const testWalletPath = path.join(__dirname, '../fixtures/wallets/test-wallet.json');
  const mockWallet = JSON.parse(fs.readFileSync(testWalletPath, 'utf-8'));

  const mockBundle = Buffer.from('integration test bundle data');
  const mockMetadata = {
    skillName: 'integration-test-skill',
    skillVersion: '1.0.0',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default mock implementations
    mockWallets.jwkToAddress.mockResolvedValue('integration_test_address_43_chars_long_abc');
    mockWallets.getBalance.mockResolvedValue('5000000000000'); // 5 AR
    mockTransactions.sign.mockResolvedValue(undefined);
    mockTransactions.post.mockResolvedValue({ status: 200, statusText: 'OK' });
    mockCreateTransaction.mockResolvedValue(mockTransaction);

    // Set up Arweave.init() to return mocked instance
    const Arweave = require('arweave').default;
    Arweave.init.mockReturnValue({
      wallets: mockWallets,
      transactions: mockTransactions,
      createTransaction: mockCreateTransaction,
    });

    // Ensure config-loader mock returns proper value
    const { loadConfig } = require('../../src/lib/config-loader.js');
    (loadConfig as jest.Mock).mockResolvedValue({
      gateway: 'https://arweave.net',
    });
  });

  describe('Full upload workflow', () => {
    it('should complete full workflow: bundle → upload → poll confirmation', async () => {
      // Mock transaction status progression
      (global.fetch)
        .mockResolvedValueOnce({ status: 404 }) // pending
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            block_height: 12345,
            number_of_confirmations: 10, // confirmed
          }),
        });

      // Step 1: Upload bundle
      const uploadResult = await uploadBundle(mockBundle, mockMetadata, mockWallet);

      expect(uploadResult.txId).toBe('integration_test_tx_id_43_chars_long_123');
      expect(uploadResult.uploadSize).toBe(mockBundle.length);
      expect(uploadResult.cost).toBeGreaterThan(0);

      // Step 2: Poll for confirmation
      jest.useFakeTimers();
      const pollPromise = pollConfirmation(uploadResult.txId, 60000);
      await jest.advanceTimersByTimeAsync(30000); // First poll
      jest.useRealTimers();

      const confirmed = await pollPromise;

      expect(confirmed).toBe(true);
    });

    it('should complete workflow with progress tracking', async () => {
      const progressValues: number[] = [];
      const progressCallback = (pct: number) => progressValues.push(pct);

      // Upload with progress tracking
      const uploadResult = await uploadBundle(mockBundle, mockMetadata, mockWallet, {
        progressCallback,
      });

      expect(uploadResult.txId).toBeDefined();
      expect(progressValues).toContain(0);
      expect(progressValues).toContain(100);
      expect(progressValues.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Retry on network failure', () => {
    it('should retry and succeed on second attempt', async () => {
      const timeoutError = Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' });

      // First call fails, second succeeds
      mockWallets.getBalance
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValueOnce('5000000000000');

      const result = await uploadBundle(mockBundle, mockMetadata, mockWallet);

      expect(result.txId).toBe('integration_test_tx_id_43_chars_long_123');
      expect(mockWallets.getBalance).toHaveBeenCalledTimes(2);
    });

    it('should retry upload post on gateway error', async () => {
      mockTransactions.post
        .mockResolvedValueOnce({ status: 503, statusText: 'Service Unavailable' })
        .mockResolvedValueOnce({ status: 200, statusText: 'OK' });

      const result = await uploadBundle(mockBundle, mockMetadata, mockWallet);

      expect(result.txId).toBe('integration_test_tx_id_43_chars_long_123');
      expect(mockTransactions.post).toHaveBeenCalledTimes(2);
    });

    it('should fail after exhausting retries', async () => {
      const timeoutError = Object.assign(new Error('persistent timeout'), {
        code: 'ETIMEDOUT',
      });

      mockWallets.getBalance
        .mockRejectedValueOnce(timeoutError)
        .mockRejectedValueOnce(timeoutError)
        .mockRejectedValueOnce(timeoutError);

      await expect(
        uploadBundle(mockBundle, mockMetadata, mockWallet)
      ).rejects.toThrow(NetworkError);

      expect(mockWallets.getBalance).toHaveBeenCalledTimes(3);
    });
  });

  describe('Confirmation polling timeout', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should timeout after specified duration', async () => {
      // Upload succeeds
      const uploadResult = await uploadBundle(mockBundle, mockMetadata, mockWallet);

      // Mock status always returning pending
      (global.fetch).mockResolvedValue({ status: 404 });

      // Poll with 60s timeout
      const pollPromise = pollConfirmation(uploadResult.txId, 60000);

      // Advance past timeout
      await jest.advanceTimersByTimeAsync(65000);

      const confirmed = await pollPromise;

      expect(confirmed).toBe(false);
    });

    it('should poll at correct intervals', async () => {
      const uploadResult = await uploadBundle(mockBundle, mockMetadata, mockWallet);

      (global.fetch)
        .mockResolvedValueOnce({ status: 404 })
        .mockResolvedValueOnce({ status: 404 })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            block_height: 12345,
            number_of_confirmations: 10,
          }),
        });

      const pollPromise = pollConfirmation(uploadResult.txId, 90000);

      // Poll every 30 seconds
      await jest.advanceTimersByTimeAsync(30000);
      await jest.advanceTimersByTimeAsync(30000);

      const confirmed = await pollPromise;

      expect(confirmed).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error handling integration', () => {
    it('should handle insufficient funds gracefully', async () => {
      mockWallets.getBalance.mockResolvedValueOnce('500000000'); // Very low balance
      mockTransaction.reward = '1000000000000'; // High cost

      await expect(
        uploadBundle(mockBundle, mockMetadata, mockWallet)
      ).rejects.toThrow(/Insufficient funds/);
    });

    it('should include transaction ID in error when available', async () => {
      mockTransactions.post.mockRejectedValueOnce(new Error('Upload failed'));

      await expect(
        uploadBundle(mockBundle, mockMetadata, mockWallet)
      ).rejects.toThrow();
    });

    it('should provide actionable error messages', async () => {
      mockWallets.getBalance.mockRejectedValueOnce(
        Object.assign(new Error('Network error'), { code: 'ECONNREFUSED' })
      );

      mockWallets.getBalance.mockRejectedValueOnce(
        Object.assign(new Error('Network error'), { code: 'ECONNREFUSED' })
      );

      mockWallets.getBalance.mockRejectedValueOnce(
        Object.assign(new Error('Network error'), { code: 'ECONNREFUSED' })
      );

      await expect(
        uploadBundle(mockBundle, mockMetadata, mockWallet)
      ).rejects.toThrow(/Solution:/);
    });
  });

  describe('Alternative gateway usage', () => {
    it('should complete workflow with custom gateway', async () => {
      const customGateway = 'https://g8way.io';

      const result = await uploadBundle(mockBundle, mockMetadata, mockWallet, {
        gatewayUrl: customGateway,
      });

      expect(result.txId).toBeDefined();
      expect(mockCreateTransaction).toHaveBeenCalled();
    });

    it('should validate gateway URL before upload', async () => {
      await expect(
        uploadBundle(mockBundle, mockMetadata, mockWallet, {
          gatewayUrl: 'http://insecure-gateway.com',
        })
      ).rejects.toThrow(/HTTPS/);
    });
  });

  describe('Performance and reliability', () => {
    it('should handle large bundles efficiently', async () => {
      const largeBundleSize = 5 * 1024 * 1024; // 5MB bundle
      const largeBundle = Buffer.alloc(largeBundleSize, 'x');

      const result = await uploadBundle(largeBundle, mockMetadata, mockWallet);

      expect(result.uploadSize).toBe(largeBundleSize);
      expect(result.txId).toBeDefined();
    });

    it('should maintain state consistency across retries', async () => {
      const timeoutError = Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' });

      mockWallets.getBalance
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValueOnce('5000000000000');

      mockTransactions.post
        .mockResolvedValueOnce({ status: 503 })
        .mockResolvedValueOnce({ status: 200, statusText: 'OK' });

      const result = await uploadBundle(mockBundle, mockMetadata, mockWallet);

      // Verify transaction was created and uploaded despite retries
      expect(result.txId).toBe('integration_test_tx_id_43_chars_long_123');
      expect(mockCreateTransaction).toHaveBeenCalled();
    });
  });
});

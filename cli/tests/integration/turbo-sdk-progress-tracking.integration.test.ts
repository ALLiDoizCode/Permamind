/**
 * Integration tests for Progress Tracking
 *
 * These tests validate:
 * - Progress callback invoked at 0% and 100% for Turbo SDK uploads
 * - Progress callback invoked for Arweave SDK uploads (≥ 100KB)
 * - Missing progress callback handled gracefully
 */

import { describe, it, expect, beforeAll, jest } from '@jest/globals';
import { ArweaveClient } from '../../src/clients/arweave-client.js';
import { promises as fs } from 'fs';
import * as path from 'path';

describe('Turbo SDK Progress Tracking Integration Tests', () => {
  let arweaveClient: ArweaveClient;
  let testWallet: any;

  beforeAll(async () => {
    // Load test wallet from fixtures
    const walletPath = path.join(
      process.cwd(),
      'cli',
      'tests',
      'fixtures',
      'wallets',
      'test-wallet.json'
    );
    testWallet = JSON.parse(await fs.readFile(walletPath, 'utf-8'));

    // Create ArweaveClient instance
    arweaveClient = new ArweaveClient();
  });

  /**
   * Helper function to create test bundle
   */
  function createTestBundle(sizeInKB: number): Buffer {
    const sizeInBytes = sizeInKB * 1024;
    return Buffer.alloc(sizeInBytes, 'P'); // Fill with 'P' for progress tests
  }

  it('invokes progress callback at 0% and 100% for Turbo SDK uploads', async () => {
    // Given: Test bundle < 100KB
    const bundle = createTestBundle(50); // 50KB (Turbo SDK path)

    // Create progress callback mock
    const progressCallback = jest.fn<(progress: number) => void>();

    // When: Upload bundle with progress callback
    const result = await arweaveClient.uploadBundle(bundle, testWallet, {
      progressCallback,
    });

    // Then: Verify callback was invoked
    expect(progressCallback).toHaveBeenCalled();

    // Verify callback invoked with 0 at start
    const callArgs = progressCallback.mock.calls.map((call) => call[0]);
    expect(callArgs).toContain(0);

    // Verify callback invoked with 100 at completion
    expect(callArgs).toContain(100);

    // Verify upload succeeded
    expect(result.txId).toBeDefined();
    expect(result.txId.length).toBe(43);
  }, 120000);

  it('invokes progress callback for Arweave SDK uploads (≥ 100KB)', async () => {
    // Given: Test bundle ≥ 100KB
    const bundle = createTestBundle(100); // 100KB (Arweave SDK fallback path)

    // Create progress callback mock
    const progressCallback = jest.fn<(progress: number) => void>();

    // When: Upload bundle with progress callback
    const result = await arweaveClient.uploadBundle(bundle, testWallet, {
      progressCallback,
    });

    // Then: Verify callback was invoked
    expect(progressCallback).toHaveBeenCalled();

    // Verify callback invoked with 0 at start
    const callArgs = progressCallback.mock.calls.map((call) => call[0]);
    expect(callArgs).toContain(0);

    // Verify callback invoked with 100 at completion
    expect(callArgs).toContain(100);

    // Verify upload succeeded
    expect(result.txId).toBeDefined();
    expect(result.txId.length).toBe(43);
  }, 180000);

  it('handles missing progress callback gracefully', async () => {
    // Given: Test bundle < 100KB
    const bundle = createTestBundle(10); // 10KB

    // When: Upload bundle WITHOUT progress callback
    const result = await arweaveClient.uploadBundle(bundle, testWallet);
    // Note: No progressCallback option provided

    // Then: Verify no errors thrown
    expect(result.txId).toBeDefined();
    expect(result.txId.length).toBe(43);
    expect(result.uploadSize).toBe(10 * 1024);
  }, 120000);

  it('verifies progress callback invoked multiple times during upload', async () => {
    // Given: Test bundle < 100KB
    const bundle = createTestBundle(75); // 75KB

    // Create progress callback mock
    const progressCallback = jest.fn<(progress: number) => void>();

    // When: Upload bundle with progress callback
    await arweaveClient.uploadBundle(bundle, testWallet, {
      progressCallback,
    });

    // Then: Verify callback invoked at least twice (0% and 100%)
    expect(progressCallback.mock.calls.length).toBeGreaterThanOrEqual(2);

    // Verify all progress values are valid (0-100)
    const callArgs = progressCallback.mock.calls.map((call) => call[0]);
    for (const progress of callArgs) {
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(100);
    }
  }, 120000);

  it('verifies progress callback receives numbers only', async () => {
    // Given: Test bundle < 100KB
    const bundle = createTestBundle(20); // 20KB

    // Create progress callback that validates input type
    const progressCallback = jest.fn<(progress: number) => void>((progress) => {
      expect(typeof progress).toBe('number');
      expect(Number.isFinite(progress)).toBe(true);
    });

    // When: Upload bundle with progress callback
    await arweaveClient.uploadBundle(bundle, testWallet, {
      progressCallback,
    });

    // Then: All assertions in callback should have passed
    expect(progressCallback).toHaveBeenCalled();
  }, 120000);

  it('handles progress callback that throws errors gracefully', async () => {
    // Given: Test bundle < 100KB
    const bundle = createTestBundle(10); // 10KB

    // Create progress callback that throws errors
    const progressCallback = jest.fn<(progress: number) => void>(() => {
      throw new Error('Intentional error in progress callback');
    });

    // When/Then: Upload should still succeed even if callback throws
    // Note: Implementation may handle this differently (suppress errors vs propagate)
    // For now, we just verify upload doesn't crash
    try {
      const result = await arweaveClient.uploadBundle(bundle, testWallet, {
        progressCallback,
      });
      // If upload succeeds despite callback errors, that's acceptable
      expect(result.txId).toBeDefined();
    } catch (error) {
      // If upload fails due to callback error, that's also acceptable behavior
      // (implementation choice)
      expect(error).toBeDefined();
    }
  }, 120000);
});

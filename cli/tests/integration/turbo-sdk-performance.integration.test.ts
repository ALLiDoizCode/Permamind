/**
 * Performance comparison tests for Turbo SDK vs Arweave SDK uploads
 *
 * These tests validate:
 * - Upload latency for Turbo SDK (< 100KB bundles)
 * - Upload latency for Arweave SDK (≥ 100KB bundles)
 * - Performance comparison between both approaches
 * - Results are informational (no specific performance requirements)
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { uploadBundle } from '../../src/clients/arweave-client.js';
import { promises as fs } from 'fs';
import * as path from 'path';

describe('Turbo SDK Performance Integration Tests', () => {
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
    return Buffer.alloc(sizeInBytes, 'X'); // Fill with 'X' for performance tests
  }

  /**
   * Helper function to measure upload time
   */
  async function measureUploadTime(
    bundle: Buffer,
    wallet: any
  ): Promise<{ duration: number; txId: string; cost: number }> {
    const startTime = performance.now();
    const result = await arweaveClient.uploadBundle(bundle, wallet);
    const endTime = performance.now();
    const duration = endTime - startTime;

    return {
      duration,
      txId: result.txId,
      cost: result.cost,
    };
  }

  it('measures Turbo SDK upload latency for small bundles', async () => {
    // Given: Test bundles < 100KB (Turbo SDK path)
    const bundleSizes = [10, 50, 99]; // 10KB, 50KB, 99KB
    const results: Array<{ size: number; duration: number; cost: number }> = [];

    // When: Measure upload time for each bundle
    for (const size of bundleSizes) {
      const bundle = createTestBundle(size);
      const { duration, cost } = await measureUploadTime(bundle, testWallet);
      results.push({ size, duration, cost });
    }

    // Then: Log results to console
    console.log('\n=== Turbo SDK Upload Performance (< 100KB) ===');
    console.log('Bundle Size | Upload Time | Cost');
    console.log('----------- | ----------- | ----');
    for (const { size, duration, cost } of results) {
      console.log(`${size}KB       | ${duration.toFixed(2)}ms | ${cost} winston`);
    }
    console.log('');

    // Verify all uploads succeeded
    for (const { size, duration, cost } of results) {
      expect(duration).toBeGreaterThan(0);
      expect(cost).toBe(0); // Free tier
    }
  }, 300000); // 300 second timeout (multiple uploads with timing)

  it('measures Arweave SDK upload latency for large bundles', async () => {
    // Given: Test bundles ≥ 100KB (Arweave SDK fallback path)
    const bundleSizes = [100, 200]; // 100KB, 200KB
    const results: Array<{ size: number; duration: number; cost: number }> = [];

    // When: Measure upload time for each bundle
    for (const size of bundleSizes) {
      const bundle = createTestBundle(size);
      const { duration, cost } = await measureUploadTime(bundle, testWallet);
      results.push({ size, duration, cost });
    }

    // Then: Log results to console
    console.log('\n=== Arweave SDK Upload Performance (≥ 100KB) ===');
    console.log('Bundle Size | Upload Time | Cost');
    console.log('----------- | ----------- | ----');
    for (const { size, duration, cost } of results) {
      console.log(`${size}KB      | ${duration.toFixed(2)}ms | ${cost} winston`);
    }
    console.log('');

    // Verify all uploads succeeded
    for (const { size, duration } of results) {
      expect(duration).toBeGreaterThan(0);
      // Cost may vary depending on implementation
    }
  }, 300000); // 300 second timeout

  it('compares Turbo SDK vs Arweave SDK performance for similar bundle sizes', async () => {
    // Given: Bundles near the 100KB threshold
    const turboBundle = createTestBundle(99); // 99KB (Turbo SDK)
    const arweaveBundle = createTestBundle(100); // 100KB (Arweave SDK)

    // When: Measure upload times
    const turboResult = await measureUploadTime(turboBundle, testWallet);
    const arweaveResult = await measureUploadTime(arweaveBundle, testWallet);

    // Then: Log comparison
    console.log('\n=== Performance Comparison (Turbo vs Arweave) ===');
    console.log(`Turbo SDK (99KB):   ${turboResult.duration.toFixed(2)}ms (cost: ${turboResult.cost})`);
    console.log(
      `Arweave SDK (100KB): ${arweaveResult.duration.toFixed(2)}ms (cost: ${arweaveResult.cost})`
    );
    console.log('');

    // No specific performance requirements - just verify both succeeded
    expect(turboResult.duration).toBeGreaterThan(0);
    expect(arweaveResult.duration).toBeGreaterThan(0);
  }, 300000);

  it('measures average upload time for Turbo SDK (informational)', async () => {
    // Given: Multiple small bundles
    const iterations = 3;
    const bundleSize = 50; // 50KB
    const durations: number[] = [];

    // When: Upload same-size bundle multiple times
    for (let i = 0; i < iterations; i++) {
      const bundle = createTestBundle(bundleSize);
      const { duration } = await measureUploadTime(bundle, testWallet);
      durations.push(duration);
    }

    // Then: Calculate and log average
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);

    console.log('\n=== Turbo SDK Upload Statistics (50KB, n=3) ===');
    console.log(`Average: ${avgDuration.toFixed(2)}ms`);
    console.log(`Min:     ${minDuration.toFixed(2)}ms`);
    console.log(`Max:     ${maxDuration.toFixed(2)}ms`);
    console.log('');

    // Verify all uploads succeeded
    expect(durations.length).toBe(iterations);
    for (const duration of durations) {
      expect(duration).toBeGreaterThan(0);
    }
  }, 300000);

  it('measures upload throughput (MB/s) for Turbo SDK', async () => {
    // Given: Test bundle (50KB)
    const bundleSizeKB = 50;
    const bundle = createTestBundle(bundleSizeKB);

    // When: Measure upload time
    const { duration } = await measureUploadTime(bundle, testWallet);

    // Then: Calculate throughput
    const bundleSizeMB = bundleSizeKB / 1024;
    const durationSeconds = duration / 1000;
    const throughputMBps = bundleSizeMB / durationSeconds;

    console.log('\n=== Upload Throughput ===');
    console.log(`Bundle Size: ${bundleSizeKB}KB`);
    console.log(`Upload Time: ${duration.toFixed(2)}ms`);
    console.log(`Throughput:  ${throughputMBps.toFixed(2)} MB/s`);
    console.log('');

    // No specific throughput requirements - just verify calculation is valid
    expect(throughputMBps).toBeGreaterThan(0);
  }, 120000);
});

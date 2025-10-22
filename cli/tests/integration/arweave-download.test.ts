/**
 * Integration tests for Arweave Client Download Module
 *
 * Tests end-to-end download workflow with realistic scenarios including
 * progress tracking, retry mechanism, timeout handling, and performance validation.
 */

import { downloadBundle } from '../../src/clients/arweave-client.js';
import { NetworkError, ValidationError } from '../../src/types/errors.js';

// Mock config loader
const mockLoadConfig = jest.fn();
jest.mock('../../src/lib/config-loader.js', () => ({
  __esModule: true,
  loadConfig: (...args: any[]) => mockLoadConfig(...args),
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

// Mock fetch for integration tests
global.fetch = jest.fn();

describe('Arweave Download Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadConfig.mockResolvedValue({
      gateway: 'https://arweave.net',
    });
  });

  // Helper to create mock readable stream
  function createMockReadableStream(chunks: Uint8Array[]) {
    let index = 0;
    return {
      getReader: () => ({
        read: jest.fn(async () => {
          if (index < chunks.length) {
            return { done: false, value: chunks[index++] };
          }
          return { done: true, value: undefined };
        }),
      }),
    };
  }

  describe('End-to-End Download', () => {
    it('should download valid bundle and verify Buffer integrity', async () => {
      const testBundle = Buffer.from('test bundle content with realistic data');
      const mockTxId = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) => {
            if (name === 'Content-Length') return String(testBundle.length);
            if (name === 'Content-Type') return 'application/gzip';
            return null;
          },
        },
        body: createMockReadableStream([testBundle]),
      });

      const result = await downloadBundle(mockTxId);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBe(testBundle.length);
      expect(result.toString()).toBe(testBundle.toString());
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should receive multiple progress updates during download', async () => {
      const chunk1 = Buffer.from('chunk1');
      const chunk2 = Buffer.from('chunk2');
      const chunk3 = Buffer.from('chunk3');
      const totalSize = chunk1.length + chunk2.length + chunk3.length;

      const progressCallback = jest.fn();
      const mockTxId = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) => {
            if (name === 'Content-Length') return String(totalSize);
            if (name === 'Content-Type') return 'application/gzip';
            return null;
          },
        },
        body: createMockReadableStream([chunk1, chunk2, chunk3]),
      });

      await downloadBundle(mockTxId, { progressCallback });

      // Should call with 0% at start, updates during download, and 100% at end
      expect(progressCallback).toHaveBeenCalledWith(0);
      expect(progressCallback).toHaveBeenCalledWith(100);
      expect(progressCallback.mock.calls.length).toBeGreaterThanOrEqual(3);
    });

    it('should download with custom gateway URL', async () => {
      const testBundle = Buffer.from('test data');
      const mockTxId = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG';
      const customGateway = 'https://g8way.io';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/gzip',
        },
        body: createMockReadableStream([testBundle]),
      });

      await downloadBundle(mockTxId, { gatewayUrl: customGateway });

      expect(global.fetch).toHaveBeenCalledWith(
        `${customGateway}/${mockTxId}`,
        expect.any(Object)
      );
    });

    it('should retry on transient failures and eventually succeed', async () => {
      const testBundle = Buffer.from('success data');
      const mockTxId = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG';
      const error502 = new Error('Gateway returned status 502: Bad Gateway');

      // First 2 attempts fail with 502, 3rd succeeds
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(error502)
        .mockRejectedValueOnce(error502)
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: () => 'application/gzip',
          },
          body: createMockReadableStream([testBundle]),
        });

      const result = await downloadBundle(mockTxId);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe(testBundle.toString());
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should handle timeout correctly', async () => {
      const mockTxId = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG';

      // Mock fetch that respects abort signal
      (global.fetch as jest.Mock).mockImplementationOnce(
        (url: string, options: any) =>
          new Promise((resolve, reject) => {
            if (options?.signal) {
              options.signal.addEventListener('abort', () => {
                const abortError = new Error('The operation was aborted');
                abortError.name = 'AbortError';
                reject(abortError);
              });
            }
          })
      );

      await expect(
        downloadBundle(mockTxId, { timeout: 100 })
      ).rejects.toThrow(/timeout/);
    }, 5000);
  });

  describe('Performance Validation', () => {
    it('should complete download within timeout for <1MB bundle', async () => {
      const testBundle = Buffer.alloc(500 * 1024); // 500KB
      const mockTxId = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) => {
            if (name === 'Content-Length') return String(testBundle.length);
            if (name === 'Content-Type') return 'application/gzip';
            return null;
          },
        },
        body: createMockReadableStream([testBundle]),
      });

      const startTime = Date.now();
      await downloadBundle(mockTxId, { timeout: 30000 }); // 30s default timeout
      const elapsedTime = Date.now() - startTime;

      // Should complete well before timeout (within 1 second in mock environment)
      expect(elapsedTime).toBeLessThan(1000);
    });

    it('should provide reasonable progress granularity (at least 5 updates)', async () => {
      // Create 10 small chunks to simulate streaming
      const chunks = Array.from({ length: 10 }, (_, i) =>
        Buffer.from(`chunk${i}`)
      );
      const totalSize = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const mockTxId = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG';

      const progressCallback = jest.fn();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) => {
            if (name === 'Content-Length') return String(totalSize);
            if (name === 'Content-Type') return 'application/gzip';
            return null;
          },
        },
        body: createMockReadableStream(chunks),
      });

      await downloadBundle(mockTxId, { progressCallback });

      // Should have at least 5 progress updates (0%, intermediate values, 100%)
      expect(progressCallback.mock.calls.length).toBeGreaterThanOrEqual(5);
    });

    it('should not cause excessive delays with retry mechanism', async () => {
      const testBundle = Buffer.from('success after retry');
      const mockTxId = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG';
      const error502 = new Error('Gateway returned status 502: Bad Gateway');

      // Fail once, then succeed
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(error502)
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: () => 'application/gzip',
          },
          body: createMockReadableStream([testBundle]),
        });

      const startTime = Date.now();
      await downloadBundle(mockTxId);
      const elapsedTime = Date.now() - startTime;

      // With 1 retry (1s backoff), should complete in ~1 second
      expect(elapsedTime).toBeLessThan(2000);
      expect(elapsedTime).toBeGreaterThan(900); // At least 1s for backoff
    }, 5000);
  });

  describe('Error Handling', () => {
    it('should throw ValidationError for invalid TXID', async () => {
      await expect(downloadBundle('invalid_short_id')).rejects.toThrow(
        /Invalid Arweave TXID length/
      );
    });

    it('should throw NetworkError for bundle not found (404)', async () => {
      const mockTxId = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(downloadBundle(mockTxId)).rejects.toThrow(/Bundle not found/);
    });

    it('should throw ValidationError for invalid Content-Type', async () => {
      const mockTxId = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) => {
            if (name === 'Content-Type') return 'text/html';
            return null;
          },
        },
        body: createMockReadableStream([Buffer.from('data')]),
      });

      await expect(downloadBundle(mockTxId)).rejects.toThrow(/Content-Type/);
    });

    it('should throw NetworkError for gateway unavailable (502/503)', async () => {
      const mockTxId = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG';
      const error503 = new Error('Gateway returned status 503: Service Unavailable');

      // Fail all 3 attempts
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(error503)
        .mockRejectedValueOnce(error503)
        .mockRejectedValueOnce(error503);

      await expect(downloadBundle(mockTxId)).rejects.toThrow(/Gateway unavailable/);
      expect(global.fetch).toHaveBeenCalledTimes(3); // 3 retry attempts
    }, 10000);
  });

  describe('Configuration', () => {
    it('should use config gateway when no option provided', async () => {
      const mockTxId = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG';
      const configGateway = 'https://ar-io.dev';

      mockLoadConfig.mockResolvedValueOnce({
        gateway: configGateway,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/gzip',
        },
        body: createMockReadableStream([Buffer.from('data')]),
      });

      await downloadBundle(mockTxId);

      expect(global.fetch).toHaveBeenCalledWith(
        `${configGateway}/${mockTxId}`,
        expect.any(Object)
      );
    });

    it('should enforce HTTPS for custom gateway', async () => {
      const mockTxId = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG';

      await expect(
        downloadBundle(mockTxId, { gatewayUrl: 'http://insecure.com' })
      ).rejects.toThrow(/HTTPS/);
    });
  });
});

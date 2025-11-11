/**
 * Unit tests for Data Item Signer Utility
 *
 * Tests the createUnifiedDataItemSigner function with mocked wallet providers
 * to ensure proper DataItemSigner creation and error handling.
 */

import { createUnifiedDataItemSigner } from '../../../src/lib/data-item-signer.js';
import type { IWalletProvider, DataItemSigner } from '../../../src/types/index.js';

describe('createUnifiedDataItemSigner', () => {
  // Mock DataItemSigner factory
  const createMockSigner = (): DataItemSigner => {
    return jest.fn(async (args: { data: any; tags: { name: string; value: string }[]; target?: string; anchor?: string }) => ({
      id: 'mock-data-item-id',
      raw: new Uint8Array([1, 2, 3]),
    })) as DataItemSigner;
  };

  describe('successful signer creation', () => {
    it('should create signer from SeedPhraseWalletProvider', async () => {
      const mockSigner = createMockSigner();
      // Mock SeedPhraseWalletProvider
      const mockProvider: IWalletProvider = {
        getAddress: jest.fn().mockResolvedValue('test-address-seed-123'),
        createDataItemSigner: jest.fn().mockResolvedValue(mockSigner),
        disconnect: jest.fn().mockResolvedValue(undefined),
        getSource: jest.fn().mockReturnValue({ source: 'seedPhrase', value: '***' }),
      };

      const signer = await createUnifiedDataItemSigner(mockProvider);

      expect(mockProvider.createDataItemSigner).toHaveBeenCalledTimes(1);
      expect(signer).toBe(mockSigner);
    });

    it('should create signer from BrowserWalletProvider', async () => {
      const mockSigner = createMockSigner();
      // Mock BrowserWalletProvider
      const mockProvider: IWalletProvider = {
        getAddress: jest.fn().mockResolvedValue('test-address-browser-456'),
        createDataItemSigner: jest.fn().mockResolvedValue(mockSigner),
        disconnect: jest.fn().mockResolvedValue(undefined),
        getSource: jest.fn().mockReturnValue({ source: 'browserWallet', value: 'test-address-browser-456' }),
      };

      const signer = await createUnifiedDataItemSigner(mockProvider);

      expect(mockProvider.createDataItemSigner).toHaveBeenCalledTimes(1);
      expect(signer).toBe(mockSigner);
    });

    it('should create signer from FileWalletProvider', async () => {
      const mockSigner = createMockSigner();
      // Mock FileWalletProvider
      const mockProvider: IWalletProvider = {
        getAddress: jest.fn().mockResolvedValue('test-address-file-789'),
        createDataItemSigner: jest.fn().mockResolvedValue(mockSigner),
        disconnect: jest.fn().mockResolvedValue(undefined),
        getSource: jest.fn().mockReturnValue({ source: 'file', value: 'path/to/wallet.json' }),
      };

      const signer = await createUnifiedDataItemSigner(mockProvider);

      expect(mockProvider.createDataItemSigner).toHaveBeenCalledTimes(1);
      expect(signer).toBe(mockSigner);
    });
  });

  describe('error handling', () => {
    it('should wrap errors from provider.createDataItemSigner()', async () => {
      const providerError = new Error('Wallet provider initialization failed');
      const mockProvider: IWalletProvider = {
        getAddress: jest.fn().mockResolvedValue('test-address'),
        createDataItemSigner: jest.fn().mockRejectedValue(providerError),
        disconnect: jest.fn().mockResolvedValue(undefined),
        getSource: jest.fn().mockReturnValue({ source: 'seedPhrase', value: '***' }),
      };

      await expect(createUnifiedDataItemSigner(mockProvider)).rejects.toThrow(
        /Failed to create data item signer from wallet provider.*Wallet provider initialization failed/
      );
    });

    it('should handle non-Error objects thrown by provider', async () => {
      const mockProvider: IWalletProvider = {
        getAddress: jest.fn().mockResolvedValue('test-address'),
        createDataItemSigner: jest.fn().mockRejectedValue('String error message'),
        disconnect: jest.fn().mockResolvedValue(undefined),
        getSource: jest.fn().mockReturnValue({ source: 'browserWallet', value: 'test-address' }),
      };

      await expect(createUnifiedDataItemSigner(mockProvider)).rejects.toThrow(
        /Failed to create data item signer from wallet provider.*String error message/
      );
    });
  });

  describe('DataItemSigner compatibility', () => {
    it('should return signer compatible with aoconnect API', async () => {
      const mockSigner = createMockSigner();
      const mockProvider: IWalletProvider = {
        getAddress: jest.fn().mockResolvedValue('test-address'),
        createDataItemSigner: jest.fn().mockResolvedValue(mockSigner),
        disconnect: jest.fn().mockResolvedValue(undefined),
        getSource: jest.fn().mockReturnValue({ source: 'seedPhrase', value: '***' }),
      };

      const signer = await createUnifiedDataItemSigner(mockProvider);

      // Verify signer function signature matches aoconnect expectations
      const result = await signer({
        data: 'test data',
        tags: [{ name: 'Action', value: 'Test' }],
        target: 'target-process-id',
        anchor: 'anchor-value',
      });

      expect(result).toEqual({
        id: 'mock-data-item-id',
        raw: expect.any(Uint8Array),
      });
      expect(mockSigner).toHaveBeenCalledWith({
        data: 'test data',
        tags: [{ name: 'Action', value: 'Test' }],
        target: 'target-process-id',
        anchor: 'anchor-value',
      });
    });
  });
});

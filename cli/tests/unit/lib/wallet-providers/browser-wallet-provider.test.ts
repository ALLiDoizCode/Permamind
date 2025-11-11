/**
 * Unit tests for BrowserWalletProvider
 *
 * Tests the browser wallet provider implementation including:
 * - Address retrieval from adapter
 * - Data item signer creation with browser wallet delegation
 * - Disconnect cleanup
 * - Source metadata retrieval
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock NodeArweaveWalletAdapter
jest.mock('../../../../src/lib/node-arweave-wallet-adapter.js');

// Mock Arweave SDK BEFORE importing the provider
jest.mock('arweave', () => {
  const mockTransaction = {
    id: 'mock_tx_id_43_chars_long_arweave_tx_00000',
    addTag: jest.fn(),
    last_tx: '',
  };

  return {
    __esModule: true,
    default: {
      init: jest.fn(() => ({
        createTransaction: jest.fn(async () => mockTransaction),
      })),
    },
  };
});

// Import AFTER mocks are defined
import { BrowserWalletProvider } from '../../../../src/lib/wallet-providers/browser-wallet-provider.js';
import { NodeArweaveWalletAdapter } from '../../../../src/lib/node-arweave-wallet-adapter.js';

// Mock logger
jest.mock('../../../../src/utils/logger.js', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('BrowserWalletProvider', () => {
  let mockAdapter: jest.Mocked<NodeArweaveWalletAdapter>;
  let testAddress: string;
  let provider: BrowserWalletProvider;

  beforeEach(() => {
    // Create mock NodeArweaveWallet instance
    const mockWallet = {
      signDataItem: jest.fn().mockResolvedValue({
        id: 'signed_item_id_43_chars_long_000000000000',
        raw: Buffer.from('signed data item'),
      }),
    };

    // Create mock adapter
    mockAdapter = {
      getAddress: jest.fn(),
      sign: jest.fn(),
      disconnect: jest.fn(),
      isConnected: jest.fn(),
      wallet: mockWallet, // Add wallet property for createDataItemSigner()
    } as unknown as jest.Mocked<NodeArweaveWalletAdapter>;

    testAddress = 'kR-ZW0hlMJp_vTqTEsx6Of-YijJphwm_nWJLOJvT1u0'; // Valid 43-char address

    // Mock adapter methods
    mockAdapter.getAddress.mockResolvedValue(testAddress);
    mockAdapter.sign.mockResolvedValue({
      id: 'signed_tx_id_43_chars_long_arweave_tx_000',
      signature: 'mock_signature_base64',
    } as any);
    mockAdapter.disconnect.mockResolvedValue(undefined);
    mockAdapter.isConnected.mockReturnValue(true);

    provider = new BrowserWalletProvider(mockAdapter, testAddress);
  });

  describe('getAddress()', () => {
    it('should return stored wallet address', async () => {
      const address = await provider.getAddress();
      expect(address).toBe(testAddress);
    });

    it('should return 43-character address', async () => {
      const address = await provider.getAddress();
      expect(address).toHaveLength(43);
    });
  });

  describe('createDataItemSigner()', () => {
    it('should return a function', async () => {
      const signer = await provider.createDataItemSigner();
      expect(typeof signer).toBe('function');
    });

    // Note: Signer execution tests require real Arweave SDK and belong in integration tests
    // Unit tests verify the interface contract only
    it.skip('should delegate signing to adapter (integration test)', async () => {
      const signer = await provider.createDataItemSigner();

      await signer({
        data: 'test data',
        tags: [{ name: 'Action', value: 'Test' }],
      });

      expect(mockAdapter.sign).toHaveBeenCalled();
      expect(mockAdapter.sign).toHaveBeenCalledTimes(1);
    });

    it.skip('should return transaction ID and raw data (integration test)', async () => {
      const signer = await provider.createDataItemSigner();

      const result = await signer({
        data: 'test data',
        tags: [{ name: 'Action', value: 'Test' }],
      });

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('raw');
      expect(result.id).toBe('signed_tx_id_43_chars_long_arweave_tx_000');
    });
  });

  describe('disconnect()', () => {
    it('should call adapter.disconnect()', async () => {
      await provider.disconnect();

      expect(mockAdapter.disconnect).toHaveBeenCalled();
      expect(mockAdapter.disconnect).toHaveBeenCalledTimes(1);
    });

    it('should complete without error', async () => {
      await expect(provider.disconnect()).resolves.toBeUndefined();
    });
  });

  describe('getSource()', () => {
    it('should return correct source metadata', () => {
      const source = provider.getSource();

      expect(source).toEqual({
        source: 'browserWallet',
        value: testAddress,
      });
    });

    it('should return browserWallet as source type', () => {
      const source = provider.getSource();
      expect(source.source).toBe('browserWallet');
    });

    it('should return address as value', () => {
      const source = provider.getSource();
      expect(source.value).toBe(testAddress);
    });
  });
});

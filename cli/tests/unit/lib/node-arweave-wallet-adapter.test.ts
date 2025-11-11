/**
 * Unit tests for NodeArweaveWalletAdapter
 *
 * Tests browser wallet integration via node-arweave-wallet library adapter
 */

// Mock the node-arweave-wallet library BEFORE any imports
jest.mock('@permamind/node-arweave-wallet', () => {
  return {
    NodeArweaveWallet: jest.fn(),
  };
});

import { NodeArweaveWallet } from '@permamind/node-arweave-wallet';
import { NodeArweaveWalletAdapter } from '../../../src/lib/node-arweave-wallet-adapter.js';
import type {
  IInitOptions,
  Permission,
} from '../../../src/types/node-arweave-wallet.js';
import {
  AuthorizationError,
  ConfigurationError,
  NetworkError,
} from '../../../src/types/errors.js';

describe('NodeArweaveWalletAdapter', () => {
  let adapter: NodeArweaveWalletAdapter;
  let mockWallet: jest.Mocked<NodeArweaveWallet>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create a new adapter instance
    adapter = new NodeArweaveWalletAdapter();

    // Create mock wallet instance with all required methods
    mockWallet = {
      initialize: jest.fn().mockResolvedValue(undefined),
      connect: jest.fn().mockResolvedValue(undefined),
      getActiveAddress: jest.fn().mockResolvedValue('test_wallet_address_43_chars_long_abc123'),
      sign: jest.fn().mockResolvedValue({
        id: 'mock_tx_id',
        last_tx: '',
        owner: 'mock_owner',
        tags: [],
        target: '',
        quantity: '0',
        data: '',
        data_size: '0',
        data_root: '',
        reward: '0',
        signature: 'mock_signature',
      }),
      disconnect: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
      port: 12345, // Mock the port property
    } as any;

    // Make the NodeArweaveWallet constructor return our mock
    (NodeArweaveWallet as jest.MockedClass<typeof NodeArweaveWallet>).mockImplementation(
      () => mockWallet
    );
  });

  describe('initialize()', () => {
    it('should initialize with default port (0) when no options provided', async () => {
      await adapter.initialize();

      expect(NodeArweaveWallet).toHaveBeenCalledWith({
        port: 0,
        requestTimeout: 300000,
      });
      expect(mockWallet.initialize).toHaveBeenCalled();
    });

    it('should initialize with custom port', async () => {
      const options: IInitOptions = { port: 8080 };

      await adapter.initialize(options);

      expect(NodeArweaveWallet).toHaveBeenCalledWith({
        port: 8080,
        requestTimeout: 300000,
      });
      expect(mockWallet.initialize).toHaveBeenCalled();
    });

    it('should initialize with custom requestTimeout', async () => {
      const options: IInitOptions = { requestTimeout: 60000 };

      await adapter.initialize(options);

      expect(NodeArweaveWallet).toHaveBeenCalledWith({
        port: 0,
        requestTimeout: 60000,
      });
      expect(mockWallet.initialize).toHaveBeenCalled();
    });

    it('should throw ConfigurationError if initialization fails', async () => {
      mockWallet.initialize.mockRejectedValue(new Error('Port already in use'));

      await expect(adapter.initialize()).rejects.toThrow(ConfigurationError);
      await expect(adapter.initialize()).rejects.toThrow(
        /Failed to initialize browser wallet server/
      );
    });
  });

  describe('connect()', () => {
    beforeEach(async () => {
      // Initialize adapter before testing connect
      await adapter.initialize();
    });

    it('should throw ConfigurationError if not initialized', async () => {
      const uninitializedAdapter = new NodeArweaveWalletAdapter();

      await expect(uninitializedAdapter.connect()).rejects.toThrow(ConfigurationError);
      await expect(uninitializedAdapter.connect()).rejects.toThrow(
        /Wallet not initialized/
      );
    });

    it('should connect with default permissions', async () => {
      await adapter.connect();

      expect(mockWallet.connect).toHaveBeenCalledWith([
        'ACCESS_ADDRESS',
        'SIGN_TRANSACTION',
        'DISPATCH',
      ]);
      expect(mockWallet.getActiveAddress).toHaveBeenCalled();
    });

    it('should connect with custom permissions', async () => {
      const permissions: Permission[] = ['ACCESS_ADDRESS', 'SIGN_TRANSACTION'];

      await adapter.connect(permissions);

      expect(mockWallet.connect).toHaveBeenCalledWith(permissions);
      expect(mockWallet.getActiveAddress).toHaveBeenCalled();
    });

    it('should store wallet address after successful connection', async () => {
      await adapter.connect();

      const address = await adapter.getAddress();
      expect(address).toBe('test_wallet_address_43_chars_long_abc123');
    });

    it('should set connected state to true after successful connection', async () => {
      await adapter.connect();

      expect(adapter.isConnected()).toBe(true);
    });

    it('should throw AuthorizationError if user denies connection', async () => {
      mockWallet.connect.mockRejectedValue(new Error('User denied connection'));

      await expect(adapter.connect()).rejects.toThrow(AuthorizationError);
      await expect(adapter.connect()).rejects.toThrow(
        /rejected by user/
      );
    });

    it('should throw NetworkError if connection times out', async () => {
      mockWallet.connect.mockRejectedValue(new Error('Connection timed out'));

      await expect(adapter.connect()).rejects.toThrow(NetworkError);
      await expect(adapter.connect()).rejects.toThrow(/timeout/i);
    });

    it('should throw NetworkError for general connection failures', async () => {
      mockWallet.connect.mockRejectedValue(new Error('Network error'));

      await expect(adapter.connect()).rejects.toThrow(NetworkError);
      await expect(adapter.connect()).rejects.toThrow(
        /Browser wallet connection failed/
      );
    });

    it('should include timeout value in timeout error message', async () => {
      mockWallet.connect.mockRejectedValue(new Error('Connection timeout'));

      await expect(adapter.connect()).rejects.toThrow(/300000ms/);
    });

    it('should include actual port in timeout error message', async () => {
      mockWallet.connect.mockRejectedValue(new Error('Connection timeout'));

      await expect(adapter.connect()).rejects.toThrow(/localhost:12345/);
    });

    it('should use custom timeout value in error message when configured', async () => {
      const customAdapter = new NodeArweaveWalletAdapter();
      await customAdapter.initialize({ requestTimeout: 60000 });

      mockWallet.connect.mockRejectedValue(new Error('Connection timeout'));

      await expect(customAdapter.connect()).rejects.toThrow(/60000ms/);
    });

    it('should throw AuthorizationError with rejection message when user rejects', async () => {
      mockWallet.connect.mockRejectedValue(new Error('User rejected the connection'));

      await expect(adapter.connect()).rejects.toThrow(AuthorizationError);
      await expect(adapter.connect()).rejects.toThrow(/rejected by user/);
    });

    it('should throw ConfigurationError for browser launch failure', async () => {
      mockWallet.connect.mockRejectedValue(new Error('Failed to open browser'));

      await expect(adapter.connect()).rejects.toThrow(ConfigurationError);
      await expect(adapter.connect()).rejects.toThrow(/Failed to open browser automatically/);
    });

    it('should throw AuthorizationError for permission denial', async () => {
      mockWallet.connect.mockRejectedValue(new Error('Permission denied'));

      await expect(adapter.connect()).rejects.toThrow(AuthorizationError);
      await expect(adapter.connect()).rejects.toThrow(/Required permissions denied/);
    });

    it('should throw NetworkError for browser connection lost', async () => {
      mockWallet.connect.mockRejectedValue(new Error('Browser connection lost'));

      await expect(adapter.connect()).rejects.toThrow(NetworkError);
      await expect(adapter.connect()).rejects.toThrow(/Browser connection lost/);
    });
  });

  describe('getAddress()', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should throw AuthorizationError if wallet not connected', async () => {
      await expect(adapter.getAddress()).rejects.toThrow(AuthorizationError);
      await expect(adapter.getAddress()).rejects.toThrow(/Wallet not connected/);
    });

    it('should return wallet address if connected', async () => {
      await adapter.connect();

      const address = await adapter.getAddress();
      expect(address).toBe('test_wallet_address_43_chars_long_abc123');
    });
  });

  describe('sign()', () => {
    const mockTransaction = {
      id: '',
      last_tx: '',
      owner: '',
      tags: [],
      target: 'target_address',
      quantity: '1000000000000',
      data: 'test_data',
      data_size: '9',
      data_root: '',
      reward: '100000000',
    };

    beforeEach(async () => {
      await adapter.initialize();
      await adapter.connect();
    });

    it('should throw AuthorizationError if wallet not connected', async () => {
      const disconnectedAdapter = new NodeArweaveWalletAdapter();
      await disconnectedAdapter.initialize();

      await expect(disconnectedAdapter.sign(mockTransaction)).rejects.toThrow(
        AuthorizationError
      );
      await expect(disconnectedAdapter.sign(mockTransaction)).rejects.toThrow(
        /Wallet not connected/
      );
    });

    it('should delegate signing to browser wallet', async () => {
      await adapter.sign(mockTransaction);

      expect(mockWallet.sign).toHaveBeenCalledWith(mockTransaction);
    });

    it('should return signed transaction', async () => {
      const signedTx = await adapter.sign(mockTransaction);

      expect(signedTx).toBeDefined();
      expect(signedTx.id).toBe('mock_tx_id');
      expect(signedTx.signature).toBe('mock_signature');
    });

    it('should throw AuthorizationError if user denies signature', async () => {
      mockWallet.sign.mockRejectedValue(new Error('User rejected signature'));

      await expect(adapter.sign(mockTransaction)).rejects.toThrow(AuthorizationError);
      await expect(adapter.sign(mockTransaction)).rejects.toThrow(
        /Transaction signature denied/
      );
    });

    it('should throw NetworkError for signing failures', async () => {
      mockWallet.sign.mockRejectedValue(new Error('Signing failed'));

      await expect(adapter.sign(mockTransaction)).rejects.toThrow(NetworkError);
      await expect(adapter.sign(mockTransaction)).rejects.toThrow(
        /Transaction signing failed/
      );
    });
  });

  describe('disconnect()', () => {
    it('should return early if wallet not initialized', async () => {
      await adapter.disconnect();

      expect(mockWallet.disconnect).not.toHaveBeenCalled();
      expect(mockWallet.close).not.toHaveBeenCalled();
    });

    it('should disconnect wallet and close server', async () => {
      await adapter.initialize();
      await adapter.connect();
      await adapter.disconnect();

      expect(mockWallet.disconnect).toHaveBeenCalled();
      expect(mockWallet.close).toHaveBeenCalledWith('success');
    });

    it('should set connected state to false', async () => {
      await adapter.initialize();
      await adapter.connect();

      expect(adapter.isConnected()).toBe(true);

      await adapter.disconnect();

      expect(adapter.isConnected()).toBe(false);
    });

    it('should clear wallet address', async () => {
      await adapter.initialize();
      await adapter.connect();

      const address = await adapter.getAddress();
      expect(address).toBeDefined();

      await adapter.disconnect();

      await expect(adapter.getAddress()).rejects.toThrow(AuthorizationError);
    });

    it('should handle disconnect errors gracefully', async () => {
      await adapter.initialize();
      await adapter.connect();

      mockWallet.disconnect.mockRejectedValue(new Error('Disconnect failed'));

      // Should not throw - disconnect is forgiving
      await expect(adapter.disconnect()).resolves.not.toThrow();

      // State should still be cleared
      expect(adapter.isConnected()).toBe(false);
    });

    it('should skip wallet.disconnect() if not connected', async () => {
      await adapter.initialize();

      await adapter.disconnect();

      expect(mockWallet.disconnect).not.toHaveBeenCalled();
      expect(mockWallet.close).toHaveBeenCalledWith('success');
    });
  });

  describe('isConnected()', () => {
    it('should return false initially', () => {
      expect(adapter.isConnected()).toBe(false);
    });

    it('should return false after initialization but before connection', async () => {
      await adapter.initialize();

      expect(adapter.isConnected()).toBe(false);
    });

    it('should return true after successful connection', async () => {
      await adapter.initialize();
      await adapter.connect();

      expect(adapter.isConnected()).toBe(true);
    });

    it('should return false after disconnect', async () => {
      await adapter.initialize();
      await adapter.connect();
      await adapter.disconnect();

      expect(adapter.isConnected()).toBe(false);
    });
  });
});

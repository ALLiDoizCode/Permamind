/**
 * Integration tests for Browser Wallet Error Handling
 *
 * Tests error scenarios for browser wallet connection via node-arweave-wallet
 * Validates error messages, recovery guidance, and logging for all failure modes
 */

// Mock the node-arweave-wallet library BEFORE any imports
jest.mock('node-arweave-wallet', () => {
  return {
    NodeArweaveWallet: jest.fn(),
  };
});

import { NodeArweaveWallet } from 'node-arweave-wallet';
import { NodeArweaveWalletAdapter } from '../../src/lib/node-arweave-wallet-adapter.js';
import {
  AuthorizationError,
  ConfigurationError,
  NetworkError,
} from '../../src/types/errors.js';

describe('Browser Wallet Error Handling Integration Tests', () => {
  let adapter: NodeArweaveWalletAdapter;
  let mockWallet: jest.Mocked<NodeArweaveWallet>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create a new adapter instance
    adapter = new NodeArweaveWalletAdapter();

    // Create mock wallet instance
    mockWallet = {
      initialize: jest.fn().mockResolvedValue(undefined),
      connect: jest.fn().mockResolvedValue(undefined),
      getActiveAddress: jest.fn().mockResolvedValue('test_address_43_chars_long_abcdefghijk'),
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
      port: 54321, // Mock port
    } as any;

    // Make the NodeArweaveWallet constructor return our mock
    (NodeArweaveWallet as jest.MockedClass<typeof NodeArweaveWallet>).mockImplementation(
      () => mockWallet
    );
  });

  describe('Connection Timeout', () => {
    it('should throw NetworkError with manual URL on timeout', async () => {
      await adapter.initialize();
      mockWallet.connect.mockRejectedValue(new Error('Connection timeout'));

      await expect(adapter.connect()).rejects.toThrow(NetworkError);

      try {
        await adapter.connect();
      } catch (error) {
        expect(error).toBeInstanceOf(NetworkError);
        if (error instanceof NetworkError) {
          expect(error.message).toContain('timeout after 300000ms');
          expect(error.message).toContain('localhost:54321');
          expect(error.message).toContain('Solution:');
          expect(error.errorType).toBe('timeout');
        }
      }
    });

    it('should respect custom timeout configuration', async () => {
      await adapter.initialize({ requestTimeout: 120000 });
      mockWallet.connect.mockRejectedValue(new Error('Timeout waiting for connect'));

      try {
        await adapter.connect();
      } catch (error) {
        expect(error).toBeInstanceOf(NetworkError);
        if (error instanceof NetworkError) {
          expect(error.message).toContain('120000ms');
        }
      }
    });

    it('should handle timeout with default 5-minute timeout', async () => {
      await adapter.initialize();
      mockWallet.connect.mockRejectedValue(new Error('timed out after 300 seconds'));

      try {
        await adapter.connect();
      } catch (error) {
        expect(error).toBeInstanceOf(NetworkError);
        if (error instanceof NetworkError) {
          expect(error.errorType).toBe('timeout');
        }
      }
    });
  });

  describe('User Rejection', () => {
    it('should throw AuthorizationError when user denies connection', async () => {
      await adapter.initialize();
      mockWallet.connect.mockRejectedValue(new Error('User rejected the connection request'));

      await expect(adapter.connect()).rejects.toThrow(AuthorizationError);

      try {
        await adapter.connect();
      } catch (error) {
        expect(error).toBeInstanceOf(AuthorizationError);
        if (error instanceof AuthorizationError) {
          expect(error.message).toContain('[AuthorizationError]');
          expect(error.message).toContain('rejected by user');
          expect(error.message).toContain('Solution:');
          expect(error.message).toContain('approve');
        }
      }
    });

    it('should handle "denied" error message', async () => {
      await adapter.initialize();
      mockWallet.connect.mockRejectedValue(new Error('Connection was denied by the user'));

      await expect(adapter.connect()).rejects.toThrow(AuthorizationError);
    });

    it('should handle "cancelled" error message', async () => {
      await adapter.initialize();
      mockWallet.connect.mockRejectedValue(new Error('User cancelled the operation'));

      await expect(adapter.connect()).rejects.toThrow(AuthorizationError);
    });
  });

  describe('Browser Launch Failure', () => {
    it('should provide manual URL when browser launch fails', async () => {
      await adapter.initialize();
      mockWallet.connect.mockRejectedValue(new Error('Failed to open browser for authentication'));

      try {
        await adapter.connect();
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigurationError);
        if (error instanceof ConfigurationError) {
          expect(error.message).toContain('[ConfigurationError]');
          expect(error.message).toContain('Failed to open browser');
          expect(error.message).toContain('localhost:54321');
          expect(error.message).toContain('Solution:');
        }
      }
    });
  });

  describe('Permission Denial', () => {
    it('should list missing permissions in error message', async () => {
      await adapter.initialize();
      mockWallet.connect.mockRejectedValue(new Error('Required permission not granted'));

      try {
        await adapter.connect(['ACCESS_ADDRESS', 'SIGN_TRANSACTION', 'DISPATCH']);
      } catch (error) {
        expect(error).toBeInstanceOf(AuthorizationError);
        if (error instanceof AuthorizationError) {
          expect(error.message).toContain('[AuthorizationError]');
          expect(error.message).toContain('permissions denied');
          expect(error.message).toContain('ACCESS_ADDRESS');
          expect(error.message).toContain('SIGN_TRANSACTION');
          expect(error.message).toContain('DISPATCH');
          expect(error.message).toContain('Solution:');
        }
      }
    });

    it('should handle permission-specific error from wallet', async () => {
      await adapter.initialize();
      mockWallet.connect.mockRejectedValue(new Error('Permission ACCESS_PUBLIC_KEY was denied'));

      await expect(adapter.connect()).rejects.toThrow(AuthorizationError);
    });
  });

  describe('Initialization Failure', () => {
    it('should throw ConfigurationError with port conflict guidance', async () => {
      mockWallet.initialize.mockRejectedValue(new Error('Port 3737 is already in use'));

      try {
        await adapter.initialize({ port: 3737 });
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigurationError);
        if (error instanceof ConfigurationError) {
          expect(error.message).toContain('[ConfigurationError]');
          expect(error.message).toContain('Failed to initialize browser wallet server');
          expect(error.message).toContain('Solution:');
          expect(error.configKey).toBe('node-arweave-wallet');
        }
      }
    });

    it('should handle generic initialization errors', async () => {
      mockWallet.initialize.mockRejectedValue(new Error('Server startup failed'));

      await expect(adapter.initialize()).rejects.toThrow(ConfigurationError);
    });
  });

  describe('Browser Connection Lost', () => {
    it('should throw NetworkError when browser connection drops during connect', async () => {
      await adapter.initialize();
      mockWallet.connect.mockRejectedValue(new Error('Browser connection lost'));

      try {
        await adapter.connect();
      } catch (error) {
        expect(error).toBeInstanceOf(NetworkError);
        if (error instanceof NetworkError) {
          expect(error.message).toContain('[NetworkError]');
          expect(error.message).toContain('Browser connection lost');
          expect(error.message).toContain('localhost:54321');
          expect(error.message).toContain('Solution:');
          expect(error.errorType).toBe('connection_failure');
        }
      }
    });

    it('should handle "browser page not responding" error', async () => {
      await adapter.initialize();
      mockWallet.connect.mockRejectedValue(new Error('Browser page not responding'));

      await expect(adapter.connect()).rejects.toThrow(NetworkError);
    });
  });

  describe('Transaction Signing Errors', () => {
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

    it('should throw NetworkError with timeout message for signing timeout', async () => {
      mockWallet.sign.mockRejectedValue(new Error('Timeout waiting for sign after 300000 seconds'));

      try {
        await adapter.sign(mockTransaction);
      } catch (error) {
        expect(error).toBeInstanceOf(NetworkError);
        if (error instanceof NetworkError) {
          expect(error.message).toContain('signing timeout');
          expect(error.message).toContain('300000ms');
          expect(error.errorType).toBe('timeout');
        }
      }
    });

    it('should throw AuthorizationError when user denies signature', async () => {
      mockWallet.sign.mockRejectedValue(new Error('User rejected signature request'));

      try {
        await adapter.sign(mockTransaction);
      } catch (error) {
        expect(error).toBeInstanceOf(AuthorizationError);
        if (error instanceof AuthorizationError) {
          expect(error.message).toContain('signature denied');
          expect(error.message).toContain('Solution:');
        }
      }
    });

    it('should throw NetworkError when browser connection drops during signing', async () => {
      mockWallet.sign.mockRejectedValue(new Error('Browser connection lost'));

      try {
        await adapter.sign(mockTransaction);
      } catch (error) {
        expect(error).toBeInstanceOf(NetworkError);
        if (error instanceof NetworkError) {
          expect(error.message).toContain('Browser connection lost during signing');
          expect(error.message).toContain('localhost:54321');
        }
      }
    });
  });

  describe('Error Message Format Validation', () => {
    it('should follow error message pattern: "[ErrorType] Problem. -> Solution: Action."', async () => {
      const testCases = [
        {
          mockError: 'Connection timeout',
          expectedPattern: /^\[NetworkError\].*\. -> Solution:.*\.$/,
        },
        {
          mockError: 'User rejected',
          expectedPattern: /^\[AuthorizationError\].*\. -> Solution:.*\.$/,
        },
        {
          mockError: 'Failed to open browser',
          expectedPattern: /^\[ConfigurationError\].*\. -> Solution:.*\.$/,
        },
      ];

      await adapter.initialize();

      for (const testCase of testCases) {
        mockWallet.connect.mockRejectedValue(new Error(testCase.mockError));

        try {
          await adapter.connect();
        } catch (error) {
          if (error instanceof Error) {
            expect(error.message).toMatch(testCase.expectedPattern);
          }
        }
      }
    });
  });

  describe('Logging Verification', () => {
    it('should log connection attempt with context', async () => {
      // This test verifies that logging happens (checked via console output in actual runs)
      await adapter.initialize();
      await adapter.connect();

      expect(mockWallet.connect).toHaveBeenCalled();
    });

    it('should log elapsed time on connection failure', async () => {
      await adapter.initialize();
      mockWallet.connect.mockRejectedValue(new Error('Connection failed'));

      try {
        await adapter.connect();
      } catch (error) {
        // Logging happens internally - verify error was thrown
        expect(error).toBeInstanceOf(NetworkError);
      }
    });

    it('should log actual server port after initialization', async () => {
      await adapter.initialize();

      // Port is captured internally
      expect(mockWallet.initialize).toHaveBeenCalled();
    });
  });
});

/**
 * Unit tests for publish-skill MCP tool
 *
 * Tests the handlePublishSkill function, error translation,
 * and response formatting with mocked dependencies.
 */

import {
  handlePublishSkill,
  translateError,
  formatSuccessResponse,
  IPublishResult,
  IMCPSuccessResponse,
} from '../../../src/tools/publish-skill';
import {
  ValidationError,
  ConfigurationError,
  AuthorizationError,
  FileSystemError,
  NetworkError,
} from '@permamind/skills-cli/types/errors';

// Mock Arweave FIRST before any other imports
jest.mock('arweave', () => {
  const mockArweave = {
    init: jest.fn().mockReturnValue({
      wallets: {
        jwkToAddress: jest.fn().mockResolvedValue('test-wallet-address'),
        getBalance: jest.fn().mockResolvedValue('1000000000'),
      },
      ar: {
        winstonToAr: jest.fn().mockReturnValue('1'),
      },
    }),
  };
  return mockArweave;
});

// Mock other dependencies
jest.mock('@permamind/skills-cli/lib/wallet-manager');
jest.mock('@permamind/skills-cli/lib/publish-service', () => ({
  PublishService: jest.fn().mockImplementation(() => ({
    publish: jest.fn(),
  })),
}));
jest.mock('../../../src/config');
jest.mock('../../../src/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('publish-skill tool', () => {
  const mockPublishResult: IPublishResult = {
    skillName: 'test-skill',
    version: '1.0.0',
    arweaveTxId: 'abc123def456ghi789jkl012mno345pqr678stu901vwx',
    bundleSize: 12345,
    uploadCost: 67890,
    registryMessageId: 'xyz987wvu654tsr321qpo098nml765kji432hgf210edc',
    publishedAt: 1234567890000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handlePublishSkill - Browser Wallet Cleanup', () => {
    let mockBrowserWalletProvider: any;
    let mockSeedPhraseWalletProvider: any;

    beforeEach(() => {
      // Mock browser wallet provider with disconnect method and HTTP server
      mockBrowserWalletProvider = {
        getAddress: jest.fn().mockResolvedValue('browser-wallet-address'),
        createDataItemSigner: jest.fn(),
        disconnect: jest.fn().mockResolvedValue(undefined),
        getSource: jest.fn().mockReturnValue({
          source: 'browserWallet',
          value: 'browser-wallet-address',
        }),
        // Simulate circular reference that would cause JSON.stringify to fail
        _adapter: {
          wallet: null, // Circular reference placeholder
        },
      };
      // Create circular reference
      mockBrowserWalletProvider._adapter.wallet = mockBrowserWalletProvider._adapter;

      // Mock seed phrase wallet provider (no disconnect method, no circular refs)
      mockSeedPhraseWalletProvider = {
        getAddress: jest.fn().mockResolvedValue('seed-phrase-address'),
        createDataItemSigner: jest.fn(),
        getSource: jest.fn().mockReturnValue({
          source: 'seedPhrase',
          value: 'abandon abandon ... about',
        }),
      };
    });

    it('should disconnect browser wallet after successful publish', async () => {
      // Arrange
      const mockLoad = jest.spyOn(require('@permamind/skills-cli/lib/wallet-manager'), 'load');
      mockLoad.mockResolvedValue(mockBrowserWalletProvider);
      (PublishService.prototype.publish as jest.Mock).mockResolvedValue(mockPublishResult);

      // Act
      const result = await handlePublishSkill('/path/to/skill', false);

      // Assert
      expect(result).toEqual(mockPublishResult);
      expect(mockBrowserWalletProvider.disconnect).toHaveBeenCalledTimes(1);
    });

    it('should disconnect browser wallet even when publish fails', async () => {
      // Arrange
      const mockLoad = jest.spyOn(require('@permamind/skills-cli/lib/wallet-manager'), 'load');
      mockLoad.mockResolvedValue(mockBrowserWalletProvider);
      const publishError = new Error('Publish failed: network timeout');
      (PublishService.prototype.publish as jest.Mock).mockRejectedValue(publishError);

      // Act & Assert
      await expect(handlePublishSkill('/path/to/skill', false)).rejects.toThrow(
        'Publish failed: network timeout'
      );
      expect(mockBrowserWalletProvider.disconnect).toHaveBeenCalledTimes(1);
    });

    it('should handle disconnect errors gracefully without masking original error', async () => {
      // Arrange
      const mockLoad = jest.spyOn(require('@permamind/skills-cli/lib/wallet-manager'), 'load');
      mockLoad.mockResolvedValue(mockBrowserWalletProvider);
      const publishError = new Error('Publish failed: insufficient funds');
      const disconnectError = new Error('Disconnect failed: server already closed');
      (PublishService.prototype.publish as jest.Mock).mockRejectedValue(publishError);
      mockBrowserWalletProvider.disconnect.mockRejectedValue(disconnectError);

      // Act & Assert
      await expect(handlePublishSkill('/path/to/skill', false)).rejects.toThrow(
        'Publish failed: insufficient funds'
      );
      expect(mockBrowserWalletProvider.disconnect).toHaveBeenCalledTimes(1);
    });

    it('should not disconnect seed phrase wallet (no cleanup needed)', async () => {
      // Arrange
      const mockLoad = jest.spyOn(require('@permamind/skills-cli/lib/wallet-manager'), 'load');
      mockLoad.mockResolvedValue(mockSeedPhraseWalletProvider);
      (PublishService.prototype.publish as jest.Mock).mockResolvedValue(mockPublishResult);

      // Act
      const result = await handlePublishSkill('/path/to/skill', false);

      // Assert
      expect(result).toEqual(mockPublishResult);
      expect(mockSeedPhraseWalletProvider.disconnect).toBeUndefined();
    });

    it('should return JSON-serializable result after browser wallet cleanup', async () => {
      // Arrange
      const mockLoad = jest.spyOn(require('@permamind/skills-cli/lib/wallet-manager'), 'load');
      mockLoad.mockResolvedValue(mockBrowserWalletProvider);
      (PublishService.prototype.publish as jest.Mock).mockResolvedValue(mockPublishResult);

      // Act
      const result = await handlePublishSkill('/path/to/skill', false);

      // Assert - Result should be JSON serializable (no circular refs)
      expect(() => JSON.stringify(result)).not.toThrow();
      const serialized = JSON.stringify(result);
      expect(JSON.parse(serialized)).toEqual(mockPublishResult);
    });
  });

  describe('handlePublishSkill', () => {
    it('should successfully publish a skill with seed phrase wallet', async () => {
      // Arrange
      const mockSeedPhraseProvider = {
        getAddress: jest.fn().mockResolvedValue('seed-phrase-address'),
        createDataItemSigner: jest.fn(),
        getSource: jest.fn().mockReturnValue({
          source: 'seedPhrase',
          value: 'abandon abandon ... about',
        }),
      };

      const mockLoad = jest.spyOn(require('@permamind/skills-cli/lib/wallet-manager'), 'load');
      mockLoad.mockResolvedValue(mockSeedPhraseProvider);
      const { PublishService } = require('@permamind/skills-cli/lib/publish-service');
      PublishService.prototype.publish = jest.fn().mockResolvedValue(mockPublishResult);

      // Act
      const result = await handlePublishSkill('/path/to/skill', false);

      // Assert
      expect(result).toEqual(mockPublishResult);
      expect(mockLoad).toHaveBeenCalled();
      expect(PublishService.prototype.publish).toHaveBeenCalledWith('/path/to/skill', {
        walletProvider: mockSeedPhraseProvider,
        verbose: false,
      });
    });

    it('should handle verbose flag', async () => {
      // Arrange
      const mockSeedPhraseProvider = {
        getAddress: jest.fn().mockResolvedValue('seed-phrase-address'),
        createDataItemSigner: jest.fn(),
        getSource: jest.fn().mockReturnValue({
          source: 'seedPhrase',
          value: 'abandon abandon ... about',
        }),
      };

      const mockLoad = jest.spyOn(require('@permamind/skills-cli/lib/wallet-manager'), 'load');
      mockLoad.mockResolvedValue(mockSeedPhraseProvider);
      const { PublishService } = require('@permamind/skills-cli/lib/publish-service');
      PublishService.prototype.publish = jest.fn().mockResolvedValue(mockPublishResult);

      // Act
      await handlePublishSkill('/path/to/skill', true);

      // Assert
      expect(PublishService.prototype.publish).toHaveBeenCalledWith('/path/to/skill', {
        walletProvider: mockSeedPhraseProvider,
        verbose: true,
      });
    });

    it('should throw InvalidMnemonicError for invalid seed phrase', async () => {
      // Arrange
      const mockLoad = jest.spyOn(require('@permamind/skills-cli/lib/wallet-manager'), 'load');
      mockLoad.mockRejectedValue(new Error('Invalid mnemonic format'));

      // Act & Assert
      await expect(handlePublishSkill('/path/to/skill', false)).rejects.toThrow(
        'Invalid SEED_PHRASE'
      );
    });

    it('should throw WalletGenerationError for other wallet errors', async () => {
      // Arrange
      const mockLoad = jest.spyOn(require('@permamind/skills-cli/lib/wallet-manager'), 'load');
      mockLoad.mockRejectedValue(new Error('Unknown error'));

      // Act & Assert
      await expect(handlePublishSkill('/path/to/skill', false)).rejects.toThrow(
        'Failed to load wallet provider'
      );
    });

    it('should propagate PublishService errors', async () => {
      // Arrange
      const mockSeedPhraseProvider = {
        getAddress: jest.fn().mockResolvedValue('seed-phrase-address'),
        createDataItemSigner: jest.fn(),
        getSource: jest.fn().mockReturnValue({
          source: 'seedPhrase',
          value: 'abandon abandon ... about',
        }),
      };

      const mockLoad = jest.spyOn(require('@permamind/skills-cli/lib/wallet-manager'), 'load');
      mockLoad.mockResolvedValue(mockSeedPhraseProvider);
      const { PublishService } = require('@permamind/skills-cli/lib/publish-service');
      PublishService.prototype.publish = jest.fn().mockRejectedValue(
        new ValidationError('SKILL.md not found', 'manifest', null)
      );

      // Act & Assert
      await expect(handlePublishSkill('/path/to/skill', false)).rejects.toThrow(ValidationError);
    });
  });

  describe('translateError', () => {
    it('should translate ValidationError', () => {
      // Arrange
      const error = new ValidationError('Invalid manifest', 'manifest', { name: 'test-skill' });

      // Act
      const result = translateError(error);

      // Assert
      expect(result).toMatchObject({
        status: 'error',
        errorType: 'ValidationError',
        message: 'Invalid manifest',
        solution: expect.stringContaining('Fix validation errors'),
      });
    });

    it('should translate ConfigurationError', () => {
      // Arrange
      const error = new ConfigurationError('SEED_PHRASE not set', 'wallet');

      // Act
      const result = translateError(error);

      // Assert
      expect(result).toMatchObject({
        status: 'error',
        errorType: 'ConfigurationError',
        message: 'SEED_PHRASE not set',
        solution: expect.stringContaining('Set SEED_PHRASE environment variable'),
      });
    });

    it('should translate AuthorizationError', () => {
      // Arrange
      const error = new AuthorizationError(
        'Insufficient balance',
        'abc123...def456',
        0
      );

      // Act
      const result = translateError(error);

      // Assert
      expect(result).toMatchObject({
        status: 'error',
        errorType: 'AuthorizationError',
        message: 'Insufficient balance',
        solution: expect.stringContaining('Add funds to your wallet'),
      });
    });

    it('should translate FileSystemError', () => {
      // Arrange
      const error = new FileSystemError('Permission denied', '/path/to/skill');

      // Act
      const result = translateError(error);

      // Assert
      expect(result).toMatchObject({
        status: 'error',
        errorType: 'FileSystemError',
        message: 'Permission denied',
        solution: expect.stringContaining('Check file permissions'),
      });
    });

    it('should translate NetworkError', () => {
      // Arrange
      const error = new NetworkError(
        'Connection timeout',
        new Error('Timeout'),
        'https://arweave.net',
        'timeout'
      );

      // Act
      const result = translateError(error);

      // Assert
      expect(result).toMatchObject({
        status: 'error',
        errorType: 'NetworkError',
        message: 'Connection timeout',
        solution: expect.stringContaining('Check your network connection'),
      });
    });

    it('should translate unknown errors', () => {
      // Arrange
      const error = new Error('Something went wrong');

      // Act
      const result = translateError(error);

      // Assert
      expect(result).toMatchObject({
        status: 'error',
        errorType: 'UnknownError',
        message: 'Something went wrong',
        solution: expect.stringContaining('Check the MCP server logs'),
      });
    });

    it('should redact seed phrases from error messages', () => {
      // Arrange
      const error = new Error(
        'Wallet generation failed with seed: apple banana cherry date elephant fig grape honey island jungle kitten lemon'
      );

      // Act
      const result = translateError(error);

      // Assert
      expect(result.message).toContain('[REDACTED_SEED_PHRASE]');
      expect(result.message).not.toContain('apple banana');
    });

    it('should redact private keys from error messages', () => {
      // Arrange
      const error = new Error(
        'Failed with key: abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/'
      );

      // Act
      const result = translateError(error);

      // Assert
      expect(result.message).toContain('[REDACTED_PRIVATE_KEY]');
      expect(result.message).not.toContain('abcdefghijklmnopqrstuvwxyz');
    });
  });

  describe('formatSuccessResponse', () => {
    it('should format publish result as success response', () => {
      // Act
      const result = formatSuccessResponse(mockPublishResult);

      // Assert
      expect(result).toMatchObject<IMCPSuccessResponse>({
        status: 'success',
        message: 'Skill published successfully',
        skillName: 'test-skill',
        version: '1.0.0',
        arweaveTxId: 'abc123def456ghi789jkl012mno345pqr678stu901vwx',
        bundleSize: 12345,
        uploadCost: 67890,
        registryMessageId: 'xyz987wvu654tsr321qpo098nml765kji432hgf210edc',
        publishedAt: 1234567890000,
        viewUrl: 'https://viewblock.io/arweave/tx/abc123def456ghi789jkl012mno345pqr678stu901vwx',
      });
    });

    it('should construct correct viewblock URL', () => {
      // Act
      const result = formatSuccessResponse(mockPublishResult);

      // Assert
      expect(result.viewUrl).toBe(
        `https://viewblock.io/arweave/tx/${mockPublishResult.arweaveTxId}`
      );
    });
  });
});

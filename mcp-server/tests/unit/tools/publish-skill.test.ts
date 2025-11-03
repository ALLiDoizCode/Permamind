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
import { WalletFactory } from '@permamind/skills-cli/src/lib/wallet-factory';
import { PublishService } from '@permamind/skills-cli/src/lib/publish-service';
import { loadConfig } from '../../../src/config';
import {
  ValidationError,
  ConfigurationError,
  AuthorizationError,
  FileSystemError,
  NetworkError,
} from '@permamind/skills-cli/src/types/errors';

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
jest.mock('@permamind/skills-cli/src/lib/wallet-factory');
jest.mock('@permamind/skills-cli/src/lib/publish-service');
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
  const mockWallet = {
    kty: 'RSA',
    n: 'test-n',
    e: 'AQAB',
    d: 'test-d',
  };

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

    // Mock config
    (loadConfig as jest.Mock).mockReturnValue({
      seedPhrase: 'test seed phrase with twelve words that are valid mnemonic format',
      logLevel: 'info',
    });
  });

  describe('handlePublishSkill', () => {
    it('should successfully publish a skill', async () => {
      // Arrange
      (WalletFactory.fromSeedPhrase as jest.Mock).mockResolvedValue(mockWallet);
      (PublishService.prototype.publish as jest.Mock).mockResolvedValue(mockPublishResult);

      // Act
      const result = await handlePublishSkill('/path/to/skill', false);

      // Assert
      expect(result).toEqual(mockPublishResult);
      expect(WalletFactory.fromSeedPhrase).toHaveBeenCalledWith(
        'test seed phrase with twelve words that are valid mnemonic format'
      );
      expect(PublishService.prototype.publish).toHaveBeenCalledWith('/path/to/skill', {
        wallet: mockWallet,
        verbose: false,
      });
    });

    it('should handle verbose flag', async () => {
      // Arrange
      (WalletFactory.fromSeedPhrase as jest.Mock).mockResolvedValue(mockWallet);
      (PublishService.prototype.publish as jest.Mock).mockResolvedValue(mockPublishResult);

      // Act
      await handlePublishSkill('/path/to/skill', true);

      // Assert
      expect(PublishService.prototype.publish).toHaveBeenCalledWith('/path/to/skill', {
        wallet: mockWallet,
        verbose: true,
      });
    });

    it('should throw InvalidMnemonicError for invalid seed phrase', async () => {
      // Arrange
      (WalletFactory.fromSeedPhrase as jest.Mock).mockRejectedValue(
        new Error('Invalid mnemonic format')
      );

      // Act & Assert
      await expect(handlePublishSkill('/path/to/skill', false)).rejects.toThrow(
        'Invalid SEED_PHRASE'
      );
    });

    it('should throw WalletGenerationError for other wallet errors', async () => {
      // Arrange
      (WalletFactory.fromSeedPhrase as jest.Mock).mockRejectedValue(new Error('Unknown error'));

      // Act & Assert
      await expect(handlePublishSkill('/path/to/skill', false)).rejects.toThrow(
        'Failed to generate wallet'
      );
    });

    it('should propagate PublishService errors', async () => {
      // Arrange
      (WalletFactory.fromSeedPhrase as jest.Mock).mockResolvedValue(mockWallet);
      (PublishService.prototype.publish as jest.Mock).mockRejectedValue(
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

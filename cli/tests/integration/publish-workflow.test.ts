/**
 * Integration tests for Publish Workflow
 *
 * Tests end-to-end publish workflow: parse → bundle → upload → register
 * Uses mocked external dependencies (Arweave SDK, AO SDK, file system)
 */

import * as path from 'path';
import * as fs from 'fs';
import { JWK } from '../../src/types/arweave.js';
import { NetworkError, ValidationError, AuthorizationError } from '../../src/types/errors.js';

// Mock Arweave SDK
const mockWallets = {
  jwkToAddress: jest.fn(),
  getBalance: jest.fn(),
};

const mockTransactions = {
  sign: jest.fn(),
  post: jest.fn(),
};

const mockTransaction = {
  id: 'publish_workflow_tx_id_43_chars_long_123',
  reward: '1000000000', // 0.001 AR
  addTag: jest.fn(),
};

const mockCreateTransaction = jest.fn();

jest.mock('arweave', () => {
  const mockInit = jest.fn();
  return {
    __esModule: true,
    default: {
      init: mockInit,
    },
  };
});

// Mock Turbo SDK (@ardrive/turbo-sdk) - Epic 9
// Shared mock functions for Turbo SDK (accessible in tests)
const mockTurboUploadFile = jest.fn();
const mockTurboGetWincForFiat = jest.fn();
const mockTurboInstance = {
  uploadFile: mockTurboUploadFile,
  getWincForFiat: mockTurboGetWincForFiat,
};

jest.mock('@ardrive/turbo-sdk', () => ({
  __esModule: true,
  TurboFactory: {
    authenticated: jest.fn(() => mockTurboInstance),
    unauthenticated: jest.fn(() => mockTurboInstance),
  },
}));

// Mock turbo-init module - returns synchronously (not a Promise)
jest.mock('../../src/lib/turbo-init.js', () => ({
  __esModule: true,
  initializeTurboClient: jest.fn(() => mockTurboInstance),
}));

// Configure Turbo mock defaults (must be after jest.mock() due to hoisting)
mockTurboUploadFile.mockResolvedValue({
  id: 'mockTurboTxId43CharsLongAbcdefghijk12345678',  // Exactly 43 characters
  owner: 'mock_owner_address_43_chars_long_abc123',
  dataCaches: ['https://arweave.net'],
  fastFinalityIndexes: [],
  version: '1.0.0',
  deadlineHeight: 1000000,
  public: undefined,
  signature: 'mock_signature',
  anchor: '',
});

mockTurboGetWincForFiat.mockResolvedValue({
  winc: '1000000000',
  currency: 'usd',
  adjustments: [],
});

// Mock AO SDK (@permaweb/aoconnect)
const mockMessage = jest.fn();
const mockDryrun = jest.fn();
const mockResult = jest.fn();
const mockCreateDataItemSigner = jest.fn();

jest.mock('@permaweb/aoconnect', () => ({
  __esModule: true,
  connect: jest.fn(() => ({
    message: (...args: any[]) => mockMessage(...args),
    dryrun: (...args: any[]) => mockDryrun(...args),
    result: (...args: any[]) => mockResult(...args),
  })),
  message: (...args: any[]) => mockMessage(...args),
  dryrun: (...args: any[]) => mockDryrun(...args),
  result: (...args: any[]) => mockResult(...args),
  createDataItemSigner: (...args: any[]) => mockCreateDataItemSigner(...args),
}));

// Mock config loader
const mockLoadConfig = jest.fn();
const mockResolveWalletPath = jest.fn();

jest.mock('../../src/lib/config-loader.js', () => ({
  __esModule: true,
  loadConfig: (...args: any[]) => mockLoadConfig(...args),
  resolveWalletPath: (...args: any[]) => mockResolveWalletPath(...args),
}));

// Mock ora (spinner library)
jest.mock('ora', () => {
  const mockOra = jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    stop: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    text: '',
  }));
  return { __esModule: true, default: mockOra };
});

// Mock chalk (color library)
jest.mock('chalk', () => ({
  __esModule: true,
  default: {
    green: jest.fn((s) => s),
    red: jest.fn((s) => s),
    yellow: jest.fn((s) => s),
    cyan: jest.fn((s) => s),
    bold: jest.fn((s) => s),
  },
  green: jest.fn((s) => s),
  red: jest.fn((s) => s),
  yellow: jest.fn((s) => s),
  cyan: jest.fn((s) => s),
  bold: jest.fn((s) => s),
}));

// Mock logger (both default and named exports)
jest.mock('../../src/utils/logger.js', () => {
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    setLevel: jest.fn(),
  };
  return {
    __esModule: true,
    ...mockLogger, // Named exports
    default: mockLogger, // Default export
  };
});

// Mock fetch for transaction status
global.fetch = jest.fn();

// Mock file system
const mockAccess = jest.fn();
const mockReadFile = jest.fn();
const mockStat = jest.fn();
const mockReaddir = jest.fn();

jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    __esModule: true,
    ...actualFs,
    promises: {
      ...actualFs.promises,
      access: (...args: any[]) => mockAccess(...args),
      readFile: (...args: any[]) => mockReadFile(...args),
      stat: (...args: any[]) => mockStat(...args),
      readdir: (...args: any[]) => mockReaddir(...args),
    },
  };
});

// Also mock fs/promises (used by manifest-parser)
jest.mock('fs/promises', () => ({
  __esModule: true,
  readFile: (...args: any[]) => mockReadFile(...args),
  access: (...args: any[]) => mockAccess(...args),
  stat: (...args: any[]) => mockStat(...args),
  readdir: (...args: any[]) => mockReaddir(...args),
}));

// Don't import execute here - use dynamic import in tests to ensure mocks are applied

describe('Publish Workflow Integration Tests', () => {
  // Load valid test wallet with proper RSA key parameters
  const testWalletPath = path.join(__dirname, '../fixtures/wallets/test-wallet.json');
  const mockWallet: JWK = JSON.parse(fs.readFileSync(testWalletPath, 'utf-8'));

  const skillDirectory = path.join(__dirname, '../fixtures/skills/valid-skill');
  const mockWalletPath = '/mock/path/to/wallet.json';

  beforeEach(() => {
    // Reset module registry to ensure fresh imports with mocks applied
    jest.resetModules();

    // Don't use jest.clearAllMocks() as it breaks ora mock
    // Instead, manually clear specific mocks we need to reset

    // Clear Arweave mocks
    mockWallets.jwkToAddress.mockClear();
    mockWallets.getBalance.mockClear();
    mockTransactions.sign.mockClear();
    mockTransactions.post.mockClear();
    mockCreateTransaction.mockClear();
    mockTransaction.addTag.mockClear();

    // Clear AO mocks
    mockMessage.mockClear();
    mockDryrun.mockClear();
    mockCreateDataItemSigner.mockClear();

    // Clear config loader mocks
    mockLoadConfig.mockClear();
    mockResolveWalletPath.mockClear();

    // Clear file system mocks
    mockAccess.mockClear();
    mockReadFile.mockClear();
    mockStat.mockClear();
    mockReaddir.mockClear();

    // Clear fetch mock
    (global.fetch as jest.Mock).mockClear();

    // Setup Arweave SDK mocks
    mockWallets.jwkToAddress.mockResolvedValue('mock_arweave_address_43_characters_long_abc');
    mockWallets.getBalance.mockResolvedValue('5000000000000'); // 5 AR
    mockTransactions.sign.mockResolvedValue(undefined);
    mockTransactions.post.mockResolvedValue({ status: 200, statusText: 'OK' });
    mockCreateTransaction.mockResolvedValue(mockTransaction);

    const Arweave = require('arweave').default;
    Arweave.init.mockReturnValue({
      wallets: mockWallets,
      transactions: mockTransactions,
      createTransaction: mockCreateTransaction,
    });

    // Setup Turbo SDK mocks (Epic 9)
    mockTurboUploadFile.mockClear();
    mockTurboGetWincForFiat.mockClear();
    mockTurboUploadFile.mockResolvedValue({
      id: 'publish_workflow_tx_id_43_chars_long_123456',  // Exactly 43 characters
      owner: 'mock_arweave_address_43_characters_long_abc',
      dataCaches: ['https://arweave.net'],
      fastFinalityIndexes: [],
      deadlineHeight: 1234567,
      winc: '1000000', // Cost in winc
    });
    mockTurboGetWincForFiat.mockResolvedValue({
      winc: '1000000',
      adjustments: [],
    });

    // Setup AO SDK mocks
    mockMessage.mockResolvedValue('mock_ao_message_id_43_chars_long_12345');
    mockDryrun.mockResolvedValue({
      Messages: [
        {
          Data: JSON.stringify({
            name: 'test-skill',
            version: '1.0.0',
          }),
        },
      ],
    });
    mockResult.mockResolvedValue({
      Messages: [
        {
          Tags: [
            { name: 'Action', value: 'Skill-Registered' },
            { name: 'Name', value: 'test-skill' },
            { name: 'Version', value: '1.0.0' },
          ],
        },
      ],
    });
    mockCreateDataItemSigner.mockReturnValue(mockWallet);

    // Setup config loader mocks
    mockLoadConfig.mockResolvedValue({
      gateway: 'https://arweave.net',
      registry: 'mock_registry_process_id_43_chars_long',
    });
    mockResolveWalletPath.mockReturnValue(mockWalletPath);

    // Setup fetch mock for transaction status
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        block_height: 1234567,
        number_of_confirmations: 10,
      }),
    });

    // Setup file system mocks
    mockAccess.mockResolvedValue(undefined); // File exists
    mockReadFile.mockImplementation(async (filePath: string) => {
      if (filePath.includes('wallet.json')) {
        return JSON.stringify(mockWallet);
      }
      if (filePath.includes('SKILL.md')) {
        return `---
name: test-skill
version: 1.0.0
description: Test skill for integration tests
author: Test Author
tags: [test, integration]
dependencies: []
---

# Test Skill

This is a test skill for integration testing.
`;
      }
      return '';
    });
    mockStat.mockImplementation(async (filePath: string) => {
      const pathStr = String(filePath);
      if (pathStr.includes('SKILL.md')) {
        return {
          isDirectory: () => false,
          isFile: () => true,
          size: 1024,
        };
      }
      return {
        isDirectory: () => true,
        isFile: () => false,
        size: 4096,
      };
    });

    mockReaddir.mockResolvedValue([
      { name: 'SKILL.md', isDirectory: () => false, isFile: () => true },
      { name: 'README.md', isDirectory: () => false, isFile: () => true },
    ]);
  });

  describe('Full Workflow', () => {
    it('should complete full publish workflow: parse → bundle → upload → register', async () => {
      const { execute } = await import('../../src/commands/publish.js');

      const result = await execute(skillDirectory, {
        wallet: mockWalletPath,
      });

      // Verify result structure
      expect(result).toHaveProperty('skillName', 'test-skill');
      expect(result).toHaveProperty('version', '1.0.0');
      expect(result).toHaveProperty('arweaveTxId');
      expect(result).toHaveProperty('registryMessageId');

      // Verify workflow steps
      expect(mockReadFile).toHaveBeenCalled(); // Manifest parsed
      // Note: Balance checking removed in IWalletProvider refactor - wallets handle their own validation
      expect(mockTurboUploadFile).toHaveBeenCalled(); // Bundle uploaded via Turbo SDK
      expect(mockMessage).toHaveBeenCalled(); // Registry registration
    }, 30000);

    it('should display progress indicators during upload', async () => {
      const { execute } = await import('../../src/commands/publish.js');
      const ora = require('ora').default;

      await execute(skillDirectory, {
        wallet: mockWalletPath,
      });

      // Verify ora was called to create spinners
      expect(ora).toHaveBeenCalled();
    }, 30000);


    it.skip('should register skill in AO registry after successful upload', async () => {
      const { execute } = await import('../../src/commands/publish.js');

      const result = await execute(skillDirectory, {
        wallet: mockWalletPath,
      });

      // Verify AO message was sent
      expect(mockMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          process: expect.any(String),
          tags: expect.arrayContaining([
            expect.objectContaining({ name: 'Action', value: 'Register-Skill' }),
            expect.objectContaining({ name: 'Name', value: 'test-skill' }),
            expect.objectContaining({ name: 'Version', value: '1.0.0' }),
          ]),
        })
      );

      expect(result.registryMessageId).toBe('mock_ao_message_id_43_chars_long_12345');
    }, 30000);
  });

  describe('Error Handling', () => {
    // Skip on Windows - module reset behavior differs
    (process.platform === 'win32' ? it.skip : it)('should handle manifest validation error', async () => {
      // For this test, we need to set up the invalid manifest mock
      // BEFORE jest.resetModules(), so use a fresh beforeEach setup

      // Reset modules to clear cache
      jest.resetModules();

      // NOW set up the invalid manifest mock BEFORE any imports
      mockReadFile.mockImplementation(async (filePath: string) => {
        if (filePath.includes('SKILL.md')) {
          // Invalid: name has spaces (violates ^[a-z0-9-]+$ pattern)
          return `---
name: invalid name with spaces
version: 1.0.0
description: Test description
author: Test Author
---

Invalid manifest
`;
        }
        if (filePath.includes('wallet.json')) {
          return JSON.stringify(mockWallet);
        }
        return '';
      });

      // Re-setup other required mocks after resetModules
      mockWallets.jwkToAddress.mockResolvedValue('mock_arweave_address_43_characters_long_abc');
      mockWallets.getBalance.mockResolvedValue('5000000000000');
      mockTransactions.sign.mockResolvedValue(undefined);
      mockTransactions.post.mockResolvedValue({ status: 200, statusText: 'OK' });
      mockCreateTransaction.mockResolvedValue(mockTransaction);
      const Arweave = require('arweave').default;
      Arweave.init.mockReturnValue({
        wallets: mockWallets,
        transactions: mockTransactions,
        createTransaction: mockCreateTransaction,
      });
      mockMessage.mockResolvedValue('mock_ao_message_id_43_chars_long_12345');
      mockResult.mockResolvedValue({
        Messages: [
          {
            Tags: [
              { name: 'Action', value: 'Skill-Registered' },
              { name: 'Name', value: 'test-skill' },
              { name: 'Version', value: '1.0.0' },
            ],
          },
        ],
      });
      mockLoadConfig.mockResolvedValue({
        gateway: 'https://arweave.net',
        registry: 'mock_registry_process_id_43_chars_long',
      });
      mockAccess.mockResolvedValue(undefined);
      mockStat.mockImplementation(async (filePath: string) => {
        const pathStr = String(filePath);
        if (pathStr.includes('skills/valid-skill') && !pathStr.includes('SKILL.md')) {
          // Directory stat
          return {
            isDirectory: () => true,
            isFile: () => false,
            size: 0,
          };
        }
        // File stat (SKILL.md)
        return {
          isDirectory: () => false,
          isFile: () => true,
          size: 1024,
        };
      });
      mockReaddir.mockResolvedValue([{ name: 'SKILL.md', isDirectory: () => false }] as any);

      // NOW import with the invalid manifest mock in place
      const { execute } = await import('../../src/commands/publish.js');

      await expect(
        execute(skillDirectory, { wallet: mockWalletPath })
      ).rejects.toThrow('validation');
    }, 30000);

    it.skip('should handle insufficient wallet balance error', async () => {
      // NOTE: This test requires forcing Arweave SDK path (bundle >= 100KB after gzip compression)
      // Current mock setup creates small bundles that use Turbo SDK free tier (no balance check)
      // TODO: Update test to properly mock large compressed bundles or test Arweave SDK path separately
      // NOTE: This test is for Arweave SDK path (large bundles >= 100KB), NOT Turbo SDK free tier
      // Mock insufficient balance BEFORE import
      mockWallets.getBalance.mockResolvedValue('100'); // Very low balance (0.0000001 AR)

      // Mock large bundle to force Arweave SDK path (bypasses Turbo SDK free tier)
      const largeMockData = `---
name: test-skill
version: 1.0.0
description: Test skill for balance error
author: Test Author
tags: [test]
---
# Test Skill

${'x'.repeat(101 * 1024)}
`; // 101+ KB total - forces Arweave SDK path
      mockReadFile.mockImplementation(async (filePath: string) => {
        if (filePath.includes('SKILL.md')) {
          return largeMockData; // Return large content with frontmatter
        }
        if (filePath.includes('manifest.json')) {
          return JSON.stringify({ name: 'test-skill', version: '1.0.0', description: 'Test' });
        }
        if (filePath.includes('wallet.json')) {
          return JSON.stringify(mockWallet);
        }
        return '';
      });

      // Setup Arweave SDK mocks for large bundle path
      mockWallets.jwkToAddress.mockResolvedValue('mock_arweave_address_43_characters_long_abc');
      mockCreateTransaction.mockResolvedValue({
        ...mockTransaction,
        reward: '10000000000', // High cost (10 AR) to exceed low balance
      });
      const Arweave = require('arweave').default;
      Arweave.init.mockReturnValue({
        wallets: mockWallets,
        transactions: mockTransactions,
        createTransaction: mockCreateTransaction,
      });

      // Import AFTER setting up test-specific mocks
      const { execute } = await import('../../src/commands/publish.js');

      await expect(
        execute(skillDirectory, { wallet: mockWalletPath })
      ).rejects.toThrow('Insufficient funds');
    }, 30000);

    it('should handle Arweave upload failure with retry', async () => {
      // Mock upload failure with retryable error (503 Service Unavailable)
      // Testing Turbo SDK retry logic (small bundles use Turbo SDK free tier)
      mockTurboUploadFile
        .mockRejectedValueOnce(new Error('Gateway error: 503 Service Unavailable'))
        .mockRejectedValueOnce(new Error('Gateway error: 503 Service Unavailable'))
        .mockResolvedValueOnce({
          id: 'publish_workflow_tx_id_43_chars_long_123456',
          owner: 'mock_arweave_address_43_characters_long_abc',
          dataCaches: ['https://arweave.net'],
          fastFinalityIndexes: [],
          deadlineHeight: 1234567,
          winc: '1000000',
        });

      // Import AFTER setting up test-specific mocks
      const { execute } = await import('../../src/commands/publish.js');

      const result = await execute(skillDirectory, {
        wallet: mockWalletPath,
      });

      // Verify retries happened (should succeed on 3rd attempt)
      expect(mockTurboUploadFile).toHaveBeenCalledTimes(3);
      expect(result).toHaveProperty('arweaveTxId');
    }, 30000);

    it.skip('should handle AO registry failure', async () => {
      // Mock registry failure BEFORE import
      mockMessage.mockRejectedValueOnce(new Error('Registry unavailable'));

      // Import AFTER setting up test-specific mocks
      const { execute } = await import('../../src/commands/publish.js');

      await expect(
        execute(skillDirectory, { wallet: mockWalletPath })
      ).rejects.toThrow('Failed to register skill');
    }, 30000);
  });

  describe('Configuration Options', () => {

    it('should use custom gateway if --gateway flag provided', async () => {
      // NOTE: For small bundles (<100KB), custom gateway is passed to Turbo SDK, not Arweave SDK
      const customGateway = 'https://custom-turbo-gateway.ardrive.io';

      // Override config to return custom turbo gateway
      mockLoadConfig.mockResolvedValue({
        registry: 'mock_registry_process_id_43_chars_long',
        turboGateway: customGateway,
      });

      // Get reference to turbo-init mock
      const { initializeTurboClient } = require('../../src/lib/turbo-init.js');
      (initializeTurboClient as jest.Mock).mockClear();

      // Import AFTER setting up mocks
      const { execute } = await import('../../src/commands/publish.js');

      await execute(skillDirectory, {
        wallet: mockWalletPath,
      });

      // Verify initializeTurboClient was called (custom gateway in config)
      // NOTE: Gateway is passed via config, not as direct parameter
      expect(initializeTurboClient).toHaveBeenCalled();
    }, 30000);

    it('should enable verbose logging if --verbose flag set', async () => {
      const { execute } = await import('../../src/commands/publish.js');
      const logger = require('../../src/utils/logger.js').default;

      await execute(skillDirectory, {
        wallet: mockWalletPath,
        verbose: true,
      });

      // Verify logger.setLevel was called
      expect(logger.setLevel).toHaveBeenCalled();
    }, 30000);
  });

  describe('Performance', () => {
    it('should complete within 60 seconds for <1MB bundles (AC #12)', async () => {
      const { execute } = await import('../../src/commands/publish.js');

      const startTime = Date.now();

      await execute(skillDirectory, {
        wallet: mockWalletPath,
      });

      const duration = Date.now() - startTime;

      // AC #12 requires completion within 60 seconds for typical bundles (<1MB)
      expect(duration).toBeLessThan(60000); // 60 seconds
    }, 65000); // Test timeout slightly higher than requirement
  });
});

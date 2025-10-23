/**
 * Unit tests for Configuration Loader Module
 *
 * Tests .skillsrc configuration loading, priority handling, and validation
 */

import * as path from 'path';
import { promises as fs } from 'fs';
import {
  loadConfig,
  resolveWalletPath,
  type Config,
} from '../../../src/lib/config-loader.js';
import {
  ConfigurationError,
  ValidationError,
} from '../../../src/types/errors.js';

describe('Config Loader', () => {
  const fixturesPath = path.join(__dirname, '../../fixtures');

  describe('loadConfig()', () => {
    it('should load .skillsrc config file with wallet path', async () => {
      const configPath = path.join(fixturesPath, '.skillsrc');
      const config = await loadConfig(configPath);

      expect(config).toBeDefined();
      expect(config.wallet).toBe('~/.arweave/wallet.json');
      expect(config.registry).toBe('MOCK_REGISTRY_PROCESS_ID');
      expect(config.gateway).toBe('https://arweave.net');
    });

    it('should prefer local .skillsrc over global ~/.skillsrc', async () => {
      // Create temporary local config
      const localConfigPath = path.join(process.cwd(), '.skillsrc');
      const localConfig = {
        wallet: '/local/wallet.json',
        gateway: 'https://local.arweave.net',
      };

      await fs.writeFile(localConfigPath, JSON.stringify(localConfig));

      try {
        const config = await loadConfig();

        // Should load local config
        expect(config.wallet).toBe('/local/wallet.json');
        expect(config.gateway).toBe('https://local.arweave.net');
      } finally {
        // Cleanup
        await fs.unlink(localConfigPath);
      }
    });

    it('should handle missing config file gracefully (return defaults)', async () => {
      const nonExistentPath = path.join(fixturesPath, 'non-existent.skillsrc');

      await expect(loadConfig(nonExistentPath)).rejects.toThrow(
        ConfigurationError
      );

      // When no path is provided and no config exists, should return defaults
      const config = await loadConfig();
      expect(config.gateway).toBe('https://arweave.net'); // Default gateway
    });

    it('should validate wallet path resolution priority (flag > config > prompt)', () => {
      const config: Config = {
        wallet: '/config/wallet.json',
        gateway: 'https://arweave.net',
      };

      // Priority 1: CLI flag
      const flagPath = resolveWalletPath('/flag/wallet.json', config);
      expect(flagPath).toBe('/flag/wallet.json');

      // Priority 2: Config file
      const configPath = resolveWalletPath(undefined, config);
      expect(configPath).toBe('/config/wallet.json');

      // Priority 3: Not configured
      const emptyConfig: Config = { gateway: 'https://arweave.net' };
      const nothingPath = resolveWalletPath(undefined, emptyConfig);
      expect(nothingPath).toBeUndefined();
    });

    it('should handle malformed .skillsrc JSON', async () => {
      // Create temporary malformed config
      const malformedConfigPath = path.join(
        fixturesPath,
        'malformed-config.json'
      );
      await fs.writeFile(malformedConfigPath, '{ "wallet": "test"');

      try {
        await expect(loadConfig(malformedConfigPath)).rejects.toThrow(
          ValidationError
        );
        await expect(loadConfig(malformedConfigPath)).rejects.toThrow(
          /malformed JSON/
        );
      } finally {
        // Cleanup
        await fs.unlink(malformedConfigPath);
      }
    });

    it('should merge config with defaults', async () => {
      // Create config with only wallet (missing gateway)
      const partialConfigPath = path.join(fixturesPath, 'partial-config.json');
      await fs.writeFile(
        partialConfigPath,
        JSON.stringify({ wallet: '/test/wallet.json' })
      );

      try {
        const config = await loadConfig(partialConfigPath);

        // Wallet from config
        expect(config.wallet).toBe('/test/wallet.json');
        // Gateway from defaults
        expect(config.gateway).toBe('https://arweave.net');
      } finally {
        // Cleanup
        await fs.unlink(partialConfigPath);
      }
    });

    // Skip on Windows - file permissions work differently
    (process.platform === 'win32' ? it.skip : it)('should handle permission errors when reading config', async () => {
      // Create config file
      const restrictedConfigPath = path.join(
        fixturesPath,
        'restricted-config.json'
      );
      await fs.writeFile(
        restrictedConfigPath,
        JSON.stringify({ wallet: '/test/wallet.json' })
      );

      try {
        // Remove read permissions
        await fs.chmod(restrictedConfigPath, 0o000);

        await expect(loadConfig(restrictedConfigPath)).rejects.toThrow(
          ConfigurationError
        );
      } finally {
        // Restore permissions and cleanup
        await fs.chmod(restrictedConfigPath, 0o644);
        await fs.unlink(restrictedConfigPath);
      }
    });
  });

  describe('resolveWalletPath()', () => {
    it('should prioritize CLI flag over config', () => {
      const config: Config = {
        wallet: '/config/wallet.json',
        gateway: 'https://arweave.net',
      };

      const resolved = resolveWalletPath('/cli/wallet.json', config);
      expect(resolved).toBe('/cli/wallet.json');
    });

    it('should use config wallet when no CLI flag', () => {
      const config: Config = {
        wallet: '/config/wallet.json',
        gateway: 'https://arweave.net',
      };

      const resolved = resolveWalletPath(undefined, config);
      expect(resolved).toBe('/config/wallet.json');
    });

    it('should return undefined when wallet not configured', () => {
      const config: Config = {
        gateway: 'https://arweave.net',
      };

      const resolved = resolveWalletPath(undefined, config);
      expect(resolved).toBeUndefined();
    });

    it('should handle empty string as CLI flag', () => {
      const config: Config = {
        wallet: '/config/wallet.json',
        gateway: 'https://arweave.net',
      };

      // Empty string should fall back to config
      const resolved = resolveWalletPath('', config);
      expect(resolved).toBe('/config/wallet.json');
    });
  });
});

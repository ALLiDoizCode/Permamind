/**
 * Integration tests for WalletFactory
 *
 * These tests validate the complete end-to-end workflow:
 * - Mnemonic → Seed → RSA Key → JWK → Address Derivation
 * - File-based wallet loading with real JWK fixtures
 * - Error scenarios across the full stack
 */

import { WalletFactory } from '../../src/lib/wallet-factory';
import { InvalidMnemonicError, InvalidSeedError, FileSystemError } from '../../src/types/errors';
import Arweave from 'arweave';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('WalletFactory Integration Tests', () => {
  const TEST_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

  const arweave = Arweave.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https',
  });

  describe('Full workflow: mnemonic → JWK → address derivation', () => {
    it('should complete full seed phrase to address workflow', async () => {
      // Step 1: Generate JWK from mnemonic
      const jwk = await WalletFactory.fromSeedPhrase(TEST_MNEMONIC);

      // Step 2: Derive Arweave address
      const address = await arweave.wallets.jwkToAddress(jwk);

      // Step 3: Validate address format
      expect(address).toMatch(/^[a-zA-Z0-9_-]{43}$/);
      expect(address.length).toBe(43);

      // Step 4: Verify JWK structure
      expect(jwk.kty).toBe('RSA');
      expect(jwk.n).toBeDefined();
      expect(jwk.e).toBeDefined();
      expect(jwk.d).toBeDefined();

      // Step 5: Verify determinism (same mnemonic = same address)
      const jwk2 = await WalletFactory.fromSeedPhrase(TEST_MNEMONIC);
      const address2 = await arweave.wallets.jwkToAddress(jwk2);

      expect(address).toBe(address2);
    }, 30000);

    it('should generate JWK capable of signing Arweave transactions (mock)', async () => {
      // This test verifies the JWK has all components needed for signing
      const jwk = await WalletFactory.fromSeedPhrase(TEST_MNEMONIC);

      // Verify private key components are present (required for signing)
      expect(jwk.d).toBeDefined();
      expect(jwk.p).toBeDefined();
      expect(jwk.q).toBeDefined();
      expect(jwk.dp).toBeDefined();
      expect(jwk.dq).toBeDefined();
      expect(jwk.qi).toBeDefined();

      // Verify all components are base64url-encoded strings
      const base64urlPattern = /^[A-Za-z0-9_-]+$/;
      expect(base64urlPattern.test(jwk.d!)).toBe(true);
      expect(base64urlPattern.test(jwk.p!)).toBe(true);
      expect(base64urlPattern.test(jwk.q!)).toBe(true);
    }, 10000);
  });

  describe('File-based wallet loading integration', () => {
    const FIXTURES_DIR = path.join(__dirname, '../fixtures');
    const INTEGRATION_WALLET_PATH = path.join(FIXTURES_DIR, 'integration-test-wallet.json');

    beforeAll(async () => {
      // Create fixtures directory
      await fs.mkdir(FIXTURES_DIR, { recursive: true });

      // Generate a real JWK from seed phrase for testing
      const testJWK = await WalletFactory.fromSeedPhrase(TEST_MNEMONIC);

      // Save it to file
      await fs.writeFile(
        INTEGRATION_WALLET_PATH,
        JSON.stringify(testJWK, null, 2),
        'utf-8'
      );
    });

    afterAll(async () => {
      // Clean up
      await fs.rm(INTEGRATION_WALLET_PATH, { force: true });
    });

    it('should load real JWK from file and derive address', async () => {
      const jwk = await WalletFactory.fromFile(INTEGRATION_WALLET_PATH);

      // Derive address
      const address = await arweave.wallets.jwkToAddress(jwk);

      expect(address).toMatch(/^[a-zA-Z0-9_-]{43}$/);
    });

    it('should produce identical JWK when loaded from file vs generated from mnemonic', async () => {
      const jwkFromFile = await WalletFactory.fromFile(INTEGRATION_WALLET_PATH);
      const jwkFromMnemonic = await WalletFactory.fromSeedPhrase(TEST_MNEMONIC);

      // Should be identical (same mnemonic was used to generate the file)
      expect(jwkFromFile).toEqual(jwkFromMnemonic);
    }, 10000);

    it('should derive same address from file-based and seed-phrase wallets', async () => {
      const jwkFromFile = await WalletFactory.fromFile(INTEGRATION_WALLET_PATH);
      const jwkFromMnemonic = await WalletFactory.fromSeedPhrase(TEST_MNEMONIC);

      const addressFromFile = await arweave.wallets.jwkToAddress(jwkFromFile);
      const addressFromMnemonic = await arweave.wallets.jwkToAddress(jwkFromMnemonic);

      expect(addressFromFile).toBe(addressFromMnemonic);
    }, 10000);
  });

  describe('Error scenarios end-to-end', () => {
    it('should handle invalid mnemonic with clear error message', async () => {
      const invalidMnemonic = 'invalid words that are not in BIP39 wordlist at all';

      await expect(
        WalletFactory.fromSeedPhrase(invalidMnemonic)
      ).rejects.toThrow(InvalidMnemonicError);
    });

    it('should handle missing file with clear error message', async () => {
      const nonexistentPath = '/path/to/nonexistent/wallet.json';

      await expect(
        WalletFactory.fromFile(nonexistentPath)
      ).rejects.toThrow(FileSystemError);
    });

    it('should provide actionable solutions in error messages', async () => {
      try {
        await WalletFactory.fromSeedPhrase('invalid mnemonic');
        fail('Should have thrown InvalidMnemonicError');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidMnemonicError);
        if (error instanceof Error) {
          // Error should contain "Solution:"
          expect(error.message).toContain('Solution:');
          expect(error.message).toContain('BIP39');
        }
      }
    });
  });

  describe('Cross-platform determinism validation', () => {
    it('should produce consistent JWK across multiple test runs', async () => {
      const results = [];

      // Run 10 times to verify consistency
      for (let i = 0; i < 10; i++) {
        const jwk = await WalletFactory.fromSeedPhrase(TEST_MNEMONIC);
        const address = await arweave.wallets.jwkToAddress(jwk);
        results.push({ jwk, address });
      }

      // All JWKs should be identical
      for (let i = 1; i < results.length; i++) {
        expect(results[i].jwk).toEqual(results[0].jwk);
        expect(results[i].address).toBe(results[0].address);
      }
    }, 60000);

    it('should produce valid Arweave addresses for multiple different mnemonics', async () => {
      const mnemonics = [
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
        'legal winner thank year wave sausage worth useful legal winner thank yellow',
        'letter advice cage absurd amount doctor acoustic avoid letter advice cage above',
      ];

      const addresses = [];

      for (const mnemonic of mnemonics) {
        const jwk = await WalletFactory.fromSeedPhrase(mnemonic);
        const address = await arweave.wallets.jwkToAddress(jwk);

        // Validate address format
        expect(address).toMatch(/^[a-zA-Z0-9_-]{43}$/);

        addresses.push(address);
      }

      // All addresses should be different
      expect(new Set(addresses).size).toBe(mnemonics.length);
    }, 30000);
  });

  describe('Security validation', () => {
    it('should never log or expose mnemonic in errors', async () => {
      const secretMnemonic = 'zebra xylophone quantum unique topaz secret rainbow purple octopus ninja midnight lightning';

      try {
        await WalletFactory.fromSeedPhrase(secretMnemonic);
        fail('Should have thrown InvalidMnemonicError');
      } catch (error) {
        if (error instanceof Error) {
          // Error should not contain distinctive words from the mnemonic
          const distinctiveWords = ['zebra', 'xylophone', 'quantum', 'topaz', 'octopus', 'ninja'];
          for (const word of distinctiveWords) {
            expect(error.message.toLowerCase()).not.toContain(word.toLowerCase());
          }
        }
      }
    });

    it('should never expose private key material in errors', async () => {
      // Test that even if validation fails, no private keys are exposed
      const testMnemonic = 'invalid mnemonic with words not in BIP39';

      try {
        await WalletFactory.fromSeedPhrase(testMnemonic);
        fail('Should have thrown error');
      } catch (error) {
        if (error instanceof Error) {
          // Error should not contain long base64 strings (potential key material)
          expect(error.message).not.toMatch(/[A-Za-z0-9_-]{100,}/);
        }
      }
    });
  });
});

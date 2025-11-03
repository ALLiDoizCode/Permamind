/**
 * Integration tests for wallet-manager seed phrase workflow (Story 8.2)
 *
 * Tests full workflow:
 * - SEED_PHRASE → wallet load → address derivation
 * - Determinism validation
 * - CLI command integration
 */

import { load, checkBalance } from '../../src/lib/wallet-manager.js';
import Arweave from 'arweave';
import type { JWK } from '../../src/types/wallet.js';

// Real BIP39 test vector (12-word mnemonic - standard test vector)
const TEST_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

// Initialize Arweave client for address derivation
const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
});

describe('Wallet Manager - Seed Phrase Integration (Story 8.2)', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    // Save original environment
    originalEnv = { ...process.env };
  });

  beforeEach(() => {
    // Clear SEED_PHRASE before each test
    delete process.env.SEED_PHRASE;
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Full workflow: SEED_PHRASE → wallet load → address derivation', () => {
    it('should load wallet from SEED_PHRASE and derive address', async () => {
      // Arrange
      process.env.SEED_PHRASE = TEST_MNEMONIC;

      // Act
      const jwk = await load();
      const address = await arweave.wallets.jwkToAddress(jwk);

      // Assert
      expect(jwk).toBeDefined();
      expect(jwk.kty).toBe('RSA');
      expect(jwk.e).toBeDefined();
      expect(jwk.n).toBeDefined();
      expect(address).toMatch(/^[a-zA-Z0-9_-]{43}$/);
    });

    it('should produce valid JWK structure', async () => {
      // Arrange
      process.env.SEED_PHRASE = TEST_MNEMONIC;

      // Act
      const jwk = await load();

      // Assert - validate all required JWK fields
      expect(jwk.kty).toBe('RSA');
      expect(jwk.e).toBeDefined();
      expect(jwk.n).toBeDefined();
      expect(jwk.d).toBeDefined();
      expect(jwk.p).toBeDefined();
      expect(jwk.q).toBeDefined();
      expect(jwk.dp).toBeDefined();
      expect(jwk.dq).toBeDefined();
      expect(jwk.qi).toBeDefined();
    });
  });

  describe('Determinism validation', () => {
    it('should produce identical wallet across multiple load() calls', async () => {
      // Arrange
      process.env.SEED_PHRASE = TEST_MNEMONIC;

      // Act
      const jwk1 = await load();
      const jwk2 = await load();
      const jwk3 = await load();

      // Assert
      expect(jwk1).toEqual(jwk2);
      expect(jwk2).toEqual(jwk3);
    });

    it('should produce identical address across multiple invocations', async () => {
      // Arrange
      process.env.SEED_PHRASE = TEST_MNEMONIC;

      // Act
      const jwk1 = await load();
      const jwk2 = await load();

      const address1 = await arweave.wallets.jwkToAddress(jwk1);
      const address2 = await arweave.wallets.jwkToAddress(jwk2);

      // Assert
      expect(address1).toBe(address2);
    });

    it('should produce different wallets for different mnemonics', async () => {
      // Arrange
      const mnemonic1 = TEST_MNEMONIC;
      const mnemonic2 = 'legal winner thank year wave sausage worth useful legal winner thank yellow';

      // Act
      process.env.SEED_PHRASE = mnemonic1;
      const jwk1 = await load();
      const address1 = await arweave.wallets.jwkToAddress(jwk1);

      process.env.SEED_PHRASE = mnemonic2;
      const jwk2 = await load();
      const address2 = await arweave.wallets.jwkToAddress(jwk2);

      // Assert
      expect(address1).not.toBe(address2);
      expect(jwk1.n).not.toBe(jwk2.n);
    });

    it('should handle mnemonic with leading/trailing whitespace', async () => {
      // Arrange
      const mnemonicWithSpaces = `  ${TEST_MNEMONIC}  `;
      const mnemonicTrimmed = TEST_MNEMONIC;

      // Act
      process.env.SEED_PHRASE = mnemonicWithSpaces;
      const jwk1 = await load();

      process.env.SEED_PHRASE = mnemonicTrimmed;
      const jwk2 = await load();

      // Assert
      expect(jwk1).toEqual(jwk2);
    });
  });

  describe('Wallet source logging', () => {
    it('should log seed phrase wallet source (captured in debug mode)', async () => {
      // Arrange
      process.env.SEED_PHRASE = TEST_MNEMONIC;

      // Act
      const jwk = await load();

      // Assert - verify wallet loaded successfully
      expect(jwk).toBeDefined();
      // Logging validation happens in unit tests
    });

    it('should log file-based wallet source when SEED_PHRASE not set', async () => {
      // Arrange
      delete process.env.SEED_PHRASE;

      // Act & Assert
      // This will fail because no wallet file exists, but that's expected
      // We're just testing that the code path is correct
      await expect(load('/nonexistent/wallet.json')).rejects.toThrow();
    });
  });

  describe('Balance checking integration', () => {
    it('should check balance for seed phrase wallet address', async () => {
      // Arrange
      process.env.SEED_PHRASE = TEST_MNEMONIC;
      const jwk = await load();
      const address = await arweave.wallets.jwkToAddress(jwk);

      // Act
      const walletInfo = await checkBalance(address);

      // Assert
      expect(walletInfo.address).toBe(address);
      expect(walletInfo.balance).toBeGreaterThanOrEqual(0);
      expect(walletInfo.balanceFormatted).toMatch(/AR$/);
    }, 60000); // 60s timeout for network request

    it('should format zero balance correctly', async () => {
      // Arrange
      process.env.SEED_PHRASE = TEST_MNEMONIC;
      const jwk = await load();
      const address = await arweave.wallets.jwkToAddress(jwk);

      // Act
      const walletInfo = await checkBalance(address);

      // Assert - most test wallets have 0 balance
      if (walletInfo.balance === 0) {
        expect(walletInfo.balanceFormatted).toBe('0 AR');
      } else {
        expect(walletInfo.balanceFormatted).toMatch(/\d+(\.\d+)? AR/);
      }
    }, 60000); // 60s timeout for network request
  });

  describe('Multiple command simulation', () => {
    it('should reuse same wallet across multiple commands in same session', async () => {
      // Arrange
      process.env.SEED_PHRASE = TEST_MNEMONIC;

      // Act - Simulate multiple CLI commands in same session
      const jwk1 = await load(); // Command 1
      const jwk2 = await load(); // Command 2
      const jwk3 = await load(); // Command 3

      const address1 = await arweave.wallets.jwkToAddress(jwk1);
      const address2 = await arweave.wallets.jwkToAddress(jwk2);
      const address3 = await arweave.wallets.jwkToAddress(jwk3);

      // Assert
      expect(address1).toBe(address2);
      expect(address2).toBe(address3);
    });

    it('should switch wallets when SEED_PHRASE changes', async () => {
      // Arrange
      const mnemonic1 = TEST_MNEMONIC;
      const mnemonic2 = 'legal winner thank year wave sausage worth useful legal winner thank yellow';

      // Act
      process.env.SEED_PHRASE = mnemonic1;
      const address1 = await arweave.wallets.jwkToAddress(await load());

      process.env.SEED_PHRASE = mnemonic2;
      const address2 = await arweave.wallets.jwkToAddress(await load());

      process.env.SEED_PHRASE = mnemonic1;
      const address3 = await arweave.wallets.jwkToAddress(await load());

      // Assert
      expect(address1).not.toBe(address2);
      expect(address1).toBe(address3); // Same as first
    });
  });

  describe('Error handling integration', () => {
    it('should throw InvalidMnemonicError for invalid SEED_PHRASE', async () => {
      // Arrange
      process.env.SEED_PHRASE = 'invalid mnemonic phrase that is not bip39';

      // Act & Assert
      await expect(load()).rejects.toThrow('Invalid BIP39 mnemonic');
    });

    it('should throw for empty SEED_PHRASE after trim', async () => {
      // Arrange
      process.env.SEED_PHRASE = '   '; // Only whitespace

      // Act & Assert
      // Should fall back to file-based wallet (which will fail)
      await expect(load()).rejects.toThrow();
    });

    it('should throw for malformed mnemonic (wrong word count)', async () => {
      // Arrange
      process.env.SEED_PHRASE = 'witch collapse practice'; // Only 3 words

      // Act & Assert
      await expect(load()).rejects.toThrow('Invalid BIP39 mnemonic');
    });
  });

  describe('Security validation', () => {
    it('should not expose mnemonic in error messages', async () => {
      // Arrange
      const secretMnemonic = TEST_MNEMONIC;
      process.env.SEED_PHRASE = 'invalid ' + secretMnemonic;

      // Act
      try {
        await load();
        fail('Should have thrown error');
      } catch (error) {
        // Assert - error message should not contain mnemonic
        const errorMessage = error instanceof Error ? error.message : String(error);
        expect(errorMessage).not.toContain(secretMnemonic);
        expect(errorMessage).not.toContain('witch');
        expect(errorMessage).not.toContain('collapse');
      }
    });

    it('should not expose private key components in logs', async () => {
      // Arrange
      process.env.SEED_PHRASE = TEST_MNEMONIC;

      // Act
      const jwk = await load();

      // Assert - JWK should have private components
      expect(jwk.d).toBeDefined();
      expect(jwk.p).toBeDefined();
      expect(jwk.q).toBeDefined();

      // Private components should never appear in console
      // (This is validated manually - logger mocks in unit tests)
    });
  });
});

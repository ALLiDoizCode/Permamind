/**
 * Wallet Factory Module
 *
 * Factory class for creating Arweave wallets from multiple sources:
 * - File-based JWK loading (existing wallet-manager.load)
 * - BIP39 seed phrase deterministic generation (new capability)
 *
 * This module provides a unified interface for wallet creation while maintaining
 * backward compatibility with existing file-based wallet loading.
 */

import { validateMnemonic, mnemonicToSeed } from 'bip39-web-crypto';
import Arweave from 'arweave';
import { generateRSAKeyMaterial } from './seed-phrase-wallet.js';
import { loadFromFile } from './wallet-manager.js';
import { InvalidMnemonicError, InvalidSeedError, JWKValidationError } from '../types/errors.js';
import type { JWK } from '../types/wallet.js';

/**
 * Initialize Arweave SDK client for JWK validation
 */
const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
});

/**
 * Validate Arweave JWK by deriving address
 *
 * This function validates that a generated JWK is compatible with the Arweave SDK
 * by attempting to derive a valid Arweave address from it.
 *
 * @param jwk - JWK to validate
 * @throws {JWKValidationError} If JWK cannot derive a valid Arweave address
 *
 * @private
 */
async function validateArweaveJWK(jwk: JWK): Promise<void> {
  try {
    // Derive address to validate JWK structure
    const address = await arweave.wallets.jwkToAddress(jwk);

    // Validate address format (43 characters, base64url)
    if (!/^[a-zA-Z0-9_-]{43}$/.test(address)) {
      throw new JWKValidationError(
        'Generated JWK produced invalid Arweave address format → Solution: Ensure RSA key material is properly formatted with 4096-bit modulus'
      );
    }
  } catch (error) {
    if (error instanceof JWKValidationError) {
      throw error;
    }

    throw new JWKValidationError(
      'Generated JWK failed Arweave SDK validation → Solution: Ensure RSA key material is properly formatted with valid base64url encoding'
    );
  }
}

/**
 * Wallet Factory for creating Arweave wallets from multiple sources
 *
 * Provides two methods for wallet creation:
 * - fromFile: Load JWK from file (backward compatible with wallet-manager)
 * - fromSeedPhrase: Generate JWK from BIP39 mnemonic (deterministic)
 *
 * @example
 * ```typescript
 * // Load from file (existing functionality)
 * const jwk1 = await WalletFactory.fromFile('path/to/wallet.json');
 *
 * // Generate from seed phrase (new capability)
 * const jwk2 = await WalletFactory.fromSeedPhrase('abandon abandon ... about');
 * ```
 */
export class WalletFactory {
  /**
   * Load JWK from file (backward compatible with wallet-manager.load)
   *
   * This method wraps the wallet-manager.loadFromFile() function to provide
   * a unified factory interface. It maintains 100% backward compatibility.
   *
   * @param walletPath - Path to JWK file (absolute or relative)
   * @returns Validated JWK loaded from file
   * @throws {FileSystemError} If wallet file doesn't exist or can't be read
   * @throws {ValidationError} If JSON is malformed or JWK structure is invalid
   *
   * @example
   * ```typescript
   * const jwk = await WalletFactory.fromFile('~/.arweave/wallet.json');
   * console.log('Loaded wallet from file');
   * ```
   */
  static async fromFile(walletPath: string): Promise<JWK> {
    return await loadFromFile(walletPath);
  }

  /**
   * Generate JWK from BIP39 seed phrase (deterministic wallet generation)
   *
   * This method generates a deterministic Arweave wallet from a 12-word BIP39 mnemonic.
   * The same mnemonic will always produce the same JWK, enabling reproducible wallet
   * creation without storing private keys on disk.
   *
   * Process:
   * 1. Validate BIP39 mnemonic format
   * 2. Convert mnemonic to seed buffer (64 bytes)
   * 3. Validate seed buffer is ≥32 bytes
   * 4. Generate deterministic RSA key material
   * 5. Validate JWK with Arweave SDK
   *
   * Security:
   * - Mnemonic and seed are never logged
   * - Private key components never included in error messages
   * - Seed buffer cleared from memory after use (garbage collection)
   *
   * @param mnemonic - 12-word BIP39 mnemonic phrase
   * @returns Validated JWK generated from mnemonic
   * @throws {InvalidMnemonicError} If mnemonic is not valid BIP39
   * @throws {InvalidSeedError} If seed buffer is <32 bytes
   * @throws {JWKValidationError} If generated JWK fails Arweave SDK validation
   *
   * @example
   * ```typescript
   * const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
   * const jwk = await WalletFactory.fromSeedPhrase(mnemonic);
   * const address = await arweave.wallets.jwkToAddress(jwk);
   * console.log('Generated wallet:', address);
   * ```
   */
  static async fromSeedPhrase(mnemonic: string): Promise<JWK> {
    // Step 1: Validate BIP39 mnemonic
    const isValid = await validateMnemonic(mnemonic);
    if (!isValid) {
      throw new InvalidMnemonicError(
        'Invalid BIP39 mnemonic phrase → Solution: Provide a valid 12-word BIP39 mnemonic using standard wordlist'
      );
    }

    // Step 2: Convert mnemonic to seed buffer (64 bytes for 12-word mnemonic)
    const seed = await mnemonicToSeed(mnemonic);

    // Step 3: Validate seed buffer length (security requirement)
    if (seed.length < 32) {
      throw new InvalidSeedError(
        `Seed buffer too short (${seed.length} bytes, minimum 32 bytes required) → Solution: Use a valid 12-word BIP39 mnemonic`
      );
    }

    // Step 4: Generate deterministic RSA key material using human-crypto-keys
    // This properly generates mathematically valid RSA keys from the seed
    const jwk = await generateRSAKeyMaterial(Buffer.from(seed));

    // Step 5: Validate JWK with Arweave SDK
    await validateArweaveJWK(jwk);

    return jwk;
  }
}

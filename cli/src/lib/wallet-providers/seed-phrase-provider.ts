/**
 * Seed Phrase Wallet Provider
 *
 * Implements IWalletProvider for wallets generated from BIP39 mnemonic seed phrases.
 * Wraps WalletFactory.fromSeedPhrase to provide unified wallet provider interface.
 *
 * Features:
 * - Deterministic key generation from 12-word mnemonic
 * - Compatible with @permaweb/aoconnect data item signing
 * - Stateless (no cleanup required on disconnect)
 *
 * Usage:
 * ```typescript
 * const jwk = await WalletFactory.fromSeedPhrase(mnemonic);
 * const provider = new SeedPhraseWalletProvider(jwk, mnemonic);
 * const address = await provider.getAddress();
 * const signer = await provider.createDataItemSigner();
 * ```
 */

import Arweave from 'arweave';
import { createDataItemSigner as createAOSigner } from '@permaweb/aoconnect';
import type { JWK, IWalletProvider, DataItemSigner } from '../../types/wallet.js';
import * as logger from '../../utils/logger.js';

/**
 * Initialize Arweave SDK client for address derivation
 */
const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
});

/**
 * Seed Phrase Wallet Provider
 *
 * Provides wallet operations for seed phrase-based wallets (SEED_PHRASE env var).
 * Implements IWalletProvider interface for transparent integration with MCP tools.
 */
export class SeedPhraseWalletProvider implements IWalletProvider {
  /**
   * Create a new SeedPhraseWalletProvider
   *
   * @param jwk - Arweave JWK keypair generated from mnemonic
   * @param mnemonic - 12-word BIP39 mnemonic seed phrase
   */
  constructor(
    private jwk: JWK,
    private mnemonic: string
  ) {}

  /**
   * Get wallet address
   *
   * Derives the 43-character Arweave address from the JWK public key.
   *
   * @returns 43-character Arweave address (base64url-encoded)
   */
  async getAddress(): Promise<string> {
    const address = await arweave.wallets.jwkToAddress(this.jwk);
    logger.debug(`Seed phrase wallet address: ${address}`);
    return address;
  }

  /**
   * Create data item signer for AO/Arweave operations
   *
   * Returns a signer function compatible with @permaweb/aoconnect that can
   * sign AO messages and Arweave transactions.
   *
   * @returns DataItemSigner function for signing operations
   */
  async createDataItemSigner(): Promise<DataItemSigner> {
    logger.debug('Creating data item signer for seed phrase wallet');
    return createAOSigner(this.jwk) as DataItemSigner;
  }

  /**
   * Clean up resources
   *
   * Seed phrase wallets are stateless, so no cleanup is required.
   * This method is a no-op but implements IWalletProvider interface.
   */
  async disconnect(): Promise<void> {
    logger.debug('Disconnecting seed phrase wallet (no-op: stateless wallet)');
    // No-op: seed phrase wallets are stateless
  }

  /**
   * Get wallet source metadata
   *
   * Returns information about this wallet's source (seed phrase) for
   * logging and debugging purposes.
   *
   * @returns Wallet source configuration with seed phrase mnemonic
   */
  getSource(): { source: 'seedPhrase' | 'browserWallet' | 'file'; value: string } {
    return {
      source: 'seedPhrase',
      value: this.mnemonic,
    };
  }

  /**
   * Get JWK keypair (backward compatibility)
   *
   * Provides direct access to JWK for legacy code that requires it
   * (e.g., Arweave SDK transaction signing, Turbo SDK initialization).
   *
   * @returns JWK keypair
   * @deprecated Prefer using createDataItemSigner() for signing operations
   */
  async getJWK(): Promise<JWK> {
    logger.debug('Exporting JWK from seed phrase wallet (backward compatibility)');
    return this.jwk;
  }
}

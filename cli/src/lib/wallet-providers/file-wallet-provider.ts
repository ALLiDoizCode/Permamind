/**
 * File Wallet Provider
 *
 * Implements IWalletProvider for file-based wallets (JWK files).
 * Wraps WalletFactory.fromFile to provide unified wallet provider interface.
 *
 * Features:
 * - Load wallet from JSON file (--wallet flag or default path)
 * - Compatible with @permaweb/aoconnect data item signing
 * - Stateless (no cleanup required on disconnect)
 *
 * Usage:
 * ```typescript
 * const jwk = await WalletFactory.fromFile(walletPath);
 * const provider = new FileWalletProvider(jwk, walletPath);
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
 * File Wallet Provider
 *
 * Provides wallet operations for file-based wallets (--wallet flag or default path).
 * Implements IWalletProvider interface for transparent integration with MCP tools.
 */
export class FileWalletProvider implements IWalletProvider {
  /**
   * Create a new FileWalletProvider
   *
   * @param jwk - Arweave JWK keypair loaded from file
   * @param filePath - Path to the wallet file
   */
  constructor(
    private jwk: JWK,
    private filePath: string
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
    logger.debug(`File wallet address: ${address}`);
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
    logger.debug('Creating data item signer for file wallet');
    return createAOSigner(this.jwk) as DataItemSigner;
  }

  /**
   * Clean up resources
   *
   * File wallets are stateless, so no cleanup is required.
   * This method is a no-op but implements IWalletProvider interface.
   */
  async disconnect(): Promise<void> {
    logger.debug('Disconnecting file wallet (no-op: stateless wallet)');
    // No-op: file wallets are stateless
  }

  /**
   * Get wallet source metadata
   *
   * Returns information about this wallet's source (file path) for
   * logging and debugging purposes.
   *
   * @returns Wallet source configuration with file path
   */
  getSource(): { source: 'seedPhrase' | 'browserWallet' | 'file'; value: string } {
    return {
      source: 'file',
      value: this.filePath,
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
    logger.debug('Exporting JWK from file wallet (backward compatibility)');
    return this.jwk;
  }
}

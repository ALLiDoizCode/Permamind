/**
 * Browser Wallet Provider
 *
 * Implements IWalletProvider for browser wallet connections (ArConnect, Wander).
 * Wraps NodeArweaveWalletAdapter to provide unified wallet provider interface.
 *
 * Features:
 * - Browser wallet integration via local auth server
 * - Transaction signing through browser extension
 * - Permission-based access (user approval required)
 * - Automatic cleanup on disconnect
 *
 * Usage:
 * ```typescript
 * const adapter = new NodeArweaveWalletAdapter();
 * await adapter.initialize({ port: 0 });
 * await adapter.connect(['ACCESS_ADDRESS', 'SIGN_TRANSACTION', 'DISPATCH']);
 * const address = await adapter.getAddress();
 * const provider = new BrowserWalletProvider(adapter, address);
 * const signer = await provider.createDataItemSigner();
 * ```
 */

import { NodeArweaveWalletAdapter } from '../node-arweave-wallet-adapter.js';
import type { IWalletProvider, DataItemSigner } from '../../types/wallet.js';
import * as logger from '../../utils/logger.js';

/**
 * Browser Wallet Provider
 *
 * Provides wallet operations for browser wallet connections (ArConnect, Wander).
 * Implements IWalletProvider interface for transparent integration with MCP tools.
 */
export class BrowserWalletProvider implements IWalletProvider {
  /**
   * Create a new BrowserWalletProvider
   *
   * @param adapter - Initialized and connected NodeArweaveWalletAdapter instance
   * @param address - Wallet address from adapter.getAddress()
   */
  constructor(
    private adapter: NodeArweaveWalletAdapter,
    private address: string
  ) {}

  /**
   * Get wallet address
   *
   * Returns the wallet address obtained during browser wallet connection.
   *
   * @returns 43-character Arweave address (base64url-encoded)
   */
  async getAddress(): Promise<string> {
    logger.debug(`Browser wallet address: ${this.address}`);
    return this.address;
  }

  /**
   * Create data item signer for AO/Arweave operations
   *
   * Wraps the browser wallet's signDataItem method to match the DataItemSigner
   * interface expected by @permaweb/aoconnect.
   *
   * This properly handles:
   * - Data item signing using browser wallet's signDataItem API
   * - User approval prompts from browser extension
   * - ANS-104 bundle format without requiring JWK
   *
   * Note: Browser wallet signing may prompt user for approval depending on
   * wallet settings.
   *
   * @returns DataItemSigner function for signing operations
   */
  async createDataItemSigner(): Promise<DataItemSigner> {
    logger.debug('Creating data item signer for browser wallet');

    // Get the underlying NodeArweaveWallet instance
    const walletInstance = (this.adapter as any).wallet;

    if (!walletInstance) {
      throw new Error('Browser wallet not initialized. Call adapter.initialize() and adapter.connect() first.');
    }

    // Return a signer function that uses the browser wallet's signDataItem method
    return async (args: {
      data: any;
      tags: { name: string; value: string }[];
      target?: string;
      anchor?: string;
    }) => {
      logger.debug('Signing data item with browser wallet', {
        dataSize: args.data?.length || 0,
        tagCount: args.tags?.length || 0,
        hasTarget: !!args.target,
        hasAnchor: !!args.anchor,
      });

      // Use browser wallet's signDataItem method
      // This handles the signing without needing JWK
      const signedItem = await walletInstance.signDataItem({
        data: args.data,
        tags: args.tags,
        target: args.target,
        anchor: args.anchor,
      });

      // signDataItem returns Uint8Array, but we need { id, raw } format
      // The library's implementation returns the raw signed data item
      // We need to extract the ID from it
      logger.debug('Data item signed successfully by browser wallet');

      return {
        id: '', // ID will be derived from the signed item by aoconnect
        raw: signedItem,
      };
    };
  }

  /**
   * Clean up resources
   *
   * Disconnects the browser wallet adapter and closes the local auth server.
   * This should be called on CLI process exit or when switching wallet sources.
   */
  async disconnect(): Promise<void> {
    logger.debug('Disconnecting browser wallet adapter');
    await this.adapter.disconnect();
  }

  /**
   * Get wallet source metadata
   *
   * Returns information about this wallet's source (browser wallet) and
   * the connected address for logging and debugging purposes.
   *
   * @returns Wallet source configuration with browser wallet address
   */
  getSource(): { source: 'seedPhrase' | 'browserWallet' | 'file'; value: string } {
    return {
      source: 'browserWallet',
      value: this.address,
    };
  }
}

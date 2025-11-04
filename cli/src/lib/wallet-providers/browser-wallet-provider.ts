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

import Arweave from 'arweave';
import { NodeArweaveWalletAdapter } from '../node-arweave-wallet-adapter.js';
import type { IWalletProvider, DataItemSigner } from '../../types/wallet.js';
import * as logger from '../../utils/logger.js';

/**
 * Initialize Arweave SDK client for transaction creation
 */
const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
});

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
   * Returns a signer function that delegates transaction signing to the
   * browser wallet adapter. This wraps the adapter.sign() method to match
   * the DataItemSigner interface expected by @permaweb/aoconnect.
   *
   * Note: Browser wallet signing may prompt user for approval depending on
   * wallet settings.
   *
   * @returns DataItemSigner function for signing operations
   */
  async createDataItemSigner(): Promise<DataItemSigner> {
    logger.debug('Creating data item signer for browser wallet');

    // Return a signer function that delegates to the browser wallet
    return async (args: {
      data: any;
      tags: { name: string; value: string }[];
      target?: string;
      anchor?: string;
    }) => {
      // Create Arweave transaction from data item parameters
      // Pass anchor via transaction attributes to avoid readonly property mutation
      const transaction = await arweave.createTransaction({
        data: args.data,
        target: args.target,
        last_tx: args.anchor || '', // Set anchor via constructor (avoids readonly mutation)
      });

      // Add tags to transaction
      for (const tag of args.tags) {
        transaction.addTag(tag.name, tag.value);
      }

      // Sign transaction using browser wallet adapter
      const signedTx = await this.adapter.sign(transaction);

      // Return in DataItemSigner format
      return {
        id: signedTx.id,
        raw: signedTx,
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

/**
 * Node Arweave Wallet type definitions for browser wallet integration
 *
 * This module defines TypeScript interfaces for integrating browser-based Arweave wallets
 * (ArConnect, Wander) into Node.js applications via the node-arweave-wallet library.
 *
 * The adapter pattern provides a clean interface for:
 * - Random port allocation to prevent conflicts
 * - Permission-based wallet connections
 * - Transaction signing through browser wallets
 * - Graceful connection lifecycle management
 *
 * @see https://github.com/pawanpaudel93/node-arweave-wallet
 */

import { ITag } from './arweave.js';

/**
 * Browser wallet permission types for Arweave operations
 *
 * These permissions align with the arweaveWallet API standard and must be
 * requested during wallet connection. Permissions persist across sessions
 * in most wallet implementations.
 *
 * @see https://docs.arconnect.io/api/permissions
 */
export type Permission =
  | 'ACCESS_ADDRESS' // Read wallet address
  | 'SIGN_TRANSACTION' // Sign Arweave transactions
  | 'DISPATCH' // Submit transactions to network
  | 'ENCRYPT' // Encrypt data with wallet key
  | 'DECRYPT' // Decrypt data with wallet key
  | 'ACCESS_PUBLIC_KEY' // Access wallet public key
  | 'SIGNATURE'; // Sign arbitrary messages

/**
 * Initialization options for NodeArweaveWallet adapter
 *
 * Configures the local authentication server that bridges Node.js and
 * the browser wallet extension.
 */
export interface IInitOptions {
  /**
   * Local server port number
   *
   * - port: 0 (default) - Random port allocation (prevents conflicts)
   * - port: 1-65535 - Specific port (use only if required)
   *
   * Random port allocation is recommended for CLI tools to avoid
   * conflicts with other running services.
   */
  port?: number;

  /**
   * Request timeout in milliseconds
   *
   * Maximum time to wait for wallet connection approval from user.
   * Includes browser launch time, user decision time, and network latency.
   *
   * @default 300000 (5 minutes)
   */
  requestTimeout?: number;
}

/**
 * Signed Arweave transaction structure
 *
 * Represents an Arweave transaction after browser wallet signing.
 * Contains all transaction data plus cryptographic signature fields.
 *
 * This interface captures the essential fields returned by the
 * node-arweave-wallet sign() method.
 */
export interface ISignedTransaction {
  /** Transaction ID (computed from signature) */
  id: string;

  /** Last transaction ID from sender's wallet (for ordering) */
  last_tx: string;

  /** Sender's wallet address (43-character base64url) */
  owner: string;

  /** Transaction tags for metadata and indexing */
  tags: ITag[];

  /** Target wallet address (empty string for data-only transactions) */
  target: string;

  /** Transaction amount in winston (0 for data-only transactions) */
  quantity: string;

  /** Transaction data payload (base64url-encoded) */
  data: string;

  /** Data size in bytes */
  data_size: string;

  /** Data root hash (for Merkle tree verification) */
  data_root: string;

  /** Transaction reward in winston (network fee) */
  reward: string;

  /** Cryptographic signature (RSA-PSS with SHA-256) */
  signature: string;
}

/**
 * NodeArweaveWallet adapter interface
 *
 * Provides a clean, promise-based API for browser wallet integration in Node.js.
 * Wraps the node-arweave-wallet library with proper TypeScript types and
 * error handling patterns.
 *
 * **Lifecycle**:
 * 1. `initialize()` - Start local auth server
 * 2. `connect()` - Request wallet connection (opens browser)
 * 3. `getAddress()` / `sign()` - Perform wallet operations
 * 4. `disconnect()` - Clean up resources
 *
 * **Error Handling**:
 * - WALLET_NOT_CONNECTED - Operation attempted before connect()
 * - PERMISSION_DENIED - User rejected permission request
 * - CONNECTION_TIMEOUT - User didn't approve within requestTimeout
 * - INITIALIZATION_FAILED - Server failed to start
 */
export interface INodeArweaveWalletAdapter {
  /**
   * Initialize the local authentication server
   *
   * Starts an HTTP server on the specified port (or random port if 0)
   * to facilitate browser wallet authentication. Must be called before
   * any other operations.
   *
   * @param options - Server configuration options
   * @throws INITIALIZATION_FAILED - Server startup failed
   *
   * @example
   * ```typescript
   * const adapter = new NodeArweaveWalletAdapter();
   * await adapter.initialize({ port: 0 }); // Random port
   * ```
   */
  initialize(options?: IInitOptions): Promise<void>;

  /**
   * Connect to browser wallet with permissions
   *
   * Opens the user's default browser to the wallet connection page.
   * User must approve the connection and grant requested permissions.
   * This method blocks until user approval or timeout.
   *
   * @param permissions - Requested wallet permissions (default: minimal set)
   * @throws PERMISSION_DENIED - User rejected connection
   * @throws CONNECTION_TIMEOUT - User didn't respond in time
   *
   * @example
   * ```typescript
   * await adapter.connect(['ACCESS_ADDRESS', 'SIGN_TRANSACTION', 'DISPATCH']);
   * ```
   */
  connect(permissions?: Permission[]): Promise<void>;

  /**
   * Get connected wallet address
   *
   * Returns the 43-character Arweave address of the connected wallet.
   * Requires ACCESS_ADDRESS permission.
   *
   * @returns Wallet address (base64url-encoded)
   * @throws WALLET_NOT_CONNECTED - Must call connect() first
   *
   * @example
   * ```typescript
   * const address = await adapter.getAddress();
   * console.log('Connected wallet:', address);
   * ```
   */
  getAddress(): Promise<string>;

  /**
   * Sign transaction with browser wallet
   *
   * Delegates transaction signing to the browser wallet. User may be
   * prompted to approve the signature depending on wallet settings.
   * Requires SIGN_TRANSACTION permission.
   *
   * @param transaction - Unsigned Arweave transaction
   * @returns Signed transaction with signature field populated
   * @throws WALLET_NOT_CONNECTED - Must call connect() first
   * @throws PERMISSION_DENIED - User rejected signature request
   *
   * @example
   * ```typescript
   * const tx = await arweave.createTransaction({ data: 'Hello!' });
   * const signed = await adapter.sign(tx);
   * ```
   */
  sign(transaction: any): Promise<ISignedTransaction>;

  /**
   * Disconnect wallet and close server
   *
   * Closes the local authentication server and clears wallet connection.
   * Safe to call multiple times. No-op if not connected.
   *
   * @example
   * ```typescript
   * await adapter.disconnect();
   * ```
   */
  disconnect(): Promise<void>;

  /**
   * Check wallet connection status
   *
   * Returns true if wallet is currently connected and ready for operations.
   * Does not check if permissions are still valid (user may have revoked).
   *
   * @returns Connection status
   *
   * @example
   * ```typescript
   * if (adapter.isConnected()) {
   *   const address = await adapter.getAddress();
   * }
   * ```
   */
  isConnected(): boolean;
}

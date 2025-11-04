/**
 * NodeArweaveWallet Adapter
 *
 * Provides a clean TypeScript interface for browser wallet integration via the
 * node-arweave-wallet library. Enables CLI tools to leverage browser wallets
 * (ArConnect, Wander) without exposing private keys.
 *
 * Key Features:
 * - Random port allocation (prevents conflicts)
 * - Permission-based wallet access (following arweaveWallet API standards)
 * - Promise-based async API
 * - Comprehensive error handling
 * - Secure logging (no sensitive data exposure)
 *
 * Lifecycle:
 * 1. initialize() - Start local auth server
 * 2. connect() - Request browser wallet connection
 * 3. getAddress() / sign() - Perform wallet operations
 * 4. disconnect() - Clean up resources
 *
 * @example
 * ```typescript
 * const adapter = new NodeArweaveWalletAdapter();
 * await adapter.initialize({ port: 0 }); // Random port
 * await adapter.connect(['ACCESS_ADDRESS', 'SIGN_TRANSACTION']);
 * const address = await adapter.getAddress();
 * await adapter.disconnect();
 * ```
 */

import { NodeArweaveWallet } from 'node-arweave-wallet';
import type {
  IInitOptions,
  Permission,
  ISignedTransaction,
  INodeArweaveWalletAdapter,
} from '../types/node-arweave-wallet.js';
import { AuthorizationError, ConfigurationError, NetworkError } from '../types/errors.js';
import * as logger from '../utils/logger.js';

/**
 * Default permissions for browser wallet connection
 *
 * Minimal set required for most CLI operations:
 * - ACCESS_ADDRESS: Read wallet address
 * - SIGN_TRANSACTION: Sign Arweave transactions
 * - DISPATCH: Submit transactions to network
 */
const DEFAULT_PERMISSIONS: Permission[] = ['ACCESS_ADDRESS', 'SIGN_TRANSACTION', 'DISPATCH'];

/**
 * Default request timeout in milliseconds (5 minutes)
 *
 * Provides ample time for:
 * - Browser launch (~5-10 seconds)
 * - User decision time (varies)
 * - Network latency (~1-2 seconds)
 */
const DEFAULT_REQUEST_TIMEOUT = 300000;

/**
 * NodeArweaveWallet adapter implementation
 *
 * Wraps the node-arweave-wallet library with proper TypeScript types,
 * error handling, and logging.
 */
export class NodeArweaveWalletAdapter implements INodeArweaveWalletAdapter {
  /** NodeArweaveWallet instance (null until initialized) */
  private wallet: NodeArweaveWallet | null = null;

  /** Connection status flag */
  private connected = false;

  /** Connected wallet address (null until connected) */
  private address: string | null = null;

  /** Request timeout in milliseconds */
  private requestTimeout = DEFAULT_REQUEST_TIMEOUT;

  /** Actual server port after initialization (for error messages) */
  private actualPort: number | null = null;

  /**
   * Initialize the local authentication server
   *
   * Creates an HTTP server on the specified port (or random port if 0)
   * to facilitate browser wallet authentication.
   *
   * @param options - Initialization options (port, requestTimeout)
   * @throws ConfigurationError - Server initialization failed
   *
   * @example
   * ```typescript
   * await adapter.initialize({ port: 0, requestTimeout: 300000 });
   * ```
   */
  async initialize(options?: IInitOptions): Promise<void> {
    const port = options?.port ?? 0;
    this.requestTimeout = options?.requestTimeout ?? DEFAULT_REQUEST_TIMEOUT;

    logger.debug('Initializing NodeArweaveWallet', { port, requestTimeout: this.requestTimeout });

    try {
      // Create NodeArweaveWallet instance with specified port and requestTimeout
      this.wallet = new NodeArweaveWallet({ port, requestTimeout: this.requestTimeout });

      // Call the library's initialize method to start the server
      await this.wallet.initialize();

      // Capture the actual port assigned by the server (for error messages)
      // Access the private port property through type assertion
      this.actualPort = (this.wallet as any).port;

      logger.debug('NodeArweaveWallet initialized successfully', { actualPort: this.actualPort });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to initialize NodeArweaveWallet', error as Error);
      throw new ConfigurationError(
        `[ConfigurationError] Failed to initialize browser wallet server. -> Solution: Ensure no other service is using the port, then retry. Error: ${errorMessage}`,
        'node-arweave-wallet'
      );
    }
  }

  /**
   * Connect to browser wallet with permissions
   *
   * Opens the user's default browser to the wallet connection page.
   * Waits for user approval (or timeout). Stores wallet address upon success.
   *
   * @param permissions - Requested permissions (default: minimal set)
   * @throws ConfigurationError - Wallet not initialized
   * @throws AuthorizationError - User denied permissions
   * @throws NetworkError - Connection timeout
   *
   * @example
   * ```typescript
   * await adapter.connect(['ACCESS_ADDRESS', 'SIGN_TRANSACTION']);
   * ```
   */
  async connect(permissions?: Permission[]): Promise<void> {
    if (!this.wallet) {
      throw new ConfigurationError(
        '[ConfigurationError] Wallet not initialized. -> Solution: Call initialize() before connect().',
        'node-arweave-wallet'
      );
    }

    const requestedPermissions = permissions ?? DEFAULT_PERMISSIONS;
    const connectionStartTime = Date.now();

    logger.debug('Requesting wallet connection', {
      permissions: requestedPermissions,
      port: this.actualPort,
      requestTimeout: this.requestTimeout
    });

    try {
      // Connect to wallet (library handles timeout internally via config)
      await this.wallet.connect(requestedPermissions as any);

      // Get and store wallet address
      this.address = await this.wallet.getActiveAddress();
      this.connected = true;

      const elapsedTime = Date.now() - connectionStartTime;
      logger.info(`Connected to wallet: ${this.address} (elapsed: ${elapsedTime}ms)`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const elapsedTime = Date.now() - connectionStartTime;

      logger.error(`Wallet connection failed: ${errorMessage} (port: ${this.actualPort}, timeout: ${this.requestTimeout}ms, elapsed: ${elapsedTime}ms)`, error as Error);

      // Handle timeout errors (check first, most specific)
      if (errorMessage.includes('timeout') || errorMessage.includes('timed out') || errorMessage.toLowerCase().includes('timeout')) {
        const manualUrl = this.actualPort ? `http://localhost:${this.actualPort}` : 'http://localhost:[port]';
        throw new NetworkError(
          `[NetworkError] Browser wallet connection timeout after ${this.requestTimeout}ms. -> Solution: Retry the operation. If browser didn't open, manually visit ${manualUrl} and approve the wallet connection request.`,
          error as Error,
          'browser-wallet',
          'timeout'
        );
      }

      // Handle browser launch failure (check before generic rejection)
      if (errorMessage.toLowerCase().includes('browser') && (errorMessage.toLowerCase().includes('failed') || errorMessage.toLowerCase().includes('open'))) {
        const manualUrl = this.actualPort ? `http://localhost:${this.actualPort}` : 'http://localhost:[port]';
        throw new ConfigurationError(
          `[ConfigurationError] Failed to open browser automatically. -> Solution: Manually open your browser and visit ${manualUrl} to approve the wallet connection.`,
          'browser-launch'
        );
      }

      // Handle permission denial with specific permissions (more specific than generic denial)
      if (errorMessage.toLowerCase().includes('permission')) {
        const missingPermissions = requestedPermissions.join(', ');
        throw new AuthorizationError(
          `[AuthorizationError] Required permissions denied: ${missingPermissions}. -> Solution: Approve all requested permissions (ACCESS_ADDRESS, SIGN_TRANSACTION, DISPATCH) when connecting your wallet.`,
          'unknown',
          0
        );
      }

      // Handle user rejection errors (generic, check after more specific errors)
      if (errorMessage.toLowerCase().includes('reject') || errorMessage.toLowerCase().includes('denied') || errorMessage.toLowerCase().includes('cancelled')) {
        throw new AuthorizationError(
          '[AuthorizationError] Wallet connection rejected by user. -> Solution: Retry the operation and approve the wallet connection when prompted in your browser.',
          'unknown',
          0
        );
      }

      // Handle browser connection lost
      if (errorMessage.toLowerCase().includes('browser connection lost') || errorMessage.toLowerCase().includes('browser page not responding')) {
        const manualUrl = this.actualPort ? `http://localhost:${this.actualPort}` : 'http://localhost:[port]';
        throw new NetworkError(
          `[NetworkError] Browser connection lost. -> Solution: Keep the browser tab open and visit ${manualUrl} to reconnect and approve the wallet connection request.`,
          error as Error,
          'browser-wallet',
          'connection_failure'
        );
      }

      // Generic connection error
      throw new NetworkError(
        `[NetworkError] Browser wallet connection failed. -> Solution: Ensure your browser wallet extension (ArConnect/Wander) is installed and unlocked, then retry. Error: ${errorMessage}`,
        error as Error,
        'browser-wallet',
        'connection_failure'
      );
    }
  }

  /**
   * Get connected wallet address
   *
   * Returns the 43-character Arweave address of the connected wallet.
   *
   * @returns Wallet address (base64url-encoded)
   * @throws AuthorizationError - Wallet not connected
   *
   * @example
   * ```typescript
   * const address = await adapter.getAddress();
   * ```
   */
  async getAddress(): Promise<string> {
    if (!this.connected || !this.address) {
      throw new AuthorizationError(
        '[AuthorizationError] Wallet not connected. -> Solution: Call connect() before getAddress().',
        'unknown',
        0
      );
    }

    return this.address;
  }

  /**
   * Sign transaction with browser wallet
   *
   * Delegates transaction signing to the browser wallet. User may be
   * prompted depending on wallet settings.
   *
   * @param transaction - Unsigned Arweave transaction
   * @returns Signed transaction with signature
   * @throws AuthorizationError - Wallet not connected or user denied
   * @throws NetworkError - Signing failed
   *
   * @example
   * ```typescript
   * const signed = await adapter.sign(transaction);
   * ```
   */
  async sign(transaction: any): Promise<ISignedTransaction> {
    if (!this.connected || !this.wallet) {
      throw new AuthorizationError(
        '[AuthorizationError] Wallet not connected. -> Solution: Call connect() before sign().',
        'unknown',
        0
      );
    }

    const signingStartTime = Date.now();
    logger.debug('Requesting transaction signature from wallet', {
      port: this.actualPort,
      address: this.address
    });

    try {
      const signedTx = await this.wallet.sign(transaction);
      const elapsedTime = Date.now() - signingStartTime;
      logger.debug('Transaction signed successfully', { elapsedTime });
      // The library returns a Transaction object; we convert it to our interface
      // by casting through unknown first to avoid type incompatibility
      return signedTx as unknown as ISignedTransaction;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const elapsedTime = Date.now() - signingStartTime;

      logger.error(`Transaction signing failed: ${errorMessage} (address: ${this.address}, elapsed: ${elapsedTime}ms)`, error as Error);

      // Handle timeout errors
      if (errorMessage.toLowerCase().includes('timeout') || errorMessage.toLowerCase().includes('timed out')) {
        throw new NetworkError(
          `[NetworkError] Transaction signing timeout after ${this.requestTimeout}ms. -> Solution: Retry the operation and approve the transaction promptly in your browser wallet.`,
          error as Error,
          'browser-wallet',
          'timeout'
        );
      }

      // Handle user denial
      if (errorMessage.toLowerCase().includes('denied') || errorMessage.toLowerCase().includes('rejected') || errorMessage.toLowerCase().includes('cancelled')) {
        throw new AuthorizationError(
          '[AuthorizationError] Transaction signature denied by user. -> Solution: Approve the transaction in your browser wallet and retry.',
          this.address ?? 'unknown',
          0
        );
      }

      // Handle browser connection lost
      if (errorMessage.toLowerCase().includes('browser connection lost') || errorMessage.toLowerCase().includes('browser page not responding')) {
        const manualUrl = this.actualPort ? `http://localhost:${this.actualPort}` : 'http://localhost:[port]';
        throw new NetworkError(
          `[NetworkError] Browser connection lost during signing. -> Solution: Keep the browser tab open at ${manualUrl} and retry the transaction.`,
          error as Error,
          'browser-wallet',
          'connection_failure'
        );
      }

      // Generic signing error
      throw new NetworkError(
        `[NetworkError] Transaction signing failed. -> Solution: Ensure your wallet is unlocked and retry. Error: ${errorMessage}`,
        error as Error,
        'browser-wallet',
        'gateway_error'
      );
    }
  }

  /**
   * Disconnect wallet and close server
   *
   * Closes the local authentication server and clears connection state.
   * Safe to call multiple times.
   *
   * @example
   * ```typescript
   * await adapter.disconnect();
   * ```
   */
  async disconnect(): Promise<void> {
    if (!this.wallet) {
      logger.debug('Disconnect called but wallet not initialized');
      return;
    }

    logger.debug('Disconnecting wallet and closing server');

    try {
      // First disconnect the wallet connection
      if (this.connected) {
        await this.wallet.disconnect();
      }

      // Then close the server and clean up resources
      await this.wallet.close('success');

      this.connected = false;
      this.address = null;
      this.wallet = null;
      logger.debug('Wallet disconnected and server closed successfully');
    } catch (error) {
      // Log but don't throw - disconnect should be forgiving
      logger.error('Error during wallet disconnect', error as Error);
      // Still clear state even on error
      this.connected = false;
      this.address = null;
      this.wallet = null;
    }
  }

  /**
   * Check wallet connection status
   *
   * @returns Connection status
   *
   * @example
   * ```typescript
   * if (adapter.isConnected()) {
   *   // Wallet is connected
   * }
   * ```
   */
  isConnected(): boolean {
    return this.connected;
  }
}

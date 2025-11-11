/**
 * Wallet-related type definitions for Arweave transaction management
 *
 * This module defines TypeScript interfaces for JWK (JSON Web Key) wallet operations,
 * wallet loading options, and wallet information structures.
 */

/**
 * JSON Web Key (JWK) interface for Arweave RSA keypairs
 *
 * This interface represents an RSA key pair in JWK format as used by Arweave.
 * The private key fields (d, p, q, dp, dq, qi) are optional for public key operations.
 *
 * @see https://docs.arweave.org/developers/server/http-api#wallet-format
 */
export interface JWK {
  /** Key type - typically "RSA" for Arweave wallets */
  kty: string;
  /** RSA public exponent (base64url-encoded) */
  e: string;
  /** RSA modulus (base64url-encoded) */
  n: string;
  /** RSA private exponent (base64url-encoded) - required for signing */
  d?: string;
  /** RSA prime factor (base64url-encoded) */
  p?: string;
  /** RSA prime factor (base64url-encoded) */
  q?: string;
  /** RSA exponent (base64url-encoded) */
  dp?: string;
  /** RSA exponent (base64url-encoded) */
  dq?: string;
  /** RSA coefficient (base64url-encoded) */
  qi?: string;
}

/**
 * Options for loading a wallet from file or keychain
 */
export interface WalletLoadOptions {
  /** Path to the JWK file (absolute or relative) */
  walletPath?: string;
  /** Prefer loading from system keychain over file (default: true) */
  useKeychain?: boolean;
}

/**
 * Wallet information including address and balance
 *
 * Returned by checkBalance() function to provide comprehensive wallet status
 */
export interface WalletInfo {
  /** 43-character Arweave address (base64url-encoded) */
  address: string;
  /** Wallet balance in winston (1 AR = 1,000,000,000,000 winston) */
  balance: number;
  /** Human-readable balance string (e.g., "5.2 AR", "0.001 AR") */
  balanceFormatted: string;
}

/**
 * Data Item Signer type from @permaweb/aoconnect
 *
 * This type matches the signature expected by AO SDK's createDataItemSigner.
 * Used to sign AO messages and Arweave transactions.
 *
 * @see node_modules/@permaweb/aoconnect/dist/dal.d.ts:347-390
 */
export type DataItemSigner = (args: {
  data: any;
  tags: { name: string; value: string }[];
  target?: string;
  anchor?: string;
}) => Promise<{ id: string; raw: any }>;

/**
 * Wallet Provider Interface
 *
 * Abstracts different wallet authentication methods (seed phrase, browser wallet, file)
 * to provide a unified interface for AO/Arweave operations.
 *
 * All wallet providers implement this interface, enabling transparent switching
 * between authentication methods without changing MCP tool code.
 */
export interface IWalletProvider {
  /**
   * Get wallet address
   * @returns 43-character Arweave address
   */
  getAddress(): Promise<string>;

  /**
   * Create data item signer for AO/Arweave operations
   *
   * Returns a function compatible with @permaweb/aoconnect createDataItemSigner
   * that can sign AO messages and Arweave transactions.
   *
   * @returns DataItemSigner function for signing operations
   */
  createDataItemSigner(): Promise<DataItemSigner>;

  /**
   * Clean up resources (close connections, clear state)
   *
   * Should be called on CLI process exit or unhandled errors to ensure
   * proper cleanup of connections (e.g., browser wallet local server).
   */
  disconnect(): Promise<void>;

  /**
   * Get wallet source metadata
   *
   * Returns information about how this wallet was loaded (seed phrase,
   * browser wallet, or file) for logging and debugging purposes.
   *
   * @returns Wallet source configuration
   */
  getSource(): { source: 'seedPhrase' | 'browserWallet' | 'file'; value: string };

  /**
   * Get JWK keypair (optional - only supported by file and seed phrase providers)
   *
   * Browser wallet providers cannot export JWK for security reasons.
   * This method is only available for backward compatibility with legacy code
   * that requires direct JWK access (e.g., Arweave SDK transaction signing).
   *
   * @returns JWK keypair
   * @throws {Error} If provider does not support JWK export (e.g., browser wallet)
   *
   * @deprecated Prefer using createDataItemSigner() for signing operations
   */
  getJWK?(): Promise<JWK>;
}

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

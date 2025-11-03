/**
 * Turbo SDK type definitions for free bundle uploads
 *
 * This module defines TypeScript interfaces for Turbo SDK configuration,
 * upload results, and client initialization options. Turbo SDK enables
 * free uploads for bundles < 100KB (subsidized by ArDrive/Turbo).
 *
 * @see docs/prd/epic-9.md for full specification
 */

import type { JWK } from './wallet.js';

/**
 * Turbo SDK configuration options
 *
 * Configuration for Turbo SDK integration, including gateway URL
 * and payment method preferences. All fields are optional with
 * sensible defaults for free tier usage.
 *
 * @example
 * const config: ITurboConfig = {
 *   turboGateway: 'https://upload.ardrive.io',
 *   turboUseCredits: false // Use free tier for < 100KB
 * };
 */
export interface ITurboConfig {
  /**
   * Custom Turbo gateway URL
   *
   * Optional override for Turbo SDK gateway. If not provided,
   * Turbo SDK uses its default public gateway.
   *
   * Default: undefined (uses Turbo's public gateway)
   * Example: 'https://upload.ardrive.io'
   */
  turboGateway?: string;

  /**
   * Force credit-based uploads instead of free tier
   *
   * When false (default), bundles < 100KB use free tier (subsidized).
   * When true, forces use of Turbo credits for all uploads regardless of size.
   *
   * Default: false (use free tier for bundles < 100KB)
   */
  turboUseCredits?: boolean;
}

/**
 * Result from Turbo SDK upload operation
 *
 * Contains transaction ID, upload timestamp, and cost information
 * returned by successful Turbo SDK uploads.
 *
 * @example
 * const result: ITurboUploadResult = {
 *   id: 'abc123...xyz789', // 43-character Arweave TXID
 *   timestamp: 1699564800000, // Unix milliseconds
 *   cost: 0 // Free tier (< 100KB)
 * };
 */
export interface ITurboUploadResult {
  /**
   * Arweave transaction ID
   *
   * 43-character base64url-encoded transaction ID for the uploaded bundle.
   * This is the permanent address for retrieving the bundle from Arweave.
   *
   * Format: base64url (43 characters)
   * Example: '9OrG669zzKeKSxMe_VdvxJ4u4m1JLCJXXe7Rd_YxNdw'
   */
  id: string;

  /**
   * Upload timestamp in Unix milliseconds
   *
   * Time when the upload was finalized and transaction submitted to Arweave.
   *
   * Format: Unix milliseconds (number)
   * Example: 1699564800000 (2023-11-10 00:00:00 UTC)
   */
  timestamp: number;

  /**
   * Upload cost in Turbo credits
   *
   * Cost of the upload in Turbo credits (winc). For free tier uploads
   * (bundles < 100KB), this will be 0.
   *
   * Units: winc (Turbo credits)
   * Free tier: 0 for bundles < 100KB
   * Paid tier: varies based on bundle size
   */
  cost: number;
}

/**
 * Options for Turbo SDK client initialization
 *
 * Configuration passed to TurboFactory.authenticated() to create
 * an authenticated Turbo SDK client for bundle uploads.
 *
 * @example
 * const options: ITurboClientOptions = {
 *   wallet: jwkWallet, // Arweave JWK keypair
 *   gatewayUrl: 'https://upload.ardrive.io'
 * };
 */
export interface ITurboClientOptions {
  /**
   * Arweave JWK wallet for signing transactions
   *
   * JSON Web Key (JWK) format RSA keypair used to sign Turbo SDK
   * upload transactions. This must be the same format as standard
   * Arweave wallets (generated via seed phrase or wallet.json).
   *
   * Required fields: kty, e, n, d (private key for signing)
   *
   * @see cli/src/types/wallet.ts for JWK interface definition
   */
  wallet: JWK;

  /**
   * Optional Turbo gateway URL override
   *
   * Custom gateway URL for Turbo SDK uploads. If not provided,
   * Turbo SDK uses its default public gateway.
   *
   * Default: undefined (uses Turbo SDK default)
   * Example: 'https://upload.ardrive.io'
   */
  gatewayUrl?: string;
}

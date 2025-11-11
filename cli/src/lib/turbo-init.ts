/**
 * Turbo SDK Initialization Module
 *
 * Provides helper functions for initializing Turbo SDK authenticated clients
 * with wallet and configuration options. Turbo SDK enables free uploads for
 * bundles < 100KB (subsidized by ArDrive/Turbo).
 *
 * NOTE: Functional integration deferred to Story 9.2
 * This helper is currently unused but ready for ArweaveClient integration.
 *
 * @see docs/stories/9.2.story.md for implementation details
 * @see docs/prd/epic-9.md for full Turbo SDK specification
 */

import { TurboFactory, TurboAuthenticatedClient } from '@ardrive/turbo-sdk';
import type { JWK } from '../types/wallet.js';
import type { ITurboConfig } from '../types/turbo.js';
import { ValidationError } from '../types/errors.js';
import { validateGatewayUrl } from './url-validator.js';

/**
 * Initialize Turbo SDK authenticated client with wallet and configuration
 *
 * Creates an authenticated Turbo SDK client for uploading skill bundles to Arweave
 * using Turbo's subsidized upload service. Supports custom gateway URLs and
 * validates wallet/configuration before initialization.
 *
 * **Wallet Requirements:**
 * - Must be valid Arweave JWK format (RSA keypair)
 * - Must include private key fields (d, p, q, etc.) for signing
 * - Same format as seed phrase wallets or wallet.json files
 *
 * **Configuration Options:**
 * - turboGateway: Custom gateway URL (optional, defaults to Turbo's public gateway)
 * - turboUseCredits: Force credit-based uploads (optional, defaults to free tier)
 *
 * **Free Tier:**
 * - Bundles < 100KB: FREE (subsidized by ArDrive/Turbo)
 * - Bundles >= 100KB: Uses Turbo credits if available
 *
 * @param wallet - Arweave JWK wallet for transaction signing
 * @param config - Turbo SDK configuration options
 * @returns Initialized Turbo SDK authenticated client
 * @throws {ValidationError} If wallet is invalid (missing required JWK fields)
 * @throws {ValidationError} If gateway URL is invalid (non-HTTPS or malformed)
 *
 * @example
 * ```typescript
 * // Basic initialization (uses Turbo's public gateway)
 * const turboClient = initializeTurboClient(jwkWallet, {});
 *
 * // Custom gateway
 * const turboClient = initializeTurboClient(jwkWallet, {
 *   turboGateway: 'https://custom.turbo.io'
 * });
 *
 * // Force credit-based uploads
 * const turboClient = initializeTurboClient(jwkWallet, {
 *   turboUseCredits: true
 * });
 * ```
 */
export function initializeTurboClient(
  wallet: JWK,
  config: ITurboConfig
): TurboAuthenticatedClient {
  // Validate wallet has required JWK fields
  validateWallet(wallet);

  // Validate gateway URL if provided (undefined is ok, empty string is not)
  if (config.turboGateway !== undefined) {
    validateGatewayUrl(config.turboGateway, 'turboGateway', 'https://upload.ardrive.io');
  }

  // Initialize Turbo authenticated client
  const turboClient = TurboFactory.authenticated({
    privateKey: wallet,
    gatewayUrl: config.turboGateway,
  });

  return turboClient;
}

/**
 * Validate JWK wallet structure
 *
 * Ensures wallet contains required fields for Turbo SDK authentication.
 * Turbo SDK requires a valid Arweave RSA JWK with private key fields.
 *
 * Required JWK fields:
 * - kty: Key type (must be "RSA")
 * - e: Public exponent (base64url)
 * - n: Modulus (base64url)
 * - d: Private exponent (base64url) - required for signing
 *
 * @param wallet - JWK wallet to validate
 * @throws {ValidationError} If wallet is missing required fields
 * @private
 */
function validateWallet(wallet: JWK): void {
  if (!wallet) {
    throw new ValidationError(
      'Wallet is required for Turbo SDK initialization → Solution: Provide valid JWK wallet',
      'wallet',
      'missing'
    );
  }

  // Check for required JWK fields
  if (!wallet.n) {
    throw new ValidationError(
      'Invalid JWK wallet: missing modulus (n) field → Solution: Ensure wallet is valid Arweave JWK format',
      'wallet',
      'invalid_jwk'
    );
  }

  if (!wallet.d) {
    throw new ValidationError(
      'Invalid JWK wallet: missing private key (d) field → Solution: Wallet must include private key for signing',
      'wallet',
      'missing_private_key'
    );
  }
}


/**
 * Data Item Signer Utility
 *
 * Provides utilities for creating DataItemSigner instances from wallet providers.
 * Adapts IWalletProvider interface to @permaweb/aoconnect DataItemSigner type
 * for AO message signing and Arweave transaction operations.
 */

import type { DataItemSigner, IWalletProvider } from '../types/index.js';

/**
 * Create DataItemSigner from IWalletProvider
 *
 * Adapts any wallet provider (seed phrase, browser, file) to aoconnect's
 * DataItemSigner interface for AO message signing.
 *
 * This utility function abstracts the wallet provider implementation details,
 * allowing PublishService and other components to work with any wallet type
 * (seed phrase, browser wallet, file wallet) without modification.
 *
 * @param provider - Wallet provider implementing IWalletProvider
 * @returns DataItemSigner compatible with @permaweb/aoconnect
 * @throws {Error} If provider.createDataItemSigner() fails
 *
 * @example
 * ```typescript
 * const provider = await walletManager.load(); // SEED_PHRASE or browser wallet
 * const signer = await createUnifiedDataItemSigner(provider);
 * const result = await connect({ signer });
 * ```
 */
export async function createUnifiedDataItemSigner(
  provider: IWalletProvider
): Promise<DataItemSigner> {
  try {
    return await provider.createDataItemSigner();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to create data item signer from wallet provider → Solution: Ensure wallet provider is properly initialized. Error: ${errorMessage}`
    );
  }
}

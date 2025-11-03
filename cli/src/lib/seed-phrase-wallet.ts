import * as crypto from 'crypto';
import { JWK } from '../types/wallet';
import { getKeyPairFromSeed } from 'human-crypto-keys';

/**
 * Generate RSA key material from seed buffer using proper cryptographic libraries
 *
 * CRITICAL FIX (Epic 9.3 Hotfix): Previous implementation generated invalid RSA keys by
 * creating random base64 values without satisfying RSA mathematical constraints.
 * This caused "no inverse" errors with Turbo SDK during signing operations.
 *
 * New approach (from Permamind-MCP reference):
 * 1. Use human-crypto-keys library to generate proper RSA key pair from seed
 * 2. Generate in PKCS#8 DER format (proper prime generation)
 * 3. Convert PKCS#8 to JWK using SubtleCrypto API
 * 4. Same seed = same JWK (deterministic and mathematically valid)
 *
 * RSA requirements (now properly satisfied):
 * - n = p × q (modulus = product of two primes) ✅
 * - d = e^(-1) mod φ(n) (private exponent) ✅
 * - dp = d mod (p-1) ✅
 * - dq = d mod (q-1) ✅
 * - qi = q^(-1) mod p (modular inverse) ✅
 *
 * Reference: https://github.com/ALLiDoizCode/Permamind-MCP/blob/main/src/mnemonic.ts
 *
 * @param seed Seed buffer (typically from BIP39 mnemonic, 64 bytes)
 * @returns JWK object with mathematically valid RSA components
 *
 * @example
 * ```typescript
 * import { mnemonicToSeedSync } from 'bip39';
 * const seed = mnemonicToSeedSync('abandon abandon ... about');
 * const jwk = await generateRSAKeyMaterial(seed);
 * ```
 */
export async function generateRSAKeyMaterial(seed: Buffer): Promise<JWK> {
  // Step 1: Generate proper RSA key pair from seed using human-crypto-keys
  // This library handles prime generation, modular arithmetic, and all RSA constraints
  const { privateKey } = await getKeyPairFromSeed(
    seed,
    {
      id: 'rsa',
      modulusLength: 4096,
    },
    { privateKeyFormat: 'pkcs8-der' }
  );

  // Step 2: Convert PKCS#8 DER to JWK using SubtleCrypto API
  const jwk = await pkcs8ToJwk(privateKey as Uint8Array);

  return jwk;
}

/**
 * Convert PKCS#8 private key to JWK format
 *
 * Uses SubtleCrypto API to import PKCS#8 and export as JWK.
 * This ensures proper format conversion with all RSA components.
 *
 * @param privateKey - PKCS#8 DER encoded private key
 * @returns JWK with all RSA components (d, dp, dq, e, kty, n, p, q, qi)
 */
async function pkcs8ToJwk(privateKey: Uint8Array): Promise<JWK> {
  const key = await crypto.subtle.importKey(
    'pkcs8',
    privateKey,
    { hash: 'SHA-256', name: 'RSA-PSS' },
    true,
    ['sign']
  );

  const jwk = await crypto.subtle.exportKey('jwk', key);

  return {
    kty: jwk.kty!,
    n: jwk.n!,
    e: jwk.e!,
    d: jwk.d,
    p: jwk.p,
    q: jwk.q,
    dp: jwk.dp,
    dq: jwk.dq,
    qi: jwk.qi,
  };
}

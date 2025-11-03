import * as crypto from 'crypto';

/**
 * Deterministic Pseudo-Random Number Generator (PRNG) interface
 */
export interface DeterministicPRNG {
  /**
   * Generate deterministic random bytes of specified length
   * @param length Number of bytes to generate
   * @returns Buffer containing deterministic random bytes
   */
  getRandomBytes(length: number): Buffer;
}

/**
 * Create a deterministic PRNG from a seed buffer
 *
 * This PRNG uses SHA-256 hashing to generate reproducible random bytes.
 * The same seed will always produce the same sequence of bytes, making it
 * suitable for deterministic key generation.
 *
 * @param seed Seed buffer for deterministic generation (must be at least 32 bytes)
 * @returns DeterministicPRNG interface with getRandomBytes method
 *
 * @example
 * ```typescript
 * const seed = Buffer.from('my-deterministic-seed');
 * const prng = createDeterministicPRNG(seed);
 * const randomBytes = prng.getRandomBytes(64);
 * ```
 */
export function createDeterministicPRNG(seed: Buffer): DeterministicPRNG {
  let counter = 0;

  return {
    getRandomBytes(length: number): Buffer {
      if (length === 0) {
        return Buffer.alloc(0);
      }

      // SHA-256 produces 32 bytes per hash
      const blocks = Math.ceil(length / 32);
      const buffers: Buffer[] = [];

      for (let i = 0; i < blocks; i++) {
        const hasher = crypto.createHash('sha256');
        hasher.update(seed);
        hasher.update(Buffer.from([counter++]));
        buffers.push(hasher.digest());
      }

      const fullHash = Buffer.concat(buffers);
      return fullHash.subarray(0, length);
    },
  };
}

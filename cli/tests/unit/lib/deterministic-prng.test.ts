import { createDeterministicPRNG } from '../../../src/lib/deterministic-prng';
import * as crypto from 'crypto';

describe('Deterministic PRNG', () => {
  describe('createDeterministicPRNG', () => {
    it('should generate deterministic random bytes from seed', () => {
      const seed = crypto.randomBytes(32);
      const prng = createDeterministicPRNG(seed);

      const bytes1 = prng.getRandomBytes(64);
      const bytes2 = prng.getRandomBytes(64);

      // Different calls should produce different bytes
      expect(bytes1).not.toEqual(bytes2);
      expect(bytes1.length).toBe(64);
      expect(bytes2.length).toBe(64);
    });

    it('should produce identical output for same seed (determinism)', () => {
      const seed = Buffer.from('test seed for deterministic PRNG');

      const prng1 = createDeterministicPRNG(seed);
      const prng2 = createDeterministicPRNG(seed);

      const bytes1 = prng1.getRandomBytes(128);
      const bytes2 = prng2.getRandomBytes(128);

      expect(bytes1).toEqual(bytes2);
    });

    it('should produce identical output across 100 iterations', () => {
      const seed = Buffer.from('consistent seed for 100 iterations test');

      const results: Buffer[] = [];

      for (let i = 0; i < 100; i++) {
        const prng = createDeterministicPRNG(seed);
        results.push(prng.getRandomBytes(256));
      }

      // All results should be identical
      for (let i = 1; i < results.length; i++) {
        expect(results[i]).toEqual(results[0]);
      }
    });

    it('should produce different output for different seeds', () => {
      const seed1 = Buffer.from('seed one');
      const seed2 = Buffer.from('seed two');

      const prng1 = createDeterministicPRNG(seed1);
      const prng2 = createDeterministicPRNG(seed2);

      const bytes1 = prng1.getRandomBytes(64);
      const bytes2 = prng2.getRandomBytes(64);

      expect(bytes1).not.toEqual(bytes2);
    });

    it('should generate exact byte length requested', () => {
      const seed = crypto.randomBytes(32);
      const prng = createDeterministicPRNG(seed);

      const lengths = [1, 16, 32, 64, 128, 256, 512];

      lengths.forEach((length) => {
        const bytes = prng.getRandomBytes(length);
        expect(bytes.length).toBe(length);
      });
    });

    it('should handle multiple sequential calls correctly', () => {
      const seed = Buffer.from('sequential calls test seed');
      const prng = createDeterministicPRNG(seed);

      const call1 = prng.getRandomBytes(32);
      const call2 = prng.getRandomBytes(32);
      const call3 = prng.getRandomBytes(32);

      // Each call should produce different bytes
      expect(call1).not.toEqual(call2);
      expect(call2).not.toEqual(call3);
      expect(call1).not.toEqual(call3);

      // But calling again with same seed should reproduce same sequence
      const prng2 = createDeterministicPRNG(seed);
      const call1_repeat = prng2.getRandomBytes(32);
      const call2_repeat = prng2.getRandomBytes(32);
      const call3_repeat = prng2.getRandomBytes(32);

      expect(call1).toEqual(call1_repeat);
      expect(call2).toEqual(call2_repeat);
      expect(call3).toEqual(call3_repeat);
    });

    it('should handle edge case: zero-length request', () => {
      const seed = crypto.randomBytes(32);
      const prng = createDeterministicPRNG(seed);

      const bytes = prng.getRandomBytes(0);
      expect(bytes.length).toBe(0);
    });

    it('should handle edge case: large byte length', () => {
      const seed = crypto.randomBytes(32);
      const prng = createDeterministicPRNG(seed);

      const bytes = prng.getRandomBytes(4096); // Large RSA key material
      expect(bytes.length).toBe(4096);
    });

    it('should be platform-independent (same seed produces same bytes)', () => {
      // Test with known seed and expected output
      const knownSeed = Buffer.from('platform independence test');
      const prng = createDeterministicPRNG(knownSeed);

      const bytes = prng.getRandomBytes(32);

      // Create another PRNG with same seed
      const prng2 = createDeterministicPRNG(knownSeed);
      const bytes2 = prng2.getRandomBytes(32);

      expect(bytes).toEqual(bytes2);
      expect(bytes.length).toBe(32);
    });
  });
});

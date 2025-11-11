import { generateRSAKeyMaterial, generateDeterministicBase64 } from '../../../src/lib/seed-phrase-wallet';
import * as crypto from 'crypto';
import { JWK } from '../../../src/types/wallet';

describe('Seed Phrase Wallet', () => {
  describe('generateDeterministicBase64', () => {
    it('should generate deterministic base64url-encoded string', () => {
      const seedHash = crypto.createHash('sha256').update('test seed').digest();

      const result1 = generateDeterministicBase64(seedHash, 'n', 512);
      const result2 = generateDeterministicBase64(seedHash, 'n', 512);

      expect(result1).toBe(result2);
      expect(typeof result1).toBe('string');
    });

    it('should generate different values for different parameters', () => {
      const seedHash = crypto.createHash('sha256').update('test seed').digest();

      const n = generateDeterministicBase64(seedHash, 'n', 512);
      const d = generateDeterministicBase64(seedHash, 'd', 512);
      const p = generateDeterministicBase64(seedHash, 'p', 256);

      expect(n).not.toBe(d);
      expect(d).not.toBe(p);
      expect(n).not.toBe(p);
    });

    it('should generate correct byte length', () => {
      const seedHash = crypto.createHash('sha256').update('test seed').digest();

      const n512 = generateDeterministicBase64(seedHash, 'n', 512);
      const p256 = generateDeterministicBase64(seedHash, 'p', 256);

      // Decode base64url to verify byte length
      const nBuffer = Buffer.from(n512, 'base64url');
      const pBuffer = Buffer.from(p256, 'base64url');

      expect(nBuffer.length).toBe(512);
      expect(pBuffer.length).toBe(256);
    });

    it('should set first bit (0x80) for valid RSA parameters', () => {
      const seedHash = crypto.createHash('sha256').update('test seed').digest();

      const n = generateDeterministicBase64(seedHash, 'n', 512);
      const buffer = Buffer.from(n, 'base64url');

      // First byte should have bit 0x80 set
      expect(buffer[0] & 0x80).not.toBe(0);
    });

    it('should be deterministic across multiple calls', () => {
      const seedHash = crypto.createHash('sha256').update('consistent seed').digest();

      const results: string[] = [];
      for (let i = 0; i < 10; i++) {
        results.push(generateDeterministicBase64(seedHash, 'n', 512));
      }

      // All results should be identical
      for (let i = 1; i < results.length; i++) {
        expect(results[i]).toBe(results[0]);
      }
    });
  });

  describe('generateRSAKeyMaterial', () => {
    it('should generate valid JWK structure', () => {
      const seed = Buffer.from('test seed for RSA key generation');
      const jwk = generateRSAKeyMaterial(seed);

      expect(jwk.kty).toBe('RSA');
      expect(jwk.n).toBeDefined();
      expect(jwk.e).toBeDefined();
      expect(jwk.d).toBeDefined();
      expect(jwk.p).toBeDefined();
      expect(jwk.q).toBeDefined();
      expect(jwk.dp).toBeDefined();
      expect(jwk.dq).toBeDefined();
      expect(jwk.qi).toBeDefined();
    });

    it('should generate 4096-bit modulus (512 bytes)', () => {
      // Minimum 192 bits (24 bytes) of entropy required by human-crypto-keys
      const seed = Buffer.alloc(32, 'a'); // 256 bits = 32 bytes
      const jwk = generateRSAKeyMaterial(seed);

      const nBuffer = Buffer.from(jwk.n, 'base64url');
      expect(nBuffer.length).toBe(512); // 4096 bits = 512 bytes
    });

    it('should generate standard RSA exponent (65537)', () => {
      // Minimum 192 bits (24 bytes) of entropy required by human-crypto-keys
      const seed = Buffer.alloc(32, 'b'); // 256 bits = 32 bytes
      const jwk = generateRSAKeyMaterial(seed);

      const eBuffer = Buffer.from(jwk.e, 'base64url');
      const eValue = eBuffer.readUIntBE(0, eBuffer.length);

      expect(eValue).toBe(65537);
    });

    it('should generate 512-byte private exponent (d)', () => {
      const seed = Buffer.from('test seed');
      const jwk = generateRSAKeyMaterial(seed);

      const dBuffer = Buffer.from(jwk.d!, 'base64url');
      expect(dBuffer.length).toBe(512);
    });

    it('should generate 256-byte prime factors (p, q)', () => {
      const seed = Buffer.from('test seed');
      const jwk = generateRSAKeyMaterial(seed);

      const pBuffer = Buffer.from(jwk.p!, 'base64url');
      const qBuffer = Buffer.from(jwk.q!, 'base64url');

      expect(pBuffer.length).toBe(256);
      expect(qBuffer.length).toBe(256);
    });

    it('should generate 256-byte exponents (dp, dq, qi)', () => {
      const seed = Buffer.from('test seed');
      const jwk = generateRSAKeyMaterial(seed);

      const dpBuffer = Buffer.from(jwk.dp!, 'base64url');
      const dqBuffer = Buffer.from(jwk.dq!, 'base64url');
      const qiBuffer = Buffer.from(jwk.qi!, 'base64url');

      expect(dpBuffer.length).toBe(256);
      expect(dqBuffer.length).toBe(256);
      expect(qiBuffer.length).toBe(256);
    });

    it('should be deterministic (same seed produces same JWK)', () => {
      const seed = Buffer.from('deterministic seed test');

      const jwk1 = generateRSAKeyMaterial(seed);
      const jwk2 = generateRSAKeyMaterial(seed);

      expect(jwk1).toEqual(jwk2);
    });

    it('should produce identical JWK across 100 iterations', () => {
      const seed = Buffer.from('100 iterations test seed');

      const results: JWK[] = [];
      for (let i = 0; i < 100; i++) {
        results.push(generateRSAKeyMaterial(seed));
      }

      // All results should be identical
      for (let i = 1; i < results.length; i++) {
        expect(results[i]).toEqual(results[0]);
      }
    });

    it('should produce different JWKs for different seeds', () => {
      const seed1 = Buffer.from('seed one');
      const seed2 = Buffer.from('seed two');

      const jwk1 = generateRSAKeyMaterial(seed1);
      const jwk2 = generateRSAKeyMaterial(seed2);

      expect(jwk1).not.toEqual(jwk2);
      expect(jwk1.n).not.toBe(jwk2.n);
      expect(jwk1.d).not.toBe(jwk2.d);
    });

    it('should return all JWK components as base64url-encoded strings', () => {
      const seed = Buffer.from('test seed');
      const jwk = generateRSAKeyMaterial(seed);

      // Check that all components are valid base64url strings
      const base64urlPattern = /^[A-Za-z0-9_-]+$/;

      expect(base64urlPattern.test(jwk.n)).toBe(true);
      expect(base64urlPattern.test(jwk.e)).toBe(true);
      expect(base64urlPattern.test(jwk.d!)).toBe(true);
      expect(base64urlPattern.test(jwk.p!)).toBe(true);
      expect(base64urlPattern.test(jwk.q!)).toBe(true);
      expect(base64urlPattern.test(jwk.dp!)).toBe(true);
      expect(base64urlPattern.test(jwk.dq!)).toBe(true);
      expect(base64urlPattern.test(jwk.qi!)).toBe(true);
    });

    it('should set first bit constraint for RSA parameters', () => {
      const seed = Buffer.from('test seed');
      const jwk = generateRSAKeyMaterial(seed);

      const nBuffer = Buffer.from(jwk.n, 'base64url');
      const dBuffer = Buffer.from(jwk.d!, 'base64url');
      const pBuffer = Buffer.from(jwk.p!, 'base64url');
      const qBuffer = Buffer.from(jwk.q!, 'base64url');

      // All major parameters should have first bit set (0x80)
      expect(nBuffer[0] & 0x80).not.toBe(0);
      expect(dBuffer[0] & 0x80).not.toBe(0);
      expect(pBuffer[0] & 0x80).not.toBe(0);
      expect(qBuffer[0] & 0x80).not.toBe(0);
    });
  });
});

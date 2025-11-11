/**
 * Type definitions for human-crypto-keys library
 * Reference: https://github.com/ALLiDoizCode/Permamind-MCP/blob/main/src/mnemonic.ts
 */

declare module 'human-crypto-keys' {
  export interface KeyPairOptions {
    id: 'rsa' | 'ed25519';
    modulusLength?: number;
  }

  export interface KeyPairFormat {
    privateKeyFormat?: 'pkcs8-der' | 'pkcs8-pem' | 'pkcs1-der' | 'pkcs1-pem';
    publicKeyFormat?: 'spki-der' | 'spki-pem' | 'pkcs1-der' | 'pkcs1-pem';
  }

  export interface KeyPairResult {
    privateKey: Uint8Array | string;
    publicKey: Uint8Array | string;
  }

  export function getKeyPairFromSeed(
    seed: Uint8Array | Buffer,
    options: KeyPairOptions,
    format: KeyPairFormat
  ): Promise<KeyPairResult>;
}

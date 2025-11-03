/**
 * Script to generate a valid test wallet with proper RSA key parameters
 * Run with: npx ts-node cli/tests/fixtures/generate-test-wallet.ts
 */
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { getKeyPairFromSeed } from 'human-crypto-keys';

async function generateTestWallet() {
  // Use a fixed seed for deterministic test wallet generation
  const testSeed = crypto.createHash('sha512')
    .update('permamind-test-wallet-seed-for-ci-testing')
    .digest();

  console.log('Generating test wallet with proper RSA keys...');

  // Generate proper RSA key pair from seed
  const { privateKey } = await getKeyPairFromSeed(
    testSeed,
    {
      id: 'rsa',
      modulusLength: 4096,
    },
    { privateKeyFormat: 'pkcs8-der' }
  );

  // Convert PKCS#8 DER to JWK
  const jwk = await pkcs8ToJwk(privateKey as Uint8Array);

  // Write to test-wallet.json
  const walletPath = path.join(__dirname, 'wallets', 'test-wallet.json');
  fs.writeFileSync(walletPath, JSON.stringify(jwk, null, 2) + '\n');

  console.log('✓ Test wallet generated successfully');
  console.log(`  Location: ${walletPath}`);
  console.log('  RSA modulus length:', jwk.n.length, 'characters');
  console.log('  All RSA parameters present:', ['n', 'e', 'd', 'p', 'q', 'dp', 'dq', 'qi'].every(k => k in jwk));
}

/**
 * Convert PKCS#8 DER to JWK using SubtleCrypto API
 */
async function pkcs8ToJwk(der: Uint8Array): Promise<any> {
  // Import the key
  const key = await crypto.subtle.importKey(
    'pkcs8',
    der,
    {
      name: 'RSA-PSS',
      hash: 'SHA-256',
    },
    true,
    ['sign']
  );

  // Export as JWK
  const jwk = await crypto.subtle.exportKey('jwk', key);

  // Ensure 'kty' is set
  return {
    kty: 'RSA',
    ...jwk,
  };
}

// Run the generator
generateTestWallet()
  .then(() => {
    console.log('\n✓ Done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n✗ Error generating test wallet:', err);
    process.exit(1);
  });

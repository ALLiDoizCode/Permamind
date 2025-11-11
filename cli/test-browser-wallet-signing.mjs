#!/usr/bin/env node
/**
 * Test Browser Wallet Signing Flow
 *
 * Tests the full flow: connect → create signer → sign transaction → send message
 */

import * as walletManager from './dist/lib/wallet-manager.js';

console.log('🧪 Testing Browser Wallet Signing & Message Flow\n');
console.log('=' .repeat(70));

async function testFullSigningFlow() {
  let walletProvider;

  try {
    console.log('\n📋 Step 1: Connect to Browser Wallet');
    console.log('-'.repeat(70));
    console.log('⏳ Waiting for wallet connection (approve in browser)...\n');

    walletProvider = await walletManager.load();

    const source = walletProvider.getSource();
    console.log(`✅ Connected!`);
    console.log(`   Source: ${source.source}`);

    const address = await walletProvider.getAddress();
    console.log(`   Address: ${address}\n`);

    // Step 2: Create Data Item Signer
    console.log('📋 Step 2: Create Data Item Signer');
    console.log('-'.repeat(70));

    const signer = await walletProvider.createDataItemSigner();
    console.log('✅ Data item signer created');
    console.log(`   Type: ${typeof signer}`);
    console.log(`   Is function: ${typeof signer === 'function'}\n`);

    // Step 3: Test Signing
    console.log('📋 Step 3: Test Transaction Signing');
    console.log('-'.repeat(70));
    console.log('⏳ Creating test transaction...\n');

    const testData = JSON.stringify({
      test: 'Browser wallet signing test',
      timestamp: Date.now()
    });

    const testTags = [
      { name: 'Content-Type', value: 'application/json' },
      { name: 'Test-Type', value: 'browser-wallet-signing' }
    ];

    console.log('📝 Test transaction details:');
    console.log(`   Data size: ${testData.length} bytes`);
    console.log(`   Tags: ${testTags.length}`);
    console.log('\n⏳ Requesting signature (you may need to approve in browser)...\n');

    const signedItem = await signer({
      data: testData,
      tags: testTags
    });

    console.log('✅ Transaction signed successfully!');
    console.log(`   Transaction ID: ${signedItem.id}`);
    console.log(`   Has raw tx: ${!!signedItem.raw}`);

    if (signedItem.raw) {
      console.log(`   Raw tx type: ${typeof signedItem.raw}`);
      console.log(`   Raw tx constructor: ${signedItem.raw.constructor?.name || 'unknown'}`);
    }

    // Step 4: Test with aoconnect-like parameters
    console.log('\n📋 Step 4: Test AO Message Signing');
    console.log('-'.repeat(70));

    const aoMessageData = JSON.stringify({
      Action: 'Register-Skill',
      Name: 'test-skill',
      Version: '1.0.0'
    });

    const aoTags = [
      { name: 'Data-Protocol', value: 'ao' },
      { name: 'Type', value: 'Message' },
      { name: 'Action', value: 'Register-Skill' }
    ];

    console.log('📝 AO message details:');
    console.log(`   Action: Register-Skill`);
    console.log(`   Tags: ${aoTags.length}`);
    console.log('\n⏳ Signing AO message...\n');

    const aoSignedItem = await signer({
      data: aoMessageData,
      tags: aoTags
    });

    console.log('✅ AO message signed successfully!');
    console.log(`   Message ID: ${aoSignedItem.id}`);
    console.log(`   Ready for ao.send()\n`);

    // Step 5: Cleanup
    console.log('📋 Step 5: Cleanup');
    console.log('-'.repeat(70));

    if (typeof walletProvider.disconnect === 'function') {
      await walletProvider.disconnect();
      console.log('✅ Wallet disconnected\n');
    }

    console.log('=' .repeat(70));
    console.log('🎉 ALL TESTS PASSED!');
    console.log('=' .repeat(70));
    console.log('\n✅ Browser wallet signing flow is working correctly!');
    console.log('✅ Circular reference fix is working (no JSON errors)');
    console.log('✅ Ready for production use!\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED!');
    console.error('=' .repeat(70));
    console.error(`Error at: ${error.stack?.split('\n')[0] || 'unknown'}`);
    console.error(`\nError type: ${error.constructor.name}`);
    console.error(`Message: ${error.message}`);

    if (error.stack) {
      console.error(`\nStack trace:`);
      console.error(error.stack);
    }

    // Cleanup on error
    if (walletProvider && typeof walletProvider.disconnect === 'function') {
      try {
        await walletProvider.disconnect();
        console.log('\n✅ Cleanup: Wallet disconnected');
      } catch (cleanupError) {
        console.error(`⚠️  Cleanup failed: ${cleanupError.message}`);
      }
    }

    process.exit(1);
  }
}

// Run test
console.log('🚀 Starting browser wallet signing test...');
console.log('📱 Make sure ArConnect is installed and configured\n');

testFullSigningFlow();

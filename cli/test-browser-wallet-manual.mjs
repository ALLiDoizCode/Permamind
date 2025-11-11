#!/usr/bin/env node
/**
 * Manual Browser Wallet Flow Test
 *
 * Tests the actual browser wallet connection to identify issues.
 * Run with: node cli/test-browser-wallet-manual.mjs
 */

import { NodeArweaveWalletAdapter } from './dist/lib/node-arweave-wallet-adapter.js';
import * as walletManager from './dist/lib/wallet-manager.js';

console.log('🧪 Testing Browser Wallet Flow\n');
console.log('=' .repeat(60));

async function testBrowserWalletConnection() {
  console.log('\n📋 Test 1: Direct NodeArweaveWalletAdapter Test');
  console.log('-'.repeat(60));

  let adapter;
  try {
    console.log('1️⃣  Creating adapter...');
    adapter = new NodeArweaveWalletAdapter();

    console.log('2️⃣  Initializing (starting HTTP server)...');
    await adapter.initialize({ port: 0, requestTimeout: 10000 }); // 10 second timeout for testing

    console.log('✅ Server started successfully!');
    console.log(`📍 Server running on port: ${adapter.actualPort || 'unknown'}`);
    console.log(`🌐 Open browser and navigate to connection URL`);

    console.log('\n3️⃣  Attempting connection (this will wait for browser)...');
    console.log('⏰ Timeout: 10 seconds');
    console.log('🚨 This will fail since no browser extension is connected\n');

    await adapter.connect(['ACCESS_ADDRESS', 'SIGN_TRANSACTION', 'DISPATCH']);

    const address = await adapter.getAddress();
    console.log('✅ Connected successfully!');
    console.log(`💼 Wallet address: ${address}`);

    await adapter.disconnect();
    console.log('✅ Disconnected successfully');

  } catch (error) {
    console.log(`\n❌ Expected error (no browser wallet available):`);
    console.log(`   Error type: ${error.constructor.name}`);
    console.log(`   Message: ${error.message}`);

    if (adapter && typeof adapter.disconnect === 'function') {
      try {
        await adapter.disconnect();
        console.log('✅ Cleanup: Adapter disconnected');
      } catch (disconnectError) {
        console.log(`⚠️  Cleanup failed: ${disconnectError.message}`);
      }
    }
  }
}

async function testWalletManagerFlow() {
  console.log('\n\n📋 Test 2: Wallet Manager Flow (with fallback)');
  console.log('-'.repeat(60));

  try {
    console.log('1️⃣  Attempting to load wallet (no SEED_PHRASE set)...');
    console.log('   This should try browser wallet, then fall back to file wallet\n');

    const walletProvider = await walletManager.load();

    console.log('✅ Wallet provider loaded');
    const source = walletProvider.getSource();
    console.log(`📍 Source: ${source.source}`);
    console.log(`💾 Value: ${source.value.substring(0, 50)}${source.value.length > 50 ? '...' : ''}`);

    const address = await walletProvider.getAddress();
    console.log(`💼 Address: ${address}`);

  } catch (error) {
    console.log(`\n❌ Error:`);
    console.log(`   Error type: ${error.constructor.name}`);
    console.log(`   Message: ${error.message}`);
  }
}

async function runAllTests() {
  try {
    await testBrowserWalletConnection();
    await testWalletManagerFlow();

    console.log('\n' + '='.repeat(60));
    console.log('🎉 All tests completed!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests();

---
name: ario
description: Comprehensive technical expertise for building applications on the AR.IO ecosystem - covering ArNS, gateways, data storage/retrieval, token operations, and the Wayfinder protocol. Enables AI agents to provide deterministic, implementation-ready guidance for developers working with AR.IO, ArDrive, Turbo, and Arweave.
author: Permamind Team
tags:
  - arweave
  - ar.io
  - arns
  - permanent-storage
  - decentralized
  - web3
  - gateway
  - blockchain
  - storage
  - typescript
version: 1.0.0
---

# AR.IO Domain Expertise

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Core Concepts](#core-concepts)
3. [Development Environment Setup](#development-environment-setup)
4. [SDK References](#sdk-references)
5. [Gateway APIs](#gateway-apis)
6. [Implementation Guides](#implementation-guides)
7. [Decision Trees](#decision-trees)
8. [Troubleshooting](#troubleshooting)
9. [Appendices](#appendices)

---

## Quick Reference

### Most Common Operations

**Upload Data to Arweave (Fast)**
```typescript
import { TurboFactory, USD } from '@ardrive/turbo-sdk';

const turbo = TurboFactory.authenticated({
  privateKey: yourPrivateKey
});

const result = await turbo.uploadFile({
  fileStreamFactory: () => fs.createReadStream('./file.pdf'),
  fileSizeFactory: () => fs.statSync('./file.pdf').size
});
// Returns: { id: string, dataItemId: string }
```

**Register ArNS Name**
```typescript
import { ARIO, ArweaveSigner, ARIOToken } from '@ar.io/sdk';

const ario = ARIO.mainnet({
  signer: new ArweaveSigner(jwk)
});

await ario.buyRecord({
  name: 'myapp',
  type: 'lease', // or 'permabuy'
  years: 1
});
```

**Retrieve Data from Arweave**
```typescript
// Via gateway REST API
const response = await fetch('https://arweave.net/TX_ID');
const data = await response.text();

// Via ArNS name
const response = await fetch('https://arweave.net/ar://myapp');

// Via Wayfinder SDK
import { WayfinderCore } from '@ar.io/wayfinder-core';
const wayfinder = new WayfinderCore();
const data = await wayfinder.get('ar://myapp');
```

**Create ArDrive and Upload Files**
```typescript
import { arDriveFactory } from 'ardrive-core-js';

const arDrive = arDriveFactory({
  wallet: myWallet,
  turboSettings: {
    turboUploadUrl: new URL('https://upload.ardrive.io')
  }
});

// Create drive
const drive = await arDrive.createPublicDrive({
  driveName: 'My Drive'
});

// Upload file
await arDrive.uploadPublicFile({
  parentFolderId: drive.rootFolderId,
  wrappedFile: wrapFileOrFolder('./file.txt')
});
```

**Query Arweave Data (GraphQL)**
```graphql
query {
  transactions(
    tags: [
      { name: "App-Name", values: ["MyApp"] }
      { name: "Content-Type", values: ["application/json"] }
    ]
    first: 10
  ) {
    edges {
      node {
        id
        tags { name value }
        block { timestamp }
      }
    }
  }
}
```

---

## Core Concepts

### AR.IO Architecture Overview

AR.IO is a permanent cloud network built on Arweave with these core components:

```
┌─────────────────────────────────────────────────────┐
│                 Applications & Users                 │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────▼──────────┐
        │   Wayfinder (ar://) │ ← URI resolution
        └──────────┬──────────┘
                   │
     ┌─────────────▼─────────────┐
     │   AR.IO Gateway Network   │ ← Distributed access layer
     │  (50+ decentralized nodes) │
     └─────────────┬─────────────┘
                   │
        ┌──────────▼──────────┐
        │   ArNS (Naming)     │ ← Human-readable names
        └──────────┬──────────┘
                   │
     ┌─────────────▼─────────────┐
     │   Arweave Blockchain      │ ← Permanent storage
     │   (Permanent Data Layer)   │
     └───────────────────────────┘
```

### Key Mental Models

**1. Data is Permanent and Immutable**
- Once uploaded to Arweave, data CANNOT be modified or deleted
- Every upload creates a new transaction with a unique TX ID
- Plan your data structure carefully before uploading
- Use versioning strategies (undernames) for updates

**2. Everything is a Transaction**
- File uploads = transactions
- ArNS name registrations = transactions
- ANT record updates = transactions
- All operations are asynchronous and require confirmation time

**3. Cost Model: Pay Once, Store Forever**
- One-time payment covers permanent storage
- Costs calculated based on data size
- Turbo provides fast uploads with credit system
- Traditional uploads are cheaper but slower (confirmation takes 10-120 minutes)

**4. Decentralized Access via Gateways**
- Gateways are independent nodes serving Arweave data
- Use multiple gateways for redundancy
- Wayfinder protocol provides automatic failover
- Trust-minimized: cryptographically verify data from any gateway

**5. ArNS: DNS for the Permanent Web**
- Human-readable names (e.g., `myapp.ar`) point to TX IDs
- Managed via ANT (Arweave Name Token) smart contracts
- Support undernames for versioning: `v2.myapp.ar`
- Two ownership models: lease (renewable yearly) or permanent

### Common Gotchas

⚠️ **Floating Point Token Amounts**
- Always use mARIO (1 ARIO = 1,000,000 mARIO)
- SDK provides `ARIOToken` and `mARIOToken` classes
- Never perform arithmetic on floating point token values

⚠️ **Confirmation Delays**
- Traditional Arweave uploads: 10-120 minutes for confirmation
- Turbo uploads: Available in 2-5 minutes (faster but costs more)
- Don't assume immediate availability for non-Turbo uploads

⚠️ **Private Key Management**
- JWK files contain unencrypted private keys
- Never commit JWK files to version control
- Use environment variables or secure vaults
- Consider using ArConnect browser wallet for web apps

⚠️ **ANT Contract State**
- ANT record changes take time to propagate
- Gateway caches may serve stale data (check TTL)
- Use low TTL values during development/testing
- Production: higher TTL reduces gateway load

⚠️ **Browser Polyfills Required**
- Web bundlers need crypto, buffer, and process polyfills
- Vite/Webpack require special configuration
- See environment setup section for details

---

## Development Environment Setup

### Prerequisites

**Node.js Environment**
```bash
# Required: Node.js ≥ 18.0.0
node --version  # Should be 18.0.0 or higher

# TypeScript 5.3+ recommended
npm install -g typescript
```

**Yarn Users**
```yaml
# .yarnrc.yml
nodeLinker: node-modules
ignore-engines: true
```

### Install Core SDKs

**AR.IO SDK**
```bash
npm install @ar.io/sdk
# or
yarn add @ar.io/sdk
```

**Turbo SDK**
```bash
npm install @ardrive/turbo-sdk
```

**ArDrive Core JS**
```bash
npm install ardrive-core-js
```

**Wayfinder SDKs**
```bash
npm install @ar.io/wayfinder-core
npm install @ar.io/wayfinder-react  # For React apps
```

### Wallet Setup

**Generate Arweave Wallet (JWK)**
```typescript
// Using Arweave JS
import Arweave from 'arweave';

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https'
});

const jwk = await arweave.wallets.generate();

// Save securely (DO NOT commit to git)
fs.writeFileSync(
  './wallet.json',
  JSON.stringify(jwk),
  { mode: 0o600 }
);
```

**Load Wallet for SDK Usage**
```typescript
import fs from 'fs';
import { ArweaveSigner } from '@ar.io/sdk';

const jwk = JSON.parse(fs.readFileSync('./wallet.json', 'utf8'));
const signer = new ArweaveSigner(jwk);
```

**Get Wallet Address**
```typescript
import Arweave from 'arweave';

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https'
});

const address = await arweave.wallets.jwkToAddress(jwk);
console.log('Wallet address:', address);
```

### Environment Configuration

**Environment Variables**
```bash
# .env
ARWEAVE_WALLET_PATH=./wallet.json
AR_IO_NETWORK=mainnet  # or testnet, devnet
TURBO_UPLOAD_URL=https://upload.ardrive.io
GATEWAY_URL=https://arweave.net
```

**TypeScript Configuration**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "lib": ["ES2020"]
  }
}
```

### Web Browser Configuration

**Vite Configuration**
```javascript
// vite.config.js
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true
      }
    })
  ]
});
```

**Webpack Configuration**
```javascript
// webpack.config.js
module.exports = {
  resolve: {
    fallback: {
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer/'),
      process: require.resolve('process/browser')
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser'
    })
  ]
};
```

### Network Selection

**Mainnet (Production)**
```typescript
import { ARIO } from '@ar.io/sdk';

const ario = ARIO.mainnet({
  signer: new ArweaveSigner(jwk)
});
// Uses production ARIO token and live gateways
```

**Testnet (Testing with tARIO)**
```typescript
const ario = ARIO.testnet({
  signer: new ArweaveSigner(jwk)
});

// Get test tokens from faucet
const faucet = ario.faucet;
const { captchaUrl } = await faucet.captchaUrl();
// Complete captcha, receive auth token
await faucet.claimWithAuthToken({
  authToken: 'JWT_FROM_CAPTCHA',
  recipient: walletAddress,
  quantity: new ARIOToken(100).toMARIO()
});
```

**Devnet (Development)**
```typescript
const ario = ARIO.devnet({
  signer: new ArweaveSigner(jwk)
});
```

### Verify Installation

```typescript
// test-setup.ts
import { ARIO } from '@ar.io/sdk';
import { TurboFactory } from '@ardrive/turbo-sdk';
import { arDriveFactory } from 'ardrive-core-js';

async function testSetup() {
  // Test AR.IO SDK
  const ario = ARIO.mainnet();
  const info = await ario.getInfo();
  console.log('✓ AR.IO SDK working:', info);

  // Test Turbo SDK
  const turbo = TurboFactory.unauthenticated();
  console.log('✓ Turbo SDK initialized');

  // Test ArDrive
  const arDrive = arDriveFactory({ wallet: jwk });
  console.log('✓ ArDrive SDK working');

  console.log('All SDKs installed correctly!');
}

testSetup();
```

---

## SDK References

### AR.IO SDK (@ar.io/sdk)

**Latest Version:** 3.18.3
**Documentation:** https://docs.ar.io/sdk/
**GitHub:** https://github.com/ar-io/ar-io-sdk

#### Installation & Imports

```typescript
// Node.js ESM
import { ARIO, ANT, ARIOToken, mARIOToken } from '@ar.io/sdk/node';

// Browser/Bundled
import { ARIO, ANT, ArConnectSigner } from '@ar.io/sdk/web';

// CommonJS
const { ARIO } = require('@ar.io/sdk');

// Browser CDN
import { ARIO } from 'https://unpkg.com/@ar.io/sdk@latest';
```

#### ARIO Contract Client

**Initialization**
```typescript
// Read-only client (no signing capability)
const ario = ARIO.mainnet();

// Read-write client (can execute transactions)
const ario = ARIO.mainnet({
  signer: new ArweaveSigner(jwk)
});

// With custom logger
const ario = ARIO.mainnet({
  signer: new ArweaveSigner(jwk),
  logger: customLogger
});
```

**Network Information**
```typescript
// Get process info
const info = await ario.getInfo();
// Returns: { Name, Ticker, Owner, Denomination, ... }

// Get protocol balance
const balance = await ario.getBalance({
  address: 'WALLET_ADDRESS'
});
// Returns balance in mARIO (1 ARIO = 1,000,000 mARIO)

// Get token cost for operation
const cost = await ario.getTokenCost({
  intent: 'Buy-Name',  // or 'Extend-Name', 'Increase-Undername-Limit'
  name: 'myname',
  type: 'lease',  // or 'permabuy'
  years: 1
});
// Returns cost in mARIO
```

**Gateway Operations**
```typescript
// Get single gateway
const gateway = await ario.getGateway({
  address: 'GATEWAY_ADDRESS'
});
/*
Returns: {
  operatorStake: number (mARIO),
  totalDelegatedStake: number,
  settings: {
    label: string,
    fqdn: string,
    port: number,
    protocol: 'https' | 'http',
    properties: string,
    note: string,
    allowDelegatedStaking: boolean,
    delegateRewardShareRatio: number,
    autoStake: boolean,
    minDelegatedStake: number
  },
  start: number (timestamp),
  status: 'joined' | 'leaving',
  stats: {
    passedConsecutiveEpochs: number,
    failedConsecutiveEpochs: number,
    totalEpochCount: number,
    ...
  },
  delegates: Record<address, { delegatedStake, start, vaults }>
}
*/

// List all gateways (paginated)
const page = await ario.getGateways({
  limit: 100,
  cursor: undefined,  // For pagination
  sortBy: 'operatorStake',  // or 'start', 'status'
  sortOrder: 'desc'  // or 'asc'
});
/*
Returns: {
  items: Gateway[],
  hasMore: boolean,
  nextCursor: string | undefined,
  totalItems: number
}
*/

// Join network as gateway operator (requires signer)
await ario.joinNetwork({
  qty: new ARIOToken(10_000).toMARIO(),  // Minimum operator stake
  label: 'My Gateway',
  fqdn: 'gateway.example.com',
  port: 443,
  protocol: 'https',
  properties: 'FH1aVetOoulPGqgziX6Ow',  // TX ID with gateway properties
  note: 'Community gateway',
  allowDelegatedStaking: true,
  delegateRewardShareRatio: 10,  // 10% to delegates
  minDelegatedStake: new ARIOToken(100).toMARIO(),
  autoStake: true
});

// Update gateway settings (requires signer)
await ario.updateGatewaySettings({
  label: 'Updated Label',
  fqdn: 'new-domain.example.com',
  // ... other settings
});

// Leave network (requires signer)
await ario.leaveNetwork();
```

**Delegate Staking**
```typescript
// Increase delegation to gateway (requires signer)
await ario.increaseDelegateStake({
  target: 'GATEWAY_ADDRESS',
  qty: new ARIOToken(500).toMARIO()
});

// Decrease delegation (requires signer)
await ario.decreaseDelegateStake({
  target: 'GATEWAY_ADDRESS',
  qty: new ARIOToken(100).toMARIO()
});
```

**ArNS Name Operations**
```typescript
// Get all ArNS records
const records = await ario.getArNSRecords({
  limit: 100,
  cursor: undefined,
  sortBy: 'name',
  sortOrder: 'asc'
});

// Get single ArNS record
const record = await ario.getArNSRecord({
  name: 'ardrive'
});
/*
Returns: {
  processId: string,  // ANT contract process ID
  type: 'lease' | 'permabuy',
  startTimestamp: number,
  endTimestamp: number (for lease),
  undernameLimit: number,
  purchasePrice: number (mARIO),
  ...
}
*/

// Buy ArNS name (requires signer)
const result = await ario.buyRecord({
  name: 'myapp',
  type: 'lease',  // or 'permabuy'
  years: 1,  // Optional, defaults to 1 for lease
  processId: 'EXISTING_ANT_PROCESS_ID'  // Optional, creates new if omitted
});
// Returns: { id: string, unitPrice: number, quantity: number }

// Extend lease (requires signer, must be record controller)
await ario.extendLease({
  name: 'myapp',
  years: 2
});

// Increase undername limit (requires signer)
await ario.increaseUndernameLimit({
  name: 'myapp',
  qty: 10  // Add 10 more undername slots
});
```

**Primary Names (Web3 Identity)**
```typescript
// Get primary name for address
const primaryName = await ario.getPrimaryName({
  address: 'WALLET_ADDRESS'
});
// Returns: { name: 'myname' } or undefined

// Get all primary names
const allPrimary = await ario.getPrimaryNames({
  limit: 100,
  cursor: undefined
});

// Request primary name assignment (requires signer)
await ario.requestPrimaryName({
  name: 'myname'
});
```

**Vault Operations (Locked Tokens)**
```typescript
// Create vault with locked tokens (requires signer)
await ario.createVault({
  lockLengthMs: 31536000000,  // 1 year in milliseconds
  quantity: new ARIOToken(1000).toMARIO()
});

// Get vaults for address
const vaults = await ario.getVaults({
  address: 'WALLET_ADDRESS'
});
/*
Returns: {
  'vault-id-1': {
    balance: number (mARIO),
    start: number (timestamp),
    end: number (timestamp)
  },
  ...
}
*/

// Extend vault lock period (requires signer)
await ario.extendVault({
  vaultId: 'VAULT_ID',
  extendLengthMs: 15768000000  // Add 6 months
});

// Increase vault balance (requires signer)
await ario.increaseVault({
  vaultId: 'VAULT_ID',
  quantity: new ARIOToken(500).toMARIO()
});

// Vaulted transfer (locked transfer, requires signer)
await ario.vaultedTransfer({
  recipient: 'RECIPIENT_ADDRESS',
  quantity: new ARIOToken(1000).toMARIO(),
  lockLengthMs: 31536000000,
  revokable: true  // Can sender cancel before unlock?
});
```

**Token Transfers**
```typescript
// Simple transfer (requires signer)
await ario.transfer({
  target: 'RECIPIENT_ADDRESS',
  qty: new ARIOToken(10).toMARIO()
});
```

**Epoch & Rewards**
```typescript
// Get current epoch
const epoch = await ario.getCurrentEpoch();
/*
Returns: {
  epochIndex: number,
  startTimestamp: number,
  endTimestamp: number,
  startHeight: number,
  distributionTimestamp: number,
  observations: {...},
  prescribedObservers: {...},
  distributions: {...}
}
*/

// Get specific epoch
const pastEpoch = await ario.getEpoch({
  epochIndex: 42
});

// Get epoch-based observations
const observations = await ario.getObservations({
  epochIndex: 42
});

// Get rewards for epoch
const rewards = await ario.getEligibleEpochRewards({
  epochIndex: 42
});

// Get prescribed observers
const observers = await ario.getPrescribedObservers({
  epochIndex: 42
});

// Get distributions
const distributions = await ario.getDistributions({
  epochIndex: 42
});
```

#### ANT (Arweave Name Token) Contract

**Initialization**
```typescript
// Initialize with existing ANT process
const ant = ANT.init({
  processId: 'ANT_PROCESS_ID',
  signer: new ArweaveSigner(jwk)  // Optional for read-only
});

// Spawn new ANT process (requires signer)
const newAnt = await ANT.spawn({
  signer: new ArweaveSigner(jwk)
});
// Returns new ANT instance with generated processId
```

**State & Information**
```typescript
// Get ANT state
const state = await ant.getState();
/*
Returns: {
  Name: string,
  Ticker: string,
  Owner: string,
  Controllers: string[],
  Records: Record<string, Record>,
  Balances: Record<string, number>,
  ...
}
*/

// Get process info
const info = await ant.getInfo();

// Get owner
const owner = await ant.getOwner();

// Get controllers (addresses with record update permissions)
const controllers = await ant.getControllers();
```

**Record Management**
```typescript
// Get all records
const records = await ant.getRecords();
/*
Returns: {
  '@': {  // Base record
    transactionId: string,
    ttlSeconds: number
  },
  'subdomain': {  // Undername
    transactionId: string,
    ttlSeconds: number
  },
  ...
}
*/

// Get single record
const record = await ant.getRecord({
  undername: '@'  // '@' for base, or subdomain name
});

// Set base name record (requires signer)
await ant.setRecord({
  undername: '@',
  transactionId: 'TX_ID_TO_POINT_TO',
  ttlSeconds: 3600
});

// Set undername record (requires signer)
await ant.setRecord({
  undername: 'app',
  transactionId: 'TX_ID_FOR_APP',
  ttlSeconds: 900
});

// Remove record (requires signer)
await ant.removeRecord({
  undername: 'old-subdomain'
});
```

**Controller Management**
```typescript
// Add controller (requires signer, must be owner)
await ant.setController({
  controller: 'NEW_CONTROLLER_ADDRESS'
});

// Remove controller (requires signer, must be owner)
await ant.removeController({
  controller: 'CONTROLLER_TO_REMOVE'
});
```

**Name & Ticker**
```typescript
// Get name
const name = await ant.getName();

// Set name (requires signer, must be owner)
await ant.setName({
  name: 'My Cool ANT'
});

// Get ticker
const ticker = await ant.getTicker();

// Set ticker (requires signer, must be owner)
await ant.setTicker({
  ticker: 'MYCOOL'
});
```

**Ownership Transfer**
```typescript
// Transfer ownership (requires signer, must be current owner)
await ant.transfer({
  target: 'NEW_OWNER_ADDRESS'
});
```

**Token Balance Operations**
```typescript
// Get balances
const balances = await ant.getBalances();

// Get single balance
const balance = await ant.getBalance({
  address: 'WALLET_ADDRESS'
});
```

#### Token Utility Classes

```typescript
import { ARIOToken, mARIOToken } from '@ar.io/sdk';

// Create token amounts
const arioAmount = new ARIOToken(10);  // 10 ARIO
const marioAmount = new mARIOToken(1_000_000);  // 1,000,000 mARIO = 1 ARIO

// Convert between units
const asARIO = marioAmount.toARIO();  // ARIOToken(1)
const asMARIO = arioAmount.toMARIO();  // mARIOToken(1000000)

// Get raw values
const value = arioAmount.valueOf();  // 10

// Math operations
const sum = new ARIOToken(5).plus(new ARIOToken(3));  // ARIOToken(8)
const diff = new ARIOToken(10).minus(new ARIOToken(3));  // ARIOToken(7)
```

#### Logging Configuration

```typescript
import { Logger } from '@ar.io/sdk';

// Set log level globally
Logger.default.setLogLevel('debug');  // 'debug' | 'info' | 'warn' | 'error' | 'none'

// Custom logger
const customLogger: ILogger = {
  info: (msg, ...args) => console.log(`[INFO] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[WARN] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[ERROR] ${msg}`, ...args),
  debug: (msg, ...args) => console.debug(`[DEBUG] ${msg}`, ...args),
  setLogLevel: (level) => { /* custom implementation */ }
};

const ario = ARIO.mainnet({ logger: customLogger });
```

---

### Turbo SDK (@ardrive/turbo-sdk)

**Latest Version:** Check npm
**Documentation:** https://docs.ar.io/sdks/turbo-sdk
**GitHub:** https://github.com/ardrive/turbo-sdk

#### Installation & Imports

```typescript
import {
  TurboFactory,
  USD,
  ArconnectSigner
} from '@ardrive/turbo-sdk';
```

#### Initialization

```typescript
// Authenticated client (can upload and pay)
const turbo = TurboFactory.authenticated({
  privateKey: jwk
});

// With ArConnect (browser)
const turbo = TurboFactory.authenticated({
  signer: new ArconnectSigner(window.arweaveWallet)
});

// Unauthenticated client (can check prices)
const turbo = TurboFactory.unauthenticated();
```

#### File Upload

**Node.js**
```typescript
import fs from 'fs';

const result = await turbo.uploadFile({
  fileStreamFactory: () => fs.createReadStream('./file.pdf'),
  fileSizeFactory: () => fs.statSync('./file.pdf').size,
  signal: abortController.signal,  // Optional: for cancellation
  dataItemOpts: {
    tags: [
      { name: 'Content-Type', value: 'application/pdf' },
      { name: 'App-Name', value: 'MyApp' }
    ]
  }
});

/*
Returns: {
  id: string,           // Transaction ID
  dataItemId: string,   // Data item ID
  timestamp: number,
  winc: string,         // Cost in Winston Credits
  dataCaches: string[], // Gateway cache URLs
  fastFinalityIndexes: string[]
}
*/
```

**Browser**
```typescript
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

const result = await turbo.uploadFile({
  fileStreamFactory: () => file.stream(),
  fileSizeFactory: () => file.size,
  dataItemOpts: {
    tags: [
      { name: 'Content-Type', value: file.type },
      { name: 'File-Name', value: file.name }
    ]
  }
});
```

**Upload with Progress Tracking**
```typescript
const result = await turbo.uploadFile({
  fileStreamFactory: () => fs.createReadStream('./large-file.mp4'),
  fileSizeFactory: () => fs.statSync('./large-file.mp4').size,
  onProgress: (progress) => {
    console.log(`Uploaded: ${progress.pctComplete}%`);
  }
});
```

#### Folder Upload

```typescript
// Upload entire folder
const results = await turbo.uploadFolder({
  folderPath: './my-app',
  maxConcurrentUploads: 5,
  dataItemOpts: {
    tags: [
      { name: 'App-Name', value: 'MyApp' },
      { name: 'Version', value: '1.0.0' }
    ]
  }
});

/*
Returns array: [
  {
    id: string,
    dataItemId: string,
    path: string,  // Relative path in folder
    ...
  },
  ...
]
*/
```

#### Credit Management

```typescript
// Get balance
const balance = await turbo.getBalance();
// Returns: { winc: string, owner: string }

// Get upload cost
const cost = await turbo.getUploadCost({
  bytes: 1024 * 1024 * 5  // 5 MB
});
// Returns cost in Winston Credits (winc)

// Top up credits (buy more)
const topup = await turbo.topUpWithTokens({
  tokenAmount: USD(10.00),
  feeMultiplier: 1.0  // Optional: adjust for network congestion
});
// Returns: { winc: string, status: string }
```

#### Events

```typescript
// Listen for upload events
turbo.on('upload-started', (event) => {
  console.log('Upload started:', event.id);
});

turbo.on('upload-progress', (event) => {
  console.log(`${event.id}: ${event.pctComplete}%`);
});

turbo.on('upload-complete', (event) => {
  console.log('Upload complete:', event.id);
});

turbo.on('upload-error', (event) => {
  console.error('Upload failed:', event.error);
});
```

#### Credit Sharing (Pooled Credits)

```typescript
// Share credits with another address
await turbo.shareCredits({
  recipientAddress: 'RECIPIENT_ADDRESS',
  amount: '1000000'  // winc amount
});

// Get shared credits
const shared = await turbo.getSharedCredits();
/*
Returns: {
  sharedWith: [
    { address: string, amount: string },
    ...
  ]
}
*/
```

---

### ArDrive Core JS SDK (ardrive-core-js)

**Documentation:** https://docs.ar.io/sdks/ardrive-core-js
**GitHub:** https://github.com/ardriveapp/ardrive-core-js

#### Installation & Imports

```typescript
import {
  arDriveFactory,
  arDriveAnonymousFactory,
  wrapFileOrFolder,
  EID,
  DriveID,
  FolderID,
  FileID
} from 'ardrive-core-js';
```

#### Initialization

```typescript
// Authenticated with wallet
const arDrive = arDriveFactory({
  wallet: jwk,
  turboSettings: {
    turboUploadUrl: new URL('https://upload.ardrive.io')
  }
});

// Anonymous (read-only)
const anonArDrive = arDriveAnonymousFactory({});
```

#### Drive Operations

**Creating Drives**
```typescript
// Create public drive
const publicDrive = await arDrive.createPublicDrive({
  driveName: 'My Public Drive'
});
/*
Returns: {
  driveId: DriveID,
  rootFolderId: FolderID,
  metadataTxId: string,
  ...
}
*/

// Create private (encrypted) drive
const privateDrive = await arDrive.createPrivateDrive({
  driveName: 'My Private Drive',
  drivePassword: 'secure-password-123'
});
```

**Reading Drive Data**
```typescript
// Get public drive
const drive = await arDrive.getPublicDrive({
  driveId: new DriveID('drive-uuid')
});

// Get private drive (requires drive key)
const driveKey = await deriveDriveKey(
  'password',
  driveId,
  jwk
);
const privateDrive = await arDrive.getPrivateDrive({
  driveId,
  driveKey
});

// List all drives for address
const drives = await arDrive.getAllDrivesForAddress({
  address: 'WALLET_ADDRESS',
  privateKeyData: jwk
});
```

**Renaming Drives**
```typescript
// Rename public drive
await arDrive.renamePublicDrive({
  driveId: new DriveID('drive-uuid'),
  newName: 'Updated Drive Name'
});

// Rename private drive
await arDrive.renamePrivateDrive({
  driveId: new DriveID('drive-uuid'),
  driveKey: driveKey,
  newName: 'Updated Private Drive'
});
```

#### Folder Operations

**Creating Folders**
```typescript
// Create public folder
const folder = await arDrive.createPublicFolder({
  folderName: 'Documents',
  driveId: new DriveID('drive-uuid'),
  parentFolderId: new FolderID('root-folder-uuid')
});

// Create private folder
const privateFolder = await arDrive.createPrivateFolder({
  folderName: 'Secret Documents',
  driveId: new DriveID('drive-uuid'),
  driveKey: driveKey,
  parentFolderId: new FolderID('parent-uuid')
});
```

**Listing Folder Contents**
```typescript
// List public folder
const contents = await arDrive.listPublicFolder({
  folderId: new FolderID('folder-uuid'),
  maxDepth: 3,  // How deep to recurse
  includeRoot: true
});
/*
Returns hierarchy: {
  files: FileMetadata[],
  folders: FolderMetadata[],
  ...
}
*/

// List private folder
const privateContents = await arDrive.listPrivateFolder({
  folderId: new FolderID('folder-uuid'),
  driveKey: driveKey,
  maxDepth: 2
});
```

**Moving Folders**
```typescript
await arDrive.movePublicFolder({
  folderId: new FolderID('folder-uuid'),
  newParentFolderId: new FolderID('new-parent-uuid')
});
```

**Renaming Folders**
```typescript
await arDrive.renamePublicFolder({
  folderId: new FolderID('folder-uuid'),
  newName: 'Renamed Folder'
});
```

#### File Operations

**Uploading Files**
```typescript
// Wrap file for upload
const wrappedFile = wrapFileOrFolder('./document.pdf', 'application/pdf');

// Upload public file
const result = await arDrive.uploadPublicFile({
  parentFolderId: new FolderID('parent-uuid'),
  wrappedFile: wrappedFile,
  conflictResolution: 'upsert'  // or 'skip', 'replace', 'rename'
});
/*
Returns: {
  created: [{
    type: 'file',
    metadataTxId: string,
    dataTxId: string,
    entityId: FileID,
    ...
  }],
  fees: { [txId]: Winston }
}
*/

// Upload private file
await arDrive.uploadPrivateFile({
  parentFolderId: new FolderID('parent-uuid'),
  driveKey: driveKey,
  wrappedFile: wrappedFile,
  conflictResolution: 'upsert'
});
```

**Uploading with Custom Metadata**
```typescript
const wrappedFile = wrapFileOrFolder(
  './file.txt',
  'text/plain',
  {
    metaDataJson: {
      'Custom-Field': 'value',
      'Author': 'John Doe'
    },
    metaDataGqlTags: {
      'App-Name': ['MyApp'],
      'Version': ['1.0.0']
    },
    dataGqlTags: {
      'Content-Type': ['text/plain'],
      'Category': ['documentation']
    }
  }
);

await arDrive.uploadPublicFile({
  parentFolderId: folderIdconflictResolution: 'upsert',
  wrappedFile: wrappedFile
});
```

**Reading File Data**
```typescript
// Get public file metadata
const file = await arDrive.getPublicFile({
  fileId: new FileID('file-uuid')
});

// Get private file metadata
const privateFile = await arDrive.getPrivateFile({
  fileId: new FileID('file-uuid'),
  driveKey: driveKey
});
```

**Moving Files**
```typescript
await arDrive.movePublicFile({
  fileId: new FileID('file-uuid'),
  newParentFolderId: new FolderID('new-parent-uuid')
});
```

**Renaming Files**
```typescript
await arDrive.renamePublicFile({
  fileId: new FileID('file-uuid'),
  newName: 'renamed-file.pdf'
});
```

**Downloading Files**
```typescript
// Download public file (returns Buffer/Uint8Array)
const fileData = await arDrive.downloadPublicFile({
  fileId: new FileID('file-uuid')
});
fs.writeFileSync('./downloaded.pdf', fileData);

// Download private file (automatically decrypts)
const privateData = await arDrive.downloadPrivateFile({
  fileId: new FileID('file-uuid'),
  driveKey: driveKey
});
```

**Downloading Folders**
```typescript
// Download public folder to local path
await arDrive.downloadPublicFolder({
  folderId: new FolderID('folder-uuid'),
  destFolderPath: './downloads'
});

// Download private folder
await arDrive.downloadPrivateFolder({
  folderId: new FolderID('folder-uuid'),
  driveKey: driveKey,
  destFolderPath: './downloads/private'
});
```

#### Bulk Operations

**Upload Multiple Files**
```typescript
const entitiesToUpload = [
  {
    wrappedEntity: wrapFileOrFolder('./file1.txt'),
    destFolderId: new FolderID('folder-uuid')
  },
  {
    wrappedEntity: wrapFileOrFolder('./file2.pdf'),
    destFolderId: new FolderID('folder-uuid')
  },
  {
    wrappedEntity: wrapFileOrFolder('./secret.txt'),
    destFolderId: new FolderID('private-folder-uuid'),
    driveKey: driveKey  // For private files
  }
];

const result = await arDrive.uploadAllEntities({
  entitiesToUpload: entitiesToUpload,
  conflictResolution: 'upsert'
});
/*
Returns: {
  created: EntityMetadata[],
  fees: { [txId]: Winston },
  tips: { [txId]: Winston }
}
*/
```

**Upload Folder with Contents**
```typescript
await arDrive.createPublicFolderAndUploadChildren({
  parentFolderId: new FolderID('parent-uuid'),
  wrappedFolder: wrapFileOrFolder('./local-folder'),
  conflictResolution: 'skip'
});
```

#### Conflict Resolution Strategies

```typescript
/*
Available strategies:
- 'skip': Ignore if file exists
- 'replace': Overwrite existing file
- 'upsert': Update only if content differs (default)
- 'rename': Append suffix to conflicting files
- 'error': Throw exception on conflict
- 'ask': Interactive prompt (CLI only)
*/

await arDrive.uploadPublicFile({
  parentFolderId: folderIdwrappedFile: wrappedFile,
  conflictResolution: 'rename'  // Will create file-1.txt, file-2.txt, etc.
});
```

#### Encryption & Security

**Derive Keys**
```typescript
import { deriveDriveKey, deriveFileKey } from 'ardrive-core-js';

// Derive drive key from password
const driveKey = await deriveDriveKey(
  'my-password',
  new DriveID('drive-uuid'),
  jwk
);

// Derive file key from drive key
const fileKey = deriveFileKey(
  driveKey,
  new FileID('file-uuid')
);
```

**Manual Encryption/Decryption**
```typescript
import { driveEncrypt, driveDecrypt } from 'ardrive-core-js';

// Encrypt data
const plaintext = Buffer.from('sensitive data');
const { cipher, cipherIV } = driveEncrypt(driveKey, plaintext);

// Decrypt data
const decrypted = driveDecrypt(cipherIV, driveKey, cipher);
```

#### Manifest Creation

```typescript
// Create manifest for web hosting
const manifest = await arDrive.uploadPublicManifest({
  folderId: new FolderID('folder-uuid'),
  destManifestName: 'app-manifest',
  conflictResolution: 'replace'
});
/*
Manifest structure:
{
  "manifest": "arweave/paths",
  "version": "0.1.0",
  "index": { "path": "index.html" },
  "paths": {
    "index.html": { "id": "tx-id-1" },
    "style.css": { "id": "tx-id-2" },
    ...
  }
}
*/
```

#### Pricing & Cost Estimation

```typescript
const priceEstimator = arDrive.getArDataPriceEstimator();

// Cost for byte count
import { ByteCount } from 'ardrive-core-js';
const cost = await priceEstimator.getARPriceForByteCount(
  new ByteCount(1024 * 1024 * 10)  // 10 MB
);
// Returns AR amount (including community tip)

// Base price without tips
const basePrice = await priceEstimator.getBaseWinstonPriceForByteCount(
  new ByteCount(5 * 1024 * 1024)
);
// Returns Winston amount
```

#### Entity ID Types

```typescript
// Type-safe entity IDs
import { EID, DriveID, FolderID, FileID } from 'ardrive-core-js';

// Generic
const entityId = EID('uuid-string');

// Specific types (runtime validation)
const driveId = new DriveID('drive-uuid');
const folderId = new FolderID('folder-uuid');
const fileId = new FileID('file-uuid');

// Use in API calls for type safety
await arDrive.getPublicDrive({ driveId });
```

---

### Wayfinder SDKs

#### Wayfinder Core (@ar.io/wayfinder-core)

**Documentation:** https://docs.ar.io/sdks/wayfinder-core

**Installation**
```bash
npm install @ar.io/wayfinder-core
```

**Initialization**
```typescript
import { WayfinderCore } from '@ar.io/wayfinder-core';

const wayfinder = new WayfinderCore({
  gatewayProviders: [
    { url: 'https://arweave.net', weight: 1.0, timeout: 10000 },
    { url: 'https://ar-io.dev', weight: 0.8, timeout: 8000 }
  ],
  routingStrategy: 'performance',  // 'random', 'weighted', 'performance'
  verificationStrategy: 'hash',    // 'hash', 'manifest', 'signature'
  strictVerification: true,
  x402Enabled: false
});
```

**ar:// URI Resolution**
```typescript
// Resolve transaction ID
const data = await wayfinder.get('ar://qI19W6spw-kzOGl4qUMNp2gwFH2EBfDXOFsjkcNyK9A');

// Resolve ArNS name
const appData = await wayfinder.get('ar://ardrive');

// Resolve path within manifest
const file = await wayfinder.get('ar://tx-id/path/to/file.jpg');

// Get as specific type
const json = await wayfinder.getJSON('ar://myapp/config.json');
const blob = await wayfinder.getBlob('ar://myapp/image.png');
```

**Gateway Configuration**
```typescript
// Add gateway provider
wayfinder.addGatewayProvider({
  url: 'https://new-gateway.ar.io',
  weight: 0.9,
  timeout: 12000
});

// Remove gateway provider
wayfinder.removeGatewayProvider('https://old-gateway.ar.io');

// Get current providers
const providers = wayfinder.getGatewayProviders();
```

**Events & Monitoring**
```typescript
wayfinder.on('request-start', (event) => {
  console.log(`Requesting from ${event.gateway}`);
});

wayfinder.on('request-success', (event) => {
  console.log(`Success in ${event.duration}ms from ${event.gateway}`);
});

wayfinder.on('request-error', (event) => {
  console.error(`Failed from ${event.gateway}: ${event.error}`);
});

wayfinder.on('gateway-failover', (event) => {
  console.warn(`Failing over from ${event.from} to ${event.to}`);
});

wayfinder.on('telemetry', (metrics) => {
  console.log(`Success rate: ${metrics.successRate}%`);
  console.log(`Avg latency: ${metrics.avgLatency}ms`);
});
```

**x402 Payment Protocol**
```typescript
const wayfinder = new WayfinderCore({
  x402Enabled: true,
  paymentHandler: async (challenge) => {
    // Handle payment negotiation
    const payment = await processPayment(challenge);
    return payment.credentials;
  }
});
```

#### Wayfinder React (@ar.io/wayfinder-react)

**Documentation:** https://docs.ar.io/sdks/wayfinder-react

**Installation**
```bash
npm install @ar.io/wayfinder-react
```

**WayfinderProvider Setup**
```typescript
import { WayfinderProvider } from '@ar.io/wayfinder-react';

function App() {
  return (
    <WayfinderProvider
      config={{
        gatewayProviders: [
          { url: 'https://arweave.net' },
          { url: 'https://ar-io.dev' }
        ],
        routingStrategy: 'performance'
      }}
    >
      <YourApp />
    </WayfinderProvider>
  );
}
```

**useWayfinderUrl Hook**
```typescript
import { useWayfinderUrl } from '@ar.io/wayfinder-react';

function ImageComponent({ txId }) {
  const { url, isLoading, error } = useWayfinderUrl(txId);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <img src={url} alt="Arweave content" />;
}
```

**useWayfinderRequest Hook**
```typescript
import { useWayfinderRequest } from '@ar.io/wayfinder-react';

function DataFetcher({ arnsName }) {
  const {
    data,
    isLoading,
    error,
    refetch
  } = useWayfinderRequest(`ar://${arnsName}`);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

**useWayfinderJSON Hook**
```typescript
import { useWayfinderJSON } from '@ar.io/wayfinder-react';

function ConfigDisplay() {
  const { data: config, isLoading } = useWayfinderJSON<AppConfig>(
    'ar://myapp/config.json'
  );

  if (isLoading) return <div>Loading config...</div>;

  return <div>API URL: {config.apiUrl}</div>;
}
```

---

## Gateway APIs

### AR.IO Gateway REST API

AR.IO gateways provide REST endpoints for accessing Arweave data.

#### Base Endpoints

**Standard Gateway URL Structure**
```
https://[gateway-domain]/[transaction-id]
https://[gateway-domain]/[arns-name]
https://[gateway-domain]/[tx-id]/[path-in-manifest]
```

#### Data Retrieval

**Get Transaction Data**
```bash
# Get raw transaction data
curl https://arweave.net/qI19W6spw-kzOGl4qUMNp2gwFH2EBfDXOFsjkcNyK9A

# Get with specific content type
curl -H "Accept: application/json" \
  https://arweave.net/transaction-id
```

**Get Transaction Metadata**
```bash
# Get transaction headers
curl -I https://arweave.net/transaction-id

# Returns headers:
# Content-Type: [from transaction tags]
# Content-Length: [data size]
# X-Arweave-TX-ID: [transaction id]
# X-Cache: [HIT or MISS]
```

**ArNS Resolution**
```bash
# Resolve ArNS name
curl https://arweave.net/ar://ardrive

# Resolve undername
curl https://arweave.net/ar://app.ardrive
```

**Manifest Path Resolution**
```bash
# Access file within manifest
curl https://arweave.net/manifest-tx-id/index.html
curl https://arweave.net/manifest-tx-id/assets/style.css
```

#### GraphQL Query Interface

**Endpoint**
```
POST https://arweave.net/graphql
```

**Basic Transaction Query**
```graphql
query GetTransactions {
  transactions(
    first: 10,
    tags: [
      { name: "App-Name", values: ["MyApp"] }
    ]
  ) {
    edges {
      node {
        id
        owner {
          address
        }
        tags {
          name
          value
        }
        block {
          height
          timestamp
        }
        data {
          size
        }
      }
    }
    pageInfo {
      hasNextPage
    }
  }
}
```

**Query with Multiple Tag Filters**
```graphql
query FilteredTransactions {
  transactions(
    first: 50,
    tags: [
      { name: "Content-Type", values: ["application/json", "text/plain"] },
      { name: "App-Name", values: ["MyApp"] },
      { name: "Version", values: ["1.0.0"] }
    ],
    owners: ["WALLET_ADDRESS"],
    block: { min: 1000000 }
  ) {
    edges {
      node {
        id
        tags {
          name
          value
        }
        block {
          timestamp
        }
      }
    }
  }
}
```

**Pagination Pattern**
```graphql
query PaginatedQuery($cursor: String) {
  transactions(
    first: 100,
    after: $cursor,
    tags: [
      { name: "App-Name", values: ["MyApp"] }
    ]
  ) {
    edges {
      cursor
      node {
        id
      }
    }
    pageInfo {
      hasNextPage
    }
  }
}
```

**TypeScript Usage**
```typescript
async function queryArweave(cursor?: string) {
  const query = `
    query($cursor: String) {
      transactions(
        first: 100,
        after: $cursor,
        tags: [
          { name: "App-Name", values: ["MyApp"] }
        ]
      ) {
        edges {
          cursor
          node {
            id
            tags { name value }
          }
        }
        pageInfo {
          hasNextPage
        }
      }
    }
  `;

  const response = await fetch('https://arweave.net/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      variables: { cursor }
    })
  });

  const { data } = await response.json();
  return data.transactions;
}

// Usage with pagination
let results = [];
let cursor = undefined;
let hasMore = true;

while (hasMore) {
  const page = await queryArweave(cursor);
  results.push(...page.edges.map(e => e.node));

  hasMore = page.pageInfo.hasNextPage;
  cursor = page.edges[page.edges.length - 1]?.cursor;
}
```

#### Gateway Health & Status

**Health Check**
```bash
curl https://arweave.net/health
# Returns: { status: "ok", uptime: 123456, ... }
```

**Gateway Info**
```bash
curl https://arweave.net/info
# Returns gateway configuration and network status
```

#### Common Response Headers

```
X-Arweave-TX-ID: [transaction identifier]
X-Arweave-Block-Height: [block number]
X-Cache: [HIT|MISS] - whether served from cache
Content-Type: [from transaction tags]
Cache-Control: [caching directives]
Access-Control-Allow-Origin: * [CORS enabled]
```

### Arweave Transaction Submission API

**Submit Transaction**
```typescript
import Arweave from 'arweave';

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https'
});

// Create transaction
const transaction = await arweave.createTransaction({
  data: 'Hello, Arweave!'
}, jwk);

// Add tags
transaction.addTag('Content-Type', 'text/plain');
transaction.addTag('App-Name', 'MyApp');

// Sign transaction
await arweave.transactions.sign(transaction, jwk);

// Submit to network
const response = await arweave.transactions.post(transaction);
console.log('Transaction ID:', transaction.id);
console.log('Status:', response.status);
```

**Check Transaction Status**
```typescript
const status = await arweave.transactions.getStatus(txId);
/*
Returns: {
  status: 200 | 202 | 404,
  confirmed: {
    block_height: number,
    block_indep_hash: string,
    number_of_confirmations: number
  }
}

Status codes:
- 200: Confirmed
- 202: Pending
- 404: Not found
*/
```

---

## Implementation Guides

### ArNS Name Registration & Management

#### Complete Registration Flow

**Step 1: Check Name Availability**
```typescript
import { ARIO, ArweaveSigner } from '@ar.io/sdk';

const ario = ARIO.mainnet();

// Try to get existing record
try {
  const existing = await ario.getArNSRecord({ name: 'myapp' });
  console.log('Name is taken');
} catch (e) {
  console.log('Name is available');
}
```

**Step 2: Calculate Purchase Cost**
```typescript
import { ARIOToken, mARIOToken } from '@ar.io/sdk';

// Get cost for lease
const leaseCost = await ario.getTokenCost({
  intent: 'Buy-Name',
  name: 'myapp',
  type: 'lease',
  years: 1
});
console.log(`1-year lease: ${new mARIOToken(leaseCost).toARIO()} ARIO`);

// Get cost for permanent
const permCost = await ario.getTokenCost({
  intent: 'Buy-Name',
  name: 'myapp',
  type: 'permabuy'
});
console.log(`Permanent: ${new mARIOToken(permCost).toARIO()} ARIO`);
```

**Step 3: Ensure Sufficient Balance**
```typescript
const jwk = JSON.parse(fs.readFileSync('./wallet.json', 'utf8'));
const arweave = Arweave.init({ host: 'arweave.net', port: 443, protocol: 'https' });
const address = await arweave.wallets.jwkToAddress(jwk);

const balance = await ario.getBalance({ address });
const balanceARIO = new mARIOToken(balance).toARIO();

console.log(`Wallet balance: ${balanceARIO} ARIO`);

if (balance < leaseCost) {
  throw new Error('Insufficient ARIO tokens');
}
```

**Step 4: Purchase Name**
```typescript
const ariosigner = new ArweaveSigner(jwk);
const arioSigned = ARIO.mainnet({ signer });

const result = await arioSigned.buyRecord({
  name: 'myapp',
  type: 'lease',  // or 'permabuy'
  years: 1,
  // Optional: provide existing ANT process ID
  // If omitted, new ANT contract will be created
  processId: undefined
});

console.log('Purchase successful!');
console.log('Process ID (ANT):', result.processId);
```

**Step 5: Get ANT Contract Handle**
```typescript
import { ANT } from '@ar.io/sdk';

// Get the record to find ANT process ID
const record = await arioSigned.getArNSRecord({ name: 'myapp' });
const antProcessId = record.processId;

// Initialize ANT contract
const ant = ANT.init({
  processId: antProcessId,
  signer: signer
});

console.log('ANT contract initialized:', antProcessId);
```

**Step 6: Set Record to Point to Your Content**
```typescript
// Upload your content first (e.g., via Turbo)
const turbo = TurboFactory.authenticated({ privateKey: jwk });
const upload = await turbo.uploadFile({
  fileStreamFactory: () => fs.createReadStream('./build/index.html'),
  fileSizeFactory: () => fs.statSync('./build/index.html').size
});

const contentTxId = upload.id;

// Point ArNS name to content
await ant.setRecord({
  undername: '@',  // Base record
  transactionId: contentTxId,
  ttlSeconds: 3600  // 1 hour cache TTL
});

console.log(`myapp.ar now points to ${contentTxId}`);
```

**Step 7: Verify Resolution**
```typescript
// Wait a few minutes for propagation, then test
const response = await fetch('https://arweave.net/ar://myapp');
const html = await response.text();
console.log('ArNS resolution working!', html.substring(0, 100));
```

#### Managing Undernames (Subdomains)

**Create Staging Environment**
```typescript
// Upload staging version
const stagingUpload = await turbo.uploadFile({
  fileStreamFactory: () => fs.createReadStream('./build-staging/index.html'),
  fileSizeFactory: () => fs.statSync('./build-staging/index.html').size
});

// Set undername record
await ant.setRecord({
  undername: 'staging',
  transactionId: stagingUpload.id,
  ttlSeconds: 300  // 5 minutes (low TTL for frequent updates)
});

// Access at: staging.myapp.ar
```

**Version Management Pattern**
```typescript
// Deploy new version
const v2Upload = await turbo.uploadFile({
  fileStreamFactory: () => fs.createReadStream('./build-v2/index.html'),
  fileSizeFactory: () => fs.statSync('./build-v2/index.html').size
});

// Create v2 undername
await ant.setRecord({
  undername: 'v2',
  transactionId: v2Upload.id,
  ttlSeconds: 3600
});

// After testing v2, update production (@)
await ant.setRecord({
  undername: '@',
  transactionId: v2Upload.id,
  ttlSeconds: 3600
});

// Keep v1 as fallback
await ant.setRecord({
  undername: 'v1',
  transactionId: oldProductionTxId,
  ttlSeconds: 86400  // 24 hours
});
```

**Check Undername Limit**
```typescript
const record = await ario.getArNSRecord({ name: 'myapp' });
console.log('Undername limit:', record.undernameLimit);
console.log('Current undernames:', Object.keys(await ant.getRecords()).length - 1);

// Increase limit if needed
if (record.undernameLimit < 10) {
  await arioSigned.increaseUndernameLimit({
    name: 'myapp',
    qty: 10  // Add 10 more slots
  });
}
```

#### Lease Management

**Check Lease Expiration**
```typescript
const record = await ario.getArNSRecord({ name: 'myapp' });

if (record.type === 'lease') {
  const expiryDate = new Date(record.endTimestamp);
  const daysRemaining = (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);

  console.log(`Lease expires: ${expiryDate.toISOString()}`);
  console.log(`Days remaining: ${Math.floor(daysRemaining)}`);

  if (daysRemaining < 30) {
    console.warn('Lease expiring soon! Consider extending.');
  }
}
```

**Extend Lease**
```typescript
// Extend for 2 more years
const extensionCost = await ario.getTokenCost({
  intent: 'Extend-Name',
  name: 'myapp',
  years: 2
});

console.log(`Extension cost: ${new mARIOToken(extensionCost).toARIO()} ARIO`);

await arioSigned.extendLease({
  name: 'myapp',
  years: 2
});

console.log('Lease extended successfully');
```

#### Transfer Ownership

**Transfer ANT to New Owner**
```typescript
// Transfer ANT (and thus ArNS name control) to another wallet
await ant.transfer({
  target: 'NEW_OWNER_WALLET_ADDRESS'
});

console.log('ArNS name ownership transferred');
```

#### Delegate Record Management

**Add Controller (Subdomain Delegation)**
```typescript
// Allow another address to manage undernames
await ant.setController({
  controller: 'DELEGATE_WALLET_ADDRESS'
});

// Delegate can now set undernames but not base record or transfer ownership
```

**Set Record with Ownership Delegation**
```typescript
// Delegate specific undername to another address
await ant.setRecord({
  undername: 'alice',
  transactionId: 'TX_ID',
  ttlSeconds: 3600,
  owner: 'ALICE_WALLET_ADDRESS'  // Alice can now update this undername
});
```

---

### Data Storage & Retrieval Patterns

#### Choosing Upload Method

**Decision Matrix**

| Requirement | Use Turbo | Use Traditional |
|-------------|-----------|-----------------|
| Fast availability (<5 min) | ✅ Yes | ❌ No (10-120 min) |
| Large files (>100MB) | ✅ Yes | ⚠️ Possible but slower |
| Batch uploads | ✅ Yes | ⚠️ Slower |
| Lowest cost | ❌ No | ✅ Yes |
| Credit system | ✅ Built-in | ❌ N/A |
| Direct Arweave TX needed | ❌ No (bundled) | ✅ Yes |

#### Turbo Upload Pattern

**Basic Upload**
```typescript
import { TurboFactory } from '@ardrive/turbo-sdk';
import fs from 'fs';

const turbo = TurboFactory.authenticated({
  privateKey: jwk
});

// Check balance first
const balance = await turbo.getBalance();
console.log(`Credits: ${balance.winc} winc`);

// Get cost estimate
const fileSize = fs.statSync('./large-file.mp4').size;
const cost = await turbo.getUploadCost({ bytes: fileSize });
console.log(`Upload will cost: ${cost} winc`);

// Top up if needed
if (parseInt(balance.winc) < parseInt(cost)) {
  await turbo.topUpWithTokens({
    tokenAmount: USD(10.00)
  });
}

// Upload
const result = await turbo.uploadFile({
  fileStreamFactory: () => fs.createReadStream('./large-file.mp4'),
  fileSizeFactory: () => fileSize,
  dataItemOpts: {
    tags: [
      { name: 'Content-Type', value: 'video/mp4' },
      { name: 'App-Name', value: 'MyApp' },
      { name: 'File-Name', value: 'large-file.mp4' }
    ]
  }
});

console.log('Uploaded!', result.id);
console.log('Available at:', `https://arweave.net/${result.id}`);
```

**Batch Upload with Progress**
```typescript
const files = ['file1.jpg', 'file2.jpg', 'file3.jpg'];

for (const filename of files) {
  console.log(`Uploading ${filename}...`);

  const result = await turbo.uploadFile({
    fileStreamFactory: () => fs.createReadStream(`./${filename}`),
    fileSizeFactory: () => fs.statSync(`./${filename}`).size,
    onProgress: (progress) => {
      console.log(`  ${progress.pctComplete}%`);
    },
    dataItemOpts: {
      tags: [
        { name: 'Content-Type', value: 'image/jpeg' },
        { name: 'File-Name', value: filename }
      ]
    }
  });

  console.log(`✓ ${filename}: ${result.id}`);
}
```

#### ArDrive Storage Pattern

**Organize Files in Drive Structure**
```typescript
import { arDriveFactory, wrapFileOrFolder } from 'ardrive-core-js';

const arDrive = arDriveFactory({
  wallet: jwk,
  turboSettings: {
    turboUploadUrl: new URL('https://upload.ardrive.io')
  }
});

// Create drive
const drive = await arDrive.createPublicDrive({
  driveName: 'My Project Files'
});

// Create folders
const docsFolder = await arDrive.createPublicFolder({
  folderName: 'Documents',
  driveId: drive.driveId,
  parentFolderId: drive.rootFolderId
});

const imagesFolder = await arDrive.createPublicFolder({
  folderName: 'Images',
  driveId: drive.driveId,
  parentFolderId: drive.rootFolderId
});

// Upload files to folders
const docUpload = await arDrive.uploadPublicFile({
  parentFolderId: docsFolder.entityId,
  wrappedFile: wrapFileOrFolder('./README.md', 'text/markdown'),
  conflictResolution: 'upsert'
});

const imageUpload = await arDrive.uploadPublicFile({
  parentFolderId: imagesFolder.entityId,
  wrappedFile: wrapFileOrFolder('./logo.png', 'image/png'),
  conflictResolution: 'upsert'
});

console.log('Drive structure created!');
console.log('Drive ID:', drive.driveId.toString());
```

**Bulk Upload Local Directory**
```typescript
// Upload entire local folder structure
const result = await arDrive.createPublicFolderAndUploadChildren({
  parentFolderId: drive.rootFolderId,
  wrappedFolder: wrapFileOrFolder('./my-project'),
  conflictResolution: 'upsert'
});

console.log('Uploaded files:', result.created.length);
console.log('Total cost:', result.fees);
```

#### Private/Encrypted Storage

**Create Private Drive**
```typescript
const privateDrive = await arDrive.createPrivateDrive({
  driveName: 'Secret Files',
  drivePassword: 'my-secure-password-123'
});

// Derive drive key for future operations
import { deriveDriveKey } from 'ardrive-core-js';
const driveKey = await deriveDriveKey(
  'my-secure-password-123',
  privateDrive.driveId,
  jwk
);

// Upload encrypted file
const secretUpload = await arDrive.uploadPrivateFile({
  parentFolderId: privateDrive.rootFolderId,
  driveKey: driveKey,
  wrappedFile: wrapFileOrFolder('./secret.txt', 'text/plain'),
  conflictResolution: 'upsert'
});

console.log('File encrypted and uploaded:', secretUpload.created[0].entityId);
```

**Download and Decrypt**
```typescript
// Download encrypted file (automatically decrypts)
const decryptedData = await arDrive.downloadPrivateFile({
  fileId: secretUpload.created[0].entityId,
  driveKey: driveKey
});

fs.writeFileSync('./downloaded-secret.txt', decryptedData);
console.log('File downloaded and decrypted');
```

#### Retrieval Patterns

**Direct HTTP Retrieval**
```typescript
// Simple GET request
async function getData(txId: string): Promise<string> {
  const response = await fetch(`https://arweave.net/${txId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`);
  }
  return response.text();
}

// With retry logic
async function getDataWithRetry(
  txId: string,
  maxRetries = 3
): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`https://arweave.net/${txId}`);
      if (response.ok) {
        return response.text();
      }
      if (response.status === 404 && i < maxRetries - 1) {
        // Transaction might not be confirmed yet
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10s
        continue;
      }
      throw new Error(`HTTP ${response.status}`);
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  throw new Error('Max retries exceeded');
}
```

**Multi-Gateway Failover**
```typescript
const gateways = [
  'https://arweave.net',
  'https://ar-io.dev',
  'https://g8way.io'
];

async function getDataFromAnyGateway(txId: string): Promise<string> {
  for (const gateway of gateways) {
    try {
      const response = await fetch(`${gateway}/${txId}`, {
        signal: AbortSignal.timeout(10000)  // 10s timeout
      });

      if (response.ok) {
        return response.text();
      }
    } catch (err) {
      console.warn(`Failed from ${gateway}:`, err.message);
      continue;
    }
  }
  throw new Error('All gateways failed');
}
```

**Wayfinder Retrieval (Recommended)**
```typescript
import { WayfinderCore } from '@ar.io/wayfinder-core';

const wayfinder = new WayfinderCore({
  gatewayProviders: [
    { url: 'https://arweave.net', weight: 1.0 },
    { url: 'https://ar-io.dev', weight: 0.9 },
    { url: 'https://g8way.io', weight: 0.8 }
  ],
  routingStrategy: 'performance',
  verificationStrategy: 'hash'
});

// Automatic failover and verification
const data = await wayfinder.get('ar://myapp');
console.log('Data retrieved with verification:', data.substring(0, 100));
```

#### GraphQL Discovery Pattern

**Find Recent Uploads by App**
```typescript
async function findRecentUploads(appName: string, limit = 10) {
  const query = `
    query($appName: String!, $limit: Int!) {
      transactions(
        first: $limit,
        tags: [
          { name: "App-Name", values: [$appName] }
        ],
        sort: HEIGHT_DESC
      ) {
        edges {
          node {
            id
            owner { address }
            tags { name value }
            block {
              height
              timestamp
            }
          }
        }
      }
    }
  `;

  const response = await fetch('https://arweave.net/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      variables: { appName, limit }
    })
  });

  const { data } = await response.json();
  return data.transactions.edges.map(e => e.node);
}

// Usage
const uploads = await findRecentUploads('MyApp', 20);
uploads.forEach(tx => {
  console.log(`TX ${tx.id} at block ${tx.block.height}`);
  console.log(`  Owner: ${tx.owner.address}`);
  console.log(`  Tags:`, tx.tags);
});
```

**Find Files by Content Type**
```typescript
async function findFilesByType(contentType: string) {
  const query = `
    query($contentType: String!) {
      transactions(
        first: 50,
        tags: [
          { name: "Content-Type", values: [$contentType] }
        ]
      ) {
        edges {
          node {
            id
            tags { name value }
          }
        }
      }
    }
  `;

  const response = await fetch('https://arweave.net/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      variables: { contentType }
    })
  });

  const { data } = await response.json();
  return data.transactions.edges.map(e => e.node);
}

// Find all JSON files
const jsonFiles = await findFilesByType('application/json');
```

---

### Complete dApp Deployment

**End-to-End Production Deployment**

```typescript
import { ARIO, ANT, ArweaveSigner, ARIOToken } from '@ar.io/sdk';
import { TurboFactory } from '@ardrive/turbo-sdk';
import fs from 'fs';
import path from 'path';

async function deployDapp(config: {
  buildDir: string;
  arnsName: string;
  jwk: any;
  appName: string;
  version: string;
}) {
  console.log('🚀 Starting dApp deployment...\n');

  // Initialize clients
  const signer = new ArweaveSigner(config.jwk);
  const ario = ARIO.mainnet({ signer });
  const turbo = TurboFactory.authenticated({
    privateKey: config.jwk
  });

  // Step 1: Upload all files
  console.log('📤 Uploading files...');
  const files = getAllFiles(config.buildDir);
  const uploads: Record<string, string> = {};

  for (const file of files) {
    const relativePath = path.relative(config.buildDir, file);
    console.log(`  Uploading ${relativePath}...`);

    const result = await turbo.uploadFile({
      fileStreamFactory: () => fs.createReadStream(file),
      fileSizeFactory: () => fs.statSync(file).size,
      dataItemOpts: {
        tags: [
          { name: 'Content-Type', value: getContentType(file) },
          { name: 'App-Name', value: config.appName },
          { name: 'Version', value: config.version },
          { name: 'File-Path', value: relativePath }
        ]
      }
    });

    uploads[relativePath] = result.id;
    console.log(`    ✓ ${result.id}`);
  }

  // Step 2: Create manifest
  console.log('\n📝 Creating manifest...');
  const manifest = {
    manifest: 'arweave/paths',
    version: '0.1.0',
    index: { path: 'index.html' },
    paths: Object.fromEntries(
      Object.entries(uploads).map(([path, id]) => [
        path,
        { id }
      ])
    )
  };

  const manifestResult = await turbo.uploadFile({
    fileStreamFactory: () => {
      const Readable = require('stream').Readable;
      return Readable.from([JSON.stringify(manifest)]);
    },
    fileSizeFactory: () => JSON.stringify(manifest).length,
    dataItemOpts: {
      tags: [
        { name: 'Content-Type', value: 'application/x.arweave-manifest+json' },
        { name: 'App-Name', value: config.appName },
        { name: 'Version', value: config.version }
      ]
    }
  });

  const manifestId = manifestResult.id;
  console.log(`✓ Manifest created: ${manifestId}`);

  // Step 3: Check/register ArNS name
  console.log(`\n🔍 Checking ArNS name: ${config.arnsName}...`);
  let record;
  let ant;

  try {
    record = await ario.getArNSRecord({ name: config.arnsName });
    console.log(`✓ Name already registered`);

    ant = ANT.init({
      processId: record.processId,
      signer: signer
    });
  } catch (e) {
    console.log('Name not registered. Registering now...');

    const cost = await ario.getTokenCost({
      intent: 'Buy-Name',
      name: config.arnsName,
      type: 'lease',
      years: 1
    });

    console.log(`  Cost: ${new mARIOToken(cost).toARIO()} ARIO`);

    const buyResult = await ario.buyRecord({
      name: config.arnsName,
      type: 'lease',
      years: 1
    });

    console.log(`✓ Name registered`);

    ant = ANT.init({
      processId: buyResult.processId,
      signer: signer
    });
  }

  // Step 4: Update ArNS record
  console.log('\n🔗 Updating ArNS record...');
  await ant.setRecord({
    undername: '@',
    transactionId: manifestId,
    ttlSeconds: 3600
  });

  console.log(`✓ ${config.arnsName}.ar now points to ${manifestId}`);

  // Step 5: Create version undername
  const versionUndername = `v${config.version.replace(/\./g, '-')}`;
  await ant.setRecord({
    undername: versionUndername,
    transactionId: manifestId,
    ttlSeconds: 86400  // 24 hours
  });

  console.log(`✓ ${versionUndername}.${config.arnsName}.ar created`);

  // Done!
  console.log('\n✅ Deployment complete!\n');
  console.log('🌐 URLs:');
  console.log(`   Production: https://arweave.net/ar://${config.arnsName}`);
  console.log(`   Version: https://arweave.net/ar://${versionUndername}.${config.arnsName}`);
  console.log(`   Direct: https://arweave.net/${manifestId}`);
  console.log('\n⏱️  Allow 2-5 minutes for propagation across gateways.');

  return {
    manifestId,
    urls: {
      production: `https://arweave.net/ar://${config.arnsName}`,
      version: `https://arweave.net/ar://${versionUndername}.${config.arnsName}`,
      direct: `https://arweave.net/${manifestId}`
    }
  };
}

// Helper functions
function getAllFiles(dir: string): string[] {
  const files: string[] = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getAllFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const types: Record<string, string> = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
  };
  return types[ext] || 'application/octet-stream';
}

// Usage
const deployment = await deployDapp({
  buildDir: './dist',
  arnsName: 'myapp',
  jwk: JSON.parse(fs.readFileSync('./wallet.json', 'utf8')),
  appName: 'MyApp',
  version: '1.0.0'
});
```

---

### Gateway Deployment & Operation

#### Quick Start Installation

**Prerequisites**
- Linux server (Ubuntu 22.04+ recommended)
- 8+ GB RAM
- 500+ GB storage (grows over time)
- Docker & Docker Compose
- Arweave wallet with minimum operator stake (check network requirements)

**Installation Steps**

```bash
# 1. Clone AR.IO gateway repository
git clone https://github.com/ar-io/ar-io-node.git
cd ar-io-node

# 2. Copy example environment file
cp .env.example .env

# 3. Configure environment variables
nano .env
```

**Essential Environment Variables**

```bash
# .env

# Arweave wallet for gateway identity
ARWEAVE_WALLET_PATH=/path/to/wallet.json

# Gateway domain (must be publicly accessible)
AR_IO_FQDN=gateway.example.com

# Port configuration
AR_IO_PORT=443

# Protocol
AR_IO_PROTOCOL=https

# Start height (use current Arweave block height)
START_HEIGHT=1000000

# Admin API key (generate random string)
ADMIN_API_KEY=your-secure-admin-key-here

# Observer selection (for OIP)
OBSERVER_WALLET=your-observer-wallet-address

# Database path
SQLITE_DATA_PATH=./data/sqlite

# Enable bundler
RUN_BUNDLER=true

# Gateway label
GATEWAY_LABEL="My AR.IO Gateway"
```

**Launch Gateway**

```bash
# Start gateway
docker-compose up -d

# Check logs
docker-compose logs -f core

# Verify health
curl http://localhost:3000/ar-io/healthcheck
```

#### Network Registration

**Prerequisites for Registration**
- Gateway must be online and healthy
- Minimum operator stake (typically 10,000 - 50,000 ARIO)
- Valid domain with SSL certificate
- Wallet with sufficient ARIO tokens

**Registration Process**

```typescript
import { ARIO, ArweaveSigner, ARIOToken } from '@ar.io/sdk';
import fs from 'fs';

async function registerGateway() {
  // Load gateway wallet
  const jwk = JSON.parse(fs.readFileSync('./gateway-wallet.json', 'utf8'));
  const signer = new ArweaveSigner(jwk);
  const ario = ARIO.mainnet({ signer });

  // Upload gateway properties
  // This should contain gateway metadata as JSON
  const properties = {
    location: "New York, USA",
    note: "Community gateway supporting the permaweb"
  };

  // Upload properties to Arweave (using Turbo or traditional)
  const turbo = TurboFactory.authenticated({ privateKey: jwk });
  const propResult = await turbo.uploadFile({
    fileStreamFactory: () => {
      const Readable = require('stream').Readable;
      return Readable.from([JSON.stringify(properties)]);
    },
    fileSizeFactory: () => JSON.stringify(properties).length,
    dataItemOpts: {
      tags: [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'App-Name', value: 'AR-IO-Gateway-Properties' }
      ]
    }
  });

  const propertiesTxId = propResult.id;

  // Register gateway
  await ario.joinNetwork({
    qty: new ARIOToken(10_000).toMARIO(),  // Operator stake
    label: 'My Community Gateway',
    fqdn: 'gateway.example.com',
    port: 443,
    protocol: 'https',
    properties: propertiesTxId,
    note: 'Reliable community gateway',
    allowDelegatedStaking: true,
    delegateRewardShareRatio: 10,  // 10% to delegates
    minDelegatedStake: new ARIOToken(100).toMARIO(),
    autoStake: true
  });

  console.log('✅ Gateway registered successfully!');
  console.log('View at: https://network.ar.io');
}

registerGateway();
```

#### SSL Certificate Setup

**Using Certbot with DNS Challenge**

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot

# Get certificate (DNS challenge for wildcard support)
sudo certbot certonly \
  --manual \
  --preferred-challenges dns \
  -d gateway.example.com \
  -d *.gateway.example.com

# Add DNS TXT record as instructed
# Certificates saved to: /etc/letsencrypt/live/gateway.example.com/

# Configure gateway to use certificates
# Update docker-compose.yml or .env
```

**Auto-Renewal Setup**

```bash
# Test renewal
sudo certbot renew --dry-run

# Add cron job for auto-renewal
sudo crontab -e

# Add line:
0 0 * * * certbot renew --quiet && docker-compose -f /path/to/ar-io-node/docker-compose.yml restart
```

#### Content Moderation

**Configure Blocklist**

```bash
# Create blocklist file
nano ./data/blocklist.json
```

```json
{
  "blockedTransactions": [
    "TX_ID_1",
    "TX_ID_2"
  ],
  "blockedAddresses": [
    "WALLET_ADDRESS_1"
  ],
  "blockedArNSNames": [
    "inappropriate-name"
  ]
}
```

**Update Environment**

```bash
# .env
BLOCKLIST_PATH=./data/blocklist.json
```

**Restart Gateway**

```bash
docker-compose restart
```

---

## Decision Trees

### When to Use Which Upload Method?

```
START: Need to upload data to Arweave

├─ Q: Need availability in <5 minutes?
│  ├─ YES → Use Turbo SDK
│  └─ NO → Continue
│
├─ Q: Uploading >100 files?
│  ├─ YES → Use Turbo or ArDrive bulk operations
│  └─ NO → Continue
│
├─ Q: Need organized folder structure?
│  ├─ YES → Use ArDrive
│  └─ NO → Continue
│
├─ Q: Need encryption/privacy?
│  ├─ YES → Use ArDrive private drive
│  └─ NO → Continue
│
├─ Q: Is lowest cost critical?
│  ├─ YES → Use traditional Arweave upload
│  └─ NO → Use Turbo for convenience
```

### ArNS: Lease vs Permanent?

```
START: Registering ArNS name

├─ Q: Is this a production application?
│  ├─ YES → Continue
│  └─ NO (testing/temporary) → Use LEASE
│
├─ Q: Brand/company identity?
│  ├─ YES → Use PERMANENT (one-time investment)
│  └─ NO → Continue
│
├─ Q: Budget constraints?
│  ├─ YES → Use LEASE (lower upfront cost)
│  └─ NO → Continue
│
├─ Q: Long-term (5+ years) commitment?
│  ├─ YES → Use PERMANENT (better value long-term)
│  └─ NO → Use LEASE (flexibility to change)
```

### Gateway Selection Strategy?

```
START: Accessing Arweave data

├─ Q: Using in production application?
│  ├─ YES → Continue
│  └─ NO (development) → Use arweave.net directly
│
├─ Q: Need automatic failover?
│  ├─ YES → Use Wayfinder SDK
│  └─ NO → Continue
│
├─ Q: Need data verification?
│  ├─ YES → Use Wayfinder with verification
│  └─ NO → Continue
│
├─ Q: Simple static content?
│  ├─ YES → Direct HTTP to multiple gateways with try/catch
│  └─ NO → Use Wayfinder for advanced features
```

### Token Operations: Transfer vs Vaulted Transfer?

```
START: Sending ARIO tokens

├─ Q: Need tokens locked for staking/vesting?
│  ├─ YES → Use vaultedTransfer()
│  └─ NO → Continue
│
├─ Q: Want ability to revoke before unlock?
│  ├─ YES → Use vaultedTransfer({ revokable: true })
│  └─ NO → Continue
│
├─ Q: Simple one-time payment?
│  ├─ YES → Use transfer()
│  └─ NO → Consider vault options
```

---

## Troubleshooting

### Common Errors & Solutions

#### Transaction Not Found (404)

**Symptom:** `GET https://arweave.net/TX_ID` returns 404

**Causes & Solutions:**

1. **Transaction not yet confirmed**
   ```typescript
   // Check status
   import Arweave from 'arweave';
   const arweave = Arweave.init({ host: 'arweave.net', port: 443, protocol: 'https' });

   const status = await arweave.transactions.getStatus(txId);

   if (status.status === 202) {
     console.log('Transaction pending confirmation');
     console.log('Confirmations:', status.confirmed?.number_of_confirmations || 0);
     // Wait and retry
   } else if (status.status === 404) {
     console.log('Transaction not found in mempool or blockchain');
     // May have failed or been rejected
   }
   ```

2. **Using Turbo - need to wait for propagation**
   ```typescript
   // Turbo uploads are fast but need a few minutes to propagate
   // Wait 2-5 minutes after upload completes

   async function waitForAvailability(txId: string, maxWaitMs = 300000) {
     const start = Date.now();
     while (Date.now() - start < maxWaitMs) {
       try {
         const response = await fetch(`https://arweave.net/${txId}`, {
           method: 'HEAD'
         });
         if (response.ok) {
           console.log('Transaction now available!');
           return true;
         }
       } catch (e) {}

       await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10s
     }
     throw new Error('Transaction not available within timeout');
   }
   ```

3. **Wrong network**
   ```typescript
   // Ensure you're checking the correct network
   // Testnet transactions won't appear on mainnet gateways

   // Testnet gateway:
   const testnetUrl = `https://testnet.arweave.net/${txId}`;

   // Mainnet gateway:
   const mainnetUrl = `https://arweave.net/${txId}`;
   ```

#### Insufficient Balance / Insufficient Funds

**Symptom:** Transaction fails with insufficient funds error

**Solutions:**

1. **Check actual balance**
   ```typescript
   import { ARIO, ArweaveSigner } from '@ar.io/sdk';
   import Arweave from 'arweave';

   // Check ARIO balance
   const ario = ARIO.mainnet();
   const arioBalance = await ario.getBalance({ address: 'YOUR_ADDRESS' });
   console.log(`ARIO balance: ${new mARIOToken(arioBalance).toARIO()} ARIO`);

   // Check AR balance
   const arweave = Arweave.init({ host: 'arweave.net', port: 443, protocol: 'https' });
   const arBalance = await arweave.wallets.getBalance('YOUR_ADDRESS');
   console.log(`AR balance: ${arweave.ar.winstonToAr(arBalance)} AR`);
   ```

2. **For Turbo uploads - top up credits**
   ```typescript
   const turbo = TurboFactory.authenticated({ privateKey: jwk });

   const balance = await turbo.getBalance();
   console.log(`Current credits: ${balance.winc} winc`);

   if (parseInt(balance.winc) < 1000000) {
     console.log('Topping up...');
     await turbo.topUpWithTokens({
       tokenAmount: USD(10.00)
     });
   }
   ```

3. **For ArNS purchase - get testnet tokens**
   ```typescript
   // Use testnet for development
   const testnet = ARIO.testnet({ signer });

   // Get faucet tokens
   const faucet = testnet.faucet;
   const { captchaUrl } = await faucet.captchaUrl();
   console.log('Complete captcha:', captchaUrl);

   // After completing captcha, claim tokens
   await faucet.claimWithAuthToken({
     authToken: 'JWT_FROM_CAPTCHA',
     recipient: walletAddress,
     quantity: new ARIOToken(1000).toMARIO()
   });
   ```

#### ArNS Name Not Resolving

**Symptom:** `https://arweave.net/ar://myname` returns error or wrong content

**Causes & Solutions:**

1. **Record not set**
   ```typescript
   import { ARIO, ANT } from '@ar.io/sdk';

   const ario = ARIO.mainnet();
   const record = await ario.getArNSRecord({ name: 'myname' });

   const ant = ANT.init({ processId: record.processId });
   const records = await ant.getRecords();

   console.log('Current records:', records);

   if (!records['@']) {
     console.log('Base record not set!');
     // Set it:
     await ant.setRecord({
       undername: '@',
       transactionId: 'YOUR_TX_ID',
       ttlSeconds: 3600
     });
   }
   ```

2. **Gateway cache (TTL)**
   ```typescript
   // Check current TTL
   const records = await ant.getRecords();
   console.log('TTL for @ record:', records['@'].ttlSeconds);

   // Low TTL during development
   await ant.setRecord({
     undername: '@',
     transactionId: newTxId,
     ttlSeconds: 60  // 1 minute (fast updates)
   });

   // Higher TTL for production
   await ant.setRecord({
     undername: '@',
     transactionId: prodTxId,
     ttlSeconds: 3600  // 1 hour (reduced gateway load)
   });
   ```

3. **Propagation delay**
   ```typescript
   // After updating ANT record, wait for propagation
   console.log('Waiting for propagation...');
   await new Promise(resolve => setTimeout(resolve, 60000)); // 1 minute

   // Try with cache-busting
   const url = `https://arweave.net/ar://myname?cache=${Date.now()}`;
   const response = await fetch(url);
   ```

#### Web3 Bundler Errors (Browser)

**Symptom:** `Buffer is not defined`, `process is not defined`, `crypto is not defined`

**Solutions:**

**Vite Projects**
```bash
npm install vite-plugin-node-polyfills
```

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true
      },
      protocolImports: true
    })
  ]
});
```

**Webpack Projects**
```bash
npm install crypto-browserify stream-browserify buffer process
```

```javascript
// webpack.config.js
const webpack = require('webpack');

module.exports = {
  resolve: {
    fallback: {
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer/'),
      process: require.resolve('process/browser')
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser'
    })
  ]
};
```

**Create React App (CRA)**
```bash
npm install react-app-rewired crypto-browserify stream-browserify buffer process
```

```javascript
// config-overrides.js
const webpack = require('webpack');

module.exports = function override(config) {
  config.resolve.fallback = {
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    buffer: require.resolve('buffer'),
    process: require.resolve('process/browser')
  };

  config.plugins.push(
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser'
    })
  );

  return config;
};
```

#### Token Math Errors / Floating Point Issues

**Symptom:** Token calculations producing unexpected results

**Solution:** Always use mARIO

```typescript
import { ARIOToken, mARIOToken } from '@ar.io/sdk';

// ❌ WRONG: Floating point arithmetic
const amount = 0.1 + 0.2;  // 0.30000000000000004
await ario.transfer({
  target: address,
  qty: amount * 1_000_000  // INCORRECT
});

// ✅ CORRECT: Use token classes
const amount = new ARIOToken(0.3);
await ario.transfer({
  target: address,
  qty: amount.toMARIO()  // Exact: 300000 mARIO
});

// ✅ CORRECT: Work in mARIO directly
const amount = new mARIOToken(300_000);
await ario.transfer({
  target: address,
  qty: amount.valueOf()
});
```

#### Gateway Sync Issues

**Symptom:** Gateway not syncing or falling behind

**Diagnostic Steps:**

```bash
# Check gateway health
curl http://localhost:3000/ar-io/healthcheck

# Check sync status
curl http://localhost:3000/ar-io/info

# View logs
docker-compose logs -f core

# Check disk space
df -h

# Check memory
free -h
```

**Solutions:**

1. **Increase resources**
   ```yaml
   # docker-compose.yml
   services:
     core:
       deploy:
         resources:
           limits:
             memory: 16G
           reservations:
             memory: 8G
   ```

2. **Use database snapshot**
   ```bash
   # Download recent snapshot
   wget https://snapshots.ar.io/latest.db.gz

   # Extract to data directory
   gunzip -c latest.db.gz > ./data/sqlite/arweave.db

   # Restart gateway
   docker-compose restart
   ```

3. **Reset and resync**
   ```bash
   # Backup current data
   cp -r ./data ./data.backup

   # Remove database
   rm ./data/sqlite/arweave.db

   # Restart (will resync from START_HEIGHT)
   docker-compose up -d
   ```

---

## Appendices

### A. Configuration Reference

#### AR.IO SDK Configuration Options

```typescript
// ARIO client options
interface ARIOConfig {
  signer?: Signer;           // Optional signer for write operations
  logger?: ILogger;          // Custom logger implementation
}

// Signer implementations
import { ArweaveSigner, ArconnectSigner } from '@ar.io/sdk';

// ArweaveSigner (Node.js)
const signer = new ArweaveSigner(jwk);

// ArconnectSigner (Browser)
const signer = new ArconnectSigner(window.arweaveWallet);
```

#### Environment Variables for Gateway

```bash
# Core Configuration
ARWEAVE_WALLET_PATH=/path/to/wallet.json
AR_IO_FQDN=gateway.example.com
AR_IO_PORT=443
AR_IO_PROTOCOL=https
START_HEIGHT=1000000

# Admin & Monitoring
ADMIN_API_KEY=secure-random-key
OBSERVER_WALLET=observer-address

# Database
SQLITE_DATA_PATH=./data/sqlite
ARNS_CACHE_PATH=./data/arns-cache

# Features
RUN_BUNDLER=true
RUN_OBSERVER=true
ENABLE_GRAPHQL=true

# Content Moderation
BLOCKLIST_PATH=./data/blocklist.json
ALLOWLIST_PATH=./data/allowlist.json

# Performance
MAX_CONCURRENT_REQUESTS=100
CACHE_SIZE_MB=10000

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

### B. Network Endpoints

**Mainnet**
```
ARIO Contract: [Process ID from network]
AR.IO Gateways:
  - https://arweave.net
  - https://ar-io.dev
  - https://g8way.io
Network Portal: https://network.ar.io
ArNS Registry: https://arns.app
```

**Testnet**
```
ARIO Contract: [Testnet Process ID]
Testnet Gateway: https://testnet.arweave.net
Faucet: Via SDK faucet methods
```

**Devnet**
```
ARIO Contract: [Devnet Process ID]
Local Gateway: http://localhost:3000
```

### C. Token Economics

**ARIO Token**
- Total Supply: 1,000,000,000 ARIO (fixed, non-inflationary)
- Smallest Unit: 1 mARIO = 0.000001 ARIO
- 1 ARIO = 1,000,000 mARIO

**Minimum Stakes (approximate, check network for current values)**
- Gateway Operator Stake: 10,000 - 50,000 ARIO
- Minimum Delegate Stake: 100 ARIO
- Observer Selection: Weighted by stake

**ArNS Pricing**
- Dynamic pricing based on name length and demand
- Lease: Annual renewal required (1-5 years)
- Permanent: One-time purchase, owned forever
- Returned name premium applies to previously owned names

### D. CLI Command Reference

**ArDrive CLI**
```bash
# Installation
npm install -g ardrive-cli

# Create drive
ardrive create-drive --name "My Drive" --wallet-file ./wallet.json

# Upload file
ardrive upload-file \
  --parent-folder-id FOLDER_ID \
  --local-path ./file.txt \
  --wallet-file ./wallet.json

# Bulk upload
ardrive upload-folder \
  --parent-folder-id FOLDER_ID \
  --local-path ./my-folder \
  --wallet-file ./wallet.json

# Download file
ardrive download-file \
  --file-id FILE_ID \
  --local-path ./downloaded.txt \
  --wallet-file ./wallet.json

# List drives
ardrive list-drives --address WALLET_ADDRESS

# Create manifest
ardrive create-manifest \
  --folder-id FOLDER_ID \
  --dest-manifest-name "app-manifest" \
  --wallet-file ./wallet.json
```

### E. Version Compatibility

**SDK Versions (as of documentation date)**
- @ar.io/sdk: 3.18.3+
- @ardrive/turbo-sdk: Latest
- ardrive-core-js: Latest
- @ar.io/wayfinder-core: Latest
- @ar.io/wayfinder-react: Latest

**Node.js Requirements**
- Minimum: Node.js 18.0.0
- Recommended: Node.js 20.x LTS

**TypeScript Requirements**
- Minimum: TypeScript 5.3
- Recommended: TypeScript 5.4+

### F. Security Best Practices

**Wallet Security**
1. Never commit JWK files to version control
2. Use environment variables or secure vaults (e.g., AWS Secrets Manager)
3. Restrict file permissions: `chmod 600 wallet.json`
4. Use separate wallets for development and production
5. For web apps, prefer ArConnect over embedded JWK

**API Key Security**
1. Generate strong random keys for gateway admin APIs
2. Rotate keys regularly
3. Use environment variables, never hardcode
4. Implement rate limiting on admin endpoints

**Data Privacy**
1. Use ArDrive private drives for sensitive data
2. Implement strong password policies for drive encryption
3. Remember: Public drive data is permanent and readable by anyone
4. Consider application-level encryption for additional security

**Smart Contract Interactions**
1. Verify contract process IDs from official sources
2. Test on testnet before mainnet deployment
3. Understand that contract interactions are permanent
4. Implement user confirmations for irreversible actions

### G. Resource Links

**Official Documentation**
- AR.IO Docs: https://docs.ar.io
- AR.IO SDK GitHub: https://github.com/ar-io/ar-io-sdk
- ArDrive Core JS GitHub: https://github.com/ardriveapp/ardrive-core-js
- Turbo SDK GitHub: https://github.com/ardrive/turbo-sdk

**Community & Support**
- AR.IO Discord: https://discord.gg/ario
- Arweave Discord: https://discord.gg/arweave
- Developer Forum: https://community.ar.io

**Tools & Services**
- ArNS Registry: https://arns.app
- Network Portal: https://network.ar.io
- Gateway Explorer: https://gateways.ar.io
- ViewBlock Explorer: https://viewblock.io/arweave

**Educational Resources**
- Arweave Wiki: https://wiki.arweave.net
- AR.IO Blog: https://ar.io/blog
- Developer Hub: https://ar.io/developer-hub

---

## Conclusion

This AR.IO domain expertise skill provides comprehensive, deterministic guidance for building applications on the AR.IO ecosystem. It covers:

✅ Complete SDK API references with exact method signatures
✅ Step-by-step implementation guides for all major operations
✅ Production-ready code examples
✅ Decision trees for choosing the right approach
✅ Troubleshooting procedures for common issues
✅ Configuration references and best practices

Use this skill to confidently guide developers through:
- Uploading and retrieving permanent data
- Registering and managing ArNS names
- Deploying decentralized applications
- Operating AR.IO gateways
- Managing ARIO tokens and smart contracts
- Implementing the Wayfinder protocol

All information is current as of January 2025 and based on official AR.IO documentation and SDK implementations.

For the latest updates, always refer to the official documentation at https://docs.ar.io

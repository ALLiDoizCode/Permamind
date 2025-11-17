---
name: arweave
version: 1.0.0
author: Arweave Community
description: Guide for building applications on Arweave permanent storage network - covering data upload, permaweb deployment, GraphQL queries, wallet management, and protocol fundamentals. Use when working with Arweave base layer storage operations (not AO compute/processes).
tags: ["arweave", "storage", "blockchain", "permaweb", "web3"]
---

# Arweave Storage Skill

## What is Arweave?

Arweave is a permanent, decentralized storage network enabling data storage forever with a single upfront payment. Unlike traditional cloud storage requiring recurring fees, Arweave's "permaweb" ensures data remains permanently accessible.

**Key Properties:**
- **Permanent**: Data cannot be deleted or modified once uploaded
- **Immutable**: Content is cryptographically verified
- **Decentralized**: Stored across a global network of miners
- **Pay-once**: Single upfront payment for perpetual storage (~$3-5 per GB)

## When to Use This Skill

This skill should be used when users need help with:

- Uploading files or data to Arweave permanent storage
- Deploying static websites or applications to the permaweb
- Querying Arweave data using GraphQL or HTTP APIs
- Managing Arweave wallets and transactions
- Understanding Arweave protocol fundamentals (blockweave, transactions, economics)
- Working with gateways and implementing data retrieval
- Implementing ANS-104 bundling strategies
- Integrating ArNS (Arweave Name System) for deployments

**Do NOT use for:**
- AO processes and message passing → Use `ao` skill
- Lua handler development → Use `ao` skill
- AO-specific smart contract patterns → Use `ao` skill
- SmartWeave/Warp contracts → Overview only; reference `ao` skill for implementation

## Core Concepts

### Blockweave Architecture

Arweave uses a unique "blockweave" structure where each block links to:
1. The previous block (like traditional blockchain)
2. A randomly selected earlier block (called a "recall block")

This incentivizes miners to store historical data through **Proof of Access (PoA)** consensus.

### Transaction Types

**Data Transactions** (storing content):
```javascript
{
  data: "actual content or Buffer",
  tags: [
    {name: "Content-Type", value: "text/html"},
    {name: "App-Name", value: "MyApp"}
  ]
}
```

**Transfer Transactions** (sending AR tokens):
```javascript
{
  target: "recipient_address_43_chars",
  quantity: "amount_in_winston"
}
```

### Cost Model

- **Currency**: AR tokens (1 AR = 1,000,000,000,000 winston)
- **Pricing**: One-time payment (~$3-5 per GB as of Nov 2025)
- **Small files**: Free via bundler service free tiers (<100-500KB)
- **Static websites**: Typically <$1 for permanent hosting

Estimate costs before uploading:
```javascript
const arweave = Arweave.init({host: 'arweave.net', port: 443, protocol: 'https'});
const price = await arweave.transactions.getPrice(dataSizeInBytes);
const priceAR = arweave.ar.winstonToAr(price);
```

### Wallet System

Arweave wallets use **JWK (JSON Web Key)** format with 4096-bit RSA-PSS keys.

**Critical Security Rules:**
- ⚠️ Lost wallets can NEVER be recovered
- ⚠️ Private keys cannot be changed
- ⚠️ Never commit JWK files to version control
- ⚠️ Use environment variables for key access in applications

**Address Format**: 43-character Base64URL string derived from public key hash

## Quick Start Workflows

### Upload Data

**Basic upload with arweave-js:**

```javascript
import Arweave from 'arweave';
import fs from 'fs';

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https'
});

const jwk = JSON.parse(fs.readFileSync('wallet.json'));

const transaction = await arweave.createTransaction({
  data: '<html>Hello Permaweb!</html>'
}, jwk);

transaction.addTag('Content-Type', 'text/html');
transaction.addTag('App-Name', 'MyApp');

await arweave.transactions.sign(transaction, jwk);
await arweave.transactions.submit(transaction);

console.log('TX ID:', transaction.id);
console.log('URL: https://arweave.net/' + transaction.id);
```

**For small files (<100KB), use Turbo free tier:**

```javascript
import { TurboFactory } from '@ardrive/turbo-sdk';

const turbo = TurboFactory.authenticated({ privateKey: jwk });

const result = await turbo.uploadFile({
  fileStreamFactory: () => fs.createReadStream('image.png'),
  fileSizeFactory: () => fs.statSync('image.png').size,
});

console.log('TX ID:', result.id);
```

### Retrieve Data

Fetch transaction data and metadata:

```javascript
// Get transaction metadata
const tx = await arweave.transactions.get(transactionId);
const tags = {};
tx.tags.forEach(tag => {
  tags[tag.get('name', {decode: true, string: true})] =
       tag.get('value', {decode: true, string: true});
});

// Get transaction data
const data = await arweave.transactions.getData(transactionId, {
  decode: true,
  string: true
});
```

Access directly via gateway: `https://arweave.net/{transactionId}`

### Deploy Website

**Using permaweb-deploy CLI:**

```bash
npm install -g permaweb-deploy

cat > permaweb.json << EOF
{
  "arnsName": "myapp",
  "buildDir": "build"
}
EOF

npm run build
permaweb-deploy
```

**Using arkb CLI:**

```bash
npm install -g arkb
arkb deploy build --wallet wallet.json
```

For manual deployment with manifest creation, see resource file `deployment-guide.md`.

## Decision Guides

### Upload Method Selection

```
├─ Single small file (<100KB)
│  └─> Turbo free tier (@ardrive/turbo-sdk)
│
├─ Single medium file (100KB-10MB)
│  └─> Direct upload (arweave-js)
│
├─ Single large file (>10MB)
│  └─> Turbo SDK (@ardrive/turbo-sdk)
│
├─ Multiple files (batch upload)
│  └─> ANS-104 bundling (arbundles + Irys/Turbo)
│
├─ Website deployment (many files)
│  └─> CLI tool (permaweb-deploy or arkb)
│
└─ Need payment delegation or identity preservation
   └─> ANS-104 bundling (arbundles)
```

### Gateway Selection and Fallback

Always implement multi-gateway fallback for production:

```javascript
const GATEWAYS = [
  'https://arweave.net',      // Official gateway
  'https://ar-io.net',        // AR.IO network
  'https://g8way.io'          // Additional fallback
];

async function fetchWithFallback(txId) {
  for (const gateway of GATEWAYS) {
    try {
      const response = await fetch(`${gateway}/${txId}`);
      if (response.ok) return await response.text();
    } catch (error) {
      console.warn(`Gateway ${gateway} failed, trying next...`);
    }
  }
  throw new Error('All gateways failed');
}
```

**Gateway Comparison:**
- **arweave.net**: Official, reliable, GraphQL + ArNS support
- **AR.IO Network**: Decentralized, high reliability, excellent performance
- **Goldsky**: Optimized for complex GraphQL queries

### Tool Selection Matrix

| Tool | Upload | Query | Deploy | Bundling | Best For |
|------|--------|-------|--------|----------|----------|
| arweave-js | ✅ | ✅ | Manual | ❌ | Core operations, full control |
| arbundles | ✅ | ❌ | ❌ | ✅ | ANS-104 bundling, identity |
| arkb (CLI) | ✅ | ❌ | ✅ | ❌ | Simple deployments |
| permaweb-deploy | ✅ | ❌ | ✅ | ❌ | Framework-aware deployment |
| Turbo SDK | ✅ | ❌ | ✅ | ✅ | Fast uploads, free tier |
| ar-gql | ❌ | ✅ | ❌ | ❌ | Complex GraphQL queries |
| ArDB | ❌ | ✅ | ❌ | ❌ | Simple queries, easy API |

## Common Operations

### Check Wallet Balance

```javascript
const address = await arweave.wallets.jwkToAddress(jwk);
const balance = await arweave.wallets.getBalance(address);
const balanceAR = arweave.ar.winstonToAr(balance);

console.log(`Address: ${address}`);
console.log(`Balance: ${balanceAR} AR`);
```

### Verify Transaction Status

```javascript
const status = await arweave.transactions.getStatus(transactionId);

if (status.confirmed) {
  console.log(`Confirmed in block: ${status.confirmed.block_height}`);
  console.log(`Confirmations: ${status.confirmed.number_of_confirmations}`);
} else {
  console.log('Transaction pending...');
}
```

### Query Transactions by Tags

```javascript
import { ArDB } from 'ardb';

const ardb = new ArDB(arweave);

const txs = await ardb
  .search('transactions')
  .tag('App-Name', 'MyApp')
  .tag('Content-Type', 'application/json')
  .limit(10)
  .find();

txs.forEach(tx => {
  console.log('TX ID:', tx.id);
  console.log('Owner:', tx.owner.address);
});
```

### Upload Multiple Files with ANS-104 Bundling

```javascript
import { createData, ArweaveSigner } from 'arbundles';
import Irys from '@irys/sdk';

const signer = new ArweaveSigner(jwk);

const dataItem1 = createData('File 1 content', signer, {
  tags: [{name: 'Content-Type', value: 'text/plain'}]
});
await dataItem1.sign(signer);

const dataItem2 = createData('File 2 content', signer, {
  tags: [{name: 'Content-Type', value: 'text/plain'}]
});
await dataItem2.sign(signer);

const irys = new Irys({
  network: 'mainnet',
  token: 'arweave',
  key: jwk,
});

const receipt1 = await irys.upload(dataItem1.raw);
const receipt2 = await irys.upload(dataItem2.raw);

console.log('Item 1:', receipt1.id);
console.log('Item 2:', receipt2.id);
```

## Integration Patterns

### Claude Code Workflow: Upload File

When user requests file upload to Arweave:

1. **Analyze file**: Determine content type, check size, estimate cost
2. **Choose method**: <100KB → Turbo free tier, single file → arweave-js, multiple → bundling
3. **Load wallet**: Check for wallet.json, environment variables, or request from user
4. **Execute upload**: Create transaction with appropriate tags, sign and submit, verify
5. **Report results**: Transaction ID, gateway URLs, confirmation time estimate, cost

### Claude Code Workflow: Deploy Website

When user requests website/app deployment:

1. **Identify project type**: Check package.json, detect framework (React, Vue, Next.js, etc.)
2. **Verify configuration**: Check for permaweb.json, verify build script, ensure relative paths
3. **Execute build**: Run npm build or equivalent
4. **Choose deployment method**: permaweb.json → permaweb-deploy, simple → arkb, complex → manual
5. **Deploy**: Upload files, create manifest, optionally update ArNS
6. **Report**: Manifest TX ID, access URLs, file TX IDs, total cost

### Autonomous Agent Pattern: Robust Upload with Error Handling

```javascript
async function robustUpload(data, jwk, maxRetries = 3) {
  const arweave = Arweave.init({host: 'arweave.net', port: 443, protocol: 'https'});

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const tx = await arweave.createTransaction({ data }, jwk);
      tx.addTag('Content-Type', 'application/octet-stream');

      // Check balance
      const address = await arweave.wallets.jwkToAddress(jwk);
      const balance = await arweave.wallets.getBalance(address);

      if (BigInt(balance) < BigInt(tx.reward)) {
        throw new Error(`Insufficient balance: need ${arweave.ar.winstonToAr(tx.reward)} AR`);
      }

      await arweave.transactions.sign(tx, jwk);
      const response = await arweave.transactions.submit(tx);

      if (response.status === 200) {
        const status = await arweave.transactions.getStatus(tx.id);
        return {
          success: true,
          txId: tx.id,
          cost: arweave.ar.winstonToAr(tx.reward)
        };
      }

      throw new Error(`Upload failed: ${response.status}`);

    } catch (error) {
      console.error(`Attempt ${attempt}/${maxRetries} failed:`, error.message);

      if (attempt === maxRetries) {
        return { success: false, error: error.message };
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }
}
```

## Best Practices

### Security
- Never commit wallet files to version control
- Use environment variables for wallet access
- Implement spending limits for automated systems
- Encrypt wallet backups
- Use separate wallets for development vs production

### Cost Optimization
- Use bundling for multiple files (save 50-70%)
- Leverage free tiers: Turbo <500KB, Irys <100KB
- Compress data before upload when appropriate
- Implement deduplication checks
- Batch operations when possible

### Performance
- Implement gateway fallback with 3+ gateways
- Cache retrieved data (1-hour TTL recommended)
- Use parallel uploads for multiple files
- Use Goldsky for complex GraphQL queries
- Implement retry logic with exponential backoff

### Reliability
- Always verify transaction status after upload
- Store transaction IDs in application database
- Implement comprehensive error handling
- Use ANS-104 for critical identity preservation
- Test on testnet before production deployment

## Common Pitfalls and Solutions

### 1. Forgetting Data is Permanent

**Problem**: Uploading sensitive or incorrect data that cannot be deleted

**Solution**: Always preview data before upload, use testnet for testing, implement confirmation prompts

### 2. Insufficient Wallet Balance

**Problem**: Transaction fails due to insufficient AR tokens

**Solution**: Always check balance before upload:
```javascript
const address = await arweave.wallets.jwkToAddress(jwk);
const balance = await arweave.wallets.getBalance(address);
const price = await arweave.transactions.getPrice(dataSize);

if (BigInt(balance) < BigInt(price)) {
  throw new Error(`Need ${arweave.ar.winstonToAr(price)} AR, have ${arweave.ar.winstonToAr(balance)} AR`);
}
```

### 3. Not Waiting for Confirmation

**Problem**: Assuming data is immediately available after submission

**Solution**: Poll for confirmation:
```javascript
async function waitForConfirmation(txId, maxMinutes = 10) {
  const startTime = Date.now();
  const maxTime = maxMinutes * 60 * 1000;

  while (Date.now() - startTime < maxTime) {
    const status = await arweave.transactions.getStatus(txId);
    if (status.confirmed && status.confirmed.number_of_confirmations >= 5) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 30000));
  }
  return false;
}
```

### 4. Single Gateway Dependency

**Problem**: Application breaks when gateway is down

**Solution**: Implement multi-gateway fallback (see Gateway Selection section)

### 5. Missing Essential Tags

**Problem**: Data is difficult to query or render properly

**Solution**: Always include essential tags:
```javascript
transaction.addTag('Content-Type', mimeType);      // Required for rendering
transaction.addTag('App-Name', 'MyApp');           // For filtering
transaction.addTag('App-Version', '1.0.0');        // For versioning
transaction.addTag('Unix-Time', Date.now().toString()); // For temporal queries
```

### 6. Absolute Paths in Web Deployments

**Problem**: Deployed website has broken links

**Solution**: Configure build for relative paths:
```javascript
// Create React App: package.json
"homepage": "."

// Vite: vite.config.js
base: './'

// Next.js: next.config.js
module.exports = {
  output: 'export',
  basePath: '',
  assetPrefix: '',
  trailingSlash: true
}
```

## Relationship to Other Skills

This skill focuses on **base layer storage and data operations**.

**Use Arweave skill for**:
- Uploading and storing data permanently
- Deploying static websites and applications
- Querying and retrieving stored data
- Managing wallets and transactions

**Use AO skill for**:
- Running stateful processes and applications
- Writing Lua handlers for message processing
- Implementing smart contract logic
- Using aoconnect for process interaction

**When in doubt**: Storage operations → Arweave skill; Processing/compute → AO skill

## Skill Resources

Reference files for detailed information:

**Essential Resources** (`resources/` directory):
- `arweave-api-reference.md` - Complete arweave-js API documentation
- `upload-guide.md` - Detailed upload strategies, ANS-104 bundling, cost optimization
- `query-guide.md` - GraphQL query reference, pagination, caching strategies

Load these resources when users need detailed implementation guidance beyond the quick start workflows above.

---

**Version**: 1.0.0
**Last Updated**: November 14, 2025
**Primary Library**: arweave-js ^1.14.0

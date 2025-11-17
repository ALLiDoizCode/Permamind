# Arweave Upload Guide

Comprehensive guide to uploading data to Arweave with different methods, cost optimization strategies, and ANS-104 bundling.

## Upload Methods Comparison

### Three Primary Approaches

| Method | Best For | Pros | Cons | Cost |
|--------|----------|------|------|------|
| **Direct Upload**<br>(arweave-js) | Single files, full control | Simple, no dependencies, direct | Slower for batches | Base price |
| **ANS-104 Bundling**<br>(arbundles) | Multiple files, identity preservation | Efficient batching, 50-70% savings | More complex | Base + 5% |
| **Bundler Services**<br>(Turbo/Irys) | Large files, production apps | Fast, reliable, free tiers | External dependency | Base + 5% |

## Method 1: Direct Upload with arweave-js

### Basic Upload

```javascript
import Arweave from 'arweave';
import fs from 'fs';

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https'
});

// Load wallet
const jwk = JSON.parse(fs.readFileSync('wallet.json'));

// Create transaction
const transaction = await arweave.createTransaction({
  data: '<html>Hello Permaweb!</html>'
}, jwk);

// Add tags for metadata
transaction.addTag('Content-Type', 'text/html');
transaction.addTag('App-Name', 'MyApp');
transaction.addTag('App-Version', '1.0.0');

// Sign and submit
await arweave.transactions.sign(transaction, jwk);
const response = await arweave.transactions.submit(transaction);

console.log('Transaction ID:', transaction.id);
console.log('Access at: https://arweave.net/' + transaction.id);
```

### Upload Binary Files

```javascript
// Upload image
const imageData = fs.readFileSync('photo.jpg');

const tx = await arweave.createTransaction({
  data: imageData
}, jwk);

tx.addTag('Content-Type', 'image/jpeg');
tx.addTag('File-Name', 'photo.jpg');

await arweave.transactions.sign(tx, jwk);
await arweave.transactions.submit(tx);

console.log('Image TX:', tx.id);
```

### Cost Estimation Before Upload

```javascript
async function estimateAndUpload(data, jwk) {
  const arweave = Arweave.init({host: 'arweave.net', port: 443, protocol: 'https'});

  // Get price for data size
  const dataBuffer = Buffer.from(data);
  const price = await arweave.transactions.getPrice(dataBuffer.length);
  const priceAR = arweave.ar.winstonToAr(price);

  console.log(`Data size: ${dataBuffer.length} bytes`);
  console.log(`Cost: ${priceAR} AR (~$${(parseFloat(priceAR) * 5).toFixed(4)} USD)`);

  // Check wallet balance
  const address = await arweave.wallets.jwkToAddress(jwk);
  const balance = await arweave.wallets.getBalance(address);
  const balanceAR = arweave.ar.winstonToAr(balance);

  console.log(`Wallet balance: ${balanceAR} AR`);

  if (BigInt(balance) < BigInt(price)) {
    throw new Error(`Insufficient balance. Need ${priceAR} AR, have ${balanceAR} AR`);
  }

  // Proceed with upload
  const tx = await arweave.createTransaction({ data: dataBuffer }, jwk);
  tx.addTag('Content-Type', 'text/plain');

  await arweave.transactions.sign(tx, jwk);
  await arweave.transactions.submit(tx);

  return tx.id;
}
```

### Production Upload with Error Handling

```javascript
async function robustUpload(data, tags, jwk, maxRetries = 3) {
  const arweave = Arweave.init({host: 'arweave.net', port: 443, protocol: 'https'});

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Check balance
      const address = await arweave.wallets.jwkToAddress(jwk);
      const balance = await arweave.wallets.getBalance(address);
      const price = await arweave.transactions.getPrice(data.length);

      if (BigInt(balance) < BigInt(price)) {
        return {
          success: false,
          error: 'Insufficient balance',
          required: arweave.ar.winstonToAr(price),
          available: arweave.ar.winstonToAr(balance)
        };
      }

      // Create and sign transaction
      const tx = await arweave.createTransaction({ data }, jwk);

      // Add tags
      Object.entries(tags).forEach(([name, value]) => {
        tx.addTag(name, value);
      });

      await arweave.transactions.sign(tx, jwk);

      // Submit
      const response = await arweave.transactions.submit(tx);

      if (response.status === 200) {
        return {
          success: true,
          txId: tx.id,
          cost: arweave.ar.winstonToAr(tx.reward)
        };
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    } catch (error) {
      console.error(`Attempt ${attempt}/${maxRetries} failed:`, error.message);

      if (attempt === maxRetries) {
        return {
          success: false,
          error: error.message,
          attempts: attempt
        };
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }
}

// Usage
const result = await robustUpload(
  Buffer.from('My data'),
  {
    'Content-Type': 'text/plain',
    'App-Name': 'MyApp'
  },
  jwk
);

if (result.success) {
  console.log('Uploaded:', result.txId);
} else {
  console.error('Failed:', result.error);
}
```

## Method 2: ANS-104 Bundling

### What is ANS-104?

ANS-104 is a specification for bundling multiple independent "DataItems" into a single parent transaction.

**Key Benefits:**
- **Scaling**: Batch multiple uploads (4000% throughput increase)
- **Cost Efficiency**: Share base transaction cost across items (50-70% savings)
- **Payment Delegation**: Third party pays while creator maintains identity
- **Identity Preservation**: Each DataItem signed by original creator

### DataItem vs Regular Transaction

| Aspect | DataItem | Regular Transaction |
|--------|----------|-------------------|
| Token Transfer | ❌ Cannot transfer AR | ✅ Can transfer AR |
| Reward | ❌ No individual reward | ✅ Individual mining reward |
| Nesting | ✅ Can nest bundles | ❌ Cannot nest |
| Indexing | Indexed by bundlers | Indexed on-chain |

### Creating Bundles with arbundles

```bash
npm install arbundles
```

```javascript
import { bundleAndSignData, createData, ArweaveSigner } from 'arbundles';
import Arweave from 'arweave';
import fs from 'fs';

const arweave = Arweave.init({host: 'arweave.net', port: 443, protocol: 'https'});
const jwk = JSON.parse(fs.readFileSync('wallet.json'));
const signer = new ArweaveSigner(jwk);

// Create individual DataItems
const dataItem1 = createData('First document content', signer, {
  tags: [
    {name: 'Content-Type', value: 'text/plain'},
    {name: 'Title', value: 'Document 1'}
  ]
});
await dataItem1.sign(signer);

const dataItem2 = createData('Second document content', signer, {
  tags: [
    {name: 'Content-Type', value: 'text/plain'},
    {name: 'Title', value: 'Document 2'}
  ]
});
await dataItem2.sign(signer);

const dataItem3 = createData('Third document content', signer, {
  tags: [
    {name: 'Content-Type', value: 'text/plain'},
    {name: 'Title', value: 'Document 3'}
  ]
});
await dataItem3.sign(signer);

// Create bundle
const bundle = await bundleAndSignData([dataItem1, dataItem2, dataItem3], signer);

// Upload bundle as Arweave transaction
const tx = await arweave.createTransaction({ data: bundle.getRaw() });
tx.addTag('Bundle-Format', 'binary');
tx.addTag('Bundle-Version', '2.0.0');

await arweave.transactions.sign(tx, jwk);
await arweave.transactions.submit(tx);

console.log('Bundle TX:', tx.id);
console.log('DataItem 1:', dataItem1.id, '→ https://arweave.net/' + dataItem1.id);
console.log('DataItem 2:', dataItem2.id, '→ https://arweave.net/' + dataItem2.id);
console.log('DataItem 3:', dataItem3.id, '→ https://arweave.net/' + dataItem3.id);
```

### Payment Delegation Example

```javascript
// Creator signs their content
const creatorJwk = JSON.parse(fs.readFileSync('creator-wallet.json'));
const creatorSigner = new ArweaveSigner(creatorJwk);

const creatorContent = createData('My creative work', creatorSigner, {
  tags: [
    {name: 'Content-Type', value: 'text/plain'},
    {name: 'Creator', value: 'Artist Name'},
    {name: 'License', value: 'CC-BY-4.0'}
  ]
});
await creatorContent.sign(creatorSigner);

// Platform bundles and pays for upload
const platformJwk = JSON.parse(fs.readFileSync('platform-wallet.json'));
const platformSigner = new ArweaveSigner(platformJwk);

const bundle = await bundleAndSignData([creatorContent], platformSigner);

// Platform uploads and pays
const tx = await arweave.createTransaction({ data: bundle.getRaw() }, platformJwk);
tx.addTag('Bundle-Format', 'binary');
tx.addTag('Bundle-Version', '2.0.0');
tx.addTag('Platform', 'ContentPlatform');

await arweave.transactions.sign(tx, platformJwk);
await arweave.transactions.submit(tx);

// Content is permanently attributed to creator, but platform paid for storage
console.log('Creator content:', creatorContent.id);
```

### Tag Constraints

ANS-104 enforces strict tag rules:
- Maximum **128 tags** per DataItem
- Each key ≤ **1024 bytes**
- Each value ≤ **3072 bytes**
- Keys and values must be non-empty UTF-8 strings

```javascript
// Valid tags
dataItem.addTag('Content-Type', 'application/json');
dataItem.addTag('App-Name', 'MyApp');

// Invalid - will throw error
dataItem.addTag('', 'empty key not allowed');
dataItem.addTag('Key', '');  // empty value not allowed
dataItem.addTag('Key', 'x'.repeat(4000));  // exceeds 3072 bytes
```

## Method 3: Bundler Services

### Turbo (ArDrive)

**Best for**: ArNS deployments, credit card payments, <500KB files

```bash
npm install @ardrive/turbo-sdk
```

```javascript
import { TurboFactory } from '@ardrive/turbo-sdk';
import fs from 'fs';

const turbo = TurboFactory.authenticated({
  privateKey: jwk
});

// Upload single file
const result = await turbo.uploadFile({
  fileStreamFactory: () => fs.createReadStream('document.pdf'),
  fileSizeFactory: () => fs.statSync('document.pdf').size,
  dataItemOpts: {
    tags: [
      {name: 'Content-Type', value: 'application/pdf'},
      {name: 'Title', value: 'My Document'},
      {name: 'Author', value: 'John Doe'}
    ]
  }
});

console.log('Uploaded:', result.id);
console.log('URL: https://arweave.net/' + result.id);
```

#### Turbo Features

- **Free Tier**: Files <500KB
- **Payment**: Credit card, AR tokens, Turbo Credits
- **Performance**: Fast, optimized for ArDrive ecosystem
- **ArNS Integration**: Built-in support for Arweave Name System

### Irys (formerly Bundlr)

**Best for**: High-volume apps, multi-chain payments, <100KB free tier

```bash
npm install @irys/sdk
```

```javascript
import Irys from '@irys/sdk';

const irys = new Irys({
  network: 'mainnet',
  token: 'arweave',  // or 'ethereum', 'solana', 'matic', etc.
  key: jwk,
});

// Upload data
const receipt = await irys.upload('Hello Arweave!', {
  tags: [
    {name: 'Content-Type', value: 'text/plain'},
    {name: 'App-Name', value: 'MyApp'}
  ]
});

console.log('Uploaded:', receipt.id);
```

#### Irys Features

- **Free Tier**: Files <100KB
- **Multi-chain**: ETH, SOL, MATIC, DOT, AR, and more
- **Market Share**: 90-98% of Arweave uploads
- **Battle-tested**: High-volume production infrastructure

### Service Comparison

| Feature | Turbo | Irys |
|---------|-------|------|
| Free Tier | <500KB | <100KB |
| Payment Methods | Credit card, AR, Turbo Credits | ETH, SOL, MATIC, DOT, AR, etc. |
| Cost Premium | ~5% over base | ~5% over base |
| Best For | Websites, ArNS, simple apps | High-volume, multi-chain |
| Market Share | Growing | 90%+ dominance |

## Cost Optimization Strategies

### 1. Use ANS-104 Bundling for Multiple Files

**Savings**: 50-70% for 10+ files

```javascript
// Without bundling: 10 files = 10 transactions
// Base cost per TX: ~0.0001 AR
// Total: 10 × 0.0001 = 0.001 AR

// With bundling: 10 files = 1 transaction + 10 data items
// Base cost: 1 × 0.0001 AR + data cost
// Total: ~0.0003 AR (70% savings)
```

### 2. Leverage Free Tiers

```javascript
// Strategy: Split uploads to maximize free tier usage

async function optimizedUpload(files, jwk) {
  const turbo = TurboFactory.authenticated({ privateKey: jwk });

  for (const file of files) {
    const stats = fs.statSync(file);

    if (stats.size < 500 * 1024) {
      // Use Turbo free tier
      await turbo.uploadFile({
        fileStreamFactory: () => fs.createReadStream(file),
        fileSizeFactory: () => stats.size
      });
      console.log(`${file}: FREE via Turbo`);
    } else {
      // Use arweave-js for larger files
      const data = fs.readFileSync(file);
      const tx = await arweave.createTransaction({ data }, jwk);
      await arweave.transactions.sign(tx, jwk);
      await arweave.transactions.submit(tx);
      console.log(`${file}: Paid upload`);
    }
  }
}
```

### 3. Compress Data Before Upload

```javascript
import zlib from 'zlib';

const original = fs.readFileSync('large-file.json');
console.log('Original size:', original.length, 'bytes');

const compressed = zlib.gzipSync(original, { level: 9 });
console.log('Compressed size:', compressed.length, 'bytes');
console.log('Savings:', ((1 - compressed.length / original.length) * 100).toFixed(1) + '%');

const tx = await arweave.createTransaction({ data: compressed }, jwk);
tx.addTag('Content-Type', 'application/json');
tx.addTag('Content-Encoding', 'gzip');

await arweave.transactions.sign(tx, jwk);
await arweave.transactions.submit(tx);
```

### 4. Implement Deduplication

```javascript
import crypto from 'crypto';

// Check if content already exists before uploading
async function uploadWithDedup(data, jwk, cache = new Map()) {
  // Generate content hash
  const hash = crypto.createHash('sha256').update(data).digest('hex');

  // Check if already uploaded
  if (cache.has(hash)) {
    console.log('Content already uploaded:', cache.get(hash));
    return cache.get(hash);
  }

  // Upload new content
  const tx = await arweave.createTransaction({ data }, jwk);
  tx.addTag('Content-Type', 'text/plain');
  tx.addTag('Content-SHA256', hash);

  await arweave.transactions.sign(tx, jwk);
  await arweave.transactions.submit(tx);

  // Cache for future
  cache.set(hash, tx.id);

  return tx.id;
}
```

### 5. Batch Operations

```javascript
// Accumulate uploads and batch daily
class UploadBatcher {
  constructor(jwk) {
    this.jwk = jwk;
    this.signer = new ArweaveSigner(jwk);
    this.pendingItems = [];
  }

  addItem(data, tags) {
    const item = createData(data, this.signer, { tags });
    this.pendingItems.push(item);
  }

  async flush() {
    if (this.pendingItems.length === 0) return;

    console.log(`Bundling ${this.pendingItems.length} items...`);

    // Sign all items
    for (const item of this.pendingItems) {
      await item.sign(this.signer);
    }

    // Create bundle
    const bundle = await bundleAndSignData(this.pendingItems, this.signer);

    // Upload
    const arweave = Arweave.init({host: 'arweave.net', port: 443, protocol: 'https'});
    const tx = await arweave.createTransaction({ data: bundle.getRaw() }, this.jwk);
    tx.addTag('Bundle-Format', 'binary');
    tx.addTag('Bundle-Version', '2.0.0');

    await arweave.transactions.sign(tx, this.jwk);
    await arweave.transactions.submit(tx);

    console.log('Batch uploaded:', tx.id);

    this.pendingItems = [];
  }
}

// Usage
const batcher = new UploadBatcher(jwk);

batcher.addItem('Document 1', [{name: 'Title', value: 'Doc 1'}]);
batcher.addItem('Document 2', [{name: 'Title', value: 'Doc 2'}]);
batcher.addItem('Document 3', [{name: 'Title', value: 'Doc 3'}]);

await batcher.flush();  // Uploads all 3 in one bundle
```

## Decision Tree: Choose Upload Method

```
START
  │
  ├─ Single file?
  │  ├─ YES
  │  │  ├─ Size <100KB?
  │  │  │  ├─ YES → Use Turbo free tier
  │  │  │  └─ NO
  │  │  │     ├─ Size <10MB?
  │  │  │     │  ├─ YES → Use arweave-js direct upload
  │  │  │     │  └─ NO → Use Turbo SDK
  │  │  │     └─
  │  └─
  │
  └─ Multiple files?
     ├─ YES
     │  ├─ Need identity preservation?
     │  │  ├─ YES → ANS-104 bundling (arbundles)
     │  │  └─ NO
     │  │     ├─ Deploying website?
     │  │     │  ├─ YES → CLI tool (permaweb-deploy/arkb)
     │  │     │  └─ NO → Turbo batch upload
     │  │     └─
     │  └─
     └─
```

## Common Patterns

### Upload with Progress Tracking

```javascript
async function uploadWithProgress(filePath, jwk) {
  const stats = fs.statSync(filePath);
  const data = fs.readFileSync(filePath);

  console.log(`📁 File: ${path.basename(filePath)}`);
  console.log(`📊 Size: ${(stats.size / 1024).toFixed(2)} KB`);

  const price = await arweave.transactions.getPrice(stats.size);
  console.log(`💰 Cost: ${arweave.ar.winstonToAr(price)} AR`);

  console.log('🔐 Signing...');
  const tx = await arweave.createTransaction({ data }, jwk);
  tx.addTag('Content-Type', mime.lookup(filePath) || 'application/octet-stream');
  await arweave.transactions.sign(tx, jwk);

  console.log('📤 Uploading...');
  await arweave.transactions.submit(tx);

  console.log('✅ Success!');
  console.log(`🔗 TX ID: ${tx.id}`);
  console.log(`🌐 URL: https://arweave.net/${tx.id}`);

  return tx.id;
}
```

### Parallel Upload for Multiple Files

```javascript
async function uploadMultipleParallel(files, jwk) {
  const uploadPromises = files.map(async (file) => {
    const data = fs.readFileSync(file);
    const tx = await arweave.createTransaction({ data }, jwk);
    tx.addTag('Content-Type', mime.lookup(file) || 'application/octet-stream');
    tx.addTag('File-Name', path.basename(file));

    await arweave.transactions.sign(tx, jwk);
    await arweave.transactions.submit(tx);

    return { file, txId: tx.id };
  });

  const results = await Promise.all(uploadPromises);

  results.forEach(({ file, txId }) => {
    console.log(`${file} → ${txId}`);
  });

  return results;
}
```

---

**Version**: 1.0.0
**Last Updated**: November 14, 2025

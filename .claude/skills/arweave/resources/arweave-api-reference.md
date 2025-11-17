# Arweave.js API Reference

Complete reference for the arweave-js library - the official JavaScript/TypeScript SDK for interacting with the Arweave network.

## Installation

```bash
npm install arweave
```

## Initialization

```javascript
import Arweave from 'arweave';

// Connect to arweave.net (mainnet)
const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https'
});

// Connect to custom gateway
const customArweave = Arweave.init({
  host: 'ar-io.net',
  port: 443,
  protocol: 'https',
  timeout: 20000,  // 20 seconds timeout
  logging: false   // Disable logging
});

// Local development node
const localArweave = Arweave.init({
  host: '127.0.0.1',
  port: 1984,
  protocol: 'http'
});
```

## Wallet Operations

### `arweave.wallets.*`

#### Generate New Wallet

```javascript
const jwk = await arweave.wallets.generate();
// Returns JWK object with 4096-bit RSA-PSS keys
```

#### Get Address from JWK

```javascript
const address = await arweave.wallets.jwkToAddress(jwk);
// Returns: 43-character Base64URL string
```

#### Get Address from Public Key

```javascript
const address = await arweave.wallets.ownerToAddress(ownerPublicKey);
// ownerPublicKey: Base64URL encoded public key from transaction
```

#### Get Wallet Balance

```javascript
const balance = await arweave.wallets.getBalance(address);
// Returns: Balance in winston as string (e.g., "1000000000000")

// Convert to AR
const balanceAR = arweave.ar.winstonToAr(balance);
```

#### Get Last Transaction ID

```javascript
const lastTx = await arweave.wallets.getLastTransactionID(address);
// Returns: Transaction ID string or empty string if no transactions
```

## Transaction Creation

### `arweave.createTransaction()`

#### Data Transaction

```javascript
// String data
const tx = await arweave.createTransaction({
  data: 'Hello Permaweb!'
}, jwk);

// Buffer data (for files)
const fileData = fs.readFileSync('image.png');
const tx = await arweave.createTransaction({
  data: fileData
}, jwk);

// HTML content
const tx = await arweave.createTransaction({
  data: '<html><body>My Page</body></html>'
}, jwk);
```

#### Transfer Transaction

```javascript
const tx = await arweave.createTransaction({
  target: 'recipient_address_43_chars',
  quantity: arweave.ar.arToWinston('1.5')  // Send 1.5 AR
}, jwk);
```

#### Combined Data + Transfer

```javascript
const tx = await arweave.createTransaction({
  data: 'some content',
  target: 'recipient_address',
  quantity: arweave.ar.arToWinston('0.1')
}, jwk);
```

## Transaction Operations

### `arweave.transactions.*`

#### Sign Transaction

```javascript
await arweave.transactions.sign(transaction, jwk);
// Modifies transaction in-place, adds signature
```

#### Verify Transaction Signature

```javascript
const isValid = await arweave.transactions.verify(transaction);
// Returns: boolean
```

#### Submit Transaction

```javascript
const response = await arweave.transactions.submit(transaction);
// Returns: { status: 200, statusText: 'OK', data: {...} }

// Check if successful
if (response.status === 200) {
  console.log('Transaction submitted:', transaction.id);
}
```

#### Get Transaction by ID

```javascript
const tx = await arweave.transactions.get(txId);
// Returns: Transaction object

// Access transaction fields
console.log('Owner:', tx.owner);
console.log('Data size:', tx.data_size);
console.log('Reward:', tx.reward);

// Access tags
tx.tags.forEach(tag => {
  const name = tag.get('name', {decode: true, string: true});
  const value = tag.get('value', {decode: true, string: true});
  console.log(`${name}: ${value}`);
});
```

#### Get Transaction Status

```javascript
const status = await arweave.transactions.getStatus(txId);

// Confirmed transaction
if (status.confirmed) {
  console.log('Block height:', status.confirmed.block_height);
  console.log('Block hash:', status.confirmed.block_indep_hash);
  console.log('Confirmations:', status.confirmed.number_of_confirmations);
} else {
  console.log('Transaction pending or not found');
}
```

#### Get Transaction Data

```javascript
// Get as string
const data = await arweave.transactions.getData(txId, {
  decode: true,  // Decode from Base64
  string: true   // Convert to string
});

// Get as Uint8Array (for binary data)
const binaryData = await arweave.transactions.getData(txId, {
  decode: true,
  string: false
});

// Get raw Base64URL
const rawData = await arweave.transactions.getData(txId);
```

#### Get Transaction Price

```javascript
// Basic price for data size
const price = await arweave.transactions.getPrice(dataSizeInBytes);
// Returns: Price in winston as string

// Price with target (transfer + data)
const priceWithTarget = await arweave.transactions.getPrice(
  dataSizeInBytes,
  targetAddress
);

// Convert to AR
const priceAR = arweave.ar.winstonToAr(price);
console.log(`Cost: ${priceAR} AR`);
```

#### Add Tags to Transaction

```javascript
transaction.addTag('Content-Type', 'text/html');
transaction.addTag('App-Name', 'MyApp');
transaction.addTag('App-Version', '1.0.0');
transaction.addTag('Title', 'My Document');
transaction.addTag('Description', 'A sample document');
```

## Block Operations

### `arweave.blocks.*`

#### Get Current Block

```javascript
const currentBlock = await arweave.blocks.getCurrent();
// Returns: Block object with current network state
```

#### Get Block by Hash

```javascript
const block = await arweave.blocks.get(blockIndepHash);
// Returns: Block object

console.log('Height:', block.height);
console.log('Timestamp:', block.timestamp);
console.log('Transactions:', block.txs.length);
```

## Network Operations

### `arweave.network.*`

#### Get Network Info

```javascript
const info = await arweave.network.getInfo();

console.log('Network:', info.network);       // 'arweave.N.1'
console.log('Version:', info.version);       // Protocol version
console.log('Height:', info.height);         // Current block height
console.log('Current:', info.current);       // Current block hash
console.log('Blocks:', info.blocks);         // Total blocks
console.log('Peers:', info.peers);           // Connected peers
```

## AR/Winston Conversion

### `arweave.ar.*`

1 AR = 1,000,000,000,000 winston (1 trillion)

#### AR to Winston

```javascript
const winston = arweave.ar.arToWinston('1.5');
// Returns: '1500000000000'

// With decimals
const winston2 = arweave.ar.arToWinston('0.000000001');
// Returns: '1000'
```

#### Winston to AR

```javascript
const ar = arweave.ar.winstonToAr('1500000000000');
// Returns: '1.5'

const ar2 = arweave.ar.winstonToAr('1000');
// Returns: '0.000000001'
```

#### Compare Amounts

```javascript
// Returns -1, 0, or 1 (like strcmp)
const comparison = arweave.ar.compare(amount1, amount2);

if (comparison === -1) {
  console.log('amount1 < amount2');
} else if (comparison === 0) {
  console.log('amount1 == amount2');
} else {
  console.log('amount1 > amount2');
}
```

#### Greater Than / Less Than

```javascript
const isGreater = arweave.ar.isGreaterThan(amount1, amount2);
// Returns: boolean

const isLess = arweave.ar.isLessThan(amount1, amount2);
// Returns: boolean

// Example: Check if balance is sufficient
if (arweave.ar.isGreaterThan(balance, price)) {
  console.log('Sufficient balance');
}
```

## Utility Functions

### `arweave.utils.*`

#### Concatenate Buffers

```javascript
const combined = arweave.utils.concatBuffers([buffer1, buffer2, buffer3]);
```

#### String ↔ Buffer Conversion

```javascript
// String to Buffer
const buffer = arweave.utils.stringToBuffer('Hello Arweave');

// Buffer to String
const string = arweave.utils.bufferToString(buffer);
```

#### Base64URL Encoding/Decoding

```javascript
// Encode Buffer to Base64URL
const encoded = arweave.utils.bufferTob64Url(buffer);

// Decode Base64URL to Buffer
const decoded = arweave.utils.b64UrlToBuffer(encoded);
```

#### Base64 Encoding/Decoding

```javascript
// Standard Base64 (not URL-safe)
const b64 = arweave.utils.bufferTob64(buffer);
const buffer2 = arweave.utils.b64ToBuffer(b64);
```

## Transaction Object Structure

```javascript
const transaction = {
  // Transaction identifier (SHA-256 hash)
  id: 'tx_id_string_43_chars',

  // Last transaction ID from sending wallet (for nonce)
  last_tx: 'last_tx_id_or_block_hash',

  // Base64URL encoded RSA public key
  owner: 'base64url_encoded_public_key',

  // Metadata tags
  tags: [
    {
      name: 'base64url_tag_name',
      value: 'base64url_tag_value',
      get: function(field, options) { /* ... */ }
    }
  ],

  // Recipient address (empty for data-only transactions)
  target: 'recipient_address_43_chars_or_empty',

  // Amount in winston (0 for data-only)
  quantity: 'amount_in_winston_string',

  // Base64URL encoded data
  data: 'base64url_encoded_data',

  // Data size in bytes
  data_size: 'size_in_bytes_string',

  // Merkle root of data tree
  data_root: 'merkle_root_hash',

  // Mining reward in winston
  reward: 'reward_in_winston_string',

  // RSA-PSS signature
  signature: 'base64url_encoded_signature'
};
```

### Transaction Helper Methods

```javascript
// Add tag
transaction.addTag(name, value);

// Get field (with decoding options)
const ownerAddr = transaction.get('owner', {decode: true, string: true});
```

## Complete Upload Example

```javascript
import Arweave from 'arweave';
import fs from 'fs';

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https'
});

async function uploadFile(filePath, jwk) {
  // Read file
  const data = fs.readFileSync(filePath);
  const stats = fs.statSync(filePath);

  // Get price estimate
  const price = await arweave.transactions.getPrice(stats.size);
  const priceAR = arweave.ar.winstonToAr(price);
  console.log(`Estimated cost: ${priceAR} AR`);

  // Check balance
  const address = await arweave.wallets.jwkToAddress(jwk);
  const balance = await arweave.wallets.getBalance(address);

  if (arweave.ar.isLessThan(balance, price)) {
    throw new Error('Insufficient balance');
  }

  // Create transaction
  const tx = await arweave.createTransaction({ data }, jwk);

  // Add tags
  tx.addTag('Content-Type', 'image/png');
  tx.addTag('File-Name', path.basename(filePath));

  // Sign and submit
  await arweave.transactions.sign(tx, jwk);
  const response = await arweave.transactions.submit(tx);

  if (response.status === 200) {
    console.log('Success! TX ID:', tx.id);
    console.log('View at: https://arweave.net/' + tx.id);
    return tx.id;
  } else {
    throw new Error(`Upload failed: ${response.status}`);
  }
}
```

## Complete Query Example

```javascript
async function getTransactionWithData(txId) {
  // Get transaction metadata
  const tx = await arweave.transactions.get(txId);

  // Parse tags
  const tags = {};
  tx.tags.forEach(tag => {
    const name = tag.get('name', {decode: true, string: true});
    const value = tag.get('value', {decode: true, string: true});
    tags[name] = value;
  });

  // Get status
  const status = await arweave.transactions.getStatus(txId);

  // Get data (choose string or binary based on content type)
  let data;
  if (tags['Content-Type']?.startsWith('text/')) {
    data = await arweave.transactions.getData(txId, {
      decode: true,
      string: true
    });
  } else {
    data = await arweave.transactions.getData(txId, {
      decode: true,
      string: false
    });
  }

  return {
    id: txId,
    owner: await arweave.wallets.ownerToAddress(tx.owner),
    tags,
    dataSize: tx.data_size,
    confirmed: status.confirmed?.block_height,
    data
  };
}
```

## Error Handling

```javascript
async function safeUpload(data, jwk) {
  try {
    const tx = await arweave.createTransaction({ data }, jwk);
    tx.addTag('Content-Type', 'text/plain');

    await arweave.transactions.sign(tx, jwk);
    const response = await arweave.transactions.submit(tx);

    if (response.status === 200) {
      return { success: true, txId: tx.id };
    } else {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

## Best Practices

1. **Always check balance before uploading**:
```javascript
const balance = await arweave.wallets.getBalance(address);
const price = await arweave.transactions.getPrice(dataSize);
if (arweave.ar.isLessThan(balance, price)) {
  throw new Error('Insufficient funds');
}
```

2. **Always add Content-Type tag**:
```javascript
transaction.addTag('Content-Type', 'text/html');  // Required for proper rendering
```

3. **Implement retry logic for submissions**:
```javascript
async function submitWithRetry(tx, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await arweave.transactions.submit(tx);
      if (response.status === 200) return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}
```

4. **Wait for confirmation before assuming success**:
```javascript
async function waitForConfirmation(txId, maxWaitMinutes = 10) {
  const maxAttempts = maxWaitMinutes * 2;  // Check every 30 seconds

  for (let i = 0; i < maxAttempts; i++) {
    const status = await arweave.transactions.getStatus(txId);
    if (status.confirmed) {
      return true;
    }
    await new Promise(r => setTimeout(r, 30000));
  }
  return false;
}
```

## TypeScript Types

```typescript
import Arweave from 'arweave';
import type { JWKInterface } from 'arweave/node/lib/wallet';
import type Transaction from 'arweave/node/lib/transaction';

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https'
});

const jwk: JWKInterface = JSON.parse(fs.readFileSync('wallet.json', 'utf-8'));
const tx: Transaction = await arweave.createTransaction({ data: 'hello' }, jwk);
```

---

**Version**: 1.0.0
**Library**: arweave@^1.14.0
**Last Updated**: November 14, 2025

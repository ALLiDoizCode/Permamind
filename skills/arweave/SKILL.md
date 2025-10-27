---
name: arweave
version: 1.1.0
author: Permamind Team
description: Master Arweave permanent storage - build Permaweb apps with transaction management, wallet security, gateway integration, data retrieval, and production-ready best practices for decentralized applications
tags: ["arweave", "storage", "blockchain", "permaweb", "permanent-storage"]
dependencies: []
---

# Arweave Permanent Storage Skill

## What is Arweave?

**Arweave** is a permanent, decentralized storage network that enables pay-once, store-forever data persistence. Unlike traditional cloud storage requiring recurring payments, Arweave uses an endowment-based model where a single upfront fee guarantees permanent storage.

**Key Characteristics:**

- **Permanent Storage**: Data stored indefinitely via economic incentives
- **Content-Addressed**: Each transaction gets a unique immutable 43-character transaction ID (TXID)
- **Decentralized Network**: Distributed across nodes ensuring availability and censorship resistance
- **Pay-Once Model**: One-time upload fee based on data size (no recurring costs)
- **Gateway Access**: HTTP layer for easy data retrieval and submission

**Core Components:**

1. **Transactions**: Cryptographically signed data bundles with metadata tags
2. **Wallets**: JWK (JSON Web Key) format for authentication and signatures
3. **Gateways**: HTTP access layer to the Arweave blockchain
4. **Transaction IDs**: Unique identifiers for permanent content addressing

**Permanence Guarantee:**

Arweave's economic model ensures data permanence through a storage endowment fund. When you pay for storage, the fee goes into an endowment that covers future storage costs in perpetuity as hardware costs decline over time.

## When to Use This Skill

**Activate this skill when you're working on:**

### 🏗️ Building Permaweb Applications
- Creating permanent websites, dApps, or content platforms on Arweave
- Deploying decentralized applications with permanent data storage
- Building NFT platforms, decentralized social networks, or content distribution systems
- Implementing permanent documentation, knowledge bases, or archival systems

### 💾 Data Storage & Retrieval
- Uploading files, documents, images, or structured data for permanent storage
- Implementing content-addressed permanent storage in your applications
- Retrieving and managing permanently stored data using transaction IDs
- Building backup systems or archival solutions with guaranteed permanence

### 🔐 Wallet & Transaction Management
- Managing Arweave JWK wallets securely in production environments
- Implementing transaction creation, signing, and submission workflows
- Handling wallet authentication, balance checking, and payment flows
- Building secure key management systems for Arweave transactions

### 🌐 Gateway Integration
- Configuring robust gateway access with failover strategies
- Implementing production-ready retry logic and timeout handling
- Building resilient data access layers for Permaweb applications
- Optimizing gateway performance and reliability

### 📊 Advanced Integration Patterns
- Integrating Arweave with AO processes for decentralized compute + storage
- Using transaction tags for metadata, indexing, and application-specific features
- Implementing cost estimation and transaction fee management
- Building search, filtering, and discovery features using ArDB or ArGQL

**Keywords that trigger this skill:**
"Arweave", "permanent storage", "Permaweb", "transaction IDs", "Arweave gateways", "JWK wallet", "decentralized storage", "content addressing", "pay-once storage", "Arweave SDK"

**When NOT to use this skill:**
- For AO process development → Use the `ao` skill instead
- For temporary/mutable storage needs → Use traditional databases
- For high-frequency write operations → Consider hybrid storage approaches

## Arweave Transactions

Transactions are the fundamental unit of data storage on Arweave, containing both the data payload and metadata.

**Transaction Anatomy:**

```
┌─────────────────────────────────┐
│   Arweave Transaction           │
├─────────────────────────────────┤
│  • Transaction ID (43 chars)    │
│  • Data Payload (binary/text)   │
│  • Tags (metadata key-values)   │
│  • Signature (wallet JWK)       │
│  • Target (optional recipient)  │
│  • Reward (upload cost in AR)   │
└─────────────────────────────────┘
         │
         ▼
    ┌────────────────────────┐
    │   Arweave Blockchain   │
    │   (Permanent Storage)  │
    └────────────────────────┘
```

**Transaction Components:**

- **Transaction ID (TXID)**: 43-character base64url encoded string, content-addressed and globally unique
- **Data**: Binary or text payload (up to ~10MB practical limit)
- **Tags**: Metadata key-value pairs (e.g., App-Name, Content-Type, custom metadata)
- **Signature**: Cryptographic signature from wallet proving ownership
- **Target**: Optional recipient address for payment transactions
- **Reward**: Calculated fee in winston (1 AR = 1 trillion winston)

**Transaction Lifecycle:**

1. **Create**: Build transaction with data and tags using Arweave SDK
2. **Sign**: Cryptographically sign with JWK wallet
3. **Submit**: POST to gateway endpoint (`/tx`)
4. **Pending**: Transaction enters network mempool
5. **Confirmed**: Mined into block (2-5 minute finality typical)
6. **Permanent**: Data retrievable forever via TXID

**Transaction Tags (Metadata):**

Tags provide searchable metadata without modifying the data payload:

```javascript
// Common tag patterns
{
  "App-Name": "Agent-Skills-Registry",
  "Content-Type": "application/x-tar+gzip",
  "Skill-Name": "arweave",
  "Skill-Version": "1.0.0"
}
```

Tags enable:
- Content-type identification for proper rendering
- Application-specific metadata
- Searchable indexes via ArDB, ArGQL
- Custom metadata for organizational purposes

**Transaction Finality:**

Arweave transactions achieve finality in 2-5 minutes on average:

```
Submit → Pending (mempool) → Mining → Confirmed (2-5 min) → Permanent
```

Poll transaction status with: `GET /tx/{transactionId}/status`

## Arweave Wallets

Arweave uses JWK (JSON Web Key) format for wallet authentication and transaction signing.

**JWK Wallet Structure:**

Wallets are JSON objects containing RSA key pairs:

```javascript
{
  "kty": "RSA",           // Key type
  "n": "...",             // Public key modulus
  "e": "AQAB",            // Public exponent
  "d": "...",             // Private exponent (KEEP SECRET)
  "p": "...", "q": "...", // Prime factors
  "dp": "...", "dq": "...", "qi": "..."
}
```

**Wallet Address:**

- 43-character base64url encoded string
- Derived from public key
- Used for balance checks and transaction targets
- Example: `abc123def456ghi789jkl012mno345pqr678stu901vw`

**Balance Checking:**

Query wallet balance via gateway:

```
GET /wallet/{address}/balance
```

Returns balance in **winston** (1 AR = 1,000,000,000,000 winston)

**Converting winston to AR:**

```javascript
// 1 AR = 1 trillion winston
const AR = winston / 1000000000000;
const winston = AR * 1000000000000;
```

**Wallet Security Best Practices:**

⚠️ **CRITICAL SECURITY RULES:**

1. **Never expose wallet JWK in code or logs** - Treat it like a password
2. **Use environment variables or secure storage** - Use keytar for system keychain integration
3. **Validate addresses before transactions** - Check format (43 chars, base64url)
4. **Check balance before uploads** - Prevent transaction failures due to insufficient funds
5. **Backup wallet files securely** - Loss of wallet means loss of funds permanently
6. **Never commit wallet files to version control** - Add to `.gitignore` immediately

**Transaction Signing:**

All transactions must be signed with wallet JWK:

```javascript
// Arweave SDK handles signing automatically
const transaction = await arweave.createTransaction({data: "Hello"}, wallet);
await arweave.transactions.sign(transaction, wallet);
```

The signature proves:
- Transaction authenticity (from wallet owner)
- Data integrity (transaction hasn't been tampered with)
- Authorization to spend wallet funds

## Arweave Gateways

Gateways provide the HTTP access layer to the Arweave blockchain, making data submission and retrieval easy.

**Gateway Role:**

Gateways serve as intermediaries between HTTP clients and the Arweave blockchain:

- **Accept transaction submissions** via HTTP POST
- **Serve transaction data** via HTTP GET
- **Provide blockchain queries** (balances, status, network info)
- **Cache popular content** for faster retrieval
- **Relay to blockchain nodes** for mining and storage

**Common Gateways:**

| Gateway | URL | Notes |
|---------|-----|-------|
| **Primary** | `https://arweave.net` | Default, widely used |
| **AR.IO** | `https://ar-io.dev` | Decentralized gateway network |
| **g8way** | `https://g8way.io` | Alternative reliable gateway |

**Gateway Configuration:**

Configure gateways via `.skillsrc` or environment variables:

```json
{
  "arweaveGateway": "https://arweave.net",
  "gatewayTimeout": 30000,
  "gatewayRetries": 3
}
```

**Gateway Failover Strategy:**

Implement failover for production reliability:

```javascript
const gateways = [
  "https://arweave.net",
  "https://ar-io.dev",
  "https://g8way.io"
];

async function fetchWithFailover(txid) {
  for (const gateway of gateways) {
    try {
      const response = await fetch(`${gateway}/${txid}`);
      if (response.ok) return response;
    } catch (error) {
      console.error(`Gateway ${gateway} failed, trying next...`);
    }
  }
  throw new Error("All gateways failed");
}
```

**Best Practices:**

- **Configurable gateways** - Allow users to specify preferred gateways
- **Retry logic** - 3 attempts with exponential backoff (100ms, 200ms, 400ms)
- **Timeout handling** - 30s for downloads, 60s for uploads
- **Failover on timeout** - Switch gateways automatically on failure
- **Monitor gateway health** - Track success rates, switch if degraded

## Retrieving Data from Arweave

Retrieve permanently stored data using transaction IDs via gateway HTTP endpoints.

**Basic Retrieval Pattern:**

```
GET /{transactionId}
```

Gateway serves transaction data with appropriate Content-Type from tags.

**Transaction Status Polling:**

For recently submitted transactions, poll for confirmation:

```
GET /tx/{transactionId}/status
```

**Status Responses:**

- `{"status": 202}` - Pending (in mempool, not yet mined)
- `{"status": 200, "block_height": 123456}` - Confirmed (mined into block)
- `{"status": 404}` - Not found (invalid TXID or not yet propagated)

**Polling Best Practices:**

```javascript
async function waitForConfirmation(txid, maxAttempts = 60, delayMs = 5000) {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await fetch(`https://arweave.net/tx/${txid}/status`);
    const data = await status.json();

    if (data.status === 200) {
      return true; // Confirmed
    }

    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  return false; // Timeout
}
```

**Content-Type Handling:**

Respect Content-Type tag for proper data interpretation:

```javascript
// Transaction tags determine how to handle data
const contentType = transaction.tags.find(t => t.name === "Content-Type")?.value;

if (contentType === "application/json") {
  const data = await response.json();
} else if (contentType.startsWith("image/")) {
  const blob = await response.blob();
} else {
  const text = await response.text();
}
```

**Integration Best Practices:**

- **Finality Wait**: 2-5 minutes typical confirmation time
- **Progress Indicators**: Show status during confirmation wait
- **Gateway Failover**: Use multiple gateways for reliability
- **Retry Strategy**: 3 attempts with exponential backoff
- **Timeouts**: 30s for downloads, 60s for uploads
- **Error Handling**: Graceful degradation on gateway failures
- **Data Validation**: Verify integrity after download

## Code Examples

### Example 1: Creating Transactions with Arweave SDK

```javascript
const Arweave = require('arweave');

// Initialize Arweave client
const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https'
});

// Load wallet from JWK file
const wallet = JSON.parse(fs.readFileSync('./wallet.json'));

async function createTransaction() {
  // Create transaction with data
  const transaction = await arweave.createTransaction({
    data: 'Hello Arweave! This data is permanent.'
  }, wallet);

  // Add metadata tags
  transaction.addTag('App-Name', 'MyApp');
  transaction.addTag('Content-Type', 'text/plain');
  transaction.addTag('Version', '1.0.0');

  // Sign transaction with wallet
  await arweave.transactions.sign(transaction, wallet);

  // Get transaction cost (in winston)
  const cost = await arweave.transactions.getPrice(
    transaction.data.length
  );

  console.log(`Transaction ID: ${transaction.id}`);
  console.log(`Cost: ${arweave.ar.winstonToAr(cost)} AR`);

  return transaction;
}
```

### Example 2: Uploading Data to Arweave

```javascript
const Arweave = require('arweave');
const fs = require('fs');

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https'
});

async function uploadFile(filePath, wallet) {
  // Read file data
  const data = fs.readFileSync(filePath);

  // Create transaction with file data
  const transaction = await arweave.createTransaction({
    data: data
  }, wallet);

  // Add tags for file metadata
  transaction.addTag('App-Name', 'File-Upload-Demo');
  transaction.addTag('Content-Type', 'application/octet-stream');
  transaction.addTag('File-Name', path.basename(filePath));

  // Sign transaction
  await arweave.transactions.sign(transaction, wallet);

  // Submit to network
  const response = await arweave.transactions.post(transaction);

  if (response.status === 200) {
    console.log(`✓ Upload successful!`);
    console.log(`  Transaction ID: ${transaction.id}`);
    console.log(`  Access at: https://arweave.net/${transaction.id}`);

    // Wait for confirmation
    console.log(`  Waiting for confirmation (2-5 minutes)...`);
    const confirmed = await waitForConfirmation(transaction.id);

    if (confirmed) {
      console.log(`✓ Transaction confirmed!`);
    } else {
      console.log(`⚠ Confirmation timeout, but transaction may still be processing`);
    }
  } else {
    console.error(`✗ Upload failed with status: ${response.status}`);
  }

  return transaction.id;
}

// Helper function to wait for confirmation
async function waitForConfirmation(txid, maxAttempts = 60) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const status = await arweave.transactions.getStatus(txid);
      if (status.confirmed) {
        return true;
      }
    } catch (error) {
      // Status endpoint may fail if transaction is very recent
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  return false;
}
```

### Example 3: Querying Data by Transaction ID

```javascript
const Arweave = require('arweave');

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https'
});

async function fetchTransaction(txid) {
  try {
    // Check transaction status first
    const status = await arweave.transactions.getStatus(txid);

    if (!status.confirmed) {
      console.log(`Transaction ${txid} is pending confirmation...`);
      return null;
    }

    // Get transaction data
    const data = await arweave.transactions.getData(txid, {
      decode: true,
      string: true
    });

    // Get transaction metadata
    const transaction = await arweave.transactions.get(txid);

    // Extract Content-Type from tags
    const contentType = transaction.tags.find(
      tag => tag.get('name', {decode: true, string: true}) === 'Content-Type'
    )?.get('value', {decode: true, string: true}) || 'application/octet-stream';

    console.log(`Transaction ID: ${txid}`);
    console.log(`Content-Type: ${contentType}`);
    console.log(`Data length: ${data.length} bytes`);
    console.log(`Block: ${status.block_height}`);

    return {
      txid,
      data,
      contentType,
      blockHeight: status.block_height,
      tags: transaction.tags
    };

  } catch (error) {
    console.error(`Error fetching transaction ${txid}:`, error.message);

    // Implement retry with gateway failover
    return await fetchWithFailover(txid);
  }
}

// Failover to alternative gateways on error
async function fetchWithFailover(txid) {
  const gateways = [
    'https://arweave.net',
    'https://ar-io.dev',
    'https://g8way.io'
  ];

  for (const gateway of gateways) {
    try {
      console.log(`Trying gateway: ${gateway}...`);
      const response = await fetch(`${gateway}/${txid}`);

      if (response.ok) {
        const data = await response.text();
        const contentType = response.headers.get('content-type');

        console.log(`✓ Successfully fetched from ${gateway}`);
        return { txid, data, contentType };
      }
    } catch (error) {
      console.error(`Gateway ${gateway} failed:`, error.message);
    }
  }

  throw new Error(`All gateways failed for transaction ${txid}`);
}
```

## Resources

### Arweave SDK

**Official Arweave JavaScript SDK for transaction creation and data upload**

- **Package**: `arweave`
- **Version**: ^1.14.4
- **Purpose**: Official Arweave JavaScript SDK for creating, signing, and submitting transactions
- **Installation**: `npm install arweave`
- **Repository**: https://github.com/ArweaveTeam/arweave-js

**Key Features:**
- Transaction creation and signing
- Wallet management and balance queries
- Data upload and retrieval
- Network status and price queries
- TypeScript support

**Core API:**
```javascript
const Arweave = require('arweave');

// Initialize client
const arweave = Arweave.init(config);

// Wallet operations
arweave.wallets.jwkToAddress(wallet);
arweave.wallets.getBalance(address);

// Transaction operations
arweave.createTransaction({data}, wallet);
arweave.transactions.sign(tx, wallet);
arweave.transactions.post(tx);
arweave.transactions.get(txid);
arweave.transactions.getData(txid);
arweave.transactions.getStatus(txid);
```

## Additional Resources

### Official Arweave Documentation

**Arweave Developer Documentation**
- **URL**: https://docs.arweave.org/developers/
- **Topics**: Protocol overview, transaction structure, mining, economics, developer guides
- **Use Cases**: Understanding Arweave architecture, building Permaweb apps, integration patterns

**Arweave.js GitHub Repository**
- **URL**: https://github.com/ArweaveTeam/arweave-js
- **Content**: SDK source code, examples, API reference, changelog
- **Use Cases**: Advanced SDK usage, contributing to SDK, troubleshooting

**Permaweb Cookbook**
- **URL**: https://cookbook.arweave.dev/
- **Topics**: Recipes and patterns for Permaweb development
- **Use Cases**: Common integration patterns, best practices, real-world examples

**ArDB (Arweave Database)**
- **Purpose**: Query Arweave transactions by tags, addresses, or other criteria
- **Use Cases**: Building search indexes, querying transaction history

**ArGQL (Arweave GraphQL)**
- **Purpose**: GraphQL interface for Arweave blockchain queries
- **Use Cases**: Complex queries, filtering by multiple criteria, pagination

## Best Practices

**Transaction Creation:**
- Validate data size before creating transaction (stay under ~10MB)
- Always add Content-Type tag for proper rendering
- Include App-Name tag for transaction identification
- Estimate costs before submitting large transactions

**Wallet Management:**
- Never expose JWK wallet in code, logs, or version control
- Use environment variables or secure keychain storage (keytar)
- Check balance before submitting transactions
- Backup wallet files securely (loss is permanent)
- Validate addresses before sending transactions

**Gateway Integration:**
- Configure multiple gateways for failover
- Implement retry logic with exponential backoff
- Set appropriate timeouts (30s download, 60s upload)
- Monitor gateway health and switch if degraded
- Cache gateway responses when appropriate

**Data Retrieval:**
- Poll transaction status for recent uploads (2-5 min confirmation)
- Implement timeout handling for long-running polls
- Respect Content-Type tags when processing data
- Validate data integrity after download
- Use appropriate data structures (Buffer for binary, string for text)

**Error Handling:**
- Handle network failures gracefully with retries
- Provide clear error messages to users
- Implement fallback strategies for critical operations
- Log errors without exposing sensitive data (wallet info)
- Test error paths (insufficient balance, network timeout, etc.)

**Cost Management:**
- Estimate transaction costs before submission
- Communicate costs to users before large uploads
- Consider batching small files for cost efficiency
- Monitor wallet balance to prevent failed transactions

---

**Version**: 1.1.0
**Last Updated**: 2025-10-27

---
name: aoconnect
version: 1.0.0
author: Permamind Team
description: JavaScript library for interacting with AO processes - message sending, dryrun queries, and wallet management
tags: ["ao", "javascript", "library", "sdk"]
dependencies: []
license: MIT
changelog: |
  ## Initial Release
  - Complete aoconnect library documentation
  - Message sending patterns
  - Dryrun query examples
  - Wallet integration guide
---

# aoconnect - AO JavaScript SDK

## What is aoconnect?

**@permaweb/aoconnect** is the official JavaScript SDK for interacting with AO processes. It provides a high-level API for message passing, state queries, and process management from JavaScript/TypeScript applications.

## When to Use This Skill

Use aoconnect when you need to:
- Send messages to AO processes from JavaScript
- Query process state with dryrun
- Integrate AO into web applications
- Build clients for AO processes
- Manage wallets and signing

## Installation

```bash
npm install @permaweb/aoconnect
```

## Core Functions

### 1. Message Sending

Send state-changing messages to processes:

```typescript
import { message, createDataItemSigner } from '@permaweb/aoconnect';

// Create signer from wallet
const signer = createDataItemSigner(wallet);

// Send message
const messageId = await message({
  process: 'process-id-here',
  tags: [
    { name: 'Action', value: 'Transfer' },
    { name: 'Recipient', value: 'recipient-address' },
    { name: 'Quantity', value: '100' }
  ],
  signer,
  data: 'Optional message data'
});

console.log('Message sent:', messageId);
```

### 2. Dryrun Queries

Execute read-only queries without sending messages:

```typescript
import { dryrun } from '@permaweb/aoconnect';

const result = await dryrun({
  process: 'process-id-here',
  tags: [
    { name: 'Action', value: 'Balance' },
    { name: 'Target', value: 'address-here' }
  ]
});

// Parse response
const balance = result.Messages[0].Data;
console.log('Balance:', balance);
```

### 3. Reading Results

Read the result of a sent message:

```typescript
import { result } from '@permaweb/aoconnect';

const response = await result({
  message: messageId,
  process: 'process-id-here'
});

// Access response messages
const data = response.Messages[0].Data;
console.log('Response:', data);
```

### 4. Spawning Processes

Create new AO processes:

```typescript
import { spawn } from '@permaweb/aoconnect';

const processId = await spawn({
  module: 'module-tx-id',
  scheduler: 'scheduler-address',
  signer,
  tags: [
    { name: 'Name', value: 'My Process' }
  ]
});

console.log('Process created:', processId);
```

## Custom Configuration

### Configure CU and MU

Override default Compute Unit and Messenger Unit:

```typescript
import { connect } from '@permaweb/aoconnect';

const ao = connect({
  MU_URL: 'https://ur-mu.randao.net',
  CU_URL: 'https://ur-cu.randao.net',
});

const { message, dryrun, result } = ao;

// Use configured instances
const messageId = await message({...});
```

**Benefits:**
- Use alternative gateways for reliability
- Avoid rate limiting on default endpoints
- Better performance with regional nodes

## Wallet Management

### Creating Signers

```typescript
import { createDataItemSigner } from '@permaweb/aoconnect';
import Arweave from 'arweave';

// From JWK wallet
const wallet = JSON.parse(fs.readFileSync('wallet.json', 'utf-8'));
const signer = createDataItemSigner(wallet);

// Generate new wallet
const arweave = Arweave.init({});
const newWallet = await arweave.wallets.generate();
const newSigner = createDataItemSigner(newWallet);
```

## Best Practices

### 1. Handle Errors Gracefully

```typescript
try {
  const result = await dryrun({...});

  // Check for error responses
  const action = result.Messages[0].Tags
    .find(t => t.name === 'Action')?.value;

  if (action === 'Error') {
    const error = result.Messages[0].Tags
      .find(t => t.name === 'Error')?.value;
    throw new Error(error);
  }
} catch (error) {
  console.error('Query failed:', error.message);
}
```

### 2. Use Retries for Reliability

```typescript
async function queryWithRetry(fn, maxAttempts = 3) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxAttempts - 1) throw error;
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

const result = await queryWithRetry(() =>
  dryrun({...})
);
```

### 3. Message-Based Fallback

When dryrun fails, use message + result:

```typescript
// Try dryrun first
try {
  return await dryrun({...});
} catch {
  // Fallback to message-based query
  const msgId = await message({
    process: processId,
    tags: [...],
    signer
  });

  await new Promise(r => setTimeout(r, 2000)); // Wait for processing

  return await result({
    message: msgId,
    process: processId
  });
}
```

## Common Patterns

### Token Balance Query

```typescript
const balance = await dryrun({
  process: tokenProcessId,
  tags: [
    { name: 'Action', value: 'Balance' },
    { name: 'Target', value: walletAddress }
  ]
});

const amount = balance.Messages[0].Data;
```

### Token Transfer

```typescript
const transferId = await message({
  process: tokenProcessId,
  tags: [
    { name: 'Action', value: 'Transfer' },
    { name: 'Recipient', value: recipientAddress },
    { name: 'Quantity', value: amount.toString() }
  ],
  signer
});

// Wait and check result
await new Promise(r => setTimeout(r, 2000));
const confirmation = await result({
  message: transferId,
  process: tokenProcessId
});
```

### Process Info Query

```typescript
const info = await dryrun({
  process: processId,
  tags: [{ name: 'Action', value: 'Info' }]
});

const metadata = JSON.parse(info.Messages[0].Data);
console.log('Process:', metadata.process.name);
console.log('Version:', metadata.process.version);
```

## Troubleshooting

### Issue: HTML Error Responses

**Symptom:** `Unexpected token '<', "<html>...`

**Cause:** CU gateway returning error page

**Solution:**
- Configure alternative CU/MU endpoints
- Use message-based queries instead of dryrun
- Retry with delays

### Issue: Timeout Errors

**Symptom:** Queries timeout after 30-45 seconds

**Cause:** CU processing slow or overloaded

**Solution:**
- Increase timeout in configuration
- Use alternative gateways
- Implement retry logic

### Issue: Invalid Response Format

**Symptom:** Cannot parse response data

**Cause:** Response format mismatch

**Solution:**
- Check if Messages array exists
- Verify Message[0].Data is not empty
- Handle both string and JSON responses

## Resources

- **npm Package:** https://www.npmjs.com/package/@permaweb/aoconnect
- **GitHub:** https://github.com/permaweb/aoconnect
- **Documentation:** https://cookbook.arweave.net/
- **AO Cookbook:** https://cookbook_ao.g8way.io/

## Integration Examples

### React Component

```typescript
import { dryrun } from '@permaweb/aoconnect';

function BalanceDisplay({ processId, address }) {
  const [balance, setBalance] = useState('0');

  useEffect(() => {
    async function fetchBalance() {
      const result = await dryrun({
        process: processId,
        tags: [
          { name: 'Action', value: 'Balance' },
          { name: 'Target', value: address }
        ]
      });
      setBalance(result.Messages[0].Data);
    }
    fetchBalance();
  }, [processId, address]);

  return <div>Balance: {balance}</div>;
}
```

### Node.js Script

```javascript
const { message, createDataItemSigner } = require('@permaweb/aoconnect');
const fs = require('fs');

async function sendMessage() {
  const wallet = JSON.parse(fs.readFileSync('wallet.json'));
  const signer = createDataItemSigner(wallet);

  const msgId = await message({
    process: process.env.PROCESS_ID,
    tags: [
      { name: 'Action', value: 'CustomAction' },
      { name: 'Data', value: 'Hello AO!' }
    ],
    signer
  });

  console.log('Sent:', msgId);
}

sendMessage();
```

## Version Compatibility

- **Node.js:** >= 18.0.0
- **Browser:** Modern browsers with ES2020 support
- **TypeScript:** >= 4.5.0 (optional)

## Next Steps

After understanding aoconnect:
- Build AO process clients
- Integrate with web applications
- Create custom SDKs for your processes
- Explore advanced message patterns

Happy building with AO! 🚀

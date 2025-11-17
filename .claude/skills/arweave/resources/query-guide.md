# Arweave Query Guide

Complete guide to querying and retrieving data from Arweave using GraphQL, HTTP APIs, and specialized libraries.

## Data Retrieval Methods

### Method 1: Direct HTTP Access

Simplest approach - fetch transaction data directly from a gateway:

```javascript
// Fetch transaction data
const txId = 'cG7Hdi_iTQPoEYgQJFqJ8NMpN4KoZ-vH_j7pG4iP7NI';
const response = await fetch(`https://arweave.net/${txId}`);
const data = await response.text();

// For JSON
const jsonData = await response.json();

// For binary (images, PDFs, etc.)
const blob = await response.blob();
```

### Method 2: Using arweave-js

```javascript
import Arweave from 'arweave';

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https'
});

// Get transaction data as string
const data = await arweave.transactions.getData(txId, {
  decode: true,
  string: true
});

// Get transaction metadata
const tx = await arweave.transactions.get(txId);
const tags = {};
tx.tags.forEach(tag => {
  const name = tag.get('name', {decode: true, string: true});
  const value = tag.get('value', {decode: true, string: true});
  tags[name] = value;
});

console.log('Content-Type:', tags['Content-Type']);
console.log('Owner:', await arweave.wallets.ownerToAddress(tx.owner));
console.log('Data size:', tx.data_size);
```

### Method 3: Gateway Fallback Strategy

**Production-ready** approach with multiple gateway fallback:

```javascript
const GATEWAYS = [
  'https://arweave.net',
  'https://ar-io.net',
  'https://g8way.io'
];

async function fetchWithFallback(txId, options = {}) {
  const timeout = options.timeout || 5000;
  const retries = options.retries || 1;

  for (const gateway of GATEWAYS) {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(`${gateway}/${txId}`, {
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          return await response.text();
        }

      } catch (error) {
        console.warn(`${gateway} attempt ${attempt + 1}/${retries} failed:`, error.message);

        if (attempt < retries - 1) {
          // Exponential backoff
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
        }
      }
    }
  }

  throw new Error(`All gateways failed for transaction ${txId}`);
}

// Usage
try {
  const data = await fetchWithFallback(txId, {
    timeout: 10000,
    retries: 2
  });
  console.log('Data retrieved successfully');
} catch (error) {
  console.error('Failed to retrieve data:', error);
}
```

## GraphQL Querying

### Primary Endpoints

| Gateway | GraphQL Endpoint | Best For |
|---------|------------------|----------|
| arweave.net | `https://arweave.net/graphql` | General purpose |
| Goldsky | `https://arweave-search.goldsky.com/graphql` | Complex queries, fuzzy search |
| ar.io | `https://ar-io.net/graphql` | Production redundancy |

### Basic GraphQL Query Structure

```graphql
query {
  transactions(
    # Filters
    owners: ["wallet_address"]
    recipients: ["recipient_address"]
    tags: [
      { name: "App-Name", values: ["MyApp"] }
      { name: "Content-Type", values: ["text/html", "application/json"] }
    ]
    block: { min: 1000000, max: 1100000 }

    # Pagination
    first: 10
    after: "cursor"

    # Sorting
    sort: HEIGHT_DESC  # or HEIGHT_ASC
  ) {
    pageInfo {
      hasNextPage
    }
    edges {
      cursor
      node {
        id
        owner { address }
        recipient
        tags { name value }
        block {
          height
          timestamp
        }
        fee { winston ar }
        quantity { winston ar }
        data { size type }
      }
    }
  }
}
```

### Filter Options

| Filter | Type | Description |
|--------|------|-------------|
| `ids` | [String!] | Transaction IDs |
| `owners` | [String!] | Owner wallet addresses |
| `recipients` | [String!] | Recipient addresses |
| `tags` | [TagFilter!] | Tag name-value pairs (AND logic) |
| `block` | BlockFilter | Block height range |
| `first` | Int | Results per page (max 100) |
| `after` | String | Pagination cursor |
| `sort` | SortOrder | HEIGHT_ASC or HEIGHT_DESC |

### Common Query Patterns

#### Find All Transactions by App Name

```javascript
const query = `
  query($appName: String!, $first: Int!, $after: String) {
    transactions(
      tags: [{ name: "App-Name", values: [$appName] }]
      first: $first
      after: $after
      sort: HEIGHT_DESC
    ) {
      pageInfo { hasNextPage }
      edges {
        cursor
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

const variables = {
  appName: "MyApp",
  first: 50
};

const response = await fetch('https://arweave.net/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query, variables })
});

const result = await response.json();
const transactions = result.data.transactions.edges;

console.log(`Found ${transactions.length} transactions`);
```

#### Find Content by Owner and Type

```javascript
const query = `
  query($owner: String!, $contentType: String!) {
    transactions(
      owners: [$owner]
      tags: [{ name: "Content-Type", values: [$contentType] }]
      first: 100
      sort: HEIGHT_DESC
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
`;

const variables = {
  owner: "wallet_address_43_chars",
  contentType: "image/png"
};
```

#### Query with Multiple Tag Filters

```javascript
const query = `
  query {
    transactions(
      tags: [
        { name: "App-Name", values: ["MyApp"] }
        { name: "Content-Type", values: ["application/json"] }
        { name: "Version", values: ["1.0", "1.1"] }
      ]
      first: 50
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
// Tags use AND logic: must match ALL tag filters
// Values within a tag filter use OR logic
```

#### Pagination Example

```javascript
async function getAllTransactions(filters) {
  const allResults = [];
  let hasNextPage = true;
  let cursor = null;

  const query = `
    query($first: Int!, $after: String, $tags: [TagFilter!]) {
      transactions(
        tags: $tags
        first: $first
        after: $after
        sort: HEIGHT_DESC
      ) {
        pageInfo { hasNextPage }
        edges {
          cursor
          node {
            id
            tags { name value }
          }
        }
      }
    }
  `;

  while (hasNextPage) {
    const variables = {
      first: 100,
      after: cursor,
      tags: filters.tags
    };

    const response = await fetch('https://arweave.net/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables })
    });

    const data = await response.json();
    const { edges, pageInfo } = data.data.transactions;

    allResults.push(...edges);

    hasNextPage = pageInfo.hasNextPage;
    cursor = edges[edges.length - 1]?.cursor;

    console.log(`Fetched ${edges.length} transactions (total: ${allResults.length})`);
  }

  return allResults;
}

// Usage
const results = await getAllTransactions({
  tags: [{ name: "App-Name", values: ["MyApp"] }]
});

console.log(`Total transactions: ${results.length}`);
```

## Simplified Libraries

### Using ArDB (Easiest)

```bash
npm install ardb
```

```javascript
import ArDB from 'ardb';
import Arweave from 'arweave';

const arweave = Arweave.init({host: 'arweave.net', port: 443, protocol: 'https'});
const ardb = new ArDB(arweave);

// Find transactions with method chaining
const txs = await ardb
  .search('transactions')
  .appName('MyApp')
  .tag('Version', '1.0')
  .tag('Content-Type', 'application/json')
  .from('owner_address')
  .limit(50)
  .find();

console.log(`Found ${txs.length} transactions`);

// Get single transaction
const tx = await ardb
  .search('transactions')
  .id('transaction_id')
  .findOne();

// Find by multiple criteria
const results = await ardb
  .search('transactions')
  .tag('Content-Type', 'image/png')
  .tag('App-Name', 'PhotoApp')
  .only(['id', 'tags', 'owner'])  // Select specific fields
  .limit(100)
  .find();
```

### Using ar-gql

```bash
npm install ar-gql
```

```javascript
import { arGql, GQLUrls } from 'ar-gql';

// Use optimized Goldsky endpoint
const goldsky = arGql({ endpointUrl: GQLUrls.goldsky });

// Template literal query
const results = await goldsky`
  {
    transactions(
      tags: [
        { name: "App-Name", values: ["MyApp"] }
      ]
      first: 50
      sort: HEIGHT_DESC
    ) {
      edges {
        node {
          id
          owner { address }
          tags { name value }
        }
      }
    }
  }
`;

console.log('Found:', results.data.transactions.edges.length);

// With variables
const withVars = await goldsky(
  `query($appName: String!) {
    transactions(
      tags: [{ name: "App-Name", values: [$appName] }]
      first: 50
    ) {
      edges {
        node { id }
      }
    }
  }`,
  { appName: "MyApp" }
);
```

## HTTP API Endpoints

### Transaction Endpoints

```javascript
// Get transaction by ID
GET https://arweave.net/{tx_id}

// Get transaction metadata
GET https://arweave.net/tx/{tx_id}

// Get transaction status
GET https://arweave.net/tx/{tx_id}/status

// Get specific transaction field
GET https://arweave.net/tx/{tx_id}/data
GET https://arweave.net/tx/{tx_id}/offset
```

### Wallet Endpoints

```javascript
// Get wallet balance
GET https://arweave.net/wallet/{address}/balance
// Returns: winston as string

// Get last transaction ID
GET https://arweave.net/wallet/{address}/last_tx
```

### Network Endpoints

```javascript
// Get network info
GET https://arweave.net/info

// Get current block
GET https://arweave.net/block/current

// Get block by height
GET https://arweave.net/block/height/{height}

// Get block by hash
GET https://arweave.net/block/hash/{hash}
```

### Price Endpoint

```javascript
// Get price for data size
GET https://arweave.net/price/{bytes}
GET https://arweave.net/price/{bytes}/{target_address}

// Example
const response = await fetch('https://arweave.net/price/1048576');
const winston = await response.text();
console.log('Price for 1MB:', winston, 'winston');
```

## Complete Query Example

```javascript
async function findAndFetchAppData(appName, contentType) {
  const arweave = Arweave.init({host: 'arweave.net', port: 443, protocol: 'https'});

  // 1. Find transactions via GraphQL
  const query = `
    query($appName: String!, $contentType: String!) {
      transactions(
        tags: [
          { name: "App-Name", values: [$appName] }
          { name: "Content-Type", values: [$contentType] }
        ]
        first: 10
        sort: HEIGHT_DESC
      ) {
        edges {
          node {
            id
            owner { address }
            tags { name value }
            block { timestamp }
          }
        }
      }
    }
  `;

  const gqlResponse = await fetch('https://arweave.net/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      variables: { appName, contentType }
    })
  });

  const result = await gqlResponse.json();
  const transactions = result.data.transactions.edges;

  console.log(`Found ${transactions.length} transactions`);

  // 2. Fetch data for each transaction
  const dataPromises = transactions.map(async ({ node }) => {
    try {
      const data = await arweave.transactions.getData(node.id, {
        decode: true,
        string: true
      });

      // Parse tags
      const tags = {};
      node.tags.forEach(tag => {
        tags[tag.name] = tag.value;
      });

      return {
        id: node.id,
        owner: node.owner.address,
        timestamp: node.block.timestamp,
        tags,
        data
      };
    } catch (error) {
      console.error(`Failed to fetch ${node.id}:`, error.message);
      return null;
    }
  });

  const results = await Promise.all(dataPromises);
  return results.filter(r => r !== null);
}

// Usage
const appData = await findAndFetchAppData('MyApp', 'application/json');

appData.forEach(item => {
  console.log(`TX ${item.id}:`);
  console.log(`  Owner: ${item.owner}`);
  console.log(`  Title: ${item.tags.Title || 'Untitled'}`);
  console.log(`  Data: ${item.data.substring(0, 100)}...`);
});
```

## Performance Optimization

### 1. Request Only Needed Fields

```graphql
# Bad - requests all fields
node {
  id owner recipient tags block fee quantity data
}

# Good - only what you need
node {
  id
  tags { name value }
}
```

### 2. Implement Caching

```javascript
class QueryCache {
  constructor(ttl = 300000) {  // 5 minutes default
    this.cache = new Map();
    this.ttl = ttl;
  }

  async get(key, fetchFn) {
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.ttl) {
      console.log('Cache hit:', key);
      return cached.data;
    }

    console.log('Cache miss:', key);
    const data = await fetchFn();
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    return data;
  }

  clear() {
    this.cache.clear();
  }
}

// Usage
const cache = new QueryCache();

const data = await cache.get('myapp-transactions', async () => {
  // Expensive GraphQL query
  return await fetchTransactions();
});
```

### 3. Use Appropriate Page Sizes

- Small UI queries: `first: 10-25`
- Bulk operations: `first: 100` (maximum allowed)
- Balance between request count and payload size

### 4. Use Goldsky for Complex Queries

Goldsky provides optimized infrastructure for:
- Large result sets
- Fuzzy search
- Wildcard matching
- Complex filtering

```javascript
const goldsky = arGql({ endpointUrl: GQLUrls.goldsky });

// Complex query with better performance
const results = await goldsky`
  {
    transactions(
      tags: [
        { name: "Title", values: ["*portfolio*"], match: WILDCARD }
      ]
      first: 100
    ) {
      edges {
        node { id tags { name value } }
      }
    }
  }
`;
```

## Common Patterns

### Search by Date Range

```javascript
// Note: Arweave GraphQL doesn't support direct timestamp filtering
// Filter by block height, then filter results by timestamp

async function findTransactionsByDate(startDate, endDate, filters = {}) {
  const startTimestamp = Math.floor(startDate.getTime() / 1000);
  const endTimestamp = Math.floor(endDate.getTime() / 1000);

  // Fetch with block range (approximate)
  const query = `
    query($tags: [TagFilter!], $first: Int!, $after: String) {
      transactions(
        tags: $tags
        first: $first
        after: $after
        sort: HEIGHT_DESC
      ) {
        pageInfo { hasNextPage }
        edges {
          cursor
          node {
            id
            block {
              height
              timestamp
            }
            tags { name value }
          }
        }
      }
    }
  `;

  let results = [];
  let cursor = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await fetch('https://arweave.net/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        variables: {
          tags: filters.tags || [],
          first: 100,
          after: cursor
        }
      })
    });

    const data = await response.json();
    const { edges, pageInfo } = data.data.transactions;

    // Filter by timestamp
    const filtered = edges.filter(({ node }) => {
      const timestamp = node.block.timestamp;
      return timestamp >= startTimestamp && timestamp <= endTimestamp;
    });

    results.push(...filtered);

    // Stop if we've gone past the date range
    if (edges.length > 0 && edges[edges.length - 1].node.block.timestamp < startTimestamp) {
      break;
    }

    hasNextPage = pageInfo.hasNextPage;
    cursor = edges[edges.length - 1]?.cursor;
  }

  return results;
}

// Usage
const last30Days = await findTransactionsByDate(
  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  new Date(),
  { tags: [{ name: "App-Name", values: ["MyApp"] }] }
);
```

### Batch Data Retrieval

```javascript
async function batchFetchTransactionData(txIds, batchSize = 10) {
  const results = [];

  for (let i = 0; i < txIds.length; i += batchSize) {
    const batch = txIds.slice(i, i + batchSize);

    console.log(`Fetching batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(txIds.length / batchSize)}`);

    const batchResults = await Promise.all(
      batch.map(async (txId) => {
        try {
          const data = await fetchWithFallback(txId);
          return { txId, data, success: true };
        } catch (error) {
          return { txId, error: error.message, success: false };
        }
      })
    );

    results.push(...batchResults);

    // Rate limiting: wait between batches
    if (i + batchSize < txIds.length) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  return results;
}
```

---

**Version**: 1.0.0
**Last Updated**: November 14, 2025

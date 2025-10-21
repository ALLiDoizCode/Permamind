# External APIs

## Arweave Network API

**Purpose:** Permanent storage for skill bundles; upload tar.gz files and retrieve by transaction ID.

**Documentation:**
- https://docs.arweave.org/developers/
- https://github.com/ArweaveTeam/arweave-js

**Base URL(s):**
- Arweave Gateway (configurable): `https://arweave.net` (default)
- Alternative gateways: `https://g8way.io`, `https://ar-io.dev`

**Authentication:**
- JWK (JSON Web Key) wallet signature for transactions
- No API keys required (cryptographic signatures)

**Rate Limits:**
- Gateway dependent (typically unlimited for reads)
- Transaction submission: Network mempool limits (rarely hit)
- Upload size: Practical limit ~10MB per PRD (cost-based constraint)

**Key Endpoints Used:**

### Upload Transaction (Bundle Storage)
```
POST /tx
Content-Type: application/json

Body: Signed Arweave transaction with bundle data
```

**Transaction Tags:**
- `App-Name`: "Agent-Skills-Registry"
- `Content-Type`: "application/x-tar+gzip"
- `Skill-Name`: skill name
- `Skill-Version`: skill version

### Download Bundle by TXID
```
GET /{transactionId}
```

Returns binary tar.gz data

### Check Wallet Balance
```
GET /wallet/{address}/balance
```

Returns balance in winston (1 AR = 1,000,000,000,000 winston)

### Transaction Status
```
GET /tx/{transactionId}/status
```

Poll for confirmation (2-5 minute finality)

**Integration Notes:**
- Transaction finality: 2-5 minute wait (CLI communicates with progress indicators)
- Gateway failover: Configurable via `.skillsrc`
- Retry strategy: 3 attempts with exponential backoff
- Timeout: 30s default for downloads, 60s for uploads

## AO Network API (via @permaweb/aoconnect)

**Purpose:** Message-based communication with AO Registry Process for skill registration, search, and retrieval.

**Documentation:**
- https://ao.arweave.dev
- https://github.com/permaweb/ao/tree/main/connect

**Base URL(s):**
- AO Message Unit (MU): Network-dependent
- AO Compute Unit (CU): Network-dependent

**Authentication:**
- Message signatures (JWK wallet)
- No separate auth tokens

**Rate Limits:**
- Network dependent
- Query timeout: 30s (configurable)

**Key Operations:**

### Send Message to AO Process
```typescript
import { message, result } from '@permaweb/aoconnect';

const messageId = await message({
  process: REGISTRY_PROCESS_ID,
  tags: [
    { name: 'Action', value: 'Register-Skill' },
    { name: 'Name', value: 'ao-basics' },
    { name: 'Version', value: '1.0.0' }
  ],
  signer: createDataItemSigner(wallet)
});
```

### Query AO Process (Dry Run)
```typescript
import { dryrun } from '@permaweb/aoconnect';

const { Messages } = await dryrun({
  process: REGISTRY_PROCESS_ID,
  tags: [
    { name: 'Action', value: 'Search-Skills' },
    { name: 'Query', value: 'arweave' }
  ]
});
```

**Integration Notes:**
- Registry Process ID stored in configuration
- Use `message()` for state changes (register)
- Use `dryrun()` for queries (search, get)
- Timeout: 30s with retry (2 attempts, 5s delay)

---

# HyperBEAM Dynamic Reads

This directory contains Lua transformation functions for HyperBEAM Dynamic Reads - serverless HTTP endpoints that enable fast (<500ms) read-only queries of the AO registry process state.

## Architecture

HyperBEAM Dynamic Reads shift computational work from clients to HyperBEAM nodes through a four-step pipeline:

1. **State Retrieval**: Fetch latest AO process state (`base`)
2. **Device Pipeline**: Pass state to `lua@5.3a` device
3. **Script Execution**: Load and execute Lua function from Arweave
4. **Result Return**: Serialize and return computed output via HTTP

### Benefits vs Traditional Dryrun

- **Server-side computation**: Offload processing from browsers
- **Reduced bandwidth**: Only return computed results, not raw state
- **Stateless clients**: Browsers become simple data consumers
- **Performance**: <500ms response time (vs >1s for dryrun)
- **HTTP-native**: Standard REST endpoints, no WebSocket/message passing

## Transformation Functions

All transformation functions follow this signature:

```lua
function functionName(base, req)
  -- base: Cached state data from AO process (Skills table)
  -- req: Incoming request object with parameters (query, name, limit, offset, etc.)

  -- Process data from base state
  local result = processLogic(base, req)

  -- Return JSON-serializable table
  return { data = result, total = count }
end
```

### 1. search-skills.lua

**Function**: `searchSkills(base, req)`

**Purpose**: Search skills by query term (name, description, tags, author)

**Parameters**:
- `query` (string, optional) - Search term (empty returns all skills)

**Returns**:
```json
{
  "results": [...],
  "total": 10,
  "query": "blockchain"
}
```

**Transaction ID**: `hjL7_fEj2onw1Uhyk4bmMum8lewZjWrn01IZXsY1utk`

**Example URL**:
```
https://hb.randao.net/0JwigA4ZGMredBmVq0M092gT5Liic_Yxv8c6T0tiFDw~process@1.0/now/~lua@5.3a&module=hjL7_fEj2onw1Uhyk4bmMum8lewZjWrn01IZXsY1utk/searchSkills/serialize~json@1.0?query=blockchain
```

---

### 2. get-skill.lua

**Function**: `getSkill(base, req)`

**Purpose**: Retrieve skill details by name (latest version)

**Parameters**:
- `name` (string, required) - Skill name

**Returns**:
```json
{
  "skill": { ... },
  "status": 200
}
```

**Transaction ID**: `oH8kYBrZAv2J1O2htWCMkyaUhdG1IddSFwr3lzCAfEA`

**Example URL**:
```
https://hb.randao.net/0JwigA4ZGMredBmVq0M092gT5Liic_Yxv8c6T0tiFDw~process@1.0/now/~lua@5.3a&module=oH8kYBrZAv2J1O2htWCMkyaUhdG1IddSFwr3lzCAfEA/getSkill/serialize~json@1.0?name=ao-basics
```

---

### 3. get-skill-versions.lua

**Function**: `getSkillVersions(base, req)`

**Purpose**: Retrieve version history for a skill (sorted by version, latest first)

**Parameters**:
- `name` (string, required) - Skill name

**Returns**:
```json
{
  "versions": [...],
  "latest": "1.0.0",
  "total": 3,
  "status": 200
}
```

**Transaction ID**: `qRlxuHc_NnhOnfql1oaJ1CrTbjViDOXcLbkXZpLmJGo`

**Example URL**:
```
https://hb.randao.net/0JwigA4ZGMredBmVq0M092gT5Liic_Yxv8c6T0tiFDw~process@1.0/now/~lua@5.3a&module=qRlxuHc_NnhOnfql1oaJ1CrTbjViDOXcLbkXZpLmJGo/getSkillVersions/serialize~json@1.0?name=ao-basics
```

---

### 4. get-download-stats.lua

**Function**: `getDownloadStats(base, req)`

**Purpose**: Retrieve download statistics by skill name (total + per-version)

**Parameters**:
- `name` (string, required) - Skill name

**Returns**:
```json
{
  "skillName": "ao-basics",
  "totalDownloads": 42,
  "versions": {
    "1.0.0": { "version": "1.0.0", "downloads": 42 }
  },
  "latestVersion": "1.0.0",
  "status": 200
}
```

**Transaction ID**: `pbdp0HUfN3pnJzYo0mRkF-n9D1lGsg6NYRREEo5BvZ8`

**Example URL**:
```
https://hb.randao.net/0JwigA4ZGMredBmVq0M092gT5Liic_Yxv8c6T0tiFDw~process@1.0/now/~lua@5.3a&module=pbdp0HUfN3pnJzYo0mRkF-n9D1lGsg6NYRREEo5BvZ8/getDownloadStats/serialize~json@1.0?name=ao-basics
```

---

### 5. info.lua

**Function**: `info(base, req)`

**Purpose**: Return ADP v1.0 compliant registry metadata

**Parameters**: None

**Returns**:
```json
{
  "process": {
    "name": "Agent Skills Registry",
    "version": "2.1.0",
    "adpVersion": "1.0",
    "capabilities": [...]
  },
  "handlers": [...],
  "documentation": {...},
  "status": 200
}
```

**Transaction ID**: `fKI_pC6Mo0iRad3CADOkdwPHxTxL3OXfML5curbh3x4`

**Example URL**:
```
https://hb.randao.net/0JwigA4ZGMredBmVq0M092gT5Liic_Yxv8c6T0tiFDw~process@1.0/now/~lua@5.3a&module=fKI_pC6Mo0iRad3CADOkdwPHxTxL3OXfML5curbh3x4/info/serialize~json@1.0
```

---

### 6. list-skills.lua

**Function**: `listSkills(base, req)`

**Purpose**: List skills with pagination and filtering (author, tags, name)

**Parameters**:
- `limit` (number, optional, default: 10) - Results per page (max: 100)
- `offset` (number, optional, default: 0) - Pagination offset
- `author` (string, optional) - Filter by author (case-insensitive)
- `filterTags` (JSON array, optional) - Filter by tags (must have ALL)
- `filterName` (string, optional) - Filter by name pattern (substring match)

**Returns**:
```json
{
  "skills": [...],
  "pagination": {
    "total": 100,
    "limit": 10,
    "offset": 0,
    "returned": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "status": 200
}
```

**Transaction ID**: `gxeEPGrxbfh4Uf7NEbPdE2iSTgALaz58RX8zrAreAqs`

**Example URL**:
```
https://hb.randao.net/0JwigA4ZGMredBmVq0M092gT5Liic_Yxv8c6T0tiFDw~process@1.0/now/~lua@5.3a&module=gxeEPGrxbfh4Uf7NEbPdE2iSTgALaz58RX8zrAreAqs/listSkills/serialize~json@1.0?limit=10&offset=0
```

---

## HyperBEAM URL Pattern

```
https://hb.randao.net/{PROCESS_ID}~process@1.0/now/~lua@5.3a&module={SCRIPT_TX_ID}/{FUNCTION_NAME}/serialize~json@1.0?param1=value1
```

### Components

- `/{PROCESS_ID}~process@1.0` - Target AO process
- `/now` - Access current state (use `/cache` for faster cached reads)
- `/~lua@5.3a&module={SCRIPT_TX_ID}` - Lua execution with script location on Arweave
- `/{FUNCTION_NAME}` - Function to invoke from script
- `/serialize~json@1.0` - Format output as JSON
- `?param1=value1` - Optional query parameters passed to `req` object

## Frontend Integration

See `frontend/src/lib/hyperbeam-client.ts` for TypeScript client implementation.

### Usage Example

```typescript
import {
  buildHyperbeamUrl,
  hyperbeamFetch,
  SEARCH_SKILLS_SCRIPT_ID,
} from '@/lib/hyperbeam-client';

// Build URL
const url = buildHyperbeamUrl(SEARCH_SKILLS_SCRIPT_ID, 'searchSkills', {
  query: 'blockchain',
});

// Fetch with dryrun fallback
const response = await hyperbeamFetch(url, async () => {
  // Fallback to traditional dryrun if HyperBEAM fails
  return await dryrunFallback();
});
```

## Testing

See `ao-process/hyperbeam/deployment-log.md` for all transaction IDs and manual testing URLs.

## Performance Expectations

- **HyperBEAM**: <500ms average response time
- **Traditional Dryrun**: 1000-1500ms average response time
- **Improvement**: 50%+ faster

## Notes

- All scripts are permanent and immutable on Arweave
- Scripts are read-only - state mutations still require message passing
- Download tracking (`Record-Download`) remains message-based for state mutation
- HyperBEAM responses are cached at the node level for optimal performance

## Resources

- [HyperBEAM Documentation](https://hyperbeam.arweave.net/build/introduction/what-is-hyperbeam.html)
- [AO Documentation](https://cookbook_ao.arweave.net/)
- [Dynamic Reads Guide](https://cookbook_ao.arweave.net/guides/hyperbeam/core/dynamic-reads.html)

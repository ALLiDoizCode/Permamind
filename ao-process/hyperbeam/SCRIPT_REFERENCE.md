# HyperBEAM Dynamic Read Scripts Reference

Comprehensive reference documentation for all deployed HyperBEAM dynamic read transformation scripts.

## Overview

This document provides detailed interface specifications for the 6 dynamic read scripts deployed to Arweave mainnet. These scripts enable server-side query execution on HyperBEAM nodes, delivering fast (<500ms) read-only access to registry state.

**Common Patterns:**
- All scripts use signature: `function functionName(base, req)`
- `base`: Cached AO process state (`{Skills = {...}}`)
- `req`: HTTP request parameters (query string values)
- Return: JSON-serializable table with status codes

---

## 1. search-skills.lua

### Purpose
Search skills by keyword (name, description, tags, author) with case-insensitive matching.

### Transaction ID
`hjL7_fEj2onw1Uhyk4bmMum8lewZjWrn01IZXsY1utk`

### Function Signature
```lua
function searchSkills(base, req)
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | No | Search term (empty returns all skills) |

### Return Format
```json
{
  "results": [
    {
      "name": "skill-name",
      "version": "1.0.0",
      "description": "...",
      "author": "...",
      "tags": ["tag1", "tag2"],
      "..."
    }
  ],
  "total": 10,
  "query": "search term"
}
```

### Behavior
- **Empty query**: Returns all skills (latest versions only)
- **Case-insensitive**: "AO" matches "ao", "Ao", etc.
- **Search fields**: name, description, tags (array), author
- **Substring matching**: "block" matches "blockchain"
- **Latest version only**: Returns only the latest version of each skill

### Example URLs
```
# Search for blockchain-related skills
https://hb.randao.net/{PROCESS_ID}~process@1.0/now/~lua@5.3a&module=hjL7_fEj2onw1Uhyk4bmMum8lewZjWrn01IZXsY1utk/searchSkills/serialize~json@1.0?query=blockchain

# Return all skills
https://hb.randao.net/{PROCESS_ID}~process@1.0/now/~lua@5.3a&module=hjL7_fEj2onw1Uhyk4bmMum8lewZjWrn01IZXsY1utk/searchSkills/serialize~json@1.0?query=
```

### Edge Cases
- Non-existent query: Returns empty `results` array
- Special characters: Handled correctly (e.g., "docker-kubernetes")
- Very long queries: Processed normally (no truncation)

---

## 2. get-skill.lua

### Purpose
Retrieve skill details by name (latest version).

### Transaction ID
`oH8kYBrZAv2J1O2htWCMkyaUhdG1IddSFwr3lzCAfEA`

### Function Signature
```lua
function getSkill(base, req)
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Skill name (case-sensitive) |

### Return Format

**Success (200)**:
```json
{
  "skill": {
    "name": "skill-name",
    "version": "1.0.0",
    "description": "...",
    "author": "...",
    "owner": "...",
    "tags": ["tag1", "tag2"],
    "arweaveTxId": "...",
    "dependencies": ["dep1"],
    "bundledFiles": [...],
    "changelog": "...",
    "downloadCount": 100,
    "publishedAt": 1234567890,
    "updatedAt": 1234567890
  },
  "status": 200
}
```

**Error (400 - Missing name)**:
```json
{
  "error": "Name parameter is required",
  "status": 400
}
```

**Error (404 - Not found)**:
```json
{
  "error": "Skill not found: skill-name",
  "status": 404
}
```

### Example URL
```
https://hb.randao.net/{PROCESS_ID}~process@1.0/now/~lua@5.3a&module=oH8kYBrZAv2J1O2htWCMkyaUhdG1IddSFwr3lzCAfEA/getSkill/serialize~json@1.0?name=ao-basics
```

### Error Scenarios
- Missing `name` parameter → 400
- Empty `name` parameter → 400
- Non-existent skill → 404
- Skill with no latest version → 500

---

## 3. list-skills.lua

### Purpose
List skills with pagination and advanced filtering (author, tags, name pattern).

### Transaction ID
`gxeEPGrxbfh4Uf7NEbPdE2iSTgALaz58RX8zrAreAqs`

### Function Signature
```lua
function listSkills(base, req)
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | 10 | Results per page (max: 100) |
| `offset` | number | No | 0 | Pagination offset |
| `author` | string | No | - | Filter by author (case-insensitive exact match) |
| `filterTags` | JSON array | No | - | Filter by tags (must have ALL specified tags) |
| `filterName` | string | No | - | Filter by name pattern (case-insensitive substring) |

### Return Format
```json
{
  "skills": [
    {"name": "...", "version": "...", "...": "..."}
  ],
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

### Filtering Logic
- **Author**: Case-insensitive exact match (e.g., "john smith" matches "John Smith")
- **Tags**: AND logic - skill must have ALL specified tags
- **Name**: Case-insensitive substring match (e.g., "ao" matches "ao-basics")
- **Combined**: All filters applied together (AND logic)

### Pagination Behavior
- **Limit bounds**: Clamped to 1-100 range
- **Offset bounds**: Clamped to 0 minimum
- **hasNextPage**: `true` if `offset + limit < total`
- **hasPrevPage**: `true` if `offset > 0`

### Example URLs
```
# Default pagination (limit=10, offset=0)
https://hb.randao.net/{PROCESS_ID}~process@1.0/now/~lua@5.3a&module=gxeEPGrxbfh4Uf7NEbPdE2iSTgALaz58RX8zrAreAqs/listSkills/serialize~json@1.0

# Custom pagination
https://hb.randao.net/{PROCESS_ID}~process@1.0/now/~lua@5.3a&module=gxeEPGrxbfh4Uf7NEbPdE2iSTgALaz58RX8zrAreAqs/listSkills/serialize~json@1.0?limit=25&offset=50

# Filter by author
https://hb.randao.net/{PROCESS_ID}~process@1.0/now/~lua@5.3a&module=gxeEPGrxbfh4Uf7NEbPdE2iSTgALaz58RX8zrAreAqs/listSkills/serialize~json@1.0?author=John%20Smith

# Filter by tags (JSON array)
https://hb.randao.net/{PROCESS_ID}~process@1.0/now/~lua@5.3a&module=gxeEPGrxbfh4Uf7NEbPdE2iSTgALaz58RX8zrAreAqs/listSkills/serialize~json@1.0?filterTags=%5B%22web3%22%2C%22blockchain%22%5D

# Filter by name pattern
https://hb.randao.net/{PROCESS_ID}~process@1.0/now/~lua@5.3a&module=gxeEPGrxbfh4Uf7NEbPdE2iSTgALaz58RX8zrAreAqs/listSkills/serialize~json@1.0?filterName=ao
```

### Edge Cases
- Limit > 100: Capped at 100
- Limit < 1: Set to 1
- Offset > total: Returns empty `skills` array
- Invalid JSON in `filterTags`: Defaults to empty array
- Empty filter values: Ignored (no filtering applied)

---

## 4. get-skill-versions.lua

### Purpose
Retrieve version history for a skill (sorted by version number, latest first).

### Transaction ID
`qRlxuHc_NnhOnfql1oaJ1CrTbjViDOXcLbkXZpLmJGo`

### Function Signature
```lua
function getSkillVersions(base, req)
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Skill name |

### Return Format

**Success (200)**:
```json
{
  "versions": [
    {
      "name": "skill-name",
      "version": "1.2.0",
      "description": "...",
      "..."
    },
    {
      "name": "skill-name",
      "version": "1.1.0",
      "..."
    },
    {
      "name": "skill-name",
      "version": "1.0.0",
      "..."
    }
  ],
  "latest": "1.2.0",
  "total": 3,
  "status": 200
}
```

**Error (400)**:
```json
{
  "error": "Name parameter is required",
  "status": 400
}
```

**Error (404)**:
```json
{
  "error": "Skill not found: skill-name",
  "status": 404
}
```

### Sorting
- Versions sorted by semantic version number (descending)
- Latest version first (e.g., 1.2.0 before 1.1.0 before 1.0.0)
- Uses semantic version comparison (major.minor.patch)

### Example URL
```
https://hb.randao.net/{PROCESS_ID}~process@1.0/now/~lua@5.3a&module=qRlxuHc_NnhOnfql1oaJ1CrTbjViDOXcLbkXZpLmJGo/getSkillVersions/serialize~json@1.0?name=ao-basics
```

---

## 5. get-download-stats.lua

### Purpose
Retrieve download statistics by skill name (total + per-version breakdown).

### Transaction ID
`pbdp0HUfN3pnJzYo0mRkF-n9D1lGsg6NYRREEo5BvZ8`

### Function Signature
```lua
function getDownloadStats(base, req)
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Skill name |

### Return Format

**Success (200)**:
```json
{
  "skillName": "ao-basics",
  "totalDownloads": 277,
  "versions": {
    "1.0.0": {
      "version": "1.0.0",
      "downloads": 150
    },
    "1.1.0": {
      "version": "1.1.0",
      "downloads": 85
    },
    "1.2.0": {
      "version": "1.2.0",
      "downloads": 42
    }
  },
  "latestVersion": "1.2.0",
  "status": 200
}
```

**Error (400/404)**: Same as get-skill.lua

### Calculation
- `totalDownloads`: Sum of `downloadCount` across all versions
- `versions`: Per-version breakdown with download counts
- Zero downloads: Returns 0 (not null/undefined)

### Example URL
```
https://hb.randao.net/{PROCESS_ID}~process@1.0/now/~lua@5.3a&module=pbdp0HUfN3pnJzYo0mRkF-n9D1lGsg6NYRREEo5BvZ8/getDownloadStats/serialize~json@1.0?name=ao-basics
```

---

## 6. info.lua

### Purpose
Return ADP v1.0 compliant registry process metadata (self-documentation).

### Transaction ID
`fKI_pC6Mo0iRad3CADOkdwPHxTxL3OXfML5curbh3x4`

### Function Signature
```lua
function info(base, req)
```

### Parameters
**None** (no parameters required)

### Return Format
```json
{
  "process": {
    "name": "Agent Skills Registry",
    "version": "2.1.0",
    "adpVersion": "1.0",
    "capabilities": [
      "register", "update", "search", "retrieve",
      "version-history", "pagination", "filtering",
      "download-stats"
    ],
    "messageSchemas": {
      "Register-Skill": {
        "required": ["Action", "Name", "Version", "..."],
        "optional": ["Tags", "Dependencies", "..."]
      },
      "..."
    }
  },
  "handlers": [
    "Register-Skill", "Update-Skill", "Search-Skills",
    "List-Skills", "Get-Skill", "Get-Skill-Versions",
    "Record-Download", "Get-Download-Stats", "Info"
  ],
  "documentation": {
    "adpCompliance": "v1.0",
    "selfDocumenting": true,
    "description": "Decentralized registry for Claude Agent Skills..."
  },
  "status": 200
}
```

### Example URL
```
https://hb.randao.net/{PROCESS_ID}~process@1.0/now/~lua@5.3a&module=fKI_pC6Mo0iRad3CADOkdwPHxTxL3OXfML5curbh3x4/info/serialize~json@1.0
```

### ADP Compliance
- **Version**: ADP v1.0
- **Self-documenting**: Process metadata accessible via HTTP
- **Message schemas**: Complete input validation requirements
- **Capabilities**: Human-readable capability list

---

## HTTP Status Codes

| Code | Meaning | When Returned |
|------|---------|---------------|
| 200 | Success | Request processed successfully |
| 400 | Bad Request | Missing required parameter, invalid input |
| 404 | Not Found | Skill does not exist |
| 500 | Internal Error | Skill version data corrupted/missing |

---

## HyperBEAM URL Pattern

### Structure
```
https://{HB_NODE}/{PROCESS_ID}~process@1.0/{STATE_PATH}/~lua@5.3a&module={SCRIPT_TX_ID}/{FUNCTION_NAME}/serialize~json@1.0?{QUERY_PARAMS}
```

### Components

| Component | Description | Example |
|-----------|-------------|---------|
| `{HB_NODE}` | HyperBEAM node hostname | `hb.randao.net` |
| `{PROCESS_ID}` | AO process ID | `0JwigA4ZGMredBmVq0M092gT5Liic_Yxv8c6T0tiFDw` |
| `{STATE_PATH}` | State access path | `/now` (real-time) or `/cache` (cached) |
| `{SCRIPT_TX_ID}` | Script transaction ID on Arweave | `hjL7_fEj2onw1Uhyk4bmMum8lewZjWrn01IZXsY1utk` |
| `{FUNCTION_NAME}` | Function to invoke from script | `searchSkills` |
| `{QUERY_PARAMS}` | URL-encoded query parameters | `query=blockchain&limit=10` |

### State Paths
- **/now**: Access current process state (slower, always up-to-date)
- **/cache**: Access cached state (faster, may lag behind by seconds)

### Query Parameter Encoding
- Use standard URL encoding (e.g., `%20` for space)
- JSON arrays: URL-encode entire JSON string (e.g., `["tag1","tag2"]` → `%5B%22tag1%22%2C%22tag2%22%5D`)

---

## Performance Expectations

| Metric | Value | Notes |
|--------|-------|-------|
| Average response time | <500ms | HyperBEAM server-side execution |
| Traditional dryrun | 1000-1500ms | Client-side message passing |
| Performance improvement | ~50%+ | Faster than dryrun queries |

---

## Testing

All scripts have been validated with comprehensive test suites:
- **Location**: `ao-process/hyperbeam/tests/`
- **Framework**: Lua 5.4 with aolite emulation
- **Coverage**: 100% of script functions with multiple scenarios
- **Test runner**: `lua ao-process/hyperbeam/tests/run-hyperbeam-tests.lua`

### Test Scenarios Covered
- Happy path (valid inputs)
- Error scenarios (missing params, not found)
- Edge cases (empty inputs, boundary values)
- Pagination correctness (hasNextPage, hasPrevPage)
- Filter combination logic (AND vs OR)
- Case-insensitivity validation
- Return format structure validation

---

## Immutability Notice

⚠️ **IMPORTANT**: All scripts deployed to Arweave are **immutable and permanent**.

- Scripts cannot be modified or deleted
- Bugs require deploying new versions with new transaction IDs
- Frontend clients must be updated to use new script TXIDs
- Always test scripts thoroughly with aolite before deployment

---

## Resources

- [HyperBEAM Documentation](https://hyperbeam.arweave.net/build/introduction/what-is-hyperbeam.html)
- [AO Documentation](https://cookbook_ao.arweave.net/)
- [Dynamic Reads Guide](https://cookbook_ao.arweave.net/guides/hyperbeam/core/dynamic-reads.html)
- [Deployment Log](./deployment-log.md)
- [Frontend Integration Guide](./FRONTEND_INTEGRATION.md)

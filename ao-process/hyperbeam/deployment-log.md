# HyperBEAM Dynamic Reads Deployment Log

## Deployment Information

- **Date**: 2025-10-27
- **Network**: Arweave Mainnet
- **Payment Method**: AR tokens (auto-calculated)
- **Total Scripts**: 7
- **Content-Type**: application/lua

## Script Transaction IDs

### 1. search-skills.lua
- **Transaction ID**: `hjL7_fEj2onw1Uhyk4bmMum8lewZjWrn01IZXsY1utk`
- **Arweave URL**: https://arweave.net/hjL7_fEj2onw1Uhyk4bmMum8lewZjWrn01IZXsY1utk
- **Size**: 2,651 bytes
- **Function**: `searchSkills(base, req)`
- **Purpose**: Search skills by query term (name, description, tags, author)

### 2. get-skill.lua
- **Transaction ID**: `oH8kYBrZAv2J1O2htWCMkyaUhdG1IddSFwr3lzCAfEA`
- **Arweave URL**: https://arweave.net/oH8kYBrZAv2J1O2htWCMkyaUhdG1IddSFwr3lzCAfEA
- **Size**: 1,122 bytes
- **Function**: `getSkill(base, req)`
- **Purpose**: Retrieve skill details by name (latest version)

### 3. get-skill-versions.lua
- **Transaction ID**: `qRlxuHc_NnhOnfql1oaJ1CrTbjViDOXcLbkXZpLmJGo`
- **Arweave URL**: https://arweave.net/qRlxuHc_NnhOnfql1oaJ1CrTbjViDOXcLbkXZpLmJGo
- **Size**: 1,968 bytes
- **Function**: `getSkillVersions(base, req)`
- **Purpose**: Retrieve version history for a skill (sorted by version, latest first)

### 4. get-download-stats.lua
- **Transaction ID**: `pbdp0HUfN3pnJzYo0mRkF-n9D1lGsg6NYRREEo5BvZ8`
- **Arweave URL**: https://arweave.net/pbdp0HUfN3pnJzYo0mRkF-n9D1lGsg6NYRREEo5BvZ8
- **Size**: 1,401 bytes
- **Function**: `getDownloadStats(base, req)`
- **Purpose**: Retrieve download statistics by skill name (total + per-version)

### 5. info.lua
- **Transaction ID**: `fKI_pC6Mo0iRad3CADOkdwPHxTxL3OXfML5curbh3x4`
- **Arweave URL**: https://arweave.net/fKI_pC6Mo0iRad3CADOkdwPHxTxL3OXfML5curbh3x4
- **Size**: 2,345 bytes
- **Function**: `info(base, req)`
- **Purpose**: Return ADP v1.0 compliant registry metadata

### 6. list-skills.lua
- **Transaction ID**: `gxeEPGrxbfh4Uf7NEbPdE2iSTgALaz58RX8zrAreAqs`
- **Arweave URL**: https://arweave.net/gxeEPGrxbfh4Uf7NEbPdE2iSTgALaz58RX8zrAreAqs
- **Size**: 3,771 bytes
- **Function**: `listSkills(base, req)`
- **Purpose**: List skills with pagination and filtering (author, tags, name)

### 7. record-download.lua
- **Transaction ID**: `-jzL_97376OTQbf46__dr1MQBllkAJPuetVHlDq_KVA`
- **Arweave URL**: https://arweave.net/-jzL_97376OTQbf46__dr1MQBllkAJPuetVHlDq_KVA
- **Size**: 1,532 bytes
- **Function**: `recordDownload(base, req)`
- **Purpose**: Read-only download count query (actual increment via AO message)

## HyperBEAM URL Examples

### Base URL Pattern
```
https://hb.randao.net/{PROCESS_ID}~process@1.0/now/~lua@5.3a&module={SCRIPT_TX_ID}/{FUNCTION_NAME}/serialize~json@1.0
```

### Example URLs (using registry process: 0JwigA4ZGMredBmVq0M092gT5Liic_Yxv8c6T0tiFDw)

**Search Skills**:
```
https://hb.randao.net/0JwigA4ZGMredBmVq0M092gT5Liic_Yxv8c6T0tiFDw~process@1.0/now/~lua@5.3a&module=hjL7_fEj2onw1Uhyk4bmMum8lewZjWrn01IZXsY1utk/searchSkills/serialize~json@1.0?query=blockchain
```

**Get Skill**:
```
https://hb.randao.net/0JwigA4ZGMredBmVq0M092gT5Liic_Yxv8c6T0tiFDw~process@1.0/now/~lua@5.3a&module=oH8kYBrZAv2J1O2htWCMkyaUhdG1IddSFwr3lzCAfEA/getSkill/serialize~json@1.0?name=ao-basics
```

**List Skills** (with pagination):
```
https://hb.randao.net/0JwigA4ZGMredBmVq0M092gT5Liic_Yxv8c6T0tiFDw~process@1.0/now/~lua@5.3a&module=gxeEPGrxbfh4Uf7NEbPdE2iSTgALaz58RX8zrAreAqs/listSkills/serialize~json@1.0?limit=10&offset=0
```

**Get Skill Versions**:
```
https://hb.randao.net/0JwigA4ZGMredBmVq0M092gT5Liic_Yxv8c6T0tiFDw~process@1.0/now/~lua@5.3a&module=qRlxuHc_NnhOnfql1oaJ1CrTbjViDOXcLbkXZpLmJGo/getSkillVersions/serialize~json@1.0?name=ao-basics
```

**Get Download Stats**:
```
https://hb.randao.net/0JwigA4ZGMredBmVq0M092gT5Liic_Yxv8c6T0tiFDw~process@1.0/now/~lua@5.3a&module=pbdp0HUfN3pnJzYo0mRkF-n9D1lGsg6NYRREEo5BvZ8/getDownloadStats/serialize~json@1.0?name=ao-basics
```

**Info** (no parameters):
```
https://hb.randao.net/0JwigA4ZGMredBmVq0M092gT5Liic_Yxv8c6T0tiFDw~process@1.0/now/~lua@5.3a&module=fKI_pC6Mo0iRad3CADOkdwPHxTxL3OXfML5curbh3x4/info/serialize~json@1.0
```

## Usage Notes

- All scripts use the `/now` path for real-time state (use `/cache` for faster cached reads)
- Query parameters are passed via URL query string (e.g., `?query=term&limit=10`)
- Response format is JSON (via `serialize~json@1.0` device)
- Scripts are permanent and immutable on Arweave
- Expected response time: <500ms (vs >1s for traditional dryrun)

## Frontend Integration

These transaction IDs should be added as constants in `frontend/src/lib/hyperbeam-client.ts`:

```typescript
export const SEARCH_SKILLS_SCRIPT_ID = 'hjL7_fEj2onw1Uhyk4bmMum8lewZjWrn01IZXsY1utk';
export const GET_SKILL_SCRIPT_ID = 'oH8kYBrZAv2J1O2htWCMkyaUhdG1IddSFwr3lzCAfEA';
export const GET_SKILL_VERSIONS_SCRIPT_ID = 'qRlxuHc_NnhOnfql1oaJ1CrTbjViDOXcLbkXZpLmJGo';
export const GET_DOWNLOAD_STATS_SCRIPT_ID = 'pbdp0HUfN3pnJzYo0mRkF-n9D1lGsg6NYRREEo5BvZ8';
export const INFO_SCRIPT_ID = 'fKI_pC6Mo0iRad3CADOkdwPHxTxL3OXfML5curbh3x4';
export const LIST_SKILLS_SCRIPT_ID = 'gxeEPGrxbfh4Uf7NEbPdE2iSTgALaz58RX8zrAreAqs';
export const RECORD_DOWNLOAD_SCRIPT_ID = '-jzL_97376OTQbf46__dr1MQBllkAJPuetVHlDq_KVA';
```

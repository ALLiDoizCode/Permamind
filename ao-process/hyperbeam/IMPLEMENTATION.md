# HyperBEAM Patch Device Implementation

## Overview

This document details the implementation of HyperBEAM's Patch device (`patch@1.0`) integration in the Agent Skills Registry AO process. The Patch device enables HTTP-based state exposure, allowing frontend applications to query registry state via HTTP GET requests instead of slower message-based queries.

## Implementation Status

**Completion Date**: 2025-10-27 (Story 14.x implementation)
**Validation Date**: 2025-11-15 (Story 15.1 validation)
**Status**: ✅ Implemented and validated

## Architecture

### Patch Device Integration Pattern

The Patch device integration follows a two-phase pattern:

1. **Initial Sync**: One-time state exposure on process startup
2. **State Mutations**: Automatic state exposure after each registry modification

### State Structure Exposed

The Patch device exposes the `Skills` table, which contains the complete registry state:

```lua
Skills = {
  ["skill-name"] = {
    latest = "1.0.0",
    versions = {
      ["1.0.0"] = {
        name = "skill-name",
        version = "1.0.0",
        description = "Skill description (max 1024 chars)",
        author = "Author Name",
        owner = "abc123...xyz789",  -- 43-char Arweave address (msg.From)
        tags = {"tag1", "tag2", "tag3"},
        arweaveTxId = "def456...uvw012",  -- 43-char Arweave TXID
        dependencies = {"dep1@1.0.0", "dep2@2.0.0"},
        bundledFiles = {
          {name="SKILL.md", size=1234, icon="📘"},
          {name="script.lua", size=567, icon="📄"}
        },
        changelog = "Version 1.0.0 release notes...",
        downloadCount = 42,
        publishedAt = 1234567890,  -- Unix timestamp (msg.Timestamp)
        updatedAt = 1234567890,    -- Unix timestamp (msg.Timestamp)
        downloadTimestamps = {1234567890, 1234567891, ...}
      }
    }
  }
}
```

## Code Implementation

### 1. Initial Sync Pattern

**Location**: `ao-process/registry.lua:44-52`

```lua
-- Initial sync - runs once when process loads
InitialSync = InitialSync or 'INCOMPLETE'
if InitialSync == 'INCOMPLETE' then
  ao.send({
    device = 'patch@1.0',
    skills = json.encode(Skills),
  })
  InitialSync = 'COMPLETE'
end
```

**Purpose**: Ensures registry state is immediately available via HTTP when process starts.

**Behavior**:
- Runs once per process lifecycle (flag persists across process restarts)
- Exposes empty `Skills = {}` table if no skills registered yet
- Non-blocking (doesn't wait for HTTP confirmation)

### 2. Register-Skill Handler Integration

**Location**: `ao-process/registry.lua:325-328`

```lua
-- After successful skill registration
ao.send({
  device = 'patch@1.0',
  skills = json.encode(Skills),
})
ao.send({
  Target = msg.From,
  Action = "Skill-Registered",
  Name = name,
  Version = version,
  Success = "true"
})
```

**Trigger**: After new skill version added to `Skills` table
**State Exposed**: Complete `Skills` table (all registered skills)

### 3. Update-Skill Handler Integration

**Location**: `ao-process/registry.lua:493-496`

```lua
-- After successful skill update
ao.send({
  device = 'patch@1.0',
  skills = json.encode(Skills),
})
```

**Trigger**: After skill metadata updated (version, changelog, etc.)
**State Exposed**: Complete `Skills` table with updated skill data

## HTTP Endpoint Access

### URL Patterns

**Primary Endpoint (forward.computer)**:
```
https://forward.computer/{PROCESS_ID}~process@1.0/compute/skills
```

**Alternative Endpoint (HyperBEAM edge node)**:
```
https://hb-edge.randao.net/{PROCESS_ID}~process@1.0/now/skills
```

**Legacy Endpoint (deprecated)**:
```
https://hb.randao.net/{PROCESS_ID}~process@1.0/now/skills
```

### Registry Process IDs

**Production Registry**:
```
afj-S1wpWK07iSs9jIttoPJsptf4Db6ubZ_CLODdEpQ
```

**Development/Testing Registry** (used in deployment logs):
```
0JwigA4ZGMredBmVq0M092gT5Liic_Yxv8c6T0tiFDw
```

### Example Requests

**Using curl**:
```bash
# Query full registry state
curl -X GET \
  "https://forward.computer/afj-S1wpWK07iSs9jIttoPJsptf4Db6ubZ_CLODdEpQ~process@1.0/compute/skills" \
  -H "Accept: application/json"

# Query via HyperBEAM edge node
curl -X GET \
  "https://hb-edge.randao.net/afj-S1wpWK07iSs9jIttoPJsptf4Db6ubZ_CLODdEpQ~process@1.0/now/skills" \
  -H "Accept: application/json"
```

**Expected Response** (HTTP 200):
```json
{
  "ao-basics": {
    "latest": "1.0.0",
    "versions": {
      "1.0.0": {
        "name": "ao-basics",
        "version": "1.0.0",
        "description": "Learn AO protocol fundamentals...",
        "author": "Permamind Team",
        "owner": "abc123...xyz789",
        "tags": ["ao", "protocol", "beginner"],
        "arweaveTxId": "def456...uvw012",
        "dependencies": [],
        "bundledFiles": [{"name": "SKILL.md", "size": 5432, "icon": "📘"}],
        "changelog": "Initial release",
        "downloadCount": 15,
        "publishedAt": 1730000000,
        "updatedAt": 1730000000,
        "downloadTimestamps": [1730001000, 1730002000, ...]
      }
    }
  },
  "arweave-fundamentals": { ... }
}
```

## Infrastructure Status (As of 2025-11-15)

### forward.computer Endpoint

**Status**: ⚠️ Operational but requires funding

**Test Result**:
```bash
$ curl "https://forward.computer/afj-S1wpWK07iSs9jIttoPJsptf4Db6ubZ_CLODdEpQ~process@1.0/compute/skills"
{
  "status": 402,
  "body": "Insufficient funds",
  "balance": -9.15e7,
  "price": 4500000
}
```

**Issue**: Registry process lacks AR tokens for compute operations on forward.computer
**Workaround**: Fund registry process or use alternative endpoint

### hb-edge.randao.net Endpoint

**Status**: ⚠️ Partial connectivity issues

**Test Result**:
- TCP connection: ✅ Successful (138.201.54.34:443)
- TLS handshake: ✅ Successful
- HTTP response: ⏱️ Timeout waiting for response

**Issue**: Backend CU (Compute Unit) connection failure (`localhost:6363` refused)
**Root Cause**: HyperBEAM node backend configuration issue

### hb.randao.net Endpoint

**Status**: ❌ Unreachable

**Test Result**:
```bash
$ curl --max-time 10 "https://hb.randao.net/..."
curl: (28) Connection timed out after 10001 milliseconds
```

**Issue**: DNS resolves but TCP connection hangs
**Action**: Deprecated - use `hb-edge.randao.net` instead

## Backward Compatibility

### Message-Based Access (Unchanged)

All existing message-based handlers remain functional:

- `Register-Skill` - Skill registration via AO messages
- `Search-Skills` - Query skills via dryrun
- `Get-Skill` - Retrieve skill via dryrun
- `Info` - ADP v1.0 metadata via dryrun
- `List-Skills` - Paginated listing via dryrun

**CLI Integration**: ✅ No changes required (uses @permaweb/aoconnect message passing)
**MCP Server Integration**: ✅ No changes required (uses sendAOMessage/readAOProcess)

### Test Results

**AO Process Unit Tests**: ✅ All tests passed (2025-11-15)

```
✅ PASSED: info-handler.test.lua
✅ PASSED: register-skill.test.lua
✅ PASSED: search-skills.test.lua
✅ PASSED: get-skill.test.lua
✅ PASSED: version-history.test.lua
✅ PASSED: list-skills.test.lua
✅ PASSED: changelog.test.lua
✅ PASSED: download-tracking.test.lua
✅ PASSED: download-stats.test.lua
✅ PASSED: get-download-stats.test.lua
```

**Test Coverage**: 10/10 test files passing
**Regression Status**: ✅ Zero breaking changes

## Troubleshooting

### Issue: HTTP 402 Payment Required

**Symptom**: `forward.computer` returns `"Insufficient funds"`
**Cause**: Registry process balance too low for compute operations
**Solution**: Fund registry process with AR tokens or use alternative endpoint

### Issue: HTTP Endpoint Timeout

**Symptom**: Request hangs indefinitely or times out after 10-30 seconds
**Cause**: HyperBEAM node backend (CU) connectivity issues
**Solution**:
1. Try alternative HyperBEAM endpoint
2. Verify process ID is correct
3. Check HyperBEAM node status/health
4. Fall back to message-based queries via @permaweb/aoconnect

### Issue: Empty Response or Null Skills

**Symptom**: HTTP 200 but empty `{}` or `null` response
**Cause**: Initial sync not triggered or registry has no skills
**Solution**:
1. Verify `InitialSync = 'COMPLETE'` flag set in process state
2. Register at least one test skill to populate registry
3. Query process state via Info handler to confirm Skills table

### Issue: Stale Data

**Symptom**: HTTP response doesn't reflect recent skill registrations
**Cause**: Patch device call not triggered after registration
**Solution**:
1. Verify Patch device call exists in handler code (lines 325-328, 493-496)
2. Check AO process logs for Patch device send confirmation
3. Clear HyperBEAM cache (use `/now` instead of `/cache` in URL)

## Performance Characteristics

### HTTP Access (Patch Device)

- **Latency**: <500ms (target, infrastructure-dependent)
- **Throughput**: No message confirmation required (fire-and-forget)
- **Caching**: HyperBEAM supports `/cache` path for faster reads
- **Consistency**: Eventually consistent (Patch device updates async)

### Message-Based Access (Legacy)

- **Latency**: 1-3 seconds (dryrun queries)
- **Throughput**: Limited by CU/MU message processing
- **Caching**: No built-in caching (query process state each time)
- **Consistency**: Strongly consistent (direct process state access)

## Future Enhancements

See `ao-process/hyperbeam/README.md` for Dynamic Read transformations (Story 15.2):

- Search filtering via Lua scripts
- Tag-based queries
- Pagination support
- Fuzzy search capabilities

## Related Documentation

- **Dynamic Reads**: `ao-process/hyperbeam/README.md`
- **Deployment Log**: `ao-process/hyperbeam/deployment-log.md`
- **Epic 15 PRD**: `docs/prd/epic-15-hyperbeam-registry-migration.md`
- **Story 15.1**: `docs/stories/15.1.story.md`
- **AO Process README**: `ao-process/README.md`

## Validation Checklist

- [x] Initial sync pattern implemented (registry.lua:44-52)
- [x] Register-Skill Patch call implemented (registry.lua:325-328)
- [x] Update-Skill Patch call implemented (registry.lua:493-496)
- [x] All AO process unit tests passing (10/10)
- [x] Backward compatibility confirmed (no breaking changes)
- [ ] HTTP endpoint fully accessible (infrastructure issues)
- [ ] State structure validated via HTTP response (blocked by infrastructure)

---

**Last Updated**: 2025-11-15
**Story**: 15.1 - Registry Process HyperBEAM Integration
**Status**: Implementation complete, infrastructure validation pending

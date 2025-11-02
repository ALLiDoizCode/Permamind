# Epic 7: HyperBEAM Performance Optimization

**Epic Type:** Brownfield Enhancement
**Scope:** Small (1-3 stories)
**Risk Level:** Low
**Status:** Draft

---

## Epic Goal

Optimize the Permamind web frontend's data fetching performance by migrating from traditional aoconnect dryrun queries to HyperBEAM Dynamic Reads, reducing average response times from >1s to <500ms and offloading computation from browsers to serverless HyperBEAM nodes, while maintaining backward compatibility with existing dryrun functionality.

---

## Epic Description

### Existing System Context

**Current relevant functionality:**
- Web frontend (from Epic 6) uses `@permaweb/aoconnect` dryrun queries for all read-only registry operations
- Average response time: 1000-1500ms for skill searches and detail queries
- Client-side JSON parsing of AO process responses
- All registry handlers are read-only (Search-Skills, List-Skills, Get-Skill, Get-Skill-Versions, Info, Get-Download-Stats)
- React Query hooks manage caching and data fetching
- Randao CU/MU endpoints configured

**Technology stack:**
- React + TypeScript frontend with Vite
- `@permaweb/aoconnect` for AO message passing
- React Query for data caching
- AO registry process: deployed and functional
- Randao gateway infrastructure

**Integration points:**
- AO registry process via aoconnect dryrun
- React Query hooks for data fetching
- Frontend components consuming skill data
- No changes to AO process required (read-only transformation layer)

### Enhancement Details

**What's being added/changed:**

1. Create Lua transformation scripts for HyperBEAM Dynamic Reads
2. Deploy Lua scripts to Arweave as permanent functions
3. Create HyperBEAM client module for HTTP-based queries
4. Update React Query hooks to use HyperBEAM with dryrun fallback
5. Implement fire-and-forget download tracking
6. Add performance monitoring and comparison metrics

**How it integrates:**

- HyperBEAM Dynamic Reads provide serverless HTTP endpoints for read queries
- Lua transformation functions execute on HyperBEAM nodes (server-side computation)
- Frontend makes simple HTTP GET requests instead of message-based dryrun
- Backward compatibility: Falls back to dryrun if HyperBEAM fails
- No AO process changes required (Lua scripts query existing process state)
- React Query hooks abstract the change (components unchanged)

**Success criteria:**

- Average response time <500ms (50%+ improvement over dryrun)
- All read-only queries migrated to HyperBEAM
- Backward compatibility: Dryrun fallback functional
- Zero breaking changes to frontend components
- Lua transformation scripts deployed to Arweave
- Integration tests verify HyperBEAM endpoints
- Performance metrics demonstrate improvement

---

## Stories

### Story 7.1: HyperBEAM Dynamic Reads Implementation

Implement HyperBEAM Dynamic Reads for all read-only registry queries by creating Lua transformation functions, deploying to Arweave, and updating frontend hooks with backward-compatible fallback to dryrun.

**Acceptance Criteria:**

1. Lua transformation functions created for all read-only handlers: search-skills, get-skill, get-skill-versions, record-download, get-download-stats, info, list-skills
2. Each Lua function accepts `base` (process state) and `req` (request parameters) as inputs
3. Lua functions published to Arweave with correct content-type: `application/lua`
4. HyperBEAM URLs constructed following pattern: `/{PROCESS_ID}~process@1.0/now/~lua@5.3a&module={SCRIPT_TX_ID}/{function_name}/serialize~json@1.0`
5. Frontend hyperbeamClient module created in `src/lib/hyperbeam-client.ts`
6. hyperbeamClient uses `VITE_HYPERBEAM_NODE` environment variable (default: `https://hb.randao.net`)
7. All existing React Query hooks updated to use HyperBEAM Dynamic Reads instead of dryrun
8. Backward compatibility: Fallback to dryrun if HyperBEAM request fails
9. Response parsing validates JSON structure and handles errors gracefully
10. Download tracking (record-download) implemented as fire-and-forget HTTP GET request
11. Performance improvement: HyperBEAM requests respond <500ms (vs >1s for dryrun)
12. Integration tests verify all Dynamic Reads endpoints return correct data
13. Lua transformation scripts stored in `ao-process/hyperbeam/` directory
14. Script deployment documented with Arweave transaction IDs in deployment log
15. Environment variables updated in `.env` and `.env.example` files

---

## Compatibility Requirements

- ✅ Existing APIs remain unchanged (AO process not modified)
- ✅ Database schema changes are backward compatible (N/A - no schema changes)
- ✅ UI changes follow existing patterns (hooks abstraction maintains component compatibility)
- ✅ Performance impact is positive (50%+ improvement in response times)
- ✅ Graceful degradation (fallback to dryrun if HyperBEAM unavailable)

---

## Risk Mitigation

**Primary Risk:**
HyperBEAM node availability, rate limiting, or compatibility issues with Lua transformation scripts

**Mitigation:**
- Implement automatic fallback to dryrun on HyperBEAM failures
- Add timeout handling (5 seconds) for HyperBEAM requests
- Test Lua transformation scripts locally before Arweave deployment
- Monitor HyperBEAM response times and error rates
- Document HyperBEAM node alternatives for future failover
- Comprehensive integration testing of all endpoints

**Rollback Plan:**
- React Query hooks can revert to dryrun-only (remove HyperBEAM calls)
- No database migrations or schema changes to revert
- Lua scripts on Arweave remain harmless (read-only, never executed if not called)
- Environment variable removal reverts to dryrun behavior

---

## Definition of Done

- ✅ All stories completed with acceptance criteria met
- ✅ Existing functionality verified through testing (no breaking changes to frontend)
- ✅ Integration points working correctly (HyperBEAM endpoints responding, fallback functional)
- ✅ Documentation updated appropriately (deployment log, README, architecture docs)
- ✅ No regression in existing features (all frontend functionality intact)
- ✅ Performance metrics demonstrate <500ms average response time
- ✅ Integration tests pass for all HyperBEAM endpoints

---

## Technical Context

**HyperBEAM Architecture:**

HyperBEAM Dynamic Reads enable "on-the-fly computations on your process state using Lua transformation functions" via a four-step pipeline:

1. **State Retrieval**: Fetch latest AO process state from network
2. **Device Pipeline**: Pass state as `base` message to `lua@5.3a` device
3. **Script Execution**: Load and execute Lua function from Arweave transaction
4. **Result Return**: Serialize and return computed output via HTTP

**Benefits over Traditional Dryrun:**
- Server-side computation (offload from browsers)
- Reduced bandwidth (return only computed results)
- Stateless clients (browsers as simple data consumers)
- Performance: <500ms response time (vs >1s for dryrun)
- HTTP-native (standard REST endpoints, no WebSocket/message passing)

**URL Pattern:**
```
GET /{PROCESS_ID}~process@1.0/now/~lua@5.3a&module={SCRIPT_TX_ID}/{function_name}/serialize~json@1.0?param1=value1
```

**Components:**
- `/{PROCESS_ID}~process@1.0` - Target AO process
- `/now` - Access current state (use `/cache` for faster cached reads)
- `/~lua@5.3a&module={SCRIPT_TX_ID}` - Lua execution with script location on Arweave
- `/{function_name}` - Function to invoke from script
- `/serialize~json@1.0` - Format output as JSON
- `?param1=value1` - Optional query parameters passed to `req` object

**Lua Transformation Function Pattern:**
```lua
function functionName(base, req)
  -- base: Cached state data from AO process
  -- req: Incoming request object with parameters

  local result = processLogic(base, req)

  return { data = result, total = count }
end
```

**Frontend Integration Strategy:**
```typescript
async function hyperbeamFetch(url: string, fallbackFn?: () => Promise<any>) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn('HyperBEAM failed, falling back to dryrun:', error);
    if (fallbackFn) return await fallbackFn();
    throw error;
  }
}
```

**Handlers to Migrate:**

1. **search-skills** - Search functionality with query parameter
2. **list-skills** - Paginated listing with filters
3. **get-skill** - Skill detail retrieval
4. **get-skill-versions** - Version history
5. **get-download-stats** - Download statistics
6. **info** - Registry metadata
7. **record-download** - Fire-and-forget download tracking

**Performance Expectations:**
- **Baseline (Current Dryrun)**: 1000-1500ms average
- **Target (HyperBEAM)**: <500ms average (50%+ improvement)

---

## Story Manager Handoff

**Context for Story Development:**

"Please develop detailed user stories for this brownfield epic. Key considerations:

- This is a performance enhancement to the existing **Epic 6 web frontend**
- Integration points:
  - **HyperBEAM nodes** (`https://hb.randao.net` primary)
  - **Arweave** for Lua script storage (`@permaweb/arx` CLI)
  - **Existing React Query hooks** (maintain interface compatibility)
  - **AO registry process** (read-only, no modifications)
- Existing patterns to follow:
  - **Backward compatibility** - fallback to dryrun on failures
  - **React Query caching** - maintain existing cache strategy
  - **Jest + Playwright testing** - comprehensive coverage
  - **TypeScript strict mode** - type safety for new client module
- Critical compatibility requirements:
  - **Zero breaking changes** to frontend components
  - **Graceful degradation** if HyperBEAM unavailable
  - **Performance monitoring** to validate improvements
  - **Read-only operations** - no state mutations
- Each story must include:
  - **Lua transformation script specifications** with function signatures
  - **Arweave deployment steps** with verification
  - **Frontend integration tests** with Playwright
  - **Performance benchmarks** comparing HyperBEAM vs dryrun
  - **Fallback testing** to ensure reliability

The epic should deliver **measurable performance improvements while maintaining 100% backward compatibility** with existing frontend functionality."

---

**Created:** 2025-10-27
**Author:** Product Owner (Sarah) / Technical Lead
**Epic Number:** 7

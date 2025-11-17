# Epic 15: HyperBEAM Registry Migration - Brownfield Enhancement

## Epic Goal

Migrate the AO registry process to leverage HyperBEAM's HTTP state exposure capabilities via the Patch device and Dynamic Reads, enabling the frontend to query skill metadata directly through HTTP GET requests instead of message passing. This delivers significantly improved performance for search/browse operations while maintaining full backward compatibility with existing CLI and MCP server integrations.

## Epic Description

### Existing System Context

**Current Registry Architecture:**
- **Technology Stack**: AO process with Lua handlers running on AO mainnet
- **Data Structure**: Lua tables storing skill metadata (name, version, author, tags, description, Arweave TXID, dependencies)
- **Access Pattern**: Message passing via @permaweb/aoconnect (`sendAOMessage`, `readAOProcess` dryruns)
- **Integration Points**:
  - CLI tool: Publishes skills via `Register-Skill` action, queries via `Search-Skills` and `Get-Skill`
  - MCP server: Same message-based access patterns
  - Frontend: Currently relies on message passing for search/browse (slower)

**Current Handlers:**
- `Register-Skill` - Add new skill to registry (write operation)
- `Search-Skills` - Query skills by name/description/tags (read operation)
- `Get-Skill` - Retrieve specific skill metadata (read operation)
- `Info` - ADP v1.0 compliance for self-documentation (read operation)

### Enhancement Details

**What's Being Added:**
- **HTTP State Exposure**: Use HyperBEAM's Patch device to expose registry state via HTTP GET endpoints
- **Dynamic Read Transformations**: Create Lua scripts for complex queries (search, filtering) that execute on-demand
- **Initial Sync Pattern**: One-time state synchronization on registry process startup to make skill index immediately available
- **Dual Access Support**: Maintain existing message-based access while adding HTTP endpoints for frontend optimization

**How It Integrates:**
- **Registry Process**: Enhanced with `Send({device = 'patch@1.0', ...})` calls after state modifications
- **Frontend**: New HTTP client using `fetch()` to query `forward.computer` endpoints directly
- **CLI/MCP**: No changes required - continue using existing @permaweb/aoconnect message passing
- **Backward Compatibility**: All existing handlers remain functional with identical message schemas

**Success Criteria:**
- Frontend search queries execute via HTTP GET in <500ms (vs current 2s message-based queries)
- Registry state accessible at `https://forward.computer/{PROCESS_ID}~process@1.0/compute/skills`
- Dynamic read transformations handle complex search filters without registry code changes
- Zero breaking changes to CLI or MCP server integrations
- All existing unit/integration tests pass without modification

## Stories

### Story 15.1: Registry Process HyperBEAM Integration

**As a** registry process maintainer,
**I want** to integrate the Patch device into existing registry handlers,
**so that** skill metadata is automatically exposed via HTTP after each state modification.

**Scope:**
- Add `Send({device = 'patch@1.0', ...})` calls to `Register-Skill` handler
- Implement initial sync pattern on process startup
- Update handler logic to expose `skills` table (skill index) and `skillsByName` lookup
- Test HTTP endpoint access with curl/Postman
- Validate state structure matches expected format for frontend consumption

**Integration Approach:**
- Modify existing `ao-process/registry.lua` file
- Add initial sync check: `InitialSync = InitialSync or 'INCOMPLETE'`
- Patch state after successful skill registration
- No changes to handler message schemas or response formats

### Story 15.2: Dynamic Read Transformations for Search

**As a** frontend developer,
**I want** dynamic read Lua scripts for search operations,
**so that** I can execute complex queries (tag filtering, fuzzy search) without modifying the registry process code.

**Scope:**
- Create `search-skills.lua` transformation script with `search(base, req)` function
- Support query parameters: keyword (name/description match), tags (AND filtering), limit/offset (pagination)
- Upload transformation script to Arweave via Turbo SDK
- Document HTTP endpoint URL pattern: `https://forward.computer/{PROCESS_ID}~process@1.0/now/~lua@5.3a&module={SCRIPT_TXID}/search/serialize~json@1.0`
- Test transformation script locally with aolite before deployment

**Query Features:**
- Case-insensitive keyword search across name and description
- Tag filtering with AND logic (all specified tags must match)
- Pagination support (limit/offset parameters via URL query string)
- Return skill metadata in consistent JSON format

### Story 15.3: Frontend HTTP Client Migration

**As a** frontend developer,
**I want** an HTTP client class for direct registry access,
**so that** search/browse operations complete in <500ms instead of 2s message-based queries.

**Scope:**
- Create `AORegistryClient` class with methods: `getSkills()`, `searchSkills(query, tags)`, `getSkill(name)`
- Implement HTTP GET requests to `forward.computer` endpoints
- Add error handling for network failures, invalid responses, and rate limiting
- Update existing search UI components to use HTTP client instead of @permaweb/aoconnect
- Validate performance improvement (baseline 2s → target <500ms)

**Integration Strategy:**
- New client class in `frontend/src/lib/ao-registry-client.ts`
- Gradual migration: Search UI first, then browse/detail pages
- Maintain @permaweb/aoconnect as fallback for legacy compatibility
- Environment variable for registry process ID and HyperBEAM URL

## Compatibility Requirements

- [x] **Existing Message-Based API Unchanged**: All CLI and MCP server integrations continue working without modification
- [x] **Handler Schemas Identical**: `Register-Skill`, `Search-Skills`, `Get-Skill`, `Info` handlers maintain exact message tag/data formats
- [x] **State Structure Backward Compatible**: Lua table structure (`Skills`, `SkillsByName`) unchanged, only access method added
- [x] **Process ID Unchanged**: Same AO process ID used for both message passing and HTTP access
- [x] **Deployment Rollback Safe**: Patch device calls are additive - removing them reverts to message-only access

## Risk Mitigation

**Primary Risk:** HyperBEAM Patch device introduces new dependency on `forward.computer` infrastructure
- **Mitigation**: Maintain @permaweb/aoconnect as fallback access method in frontend (environment flag toggle)
- **Rollback Plan**: Remove `Send({device = 'patch@1.0', ...})` calls from handlers, revert frontend to message-based queries

**Secondary Risk:** Initial sync pattern may expose incomplete state during process startup
- **Mitigation**: Set `InitialSync = 'INCOMPLETE'` by default, only patch after registry state fully initialized
- **Testing**: Verify state completeness with integration tests using aolite emulation

**Performance Risk:** Dynamic read transformations may have unpredictable execution time
- **Mitigation**: Implement pagination (max 100 results per query), add timeout handling in frontend (5s max)
- **Monitoring**: Log transformation execution times, optimize Lua scripts if queries exceed 500ms

## Definition of Done

- [x] Registry process handlers include Patch device calls after state modifications
- [x] Initial sync pattern implemented and tested with aolite
- [x] Dynamic read transformation scripts uploaded to Arweave with documented TXIDs
- [x] Frontend HTTP client class implemented with error handling and performance validation
- [x] Search UI migrated to HTTP-based queries with <500ms response time
- [x] All existing CLI and MCP server functionality verified unchanged (zero breaking changes)
- [x] Integration tests pass for both HTTP access and legacy message passing
- [x] Documentation updated with HyperBEAM endpoint URLs and usage examples
- [x] Performance benchmarks documented (before: 2s message queries, after: <500ms HTTP GET)

---

**Epic Type:** Brownfield Enhancement
**Estimated Stories:** 3
**Target Completion:** 1 sprint (5-7 days)
**Dependencies:** Existing AO registry process (Epic 1), Frontend (Epic 6)
**HyperBEAM Devices Used:** Patch device (`patch@1.0`)
**AO Compliance:** Maintains ADP v1.0 compliance via unchanged Info handler

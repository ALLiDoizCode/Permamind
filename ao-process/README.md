# AO Registry Process

Decentralized registry for Claude Agent Skills built on the AO Network.

## Overview

The AO Registry Process is a Lua-based smart contract running on the AO decentralized compute network. It provides a permanent, queryable index of published Agent Skills with registration, search, and retrieval capabilities.

**ADP v1.0 Compliant**: This process follows the AO Documentation Protocol v1.0 for self-documenting capabilities and autonomous tool integration.

## Features

- **Skill Registration**: Register skill metadata with versioning, tags, and dependency tracking
- **Search Functionality**: Case-insensitive search across skill names, descriptions, and tags
- **Skill Retrieval**: O(1) lookup for specific skills by name
- **Download Tracking**: Timestamp-based download tracking for analytics
- **Download Statistics**: Time-based download statistics (7/30 days, all-time) for aggregate and per-skill queries
- **Ownership Tracking**: Cryptographic ownership via Arweave addresses
- **Self-Documenting**: Info handler provides machine-readable capability metadata

## Handlers

### Info Handler

**Action**: `Info`

Returns process metadata for autonomous AI tool discovery (ADP v1.0).

**Request**:
```lua
{
  Action = "Info"
}
```

**Response**:
```lua
{
  Action = "Info-Response",
  Data = <JSON-encoded metadata>
}
```

### Register-Skill Handler

**Action**: `Register-Skill`

Registers a new skill in the registry.

**Required Tags**:
- `Name` - Skill name (unique identifier)
- `Version` - Semantic version (e.g., "1.0.0")
- `Description` - Skill description (max 1024 chars)
- `Author` - Author display name
- `ArweaveTxId` - 43-character Arweave transaction ID of skill bundle

**Optional Tags**:
- `Tags` - JSON array of tags (e.g., `'["ao", "lua"]'`)
- `Dependencies` - JSON array of dependency names (e.g., `'["dep1", "dep2"]'`)

**Request Example**:
```lua
{
  Action = "Register-Skill",
  Name = "my-skill",
  Version = "1.0.0",
  Description = "A sample skill",
  Author = "John Doe",
  Tags = '["tag1", "tag2"]',
  ArweaveTxId = "abc123def456ghi789jkl012mno345pqr678stu901v",
  Dependencies = '[]'
}
```

**Success Response**:
```lua
{
  Action = "Skill-Registered",
  Name = "my-skill",
  Version = "1.0.0",
  Success = "true"
}
```

**Error Response**:
```lua
{
  Action = "Error",
  Error = "Skill with name 'my-skill' already exists"
}
```

**Validation Rules**:
- Name must be unique (no duplicates)
- Version must follow semantic versioning (x.y.z)
- ArweaveTxId must be 43 characters
- Description cannot exceed 1024 characters
- All required fields must be present

### Search-Skills Handler

**Action**: `Search-Skills`

Searches for skills matching a query string (case-insensitive).

**Required Tags**:
- `Query` - Search query string

**Request Example**:
```lua
{
  Action = "Search-Skills",
  Query = "ao development"
}
```

**Response**:
```lua
{
  Action = "Search-Results",
  Data = <JSON-encoded array of matching skills>,
  ResultCount = "5"
}
```

**Search Behavior**:
- Searches skill names (substring match)
- Searches descriptions (substring match)
- Searches tags (exact element match)
- Case-insensitive matching
- Returns all matching skills

### Get-Skill Handler

**Action**: `Get-Skill`

Retrieves a specific skill by name.

**Required Tags**:
- `Name` - Skill name

**Request Example**:
```lua
{
  Action = "Get-Skill",
  Name = "my-skill"
}
```

**Success Response**:
```lua
{
  Action = "Skill-Found",
  Data = <JSON-encoded skill metadata>
}
```

**Error Response**:
```lua
{
  Action = "Error",
  Error = "Skill 'my-skill' not found"
}
```

### Record-Download Handler

**Action**: `Record-Download`

Tracks download events with timestamps for analytics and statistics.

**Required Tags**:
- `Name` - Skill name

**Optional Tags**:
- `Version` - Specific version (defaults to latest version if omitted)

**Request Example**:
```lua
{
  Action = "Record-Download",
  Name = "my-skill",
  Version = "1.0.0"  -- Optional, defaults to latest
}
```

**Success Response**:
```lua
{
  Action = "Download-Recorded",
  Name = "my-skill",
  Version = "1.0.0",
  DownloadCount = "42"  -- Total downloads for this version
}
```

**Behavior**:
- Records timestamp from `msg.Timestamp` (AO message timestamp)
- Appends timestamp to `downloadTimestamps` array in skill metadata
- Updates `downloadCount` field (derived from array length)
- Maintains backward compatibility with existing `downloadCount` field
- Gracefully handles non-existent skills/versions (silent failure)

**Timestamp Tracking**:
```lua
-- Timestamps stored as array for time-based analytics
downloadTimestamps = [1700100000, 1700200000, 1700300000]

-- downloadCount derived from array length
downloadCount = #downloadTimestamps  -- 3
```

### Get-Download-Stats Handler

**Action**: `Get-Download-Stats`

Returns time-based download statistics for aggregate or per-skill queries.

**Optional Tags**:
- `TimeRange` - Time range filter: `"7"` (last 7 days), `"30"` (last 30 days), `"all"` (all time, default)
- `Scope` - Set to `"all"` for aggregate statistics across all skills
- `Name` - Skill name for per-skill statistics
- `Version` - Specific version for per-skill stats (defaults to latest)

**Aggregate Statistics Example**:
```lua
{
  Action = "Get-Download-Stats",
  Scope = "all",
  TimeRange = "all"  -- Optional, defaults to "all"
}
```

**Aggregate Response**:
```lua
{
  Action = "Download-Stats",
  Data = json.encode({
    totalSkills = 150,
    downloadsTotal = 9012,
    downloads7Days = 1234,   -- Only if TimeRange includes 7
    downloads30Days = 5678   -- Only if TimeRange includes 30
  })
}
```

**Per-Skill Statistics Example**:
```lua
{
  Action = "Get-Download-Stats",
  Name = "my-skill",
  TimeRange = "all"  -- "7", "30", or "all"
}
```

**Per-Skill Response**:
```lua
{
  Action = "Download-Stats",
  Data = json.encode({
    skillName = "my-skill",
    version = "1.0.0",
    downloadsTotal = 456,
    downloads7Days = 78,     -- Only if TimeRange includes 7
    downloads30Days = 234    -- Only if TimeRange includes 30
  })
}
```

**Error Response**:
```lua
{
  Action = "Error",
  Error = "Name parameter required for per-skill stats"
}
```

**Time Range Calculations**:
- `TimeRange = "7"`: Downloads in last 7 days (604,800 seconds)
- `TimeRange = "30"`: Downloads in last 30 days (2,592,000 seconds)
- `TimeRange = "all"`: All downloads + breakdown by 7/30 days
- Time calculations use `msg.Timestamp` as current time reference

## Data Schema

### Skill Metadata Structure

```lua
{
  name = "skill-name",              -- string, unique identifier
  version = "1.0.0",                -- string, semantic version
  description = "Skill description", -- string, max 1024 chars
  author = "Author Name",           -- string, display name
  owner = "abc123...xyz789",        -- string (43-char Arweave address)
  tags = {"tag1", "tag2"},          -- table (array)
  arweaveTxId = "def456...uvw012",  -- string (43-char TXID)
  dependencies = {"dep1", "dep2"},  -- table (array of skill names)
  downloadCount = 42,               -- number (total downloads, derived from array length)
  downloadTimestamps = {1700100000, 1700200000}, -- table (array of Unix timestamps)
  publishedAt = 1234567890,         -- number (Unix timestamp)
  updatedAt = 1234567890            -- number (Unix timestamp)
}
```

## Testing

Tests are located in `tests/` directory and use a custom Lua test framework (aolite-compatible).

**Run all tests**:
```bash
cd ao-process/tests
lua run-all.lua
```

**Test suites**:
- `info-handler.test.lua` - Info handler tests (ADP compliance)
- `register-skill.test.lua` - Registration validation and error handling
- `search-skills.test.lua` - Search functionality across name/description/tags
- `get-skill.test.lua` - Skill retrieval and not-found cases
- `version-history.test.lua` - Version history tracking and retrieval
- `list-skills.test.lua` - Pagination, filtering, and skill listing
- `changelog.test.lua` - Changelog tracking for skill versions
- `download-tracking.test.lua` - Download counting and recording
- `download-stats.test.lua` - Timestamp tracking in download events
- `get-download-stats.test.lua` - Time-based statistics queries

**Test coverage**:
- ✅ ADP v1.0 compliance
- ✅ Valid skill registration and updates
- ✅ Duplicate name detection
- ✅ Missing required fields
- ✅ Invalid format validation (version, TXID, description length)
- ✅ Case-insensitive search
- ✅ Owner/timestamp handling (msg.From, msg.Timestamp)
- ✅ JSON parsing for tags/dependencies
- ✅ Version history tracking and retrieval
- ✅ Pagination and filtering (List-Skills)
- ✅ Changelog tracking for version updates
- ✅ Download timestamp tracking
- ✅ Time-based download statistics (7/30 days, all-time)
- ✅ Aggregate and per-skill statistics
- ✅ Edge cases (no downloads, future timestamps, non-existent skills)

## AO Best Practices Compliance

This process follows all AO best practices:

✅ **Monolithic Design**: All code in single `registry.lua` file
✅ **No External Requires**: Only `json` module used
✅ **Message-Based Communication**: All responses via `ao.send()`
✅ **No Module Returns**: No module-level return statements
✅ **Timestamp Handling**: Uses `msg.Timestamp` (not `os.time()`)
✅ **String Tag Values**: All tag values are strings
✅ **Error Handling**: Comprehensive validation with clear error messages

## Deployment

See `deploy.md` for deployment instructions using `@permaweb/aoconnect`.

## Architecture

- **Language**: Lua 5.3
- **Runtime**: AO Network (mainnet)
- **State Storage**: Global `Skills` table (in-memory)
- **Search Performance**: O(n) linear search (acceptable for <1000 skills)
- **Retrieval Performance**: O(1) hash table lookup by name

## Future Enhancements

- Delete-Skill handler (owner authorization)
- Advanced indexing for tag-based queries
- Download trends and forecasting
- Skill popularity rankings
- Download attribution (by user/wallet)

## License

See LICENSE file in repository root.

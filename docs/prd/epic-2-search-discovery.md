# Epic 2: Search & Discovery

**Epic Goal:**
Implement the search command to query the AO registry and display matching skills. This epic delivers the first consumer-facing feature, enabling users to discover available skills through a familiar command-line interface. By the end of this epic, developers can search for skills by name or tags, view skill metadata, and get installation instructions, completing the discovery phase of the ecosystem loop.

## Story 2.1: AO Registry Query Client

**As a** CLI developer,
**I want** a client module for querying the AO registry process,
**so that** I can retrieve skill metadata for search and installation commands.

**Acceptance Criteria:**
1. Registry client module created using @permaweb/aoconnect for AO message passing
2. Function implemented to send `Search-Skills` action with query parameter
3. Function implemented to send `Get-Skill` action with skill name parameter
4. Response parsing extracts skill metadata from AO process replies
5. Timeout handling with 30-second default and configurable via options
6. Retry logic for network failures (2 attempts with 5-second delay)
7. Unit tests use mocked @permaweb/aoconnect responses (no real AO calls in tests)
8. Error handling for process not found, timeout, and malformed responses
9. Configuration support for custom registry process ID via `.skillsrc`
10. Integration tests validate queries against aolite-emulated registry process

## Story 2.2: Search Results Formatting

**As a** CLI developer,
**I want** formatted table output for search results,
**so that** users can easily scan and compare multiple skills.

**Acceptance Criteria:**
1. Formatter module created using cli-table3 for tabular display
2. Table columns: Name, Author, Version, Description (truncated), Tags
3. Color coding using chalk: skill names in cyan, authors in dim white, tags in yellow
4. Description truncated to 50 characters with ellipsis if longer
5. Tags displayed as comma-separated list
6. Empty results display helpful message: "No skills found. Try a different query or publish the first skill!"
7. Install command hint shown below each result: `skills install <name>`
8. Unit tests verify table rendering with mock skill data
9. Support for `--json` flag to output raw JSON instead of table (for scripting)
10. Table adjusts to terminal width automatically (cli-table3 feature)

## Story 2.3: `skills search` Command Implementation

**As a** skill consumer,
**I want** a `skills search <query>` command,
**so that** I can discover skills matching my needs by searching names, descriptions, or tags.

**Acceptance Criteria:**
1. Commander.js command registered: `skills search <query> [options]`
2. Query parameter sent to AO registry via registry client module
3. Results formatted as table and displayed to user
4. Search matches skill names, descriptions, and tags (case-insensitive)
5. Results sorted by relevance (exact name matches first, then partial matches)
6. Command completes within 2 seconds for typical queries (NFR4 requirement)
7. `--json` flag outputs raw JSON for scripting/automation
8. `--verbose` flag shows detailed query information and response metadata
9. Error handling with clear messages for network failures, timeout, or registry unavailable
10. Help text explains query syntax and provides examples
11. Integration test validates end-to-end search using aolite-emulated registry
12. Empty query displays all available skills (list all functionality)

## Story 2.4: Enhanced Search with Tag Filtering

**As a** skill consumer,
**I want** to filter search results by specific tags,
**so that** I can narrow down skills to specific categories or domains.

**Acceptance Criteria:**
1. `--tag <tag>` flag added to search command for filtering by tags
2. Multiple tags supported: `--tag ao --tag arweave` (AND logic - must match all tags)
3. Tag filter applied after AO registry returns results (client-side filtering)
4. Results table shows matched tags highlighted in yellow
5. Help text explains tag filtering with examples: `skills search crypto --tag blockchain`
6. Unit tests verify tag filtering logic with various combinations
7. Tag matching is case-insensitive for user convenience
8. Empty results with tag filter show: "No skills found with tags [tag1, tag2]. Try removing a tag filter."

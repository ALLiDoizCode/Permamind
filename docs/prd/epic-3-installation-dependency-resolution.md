# Epic 3: Installation & Dependency Resolution

**Epic Goal:**
Implement the install command with recursive dependency resolution and lock file generation. This epic delivers the critical "wow moment" where users experience reliable, one-command skill installation. By the end of this epic, the platform achieves its >95% installation success rate target, completing the essential ecosystem loop (search → install → publish) and building user trust through flawless execution.

## Story 3.1: Arweave Bundle Download

**As a** CLI developer,
**I want** to download skill bundles from Arweave using transaction IDs,
**so that** I can install skills to local directories.

**Acceptance Criteria:**
1. Download module created using Arweave SDK to fetch bundle data by TXID
2. Function accepts Arweave TXID and returns tar.gz buffer
3. Download progress tracked and reportable via callback (for progress indicators)
4. Retry logic for network failures (3 attempts with exponential backoff)
5. Timeout handling with 30-second default for typical bundles (<1MB)
6. Unit tests use mocked Arweave gateway responses with pre-generated test bundles
7. Error handling for invalid TXID, network timeouts, and gateway failures
8. Support for configurable Arweave gateway URL via `.skillsrc`
9. Download verification checks Content-Type matches expected tar+gzip format
10. Integration test validates download of real test bundle from mocked gateway

## Story 3.2: Bundle Extraction and Installation

**As a** CLI developer,
**I want** to extract skill bundles to local directories,
**so that** installed skills are available for Claude Code to use.

**Acceptance Criteria:**
1. Extraction module created using Node.js tar library to decompress bundles
2. Function accepts tar.gz buffer and target directory path
3. Extraction creates skill directory: `~/.claude/skills/<skill-name>/` or `.claude/skills/<skill-name>/`
4. SKILL.md and all bundled files extracted preserving directory structure
5. File permissions set appropriately (readable by current user)
6. Atomic installation: extract to temp directory, then move to final location (rollback on failure)
7. Existing skill directory handling: prompt user for overwrite confirmation (default: no)
8. Unit tests verify extraction with various bundle structures
9. Error handling for corrupted bundles, disk space issues, and permission errors
10. `--force` flag to overwrite existing installations without prompting

## Story 3.3: Dependency Resolution Engine

**As a** CLI developer,
**I want** a dependency resolver that processes skill dependencies recursively,
**so that** all required skills are installed automatically.

**Acceptance Criteria:**
1. Dependency resolver module parses dependencies array from skill manifests
2. Recursive dependency traversal builds complete dependency tree
3. Circular dependency detection prevents infinite loops (error message if detected)
4. Dependency depth limit enforced (10 levels max per NFR6)
5. Topological sorting ensures dependencies install before dependents
6. Unit tests cover simple dependencies, multi-level trees, circular detection, and depth limits
7. Already-installed dependencies skipped unless version mismatch detected
8. Error handling for missing dependencies (skill not found in registry)
9. Dependency graph visualization in verbose mode (shows tree structure)
10. Performance target: resolve up to 50 dependencies within 5 seconds

## Story 3.4: Lock File Generation

**As a** CLI developer,
**I want** to generate `skills-lock.json` files documenting installed skills,
**so that** installations are reproducible and auditable.

**Acceptance Criteria:**
1. Lock file module creates JSON file at `~/.claude/skills-lock.json` or `.claude/skills-lock.json`
2. Lock file structure: skill name, version, Arweave TXID, dependencies array, installation timestamp
3. Lock file updated atomically after successful installation (write temp file, then rename)
4. Existing lock file preserved and merged with new installations
5. Lock file includes dependency tree showing parent-child relationships
6. Unit tests verify lock file generation and merging logic
7. Lock file human-readable with proper JSON formatting (2-space indentation)
8. Lock file schema version included for future compatibility (`lockfileVersion: 1`)
9. Error handling for file system errors during lock file operations
10. `--no-lock` flag to skip lock file generation (for testing purposes)

## Story 3.5: `skills install` Command Implementation

**As a** skill consumer,
**I want** a `skills install <name>` command,
**so that** I can install skills and their dependencies with a single command.

**Acceptance Criteria:**
1. Commander.js command registered: `skills install <name> [options]`
2. Skill name queried from AO registry to get metadata and Arweave TXID
3. Skill bundle downloaded from Arweave with progress indicator
4. Dependencies resolved recursively and installation order determined
5. All skills in dependency tree installed to appropriate local directory
6. Lock file generated/updated with installation details
7. Success message displays installed skill name, version, and dependency count
8. Command completes within 10 seconds for typical skills (NFR3 requirement)
9. `--global` flag installs to `~/.claude/skills/` (default behavior)
10. `--local` flag installs to `.claude/skills/` for project-specific skills
11. `--force` flag overwrites existing installations without confirmation
12. `--verbose` flag shows detailed dependency tree and installation steps
13. Error handling with clear recovery guidance for all failure modes
14. Integration test validates end-to-end install using mocked Arweave + aolite registry
15. Installation success rate >95% validated through integration test suite

## Story 3.6: Installation Progress Indicators

**As a** skill consumer,
**I want** clear progress indicators during installation,
**so that** I understand what's happening and feel confident the operation is proceeding correctly.

**Acceptance Criteria:**
1. Progress indicators using ora library show current operation status
2. Installation phases displayed: "Querying registry..." → "Downloading bundle..." → "Resolving dependencies..." → "Installing files..." → "Complete!"
3. Spinner animations during network operations (query, download)
4. Progress bar during bundle download showing percentage complete
5. Dependency tree displayed before installation begins (in verbose mode)
6. Success checkmarks (✓) shown for each completed dependency installation
7. Total time elapsed displayed upon completion
8. Error states clearly indicated with red ✗ symbol and error message
9. Spinner stops and clears on error to prevent terminal pollution
10. Support for non-interactive mode (no spinners) when output piped or CI environment detected

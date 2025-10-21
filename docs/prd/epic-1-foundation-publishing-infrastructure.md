# Epic 1: Foundation & Publishing Infrastructure

**Epic Goal:**
Establish the foundational project infrastructure and implement the core publishing capability. This epic tackles the riskiest technical component (Arweave upload + AO registration + keypair management) to validate feasibility early in the 2-week sprint. By the end of this epic, developers can publish skills to permanent storage, creating the supply side of the ecosystem and generating test content for subsequent installation features.

## Story 1.1: Project Setup and Monorepo Structure

**As a** developer,
**I want** a well-structured monorepo with TypeScript configuration and build tooling,
**so that** I have a solid foundation for developing the CLI, AO process, and bootstrap skills in a cohesive environment.

**Acceptance Criteria:**
1. Monorepo structure created with `cli/`, `ao-process/`, `skills/`, `tests/`, and `docs/` directories
2. TypeScript configuration established with strict mode enabled for type safety
3. Package.json configured with scripts for build, test, and dev workflows
4. Jest testing framework installed and configured for both TypeScript unit tests and aolite integration
5. Commander.js, gray-matter, tar, ajv, ora, chalk, and cli-table3 dependencies installed
6. Git repository initialized with .gitignore excluding node_modules and build artifacts
7. README.md created with project overview and development setup instructions
8. Build process successfully compiles TypeScript to JavaScript without errors

## Story 1.2: AO Registry Process Development

**As a** skill publisher,
**I want** an AO process that can register and index skill metadata,
**so that** my published skills are discoverable through search queries.

**Acceptance Criteria:**
1. `registry.lua` file created in `ao-process/` directory following AO process patterns
2. Handler implemented for `Register-Skill` action accepting name, version, description, author, tags, and Arweave TXID
3. Process state maintains skills registry as Lua table indexed by skill name
4. Handler implemented for `Search-Skills` action accepting query string and returning matching skills
5. Handler implemented for `Get-Skill` action accepting skill name and returning full metadata
6. Handler implemented for `Info` action returning registry process metadata (ADP v1.0 compliance)
7. aolite test suite validates all handlers work correctly in local emulation
8. Process tested with concurrent message handling using aolite's coroutine-based management
9. Error handling for duplicate skill names (return error message to sender)
10. Process code follows AO best practices: monolithic design, no external requires, message-based communication only

## Story 1.3: SKILL.md Manifest Parser

**As a** CLI developer,
**I want** a parser that extracts and validates SKILL.md frontmatter,
**so that** I can ensure skill manifests meet required schema before publishing.

**Acceptance Criteria:**
1. Parser module created using gray-matter library to extract YAML frontmatter from SKILL.md files
2. JSON schema defined for skill manifest with required fields: name, version, description, author
3. Optional fields supported: dependencies (array), tags (array), license (string)
4. Validation function using ajv library checks manifest against schema
5. Parser returns structured manifest object with all fields typed correctly
6. Clear error messages returned for missing required fields or invalid YAML syntax
7. Unit tests cover valid manifests, missing fields, malformed YAML, and edge cases
8. Parser handles dependencies field correctly (array of skill names or empty array)
9. Documentation comments explain manifest structure and validation rules

## Story 1.4: Skill Bundling System

**As a** CLI developer,
**I want** to bundle skill directories into tar archives,
**so that** all skill files (SKILL.md + dependencies) can be uploaded to Arweave as a single unit.

**Acceptance Criteria:**
1. Bundler module created using Node.js tar library to create compressed archives
2. Function accepts skill directory path and returns tar.gz buffer ready for upload
3. Bundle includes SKILL.md and all files in skill directory (recursive)
4. Hidden files and node_modules excluded from bundle automatically
5. Bundle size calculated and validated against 10MB practical limit (warning if exceeded)
6. Unit tests verify bundle contents match source directory structure
7. Bundle extraction function implemented for testing (verify round-trip works)
8. Error handling for missing directories, unreadable files, and disk space issues
9. Progress callback supported for large bundles (future use with progress indicators)

## Story 1.5: Arweave Wallet Management

**As a** skill publisher,
**I want** secure keypair management for Arweave transactions,
**so that** I can publish skills without exposing my private keys.

**Acceptance Criteria:**
1. Wallet management module supports loading Arweave JWK (JSON Web Key) from file path
2. Configuration system allows specifying wallet path via `--wallet` flag or `.skillsrc` config
3. Wallet validation checks JWK format and Arweave address derivation
4. Integration with keytar library for encrypted storage in system keychain (if available)
5. Fallback to file-based storage with clear warning if keychain unavailable
6. Wallet balance check function queries Arweave for sufficient funds before publish
7. Clear error messages for missing wallet, invalid format, or insufficient balance
8. Unit tests with mock wallet data (no real keys in test suite)
9. Documentation explains wallet setup and security best practices

## Story 1.6: Arweave Upload Integration

**As a** CLI developer,
**I want** integration with Arweave SDK to upload skill bundles,
**so that** published skills are permanently stored on-chain.

**Acceptance Criteria:**
1. Arweave upload module created using Arweave SDK for transaction creation
2. Function accepts bundle buffer, wallet JWK, and metadata tags
3. Transaction includes tags: App-Name="Agent-Skills-Registry", Content-Type="application/x-tar+gzip", Skill-Name, Skill-Version
4. Upload progress tracked and reportable via callback (for progress indicators)
5. Transaction ID returned upon successful upload
6. Transaction confirmation polling implemented (wait for 2-5 minute finality)
7. Retry logic for network failures (3 attempts with exponential backoff)
8. Unit tests use mocked Arweave SDK responses (no real uploads in tests)
9. Error handling for network timeouts, insufficient funds, and gateway failures
10. Support for configurable Arweave gateway URL via config file

## Story 1.7: `skills publish` Command Implementation

**As a** skill creator,
**I want** a `skills publish <directory>` command,
**so that** I can upload my skill to Arweave and register it in the AO registry in one simple operation.

**Acceptance Criteria:**
1. Commander.js command registered: `skills publish <directory> [options]`
2. Command validates directory exists and contains SKILL.md file
3. SKILL.md parsed and validated against schema before proceeding
4. Skill directory bundled into tar.gz archive
5. Bundle uploaded to Arweave with progress indicator (ora spinner)
6. Transaction ID displayed upon successful Arweave upload
7. AO registry message sent with `Register-Skill` action including metadata and TXID
8. Success message displays: skill name, version, TXID, and registry confirmation
9. Error handling with clear recovery guidance for all failure modes
10. `--wallet <path>` flag supported for custom wallet location
11. `--verbose` flag shows detailed operation logs
12. Command completes within 60 seconds for typical skill bundles (<1MB)
13. Integration test validates end-to-end publish flow using mocked Arweave + aolite

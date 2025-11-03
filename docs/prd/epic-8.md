# Epic 8: MCP Server for Agent Skills Registry

## Epic Goal

Create a Model Context Protocol (MCP) server that provides the same functionality as the existing @permamind/skills npm package, enabling Claude AI to publish, search, and install agent skills through the MCP protocol without requiring command-line access.

## Epic Description

### Existing System Context

The @permamind/skills package currently exists as:
- **Technology Stack**: Node.js/TypeScript CLI tool using Commander.js, @permaweb/aoconnect, Arweave SDK
- **Current Functionality**:
  - `skills publish <directory>` - Publishes skills to Arweave and registers in AO process
  - `skills search <query>` - Searches the AO registry for skills
  - `skills install <name>` - Installs skills from Arweave with dependency resolution
- **Architecture**: Three-layer serverless (CLI → Arweave SDK/AO SDK → Arweave Network/AO Registry Process)
- **Integration Points**:
  - Arweave Network (permanent storage)
  - AO Registry Process (skill metadata index)
  - Local file system (~/.claude/skills/)

### Enhancement Details

**What's being added/changed:**
- New MCP server implementation that exposes publish, search, and install functionality as MCP tools
- Server will reuse existing CLI library code (parsers, clients, bundlers, dependency resolver)
- MCP server will be a separate package (`@permamind/skills-mcp-server`) in the monorepo
- Claude AI will be able to directly invoke skill operations without shell execution

**How it integrates:**
- MCP server imports and uses existing CLI library modules (arweave-client, ao-registry-client, bundler, dependency-resolver, etc.)
- Shares the same AO registry process ID and Arweave configuration
- Maintains compatibility with existing skills-lock.json format
- Operates alongside CLI tool (not replacing it)
- Uses **deterministic wallet generation from 12-word seed phrase** (same method as Permamind MCP server)
  - Accepts `SEED_PHRASE` environment variable (BIP39 mnemonic)
  - Generates Arweave JWK keypair using custom-key-generation approach (SHA-256 hashing + deterministic PRNG)
  - Enables reproducible wallet across installations without storing private keys

**Success criteria:**
- MCP server exposes `publish_skill`, `search_skills`, and `install_skill` tools
- All three tools achieve functional parity with CLI commands
- MCP server can be configured with wallet and registry settings
- Skills installed via MCP server are compatible with CLI and vice versa
- Zero code duplication (maximum code reuse from existing CLI)

## Stories

Epic 8 is divided into **11 stories** across 3 phases:

### Phase 1: Wallet & Library Foundation (Stories 8.1-8.3)

#### Story 8.1: Implement Seed Phrase Wallet Generation
- Port custom-key-generation approach from Permamind MCP server
- Implement BIP39 mnemonic → Arweave JWK conversion
  - Use deterministic PRNG with SHA-256 hashing
  - Generate RSA key material from seed buffer
  - Convert to Arweave JWK format
- Create WalletFactory class supporting both wallet types:
  - `fromFile(path)` - existing file-based wallet (backward compatible)
  - `fromSeedPhrase(mnemonic)` - new seed phrase wallet
- Add comprehensive tests for deterministic key generation
- No CLI integration yet (library only)

#### Story 8.2: Refactor Wallet Manager to Use WalletFactory
- Update existing wallet-manager.ts to use new WalletFactory
- Add `SEED_PHRASE` environment variable support
- Implement wallet selection logic:
  - If `SEED_PHRASE` env var exists, use seed phrase wallet
  - Else if `--wallet` flag exists, use file-based wallet
  - Else use default wallet path
- Ensure all existing CLI commands continue working
- Update wallet manager tests to cover both wallet types

#### Story 8.3: Extract Publish Logic to Shared Library
- Extract publish business logic from `commands/publish.ts` to `lib/publish-service.ts`
- Create `PublishService` class with clear interface:
  - `publish(directory: string, options: PublishOptions): Promise<PublishResult>`
- Update `commands/publish.ts` to use PublishService
- Ensure all existing publish tests still pass
- No functional changes (pure refactoring)

#### Story 8.4: Extract Search Logic to Shared Library
- Extract search business logic from `commands/search.ts` to `lib/search-service.ts`
- Create `SearchService` class with interface:
  - `search(query: string, options: SearchOptions): Promise<SearchResult[]>`
- Update `commands/search.ts` to use SearchService
- Ensure all existing search tests still pass
- No functional changes (pure refactoring)

#### Story 8.5: Extract Install Logic to Shared Library
- Extract install business logic from `commands/install.ts` to `lib/install-service.ts`
- Create `InstallService` class with interface:
  - `install(skillName: string, options: InstallOptions): Promise<InstallResult>`
- Update `commands/install.ts` to use InstallService
- Ensure all existing install tests still pass
- Verify dependency resolution still works correctly

### Phase 2: MCP Server Implementation (Stories 8.6-8.9)

#### Story 8.6: MCP Server Package Setup
- Create new `mcp-server/` directory in monorepo
- Initialize package.json with MCP SDK dependencies
- Set up TypeScript configuration for MCP server
- Create basic MCP server scaffold with server initialization
- Add environment variable configuration:
  - `SEED_PHRASE` (required) - 12-word BIP39 mnemonic
  - `REGISTRY_PROCESS_ID` (optional) - AO registry process ID
  - `INSTALL_LOCATION` (optional) - skill installation directory
- Verify server can start and register with MCP protocol

#### Story 8.7: Implement publish_skill MCP Tool
- Create `publish_skill` MCP tool handler
- Import and use PublishService from shared library
- Configure to use seed phrase wallet from `SEED_PHRASE` env var
- Map MCP tool parameters to PublishService options:
  - `directory` (required) - path to skill directory
  - `verbose` (optional) - enable verbose output
- Implement error handling that translates library errors to MCP error responses
- Add tests using mocked Arweave + aolite

#### Story 8.8: Implement search_skills MCP Tool
- Create `search_skills` MCP tool handler
- Import and use SearchService from shared library
- Map MCP tool parameters to SearchService options:
  - `query` (required) - search query string
  - `tags` (optional) - filter by tags
- Format results for MCP response (JSON array)
- Add tests validating search results format

#### Story 8.9: Implement install_skill MCP Tool
- Create `install_skill` MCP tool handler
- Import and use InstallService from shared library
- Map MCP tool parameters to InstallService options:
  - `skillName` (required) - name of skill to install
  - `force` (optional) - overwrite existing installation
  - `installLocation` (optional) - custom install path
- Implement progress reporting through MCP status updates
- Add tests for dependency resolution and installation

### Phase 3: Testing & Documentation (Stories 8.10-8.11)

#### Story 8.10: Cross-Compatibility Integration Tests
- Test CLI publish → MCP search (verify skills are discoverable)
- Test MCP publish → CLI search (verify cross-tool compatibility)
- Test CLI install → verify MCP can use installed skills
- Test MCP install → verify CLI can use installed skills
- Validate lock file format compatibility
- Test both wallet types produce compatible results
- Verify deterministic wallet generates same keys from same seed

#### Story 8.11: MCP Server Documentation & Examples
- Create MCP server README with:
  - Installation instructions
  - Configuration guide (environment variables)
  - Claude Desktop setup example
  - Troubleshooting section
- Document all three MCP tools with parameter descriptions
- Create example workflows:
  - Claude AI publishing a skill
  - Claude AI searching and installing skills
  - Setting up seed phrase wallet
- Add MCP server to main repository README
- Create video/GIF demo of MCP tools in action (optional)

## Compatibility Requirements

- [x] Existing CLI commands remain fully functional after refactoring
- [x] CLI continues to support file-based wallet (backward compatibility)
- [x] CLI gains new seed phrase wallet capability via `SEED_PHRASE` env var
- [x] Skills published via CLI (file wallet) are discoverable via MCP server search
- [x] Skills published via MCP (seed phrase wallet) are discoverable via CLI search
- [x] Skills installed via MCP server are discoverable via CLI
- [x] Lock file format (`skills-lock.json`) remains unchanged
- [x] AO registry process interaction unchanged (same message schemas)
- [x] Arweave bundle format unchanged (CLI and MCP produce identical bundles)
- [x] Seed phrase wallet generation produces valid Arweave JWK compatible with all tools

## Risk Mitigation

**Primary Risk:** Refactoring CLI into shared library breaks existing CLI functionality

**Mitigation:**
- Follow Test-Driven Development: write tests first that validate existing CLI behavior
- Refactor incrementally: extract one module at a time, validate tests pass after each extraction
- Maintain CLI test coverage at 100% throughout refactoring process
- Use TypeScript interfaces to ensure library API contracts are clear

**Rollback Plan:**
- Git revert to pre-refactoring commit if integration tests fail
- MCP server is additive (new package), so can be removed without affecting CLI
- Refactoring is in separate story from MCP server creation, allowing independent rollback

## Definition of Done

- [x] All CLI commands (publish, search, install) continue working after refactoring
- [x] CLI supports both file-based wallet (`--wallet` flag) and seed phrase wallet (`SEED_PHRASE` env var)
- [x] Seed phrase wallet generation produces valid Arweave JWK (compatible with all Arweave operations)
- [x] MCP server exposes three tools: `publish_skill`, `search_skills`, `install_skill`
- [x] MCP server successfully publishes skills to Arweave and registers in AO process using seed phrase wallet
- [x] MCP server successfully searches AO registry and returns results
- [x] MCP server successfully installs skills with dependency resolution
- [x] Integration tests pass for CLI ↔ MCP cross-compatibility (both wallet types)
- [x] MCP server documentation complete (README, `SEED_PHRASE` configuration examples)
- [x] No regression in existing CLI functionality
- [x] Code reuse >80% (minimal duplication between CLI and MCP server)
- [x] Seed phrase wallet tests validate deterministic key generation (same seed = same keys)

## Dependencies

- Existing CLI codebase (@permamind/skills)
- Permamind MCP server custom-key-generation approach
- MCP protocol SDK
- BIP39 library for mnemonic handling

## Timeline

**11 stories across 3 phases**:
- **Phase 1** (Stories 8.1-8.5): Wallet & Library Foundation - ~5-7 days
- **Phase 2** (Stories 8.6-8.9): MCP Server Implementation - ~4-5 days
- **Phase 3** (Stories 8.10-8.11): Testing & Documentation - ~2-3 days

**Total estimated time**: ~11-15 days of development work

Stories are sized to be independently deliverable and testable, enabling incremental progress validation.

---

## Story Manager Handoff

"Please develop detailed user stories for this brownfield epic. Key considerations:

- This is an enhancement to an existing Node.js/TypeScript skills registry CLI running Commander.js, Arweave SDK, @permaweb/aoconnect
- Integration points: Arweave Network (permanent storage), AO Registry Process (Lua handlers), local file system (~/.claude/skills/)
- **New wallet capability**: Add deterministic Arweave keypair generation from 12-word BIP39 seed phrase
  - Port custom-key-generation approach from Permamind MCP server (https://github.com/ALLiDoizCode/Permamind-MCP)
  - Use BIP39 mnemonic → seed buffer → SHA-256 hashing → deterministic PRNG → RSA key material → Arweave JWK
  - Support both file-based wallet (existing) and seed phrase wallet (new) in CLI
  - MCP server exclusively uses seed phrase wallet via `SEED_PHRASE` environment variable
- Existing patterns to follow: TDD approach with Jest, dependency injection for SDK clients, typed interfaces for all data models
- Critical compatibility requirements:
  - CLI must continue working after refactoring (file-based wallet still supported)
  - CLI gains new `SEED_PHRASE` env var capability for deterministic wallet generation
  - Skills published/installed by either tool (CLI or MCP) must be compatible with the other
  - Lock file format must remain unchanged
  - AO registry message schemas must remain unchanged
  - Seed phrase wallet must produce valid Arweave JWK compatible with all operations
- Each story must include verification that existing CLI functionality remains intact
- Story 8.1 (refactoring + wallet) is the highest risk and should have comprehensive acceptance criteria

The epic should maintain system integrity while delivering MCP server functionality that enables Claude AI to manage skills without shell access, using the same seed phrase wallet approach as Permamind MCP server."

# Epic 8: MCP Server for Agent Skills Registry - Brownfield Enhancement

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

1. **Story 8.1: Refactor CLI to Shared Library & Add Seed Phrase Wallet Generation**
   - Extract reusable business logic from CLI commands into shared library modules
   - Create clear interfaces for publish/search/install operations independent of Commander.js
   - **Add deterministic wallet generation from seed phrase** (port from Permamind MCP server)
     - Implement BIP39 mnemonic → Arweave JWK conversion using custom-key-generation approach
     - Support both file-based wallet (existing) and seed phrase wallet (new)
     - Add `SEED_PHRASE` environment variable support to CLI
   - Ensure existing CLI commands still work by importing refactored library
   - Update tests to cover both CLI command usage and direct library usage

2. **Story 8.2: MCP Server Implementation**
   - Create new `mcp-server/` directory in monorepo with MCP server package
   - Implement MCP protocol handlers for publish_skill, search_skills, install_skill tools
   - Import and use refactored library modules for actual skill operations
   - **Configure MCP server to use seed phrase wallet generation**:
     - Accept `SEED_PHRASE` environment variable (12-word BIP39 mnemonic)
     - Use refactored wallet generation module to create Arweave JWK from seed phrase
     - No file-based wallet required (simplifies MCP deployment)
   - Add additional MCP server configuration for registry process ID, install location
   - Implement proper error handling that translates library errors to MCP error responses

3. **Story 8.3: Integration Testing & Documentation**
   - Create integration tests that validate MCP tools against aolite + mocked Arweave
   - Test cross-compatibility: skills published via CLI can be found via MCP search
   - Test cross-compatibility: skills installed via MCP appear in CLI environment
   - Document MCP server installation, configuration, and usage in README
   - Create example workflows showing Claude AI using MCP tools

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

---

**Story Manager Handoff:**

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

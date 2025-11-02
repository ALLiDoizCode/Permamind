# Epic 8: MCP Server for Agent Skills Registry

## Epic Goal

Create a Model Context Protocol (MCP) server that provides the same functionality as the existing @permamind/skills npm package, enabling Claude AI to publish, search, and install agent skills through the MCP protocol without requiring command-line access.

## Epic Description

### Context

The @permamind/skills package currently provides a CLI tool for managing agent skills (publish, search, install). This epic extends the ecosystem by creating an MCP server that exposes the same capabilities as MCP tools, enabling Claude AI to directly manage skills without shell execution.

### Key Features

- **MCP Tools**: Expose `publish_skill`, `search_skills`, and `install_skill` as MCP protocol tools
- **Code Reuse**: Refactor CLI into shared library to maximize code reuse (>80%)
- **Wallet Generation**: Use deterministic Arweave keypair generation from 12-word BIP39 seed phrase (same method as Permamind MCP server)
- **Dual Wallet Support**: CLI supports both file-based wallet (existing) and seed phrase wallet (new)
- **Cross-Compatibility**: Skills published/installed via CLI or MCP server are fully compatible

### Technical Approach

1. **Refactor CLI to Shared Library** - Extract business logic from Commander.js commands
2. **Add Seed Phrase Wallet** - Port custom-key-generation from Permamind MCP server
3. **Implement MCP Server** - New package using refactored library and seed phrase wallet
4. **Integration Testing** - Validate CLI ↔ MCP cross-compatibility

## Stories

### Story 8.1: Refactor CLI to Shared Library & Add Seed Phrase Wallet Generation

Extract reusable business logic from CLI commands and add deterministic wallet generation from seed phrase.

**Key Tasks:**
- Extract publish/search/install logic into shared library modules
- Port BIP39 mnemonic → Arweave JWK conversion from Permamind MCP server
- Add `SEED_PHRASE` environment variable support to CLI
- Maintain backward compatibility with file-based wallet

### Story 8.2: MCP Server Implementation

Create new MCP server package that exposes skill management as MCP tools.

**Key Tasks:**
- Create `mcp-server/` package in monorepo
- Implement MCP protocol handlers for three tools
- Configure seed phrase wallet generation via `SEED_PHRASE` env var
- Add error handling for MCP error responses

### Story 8.3: Integration Testing & Documentation

Validate cross-compatibility and document MCP server usage.

**Key Tasks:**
- Integration tests for CLI ↔ MCP compatibility
- Test both wallet types (file-based and seed phrase)
- Document MCP server installation and configuration
- Create example workflows for Claude AI

## Success Criteria

- ✅ All CLI commands continue working after refactoring
- ✅ CLI supports both file-based and seed phrase wallets
- ✅ MCP server exposes three tools with full functional parity
- ✅ Skills are compatible across CLI and MCP server
- ✅ Code reuse >80% between CLI and MCP server
- ✅ Complete documentation with configuration examples

## Dependencies

- Existing CLI codebase (@permamind/skills)
- Permamind MCP server custom-key-generation approach
- MCP protocol SDK
- BIP39 library for mnemonic handling

## Timeline

Estimated 3 stories, ~5-7 days of development work.

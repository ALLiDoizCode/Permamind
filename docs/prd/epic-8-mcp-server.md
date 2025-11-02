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

Epic 8 is divided into **11 stories** across 3 phases:

### Phase 1: Wallet & Library Foundation (Stories 8.1-8.5)
- **8.1**: Implement Seed Phrase Wallet Generation (library only)
- **8.2**: Refactor Wallet Manager to Use WalletFactory
- **8.3**: Extract Publish Logic to Shared Library
- **8.4**: Extract Search Logic to Shared Library
- **8.5**: Extract Install Logic to Shared Library

### Phase 2: MCP Server Implementation (Stories 8.6-8.9)
- **8.6**: MCP Server Package Setup
- **8.7**: Implement publish_skill MCP Tool
- **8.8**: Implement search_skills MCP Tool
- **8.9**: Implement install_skill MCP Tool

### Phase 3: Testing & Documentation (Stories 8.10-8.11)
- **8.10**: Cross-Compatibility Integration Tests
- **8.11**: MCP Server Documentation & Examples

See `docs/stories/epic-8.md` for detailed story descriptions.

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

**11 stories across 3 phases**:
- **Phase 1** (Stories 8.1-8.5): Wallet & Library Foundation - ~5-7 days
- **Phase 2** (Stories 8.6-8.9): MCP Server Implementation - ~4-5 days
- **Phase 3** (Stories 8.10-8.11): Testing & Documentation - ~2-3 days

**Total estimated time**: ~11-15 days of development work

Stories are sized to be independently deliverable and testable, enabling incremental progress validation.

# @permamind/skills

A decentralized registry for Claude Agent Skills, providing CLI tooling for publishing, searching, and installing Skills on the Arweave and AO networks.

## Overview

The Agent Skills Registry enables developers to:
- **Publish** Claude Agent Skills as immutable bundles on Arweave
- **Search** for Skills via a decentralized AO registry process
- **Install** Skills with automatic dependency resolution

## Architecture

This project uses a **decentralized infrastructure**:
- **Arweave Network**: Permanent storage for skill bundles (.tar.gz files)
- **AO Network**: Decentralized compute for registry process (Lua handlers)
- **npm Registry**: CLI tool distribution

## Prerequisites

- **Node.js**: 20.11.0 LTS or higher
- **npm**: 10.x or higher (bundled with Node.js)

## Installation

### For Users

```bash
# Install CLI globally via npm
npm install -g @permamind/skills

# Verify installation
skills --version
```

### For Developers

```bash
# Clone the repository
git clone https://github.com/permamind/skills.git
cd skills

# Install dependencies
npm install

# Build all workspaces
npm run build
```

## Skill Authoring Best Practices

When creating or migrating Skills with MCP server requirements, it's important to properly document dependencies to ensure users understand what needs to be installed separately.

### Documenting Dependencies

Use the `dependencies` field in your SKILL.md frontmatter for **installable skill dependencies** that can be installed via the `skills install` command:

```yaml
---
name: my-advanced-skill
version: 1.0.0
dependencies:
  - ao-basics
  - arweave-fundamentals
---
```

These dependencies will be automatically resolved and installed when users run `skills install my-advanced-skill`.

### MCP Server Requirements

Use the `mcpServers` field in your SKILL.md frontmatter for **MCP server requirements** that users must install separately through Claude Desktop:

```yaml
---
name: my-ui-skill
version: 1.0.0
mcpServers:
  - mcp__pixel-art
  - mcp__shadcn-ui
---
```

**Important:** MCP servers are NOT installed automatically by the CLI. Users must configure them in Claude Desktop's `claude_desktop_config.json` separately.

### Quick Reference Table

| Scenario | Correct Field | Example |
|----------|--------------|---------|
| Installable skill dependency | `dependencies` | `dependencies: ["ao-basics"]` |
| MCP server requirement | `mcpServers` | `mcpServers: ["mcp__pixel-art"]` |
| Mixed dependencies | Use both fields | See migration guide below |

### Migration from Legacy Patterns

Existing Skills may have MCP servers (items with `mcp__` prefix) in the `dependencies` field. This pattern is backward compatible, but the CLI will issue validation warnings during publish to guide you toward migrating to the dedicated `mcpServers` field.

**For detailed migration instructions**, see the [MCP Server Migration Guide](docs/guides/mcp-migration-guide.md).

**Validation warnings are non-blocking** - your skill will still publish and install successfully. MCP servers are automatically detected and skipped during installation, with informational messages guiding users to install them separately.

## Quick Start

### 1. Install the CLI

```bash
npm install -g @permamind/skills
```

### 2. Configure Your Wallet

Create a `.skillsrc` file in your home directory:

```json
{
  "wallet": "~/.arweave/wallet.json",
  "registry": "AO_REGISTRY_PROCESS_ID",
  "gateway": "https://arweave.net"
}
```

### 3. Search for Skills

```bash
# Search by keyword
skills search arweave

# List all skills
skills search ""

# Filter by tags
skills search --tag tutorial --tag beginner
```

### 4. Install a Skill

```bash
# Install globally (default)
skills install ao-basics

# Install to project directory
skills install ao-basics --local
```

### 5. Publish Your First Skill

```bash
# Publish a skill directory
skills publish ./my-skill

# With verbose logging
skills publish ./my-skill --verbose
```

## Development

This is a monorepo managed with npm workspaces containing:

- **cli/**: TypeScript CLI tool for publish, search, and install operations
- **mcp-server/**: MCP server for Claude AI integration (exposes registry tools via Model Context Protocol)
- **ao-process/**: Lua-based AO registry process
- **skills/**: Bootstrap Skills for AO, Arweave, and Permamind integration
- **scripts/**: Deployment and validation scripts
- **docs/**: Project documentation

## MCP Server

The Agent Skills Registry includes an MCP server that exposes registry functionality to Claude AI through the Model Context Protocol. It provides three main tools:

- **publish_skill**: Publish skills to the Arweave/AO registry
- **search_skills**: Search the registry for available skills
- **install_skill**: Install skills with automatic dependency resolution

The MCP server uses **seed phrase wallet** for deterministic Arweave key generation, enabling reproducible deployments without key file management.

**📖 Complete Setup Guide**: See [mcp-server/README.md](mcp-server/README.md) for detailed installation, configuration, and usage instructions.

**🖥️ Claude Desktop Integration**: Configure in Claude Desktop's `claude_desktop_config.json` to enable Claude AI access to the registry.

### Quick MCP Server Commands

```bash
# Build MCP server
npm run build --workspace=mcp-server

# Run MCP server tests
npm test --workspace=mcp-server

# Start MCP server (requires SEED_PHRASE in mcp-server/.env)
npm run start --workspace=mcp-server
```

### Available Scripts

```bash
# Build all workspaces
npm run build

# Run tests in watch mode
npm test

# Run tests once
npm run test:once

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage

# Run AO process tests
npm run test:ao

# Run tests in TDD mode
npm run tdd

# Lint TypeScript code
npm run lint

# Format code with Prettier
npm run format
```

### Working in the CLI

```bash
cd cli

# Build CLI
npm run build

# Watch mode for development
npm run dev

# Run tests
npm test
```

## Tech Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Language** | TypeScript | 5.3.3 | Primary development language |
| **Runtime** | Node.js | 20.11.0 LTS | JavaScript runtime |
| **Package Manager** | npm | 10.x | Dependency management |
| **Monorepo** | npm workspaces | (built-in) | Monorepo management |
| **CLI Framework** | Commander.js | ^12.0.0 | Command parsing and routing |
| **Testing** | Jest | ^29.7.0 | Unit and integration testing |
| **Arweave SDK** | arweave | ^1.14.4 | Transaction creation and upload |
| **AO Integration** | @permaweb/aoconnect | ^0.0.53 | AO message passing |

## Project Structure

```
@permamind/skills/
├── cli/                    # CLI tool source code
│   ├── src/
│   │   ├── commands/       # CLI commands (publish, search, install)
│   │   ├── clients/        # Arweave and AO client abstractions
│   │   ├── lib/            # Core libraries (bundler, dependency resolver)
│   │   ├── parsers/        # SKILL.md parser
│   │   ├── schemas/        # JSON schemas for validation
│   │   └── types/          # TypeScript type definitions
│   └── tests/
│       ├── unit/           # Unit tests (mirrors src/)
│       ├── integration/    # Integration tests
│       ├── fixtures/       # Test fixtures
│       └── helpers/        # Test helpers
├── ao-process/             # AO registry process (Lua)
├── skills/                 # Bootstrap Skills
├── scripts/                # Deployment scripts
└── docs/                   # Documentation
```

## Testing

The project uses Jest with TypeScript support:

- **Unit tests**: `cli/tests/unit/` (mirrors `cli/src/`)
- **Integration tests**: `cli/tests/integration/`
- **AO tests**: `ao-process/tests/` (Lua with aolite)

### Test-Driven Development

```bash
# TDD mode (watch + verbose)
npm run tdd

# Unit tests only
npm run test:unit

# Coverage report
npm run test:coverage
```

## Performance

The CLI has been heavily optimized for speed and responsiveness:

### Performance Metrics

| Operation | Performance | Notes |
|-----------|-------------|-------|
| **Startup** | 47-49ms | 91% faster with lazy loading |
| **Search** (cached) | <100ms | 99% faster for repeated queries |
| **Install** (cached) | <1s | 95% faster with dependency cache |
| **Bundle** | 3-11ms | Optimal gzip compression (level 6) |

### Optimizations

- **Lazy Loading**: Heavy dependencies (tar, arweave, aoconnect) load on-demand only
- **Smart Caching**:
  - Search results cached for 5 minutes
  - Dependency metadata cached across operations (LRU, 100 entries)
- **Optimal Compression**: 61.75% compression ratio without speed penalty
- **Parallel Operations**: Dependency fetching parallelized with Promise.all()

### Performance Testing

Run performance benchmarks and regression tests:

```bash
# Run all performance tests
npm test -- cli/tests/performance/

# Run regression tests only
npm test -- cli/tests/performance/regression.test.ts

# Run specific benchmarks
npm test -- cli/tests/performance/benchmark-publish.test.ts
```

**Documentation**: See `docs/performance-benchmarks.md` for detailed metrics and `docs/performance-analysis.md` for optimization techniques.

## Epic 9: Turbo SDK Migration - Free Uploads for Small Bundles

**Overview:**
As of version 2.0.0, the Agent Skills Registry CLI uses **Turbo SDK** for bundle uploads, enabling **free uploads for bundles under 100KB**. Most skill bundles are < 100KB (skill metadata + SKILL.md files), making this a significant cost savings for the community.

**Cost Savings:**
- **Before (Arweave SDK):** ~$0.02 per upload (50KB bundle)
- **After (Turbo SDK):** **FREE** for bundles < 100KB
- **Larger bundles (≥ 100KB):** Continue using Arweave SDK (existing behavior)

**Example:**
Typical skill bundle (SKILL.md + metadata):
- Size: 45KB
- Cost: **$0.00** (subsidized by Turbo)
- Upload time: ~3-5 seconds

**Upgrade Impact:**
- ✅ **No breaking changes:** CLI commands work identically
- ✅ **Automatic benefit:** Small bundles upload for free immediately
- ✅ **Backward compatible:** Existing skills continue working
- ✅ **Same transaction IDs:** AO registry compatibility maintained

**Configuration:**
See `.env.example` for optional Turbo SDK settings:
- `TURBO_GATEWAY`: Custom Turbo gateway URL (optional)
- `TURBO_USE_CREDITS`: Force credit-based uploads (default: false)

**Troubleshooting:**
See [docs/troubleshooting.md](docs/troubleshooting.md#turbo-sdk-errors) for common Turbo SDK errors and solutions.

**Full Details:**
See [docs/prd/epic-9.md](docs/prd/epic-9.md) for complete Epic 9 specification.

## Coding Standards

- **TypeScript**: Strict mode enabled, ESLint with TypeScript parser
- **Style**: Prettier with 2-space indent, single quotes
- **File naming**: kebab-case (e.g., `manifest-parser.ts`)
- **Classes/Interfaces**: PascalCase (e.g., `ManifestParser`, `ISkillMetadata`)
- **Functions**: camelCase (e.g., `parseManifest()`)

## Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
# AO Registry Configuration
AO_REGISTRY_PROCESS_ID=

# Network Configuration (mainnet or testnet)
AO_NETWORK=mainnet

# Arweave Gateway
ARWEAVE_GATEWAY=https://arweave.net

# AO Gateway
AO_GATEWAY=https://ao-gateway.io
```

## CLI Configuration

Copy `.skillsrc.example` to `.skillsrc` for CLI configuration:

```json
{
  "wallet": "~/.arweave/wallet.json",
  "gateway": "https://arweave.net",
  "registry": "AO_REGISTRY_PROCESS_ID_HERE"
}
```

## CLI Usage

### Publish a Skill

Upload a skill to Arweave and register it in the AO registry:

```bash
# Publish a skill directory
skills publish ./my-skill

# With custom wallet
skills publish ./my-skill --wallet ~/custom-wallet.json

# With verbose logging
skills publish ./my-skill --verbose

# Skip transaction confirmation (faster, less reliable)
skills publish ./my-skill --skip-confirmation

# Custom gateway
skills publish ./my-skill --gateway https://arweave.dev
```

#### Publish Command Options

| Flag | Description | Default |
|------|-------------|---------|
| `--wallet <path>` | Custom wallet path (overrides config) | `.skillsrc` value or prompt |
| `--verbose` | Enable detailed logging | `false` |
| `--gateway <url>` | Custom Arweave gateway URL | `https://arweave.net` |
| `--skip-confirmation` | Skip transaction confirmation polling | `false` |

#### Publish Workflow

1. **Validates** directory and SKILL.md existence
2. **Parses** and validates SKILL.md manifest
3. **Loads** wallet and checks balance
4. **Creates** tar.gz bundle from skill directory
5. **Uploads** bundle to Arweave with progress indicator
6. **Polls** transaction confirmation (unless `--skip-confirmation`)
7. **Registers** skill metadata in AO registry
8. **Displays** success message with transaction IDs

#### Success Example

```
✔ SKILL.md validated successfully
✔ Bundle created: 1.2 MB (15 files)
✔ Wallet balance: 0.5 AR (sufficient)
✔ Bundle uploaded: abc123...xyz789
✔ Transaction confirmed
✔ Skill registered: msg456...def012

🎉 Skill published successfully!

  Name:         ao-basics
  Version:      1.0.0
  Arweave TX:   abc123...xyz789
  Registry ID:  msg456...def012
  Bundle Size:  1.2 MB
  Upload Cost:  0.001 AR

View your skill on Arweave:
  https://arweave.net/abc123...xyz789

Search for your skill:
  skills search ao-basics
```

#### Error Handling

| Error Type | Exit Code | Common Causes |
|------------|-----------|---------------|
| **ValidationError** | 1 | Missing SKILL.md, invalid manifest, malformed directory |
| **ConfigurationError** | 1 | Wallet not configured, registry process ID missing |
| **AuthorizationError** | 3 | Insufficient AR balance, invalid wallet |
| **NetworkError** | 2 | Upload failure, registry unavailable, gateway timeout |
| **FileSystemError** | 2 | Bundle creation failed, permission denied |

All error messages follow the pattern: **"Error → Solution:"** with actionable recovery steps.

### Search for Skills

Query the AO registry to discover available skills:

```bash
# Search by keyword
skills search arweave

# Multi-word query
skills search "ao basics"

# List all skills
skills search ""

# Filter by single tag
skills search crypto --tag blockchain

# Multiple tags (AND logic)
skills search --tag ao --tag arweave

# JSON output
skills search crypto --json

# Verbose mode
skills search --verbose --tag ao
```

#### Search Command Options

| Flag | Description | Default |
|------|-------------|---------|
| `--tag <tag>` | Filter by tag (multiple allowed, AND logic) | `[]` |
| `--json` | Output raw JSON instead of table | `false` |
| `--verbose` | Show detailed query information | `false` |

### Install a Skill

Download and install a skill with automatic dependency resolution:

```bash
# Install globally (default)
skills install ao-basics

# Install to local project
skills install arweave-fundamentals --local

# Force reinstall
skills install permamind-integration --force

# Show dependency tree
skills install cli-development --verbose

# Skip lock file
skills install agent-skills-best-practices --no-lock
```

#### Install Command Options

| Flag | Description | Default |
|------|-------------|---------|
| `--global` | Install to ~/.claude/skills/ | `true` |
| `--local` | Install to .claude/skills/ (project-specific) | `false` |
| `--force` | Overwrite existing installations | `false` |
| `--verbose` | Show detailed dependency tree | `false` |
| `--no-lock` | Skip lock file generation | `false` |

#### Install Workflow

1. **Searches** AO registry for skill by name
2. **Downloads** skill bundle from Arweave
3. **Resolves** and installs all dependencies recursively
4. **Extracts** files to installation directory
5. **Updates** skills-lock.json (unless --no-lock)
6. **Displays** success message with installation path

## Common Workflows

### Publishing Your First Skill

```bash
# 1. Create skill directory with SKILL.md
mkdir my-skill
cd my-skill

# 2. Create SKILL.md with frontmatter
cat > SKILL.md << 'EOF'
---
name: my-skill
description: A helpful skill for X
version: 1.0.0
author: Your Name
tags: [tutorial, beginner]
---

# My Skill Instructions

Your skill instructions go here.
EOF

# 3. Publish to Arweave
skills publish .

# 4. Verify it's searchable
skills search my-skill
```

### Searching and Installing Skills

```bash
# 1. Search for skills by topic
skills search arweave

# 2. Filter by tags to find relevant skills
skills search --tag tutorial --tag beginner

# 3. Install the skill you want
skills install ao-basics

# 4. Verify installation
ls ~/.claude/skills/
```

### Handling Skill Dependencies

```bash
# 1. Install a skill with dependencies
skills install complex-skill --verbose

# 2. View dependency tree in output
# Dependencies are automatically resolved and installed

# 3. Check lock file for installed versions
cat skills-lock.json

# 4. Force reinstall if needed
skills install complex-skill --force
```

### Working with Multiple Environments

```bash
# Mainnet configuration
cat > ~/.skillsrc << EOF
{
  "wallet": "~/.arweave/mainnet-wallet.json",
  "registry": "MAINNET_REGISTRY_ID",
  "gateway": "https://arweave.net"
}
EOF

# Test your skill
skills search my-skill

# Switch to testnet for development
cat > ~/.skillsrc << EOF
{
  "wallet": "~/.arweave/testnet-wallet.json",
  "registry": "TESTNET_REGISTRY_ID",
  "gateway": "https://arweave.dev"
}
EOF

# Publish to testnet first
skills publish ./my-skill --verbose
```

## Configuration Reference

### .skillsrc Options

The `.skillsrc` file can be placed in your home directory or project root. Project-level configuration takes precedence.

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `wallet` | string | Yes | Path to Arweave wallet JSON file. Supports tilde expansion (`~`). Can be overridden with `--wallet` flag. |
| `registry` | string | Yes | AO process ID (43-character Arweave transaction ID) for skill registry. Use mainnet registry for production. |
| `gateway` | string | No | Arweave gateway URL. Default: `https://arweave.net`. Can be overridden with `--gateway` flag. |

### Example Configurations

**Mainnet Production:**
```json
{
  "wallet": "~/.arweave/mainnet-wallet.json",
  "registry": "MAINNET_REGISTRY_PROCESS_ID",
  "gateway": "https://arweave.net"
}
```

**Testnet Development:**
```json
{
  "wallet": "~/.arweave/testnet-wallet.json",
  "registry": "TESTNET_REGISTRY_PROCESS_ID",
  "gateway": "https://arweave.dev"
}
```

**Custom Gateway:**
```json
{
  "wallet": "~/.arweave/wallet.json",
  "registry": "REGISTRY_PROCESS_ID",
  "gateway": "https://g8way.io"
}
```

## License

MIT

## Troubleshooting

Encountering errors? Check our comprehensive **[Troubleshooting Guide](docs/troubleshooting.md)** for solutions to common issues:

- Validation errors (invalid skill names, missing fields, etc.)
- Network errors (timeouts, gateway failures, connection issues)
- Configuration errors (missing wallet, registry not configured)
- Authorization errors (insufficient funds, wallet not found)
- Dependency errors (circular dependencies, missing dependencies)
- File system errors (permissions, disk space)

All error messages follow the format: `[ErrorType] Problem. -> Solution: Action to take.`

For detailed debugging, use the `--verbose` flag:
```bash
skills publish ./my-skill --verbose
```

## Contributing

We welcome contributions! See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for:

- How to report issues
- How to submit pull requests
- Development setup instructions
- Coding standards and testing requirements
- PR review process

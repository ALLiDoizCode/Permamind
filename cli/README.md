# @permamind/skills

[![npm version](https://img.shields.io/npm/v/@permamind/skills.svg)](https://www.npmjs.com/package/@permamind/skills)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.11.0-brightgreen.svg)](https://nodejs.org/)

A decentralized CLI for publishing, searching, and installing Claude Agent Skills on Arweave and AO networks.

## Overview

The Agent Skills Registry enables developers to:
- **Publish** Claude Agent Skills as immutable bundles on Arweave
- **Search** for Skills via a decentralized AO registry process
- **Install** Skills with automatic dependency resolution

## Installation

```bash
npm install -g @permamind/skills
```

Verify installation:

```bash
skills --version
```

## Prerequisites

- **Node.js**: 20.11.0 LTS or higher
- **npm**: 10.x or higher (bundled with Node.js)
- **Arweave Wallet**: Required for publishing Skills (two options)

## Quick Start

### 1. Configure Your Wallet

**Option A: File-Based Wallet (Traditional)**

Create a `.skillsrc` file in your home directory:

```json
{
  "wallet": "~/.arweave/wallet.json",
  "registry": "AO_REGISTRY_PROCESS_ID",
  "gateway": "https://arweave.net"
}
```

**Option B: Seed Phrase Wallet (Deterministic)**

Set the `SEED_PHRASE` environment variable with a 12-word BIP39 mnemonic:

```bash
# Via environment variable
export SEED_PHRASE="abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"

# Or via .env file (recommended for development)
echo 'SEED_PHRASE=your twelve word mnemonic phrase here' > .env
```

**Wallet Selection Priority:**
1. `SEED_PHRASE` environment variable (highest priority)
2. `--wallet` flag (command-line override)
3. Default wallet path `~/.arweave/wallet.json` (fallback)

**Security Warning:**
- ⚠️ Never commit `.env` files with real seed phrases to version control
- ⚠️ Keep seed phrases secure - anyone with your seed phrase has full wallet access
- ⚠️ Use `.env.example` as a template (placeholder only, safe to commit)
- ✅ Add `.env` to your `.gitignore` file

**Keychain Limitation:**
- Keychain operations only support file-based wallets
- Seed phrase wallets are generated deterministically on each CLI invocation

### 2. Search for Skills

```bash
# Search by keyword
skills search arweave

# List all skills
skills search ""

# Filter by tags
skills search --tag tutorial --tag beginner
```

### 3. Install a Skill

```bash
# Install globally (default)
skills install ao-basics

# Install to project directory
skills install ao-basics --local
```

### 4. Publish a Skill

```bash
# Publish a skill directory
skills publish ./my-skill

# With verbose logging
skills publish ./my-skill --verbose
```

## Commands

### `skills search [query]`

Search for Skills in the decentralized registry.

**Options:**
- `--tag <tag>` - Filter by tag (can be repeated)
- `--author <address>` - Filter by author Arweave address
- `--limit <number>` - Limit number of results (default: 20)

**Examples:**
```bash
skills search "arweave basics"
skills search --tag tutorial --tag beginner
skills search --author ABC123...XYZ789
```

### `skills install <name>`

Install a Skill with automatic dependency resolution.

**Options:**
- `--local` - Install to project directory instead of global
- `--force` - Force reinstall even if already installed
- `--skip-deps` - Skip dependency installation

**Examples:**
```bash
skills install ao-basics
skills install my-skill --local
skills install advanced-skill --force
```

### `skills publish <directory>`

Publish a Skill to Arweave and register it in the AO registry.

**Options:**
- `--verbose` - Show detailed logging
- `--dry-run` - Validate without publishing
- `--wallet <path>` - Override wallet path from config

**Examples:**
```bash
skills publish ./my-skill
skills publish ./my-skill --verbose
skills publish ./my-skill --dry-run
```

### `skills --help`

Display help for all commands or a specific command.

```bash
skills --help
skills publish --help
skills search --help
```

## MCP Server Integration

This CLI has a complementary MCP server that exposes the same functionality to Claude AI through the Model Context Protocol.

**📖 MCP Server Documentation**: See [../mcp-server/README.md](../mcp-server/README.md) for MCP server setup and usage.

**🔄 Cross-Compatibility Guarantee**: Skills published, searched, or installed via either the CLI or MCP server are fully compatible. Both tools share the same lock file format (`skills-lock.json`) and registry.

**✅ Verified Compatibility**: Cross-compatibility is verified by [integration tests](tests/integration/cross-compatibility.integration.test.ts) with 11/11 tests passing (100% compatibility).

### Key Differences

| Feature | CLI | MCP Server |
|---------|-----|-----------|
| **Interface** | Command-line | Natural language (Claude AI) |
| **Wallet Type** | File-based (JWK) or seed phrase | Seed phrase only |
| **Best For** | Automation, CI/CD, scripting | Interactive use, Claude Desktop integration |
| **Installation** | Global npm package | Claude Desktop configuration |

### Example Cross-Tool Workflow

```bash
# Publish with MCP (via Claude)
# User: "Publish the skill in ./my-skill"
# Claude: Successfully published my-skill v1.0.0!

# Search with CLI
skills search my-skill
# Found: my-skill v1.0.0 by Your Name

# Install with CLI
skills install my-skill
# ✓ Installed to ~/.claude/skills/my-skill

# Both tools share the same lock file
cat ~/.claude/skills/skills-lock.json
```

## Architecture

This CLI uses a **decentralized infrastructure**:
- **Arweave Network**: Permanent storage for skill bundles (.tar.gz files)
- **AO Network**: Decentralized compute for registry process (Lua handlers)
- **npm Registry**: CLI tool distribution

## Troubleshooting

### "command not found: skills"

Ensure npm global bin directory is in your PATH:

```bash
# Check npm global bin path
npm bin -g

# Add to PATH (example for macOS/Linux with bash)
echo 'export PATH="$(npm bin -g):$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### "Permission denied" on installation

Use Node Version Manager (nvm) to avoid permission issues:

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node.js via nvm
nvm install 20.11.0
nvm use 20.11.0

# Install CLI globally (no sudo needed)
npm install -g @permamind/skills
```

### "Wallet not found"

Create a `.skillsrc` config file with your wallet path:

```json
{
  "wallet": "/path/to/your/arweave-wallet.json"
}
```

Or generate a new Arweave wallet:
- Visit [Arweave Web Wallet](https://arweave.app)
- Download your keyfile JSON
- Reference it in `.skillsrc`

## Contributing

Contributions are welcome! Please see the [GitHub repository](https://github.com/ALLiDoizCode/Permamind) for:
- Source code
- Issue tracker
- Contributing guidelines
- Development setup

## License

MIT License - See [LICENSE](https://github.com/ALLiDoizCode/Permamind/blob/main/LICENSE) for details.

## Links

- **Repository**: [https://github.com/ALLiDoizCode/Permamind](https://github.com/ALLiDoizCode/Permamind)
- **Issues**: [https://github.com/ALLiDoizCode/Permamind/issues](https://github.com/ALLiDoizCode/Permamind/issues)
- **npm Package**: [https://www.npmjs.com/package/@permamind/skills](https://www.npmjs.com/package/@permamind/skills)
- **Arweave Network**: [https://arweave.org](https://arweave.org)
- **AO Network**: [https://ao.arweave.dev](https://ao.arweave.dev)

## Support

For questions, issues, or feature requests:
- Open an issue on [GitHub Issues](https://github.com/ALLiDoizCode/Permamind/issues)
- Join the community discussions

---

**Built with ❤️ on Arweave and AO networks**

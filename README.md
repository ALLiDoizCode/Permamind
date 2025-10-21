# Agent Skills Registry

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

```bash
# Install dependencies
npm install

# Build all workspaces
npm run build
```

## Development

This is a monorepo managed with npm workspaces containing:

- **cli/**: TypeScript CLI tool for publish, search, and install operations
- **ao-process/**: Lua-based AO registry process
- **skills/**: Bootstrap Skills for AO, Arweave, and Permamind integration
- **scripts/**: Deployment and validation scripts
- **docs/**: Project documentation

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
agent-skills-registry/
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
agent-skills publish ./my-skill

# With custom wallet
agent-skills publish ./my-skill --wallet ~/custom-wallet.json

# With verbose logging
agent-skills publish ./my-skill --verbose

# Skip transaction confirmation (faster, less reliable)
agent-skills publish ./my-skill --skip-confirmation

# Custom gateway
agent-skills publish ./my-skill --gateway https://arweave.dev
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

## License

MIT

## Contributing

See the `docs/` directory for architecture documentation and contributing guidelines.

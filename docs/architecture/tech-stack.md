# Tech Stack

## Cloud Infrastructure

**Provider:** Decentralized Infrastructure (Arweave + AO Networks)

**Key Services:**
- **Arweave Network** - Permanent data storage for skill bundles (tar.gz files)
- **AO Network** - Decentralized compute for registry process (Lua handlers)
- **npm Registry** - CLI tool distribution

**Deployment Regions:** Global (decentralized, no specific regions)

**Cost Model:**
- Arweave: Pay-per-upload (one-time, permanent storage)
- AO: Currently free (no AR tokens required for process spawning or messages)
- npm: Free for open-source packages

## Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|-----------|---------|---------|-----------|
| **Language** | TypeScript | 5.3.3 | Primary development language | Strong typing prevents runtime errors, excellent IDE support, team expertise from PRD |
| **Runtime** | Node.js | 20.11.0 LTS | JavaScript runtime | Latest LTS, stable performance, cross-platform support, exceeds PRD requirement (16+) |
| **Package Manager** | npm | 10.x (bundled with Node) | Dependency management | Built-in with Node.js, widely supported, no additional installation |
| **Monorepo** | npm workspaces | (built-in) | Monorepo management | Zero config, sufficient for 4-package structure, avoids Turborepo/Nx overhead |
| **CLI Framework** | Commander.js | ^12.0.0 | Command parsing and routing | Industry standard, robust argument parsing, subcommand support (PRD specified) |
| **YAML Parsing** | gray-matter | ^4.0.3 | SKILL.md frontmatter extraction | De facto standard for frontmatter parsing, simple API (PRD specified) |
| **JSON Schema** | ajv | ^8.12.0 | Manifest validation | Fast, standards-compliant JSON Schema validator (PRD specified) |
| **Archiving** | tar | ^6.2.0 | Bundle creation/extraction | Native Node.js tar support, cross-platform compatibility (PRD specified) |
| **Progress UI** | ora | ^8.0.1 | Spinner/progress indicators | Beautiful CLI spinners, widely used (PRD specified) |
| **Color Output** | chalk | ^5.3.0 | Terminal color formatting | Standard for terminal colors, zero dependencies (PRD specified) |
| **Table Formatting** | cli-table3 | ^0.6.3 | Search results display | Flexible table rendering, terminal width aware (PRD specified) |
| **Encryption** | keytar | ^7.9.0 | System keychain integration | Native keychain access (macOS Keychain, Windows Credential Vault, Linux Secret Service) (PRD specified) |
| **Testing Framework** | Jest | ^29.7.0 | Unit and integration testing | TypeScript support, mocking, snapshot testing (PRD specified) |
| **AO Testing** | aolite | latest | Local AO process emulation | Lua 5.3-based AO emulator, no network needed for tests (PRD specified) |
| **Arweave SDK** | arweave | ^1.14.4 | Transaction creation and upload | Official Arweave JavaScript SDK for bundle uploads |
| **Browser Wallet** | node-arweave-wallet | ^0.0.12 | Browser wallet connection | Random port allocation, ArConnect/Wander support, local server auth for secure wallet interactions |
| **AO Integration** | @permaweb/aoconnect | ^0.0.53 | AO message passing | Official AO SDK for registry queries and registration (PRD specified) |
| **HTTP Client** | (built-in fetch) | Node 20.x native | Arweave gateway requests | Native Node.js fetch (18+), no axios/node-fetch needed |
| **Linter** | ESLint | ^8.56.0 | Code quality and consistency | TypeScript-aware linting, catches common errors |
| **Formatter** | Prettier | ^3.2.4 | Code formatting | Consistent code style, integrates with ESLint |
| **Type Checking** | tsc (TypeScript) | 5.3.3 | Compile-time type safety | Native TypeScript compiler for type checking |
| **Build Tool** | tsc + npm scripts | (native) | TypeScript compilation | Native tooling, no webpack/rollup complexity for CLI |
| **Local State Storage** | JSON files | native | Lock file (skills-lock.json) | Simple, human-readable, no database needed for local state |
| **Registry Database** | AO Process Lua tables | AO mainnet | Mutable skill index (search queries) | Decentralized state management, query-optimized structure |
| **Bundle Storage** | Arweave blockchain | mainnet | Immutable skill bundle storage | Permanent storage, content-addressed retrieval via TXID |
| **Storage** | Arweave Network | mainnet | Immutable bundle storage | Permanent storage, transaction-based addressing |
| **Registry** | AO Process | mainnet | Mutable skill index | Decentralized compute, message-based queries |
| **Distribution** | npm Registry | npmjs.com | CLI package distribution | Standard JavaScript package distribution |
| **Version Control** | Git + GitHub | latest | Source control and collaboration | Industry standard, free public repos |
| **Process Deployment** | @permaweb/aoconnect | ^0.0.53 | AO process spawning and deployment (CI/CD) | Script-based deployment, no MCP dependency for automation |
| **Manual Deployment** | Permamind MCP Server | latest | AO process spawning (local development) | Interactive deployment for testing and development |
| **CI/CD** | GitHub Actions | latest | Automated testing and deployment | Free for public repos, integrated with GitHub |
| **Environment Config** | dotenv | ^16.4.0 | Environment variable management | Load .env files for process IDs, network config |

---

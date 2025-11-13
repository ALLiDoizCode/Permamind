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
| **Language (CLI)** | TypeScript | 5.3.3 | CLI development language | Strong typing prevents runtime errors, excellent IDE support, team expertise from PRD |
| **Language (Frontend)** | TypeScript | 5.3.3 | Frontend development language | Type safety for React components, consistent with CLI language choice |
| **Runtime (CLI)** | Node.js | 20.11.0 LTS | CLI runtime environment | Latest LTS, stable performance, cross-platform support, exceeds PRD requirement (16+) |
| **Runtime (Frontend)** | Browser | Modern browsers (Chrome, Firefox, Safari, Edge) | Web application runtime | Cross-platform web delivery via Arweave Permaweb |
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
| **Testing Framework (CLI)** | Jest | ^29.7.0 | CLI unit and integration testing | TypeScript support, mocking, snapshot testing (PRD specified) |
| **Testing Framework (Frontend)** | Vitest | ^4.0.3 | Frontend unit and integration testing | Vite-native, faster than Jest, ESM support, compatible with existing React Testing Library tests |
| **React Testing** | React Testing Library | ^16.3.0 | React component testing | Industry standard for React component testing, encourages accessibility-first testing |
| **E2E Testing (Frontend)** | Playwright | ^1.56.1 | End-to-end browser testing | Cross-browser support, reliable selectors, built-in test runner |
| **AO Testing** | aolite | latest | Local AO process emulation | Lua 5.3-based AO emulator, no network needed for tests (PRD specified) |
| **Arweave SDK** | arweave | ^1.14.4 | Transaction creation and upload | Official Arweave JavaScript SDK for bundle uploads |
| **Browser Wallet** | @permamind/node-arweave-wallet | ^0.0.13 | Browser wallet connection (forked) | Random port allocation, ArConnect/Wander support, local server auth, **custom UI template support** (fork feature) |
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
| **Frontend Framework** | React | ^18.3.1 | UI component library | Industry-standard declarative UI, vast ecosystem, team expertise |
| **Frontend Build Tool** | Vite | ^5.4.21 | Frontend bundler and dev server | Fast HMR, native ESM, optimized production builds, better DX than webpack |
| **Routing** | React Router DOM | ^7.9.4 | Client-side routing | Latest version with enhanced data APIs, code-splitting support |
| **CSS Framework** | Tailwind CSS | ^4.1.16 | Utility-first CSS | Rapid styling, consistent design system, small bundle size with purging |
| **UI Components** | shadcn-ui | latest | Accessible component primitives | Radix UI based, customizable, copy-paste approach (not npm dependency) |
| **Markdown Sanitization** | DOMPurify | ^3.3.0 | XSS protection for markdown | Industry-standard HTML sanitization, prevents XSS attacks in user content |
| **Permaweb Deployment** | permaweb-deploy | ^2.5.1 | Arweave deployment tool | Deploy frontend to Permaweb with ArNS support |

## Custom UI Templates

### Browser Wallet Connection UI

**Location:** `cli/src/ui/`

**Purpose:** Permamind-branded browser wallet connection interface matching developer-CLI terminal dark theme

**Components:**
- **wallet-connect.html** - HTML structure with SSE protocol DOM elements
- **wallet-connect.css** - Terminal dark theme styles
- **wallet-connect.js** - SSE protocol implementation

**Design System:**
- Colors: Terminal dark theme (`#10151B` background, `#1a1f26` surface, `#e2e8f0` text)
- Fonts: Inter (sans-serif), JetBrains Mono (monospace)
- Responsive: 375px (mobile), 768px (tablet), 1440px (desktop)

**Integration:**
- Configured in `NodeArweaveWalletAdapter` via `customHtmlTemplatePath`
- Copied to `dist/ui/` during build via `npm run copy-ui`
- Loaded by `@permamind/node-arweave-wallet` library at runtime

**Browser Support:** Chrome, Firefox, Safari (macOS/iOS), Edge (all latest stable)

---

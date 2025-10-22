# Technical Assumptions

## Repository Structure: Monorepo

The project will use a **monorepo structure** containing all components:

```
agent-skills-registry/
├── cli/                    # CLI tool source code (TypeScript)
│   ├── commands/          # publish, install, search commands
│   ├── lib/               # Shared utilities
│   ├── parsers/           # SKILL.md parser, dependency resolver
│   └── config/            # CLI configuration management
├── ao-process/            # AO registry process Lua code
│   └── registry.lua       # Skills registry smart contract
├── skills/                # Bootstrap skills (AO, Arweave content)
│   ├── ao-basics/
│   ├── arweave-intro/
│   └── ...
├── tests/                 # Integration and unit tests
└── docs/                  # Documentation and examples
```

**Rationale:** Monorepo simplifies development for solo developer, ensures consistent versioning between CLI and AO process, and streamlines bootstrap skill management. All components evolve together with shared dependencies.

## Service Architecture

**Three-Layer Serverless Architecture:**

1. **CLI Layer (Node.js/TypeScript):** User-facing commands, input validation, local file operations
2. **Integration Layer (SDK-based):** Arweave SDK calls, AO message passing via @permaweb/aoconnect, bundle creation/extraction
3. **Storage/Registry Layer (Decentralized):** Arweave (immutable storage) + AO process (mutable index)

**No traditional servers or databases required** - entire architecture is serverless and decentralized, eliminating hosting costs and infrastructure maintenance.

**Technology Stack:**
- **Language:** Node.js with TypeScript (cross-platform compatibility, npm ecosystem access, type safety)
- **CLI Framework:** Commander.js (robust argument parsing, subcommand support, familiar API)
- **Arweave Integration:**
  - `@permaweb/aoconnect` for AO process interaction (message passing, registry queries)
  - Arweave SDK for direct uploads and bundle storage
- **Bundling:** `tar` (Node.js tar library) for creating skill bundles from directories
- **Parsing:** `gray-matter` for YAML frontmatter extraction from SKILL.md files
- **Validation:** JSON Schema with `ajv` validator for manifest validation
- **Progress/UI:** `ora` (spinners), `chalk` (colors), `cli-table3` (formatted tables)
- **Encryption:** `keytar` (system keychain integration) for secure wallet storage

## Testing Requirements

**Testing Strategy: Unit + Integration Testing with Local AO Emulation and Arweave Mocking**

- **Unit Tests:** Cover parsers, validators, dependency resolution logic, manifest generation
- **AO Process Testing:** Use **aolite** (local AO protocol emulation) for testing registry.lua handlers without network deployment
  - Test skill registration, search queries, and metadata retrieval locally
  - Validate message passing and state management in isolated environment
  - Mock AO environment for fast, repeatable tests
  - Leverage aolite's concurrent process emulation and direct state access for debugging
- **Arweave Integration Testing:** Use **mock/fake data** for Arweave interactions (no test network available)
  - Mock Arweave upload responses with fake transaction IDs
  - Simulate bundle download with pre-generated test bundles stored locally
  - Test error scenarios (network timeouts, insufficient funds, gateway failures) with controlled mocks
  - Use dependency injection to swap real Arweave SDK calls with test doubles
- **Integration Tests:** End-to-end flows (publish → search → install) using mocked Arweave + aolite AO process
- **Cross-Platform Testing:** Validate CLI on macOS, Linux, and Windows before launch
- **Coverage Target:** >80% code coverage for critical paths (publish, install, dependency resolution)
- **Test Framework:**
  - **Jest** (built-in TypeScript support, snapshot testing, mocking capabilities) for CLI/TypeScript code
  - **aolite** (Lua 5.3-based AO emulator) for AO process testing

**No GUI/E2E testing required** - CLI testing focuses on command execution, file operations, and network interactions.

**Manual Testing Requirements:**
- Bootstrap skill installations on clean environments
- Network failure scenarios (timeout handling, retry logic)
- Keypair management across platforms
- Circular dependency detection edge cases
- **Real Arweave/AO Testing:** Final validation with actual uploads and registry interactions before launch (budget ~$50-100 for test uploads from brief)

## Additional Technical Assumptions and Requests

- **Arweave Transaction Finality:** Assume 2-5 minute confirmation times; CLI must communicate this clearly during publish operations
- **AO Process Query Latency:** Variable based on network conditions; implement timeouts (30s default) with retry logic
- **Skill Size Practical Limit:** ~10MB per skill due to Arweave upload costs; document in publishing guidelines but no hard enforcement in MVP
- **Node.js Version Support:** Require Node 16+ LTS versions for modern features and long-term support
- **No Offline Mode:** CLI requires internet connection for all operations (publish, install, search); local cache may be added post-MVP
- **Wallet Management:** File-based keypair storage for MVP (encrypt with system keychain if available); consider more sophisticated solutions post-launch
- **Lock File Format:** JSON-based `skills-lock.json` storing skill names, versions, Arweave TXIDs, and dependency tree
- **Dependency Version Strategy:** Use exact versions in lock file; semver matching deferred to post-MVP
- **Error Recovery:** Implement atomic operations where possible (e.g., install all dependencies or roll back entirely)
- **Logging:** Support `--verbose` flag for detailed logging; standard output concise by default
- **Configuration:** Support `.skillsrc` or `skills.config.json` for user preferences (default install location, verbosity, Arweave gateway)

**Infrastructure Deployment:**
- **CLI Distribution:** Publish to npm registry as `@agent-skills/cli` or `agent-skills-cli` package
- **AO Process Deployment:** Deploy registry.lua to AO network, publish process ID in documentation and CLI default config
- **No CI/CD Initially:** Manual releases for MVP to maintain speed; automate post-launch if needed

**Security Considerations:**
- Wallet keypair encryption at rest using system keychain (`keytar` library)
- HTTPS-only for all Arweave gateway communications
- Input validation on all CLI parameters to prevent command injection
- Manifest schema validation prevents malformed uploads
- No personal data collection beyond public Arweave addresses

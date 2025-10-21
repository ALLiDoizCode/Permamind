# High Level Architecture

## Technical Summary

The Agent Skills Registry employs a **serverless three-layer architecture** leveraging decentralized infrastructure (Arweave + AO) to eliminate traditional hosting costs and maintenance overhead. The system is built as a Node.js CLI tool that orchestrates interactions between local file operations, Arweave's permanent storage layer, and an AO process-based registry index. Core technology choices include TypeScript for type safety, Commander.js for CLI parsing, and a monorepo structure to keep all components (CLI, AO process, bootstrap skills) versioned together. The architecture prioritizes cross-platform compatibility, >95% installation reliability, and familiar npm-like developer experience while achieving complete decentralization through Arweave/AO integration.

## High Level Overview

**Architectural Style:** Serverless Three-Layer Architecture with Decentralized Storage

**Repository Structure:** Monorepo (from PRD Technical Assumptions)
- All components (CLI, AO process Lua code, bootstrap skills, tests, docs) coexist in single repository
- Simplifies version coordination and dependency management for solo developer
- Enables atomic releases where CLI and AO registry schema evolve together

**Service Architecture:** Serverless Decentralized (from PRD Technical Assumptions)
1. **CLI Layer** - Node.js/TypeScript command-line tool running on user's machine
2. **Integration Layer** - SDK-based communication (Arweave SDK, @permaweb/aoconnect)
3. **Storage/Registry Layer** - Arweave (immutable bundle storage) + AO process (mutable skill index)

**Primary User Interaction Flow:**
1. **Publish Flow:** Developer runs `skills publish <dir>` → CLI bundles skill → uploads to Arweave → registers metadata in AO process → returns TXID
2. **Search Flow:** Developer runs `skills search <query>` → CLI queries AO registry → formats/displays results table
3. **Install Flow:** Developer runs `skills install <name>` → CLI queries AO registry for TXID → downloads bundle from Arweave → resolves dependencies → extracts to local directory → updates lock file

**Key Architectural Decisions:**

1. **Decentralized Over Centralized:** Using Arweave + AO eliminates server hosting, reduces costs to near-zero, and aligns with permanent storage value proposition. Trade-off: No traditional database query capabilities, must design around eventual consistency.

2. **Monorepo Over Polyrepo:** Keeps CLI, AO process code, and bootstrap skills in sync. Critical for 2-week sprint where breaking changes could occur frequently. Trade-off: Slightly larger repo size, but tooling complexity minimal for small team.

3. **CLI-First Over Web UI:** Targets developer workflow integration, enables scripting/automation, faster MVP delivery. Web interface deferred to post-MVP per PRD scope.

4. **File-Based Wallet Storage Over Hardware Wallet:** Simplifies MVP implementation while supporting keychain encryption where available. Trade-off: Security depends on file permissions, but acceptable for MVP with clear documentation.

## High Level Project Diagram

```mermaid
graph TB
    User[Developer/User] -->|commands| CLI[CLI Tool<br/>Node.js/TypeScript]

    CLI -->|publish bundle| Arweave[Arweave Network<br/>Permanent Storage]
    CLI -->|query metadata| AORegistry[AO Registry Process<br/>Skill Index]
    CLI -->|download bundle| Arweave
    CLI -->|register skill| AORegistry
    CLI -->|read/write| LocalFS[Local File System<br/>~/.claude/skills/]

    Arweave -->|stores| Bundles[Skill Bundles<br/>tar.gz files]
    AORegistry -->|maintains| Index[Skills Index<br/>name, version, TXID, metadata]

    LocalFS -->|contains| Installed[Installed Skills<br/>SKILL.md + files]
    LocalFS -->|contains| LockFile[skills-lock.json<br/>dependency tree]

    CLI -->|uses| ArweaveSDK[Arweave SDK<br/>upload/download]
    CLI -->|uses| AOConnect[@permaweb/aoconnect<br/>message passing]

    style CLI fill:#4A90E2
    style Arweave fill:#E27D60
    style AORegistry fill:#85DCB0
    style LocalFS fill:#E8A87C
```

## Architectural and Design Patterns

- **Serverless Architecture:** No traditional servers or databases; entire backend runs on decentralized infrastructure (Arweave storage + AO compute). *Rationale:* Eliminates hosting costs, aligns with project's decentralization values, and supports first-mover advantage by avoiding infrastructure setup delays.

- **CLI Command Pattern:** Each command (publish, search, install) encapsulated as separate modules with shared utilities. *Rationale:* Enables independent testing, clear separation of concerns, and easier feature addition post-MVP (e.g., `skills list`, `skills update`).

- **Dependency Injection (SDK Abstraction):** Arweave SDK and @permaweb/aoconnect wrapped in abstraction layers. *Rationale:* Enables mocking for tests (no real uploads during test suite), allows SDK swapping if needed, and isolates external API changes from core CLI logic.

- **Repository Pattern (Lock File):** skills-lock.json acts as local repository of installation state with dependency graph. *Rationale:* Enables reproducible installations, provides audit trail, and supports future features like `skills prune` or version rollback.

- **Message-Based Communication (AO):** AO registry process uses message handlers (Register-Skill, Search-Skills, Get-Skill). *Rationale:* Follows AO protocol standards (ADP v1.0), enables asynchronous processing, and allows registry evolution without CLI changes (handler versioning).

- **Fail-Fast Validation:** Input validation at CLI boundary before expensive operations (bundling, uploading). *Rationale:* Improves UX by catching errors early, reduces wasted Arweave transaction costs, and supports >95% installation reliability target.

---

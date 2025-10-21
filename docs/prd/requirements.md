# Requirements

## Functional

- **FR1:** CLI shall support `skills publish <directory>` command to bundle skill directory (SKILL.md + dependencies), upload to Arweave, and register metadata in AO process registry
- **FR2:** CLI shall support `skills install <name>` command to query AO registry for skill metadata, download bundle from Arweave, and install to local directory (`~/.claude/skills/` or `.claude/skills/`)
- **FR3:** CLI shall support `skills search <query>` command to query AO registry and display matching skills with name, description, author, and tags
- **FR4:** CLI shall parse SKILL.md files with YAML frontmatter to extract name, version, description, dependencies, author, and tags
- **FR5:** CLI shall resolve skill dependencies recursively and install all required skills during `skills install` execution
- **FR6:** CLI shall generate `skills-lock.json` file documenting installed skills, versions, and dependency tree for reproducible installations
- **FR7:** CLI shall validate SKILL.md manifest against JSON schema before publishing to ensure required fields are present
- **FR8:** CLI shall manage Arweave keypairs for publishing, loading from file system with basic encryption at rest
- **FR9:** Publishing shall support bundling skill directories into tar archives containing SKILL.md and all dependency files
- **FR10:** CLI shall provide clear error messages and recovery guidance for common failure modes (network errors, missing keypair, invalid manifest, insufficient Arweave tokens)
- **FR11:** CLI shall display progress indicators for long-running operations (publish, large installs) to communicate status during Arweave transaction finality wait times
- **FR12:** Installation shall support both personal skills directory (`~/.claude/skills/`) and project-specific directory (`.claude/skills/`)
- **FR13:** CLI shall detect and prevent circular dependencies during dependency resolution

## Non Functional

- **NFR1:** Installation success rate must exceed 95% across typical skill structures and dependency patterns
- **NFR2:** `skills publish` command must complete within 60 seconds for typical skill bundles (~5-10 files, <1MB total)
- **NFR3:** `skills install` command must complete within 10 seconds for typical skills without complex dependency trees
- **NFR4:** `skills search` command must return results within 2 seconds from AO registry queries
- **NFR5:** CLI must support cross-platform execution on macOS, Linux, and Windows using Node.js 16+ LTS versions
- **NFR6:** Dependency resolution must handle up to 10 levels of recursive dependencies without performance degradation
- **NFR7:** CLI must use HTTPS for all Arweave gateway communications to ensure secure data transmission
- **NFR8:** Input validation must prevent injection attacks on all CLI commands and parameters
- **NFR9:** Arweave wallet keypairs must be encrypted at rest using system keychain where available
- **NFR10:** CLI output must provide verbose mode for debugging and concise mode for clean UX (configurable via flags)

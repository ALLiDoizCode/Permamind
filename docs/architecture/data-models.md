# Data Models

## Skill Metadata Model

**Purpose:** Represents a publishable/installable skill with all metadata required for discovery, installation, and dependency resolution.

**Key Attributes:**
- `name`: `string` - Unique skill identifier (e.g., "ao-basics")
- `version`: `string` - Semantic version (e.g., "1.0.0")
- `description`: `string` - Human-readable skill purpose (max 1024 chars per PRD FR7)
- `author`: `string` - Skill creator identifier (human-readable display name)
- `owner`: `string` - Arweave address (43-char) from `msg.From` who published the skill (immutable after registration)
- `tags`: `string[]` - Searchable category tags (e.g., ["ao", "blockchain", "tutorial"])
- `dependencies`: `string[]` - Array of required skill names (e.g., ["ao-basics", "arweave-fundamentals"])
- `arweaveTxId`: `string` - 43-character Arweave transaction ID pointing to bundle
- `license`: `string` (optional) - License identifier (e.g., "MIT")
- `publishedAt`: `number` - Unix timestamp of original publication
- `updatedAt`: `number` - Unix timestamp of last update (enables tracking version history)

**Relationships:**
- **Self-referential dependency tree:** Skills reference other Skills via `dependencies` array
- **Bundle storage:** `arweaveTxId` links to Skill Bundle stored on Arweave
- **Registry index:** Stored in AO Process registry for search/discovery

**Storage Location:** AO Process Lua tables (registry state)

## Skill Bundle Model

**Purpose:** Physical tar.gz archive containing SKILL.md and all skill files for installation.

**Key Attributes:**
- `bundleData`: `Buffer` - Compressed tar.gz binary data
- `contentType`: `string` - MIME type ("application/x-tar+gzip")
- `arweaveTxId`: `string` - Arweave transaction ID (content address)
- `bundleSize`: `number` - Size in bytes (practical limit ~10MB per PRD)
- `arweaveTags`: `Tag[]` - Arweave transaction tags for metadata
  - `App-Name`: "Agent-Skills-Registry"
  - `Content-Type`: "application/x-tar+gzip"
  - `Skill-Name`: skill name
  - `Skill-Version`: skill version

**Relationships:**
- **Contains:** SKILL.md manifest file + all dependency files (recursive directory structure)
- **Referenced by:** Skill Metadata via `arweaveTxId`
- **Stored on:** Arweave blockchain (immutable)

**Storage Location:** Arweave network (permanent, content-addressed)

## Installed Skill Record Model

**Purpose:** Tracks locally installed skills and their dependency relationships for reproducible installations.

**Key Attributes:**
- `name`: `string` - Installed skill name
- `version`: `string` - Installed version
- `arweaveTxId`: `string` - Source bundle transaction ID
- `installedAt`: `number` - Unix timestamp of installation
- `installedPath`: `string` - Local file system path (e.g., "~/.claude/skills/ao-basics/")
- `dependencies`: `InstalledSkillRecord[]` - Recursive dependency tree
- `isDirectDependency`: `boolean` - True if user-requested, false if transitive dependency

**Relationships:**
- **Parent-child dependency graph:** Each record contains array of dependency records
- **References:** Original Skill Metadata via `arweaveTxId`
- **Stored in:** skills-lock.json file

**Storage Location:** Local file system (skills-lock.json)

## Lock File Structure Model

**Purpose:** Root document managing all installed skills with dependency graph and metadata.

**Key Attributes:**
- `lockfileVersion`: `number` - Schema version (starts at 1)
- `generatedAt`: `number` - Unix timestamp of last update
- `skills`: `InstalledSkillRecord[]` - Array of all installed skills
- `installLocation`: `string` - Installation directory path

**Relationships:**
- **Contains:** Array of Installed Skill Records with nested dependency trees
- **Owned by:** Local user/project

**Storage Location:** Local file system (~/.claude/skills-lock.json or .claude/skills-lock.json)

## AO Registry Message Models

**Purpose:** Define message schemas for AO process interactions (ADP v1.0 compliance).

**Register-Skill Message:**
- `Action`: "Register-Skill"
- `Name`: skill name
- `Version`: version string
- `Description`: skill description
- `Author`: author identifier (display name)
- `Tags`: JSON array of tags
- `ArweaveTxId`: bundle TXID
- `Dependencies`: JSON array of dependency names

**Search-Skills Message:**
- `Action`: "Search-Skills"
- `Query`: search query string (matches name/description/tags)

**Get-Skill Message:**
- `Action`: "Get-Skill"
- `Name`: skill name

**Info Message (ADP Compliance):**
- `Action`: "Info"
- Returns: Process metadata, handlers list, ADP version

**Relationships:**
- **Request-Response:** CLI sends messages, AO process responds with matching data
- **State mutation:** Register-Skill modifies AO process Lua table state

**Storage Location:** AO process message queue (ephemeral), results persist in AO state

---

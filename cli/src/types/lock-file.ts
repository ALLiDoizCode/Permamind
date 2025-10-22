/**
 * Lock File Type Definitions
 *
 * This module defines TypeScript interfaces for the Agent Skills Registry lock file system.
 * Lock files (`skills-lock.json`) provide reproducible and auditable skill installations
 * by tracking installed skills, versions, dependencies, and installation metadata.
 *
 * @module types/lock-file
 */

/**
 * Represents a single installed skill record in the lock file.
 *
 * This interface supports recursive dependency trees where each skill can have
 * its own array of dependencies, creating a hierarchical structure that mirrors
 * the actual dependency graph.
 *
 * **Recursive Structure:**
 * The `dependencies` field is an array of `IInstalledSkillRecord` objects, allowing
 * unlimited nesting depth to represent complex dependency trees. For example:
 *
 * ```
 * advanced-skill
 * └── dependencies
 *     └── ao-basics
 *         └── dependencies
 *             └── arweave-fundamentals
 *                 └── dependencies: []
 * ```
 *
 * **Direct vs Transitive Dependencies:**
 * - `isDirectDependency: true` - User explicitly requested installation
 * - `isDirectDependency: false` - Automatically installed as a dependency
 *
 * @example
 * ```typescript
 * const skillRecord: IInstalledSkillRecord = {
 *   name: 'ao-basics',
 *   version: '1.0.0',
 *   arweaveTxId: 'abc123...def789',
 *   installedAt: 1704067200000,
 *   installedPath: '~/.claude/skills/ao-basics/',
 *   dependencies: [],
 *   isDirectDependency: true
 * };
 * ```
 */
export interface IInstalledSkillRecord {
  /**
   * Name of the installed skill (from SKILL.md frontmatter)
   * @example 'ao-basics'
   */
  name: string;

  /**
   * Version string of the installed skill (from SKILL.md frontmatter)
   * @example '1.0.0'
   */
  version: string;

  /**
   * Arweave transaction ID of the source bundle
   * This is the permanent storage address on Arweave where the skill bundle is stored.
   * @example 'abc123...def789' (43-character Arweave TXID)
   */
  arweaveTxId: string;

  /**
   * Unix timestamp (milliseconds) when the skill was installed
   * @example 1704067200000 (2024-01-01 00:00:00 UTC)
   */
  installedAt: number;

  /**
   * Local file system path where the skill is installed
   * @example '~/.claude/skills/ao-basics/' (global installation)
   * @example '.claude/skills/ao-basics/' (local/project installation)
   */
  installedPath: string;

  /**
   * Recursive array of dependency skill records
   * Each dependency can have its own dependencies, creating a tree structure.
   * Empty array if the skill has no dependencies.
   * @example
   * ```typescript
   * dependencies: [
   *   {
   *     name: 'arweave-fundamentals',
   *     version: '1.0.0',
   *     // ... other fields
   *     dependencies: [] // Leaf node
   *   }
   * ]
   * ```
   */
  dependencies: IInstalledSkillRecord[];

  /**
   * Indicates if this skill was directly requested by the user
   * - `true`: User ran `skills install <skill-name>` explicitly
   * - `false`: Installed automatically as a transitive dependency
   * @example true (for user-requested installations)
   * @example false (for auto-installed dependencies)
   */
  isDirectDependency: boolean;
}

/**
 * Represents the complete lock file structure.
 *
 * The lock file (`skills-lock.json`) is a JSON file that tracks all installed skills
 * in a specific installation location (global or local). It provides:
 * - **Reproducibility**: Exact versions and Arweave TXIDs for re-installation
 * - **Auditability**: Timestamp and dependency tree for installation history
 * - **Version Management**: Schema version for future compatibility
 *
 * **File Locations:**
 * - Global: `~/.claude/skills-lock.json`
 * - Local: `.claude/skills-lock.json` (project directory)
 *
 * **Atomic Updates:**
 * Lock files are updated atomically using a write-then-rename pattern to prevent
 * corruption from interrupted writes.
 *
 * @example Empty lock file
 * ```json
 * {
 *   "lockfileVersion": 1,
 *   "generatedAt": 1704067200000,
 *   "skills": [],
 *   "installLocation": "~/.claude/skills/"
 * }
 * ```
 *
 * @example Lock file with installed skills
 * ```json
 * {
 *   "lockfileVersion": 1,
 *   "generatedAt": 1704067200000,
 *   "skills": [
 *     {
 *       "name": "ao-basics",
 *       "version": "1.0.0",
 *       "arweaveTxId": "abc123...def789",
 *       "installedAt": 1704067200000,
 *       "installedPath": "~/.claude/skills/ao-basics/",
 *       "dependencies": [],
 *       "isDirectDependency": true
 *     }
 *   ],
 *   "installLocation": "~/.claude/skills/"
 * }
 * ```
 */
export interface ILockFile {
  /**
   * Lock file schema version number
   * Current version: 1 (initial implementation in Story 3.4)
   *
   * **Version Compatibility:**
   * - Version 1: Initial schema (supports all fields defined in this interface)
   * - Future versions: May add optional fields without breaking compatibility
   *
   * **Forward Compatibility Strategy:**
   * If a lock file with `lockfileVersion > 1` is encountered, the lock file manager
   * should log a warning but attempt to read the file. This enables graceful degradation
   * when older CLI versions encounter newer lock files.
   *
   * @example 1
   */
  lockfileVersion: number;

  /**
   * Unix timestamp (milliseconds) when the lock file was last updated
   * Updated on every write operation (skill installation, update, or removal)
   * @example 1704067200000 (2024-01-01 00:00:00 UTC)
   */
  generatedAt: number;

  /**
   * Array of all installed skill records (direct and transitive dependencies)
   * Each record contains recursive dependency trees.
   * Empty array if no skills are installed.
   *
   * **Structure:**
   * - Top-level array contains all directly installed skills (`isDirectDependency: true`)
   * - Each skill's `dependencies` array contains its transitive dependencies
   * - Dependency trees can be nested to arbitrary depth
   *
   * @example
   * ```typescript
   * skills: [
   *   {
   *     name: 'advanced-skill',
   *     isDirectDependency: true,
   *     dependencies: [
   *       {
   *         name: 'ao-basics',
   *         isDirectDependency: false,
   *         dependencies: []
   *       }
   *     ]
   *   }
   * ]
   * ```
   */
  skills: IInstalledSkillRecord[];

  /**
   * Installation directory path (global or local)
   * - Global: `~/.claude/skills/`
   * - Local: `.claude/skills/` (relative to project root)
   *
   * This field indicates which installation context the lock file tracks.
   * Each installation location has its own separate lock file.
   *
   * @example '~/.claude/skills/' (global installation)
   * @example '.claude/skills/' (local/project installation)
   */
  installLocation: string;
}

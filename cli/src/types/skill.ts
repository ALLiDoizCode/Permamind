/**
 * TypeScript type definitions for Agent Skills
 *
 * This module defines core types for skill manifests, validation results,
 * and related data structures used throughout the CLI.
 */

/**
 * Skill manifest metadata extracted from SKILL.md frontmatter
 *
 * This interface represents the structured metadata that defines a skill,
 * including required identification fields and optional configuration.
 *
 * @example
 * ```typescript
 * const manifest: ISkillManifest = {
 *   name: 'ao-basics',
 *   version: '1.0.0',
 *   description: 'Foundational knowledge for AO development',
 *   author: 'Agent Skills Team',
 *   tags: ['ao', 'tutorial', 'beginner'],
 *   dependencies: ['arweave-fundamentals'],
 *   license: 'MIT'
 * };
 * ```
 */
export interface ISkillManifest {
  /**
   * Unique skill identifier
   *
   * Must contain only lowercase letters, numbers, and hyphens.
   * Length: 1-64 characters
   * Pattern: /^[a-z0-9-]+$/
   *
   * @example 'ao-basics', 'arweave-fundamentals', 'cli-development'
   */
  name: string;

  /**
   * Semantic version number
   *
   * Must follow semantic versioning format: x.y.z
   * Pattern: /^\d+\.\d+\.\d+$/
   *
   * @example '1.0.0', '2.3.15', '0.1.0'
   */
  version: string;

  /**
   * Human-readable skill description
   *
   * Maximum length: 1024 characters
   * Used for search and discovery in the registry
   *
   * @example 'Foundational knowledge for AO development including process spawning and message passing'
   */
  description: string;

  /**
   * Creator display name
   *
   * Can be an individual name, team name, or organization
   * Not required to be an Arweave address
   *
   * @example 'Agent Skills Team', 'John Doe', 'Acme Corp'
   */
  author: string;

  /**
   * Searchable category tags (optional)
   *
   * Array of strings for categorization and discovery
   * Defaults to empty array if not provided
   *
   * @example ['ao', 'tutorial', 'beginner']
   */
  tags?: string[];

  /**
   * Required skill dependencies (optional)
   *
   * Array of dependency specifications with name and version
   * Each dependency must specify both name and version for reproducibility
   * Defaults to empty array if not provided
   *
   * @example
   * [
   *   { name: 'arweave-fundamentals', version: '1.0.0' },
   *   { name: 'ao-basics', version: '2.1.0' }
   * ]
   *
   * Legacy format (string array) is also supported but deprecated:
   * ['arweave-fundamentals', 'ao-basics']
   */
  dependencies?: Array<{ name: string; version: string } | string>;

  /**
   * License identifier (optional)
   *
   * SPDX license identifier or custom license string
   *
   * @example 'MIT', 'Apache-2.0', 'GPL-3.0'
   */
  license?: string;

  /**
   * Changelog for this version (optional)
   *
   * Describes what changed in this version compared to previous versions.
   * Supports markdown formatting.
   *
   * @example
   * 'Added support for batch operations, fixed search bug, improved error messages'
   *
   * Or multi-line:
   * '## Added\n- Batch operation support\n## Fixed\n- Search bug\n- Error messages'
   */
  changelog?: string;

  /**
   * MCP server requirements (optional)
   *
   * Array of MCP server names that this skill requires for functionality.
   * Format: MCP server names with mcp__ prefix (e.g., "mcp__pixel-art", "mcp__shadcn-ui")
   * Note: Users must install MCP servers separately. This field is informational only.
   *
   * @example
   * mcpServers: ['mcp__pixel-art', 'mcp__shadcn-ui']
   */
  mcpServers?: string[];
}

/**
 * Result of manifest validation against JSON schema
 *
 * Contains validation status and detailed error messages if validation fails
 *
 * @example
 * ```typescript
 * // Success case
 * const result: ValidationResult = { valid: true };
 *
 * // Failure case
 * const result: ValidationResult = {
 *   valid: false,
 *   errors: [
 *     'Skill name contains uppercase letters → Solution: Use only lowercase letters, numbers, and hyphens',
 *     'Version format is invalid → Solution: Use semantic versioning format (x.y.z)'
 *   ]
 * };
 * ```
 */
export interface ValidationResult {
  /**
   * True if manifest passes all JSON schema validation rules
   */
  valid: boolean;

  /**
   * Array of user-friendly error messages (only present if valid=false)
   *
   * Each error follows the pattern: "Error description → Solution: ..."
   * Includes field name and specific guidance for resolution
   */
  errors?: string[];
}

/**
 * Progress information for bundle creation
 *
 * Used by the bundler's onProgress callback to report bundling status
 *
 * @example
 * ```typescript
 * const progress: BundleProgress = {
 *   current: 5,
 *   total: 10,
 *   file: 'docs/example.md'
 * };
 * ```
 */
export interface BundleProgress {
  /**
   * Number of files processed so far
   */
  current: number;

  /**
   * Total number of files to process
   */
  total: number;

  /**
   * Current file being processed (relative path)
   */
  file: string;
}

/**
 * Options for bundle creation
 *
 * All fields are optional and have sensible defaults
 *
 * @example
 * ```typescript
 * const options: BundleOptions = {
 *   compressionLevel: 9,
 *   onProgress: (progress) => console.log(`Processing ${progress.file}...`)
 * };
 * ```
 */
export interface BundleOptions {
  /**
   * Custom file filter function (optional)
   *
   * Return true to include file, false to exclude
   * Default: Excludes .git, node_modules, hidden files (except .skillsrc)
   *
   * @example
   * ```typescript
   * filter: (path) => !path.includes('test')
   * ```
   */
  filter?: (path: string) => boolean;

  /**
   * Progress callback for large bundles (optional)
   *
   * Invoked periodically during bundling to report progress
   * Used by publish command for ora spinner updates
   *
   * @example
   * ```typescript
   * onProgress: (progress) => {
   *   console.log(`${progress.current}/${progress.total}: ${progress.file}`);
   * }
   * ```
   */
  onProgress?: (progress: BundleProgress) => void;

  /**
   * Gzip compression level (0-9, optional)
   *
   * 0 = no compression (fastest)
   * 9 = maximum compression (slowest)
   * Default: 6 (balanced)
   */
  compressionLevel?: number;
}

/**
 * Result of bundle creation operation
 *
 * Contains compressed tar.gz buffer and metadata for upload to Arweave
 *
 * @example
 * ```typescript
 * const result: BundleResult = {
 *   buffer: Buffer.from(...),
 *   size: 524288,
 *   fileCount: 12,
 *   sizeFormatted: '512.0 KB',
 *   exceededLimit: false
 * };
 * ```
 */
export interface BundleResult {
  /**
   * Compressed tar.gz binary data ready for Arweave upload
   *
   * Can be passed directly to arweave-client for transaction creation
   */
  buffer: Buffer;

  /**
   * Bundle size in bytes
   *
   * Used for size validation and cost estimation
   */
  size: number;

  /**
   * Number of files included in bundle
   *
   * Useful for progress reporting and debugging
   */
  fileCount: number;

  /**
   * Human-readable size string
   *
   * @example '5.2 MB', '1.8 KB', '512 bytes'
   */
  sizeFormatted: string;

  /**
   * True if bundle size exceeds MAX_BUNDLE_SIZE (10MB)
   *
   * Warning flag - bundle creation still succeeds
   * Publish command should warn user about large bundle
   */
  exceededLimit: boolean;
}

/**
 * Options for bundle extraction
 *
 * Configures extraction behavior including target directory,
 * overwrite policy, and logging verbosity.
 *
 * @example
 * ```typescript
 * const options: IExtractionOptions = {
 *   targetDir: '/custom/path',
 *   force: true,
 *   verbose: true,
 *   local: false
 * };
 * ```
 */
export interface IExtractionOptions {
  /**
   * Custom target directory (optional)
   *
   * If not provided, installation path is determined by local flag:
   * - local=false: ~/.claude/skills/<skill-name>/ (default)
   * - local=true: .claude/skills/<skill-name>/
   */
  targetDir?: string;

  /**
   * Overwrite existing installations without prompting (optional)
   *
   * Default: false (prompt user for confirmation)
   * When true, existing directories are deleted without prompting
   */
  force?: boolean;

  /**
   * Enable detailed logging output (optional)
   *
   * Default: false (standard logging)
   * When true, logs each file extracted with relative path
   */
  verbose?: boolean;

  /**
   * Install to local project directory instead of global (optional)
   *
   * Default: false (installs to ~/.claude/skills/)
   * When true, installs to .claude/skills/ in current working directory
   */
  local?: boolean;
}

/**
 * Result of bundle extraction operation
 *
 * Contains metadata about the extraction including final installation path,
 * number of files extracted, and skill name.
 *
 * @example
 * ```typescript
 * const result: IExtractionResult = {
 *   installedPath: '/Users/joe/.claude/skills/ao-basics',
 *   filesExtracted: 42,
 *   skillName: 'ao-basics'
 * };
 * ```
 */
export interface IExtractionResult {
  /**
   * Absolute path to installed skill directory
   *
   * This is the final location where the skill was extracted
   * Contains SKILL.md and all bundled files
   *
   * @example '/Users/joe/.claude/skills/ao-basics'
   */
  installedPath: string;

  /**
   * Number of files extracted from bundle
   *
   * Useful for progress reporting and debugging
   * Includes SKILL.md and all bundled resources
   */
  filesExtracted: number;

  /**
   * Skill name extracted from SKILL.md frontmatter
   *
   * Matches the 'name' field from YAML frontmatter
   * Used to construct installation directory path
   *
   * @example 'ao-basics', 'arweave-fundamentals'
   */
  skillName: string;
}

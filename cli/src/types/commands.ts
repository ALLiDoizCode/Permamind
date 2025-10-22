/**
 * Command-related TypeScript type definitions
 * Defines interfaces for CLI command options and results
 */

/**
 * Options for the publish command
 */
export interface IPublishOptions {
  /** Custom wallet path (overrides config) */
  wallet?: string;

  /** Enable detailed logging */
  verbose?: boolean;

  /** Custom Arweave gateway URL (overrides config) */
  gateway?: string;

  /** Skip transaction confirmation polling (faster, less reliable) */
  skipConfirmation?: boolean;
}

/**
 * Result returned from successful publish operation
 */
export interface IPublishResult {
  /** Name of published skill */
  skillName: string;

  /** Version published */
  version: string;

  /** Transaction ID on Arweave */
  arweaveTxId: string;

  /** Size in bytes */
  bundleSize: number;

  /** Cost in winston */
  uploadCost: number;

  /** AO message ID for registry registration */
  registryMessageId: string;

  /** Timestamp of publication */
  publishedAt: number;
}

/**
 * Options for the install command
 */
export interface IInstallOptions {
  /** Install to ~/.claude/skills/ (default: true) */
  global?: boolean;

  /** Install to .claude/skills/ (mutually exclusive with global) */
  local?: boolean;

  /** Overwrite existing installations without confirmation */
  force?: boolean;

  /** Show detailed dependency tree and progress */
  verbose?: boolean;

  /** Skip lock file generation (for testing) */
  noLock?: boolean;
}

/**
 * Result returned from successful install operation
 */
export interface IInstallResult {
  /** Array of installed skill names with versions (e.g., ["ao-basics@1.0.0", "arweave-fundamentals@1.5.0"]) */
  installedSkills: string[];

  /** Total number of dependencies installed (excluding root skill) */
  dependencyCount: number;

  /** Total size in bytes of all installed bundles */
  totalSize: number;

  /** Total installation time in seconds */
  elapsedTime: number;
}

/**
 * Progress information during installation
 */
export interface IInstallProgress {
  /** Current installation phase (e.g., "Downloading", "Installing") */
  phase: string;

  /** Current item number being processed */
  current: number;

  /** Total number of items to process */
  total: number;

  /** Descriptive message for current progress */
  message: string;
}

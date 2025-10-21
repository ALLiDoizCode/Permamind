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

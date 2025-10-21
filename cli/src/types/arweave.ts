/**
 * Arweave-related type definitions for bundle uploads and transaction management
 *
 * This module defines TypeScript interfaces for Arweave bundle metadata,
 * upload options, upload results, and transaction status tracking.
 */

import { JWK } from './wallet.js';

/**
 * Bundle metadata for Arweave transaction tags
 *
 * Contains skill-specific metadata that will be added to the Arweave transaction
 * as tags for indexing and discovery.
 */
export interface IBundleMetadata {
  /** Skill name from SKILL.md manifest */
  skillName: string;
  /** Skill version from SKILL.md manifest (semver format) */
  skillVersion: string;
}

/**
 * Options for bundle upload operation
 *
 * Configures optional behavior during Arweave bundle upload, including
 * progress tracking and custom gateway selection.
 */
export interface IUploadOptions {
  /** Optional callback for upload progress tracking (0-100 percent) */
  progressCallback?: (percent: number) => void;
  /** Custom Arweave gateway URL (overrides config, must be HTTPS) */
  gatewayUrl?: string;
}

/**
 * Result of a successful bundle upload to Arweave
 *
 * Contains the transaction ID, upload size, and estimated cost for
 * verifying and tracking the uploaded bundle.
 */
export interface IUploadResult {
  /** 43-character Arweave transaction ID (base64url-encoded) */
  txId: string;
  /** Size of uploaded bundle in bytes */
  uploadSize: number;
  /** Estimated cost in winston (1 AR = 1,000,000,000,000 winston) */
  cost: number;
}

/**
 * Transaction status on Arweave network
 *
 * Represents the current state of a transaction in the Arweave network:
 * - pending: Transaction submitted but not yet included in a block
 * - confirming: Transaction included in a block, awaiting confirmations
 * - confirmed: Transaction finalized (typically 2-5 minutes after submission)
 * - failed: Transaction rejected or failed validation
 */
export type TransactionStatus = 'pending' | 'confirming' | 'confirmed' | 'failed';

/**
 * Arweave transaction tag structure
 *
 * Key-value pairs attached to Arweave transactions for metadata and indexing.
 * Used for App-Name, Content-Type, Skill-Name, and Skill-Version tags.
 */
export interface ITag {
  /** Tag name (e.g., "App-Name", "Content-Type") */
  name: string;
  /** Tag value (e.g., "Agent-Skills-Registry", "application/x-tar+gzip") */
  value: string;
}

// Re-export JWK type for convenience
export type { JWK };

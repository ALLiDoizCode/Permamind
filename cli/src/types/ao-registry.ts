/**
 * TypeScript type definitions for AO Registry interactions
 * Defines interfaces for AO process messages and registry metadata
 */

/**
 * Complete skill metadata stored in AO registry
 * Extends ISkillManifest with registry-specific fields
 */
export interface ISkillMetadata {
  /** Unique skill identifier (e.g., "ao-basics") */
  name: string;

  /** Semantic version (e.g., "1.0.0") */
  version: string;

  /** Human-readable skill purpose (max 1024 chars) */
  description: string;

  /** Skill creator identifier (display name) */
  author: string;

  /** Arweave address (43-char) from msg.From (immutable after registration) */
  owner: string;

  /** Searchable category tags */
  tags: string[];

  /** Array of required skill names */
  dependencies: string[];

  /** 43-character Arweave transaction ID */
  arweaveTxId: string;

  /** Optional license identifier */
  license?: string;

  /** Unix timestamp */
  publishedAt: number;

  /** Unix timestamp */
  updatedAt: number;
}

/**
 * Message tags for Register-Skill action
 * Sent to AO registry process to register or update a skill
 */
export interface IRegisterSkillMessage {
  /** Always "Register-Skill" */
  Action: string;

  /** Skill name */
  Name: string;

  /** Version string */
  Version: string;

  /** Skill description */
  Description: string;

  /** Author identifier */
  Author: string;

  /** JSON array of tags (must stringify) */
  Tags: string;

  /** Bundle transaction ID on Arweave */
  ArweaveTxId: string;

  /** JSON array of dependency names (must stringify) */
  Dependencies: string;
}

/**
 * ADP v1.0 compliant registry information
 * Returned from Info handler for self-documentation
 */
export interface IRegistryInfo {
  /** Process metadata */
  process: {
    /** Process name */
    name: string;

    /** Process version */
    version: string;

    /** ADP protocol version */
    adpVersion: string;

    /** List of supported operations */
    capabilities: string[];

    /** Message schema definitions */
    messageSchemas: Record<string, unknown>;
  };

  /** List of available handlers */
  handlers: string[];

  /** Documentation metadata */
  documentation: {
    /** ADP compliance version */
    adpCompliance: string;

    /** Self-documenting flag */
    selfDocumenting: boolean;
  };
}


/**
 * Result from AO registry dryrun query
 */
export interface IAODryrunResult {
  /** Response messages from AO process */
  Messages: Array<{
    /** Message data (usually JSON) */
    Data: string;

    /** Message tags */
    Tags?: Array<{ name: string; value: string }>;
  }>;
}

/**
 * Type exports for agent-skills-registry CLI
 *
 * Central export point for all type definitions used across the CLI codebase.
 */

// Wallet types
export type { JWK, WalletLoadOptions, WalletInfo, IWalletProvider, DataItemSigner } from './wallet.js';

// Error types
export * from './errors.js';

// Skill types
export * from './skill.js';

// Lock file types
export * from './lock-file.js';

// Command types
export * from './commands.js';

// AO Registry types
export * from './ao-registry.js';

// Dependency types
export * from './dependency.js';

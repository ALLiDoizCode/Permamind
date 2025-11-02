// AO Message types
export interface AOTag {
  name: string;
  value: string;
}

export interface AOMessage {
  Target: string;
  Data: string;
  Tags: AOTag[];
}

export interface AODryrunResult {
  Messages: AOMessage[];
  Spawns: unknown[];
  Output: unknown[];
  Error?: string;
}

// Registry-specific types
export interface BundledFile {
  name: string;
  icon: string;
  type: 'markdown' | 'python' | 'javascript' | 'script';
  size: string;
  description: string;
  level: 'Level 2' | 'Level 3';
  preview: string;
  path?: string; // Optional for backward compatibility
}

export interface Dependency {
  name: string;
  version: string;
}

export interface SkillMetadata {
  name: string;
  version: string;
  description: string;
  author: string;
  owner: string;
  tags: string[];
  dependencies: (string | Dependency)[];
  arweaveTxId: string;
  license?: string;
  publishedAt: number;
  updatedAt: number;
  downloads?: number;
  bundledFiles?: BundledFile[];
  category?: string;
}

export interface PaginatedSkills {
  skills: SkillMetadata[];
  total: number;
  limit: number;
  offset: number;
}

export interface VersionInfo {
  version: string;
  publishedAt: number;
  arweaveTxId: string;
}

export interface ListSkillsOptions extends Record<string, unknown> {
  limit?: number;
  offset?: number;
  filterTags?: string[];
  filterName?: string;
  featured?: boolean;
}

export interface RegistryInfo {
  processId: string;
  adpVersion: string;
  handlers: string[];
  totalSkills: number;
}

export interface DownloadStats {
  totalSkills?: number; // Only for Scope=all
  downloads7Days: number; // Past 7 days
  downloads30Days: number; // Past 30 days
  downloadsTotal: number; // All-time
  skillName?: string; // Only for per-skill queries
}

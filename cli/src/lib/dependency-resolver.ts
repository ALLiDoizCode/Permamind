/**
 * Dependency Resolution Engine
 *
 * Resolves skill dependencies recursively, building a complete dependency tree
 * with support for:
 * - Circular dependency detection
 * - Depth limit enforcement (10 levels max)
 * - Already-installed dependency tracking
 * - Performance optimization with caching
 * - Verbose logging and visualization
 *
 * @module lib/dependency-resolver
 */

import {
  IDependencyTree,
  IDependencyNode,
  IResolverOptions,
} from '../types/dependency.js';
import { ISkillMetadata } from '../types/ao-registry.js';
import { DependencyError } from '../types/errors.js';
import { getSkill } from '../clients/ao-registry-client.js';
import { detectCircular } from './circular-detector.js';
import logger from '../utils/logger.js';

// Constants
const DEFAULT_MAX_DEPTH = 10;
const DEFAULT_SKIP_INSTALLED = true;
const DEFAULT_VERBOSE = false;
const LRU_CACHE_MAX_SIZE = 100; // Maximum number of cached dependency trees

/**
 * LRU Cache entry with timestamp for age tracking
 */
interface CacheEntry {
  metadata: ISkillMetadata | null;
  timestamp: number;
}

/**
 * Performance optimization: LRU cache for resolved skill metadata
 * Persists across multiple resolve() calls to avoid redundant network requests
 * Cache entries never expire (only evicted when cache is full via LRU)
 */
const persistentCache = new Map<string, CacheEntry>();

/**
 * Performance optimization: cache for skill metadata promises during resolution
 * Caches promises to deduplicate concurrent requests for the same skill
 * Cache is cleared after each resolution operation
 */
const metadataCache = new Map<string, Promise<ISkillMetadata | null>>();

/**
 * Resolves complete dependency tree for a skill
 *
 * Builds a recursive dependency tree starting from the root skill,
 * enforces depth limits, detects circular dependencies, and tracks
 * already-installed skills.
 *
 * @param skillName - Name of the skill to resolve dependencies for
 * @param options - Resolution options (maxDepth, skipInstalled, verbose)
 * @returns Complete dependency tree with metadata
 * @throws {DependencyError} If skill not found, depth exceeded, or circular dependency
 *
 * @example
 * ```typescript
 * const tree = await resolve('example-skill', {
 *   maxDepth: 10,
 *   skipInstalled: true,
 *   verbose: true
 * });
 *
 * console.log(`Total dependencies: ${tree.totalCount}`);
 * console.log(`Already installed: ${tree.installedCount}`);
 * console.log(`Max depth: ${tree.maxDepth}`);
 * ```
 */
export async function resolve(
  skillName: string,
  options?: IResolverOptions
): Promise<IDependencyTree> {
  const opts = {
    maxDepth: options?.maxDepth ?? DEFAULT_MAX_DEPTH,
    skipInstalled: options?.skipInstalled ?? DEFAULT_SKIP_INSTALLED,
    verbose: options?.verbose ?? DEFAULT_VERBOSE,
  };

  if (opts.verbose) {
    logger.info(`Starting dependency resolution for '${skillName}'`);
  }

  // Clear cache and visiting nodes before each resolution
  metadataCache.clear();
  visitingNodes.clear();

  const startTime = Date.now();

  // Build dependency tree recursively
  const root = await buildDependencyNode(skillName, 0, [], opts);

  // Build flat list for quick access
  const flatList: IDependencyNode[] = [];
  let maxDepth = 0;
  let installedCount = 0;

  flattenTree(root, flatList, (node) => {
    if (node.depth > maxDepth) {
      maxDepth = node.depth;
    }
    if (node.isInstalled) {
      installedCount++;
    }
  });

  const tree: IDependencyTree = {
    root,
    flatList,
    maxDepth,
    totalCount: flatList.length,
    installedCount,
  };

  if (opts.verbose) {
    logger.info(
      `Dependency tree built: ${tree.totalCount} total dependencies (${tree.installedCount} already installed)`
    );
  }

  // Check for circular dependencies
  if (opts.verbose) {
    logger.info('Checking for circular dependencies...');
  }

  const cycles = detectCircular(tree);

  if (cycles.length > 0) {
    // Build detailed error message with all cycles
    const cycleDescriptions = cycles.map((c) => `  - ${c.description}`).join('\n');
    throw new DependencyError(
      `Circular dependency detected:\n${cycleDescriptions}\n→ Solution: Remove circular dependencies from skill manifests`,
      cycles[0].path[0],
      cycles[0].path
    );
  }

  if (opts.verbose) {
    logger.info('No circular dependencies detected');
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info(`Resolution completed in ${duration} seconds`);
  }

  return tree;
}

/**
 * Cycle detection tracking: stores currently visiting nodes
 * Used to detect circular dependencies early during tree building
 */
const visitingNodes = new Set<string>();

/**
 * Recursively builds a dependency node and its children
 *
 * Fetches skill metadata from registry, checks if already installed,
 * and recursively processes dependencies.
 *
 * @param skillName - Skill name to build node for
 * @param depth - Current depth in tree (0 = root)
 * @param path - Current path from root (for error messages)
 * @param options - Resolution options
 * @returns Complete dependency node with children
 * @throws {DependencyError} If skill not found or depth limit exceeded
 */
async function buildDependencyNode(
  skillName: string,
  depth: number,
  path: string[],
  options: Required<IResolverOptions>
): Promise<IDependencyNode> {
  // Early cycle detection: check if we're currently visiting this node
  if (visitingNodes.has(skillName)) {
    const fullPath = [...path, skillName];
    throw new DependencyError(
      `Circular dependency detected: ${fullPath.join('→')}\n→ Solution: Remove circular dependencies from skill manifests`,
      skillName,
      fullPath
    );
  }

  // Check depth limit
  if (depth > options.maxDepth) {
    const fullPath = [...path, skillName];
    throw new DependencyError(
      `Dependency depth limit exceeded (max: ${options.maxDepth} levels)\n→ Solution: Reduce dependency nesting or check for circular dependencies\n→ Path: ${fullPath.join('→')}`,
      skillName,
      fullPath
    );
  }

  if (options.verbose) {
    logger.debug(`Fetching metadata for '${skillName}'`, { depth });
  }

  // Check persistent LRU cache first
  const cached = persistentCache.get(skillName);
  let metadata: ISkillMetadata | null;

  if (cached) {
    // Cache hit - return cached metadata
    metadata = cached.metadata;

    // Update LRU order by deleting and re-adding (moves to end of Map)
    persistentCache.delete(skillName);
    persistentCache.set(skillName, { metadata, timestamp: Date.now() });

    if (options.verbose) {
      logger.debug(`Cache hit for '${skillName}'`, { depth });
    }
  } else {
    // Cache miss - fetch from network

    // Check promise cache for concurrent request deduplication
    let metadataPromise = metadataCache.get(skillName);

    // Fetch from registry if not in promise cache
    if (!metadataPromise) {
      // Create and cache the promise immediately (before awaiting)
      // This ensures concurrent requests share the same promise
      metadataPromise = getSkill(skillName);
      metadataCache.set(skillName, metadataPromise);
    }

    // Await the (possibly shared) promise
    metadata = await metadataPromise;

    // Add small delay to avoid CU gateway rate limiting
    // Only delay for non-cached queries to avoid hitting rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Add to persistent cache
    persistentCache.set(skillName, { metadata, timestamp: Date.now() });

    // LRU eviction: if cache exceeds max size, evict oldest entry
    if (persistentCache.size > LRU_CACHE_MAX_SIZE) {
      const firstKey = persistentCache.keys().next().value as string;
      if (firstKey) {
        persistentCache.delete(firstKey);

        if (options.verbose) {
          logger.debug(`LRU cache eviction: removed '${firstKey}'`);
        }
      }
    }

    if (options.verbose) {
      logger.debug(`Cache miss for '${skillName}' - fetched from network`, { depth });
    }
  }

  if (!metadata) {
    const fullPath = [...path, skillName];
    const pathDescription = fullPath.length > 1 ? `\n→ Required by: ${fullPath.slice(0, -1).join('→')}` : '';
    throw new DependencyError(
      `Dependency '${skillName}' not found in registry\n→ Solution: Verify the skill name and ensure it has been published${pathDescription}`,
      skillName,
      fullPath
    );
  }

  // TODO: Check if already installed (Story 3.4 - Lock File Manager integration)
  // When lock-file-manager is available:
  // const lockFile = await lockFileManager.read(lockFilePath);
  // const installedRecord = lockFile.skills.find(s => s.name === skillName && s.version === metadata.version);
  // const isInstalled = !!installedRecord && options.skipInstalled;
  // const installPath = installedRecord?.installedPath;

  const isInstalled = false; // Temporary - will check lock file in Story 3.4
  const installPath = undefined; // Temporary - will get from lock file in Story 3.4

  if (isInstalled && options.verbose) {
    logger.warn(`Dependency '${skillName}@${metadata.version}' already installed - skipping`);
  }

  // Build node
  const node: IDependencyNode = {
    name: metadata.name,
    version: metadata.version,
    arweaveTxId: metadata.arweaveTxId,
    dependencies: [],
    depth,
    isInstalled,
    installPath,
  };

  // Skip recursive dependency traversal if already installed
  if (isInstalled && options.skipInstalled) {
    return node;
  }

  // Mark node as currently visiting (for cycle detection)
  visitingNodes.add(skillName);

  try {
    // Recursively process dependencies
    const dependencies = metadata.dependencies || [];

    if (dependencies.length > 0 && options.verbose) {
      const depDescriptions = dependencies.map(dep =>
        typeof dep === 'string' ? dep : `${dep.name}@${dep.version}`
      );
      logger.debug(`Found ${dependencies.length} dependencies: [${depDescriptions.join(', ')}]`, { skillName });
    }

    // Process dependencies (using Promise.all for performance)
    const newPath = [...path, skillName];
    const depNodes = await Promise.all(
      dependencies.map((dep: string | { name: string; version: string }) => {
        // Extract dependency name (support both string and object format)
        const depName = typeof dep === 'string' ? dep : dep.name;
        // TODO: Version checking will be implemented when we fetch dependencies
        // For now, we just resolve by name and trust the registry has the right version
        return buildDependencyNode(depName, depth + 1, newPath, options);
      })
    );

    node.dependencies = depNodes;

    return node;
  } finally {
    // Unmark node when done visiting (clean up)
    visitingNodes.delete(skillName);
  }
}

/**
 * Flattens dependency tree into array
 *
 * Performs recursive traversal to build flat list while
 * optionally applying visitor function to each node.
 *
 * @param node - Root node to flatten
 * @param flatList - Array to accumulate nodes (mutated)
 * @param visitor - Optional function to apply to each node
 */
function flattenTree(
  node: IDependencyNode,
  flatList: IDependencyNode[],
  visitor?: (node: IDependencyNode) => void
): void {
  flatList.push(node);

  if (visitor) {
    visitor(node);
  }

  for (const dep of node.dependencies) {
    flattenTree(dep, flatList, visitor);
  }
}

/**
 * Clear the persistent LRU cache of dependency metadata
 *
 * Useful for testing or when fresh data is required.
 * This function is exported for use in testing and administrative operations.
 *
 * @example
 * ```typescript
 * clearDependencyCache(); // Clear all cached dependency metadata
 * ```
 */
export function clearDependencyCache(): void {
  persistentCache.clear();
  logger.debug('Dependency cache cleared', {
    cacheSize: 0,
  });
}

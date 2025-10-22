/**
 * Dependency resolution data structures for Agent Skills Registry
 *
 * These types define the dependency tree structure used during skill installation.
 * The resolver builds a tree of dependencies, detects circular references, and
 * determines the correct installation order using topological sorting.
 *
 * @module types/dependency
 */

/**
 * Represents a single node in the dependency tree
 *
 * Each node corresponds to a skill and its dependencies. The tree is built
 * recursively starting from the root skill being installed.
 *
 * @example
 * ```typescript
 * const node: IDependencyNode = {
 *   name: 'example-skill',
 *   version: '1.0.0',
 *   arweaveTxId: 'abc123...',
 *   dependencies: [
 *     { name: 'dep-a', version: '2.0.0', ... }
 *   ],
 *   depth: 0,
 *   isInstalled: false
 * };
 * ```
 */
export interface IDependencyNode {
  /** Skill name (unique identifier) */
  name: string;

  /** Skill version (semantic version) */
  version: string;

  /** Arweave transaction ID for the skill bundle */
  arweaveTxId: string;

  /** Child dependencies (recursive structure) */
  dependencies: IDependencyNode[];

  /** Depth in the dependency tree (0 = root skill) */
  depth: number;

  /** True if this skill is already installed (from lock file) */
  isInstalled: boolean;

  /** Local file system path if already installed */
  installPath?: string;
}

/**
 * Complete dependency tree structure
 *
 * Contains the root node and metadata about the entire tree. The flatList
 * provides quick access to all nodes without recursive traversal.
 *
 * @example
 * ```typescript
 * const tree: IDependencyTree = {
 *   root: rootNode,
 *   flatList: [rootNode, ...allDependencies],
 *   maxDepth: 3,
 *   totalCount: 10,
 *   installedCount: 2
 * };
 * ```
 */
export interface IDependencyTree {
  /** Root skill being installed */
  root: IDependencyNode;

  /** Flattened array of all nodes in the tree */
  flatList: IDependencyNode[];

  /** Maximum depth in the tree (for depth limit checking) */
  maxDepth: number;

  /** Total number of dependencies in the tree */
  totalCount: number;

  /** Number of dependencies already installed */
  installedCount: number;
}

/**
 * Options for dependency resolution
 *
 * Controls the behavior of the dependency resolver, including depth limits,
 * skipping installed dependencies, and verbose logging.
 *
 * @example
 * ```typescript
 * const options: IResolverOptions = {
 *   maxDepth: 10,
 *   skipInstalled: true,
 *   verbose: false
 * };
 * ```
 */
export interface IResolverOptions {
  /** Maximum depth limit (default: 10) */
  maxDepth?: number;

  /** Skip already-installed dependencies (default: true) */
  skipInstalled?: boolean;

  /** Enable detailed logging (default: false) */
  verbose?: boolean;
}

/**
 * Represents a circular dependency in the tree
 *
 * Circular dependencies are detected using DFS with three-color marking.
 * Each cycle includes the path of skill names forming the loop.
 *
 * @example
 * ```typescript
 * const cycle: ICircularDependency = {
 *   path: ['skill-a', 'skill-b', 'skill-c', 'skill-a'],
 *   description: 'skill-a→skill-b→skill-c→skill-a'
 * };
 * ```
 */
export interface ICircularDependency {
  /** Array of skill names forming the circular path */
  path: string[];

  /** Human-readable description of the cycle (e.g., "A→B→C→A") */
  description: string;
}

/**
 * Node color for circular dependency detection
 *
 * Uses three-color marking for DFS-based cycle detection:
 * - WHITE: Unvisited node
 * - GRAY: Currently visiting (in recursion stack) - indicates potential cycle
 * - BLACK: Fully processed (all descendants visited)
 *
 * @example
 * ```typescript
 * const colors = new Map<string, NodeColor>();
 * colors.set('skill-a', NodeColor.WHITE);
 * colors.set('skill-b', NodeColor.GRAY); // Currently visiting
 * colors.set('skill-c', NodeColor.BLACK); // Fully processed
 * ```
 */
export enum NodeColor {
  /** Unvisited node */
  WHITE = 0,

  /** Currently visiting (in recursion stack) */
  GRAY = 1,

  /** Fully processed (all descendants visited) */
  BLACK = 2,
}

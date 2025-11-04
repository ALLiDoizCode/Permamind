/**
 * Dependency Tree Visualization Utility
 *
 * Generates ASCII tree visualization of dependency structures for verbose mode output.
 * Uses box-drawing characters to create clear hierarchical representations.
 *
 * @module utils/dependency-visualizer
 */

import { IDependencyTree, IDependencyNode } from '../types/dependency.js';

/**
 * Generates ASCII tree visualization of dependency structure
 *
 * Creates a human-readable tree representation with:
 * - Box-drawing characters (├──, └──, │) for structure
 * - Depth indicators for each node
 * - ✓ symbol for already-installed dependencies
 * - Skill name and version for each node
 *
 * @param tree - Complete dependency tree to visualize
 * @returns Formatted ASCII tree string
 *
 * @example
 * ```typescript
 * const tree: IDependencyTree = buildTree(rootSkill);
 * const visualization = visualize(tree);
 * console.log(visualization);
 * // Output:
 * // skill-root@1.0.0
 * // ├── dependency-a@2.1.0 ✓ (depth: 1)
 * // │   └── sub-dependency@1.5.0 (depth: 2)
 * // └── dependency-b@3.0.0 (depth: 1)
 * //     ├── shared-dep@1.0.0 (depth: 2)
 * //     └── another-dep@2.0.0 ✓ (depth: 2)
 * ```
 */
export function visualize(tree: IDependencyTree): string {
  if (!tree || !tree.root) {
    return '';
  }

  const lines: string[] = [];

  // Add root node
  const rootLine = formatNode(tree.root, 0, '');
  lines.push(rootLine);

  // Recursively add children
  visualizeNode(tree.root, '', lines);

  return lines.join('\n');
}

/**
 * Recursively visualizes a node and its children
 *
 * Uses different prefixes for tree structure visualization:
 * - '├── ' for intermediate children
 * - '└── ' for last child
 * - '│   ' for continuing branch
 * - '    ' for completed branch
 *
 * @param node - Current node to visualize
 * @param prefix - Accumulated prefix for indentation
 * @param lines - Array of output lines (mutated)
 */
function visualizeNode(
  node: IDependencyNode,
  prefix: string,
  lines: string[]
): void {
  const deps = node.dependencies;

  for (let i = 0; i < deps.length; i++) {
    const dep = deps[i];
    const isLast = i === deps.length - 1;

    // Choose connector based on position
    const connector = isLast ? '└── ' : '├── ';
    const line = prefix + connector + formatNode(dep, dep.depth, '');
    lines.push(line);

    // Build prefix for children
    const childPrefix = prefix + (isLast ? '    ' : '│   ');

    // Recursively visualize children
    visualizeNode(dep, childPrefix, lines);
  }
}

/**
 * Formats a single node for display
 *
 * Includes skill name, version, installed status, and depth indicator.
 *
 * @param node - Node to format
 * @param depth - Depth in tree
 * @param prefix - Any additional prefix
 * @returns Formatted node string
 */
function formatNode(
  node: IDependencyNode,
  depth: number,
  prefix: string
): string {
  const installedMark = node.isInstalled ? ' ✓' : '';
  const depthInfo = depth > 0 ? ` (depth: ${depth})` : '';

  return `${prefix}${node.name}@${node.version}${installedMark}${depthInfo}`;
}

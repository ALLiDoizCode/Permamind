/**
 * Circular Dependency Detection Module
 *
 * Implements DFS-based cycle detection using three-color marking algorithm.
 * Detects circular dependencies in the skill dependency tree to prevent
 * infinite loops during installation.
 *
 * Algorithm: Depth-First Search with Three-Color Marking
 * - WHITE (0): Unvisited node
 * - GRAY (1): Currently visiting (in recursion stack) - indicates potential cycle
 * - BLACK (2): Fully processed (all descendants visited)
 *
 * Time Complexity: O(V + E) where V = nodes, E = edges
 * Space Complexity: O(V) for color map and recursion stack
 *
 * @module lib/circular-detector
 */

import {
  IDependencyTree,
  IDependencyNode,
  ICircularDependency,
  NodeColor,
} from '../types/dependency';

/**
 * Detects circular dependencies in a dependency tree
 *
 * Uses DFS with three-color marking to identify back edges (cycles).
 * A back edge exists when a GRAY node is encountered during traversal,
 * indicating the current path has returned to a node already in the
 * recursion stack.
 *
 * @param tree - Complete dependency tree to analyze
 * @returns Array of circular dependency paths found (empty if no cycles)
 *
 * @example
 * ```typescript
 * const tree: IDependencyTree = buildTree(rootSkill);
 * const cycles = detectCircular(tree);
 *
 * if (cycles.length > 0) {
 *   // cycles = [{ path: ['A', 'B', 'C', 'A'], description: 'A→B→C→A' }]
 *   console.error('Circular dependencies detected:', cycles);
 * }
 * ```
 */
export function detectCircular(tree: IDependencyTree): ICircularDependency[] {
  const colors = new Map<string, NodeColor>();
  const cycles: ICircularDependency[] = [];

  // Initialize all nodes as WHITE (unvisited)
  for (const node of tree.flatList) {
    const key = getNodeKey(node);
    colors.set(key, NodeColor.WHITE);
  }

  // Start DFS from root node
  const path: string[] = [];
  detectCircularDFS(tree.root, colors, path, cycles);

  return cycles;
}

/**
 * Recursive DFS helper for cycle detection
 *
 * Marks nodes with colors during traversal:
 * - WHITE → GRAY when first visiting (entering recursion)
 * - GRAY → BLACK when fully processed (exiting recursion)
 * - Cycle detected if GRAY node encountered (back edge)
 *
 * @param node - Current node being visited
 * @param colors - Map of node keys to their current color
 * @param path - Current path from root (for cycle path reconstruction)
 * @param cycles - Array to accumulate detected cycles
 */
function detectCircularDFS(
  node: IDependencyNode,
  colors: Map<string, NodeColor>,
  path: string[],
  cycles: ICircularDependency[]
): void {
  const nodeKey = getNodeKey(node);

  // Mark node as currently visiting (GRAY)
  colors.set(nodeKey, NodeColor.GRAY);
  path.push(node.name);

  // Visit all dependencies
  for (const dep of node.dependencies) {
    const depKey = getNodeKey(dep);
    const color = colors.get(depKey) || NodeColor.WHITE;

    if (color === NodeColor.GRAY) {
      // Back edge found - circular dependency detected!
      // Reconstruct the cycle path from where it starts
      const cycleStart = path.indexOf(dep.name);
      const cyclePath = [...path.slice(cycleStart), dep.name];

      cycles.push({
        path: cyclePath,
        description: cyclePath.join('→'),
      });
    } else if (color === NodeColor.WHITE) {
      // Unvisited node - continue DFS recursively
      detectCircularDFS(dep, colors, path, cycles);
    }
    // If BLACK, skip (already fully processed, no cycle possible)
  }

  // Mark node as fully processed (BLACK)
  path.pop();
  colors.set(nodeKey, NodeColor.BLACK);
}

/**
 * Generates unique key for a dependency node
 *
 * Combines name and version to handle cases where the same skill
 * appears with different versions in the tree (not a cycle).
 *
 * @param node - Dependency node
 * @returns Unique key in format "name@version"
 */
function getNodeKey(node: IDependencyNode): string {
  return `${node.name}@${node.version}`;
}

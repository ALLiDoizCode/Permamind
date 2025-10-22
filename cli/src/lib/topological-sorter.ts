/**
 * Topological Sorting Module
 *
 * Implements Kahn's algorithm for topological sorting of dependency trees.
 * Produces correct installation order where all dependencies are installed
 * before their dependents.
 *
 * Algorithm: Kahn's Algorithm (BFS-based)
 * 1. Calculate in-degree (number of incoming edges) for each node
 * 2. Start with nodes that have zero in-degree (no dependencies)
 * 3. Remove each zero-degree node and decrease in-degree of neighbors
 * 4. Repeat until all nodes processed
 *
 * Time Complexity: O(V + E) where V = nodes, E = edges
 * Space Complexity: O(V) for in-degree map and adjacency list
 *
 * @module lib/topological-sorter
 */

import { IDependencyTree, IDependencyNode } from '../types/dependency';
import { DependencyError } from '../types/errors';

/**
 * Performs topological sort on dependency tree
 *
 * Returns skills in installation order where dependencies come before dependents.
 * For example, if A depends on B, the result will have B before A.
 *
 * Throws DependencyError if a cycle is detected (should never happen after
 * circular dependency detection runs first).
 *
 * @param tree - Complete dependency tree to sort
 * @returns Array of skill names in correct installation order
 *
 * @example
 * ```typescript
 * // Given tree: A→B, A→C, B→D, C→D
 * const tree: IDependencyTree = buildTree(rootSkill);
 * const order = topologicalSort(tree);
 * // Result: ['D', 'B', 'C', 'A'] or ['D', 'C', 'B', 'A']
 * // (both valid - D must come first, A must come last)
 * ```
 */
export function topologicalSort(tree: IDependencyTree): string[] {
  // Calculate in-degree for each node
  const inDegree = new Map<string, number>();
  const adjList = new Map<string, string[]>();
  const nodeMap = new Map<string, IDependencyNode>();

  // Initialize data structures
  for (const node of tree.flatList) {
    const key = getNodeKey(node);
    inDegree.set(key, 0);
    adjList.set(key, []);
    nodeMap.set(key, node);
  }

  // Build adjacency list and calculate in-degrees
  // Note: We reverse the edges - if A depends on B, we add edge B→A
  // This way, when we process B, we can decrement A's in-degree
  for (const node of tree.flatList) {
    const nodeKey = getNodeKey(node);

    for (const dep of node.dependencies) {
      const depKey = getNodeKey(dep);

      // Add edge: dependency → dependent
      adjList.get(depKey)?.push(nodeKey);

      // Increment in-degree of dependent
      inDegree.set(nodeKey, (inDegree.get(nodeKey) || 0) + 1);
    }
  }

  // Queue for nodes with zero in-degree (no dependencies)
  const queue: string[] = [];
  for (const [key, degree] of inDegree) {
    if (degree === 0) {
      queue.push(key);
    }
  }

  // Process nodes in topological order
  const result: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);

    // Decrease in-degree of all neighbors (dependents)
    for (const neighbor of adjList.get(current) || []) {
      const newDegree = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDegree);

      // If neighbor now has zero in-degree, add to queue
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  // Check if all nodes were processed (no cycles)
  if (result.length !== tree.flatList.length) {
    throw new DependencyError(
      'Topological sort failed - cycle detected → Solution: Run circular dependency detection before topological sort',
      'unknown',
      []
    );
  }

  // Extract skill names from keys (remove version)
  return result.map((key) => {
    const node = nodeMap.get(key);
    return node ? node.name : key.split('@')[0];
  });
}

/**
 * Generates unique key for a dependency node
 *
 * Combines name and version to handle cases where the same skill
 * appears with different versions in the tree.
 *
 * @param node - Dependency node
 * @returns Unique key in format "name@version"
 */
function getNodeKey(node: IDependencyNode): string {
  return `${node.name}@${node.version}`;
}

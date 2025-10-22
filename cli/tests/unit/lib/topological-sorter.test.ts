/**
 * Unit tests for Topological Sorting Module
 *
 * Tests Kahn's algorithm for correct installation order.
 */

import { topologicalSort } from '../../../src/lib/topological-sorter';
import {
  IDependencyTree,
  IDependencyNode,
} from '../../../src/types/dependency';
import { DependencyError } from '../../../src/types/errors';

/**
 * Helper function to build test dependency tree
 * Handles circular references and shared dependencies by tracking visited nodes
 */
function buildTree(root: IDependencyNode): IDependencyTree {
  const flatList: IDependencyNode[] = [];
  const visited = new Set<string>();

  function getNodeKey(node: IDependencyNode): string {
    return `${node.name}@${node.version}`;
  }

  function flatten(node: IDependencyNode): void {
    const key = getNodeKey(node);
    if (visited.has(key)) {
      return; // Already visited, avoid duplicates
    }

    visited.add(key);
    flatList.push(node);

    for (const dep of node.dependencies) {
      flatten(dep);
    }
  }

  flatten(root);

  return {
    root,
    flatList,
    maxDepth: Math.max(...flatList.map((n) => n.depth)),
    totalCount: flatList.length,
    installedCount: flatList.filter((n) => n.isInstalled).length,
  };
}

/**
 * Helper function to create dependency node
 */
function createNode(
  name: string,
  version: string,
  depth: number,
  dependencies: IDependencyNode[] = []
): IDependencyNode {
  return {
    name,
    version,
    arweaveTxId: `tx_${name}`,
    dependencies,
    depth,
    isInstalled: false,
  };
}

describe('Topological Sorting', () => {
  describe('topologicalSort', () => {
    it('should sort linear chain (A→B→C→D) as [D, C, B, A]', () => {
      const nodeD = createNode('skill-d', '1.0.0', 3);
      const nodeC = createNode('skill-c', '1.0.0', 2, [nodeD]);
      const nodeB = createNode('skill-b', '1.0.0', 1, [nodeC]);
      const nodeA = createNode('skill-a', '1.0.0', 0, [nodeB]);

      const tree = buildTree(nodeA);
      const order = topologicalSort(tree);

      // D must come first (no dependencies)
      // A must come last (depends on everything)
      expect(order.indexOf('skill-d')).toBeLessThan(order.indexOf('skill-c'));
      expect(order.indexOf('skill-c')).toBeLessThan(order.indexOf('skill-b'));
      expect(order.indexOf('skill-b')).toBeLessThan(order.indexOf('skill-a'));
    });

    it('should sort diamond (A→B, A→C, B→D, C→D) with D before B/C and B/C before A', () => {
      const nodeD = createNode('skill-d', '1.0.0', 2);
      const nodeB = createNode('skill-b', '1.0.0', 1, [nodeD]);
      const nodeC = createNode('skill-c', '1.0.0', 1, [nodeD]);
      const nodeA = createNode('skill-a', '1.0.0', 0, [nodeB, nodeC]);

      const tree = buildTree(nodeA);
      const order = topologicalSort(tree);

      // D has no dependencies, must come first
      expect(order[0]).toBe('skill-d');

      // A depends on everything, must come last
      expect(order[order.length - 1]).toBe('skill-a');

      // B and C must come after D and before A
      const bIndex = order.indexOf('skill-b');
      const cIndex = order.indexOf('skill-c');
      const dIndex = order.indexOf('skill-d');
      const aIndex = order.indexOf('skill-a');

      expect(bIndex).toBeGreaterThan(dIndex);
      expect(cIndex).toBeGreaterThan(dIndex);
      expect(aIndex).toBeGreaterThan(bIndex);
      expect(aIndex).toBeGreaterThan(cIndex);
    });

    it('should sort multiple roots (A→C, B→C, C→D) correctly', () => {
      const nodeD = createNode('skill-d', '1.0.0', 2);
      const nodeC = createNode('skill-c', '1.0.0', 1, [nodeD]);
      const nodeA = createNode('skill-a', '1.0.0', 0, [nodeC]);
      const nodeB = createNode('skill-b', '1.0.0', 0, [nodeC]);

      // Build tree from A (B won't be included since it's not a dependency of A)
      // For this test, we need to manually build a tree with multiple roots
      const tree: IDependencyTree = {
        root: nodeA,
        flatList: [nodeA, nodeB, nodeC, nodeD],
        maxDepth: 2,
        totalCount: 4,
        installedCount: 0,
      };

      const order = topologicalSort(tree);

      // D must come first (no dependencies)
      expect(order[0]).toBe('skill-d');

      // C must come before A and B
      const cIndex = order.indexOf('skill-c');
      const aIndex = order.indexOf('skill-a');
      const bIndex = order.indexOf('skill-b');

      expect(cIndex).toBeLessThan(aIndex);
      expect(cIndex).toBeLessThan(bIndex);
    });

    it('should handle independent nodes (no dependencies)', () => {
      const nodeA = createNode('skill-a', '1.0.0', 0);
      const nodeB = createNode('skill-b', '1.0.0', 0);
      const nodeC = createNode('skill-c', '1.0.0', 0);

      const tree: IDependencyTree = {
        root: nodeA,
        flatList: [nodeA, nodeB, nodeC],
        maxDepth: 0,
        totalCount: 3,
        installedCount: 0,
      };

      const order = topologicalSort(tree);

      // All nodes are independent, any order is valid
      expect(order).toHaveLength(3);
      expect(order).toContain('skill-a');
      expect(order).toContain('skill-b');
      expect(order).toContain('skill-c');
    });

    it('should handle complex graph with 10+ nodes', () => {
      // Build a complex dependency graph
      const node10 = createNode('skill-10', '1.0.0', 5);
      const node9 = createNode('skill-9', '1.0.0', 4, [node10]);
      const node8 = createNode('skill-8', '1.0.0', 4, [node10]);
      const node7 = createNode('skill-7', '1.0.0', 3, [node9]);
      const node6 = createNode('skill-6', '1.0.0', 3, [node9]);
      const node5 = createNode('skill-5', '1.0.0', 3, [node8]);
      const node4 = createNode('skill-4', '1.0.0', 2, [node7]);
      const node3 = createNode('skill-3', '1.0.0', 2, [node6, node5]);
      const node2 = createNode('skill-2', '1.0.0', 1, [node4, node3]);
      const node1 = createNode('skill-1', '1.0.0', 0, [node2]);

      const tree = buildTree(node1);
      const order = topologicalSort(tree);

      // Verify all 10 nodes are included
      expect(order).toHaveLength(10);

      // skill-10 has no dependencies, must come first
      expect(order[0]).toBe('skill-10');

      // skill-1 depends on everything, must come last
      expect(order[order.length - 1]).toBe('skill-1');

      // Validate dependencies come before dependents
      expect(order.indexOf('skill-9')).toBeLessThan(order.indexOf('skill-7'));
      expect(order.indexOf('skill-9')).toBeLessThan(order.indexOf('skill-6'));
      expect(order.indexOf('skill-8')).toBeLessThan(order.indexOf('skill-5'));
      expect(order.indexOf('skill-7')).toBeLessThan(order.indexOf('skill-4'));
      expect(order.indexOf('skill-4')).toBeLessThan(order.indexOf('skill-2'));
      expect(order.indexOf('skill-3')).toBeLessThan(order.indexOf('skill-2'));
      expect(order.indexOf('skill-2')).toBeLessThan(order.indexOf('skill-1'));
    });

    it('should throw error if cycle detected', () => {
      // Create a circular dependency
      const nodeA = createNode('skill-a', '1.0.0', 0);
      const nodeB = createNode('skill-b', '1.0.0', 1);
      nodeA.dependencies = [nodeB];
      nodeB.dependencies = [nodeA];

      const tree = buildTree(nodeA);

      expect(() => topologicalSort(tree)).toThrow(DependencyError);
      expect(() => topologicalSort(tree)).toThrow(/cycle detected/i);
    });

    it('should handle single node with no dependencies', () => {
      const nodeA = createNode('skill-a', '1.0.0', 0);
      const tree = buildTree(nodeA);

      const order = topologicalSort(tree);

      expect(order).toEqual(['skill-a']);
    });

    it('should correctly handle shared dependencies', () => {
      // A → B → D
      // A → C → D
      // Both B and C depend on D
      const nodeD = createNode('skill-d', '1.0.0', 2);
      const nodeB = createNode('skill-b', '1.0.0', 1, [nodeD]);
      const nodeC = createNode('skill-c', '1.0.0', 1, [nodeD]);
      const nodeA = createNode('skill-a', '1.0.0', 0, [nodeB, nodeC]);

      const tree = buildTree(nodeA);
      const order = topologicalSort(tree);

      // D must be installed before B and C
      const dIndex = order.indexOf('skill-d');
      const bIndex = order.indexOf('skill-b');
      const cIndex = order.indexOf('skill-c');

      expect(dIndex).toBeLessThan(bIndex);
      expect(dIndex).toBeLessThan(cIndex);
    });

    it('should return skill names without version suffix', () => {
      const nodeB = createNode('skill-b', '2.5.1', 1);
      const nodeA = createNode('skill-a', '1.2.3', 0, [nodeB]);

      const tree = buildTree(nodeA);
      const order = topologicalSort(tree);

      // Should return names only, not name@version
      expect(order).toEqual(['skill-b', 'skill-a']);
      expect(order).not.toContain('skill-a@1.2.3');
      expect(order).not.toContain('skill-b@2.5.1');
    });
  });
});

/**
 * Unit tests for Circular Dependency Detection Module
 *
 * Tests DFS-based cycle detection using three-color marking algorithm.
 */

import { detectCircular } from '../../../src/lib/circular-detector';
import {
  IDependencyTree,
  IDependencyNode,
  ICircularDependency,
} from '../../../src/types/dependency';

/**
 * Helper function to build test dependency tree
 * Handles circular references by tracking visited nodes
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
      return; // Already visited, avoid infinite recursion
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

describe('Circular Dependency Detection', () => {
  describe('detectCircular', () => {
    it('should detect simple two-node cycle (A→B→A)', () => {
      // Create circular structure by mutation
      const nodeA = createNode('skill-a', '1.0.0', 0);
      const nodeB = createNode('skill-b', '1.0.0', 1);

      nodeA.dependencies = [nodeB];
      nodeB.dependencies = [nodeA];

      const tree = buildTree(nodeA);
      const cycles = detectCircular(tree);

      expect(cycles.length).toBeGreaterThan(0);
      expect(cycles[0].description).toContain('skill-a');
      expect(cycles[0].description).toContain('skill-b');
    });

    it('should detect three-node cycle (A→B→C→A)', () => {
      const nodeA = createNode('skill-a', '1.0.0', 0);
      const nodeB = createNode('skill-b', '1.0.0', 1);
      const nodeC = createNode('skill-c', '1.0.0', 2);

      nodeA.dependencies = [nodeB];
      nodeB.dependencies = [nodeC];
      nodeC.dependencies = [nodeA];

      const tree = buildTree(nodeA);
      const cycles = detectCircular(tree);

      expect(cycles.length).toBeGreaterThan(0);
      const cycle = cycles[0];
      expect(cycle.path).toEqual(['skill-a', 'skill-b', 'skill-c', 'skill-a']);
      expect(cycle.description).toBe('skill-a→skill-b→skill-c→skill-a');
    });

    it('should detect self-loop (A→A)', () => {
      const nodeA = createNode('skill-a', '1.0.0', 0);
      nodeA.dependencies = [nodeA];

      const tree = buildTree(nodeA);
      const cycles = detectCircular(tree);

      expect(cycles.length).toBeGreaterThan(0);
      expect(cycles[0].path).toEqual(['skill-a', 'skill-a']);
      expect(cycles[0].description).toBe('skill-a→skill-a');
    });

    it('should return empty array for diamond structure (no cycle)', () => {
      // Diamond: A→B, A→C, B→D, C→D (no cycle)
      const nodeD = createNode('skill-d', '1.0.0', 2);
      const nodeB = createNode('skill-b', '1.0.0', 1, [nodeD]);
      const nodeC = createNode('skill-c', '1.0.0', 1, [nodeD]);
      const nodeA = createNode('skill-a', '1.0.0', 0, [nodeB, nodeC]);

      const tree = buildTree(nodeA);
      const cycles = detectCircular(tree);

      expect(cycles).toEqual([]);
    });

    it('should detect complex cycle (A→B→D→A, A→C→D)', () => {
      const nodeA = createNode('skill-a', '1.0.0', 0);
      const nodeB = createNode('skill-b', '1.0.0', 1);
      const nodeC = createNode('skill-c', '1.0.0', 1);
      const nodeD = createNode('skill-d', '1.0.0', 2);

      nodeA.dependencies = [nodeB, nodeC];
      nodeB.dependencies = [nodeD];
      nodeC.dependencies = [nodeD];
      nodeD.dependencies = [nodeA]; // Cycle: A→B→D→A

      const tree = buildTree(nodeA);
      const cycles = detectCircular(tree);

      expect(cycles.length).toBeGreaterThan(0);
      expect(cycles[0].description).toContain('skill-a');
      expect(cycles[0].description).toContain('skill-d');
    });

    it('should detect multiple independent cycles', () => {
      const nodeA = createNode('skill-a', '1.0.0', 0);
      const nodeB = createNode('skill-b', '1.0.0', 1);
      const nodeX = createNode('skill-x', '1.0.0', 1);
      const nodeY = createNode('skill-y', '1.0.0', 2);

      // First cycle: A→B→A
      nodeA.dependencies = [nodeB, nodeX];
      nodeB.dependencies = [nodeA];

      // Second cycle: X→Y→X
      nodeX.dependencies = [nodeY];
      nodeY.dependencies = [nodeX];

      const tree = buildTree(nodeA);
      const cycles = detectCircular(tree);

      // Should detect at least one cycle
      expect(cycles.length).toBeGreaterThan(0);
    });

    it('should return empty array for linear chain (no cycle)', () => {
      const nodeD = createNode('skill-d', '1.0.0', 3);
      const nodeC = createNode('skill-c', '1.0.0', 2, [nodeD]);
      const nodeB = createNode('skill-b', '1.0.0', 1, [nodeC]);
      const nodeA = createNode('skill-a', '1.0.0', 0, [nodeB]);

      const tree = buildTree(nodeA);
      const cycles = detectCircular(tree);

      expect(cycles).toEqual([]);
    });

    it('should return empty array for independent nodes (no cycle)', () => {
      const nodeA = createNode('skill-a', '1.0.0', 0);
      const nodeB = createNode('skill-b', '1.0.0', 1);
      const nodeC = createNode('skill-c', '1.0.0', 1);

      // No dependencies between nodes
      nodeA.dependencies = [];
      nodeB.dependencies = [];
      nodeC.dependencies = [];

      const tree = buildTree(nodeA);
      const cycles = detectCircular(tree);

      expect(cycles).toEqual([]);
    });

    it('should handle empty dependency tree', () => {
      const nodeA = createNode('skill-a', '1.0.0', 0, []);

      const tree = buildTree(nodeA);
      const cycles = detectCircular(tree);

      expect(cycles).toEqual([]);
    });

    it('should handle same skill with different versions (not a cycle)', () => {
      const nodeA1 = createNode('skill-a', '1.0.0', 0);
      const nodeA2 = createNode('skill-a', '2.0.0', 1);

      nodeA1.dependencies = [nodeA2];
      nodeA2.dependencies = []; // Different version, no cycle back

      const tree = buildTree(nodeA1);
      const cycles = detectCircular(tree);

      expect(cycles).toEqual([]);
    });
  });
});

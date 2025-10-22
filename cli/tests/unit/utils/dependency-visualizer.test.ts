/**
 * Unit tests for Dependency Visualizer Utility
 *
 * Tests ASCII tree visualization generation.
 */

import { visualize } from '../../../src/utils/dependency-visualizer';
import {
  IDependencyTree,
  IDependencyNode,
} from '../../../src/types/dependency';

function createNode(
  name: string,
  version: string,
  depth: number,
  isInstalled = false,
  dependencies: IDependencyNode[] = []
): IDependencyNode {
  return {
    name,
    version,
    arweaveTxId: `tx_${name}`,
    dependencies,
    depth,
    isInstalled,
  };
}

function buildTree(root: IDependencyNode): IDependencyTree {
  const flatList: IDependencyNode[] = [];

  function flatten(node: IDependencyNode): void {
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

describe('Dependency Visualizer', () => {
  describe('visualize', () => {
    it('should render simple tree with box-drawing characters', () => {
      const nodeB = createNode('dep-b', '1.0.0', 1);
      const nodeA = createNode('root-skill', '1.0.0', 0, false, [nodeB]);

      const tree = buildTree(nodeA);
      const output = visualize(tree);

      expect(output).toContain('root-skill@1.0.0');
      expect(output).toContain('└──');
      expect(output).toContain('dep-b@1.0.0');
      expect(output).toContain('(depth: 1)');
    });

    it('should show proper indentation for multi-level tree', () => {
      const nodeC = createNode('skill-c', '1.0.0', 2);
      const nodeB = createNode('skill-b', '1.0.0', 1, false, [nodeC]);
      const nodeA = createNode('skill-a', '1.0.0', 0, false, [nodeB]);

      const tree = buildTree(nodeA);
      const output = visualize(tree);

      const lines = output.split('\n');
      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe('skill-a@1.0.0');
      expect(lines[1]).toContain('└──');
      expect(lines[1]).toContain('skill-b@1.0.0');
      expect(lines[2]).toContain('    └──');
      expect(lines[2]).toContain('skill-c@1.0.0');
    });

    it('should mark installed dependencies with ✓', () => {
      const nodeB = createNode('installed-dep', '1.0.0', 1, true);
      const nodeA = createNode('root', '1.0.0', 0, false, [nodeB]);

      const tree = buildTree(nodeA);
      const output = visualize(tree);

      expect(output).toContain('installed-dep@1.0.0 ✓');
    });

    it('should show depth indicators for each node', () => {
      const nodeC = createNode('skill-c', '1.0.0', 2);
      const nodeB = createNode('skill-b', '1.0.0', 1, false, [nodeC]);
      const nodeA = createNode('skill-a', '1.0.0', 0, false, [nodeB]);

      const tree = buildTree(nodeA);
      const output = visualize(tree);

      expect(output).toContain('(depth: 1)');
      expect(output).toContain('(depth: 2)');
      expect(output).not.toContain('(depth: 0)'); // Root doesn't show depth
    });

    it('should return empty string for empty tree', () => {
      const tree: IDependencyTree = {
        root: null as any,
        flatList: [],
        maxDepth: 0,
        totalCount: 0,
        installedCount: 0,
      };

      const output = visualize(tree);
      expect(output).toBe('');
    });

    it('should handle tree with multiple children correctly', () => {
      const nodeC = createNode('skill-c', '1.0.0', 1);
      const nodeB = createNode('skill-b', '1.0.0', 1);
      const nodeA = createNode('skill-a', '1.0.0', 0, false, [nodeB, nodeC]);

      const tree = buildTree(nodeA);
      const output = visualize(tree);

      expect(output).toContain('├──'); // First child
      expect(output).toContain('└──'); // Last child
    });

    it('should handle complex tree with branches', () => {
      // Create structure: A → [B → D, C]
      // This produces:
      // A
      // ├── B (depth: 1)
      // │   └── D (depth: 2)  <-- │ appears here because B is not last child
      // └── C (depth: 1)
      const nodeD = createNode('skill-d', '1.0.0', 2);
      const nodeB = createNode('skill-b', '1.0.0', 1, false, [nodeD]);
      const nodeC = createNode('skill-c', '1.0.0', 1);
      const nodeA = createNode('skill-a', '1.0.0', 0, false, [nodeB, nodeC]);

      const tree = buildTree(nodeA);
      const output = visualize(tree);

      const lines = output.split('\n');
      expect(lines.length).toBeGreaterThan(3);
      expect(output).toContain('│'); // Vertical line for continuing branch
    });

    it('should match snapshot for typical dependency tree', () => {
      const nodeD = createNode('shared-dep', '1.0.0', 2, true);
      const nodeC = createNode('another-dep', '2.0.0', 2);
      const nodeB = createNode('dependency-b', '3.0.0', 1, false, [nodeD, nodeC]);
      const nodeA2 = createNode('sub-dependency', '1.5.0', 2);
      const nodeA1 = createNode('dependency-a', '2.1.0', 1, true, [nodeA2]);
      const root = createNode('skill-root', '1.0.0', 0, false, [nodeA1, nodeB]);

      const tree = buildTree(root);
      const output = visualize(tree);

      // Check key elements
      expect(output).toContain('skill-root@1.0.0');
      expect(output).toContain('dependency-a@2.1.0 ✓');
      expect(output).toContain('sub-dependency@1.5.0');
      expect(output).toContain('dependency-b@3.0.0');
      expect(output).toContain('shared-dep@1.0.0 ✓');
      expect(output).toContain('another-dep@2.0.0');
    });
  });
});

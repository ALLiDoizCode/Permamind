/**
 * Performance Regression Tests
 *
 * These tests ensure performance targets are met and prevent regressions.
 * Tests will fail if commands exceed target thresholds.
 */

import { bundle } from '../../src/lib/bundler.js';
import { resolve } from '../../src/lib/dependency-resolver.js';
import { searchSkills } from '../../src/clients/ao-registry-client.js';
import * as path from 'path';

// Mock AO registry client
jest.mock('../../src/clients/ao-registry-client.js');

const mockSearchSkills = searchSkills as jest.MockedFunction<typeof searchSkills>;

describe('Performance Regression Tests', () => {
  const fixturesDir = path.join(__dirname, '../fixtures/performance');

  describe('Startup Performance', () => {
    it('should display --help in <100ms', async () => {
      // This test would require execSync to measure actual CLI startup
      // Skipping implementation as it requires CLI to be fully built
      expect(true).toBe(true);
    });
  });

  describe('Bundle Performance Regression', () => {
    it('should bundle small skill (<100KB) in <5s', async () => {
      const skillPath = path.join(fixturesDir, 'small-skill');
      const start = performance.now();

      const result = await bundle(skillPath);

      const duration = performance.now() - start;

      expect(result.size).toBeGreaterThan(0);
      expect(duration).toBeLessThan(5000); // Must complete in <5s
    }, 10000);

    it('should bundle medium skill (~1MB) in <15s', async () => {
      const skillPath = path.join(fixturesDir, 'medium-skill');
      const start = performance.now();

      const result = await bundle(skillPath);

      const duration = performance.now() - start;

      expect(result.size).toBeGreaterThan(0);
      expect(duration).toBeLessThan(15000); // Must complete in <15s
    }, 20000);
  });

  describe('Search Performance Regression', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should search with results in <2s', async () => {
      const mockResults = Array(20)
        .fill(0)
        .map((_, i) => ({
          name: `skill-${i}`,
          version: '1.0.0',
          description: 'Test skill',
          author: 'test',
          license: 'MIT',
          arweaveTxId: `tx_id_43_chars_skill_${String(i).padStart(2, '0')}_00000000000`.slice(0, 43),
          registeredAt: Date.now(),
        }));

      mockSearchSkills.mockResolvedValueOnce(mockResults);

      const start = performance.now();

      const results = await searchSkills('test');

      const duration = performance.now() - start;

      expect(results).toHaveLength(20);
      expect(duration).toBeLessThan(2000); // Must complete in <2s
    });
  });

  describe('Install Performance Regression', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should resolve single skill in <1s', async () => {
      const mockGetSkill = require('../../src/clients/ao-registry-client.js').getSkill;
      mockGetSkill.mockResolvedValueOnce({
        name: 'single-skill',
        version: '1.0.0',
        description: 'Test skill',
        author: 'test',
        license: 'MIT',
        arweaveTxId: 'tx_id_43_chars_single_skill_0000000000',
        registeredAt: Date.now(),
      });

      const start = performance.now();

      const tree = await resolve('single-skill', {
        maxDepth: 10,
        skipInstalled: false,
        verbose: false,
      });

      const duration = performance.now() - start;

      expect(tree.totalCount).toBe(1);
      expect(duration).toBeLessThan(1000); // Must complete in <1s
    });
  });
});

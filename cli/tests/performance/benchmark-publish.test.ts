/**
 * Performance Benchmark Tests for Publish Command
 *
 * Measures publish command performance with various bundle sizes.
 * These tests establish baselines and verify performance targets.
 */

import * as path from 'path';
import * as fs from 'fs';
import { bundle } from '../../src/lib/bundler.js';

describe('Publish Command Performance Benchmarks', () => {
  const fixturesDir = path.join(__dirname, '../fixtures/performance');

  beforeAll(() => {
    // Verify fixtures exist
    expect(fs.existsSync(path.join(fixturesDir, 'small-skill'))).toBe(true);
    expect(fs.existsSync(path.join(fixturesDir, 'medium-skill'))).toBe(true);
    expect(fs.existsSync(path.join(fixturesDir, 'large-skill'))).toBe(true);
  });

  describe('Bundle Creation Performance', () => {
    it('should bundle small skill (~100KB) quickly', async () => {
      const skillPath = path.join(fixturesDir, 'small-skill');
      const start = performance.now();

      const result = await bundle(skillPath);

      const duration = performance.now() - start;
      const sizeKB = result.size / 1024;

      console.log(`Small bundle: ${sizeKB.toFixed(2)} KB, ${duration.toFixed(2)} ms`);

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.size).toBeGreaterThan(0);
      expect(duration).toBeLessThan(5000); // Should complete in <5s
    }, 10000);

    it('should bundle medium skill (~1MB) efficiently', async () => {
      const skillPath = path.join(fixturesDir, 'medium-skill');
      const start = performance.now();

      const result = await bundle(skillPath);

      const duration = performance.now() - start;
      const sizeKB = result.size / 1024;

      console.log(`Medium bundle: ${sizeKB.toFixed(2)} KB, ${duration.toFixed(2)} ms`);

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.size).toBeGreaterThan(0);
      expect(duration).toBeLessThan(15000); // Should complete in <15s
    }, 20000);

    it('should bundle large skill (~5MB) within reasonable time', async () => {
      const skillPath = path.join(fixturesDir, 'large-skill');
      const start = performance.now();

      const result = await bundle(skillPath);

      const duration = performance.now() - start;
      const sizeKB = result.size / 1024;

      console.log(`Large bundle: ${sizeKB.toFixed(2)} KB, ${duration.toFixed(2)} ms`);

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.size).toBeGreaterThan(0);
      expect(duration).toBeLessThan(30000); // Should complete in <30s
    }, 40000);
  });

  describe('Compression Performance', () => {
    it('should measure compression ratio for small bundle', async () => {
      const skillPath = path.join(fixturesDir, 'small-skill');

      // Measure uncompressed size (approximate)
      const files = fs.readdirSync(skillPath);
      let uncompressedSize = 0;
      files.forEach(file => {
        const filePath = path.join(skillPath, file);
        if (fs.statSync(filePath).isFile()) {
          uncompressedSize += fs.statSync(filePath).size;
        }
      });

      const result = await bundle(skillPath);
      const compressedSize = result.size;
      const compressionRatio = ((uncompressedSize - compressedSize) / uncompressedSize * 100).toFixed(2);

      console.log(`Small skill compression: ${compressionRatio}% (${uncompressedSize} -> ${compressedSize} bytes)`);

      expect(compressedSize).toBeLessThan(uncompressedSize);
    });

    it('should measure compression ratio for medium bundle', async () => {
      const skillPath = path.join(fixturesDir, 'medium-skill');

      // Measure uncompressed size
      let uncompressedSize = 0;
      const countSize = (dir: string) => {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          if (stat.isFile()) {
            uncompressedSize += stat.size;
          } else if (stat.isDirectory()) {
            countSize(filePath);
          }
        });
      };
      countSize(skillPath);

      const result = await bundle(skillPath);
      const compressedSize = result.size;
      const compressionRatio = ((uncompressedSize - compressedSize) / uncompressedSize * 100).toFixed(2);

      console.log(`Medium skill compression: ${compressionRatio}% (${uncompressedSize} -> ${compressedSize} bytes)`);

      expect(compressedSize).toBeLessThan(uncompressedSize);
    });
  });
});

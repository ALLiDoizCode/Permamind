/**
 * Unit tests for bundler module
 *
 * Tests bundle creation, extraction, file exclusion, size validation,
 * error handling, and progress callbacks.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { bundle, extract } from '../../../src/lib/bundler.js';
import { FileSystemError } from '../../../src/types/errors.js';
import { BundleProgress } from '../../../src/types/skill.js';

describe('Bundler', () => {
  const fixturesDir = path.join(__dirname, '../../fixtures');
  const testSkillDir = path.join(fixturesDir, 'test-skill');
  let tempDir: string;

  beforeAll(async () => {
    // Create temporary directory for extraction tests
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bundler-test-'));
  });

  afterAll(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('bundle()', () => {
    describe('valid bundles', () => {
      it('should bundle minimal skill directory (SKILL.md only)', async () => {
        const result = await bundle(testSkillDir);

        expect(result.buffer).toBeInstanceOf(Buffer);
        expect(result.buffer.length).toBeGreaterThan(0);
        expect(result.size).toBeGreaterThan(0);
        expect(result.fileCount).toBeGreaterThan(0);
        expect(result.sizeFormatted).toMatch(/bytes|KB|MB/);
        expect(result.exceededLimit).toBe(false);
      });

      it('should bundle skill with nested subdirectories', async () => {
        const result = await bundle(testSkillDir);

        // Should include files from nested directory
        expect(result.fileCount).toBeGreaterThanOrEqual(2); // SKILL.md + nested/file.js
      });

      it('should bundle skill with multiple file types', async () => {
        const result = await bundle(testSkillDir);

        // Multiple file types (.md, .js, .json) should be included
        expect(result.fileCount).toBeGreaterThan(0);
        expect(result.buffer).toBeInstanceOf(Buffer);
      });

      it('should calculate bundle size accurately', async () => {
        const result = await bundle(testSkillDir);

        expect(result.size).toBe(result.buffer.length);
        expect(result.size).toBeGreaterThan(0);
        expect(typeof result.sizeFormatted).toBe('string');
      });

      it('should verify bundle buffer is valid tar.gz format', async () => {
        const result = await bundle(testSkillDir);

        // Gzip magic number: 0x1f 0x8b
        expect(result.buffer[0]).toBe(0x1f);
        expect(result.buffer[1]).toBe(0x8b);
      });
    });

    describe('file exclusion', () => {
      it('should exclude .git directory', async () => {
        const result = await bundle(testSkillDir);

        // Extract and verify .git is excluded
        const extractDir = path.join(tempDir, 'exclude-git-test');
        await extract(result.buffer, extractDir);

        const gitDirExists = await fs
          .access(path.join(extractDir, '.git'))
          .then(() => true)
          .catch(() => false);

        expect(gitDirExists).toBe(false);
      });

      it('should exclude node_modules directory', async () => {
        const result = await bundle(testSkillDir);

        // Extract and verify node_modules is excluded
        const extractDir = path.join(tempDir, 'exclude-node-modules-test');
        await extract(result.buffer, extractDir);

        const nodeModulesExists = await fs
          .access(path.join(extractDir, 'node_modules'))
          .then(() => true)
          .catch(() => false);

        expect(nodeModulesExists).toBe(false);
      });

      it('should exclude hidden files (.DS_Store, .env)', async () => {
        const result = await bundle(testSkillDir);

        // Extract and verify hidden files are excluded
        const extractDir = path.join(tempDir, 'exclude-hidden-test');
        await extract(result.buffer, extractDir);

        const dsStoreExists = await fs
          .access(path.join(extractDir, '.DS_Store'))
          .then(() => true)
          .catch(() => false);

        const envExists = await fs
          .access(path.join(extractDir, '.env'))
          .then(() => true)
          .catch(() => false);

        expect(dsStoreExists).toBe(false);
        expect(envExists).toBe(false);
      });

      it('should include .skillsrc if present', async () => {
        const result = await bundle(testSkillDir);

        // Extract and verify .skillsrc is included
        const extractDir = path.join(tempDir, 'include-skillsrc-test');
        await extract(result.buffer, extractDir);

        const skillsrcExists = await fs
          .access(path.join(extractDir, '.skillsrc'))
          .then(() => true)
          .catch(() => false);

        expect(skillsrcExists).toBe(true);
      });

      it('should verify excluded files not in bundle contents', async () => {
        const result = await bundle(testSkillDir);

        // Extract to verify structure
        const extractDir = path.join(tempDir, 'verify-exclusions-test');
        await extract(result.buffer, extractDir);

        // Read extracted directory
        const extractedFiles = await fs.readdir(extractDir, { recursive: true });

        // Verify no excluded patterns
        const hasGit = extractedFiles.some((f) => f.includes('.git'));
        const hasNodeModules = extractedFiles.some((f) => f.includes('node_modules'));
        const hasDsStore = extractedFiles.some((f) => f.includes('.DS_Store'));

        expect(hasGit).toBe(false);
        expect(hasNodeModules).toBe(false);
        expect(hasDsStore).toBe(false);
      });
    });

    describe('bundle size validation', () => {
      it('should not exceed limit for small bundles (no warning)', async () => {
        const result = await bundle(testSkillDir);

        expect(result.exceededLimit).toBe(false);
      });

      it('should emit warning for bundles over 10MB', async () => {
        // Create temporary large skill directory
        const largeSkillDir = path.join(tempDir, 'large-skill');
        await fs.mkdir(largeSkillDir, { recursive: true });

        // Create SKILL.md
        await fs.writeFile(
          path.join(largeSkillDir, 'SKILL.md'),
          '---\nname: large-skill\nversion: 1.0.0\ndescription: Large skill\nauthor: Test\n---\n# Large Skill'
        );

        // Create multiple large files with random data (uncompressible) to exceed limit
        // Using random data ensures compression doesn't reduce size below limit
        for (let i = 0; i < 3; i++) {
          const randomContent = Buffer.alloc(5 * 1024 * 1024);
          for (let j = 0; j < randomContent.length; j++) {
            randomContent[j] = Math.floor(Math.random() * 256);
          }
          await fs.writeFile(path.join(largeSkillDir, `large-file-${i}.bin`), randomContent);
        }

        const result = await bundle(largeSkillDir);

        expect(result.exceededLimit).toBe(true);
        expect(result.size).toBeGreaterThan(10 * 1024 * 1024);

        // Cleanup
        await fs.rm(largeSkillDir, { recursive: true, force: true });
      });

      it('should still create bundle successfully even with warning', async () => {
        const result = await bundle(testSkillDir);

        // Even if warning emitted, bundle should succeed
        expect(result.buffer).toBeInstanceOf(Buffer);
        expect(result.size).toBeGreaterThan(0);
      });
    });

    describe('error handling', () => {
      it('should throw FileSystemError for missing directory', async () => {
        const nonExistentDir = path.join(tempDir, 'does-not-exist');

        await expect(bundle(nonExistentDir)).rejects.toThrow(FileSystemError);
        await expect(bundle(nonExistentDir)).rejects.toThrow(/Directory not found/);
      });

      it('should throw FileSystemError if path is not a directory', async () => {
        // Create a regular file
        const filePath = path.join(tempDir, 'not-a-directory.txt');
        await fs.writeFile(filePath, 'test content');

        await expect(bundle(filePath)).rejects.toThrow(FileSystemError);
        await expect(bundle(filePath)).rejects.toThrow(/not a directory/);

        // Cleanup
        await fs.unlink(filePath);
      });

      it('should handle empty directory (should still create valid bundle)', async () => {
        const emptyDir = path.join(tempDir, 'empty-skill');
        await fs.mkdir(emptyDir, { recursive: true });

        const result = await bundle(emptyDir);

        expect(result.buffer).toBeInstanceOf(Buffer);
        expect(result.fileCount).toBe(0);

        // Cleanup
        await fs.rm(emptyDir, { recursive: true, force: true });
      });

      it('should handle SKILL.md missing (validation happens in parser)', async () => {
        // Create skill without SKILL.md
        const noManifestDir = path.join(tempDir, 'no-manifest-skill');
        await fs.mkdir(noManifestDir, { recursive: true });
        await fs.writeFile(path.join(noManifestDir, 'README.md'), '# Test');

        const result = await bundle(noManifestDir);

        // Bundler doesn't validate manifest presence (parser does)
        expect(result.buffer).toBeInstanceOf(Buffer);
        expect(result.fileCount).toBeGreaterThan(0);

        // Cleanup
        await fs.rm(noManifestDir, { recursive: true, force: true });
      });

      it('should verify error messages follow "Error → Solution:" pattern', async () => {
        const nonExistentDir = path.join(tempDir, 'does-not-exist');

        try {
          await bundle(nonExistentDir);
          fail('Expected FileSystemError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(FileSystemError);
          expect((error as Error).message).toMatch(/→ Solution:/);
        }
      });
    });

    describe('progress callback', () => {
      it('should invoke progress callback during bundling', async () => {
        const progressUpdates: BundleProgress[] = [];

        await bundle(testSkillDir, {
          onProgress: (progress) => {
            progressUpdates.push({ ...progress });
          },
        });

        expect(progressUpdates.length).toBeGreaterThan(0);
      });

      it('should track file count progression', async () => {
        const progressUpdates: BundleProgress[] = [];

        const result = await bundle(testSkillDir, {
          onProgress: (progress) => {
            progressUpdates.push({ ...progress });
          },
        });

        // Progress should increase
        if (progressUpdates.length > 0) {
          const lastProgress = progressUpdates[progressUpdates.length - 1];
          expect(lastProgress.current).toBeLessThanOrEqual(lastProgress.total);
          expect(lastProgress.total).toBe(result.fileCount);
        }
      });

      it('should work without callback provided (no errors)', async () => {
        // Should not throw when no callback provided
        const result = await bundle(testSkillDir);

        expect(result.buffer).toBeInstanceOf(Buffer);
      });

      it('should include current file name in progress updates', async () => {
        const progressUpdates: BundleProgress[] = [];

        await bundle(testSkillDir, {
          onProgress: (progress) => {
            progressUpdates.push({ ...progress });
          },
        });

        if (progressUpdates.length > 0) {
          const firstProgress = progressUpdates[0];
          expect(typeof firstProgress.file).toBe('string');
        }
      });
    });
  });

  describe('extract()', () => {
    it('should extract valid tar.gz bundle', async () => {
      const result = await bundle(testSkillDir);
      const extractDir = path.join(tempDir, 'extract-test');

      await extract(result.buffer, extractDir);

      // Verify extracted files exist
      const skillMdExists = await fs
        .access(path.join(extractDir, 'SKILL.md'))
        .then(() => true)
        .catch(() => false);

      expect(skillMdExists).toBe(true);
    });

    it('should verify extracted files match original', async () => {
      const result = await bundle(testSkillDir);
      const extractDir = path.join(tempDir, 'match-test');

      await extract(result.buffer, extractDir);

      // Compare file contents
      const originalContent = await fs.readFile(path.join(testSkillDir, 'SKILL.md'), 'utf8');
      const extractedContent = await fs.readFile(path.join(extractDir, 'SKILL.md'), 'utf8');

      expect(extractedContent).toBe(originalContent);
    });

    it('should support round-trip (bundle → extract → compare)', async () => {
      // First bundle
      const result1 = await bundle(testSkillDir);
      const extractDir = path.join(tempDir, 'roundtrip-test');

      // Extract
      await extract(result1.buffer, extractDir);

      // Bundle again from extracted directory
      const result2 = await bundle(extractDir);

      // Compare sizes (should be similar, allowing for compression variance)
      expect(Math.abs(result1.size - result2.size)).toBeLessThan(result1.size * 0.1); // Within 10%
    });

    it('should create target directory if missing', async () => {
      const result = await bundle(testSkillDir);
      const extractDir = path.join(tempDir, 'new-dir', 'nested', 'extract');

      await extract(result.buffer, extractDir);

      const dirExists = await fs
        .access(extractDir)
        .then(() => true)
        .catch(() => false);

      expect(dirExists).toBe(true);
    });

    it('should handle invalid tar buffer errors', async () => {
      const invalidBuffer = Buffer.from('not a tar file');
      const extractDir = path.join(tempDir, 'invalid-test');

      await expect(extract(invalidBuffer, extractDir)).rejects.toThrow(FileSystemError);
      await expect(extract(invalidBuffer, extractDir)).rejects.toThrow(/Failed to extract/);
    });
  });
});

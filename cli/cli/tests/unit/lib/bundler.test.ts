/**
 * Unit tests for bundler module - extraction functionality
 *
 * Tests bundle extraction, validation, and error handling with mocked file system operations
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs/promises';
import * as tar from 'tar';
import * as os from 'os';
import * as path from 'path';
import {
  extract,
  detectSkillName,
  resolveInstallPath,
  validateBundle,
  checkDiskSpace,
} from '../../../src/lib/bundler.js';
import { ValidationError, FileSystemError, UserCancelledError } from '../../../src/types/errors.js';
import type { IExtractionOptions } from '../../../src/types/skill.js';

// Mock modules
jest.mock('fs/promises');
jest.mock('tar');
jest.mock('../../../src/utils/logger.js');
jest.mock('readline/promises');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockTar = tar as jest.Mocked<typeof tar>;

describe('bundler - extraction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateBundle', () => {
    it('should validate a valid tar.gz bundle', async () => {
      // Valid gzip magic bytes (1f 8b)
      const validBuffer = Buffer.from([0x1f, 0x8b, 0x00, 0x00]);

      // Mock fs operations for detectSkillName
      mockFs.writeFile = jest.fn().mockResolvedValue(undefined);
      mockFs.mkdir = jest.fn().mockResolvedValue(undefined);
      mockFs.readFile = jest.fn().mockResolvedValue('---\nname: test-skill\n---\nContent');
      mockFs.unlink = jest.fn().mockResolvedValue(undefined);
      mockFs.rm = jest.fn().mockResolvedValue(undefined);

      // Mock tar extraction
      mockTar.extract = jest.fn().mockResolvedValue(undefined);

      const result = await validateBundle(validBuffer);
      expect(result).toBe(true);
    });

    it('should throw ValidationError for empty buffer', async () => {
      const emptyBuffer = Buffer.alloc(0);

      await expect(validateBundle(emptyBuffer)).rejects.toThrow(ValidationError);
      await expect(validateBundle(emptyBuffer)).rejects.toThrow('Bundle is empty');
    });

    it('should throw ValidationError for invalid tar.gz format', async () => {
      // Invalid magic bytes
      const invalidBuffer = Buffer.from([0x00, 0x00, 0x00, 0x00]);

      await expect(validateBundle(invalidBuffer)).rejects.toThrow(ValidationError);
      await expect(validateBundle(invalidBuffer)).rejects.toThrow('Bundle corrupted or invalid tar.gz format');
    });
  });

  describe('detectSkillName', () => {
    it('should detect skill name from bundle', async () => {
      const validBuffer = Buffer.from([0x1f, 0x8b, 0x00, 0x00]);

      // Mock fs operations
      mockFs.writeFile = jest.fn().mockResolvedValue(undefined);
      mockFs.mkdir = jest.fn().mockResolvedValue(undefined);
      mockFs.readFile = jest.fn().mockResolvedValue('---\nname: ao-basics\nversion: 1.0.0\n---\nContent');
      mockFs.unlink = jest.fn().mockResolvedValue(undefined);
      mockFs.rm = jest.fn().mockResolvedValue(undefined);

      // Mock tar extraction
      mockTar.extract = jest.fn().mockResolvedValue(undefined);

      const skillName = await detectSkillName(validBuffer);
      expect(skillName).toBe('ao-basics');
    });

    it('should throw ValidationError if SKILL.md has no name field', async () => {
      const validBuffer = Buffer.from([0x1f, 0x8b, 0x00, 0x00]);

      // Mock fs operations - SKILL.md without name
      mockFs.writeFile = jest.fn().mockResolvedValue(undefined);
      mockFs.mkdir = jest.fn().mockResolvedValue(undefined);
      mockFs.readFile = jest.fn().mockResolvedValue('---\nversion: 1.0.0\n---\nContent');
      mockFs.unlink = jest.fn().mockResolvedValue(undefined);
      mockFs.rm = jest.fn().mockResolvedValue(undefined);

      // Mock tar extraction
      mockTar.extract = jest.fn().mockResolvedValue(undefined);

      await expect(detectSkillName(validBuffer)).rejects.toThrow(ValidationError);
      await expect(detectSkillName(validBuffer)).rejects.toThrow('missing "name" field');
    });

    it('should throw ValidationError if SKILL.md is missing', async () => {
      const validBuffer = Buffer.from([0x1f, 0x8b, 0x00, 0x00]);

      // Mock fs operations - readFile fails (SKILL.md missing)
      mockFs.writeFile = jest.fn().mockResolvedValue(undefined);
      mockFs.mkdir = jest.fn().mockResolvedValue(undefined);
      mockFs.readFile = jest.fn().mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
      mockFs.unlink = jest.fn().mockResolvedValue(undefined);
      mockFs.rm = jest.fn().mockResolvedValue(undefined);

      // Mock tar extraction
      mockTar.extract = jest.fn().mockResolvedValue(undefined);

      await expect(detectSkillName(validBuffer)).rejects.toThrow(ValidationError);
      await expect(detectSkillName(validBuffer)).rejects.toThrow('Bundle missing SKILL.md file');
    });
  });

  describe('resolveInstallPath', () => {
    const originalHomedir = os.homedir;
    const originalCwd = process.cwd;

    beforeEach(() => {
      // Mock os.homedir and process.cwd
      (os as { homedir: () => string }).homedir = jest.fn().mockReturnValue('/Users/test');
      (process as { cwd: () => string }).cwd = jest.fn().mockReturnValue('/workspace/project');
    });

    afterEach(() => {
      (os as { homedir: () => string }).homedir = originalHomedir;
      (process as { cwd: () => string }).cwd = originalCwd;
    });

    it('should resolve to global installation path by default', () => {
      const options: IExtractionOptions = {};
      const installPath = resolveInstallPath('ao-basics', options);

      expect(installPath).toBe(path.join('/Users/test', '.claude', 'skills', 'ao-basics'));
    });

    it('should resolve to local installation path when local=true', () => {
      const options: IExtractionOptions = { local: true };
      const installPath = resolveInstallPath('ao-basics', options);

      expect(installPath).toBe(path.join('/workspace/project', '.claude', 'skills', 'ao-basics'));
    });

    it('should use custom targetDir when provided', () => {
      const options: IExtractionOptions = { targetDir: '/custom/path' };
      const installPath = resolveInstallPath('ao-basics', options);

      expect(installPath).toContain('custom');
    });
  });

  describe('checkDiskSpace', () => {
    it('should return true if sufficient space available', async () => {
      // Mock fs.statfs with sufficient space
      (mockFs as { statfs?: (path: string) => Promise<{ bavail: bigint; bsize: bigint }> }).statfs = jest
        .fn()
        .mockResolvedValue({
          bavail: 1000000n,
          bsize: 4096n,
        });

      const hasSpace = await checkDiskSpace('/test/path', 1024 * 1024); // 1MB required
      expect(hasSpace).toBe(true);
    });

    it('should return false if insufficient space', async () => {
      // Mock fs.statfs with insufficient space
      (mockFs as { statfs?: (path: string) => Promise<{ bavail: bigint; bsize: bigint }> }).statfs = jest
        .fn()
        .mockResolvedValue({
          bavail: 100n,
          bsize: 4096n,
        });

      const hasSpace = await checkDiskSpace('/test/path', 10 * 1024 * 1024); // 10MB required
      expect(hasSpace).toBe(false);
    });

    it('should return true if statfs unavailable (fallback)', async () => {
      // Remove statfs from mock
      delete (mockFs as { statfs?: unknown }).statfs;

      const hasSpace = await checkDiskSpace('/test/path', 1024 * 1024);
      expect(hasSpace).toBe(true); // Fallback behavior
    });
  });

  describe('extract', () => {
    beforeEach(() => {
      // Setup common mocks
      (os as { homedir: () => string }).homedir = jest.fn().mockReturnValue('/Users/test');
      (os as { tmpdir: () => string }).tmpdir = jest.fn().mockReturnValue('/tmp');
      (process as { cwd: () => string }).cwd = jest.fn().mockReturnValue('/workspace');

      // Mock all fs operations
      mockFs.writeFile = jest.fn().mockResolvedValue(undefined);
      mockFs.mkdir = jest.fn().mockResolvedValue(undefined);
      mockFs.readFile = jest.fn().mockResolvedValue('---\nname: test-skill\nversion: 1.0.0\n---\nContent');
      mockFs.unlink = jest.fn().mockResolvedValue(undefined);
      mockFs.rm = jest.fn().mockResolvedValue(undefined);
      mockFs.rename = jest.fn().mockResolvedValue(undefined);
      mockFs.chmod = jest.fn().mockResolvedValue(undefined);
      mockFs.readdir = jest.fn().mockResolvedValue([]);
      mockFs.access = jest.fn().mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));

      // Mock tar extraction
      mockTar.extract = jest.fn().mockResolvedValue(undefined);

      // Mock disk space check
      (mockFs as { statfs?: (path: string) => Promise<{ bavail: bigint; bsize: bigint }> }).statfs = jest
        .fn()
        .mockResolvedValue({
          bavail: 1000000n,
          bsize: 4096n,
        });
    });

    it('should successfully extract bundle and return result', async () => {
      const validBuffer = Buffer.from([0x1f, 0x8b, 0x00, 0x00]);
      const options: IExtractionOptions = { force: true };

      // Mock readdir to return test files
      mockFs.readdir = jest.fn().mockResolvedValue([
        { name: 'SKILL.md', isDirectory: () => false },
        { name: 'README.md', isDirectory: () => false },
      ] as fs.Dirent[]);

      const result = await extract(validBuffer, options);

      expect(result.skillName).toBe('test-skill');
      expect(result.filesExtracted).toBeGreaterThan(0);
      expect(result.installedPath).toContain('test-skill');
    });

    it('should throw UserCancelledError when user declines overwrite', async () => {
      const validBuffer = Buffer.from([0x1f, 0x8b, 0x00, 0x00]);
      const options: IExtractionOptions = { force: false };

      // Mock existing directory
      mockFs.access = jest.fn().mockResolvedValue(undefined);

      // Mock readline to return 'no'
      const readlinePromises = await import('readline/promises');
      const mockQuestion = jest.fn().mockResolvedValue('n');
      const mockClose = jest.fn();
      (readlinePromises.createInterface as jest.Mock) = jest.fn().mockReturnValue({
        question: mockQuestion,
        close: mockClose,
      });

      await expect(extract(validBuffer, options)).rejects.toThrow(UserCancelledError);
    });

    it('should overwrite existing directory when force=true', async () => {
      const validBuffer = Buffer.from([0x1f, 0x8b, 0x00, 0x00]);
      const options: IExtractionOptions = { force: true };

      // Mock existing directory
      mockFs.access = jest.fn().mockResolvedValue(undefined);

      // Mock readdir to return test files
      mockFs.readdir = jest.fn().mockResolvedValue([
        { name: 'SKILL.md', isDirectory: () => false },
      ] as fs.Dirent[]);

      const result = await extract(validBuffer, options);

      expect(mockFs.rm).toHaveBeenCalled(); // Existing directory removed
      expect(result.skillName).toBe('test-skill');
    });

    it('should throw FileSystemError on ENOSPC error', async () => {
      const validBuffer = Buffer.from([0x1f, 0x8b, 0x00, 0x00]);

      // Mock tar.extract to throw ENOSPC
      mockTar.extract = jest.fn().mockRejectedValue(Object.assign(new Error('ENOSPC'), { code: 'ENOSPC' }));

      await expect(extract(validBuffer)).rejects.toThrow(FileSystemError);
      await expect(extract(validBuffer)).rejects.toThrow('Insufficient disk space');
    });

    it('should throw FileSystemError on EACCES error', async () => {
      const validBuffer = Buffer.from([0x1f, 0x8b, 0x00, 0x00]);

      // Mock tar.extract to throw EACCES
      mockTar.extract = jest.fn().mockRejectedValue(Object.assign(new Error('EACCES'), { code: 'EACCES' }));

      await expect(extract(validBuffer)).rejects.toThrow(FileSystemError);
      await expect(extract(validBuffer)).rejects.toThrow('Permission denied');
    });

    it('should clean up temp directory on failure', async () => {
      const validBuffer = Buffer.from([0x1f, 0x8b, 0x00, 0x00]);

      // Mock tar.extract to throw error
      mockTar.extract = jest.fn().mockRejectedValue(new Error('Extraction failed'));

      await expect(extract(validBuffer)).rejects.toThrow();

      // Verify cleanup was attempted
      expect(mockFs.rm).toHaveBeenCalled();
    });

    it('should set file permissions after extraction', async () => {
      const validBuffer = Buffer.from([0x1f, 0x8b, 0x00, 0x00]);
      const options: IExtractionOptions = { force: true, verbose: true };

      // Mock readdir to return test files
      mockFs.readdir = jest.fn().mockResolvedValue([
        { name: 'SKILL.md', isDirectory: () => false },
        { name: 'docs', isDirectory: () => true },
      ] as fs.Dirent[]);

      await extract(validBuffer, options);

      expect(mockFs.chmod).toHaveBeenCalled();
    });

    it('should use local installation path when local=true', async () => {
      const validBuffer = Buffer.from([0x1f, 0x8b, 0x00, 0x00]);
      const options: IExtractionOptions = { force: true, local: true };

      // Mock readdir to return test files
      mockFs.readdir = jest.fn().mockResolvedValue([
        { name: 'SKILL.md', isDirectory: () => false },
      ] as fs.Dirent[]);

      const result = await extract(validBuffer, options);

      expect(result.installedPath).toContain('.claude');
      expect(result.installedPath).not.toContain('Users');
    });
  });
});

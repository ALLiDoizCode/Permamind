/**
 * Skill bundler module
 *
 * Creates compressed tar.gz archives of skill directories for upload to Arweave.
 * Handles file filtering, size validation, and progress reporting.
 *
 * @module lib/bundler
 */

import * as tar from 'tar';
import * as fs from 'fs/promises';
import * as path from 'path';
import { BundleOptions, BundleResult } from '../types/skill.js';
import { FileSystemError } from '../types/errors.js';

/**
 * Maximum bundle size in bytes (10MB)
 *
 * Bundles exceeding this size will emit a warning but still succeed
 */
const MAX_BUNDLE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * File and directory patterns to exclude from bundles
 *
 * These patterns are applied to all file paths during bundling:
 * - .git: Version control directory (security)
 * - node_modules: Dependencies directory (bloat prevention)
 * - .DS_Store: macOS metadata files
 * - Thumbs.db: Windows thumbnail cache
 */
const EXCLUDED_PATTERNS = ['.git', 'node_modules', '.DS_Store', 'Thumbs.db'];

/**
 * Default file filter for bundle creation
 *
 * Excludes:
 * - .git directory (version control)
 * - node_modules directory (dependencies)
 * - .DS_Store, Thumbs.db (OS metadata)
 * - Hidden files starting with '.' (except .skillsrc)
 *
 * @param filePath - Relative file path to check
 * @returns true if file should be included, false if excluded
 *
 * @example
 * ```typescript
 * shouldIncludeFile('SKILL.md') // true
 * shouldIncludeFile('.git/config') // false
 * shouldIncludeFile('.skillsrc') // true
 * shouldIncludeFile('node_modules/pkg/index.js') // false
 * ```
 */
function shouldIncludeFile(filePath: string): boolean {
  // Check against excluded patterns
  for (const pattern of EXCLUDED_PATTERNS) {
    if (filePath.includes(pattern)) {
      return false;
    }
  }

  // Parse path into segments
  const segments = filePath.split(path.sep);

  // Check each segment for hidden files (starting with '.')
  for (const segment of segments) {
    // Exclude hidden files/directories except .skillsrc
    if (segment.startsWith('.') && segment !== '.skillsrc') {
      return false;
    }
  }

  return true;
}

/**
 * Format bytes to human-readable size string
 *
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "5.2 MB", "1.8 KB")
 *
 * @example
 * ```typescript
 * formatSize(1024) // "1.0 KB"
 * formatSize(5242880) // "5.0 MB"
 * formatSize(512) // "512 bytes"
 * ```
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} bytes`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

/**
 * Create a compressed tar.gz bundle of a skill directory
 *
 * Bundles all files in the directory (recursively) while excluding:
 * - .git directory
 * - node_modules directory
 * - Hidden files (except .skillsrc)
 * - OS metadata files (.DS_Store, Thumbs.db)
 *
 * @param directory - Absolute path to skill directory
 * @param options - Optional bundling configuration
 * @returns Bundle result with buffer and metadata
 * @throws {FileSystemError} If directory doesn't exist or is unreadable
 *
 * @example
 * ```typescript
 * const result = await bundle('/path/to/skill', {
 *   compressionLevel: 9,
 *   onProgress: (p) => console.log(`${p.current}/${p.total}`)
 * });
 *
 * console.log(result.sizeFormatted); // "5.2 MB"
 * console.log(result.fileCount);     // 42
 * console.log(result.exceededLimit); // false
 * ```
 */
export async function bundle(
  directory: string,
  options?: BundleOptions
): Promise<BundleResult> {
  // Validate directory exists
  try {
    const stats = await fs.stat(directory);
    if (!stats.isDirectory()) {
      throw new FileSystemError(
        `Path is not a directory → Solution: Ensure ${path.basename(directory)} is a valid skill directory`,
        directory
      );
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new FileSystemError(
        `Directory not found → Solution: Ensure the skill directory exists at ${path.basename(directory)}`,
        directory
      );
    }
    if ((error as NodeJS.ErrnoException).code === 'EACCES') {
      throw new FileSystemError(
        `Permission denied → Solution: Ensure read permissions for ${path.basename(directory)}`,
        directory
      );
    }
    throw error;
  }

  // Get filter function (custom or default)
  const filterFn = options?.filter || shouldIncludeFile;

  // Recursively traverse directory and collect file paths
  const files: string[] = [];
  async function collectFiles(dir: string, basePath: string = ''): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const relativePath = path.join(basePath, entry.name);
      const fullPath = path.join(dir, entry.name);

      if (!filterFn(relativePath)) {
        continue; // Skip excluded files
      }

      if (entry.isDirectory()) {
        await collectFiles(fullPath, relativePath);
      } else {
        files.push(relativePath);
      }
    }
  }

  await collectFiles(directory);

  // Handle empty directory
  if (files.length === 0) {
    return {
      buffer: Buffer.alloc(0),
      size: 0,
      fileCount: 0,
      sizeFormatted: '0 bytes',
      exceededLimit: false,
    };
  }

  // Create tar.gz archive in memory
  const buffers: Buffer[] = [];
  const tarStream = tar.create(
    {
      gzip: true,
      cwd: directory,
      portable: true,
    },
    files
  );

  // Track progress
  let processedFiles = 0;
  const totalFiles = files.length;

  tarStream.on('data', (chunk: Buffer) => {
    buffers.push(chunk);

    // Invoke progress callback if provided
    if (options?.onProgress && processedFiles < totalFiles) {
      processedFiles++;
      options.onProgress({
        current: processedFiles,
        total: totalFiles,
        file: files[processedFiles - 1] || '',
      });
    }
  });

  // Wait for tar creation to complete
  await new Promise<void>((resolve, reject) => {
    tarStream.on('end', () => resolve());
    tarStream.on('error', (err) => reject(err));
  });

  // Concatenate all buffers into single buffer
  const buffer = Buffer.concat(buffers);
  const size = buffer.length;
  const sizeFormatted = formatSize(size);
  const exceededLimit = size > MAX_BUNDLE_SIZE;

  return {
    buffer,
    size,
    fileCount: totalFiles,
    sizeFormatted,
    exceededLimit,
  };
}

/**
 * Extract a tar.gz bundle to a target directory
 *
 * Used primarily for testing (round-trip validation) and future
 * install command implementation.
 *
 * Creates target directory if it doesn't exist.
 *
 * @param tarBuffer - Compressed tar.gz buffer to extract
 * @param targetPath - Directory to extract files into
 * @throws {FileSystemError} If extraction fails or permissions denied
 *
 * @example
 * ```typescript
 * const bundle = await bundle('/path/to/skill');
 * await extract(bundle.buffer, '/tmp/test-extract');
 * ```
 */
export async function extract(
  tarBuffer: Buffer,
  targetPath: string
): Promise<void> {
  // Create target directory if it doesn't exist
  try {
    await fs.mkdir(targetPath, { recursive: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EACCES') {
      throw new FileSystemError(
        `Permission denied → Solution: Ensure write permissions for ${path.basename(targetPath)}`,
        targetPath
      );
    }
    throw error;
  }

  // Extract tar.gz buffer to target directory
  try {
    // Write buffer to temporary file for extraction
    const tempFile = path.join(targetPath, '.temp-bundle.tar.gz');
    await fs.writeFile(tempFile, tarBuffer);

    // Extract from temporary file
    await tar.extract({
      cwd: targetPath,
      file: tempFile,
    });

    // Remove temporary file
    await fs.unlink(tempFile);
  } catch (error) {
    throw new FileSystemError(
      `Failed to extract bundle → Solution: Ensure the bundle is a valid tar.gz archive`,
      targetPath
    );
  }
}

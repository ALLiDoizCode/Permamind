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
import * as os from 'os';
import matter from 'gray-matter';
import { BundleOptions, BundleResult, IExtractionOptions, IExtractionResult } from '../types/skill.js';
import { FileSystemError, ValidationError, UserCancelledError } from '../types/errors.js';
import * as logger from '../utils/logger.js';
import * as readline from 'readline/promises';

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
 * Default file permissions for extracted files (rw-r--r--)
 */
const DEFAULT_FILE_PERMISSIONS = 0o644;

/**
 * Default directory permissions for extracted directories (rwxr-xr-x)
 */
const DEFAULT_DIR_PERMISSIONS = 0o755;

/**
 * Prefix for temporary extraction directories
 */
const TEMP_DIR_PREFIX = 'skill-install-';

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
      gzip: {
        level: options?.compressionLevel ?? 6, // Level 6 provides optimal balance of size vs speed
      },
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
 * Detect skill name from tar.gz bundle by peeking at SKILL.md frontmatter
 *
 * Extracts and parses the SKILL.md file from the bundle to determine the skill name
 * without fully extracting all files.
 *
 * @param tarBuffer - Compressed tar.gz buffer
 * @returns Skill name from SKILL.md frontmatter
 * @throws {ValidationError} If SKILL.md is missing or has invalid frontmatter
 *
 * @example
 * ```typescript
 * const skillName = await detectSkillName(tarBuffer);
 * console.log(skillName); // 'ao-basics'
 * ```
 */
export async function detectSkillName(tarBuffer: Buffer): Promise<string> {
  // Write buffer to temp file for tar extraction
  const tempFile = path.join(os.tmpdir(), `detect-skill-${Date.now()}.tar.gz`);
  const tempExtractDir = path.join(os.tmpdir(), `detect-extract-${Date.now()}`);

  try {
    await fs.writeFile(tempFile, tarBuffer);
    await fs.mkdir(tempExtractDir, { recursive: true });

    // Extract just SKILL.md file
    await tar.extract({
      file: tempFile,
      cwd: tempExtractDir,
      filter: (path) => path === 'SKILL.md',
    });

    // Read SKILL.md
    const skillMdPath = path.join(tempExtractDir, 'SKILL.md');
    const skillMdContent = await fs.readFile(skillMdPath, 'utf-8');

    // Parse frontmatter
    const parsed = matter(skillMdContent);
    const skillName = parsed.data.name as string;

    if (!skillName) {
      throw new ValidationError(
        'SKILL.md missing "name" field in frontmatter → Solution: Add name field to YAML frontmatter',
        'name',
        undefined
      );
    }

    return skillName;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError(
      'Bundle missing SKILL.md file → Solution: Ensure bundle was created correctly using the publish command',
      'bundle',
      'missing-manifest'
    );
  } finally {
    // Cleanup temp files
    await fs.unlink(tempFile).catch(() => {});
    await fs.rm(tempExtractDir, { recursive: true, force: true }).catch(() => {});
  }
}

/**
 * Resolve installation path for a skill
 *
 * Determines the target directory based on options and skill name:
 * - Custom targetDir: use as-is
 * - local=true: .claude/skills/<skill-name>/
 * - local=false: ~/.claude/skills/<skill-name>/ (default)
 *
 * @param skillName - Skill name from SKILL.md
 * @param options - Extraction options
 * @returns Absolute installation path
 *
 * @example
 * ```typescript
 * const path = resolveInstallPath('ao-basics', { local: false });
 * // Returns: '/Users/joe/.claude/skills/ao-basics'
 * ```
 */
export function resolveInstallPath(skillName: string, options: IExtractionOptions): string {
  // If custom targetDir provided, use it directly
  if (options.targetDir) {
    return path.resolve(options.targetDir);
  }

  // Determine base directory
  const baseDir = options.local
    ? path.join(process.cwd(), '.claude', 'skills')
    : path.join(os.homedir(), '.claude', 'skills');

  return path.join(baseDir, skillName);
}

/**
 * Validate bundle integrity
 *
 * Checks that:
 * - Buffer is valid tar.gz format
 * - SKILL.md exists in bundle root
 * - SKILL.md has valid YAML frontmatter with required fields
 *
 * @param tarBuffer - Compressed tar.gz buffer
 * @returns true if bundle is valid
 * @throws {ValidationError} If bundle is corrupted or invalid
 *
 * @example
 * ```typescript
 * await validateBundle(tarBuffer);
 * ```
 */
export async function validateBundle(tarBuffer: Buffer): Promise<boolean> {
  // Check buffer is not empty
  if (!tarBuffer || tarBuffer.length === 0) {
    throw new ValidationError(
      'Bundle is empty → Solution: Ensure a valid tar.gz file was downloaded',
      'bundle',
      'empty-buffer'
    );
  }

  // Check tar.gz magic bytes (1f 8b for gzip)
  if (tarBuffer[0] !== 0x1f || tarBuffer[1] !== 0x8b) {
    throw new ValidationError(
      'Bundle corrupted or invalid tar.gz format → Solution: Verify the Arweave TXID is correct. Try downloading again or use a different gateway',
      'bundle',
      'invalid-format'
    );
  }

  // Verify SKILL.md exists and has valid frontmatter
  await detectSkillName(tarBuffer);

  return true;
}

/**
 * Check available disk space
 *
 * Verifies sufficient space is available for extraction
 * Requires at least 2x bundle size to account for temp directory
 *
 * @param targetPath - Target installation path
 * @param requiredBytes - Required bytes (bundle size * 2)
 * @returns true if sufficient space available
 *
 * @example
 * ```typescript
 * const hasSpace = await checkDiskSpace('/path', 10485760);
 * ```
 */
export async function checkDiskSpace(targetPath: string, requiredBytes: number): Promise<boolean> {
  try {
    // Node.js 20+ has fs.statfs for disk space check
    if (typeof fs.statfs === 'function') {
      const stats = await fs.statfs(targetPath);
      const availableBytes = Number(stats.bavail) * Number(stats.bsize);

      if (availableBytes < requiredBytes) {
        logger.warn(
          `Low disk space: requires ${formatSize(requiredBytes)}, available: ${formatSize(availableBytes)}`
        );
        return false;
      }
      return true;
    } else {
      // Fallback for older Node versions - just warn
      logger.debug('Disk space check unavailable on this platform');
      return true;
    }
  } catch (error) {
    // Non-critical - log warning and continue
    logger.debug('Unable to check disk space', { error: (error as Error).message });
    return true;
  }
}

/**
 * Set file and directory permissions recursively
 *
 * Sets appropriate permissions on all extracted files and directories:
 * - Files: 0o644 (rw-r--r--)
 * - Directories: 0o755 (rwxr-xr-x)
 *
 * @param dirPath - Directory path to set permissions on
 *
 * @example
 * ```typescript
 * await setPermissionsRecursive('/path/to/skill');
 * ```
 */
async function setPermissionsRecursive(dirPath: string): Promise<void> {
  try {
    // Set directory permissions
    await fs.chmod(dirPath, DEFAULT_DIR_PERMISSIONS);

    // Get all entries
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        await setPermissionsRecursive(fullPath);
      } else {
        await fs.chmod(fullPath, DEFAULT_FILE_PERMISSIONS);
      }
    }
  } catch (error) {
    // Non-critical on Windows - log warning
    logger.warn(`Unable to set permissions on ${path.basename(dirPath)} (this is normal on Windows)`);
  }
}

/**
 * Count files in a directory recursively
 *
 * @param dirPath - Directory path
 * @returns Total number of files
 */
async function countFiles(dirPath: string): Promise<number> {
  let count = 0;
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      count += await countFiles(fullPath);
    } else {
      count++;
    }
  }

  return count;
}

/**
 * Prompt user for overwrite confirmation
 *
 * Interactive prompt asking user if they want to overwrite existing skill
 * Default answer is "no" (safer option)
 *
 * @param skillName - Name of skill being installed
 * @returns true if user confirms overwrite, false otherwise
 */
async function promptOverwrite(skillName: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const answer = await rl.question(`Skill '${skillName}' already installed. Overwrite? (y/N) `);
    return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
  } finally {
    rl.close();
  }
}

/**
 * Extract a tar.gz bundle to a target directory with atomic installation
 *
 * Implements full extraction workflow with:
 * - Skill name detection from bundle
 * - Installation path resolution
 * - Existing directory handling (prompt or force overwrite)
 * - Atomic extraction via temp directory
 * - File permissions setting
 * - Comprehensive error handling
 *
 * @param tarBuffer - Compressed tar.gz buffer to extract
 * @param options - Extraction options
 * @returns Extraction result with installation metadata
 * @throws {ValidationError} If bundle is corrupted or invalid
 * @throws {FileSystemError} If extraction fails or permissions denied
 * @throws {UserCancelledError} If user declines overwrite prompt
 *
 * @example
 * ```typescript
 * const result = await extract(tarBuffer, {
 *   force: false,
 *   verbose: true,
 *   local: false
 * });
 *
 * console.log(result.installedPath); // '/Users/joe/.claude/skills/ao-basics'
 * console.log(result.filesExtracted); // 42
 * console.log(result.skillName);     // 'ao-basics'
 * ```
 */
export async function extract(
  tarBuffer: Buffer,
  options: IExtractionOptions = {}
): Promise<IExtractionResult> {
  logger.info('Extracting bundle...');

  // Validate bundle integrity
  await validateBundle(tarBuffer);

  // Detect skill name from bundle
  const skillName = await detectSkillName(tarBuffer);
  logger.debug(`Detected skill name: ${skillName}`);

  // Resolve installation path
  const installPath = resolveInstallPath(skillName, options);
  logger.debug(`Installation path: ${installPath}`);

  // Check disk space (requires 2x bundle size for temp directory)
  const requiredSpace = tarBuffer.length * 2;
  const hasSpace = await checkDiskSpace(installPath, requiredSpace);
  if (!hasSpace) {
    throw new FileSystemError(
      `Insufficient disk space for installation (requires ${formatSize(requiredSpace)}) → Solution: Free up disk space and try again`,
      installPath
    );
  }

  // Check if skill already installed
  try {
    await fs.access(installPath);
    // Directory exists
    if (!options.force) {
      // Prompt user for confirmation
      const overwrite = await promptOverwrite(skillName);
      if (!overwrite) {
        throw new UserCancelledError('Installation cancelled by user');
      }
    }
    // Delete existing directory
    logger.debug(`Removing existing installation at ${installPath}`);
    await fs.rm(installPath, { recursive: true, force: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      // Re-throw if not "file not found"
      throw error;
    }
    // Directory doesn't exist - proceed with installation
  }

  // Generate unique temp directory
  const tempDir = path.join(
    os.tmpdir(),
    `${TEMP_DIR_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
  logger.debug(`Extracting to temp directory: ${tempDir}`);

  try {
    // Create temp directory
    await fs.mkdir(tempDir, { recursive: true });

    // Write buffer to temp file for tar extraction
    const tempTarFile = path.join(tempDir, 'bundle.tar.gz');
    await fs.writeFile(tempTarFile, tarBuffer);

    // Extract tar.gz to temp directory
    await tar.extract({
      file: tempTarFile,
      cwd: tempDir,
      strict: true, // Fail on errors
    });

    // Remove temp tar file (no longer needed)
    await fs.unlink(tempTarFile);

    // Verify SKILL.md exists at root of extraction
    const skillMdPath = path.join(tempDir, 'SKILL.md');
    try {
      await fs.access(skillMdPath);
    } catch {
      throw new ValidationError(
        'Bundle missing SKILL.md file → Solution: Ensure bundle was created correctly',
        'bundle',
        'missing-manifest'
      );
    }

    // Set permissions on all extracted files
    if (options.verbose) {
      logger.info('Setting file permissions...');
    }
    await setPermissionsRecursive(tempDir);

    // Ensure parent directory exists
    const parentDir = path.dirname(installPath);
    await fs.mkdir(parentDir, { recursive: true });

    // Atomically move temp directory to final location
    logger.debug(`Moving to final location: ${installPath}`);
    await fs.rename(tempDir, installPath);

    // Count extracted files
    const filesExtracted = await countFiles(installPath);

    logger.info(`Installed skill '${skillName}' to ${installPath}`);
    if (options.verbose) {
      logger.info(`Extracted ${filesExtracted} files`);
    }

    return {
      installedPath: installPath,
      filesExtracted,
      skillName,
    };
  } catch (error) {
    // Rollback: clean up temp directory on any error
    logger.debug('Extraction failed, cleaning up temp directory');
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});

    // Re-throw original error
    if (error instanceof ValidationError || error instanceof UserCancelledError) {
      throw error;
    }

    // Handle specific file system errors
    if ((error as NodeJS.ErrnoException).code === 'ENOSPC') {
      throw new FileSystemError(
        `Insufficient disk space for installation → Solution: Free up disk space and try again`,
        installPath
      );
    }

    if ((error as NodeJS.ErrnoException).code === 'EACCES' || (error as NodeJS.ErrnoException).code === 'EPERM') {
      throw new FileSystemError(
        `Permission denied writing to ${installPath} → Solution: Check directory permissions or try installing to a local directory using --local flag`,
        installPath
      );
    }

    // Generic file system error
    throw new FileSystemError(
      `Failed to extract bundle → Solution: ${(error as Error).message}`,
      installPath
    );
  }
}

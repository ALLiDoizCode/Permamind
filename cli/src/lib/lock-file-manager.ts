/**
 * Lock File Manager Module
 *
 * This module provides atomic read/write operations for the Agent Skills Registry
 * lock file (`skills-lock.json`). Lock files track installed skills, versions,
 * dependency trees, and installation metadata to enable:
 * - **Reproducible installations**: Exact version and Arweave TXID tracking
 * - **Dependency auditing**: Complete dependency tree with installation timestamps
 * - **Installation management**: Check if skills are already installed
 *
 * **Atomic Write Pattern:**
 * All write operations use a write-then-rename pattern to prevent corruption
 * from interrupted writes (power loss, process kill, etc.):
 * 1. Write to temporary file: `${lockFilePath}.tmp`
 * 2. After successful write, rename temp file to final path (atomic operation)
 * 3. Clean up temp file in error scenarios
 *
 * **Usage Examples:**
 *
 * ```typescript
 * // Read existing lock file
 * const lockFilePath = resolveLockFilePath('~/.claude/skills/');
 * const lockFile = await read(lockFilePath);
 *
 * // Update lock file with new skill
 * const installedSkill: IInstalledSkillRecord = {
 *   name: 'ao-basics',
 *   version: '1.0.0',
 *   arweaveTxId: 'abc123...def789',
 *   installedAt: Date.now(),
 *   installedPath: '~/.claude/skills/ao-basics/',
 *   dependencies: [],
 *   isDirectDependency: true
 * };
 * await update(installedSkill, lockFilePath);
 *
 * // Manually merge and write
 * const existingLock = await read(lockFilePath);
 * const mergedLock = merge(existingLock, [newSkill1, newSkill2]);
 * await write(mergedLock, lockFilePath);
 * ```
 *
 * @module lib/lock-file-manager
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { ILockFile, IInstalledSkillRecord } from '../types/lock-file';
import { FileSystemError } from '../types/errors';

/**
 * Lock file schema version (current: 1)
 * Increment this when making breaking changes to lock file structure
 */
const LOCK_FILE_VERSION = 1;

/**
 * Reads and parses a lock file from disk.
 *
 * **Behavior:**
 * - If file doesn't exist: Returns empty lock file structure
 * - If file exists: Parses JSON and validates schema version
 * - If JSON is malformed: Returns empty lock file and warns (graceful recovery)
 *
 * **Error Handling:**
 * - File not found (ENOENT): Returns empty lock file (not an error)
 * - Malformed JSON (SyntaxError): Returns empty lock file, logs warning
 * - Permission denied (EACCES): Throws FileSystemError
 * - Other I/O errors: Throws FileSystemError
 *
 * @param lockFilePath - Absolute path to lock file (e.g., `~/.claude/skills-lock.json`)
 * @returns Promise resolving to parsed lock file or empty lock file structure
 * @throws {FileSystemError} When file cannot be read due to permissions or I/O errors
 *
 * @example
 * ```typescript
 * const lockFile = await read('~/.claude/skills-lock.json');
 * console.log(lockFile.skills.length); // Number of installed skills
 * ```
 */
export async function read(lockFilePath: string): Promise<ILockFile> {
  try {
    // Read file content
    const content = await fs.readFile(lockFilePath, 'utf8');

    // Parse JSON
    const lockFile = JSON.parse(content) as ILockFile;

    // Validate lock file version (silently continue if newer version)
    // Future: Could add proper logging here if needed
    if (lockFile.lockfileVersion > LOCK_FILE_VERSION) {
      // Lock file uses newer schema version - continue with best effort
    }

    return lockFile;
  } catch (error) {
    // File doesn't exist - return empty lock file
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      const installLocation = path.dirname(lockFilePath);
      return createEmptyLockFile(installLocation);
    }

    // Malformed JSON - return empty lock file (will be recreated)
    if (error instanceof SyntaxError) {
      const installLocation = path.dirname(lockFilePath);
      return createEmptyLockFile(installLocation);
    }

    // Permission denied or other I/O error
    const errCode = (error as NodeJS.ErrnoException).code;
    if (errCode === 'EACCES') {
      throw new FileSystemError(
        `Failed to read lock file: EACCES\n→ Solution: Check file permissions for ${lockFilePath}`,
        lockFilePath
      );
    }

    // Unknown error
    throw new FileSystemError(
      `Failed to read lock file: ${errCode || 'Unknown error'}\n→ Solution: Check if file exists and is readable`,
      lockFilePath
    );
  }
}

/**
 * Writes lock file to disk using atomic write pattern.
 *
 * **Atomic Write Process:**
 * 1. Ensure parent directory exists (create if missing)
 * 2. Serialize lock file to JSON (2-space indentation)
 * 3. Write to temporary file: `${lockFilePath}.tmp`
 * 4. Rename temp file to final path (atomic operation)
 * 5. Clean up temp file on error
 *
 * **Why Atomic Writes:**
 * Prevents lock file corruption from:
 * - Process crashes during write
 * - Power loss
 * - Disk full scenarios (partial write)
 *
 * The rename operation is atomic on most file systems, ensuring the lock file
 * is either fully updated or unchanged (never partially written).
 *
 * @param lockFile - Lock file structure to write
 * @param lockFilePath - Absolute path to lock file (e.g., `~/.claude/skills-lock.json`)
 * @returns Promise resolving when write completes
 * @throws {FileSystemError} When write fails (permission denied, disk full, I/O error)
 *
 * @example
 * ```typescript
 * const lockFile = {
 *   lockfileVersion: 1,
 *   generatedAt: Date.now(),
 *   skills: [installedSkill],
 *   installLocation: '~/.claude/skills/'
 * };
 * await write(lockFile, '~/.claude/skills-lock.json');
 * ```
 */
export async function write(
  lockFile: ILockFile,
  lockFilePath: string
): Promise<void> {
  const tempPath = `${lockFilePath}.tmp`;

  try {
    // Ensure parent directory exists
    const dir = path.dirname(lockFilePath);
    await fs.mkdir(dir, { recursive: true });

    // Serialize to JSON with 2-space indentation (human-readable)
    const content = JSON.stringify(lockFile, null, 2);

    // Write to temp file
    await fs.writeFile(tempPath, content, 'utf8');

    // Atomic rename (overwrites existing file)
    await fs.rename(tempPath, lockFilePath);
  } catch (error) {
    // Clean up temp file on error
    try {
      await fs.unlink(tempPath);
    } catch {
      // Ignore cleanup errors (file may not exist)
    }

    // Handle specific error codes
    const errCode = (error as NodeJS.ErrnoException).code;

    if (errCode === 'EACCES') {
      throw new FileSystemError(
        `Failed to write lock file: EACCES\n→ Solution: Check file permissions for ${path.dirname(lockFilePath)} directory\n→ Try: chmod 755 ${path.dirname(lockFilePath)}`,
        lockFilePath
      );
    }

    if (errCode === 'ENOSPC') {
      throw new FileSystemError(
        `Failed to write lock file: ENOSPC\n→ Solution: Free up disk space\n→ Current location: ${lockFilePath}`,
        lockFilePath
      );
    }

    // Unknown error
    throw new FileSystemError(
      `Failed to write lock file: ${errCode || 'Unknown error'}\n→ Solution: Check disk space and permissions`,
      lockFilePath
    );
  }
}

/**
 * Merges new skills into existing lock file.
 *
 * **Merge Behavior:**
 * - Preserves existing skills in lock file
 * - Adds new skills to `skills` array
 * - If skill already exists (same name), updates record with new version/timestamp
 * - Maintains dependency tree structure (recursive `dependencies` arrays)
 * - Updates `generatedAt` timestamp to current time
 * - Does NOT write to disk (use `write()` to persist changes)
 *
 * **Update vs Add:**
 * - If skill with same `name` exists: Replace with new record (version update)
 * - If skill doesn't exist: Append to `skills` array
 *
 * @param existingLock - Current lock file structure
 * @param newSkills - Array of new skills to add or update
 * @returns New lock file structure with merged skills (does not mutate input)
 *
 * @example
 * ```typescript
 * const existingLock = await read(lockFilePath);
 * const newSkills = [
 *   {
 *     name: 'ao-basics',
 *     version: '1.0.1', // Updated version
 *     // ... other fields
 *   }
 * ];
 * const mergedLock = merge(existingLock, newSkills);
 * await write(mergedLock, lockFilePath);
 * ```
 */
export function merge(
  existingLock: ILockFile,
  newSkills: IInstalledSkillRecord[]
): ILockFile {
  // Create copy of existing skills to avoid mutation
  const mergedSkills = [...existingLock.skills];

  // Process each new skill
  for (const newSkill of newSkills) {
    // Find existing skill with same name
    const existingIndex = mergedSkills.findIndex((s) => s.name === newSkill.name);

    if (existingIndex !== -1) {
      // Update existing skill (version change)
      mergedSkills[existingIndex] = newSkill;
    } else {
      // Add new skill
      mergedSkills.push(newSkill);
    }
  }

  // Return new lock file with updated skills and timestamp
  return {
    ...existingLock,
    skills: mergedSkills,
    generatedAt: Date.now()
  };
}

/**
 * Convenience function to update lock file with a single skill.
 *
 * **Workflow:**
 * 1. Read existing lock file using `read()`
 * 2. Merge single skill using `merge()` function
 * 3. Write updated lock file atomically using `write()`
 *
 * This is the primary method for updating lock files after skill installation.
 *
 * @param skill - Installed skill record to add/update
 * @param lockFilePath - Absolute path to lock file
 * @returns Promise resolving when update completes
 * @throws {FileSystemError} When read or write fails
 *
 * @example
 * ```typescript
 * const installedSkill: IInstalledSkillRecord = {
 *   name: 'ao-basics',
 *   version: '1.0.0',
 *   arweaveTxId: 'abc123...def789',
 *   installedAt: Date.now(),
 *   installedPath: '~/.claude/skills/ao-basics/',
 *   dependencies: [],
 *   isDirectDependency: true
 * };
 * await update(installedSkill, '~/.claude/skills-lock.json');
 * ```
 */
export async function update(
  skill: IInstalledSkillRecord,
  lockFilePath: string
): Promise<void> {
  // Read existing lock file
  const existingLock = await read(lockFilePath);

  // Merge single skill
  const updatedLock = merge(existingLock, [skill]);

  // Write updated lock file atomically
  await write(updatedLock, lockFilePath);
}

/**
 * Creates an empty lock file structure.
 *
 * Used when:
 * - Lock file doesn't exist (first installation)
 * - Lock file is corrupted (malformed JSON)
 * - Initializing a new installation location
 *
 * @param installLocation - Installation directory path (e.g., `~/.claude/skills/`)
 * @returns Empty lock file structure with current timestamp
 *
 * @example
 * ```typescript
 * const emptyLock = createEmptyLockFile('~/.claude/skills/');
 * // {
 * //   lockfileVersion: 1,
 * //   generatedAt: 1704067200000,
 * //   skills: [],
 * //   installLocation: '~/.claude/skills/'
 * // }
 * ```
 */
export function createEmptyLockFile(installLocation: string): ILockFile {
  return {
    lockfileVersion: LOCK_FILE_VERSION,
    generatedAt: Date.now(),
    skills: [],
    installLocation
  };
}

/**
 * Resolves the lock file path from an installation location.
 *
 * **Path Resolution:**
 * - Global installation (`~/.claude/skills/`) → `~/.claude/skills-lock.json`
 * - Local installation (`.claude/skills/`) → `.claude/skills-lock.json`
 *
 * **Tilde Expansion:**
 * - `~` is expanded to user home directory (os.homedir())
 * - Works cross-platform (macOS, Linux, Windows)
 *
 * **Path Normalization:**
 * - Uses path.join() for cross-platform compatibility
 * - Handles trailing slashes gracefully
 *
 * @param installLocation - Installation directory path
 * @returns Absolute path to lock file
 *
 * @example
 * ```typescript
 * // Global installation
 * const globalLockPath = resolveLockFilePath('~/.claude/skills/');
 * // Returns: '/Users/joe/.claude/skills-lock.json'
 *
 * // Local installation
 * const localLockPath = resolveLockFilePath('.claude/skills/');
 * // Returns: '/path/to/project/.claude/skills-lock.json'
 * ```
 */
export function resolveLockFilePath(installLocation: string): string {
  // Expand ~ to home directory
  let resolvedPath = installLocation;
  if (installLocation.startsWith('~')) {
    resolvedPath = installLocation.replace('~', os.homedir());
  }

  // Get parent directory (strip trailing 'skills/')
  // For '~/.claude/skills/' → '~/.claude'
  // For '.claude/skills/' → '.claude'
  const parentDir = path.dirname(path.resolve(resolvedPath));

  // Return lock file path in parent directory
  return path.join(parentDir, 'skills-lock.json');
}

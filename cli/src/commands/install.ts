/**
 * Install command implementation
 * Handles skill installation with dependency resolution
 */

import { Command } from 'commander';
import * as path from 'path';
import * as os from 'os';
import { promises as fs } from 'fs';
import { Ora } from 'ora';
import { IInstallOptions, IInstallResult } from '../types/commands.js';
import { getSkill } from '../clients/ao-registry-client.js';
import { downloadBundle } from '../clients/arweave-client.js';
import { resolve as resolveDependencies } from '../lib/dependency-resolver.js';
import { extract as extractBundle } from '../lib/bundler.js';
import { update as updateLockFile, resolveLockFilePath } from '../lib/lock-file-manager.js';
import { ISkillMetadata } from '../types/skill.js';
import { IInstalledSkillRecord } from '../types/lock-file.js';
import { IDependencyNode } from '../types/dependency.js';
import { isInteractive } from '../utils/terminal.js';
import { createSpinner, INoOpSpinner } from '../utils/progress-factory.js';

/**
 * Installation phase messages
 */
const INSTALL_PHASES = {
  QUERY_REGISTRY: 'Querying registry...',
  RESOLVE_DEPENDENCIES: 'Resolving dependencies...',
  DOWNLOAD_BUNDLES: 'Downloading bundles...',
  INSTALL_FILES: 'Installing files...',
  UPDATE_LOCK_FILE: 'Updating lock file...',
  COMPLETE: 'Complete!'
} as const;

/**
 * Create the install command
 * @returns Commander.js Command instance
 */
export function createInstallCommand(): Command {
  const cmd = new Command('install');

  cmd
    .description('Install a skill and its dependencies')
    .argument('<name>', 'Name of skill to install')
    .option('--global', 'Install to ~/.claude/skills/ (default)', true)
    .option('--local', 'Install to .claude/skills/ (project-specific)')
    .option('--force', 'Overwrite existing installations without confirmation')
    .option('--verbose', 'Show detailed dependency tree and progress')
    .option('--no-lock', 'Skip lock file generation')
    .action(async (skillName: string, options: IInstallOptions) => {
      const interactive = isInteractive();
      let spinner: Ora | INoOpSpinner | undefined;

      try {
        // Validate mutually exclusive flags
        if (options.global === true && options.local === true) {
          spinner = createSpinner('', interactive);
          spinner.fail(
            'Cannot use both --global and --local flags → Solution: Choose one installation location'
          );
          process.exit(1);
          return;
        }

        await execute(skillName, options);
        process.exit(0);
      } catch (error) {
        if (!spinner) {
          spinner = createSpinner('', interactive);
        }
        spinner.fail(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  return cmd;
}

/**
 * Resolve installation location based on options
 * @param options - Install options
 * @returns Absolute path to installation directory
 */
export function resolveInstallLocation(options: IInstallOptions): string {
  if (options.local === true) {
    return path.join(process.cwd(), '.claude', 'skills');
  }

  // Default to global
  return path.join(os.homedir(), '.claude', 'skills');
}

/**
 * Execute skill installation
 * @param skillName - Name of skill to install
 * @param options - Installation options
 * @returns Installation result with metrics
 */
export async function execute(
  skillName: string,
  options: IInstallOptions
): Promise<IInstallResult> {
  const startTime = performance.now();
  const interactive = isInteractive();
  let spinner: Ora | INoOpSpinner | undefined;

  try {
    // Task 3: Resolve installation location
    const installLocation = resolveInstallLocation(options);

    // Validate installation directory is writable
    try {
      await fs.mkdir(installLocation, { recursive: true });
      await fs.access(installLocation, fs.constants.W_OK);
    } catch (error) {
      throw new Error(
        `Permission denied writing to ${installLocation}\n` +
        `→ Solution: Check directory permissions\n` +
        `→ Try: chmod 755 ${installLocation} or use --local flag for project installation`
      );
    }

    // Task 9: Installation progress indicators
    spinner = createSpinner(INSTALL_PHASES.QUERY_REGISTRY, interactive);

    // Task 4: Query registry for skill metadata
    const metadataOrNull = await getSkill(skillName);

    if (metadataOrNull === null) {
      spinner.fail();
      throw new Error(
        `Skill '${skillName}' not found in registry\n` +
        `→ Solution: Run 'skills search ${skillName}' to find available skills\n` +
        `→ Try: Check skill name spelling`
      );
    }

    // Type narrowing: metadataOrNull is confirmed to be ISkillMetadata here
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- getSkill return type is ISkillMetadata | null, narrowed by null check above
    const metadata = metadataOrNull as ISkillMetadata;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Type narrowed to ISkillMetadata
    spinner.succeed(`Found ${metadata.name}@${metadata.version}`);

    // Task 5: Resolve dependencies
    spinner = createSpinner(INSTALL_PHASES.RESOLVE_DEPENDENCIES, interactive);

    try {
      const tree = await resolveDependencies(skillName, {
        maxDepth: 10,
        skipInstalled: options.force !== true,
        verbose: options.verbose === true
      });

      if (options.verbose === true && tree.flatList.length > 0) {
        spinner.info('Dependency Tree:');
        tree.flatList.forEach((node: IDependencyNode) => {
          const indent = '  '.repeat(node.depth);
          const treeSpinner = createSpinner(`${indent}${node.name}@${node.version}`, interactive);
          treeSpinner.info();
        });
      }

      spinner.succeed(`Resolved ${tree.flatList.length} total packages`);

      // Task 6: Download bundles with progress
      const bundlesToInstall = tree.flatList;
      const installedSkills: string[] = [];
      let totalSize = 0;

      for (let i = 0; i < bundlesToInstall.length; i++) {
        const node = bundlesToInstall[i];
        const skillMetadata = await getSkill(node.name);

        if (!skillMetadata) {
          spinner = createSpinner('', interactive);
          spinner.fail(`Skill '${node.name}' metadata not found`);
          continue;
        }

        spinner = createSpinner(`Downloading ${node.name}@${node.version} (${i + 1}/${bundlesToInstall.length})`, interactive);

        const progressCallback = (progress: number): void => {
          spinner!.text = `Downloading ${node.name}@${node.version} (${Math.round(progress)}%)`;
        };

        let buffer: Buffer;
        try {
          buffer = await downloadBundle(skillMetadata.arweaveTxId, { progressCallback });
        } catch (error) {
          spinner.fail();
          throw new Error(
            `Failed to download bundle from Arweave\n` +
            `→ Solution: Check internet connection and retry\n` +
            `→ Try: Use alternative gateway via .skillsrc config`
          );
        }

        totalSize += buffer.length;
        spinner.succeed(`Downloaded ${node.name}@${node.version} (${(buffer.length / 1024).toFixed(2)} KB)`);

        // Task 7: Extract bundle
        spinner = createSpinner(`Installing ${node.name}@${node.version}...`, interactive);

        const targetDir = path.join(installLocation, node.name);

        // Check if skill already installed
        try {
          await fs.access(path.join(targetDir, 'SKILL.md'));

          if (options.force !== true) {
            spinner.warn(`Skill '${node.name}' already installed. Use --force to overwrite.`);
            continue;
          }
        } catch {
          // Skill not installed, proceed
        }

        try {
          await extractBundle(buffer, {
            targetDir,
            force: options.force === true,
            verbose: options.verbose === true
          });
        } catch (error) {
          spinner.fail();
          throw new Error(
            `Failed to extract bundle\n` +
            `→ Solution: Check disk space and permissions\n` +
            `→ Error: ${error instanceof Error ? error.message : String(error)}`
          );
        }

        spinner.succeed(`Installed ${node.name}@${node.version}`);
        installedSkills.push(`${node.name}@${node.version}`);

        // Task 8: Update lock file
        if (options.noLock !== true) {
          try {
            const lockFilePath = resolveLockFilePath(installLocation);
            const installedRecord: IInstalledSkillRecord = {
              name: node.name,
              version: node.version,
              arweaveTxId: skillMetadata.arweaveTxId,
              installedAt: Date.now(),
              installedPath: targetDir,
              dependencies: node.dependencies.map((dep: IDependencyNode) => ({
                name: dep.name,
                version: dep.version,
                arweaveTxId: '', // Will be filled during resolution
                installedAt: 0,
                installedPath: '',
                dependencies: [],
                isDirectDependency: false
              })),
              isDirectDependency: i === bundlesToInstall.length - 1 // Last item is root skill
            };

            await updateLockFile(installedRecord, lockFilePath);
          } catch (error) {
            // Graceful degradation - warn but don't fail installation
            if (options.verbose === true) {
              const warnSpinner = createSpinner(`Failed to update lock file: ${error instanceof Error ? error.message : String(error)}`, interactive);
              warnSpinner.warn();
            }
          }
        }
      }

      // Task 10: Success message
      const elapsedTime = (performance.now() - startTime) / 1000;
      const dependencyCount = installedSkills.length - 1; // Exclude root skill

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Type narrowed to ISkillMetadata earlier
      spinner = createSpinner(`Success: Installed ${metadata.name}@${metadata.version} with ${dependencyCount} dependencies in ${elapsedTime.toFixed(2)}s`, interactive);
      spinner.succeed();

      const locationSpinner = createSpinner(`Location: ${installLocation}`, interactive);
      locationSpinner.info();

      if (options.verbose === true && installedSkills.length > 0) {
        const packagesSpinner = createSpinner('Installed packages:', interactive);
        packagesSpinner.info();
        installedSkills.forEach((skill: string) => {
          const skillSpinner = createSpinner(`  - ${skill}`, interactive);
          skillSpinner.info();
        });
      }

      return {
        installedSkills,
        dependencyCount,
        totalSize,
        elapsedTime
      };

    } catch (error) {
      if (spinner !== undefined) {
        spinner.fail();
      }

      // Task 11: Error handling
      if (error instanceof Error) {
        if (error.message.includes('Circular dependency')) {
          throw new Error(
            `Circular dependency detected\n` +
            `→ Solution: Contact skill author to fix dependency cycle\n` +
            `→ Report: File issue at skill repository`
          );
        }

        if (error.message.includes('ENOSPC')) {
          throw new Error(
            `Insufficient disk space for installation\n` +
            `→ Solution: Free up disk space or use different installation directory`
          );
        }
      }

      throw error;
    }
  } catch (error) {
    if (spinner !== undefined) {
      spinner.fail();
    }
    throw error;
  }
}

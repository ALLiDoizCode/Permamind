/**
 * Install command implementation
 * Handles skill installation with dependency resolution
 *
 * This module provides a thin CLI wrapper around InstallService,
 * mapping service progress callbacks to ora spinners and handling
 * CLI-specific presentation concerns.
 */

import { Command } from 'commander';
import * as path from 'path';
import * as os from 'os';
import { Ora } from 'ora';
import { IInstallOptions, IInstallResult } from '../types/commands.js';
import { InstallService, IInstallServiceOptions, InstallProgressEvent } from '../lib/install-service.js';
import { isInteractive } from '../utils/terminal.js';
import { createSpinner, INoOpSpinner } from '../utils/progress-factory.js';

/**
 * Create the install command
 * @returns Commander.js Command instance
 */
export function createInstallCommand(): Command {
  const cmd = new Command('install');

  cmd
    .description('Install a skill and its dependencies')
    .argument('<name>', 'Name of skill to install (supports name@version format)')
    .option('-g, --global', 'Install to ~/.claude/skills/ (global)')
    .option('--force', 'Overwrite existing installations without confirmation')
    .option('--verbose', 'Show detailed dependency tree and progress')
    .option('--no-lock', 'Skip lock file generation')
    .addHelpText(
      'after',
      `
Examples:
  $ skills install ao-basics
    Install latest version to local project directory

  $ skills install ao-basics@1.0.0
    Install specific version

  $ skills install arweave-fundamentals -g
    Install to global directory (~/.claude/skills/)

  $ skills install permamind-integration@2.1.0 --force
    Force install specific version, overwriting existing

  $ skills install cli-development --verbose
    Show detailed dependency tree and installation progress

  $ skills install agent-skills-best-practices --no-lock
    Install without updating skills-lock.json

  $ skills install ao-basics@1.2.0 --global --verbose
    Combine options: specific version, global install, verbose output

Workflow:
  1. Searches AO registry for skill by name
  2. Downloads skill bundle from Arweave
  3. Resolves and installs all dependencies recursively
  4. Extracts files to installation directory
  5. Updates skills-lock.json (unless --no-lock specified)
  6. Displays success message with installation path

Documentation:
  Troubleshooting: https://github.com/permamind/skills/blob/main/docs/troubleshooting.md
`,
    )
    .action(async (skillName: string, options: IInstallOptions) => {
      const interactive = isInteractive();
      let spinner: Ora | INoOpSpinner | undefined;

      try {
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
  // If --global flag is explicitly set, use global directory
  if (options.global === true) {
    return path.join(os.homedir(), '.claude', 'skills');
  }

  // Default to local (project-specific)
  return path.join(process.cwd(), '.claude', 'skills');
}

/**
 * Execute skill installation using InstallService
 * @param skillName - Name of skill to install
 * @param options - Installation options
 * @returns Installation result with metrics
 */
export async function execute(
  skillNameWithVersion: string,
  options: IInstallOptions
): Promise<IInstallResult> {
  const interactive = isInteractive();
  let spinner: Ora | INoOpSpinner | undefined;
  let lastEventType: string | undefined;

  // Resolve installation location for display purposes
  const installLocation = resolveInstallLocation(options);

  // Map CLI options to service options
  const serviceOptions: IInstallServiceOptions = {
    global: options.global,
    force: options.force,
    verbose: options.verbose,
    noLock: options.noLock,

    // Progress callback maps service events to ora spinners
    progressCallback: (event: InstallProgressEvent) => {
      // Handle different event types
      if (event.type === 'query-registry') {
        if (spinner) {
          spinner.succeed();
        }
        spinner = createSpinner(event.message, interactive);
      } else if (event.type === 'resolve-dependencies') {
        if (spinner) {
          spinner.succeed();
        }
        spinner = createSpinner(event.message, interactive);
      } else if (event.type === 'download-bundle') {
        // Download bundle events have nested progress (percentage)
        if (lastEventType !== 'download-bundle' || !spinner) {
          if (spinner) {
            spinner.succeed();
          }
          spinner = createSpinner(event.message, interactive);
        } else {
          // Update existing spinner with percentage if available
          if (spinner) {
            if (event.percent !== undefined) {
              spinner.text = `${event.message} (${Math.round(event.percent)}%)`;
            } else {
              spinner.text = event.message;
            }
          }
        }
      } else if (event.type === 'extract-bundle') {
        if (spinner) {
          spinner.succeed();
        }
        spinner = createSpinner(event.message, interactive);
      } else if (event.type === 'update-lock-file') {
        if (event.message.includes('Warning:')) {
          // Warning message - show as warning
          if (options.verbose === true && spinner) {
            const warnSpinner = createSpinner(event.message, interactive);
            warnSpinner.warn();
          }
        } else {
          // Normal lock file update message
          if (spinner && lastEventType !== 'update-lock-file') {
            spinner.succeed();
          }
        }
      } else if (event.type === 'complete') {
        if (spinner) {
          spinner.succeed();
        }
      }

      lastEventType = event.type;
    },
  };

  try {
    // Call InstallService
    const service = new InstallService();
    const result = await service.install(skillNameWithVersion, serviceOptions);

    // Display final success message (CLI presentation responsibility)
    if (spinner) {
      spinner.succeed();
    }

    // Extract skill name and version from first installed skill for success message
    const firstSkill = result.installedSkills[result.installedSkills.length - 1]; // Last is root
    const successMessage = `Success: Installed ${firstSkill} with ${result.dependencyCount} dependencies in ${result.elapsedTime.toFixed(2)}s`;
    spinner = createSpinner(successMessage, interactive);
    spinner.succeed();

    // Show installation location
    const locationSpinner = createSpinner(`Location: ${installLocation}`, interactive);
    locationSpinner.info();

    // Show verbose package list if requested
    if (options.verbose === true && result.installedSkills.length > 0) {
      const packagesSpinner = createSpinner('Installed packages:', interactive);
      packagesSpinner.info();
      result.installedSkills.forEach((skill: string) => {
        const skillSpinner = createSpinner(`  - ${skill}`, interactive);
        skillSpinner.info();
      });
    }

    return result;
  } catch (error) {
    // Let service errors propagate (they're already formatted with solutions)
    if (spinner) {
      spinner.fail();
    }
    throw error;
  }
}

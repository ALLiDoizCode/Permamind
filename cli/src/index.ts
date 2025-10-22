#!/usr/bin/env node

/**
 * Agent Skills CLI
 * Entry point for the CLI tool
 *
 * Performance optimization: Lazy-loads commands and banner only when needed
 * to minimize startup time for --help and --version commands.
 */

import { Command } from 'commander';

// Initialize Commander program
const program = new Command();

program
  .name('skills')
  .description('CLI tool for publishing, searching, and installing Claude Agent Skills')
  .version('0.1.0')
  .option('--no-banner', 'Suppress ASCII banner display');

// Add comprehensive help text with documentation links and examples
program.addHelpText(
  'after',
  `
Documentation:
  Full documentation: https://github.com/permamind/skills#readme
  Troubleshooting:    https://github.com/permamind/skills/blob/main/docs/troubleshooting.md
  Contributing:       https://github.com/permamind/skills/blob/main/docs/CONTRIBUTING.md

Examples:
  $ skills search arweave              # Search for skills by keyword
  $ skills install ao-basics           # Install a skill
  $ skills publish ./my-skill          # Publish a skill to Arweave
  $ skills --help                      # Show this help message
  $ skills <command> --help            # Show help for a specific command
`,
);

// Lazy-load commands - only import and register when needed
// Check if --help or --version requested (skip banner and command loading for speed)
const isHelpOrVersion =
  process.argv.includes('--help') ||
  process.argv.includes('-h') ||
  process.argv.includes('--version') ||
  process.argv.includes('-V') ||
  process.argv.length <= 2;

// Use IIFE to support dynamic imports with async/await
(async () => {
  if (!isHelpOrVersion) {
    // Only show banner and load commands if actually executing a command
    const shouldShowBanner = !process.argv.includes('--no-banner');

    if (shouldShowBanner) {
      // Lazy-load banner only when needed
      const { displayBanner } = await import('./lib/banner.js');
      displayBanner();
    }

    // Lazy-load command modules only when needed
    const { createPublishCommand } = await import('./commands/publish.js');
    const { createInstallCommand } = await import('./commands/install.js');
    const { createSearchCommand } = await import('./commands/search.js');

    // Register commands
    program.addCommand(createPublishCommand());
    program.addCommand(createSearchCommand());
    program.addCommand(createInstallCommand());
  }

  // Parse command-line arguments
  program.parse(process.argv);
})();

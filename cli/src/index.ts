#!/usr/bin/env node

/**
 * Agent Skills CLI
 * Entry point for the CLI tool
 *
 * Performance optimization: Lazy-loads commands and banner only when needed
 * to minimize startup time for --help and --version commands.
 */

import { config } from 'dotenv';
import { Command } from 'commander';
import packageJson from '../package.json' with { type: 'json' };

// Load .env file for environment variable configuration
config();

// Initialize Commander program
const program = new Command();

program
  .name('skills')
  .description('CLI tool for publishing, searching, and installing Claude Agent Skills')
  .version(packageJson.version)
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

// Use IIFE to support dynamic imports with async/await
(async (): Promise<void> => {
  // Show banner by default unless --no-banner is specified
  const shouldShowBanner = !process.argv.includes('--no-banner');

  if (shouldShowBanner) {
    // Lazy-load banner only when needed
    const { displayBanner } = await import('./lib/banner.js');
    displayBanner();
  }

  // Lazy-load command modules
  const { createPublishCommand } = await import('./commands/publish.js');
  const { createInstallCommand } = await import('./commands/install.js');
  const { createSearchCommand } = await import('./commands/search.js');

  // Register commands
  program.addCommand(createPublishCommand());
  program.addCommand(createSearchCommand());
  program.addCommand(createInstallCommand());

  // Parse command-line arguments
  program.parse(process.argv);
})().catch((error: Error) => {
  // eslint-disable-next-line no-console
  console.error('Fatal error during CLI initialization:', error.message);
  process.exit(1);
});

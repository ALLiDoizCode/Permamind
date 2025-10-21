#!/usr/bin/env node

/**
 * Agent Skills CLI
 * Entry point for the CLI tool
 */

import { Command } from 'commander';
import { createPublishCommand } from './commands/publish.js';

// Initialize Commander program
const program = new Command();

program
  .name('agent-skills')
  .description('CLI tool for publishing, searching, and installing Claude Agent Skills')
  .version('0.1.0');

// Register publish command
program.addCommand(createPublishCommand());

// Parse command-line arguments
program.parse(process.argv);

/**
 * Global Help Text Integration Tests
 *
 * Tests global `skills --help` output to ensure:
 * - All commands are listed
 * - Documentation links are included
 * - Help text is concise and complete
 */

import { execSync } from 'child_process';
import { join } from 'path';

describe('Global Help Text', () => {
  const cliPath = join(__dirname, '../../../dist/index.js');

  it('should display all commands when --help is used', () => {
    const output = execSync(`node ${cliPath} --no-banner --help`, {
      encoding: 'utf-8',
    });

    // Verify command list
    expect(output).toContain('publish');
    expect(output).toContain('search');
    expect(output).toContain('install');

    // Verify command descriptions
    expect(output).toContain('Publish a skill to Arweave');
    expect(output).toContain('Search for skills');
    expect(output).toContain('Install a skill');
  });

  it('should display documentation links in help output', () => {
    const output = execSync(`node ${cliPath} --no-banner --help`, {
      encoding: 'utf-8',
    });

    // Verify documentation links
    expect(output).toContain('Full documentation:');
    expect(output).toContain('https://github.com/permamind/skills#readme');
    expect(output).toContain('Troubleshooting:');
    expect(output).toContain(
      'https://github.com/permamind/skills/blob/main/docs/troubleshooting.md',
    );
    expect(output).toContain('Contributing:');
    expect(output).toContain(
      'https://github.com/permamind/skills/blob/main/docs/CONTRIBUTING.md',
    );
  });

  it('should display usage examples', () => {
    const output = execSync(`node ${cliPath} --no-banner --help`, {
      encoding: 'utf-8',
    });

    // Verify examples section
    expect(output).toContain('Examples:');
    expect(output).toContain('skills search arweave');
    expect(output).toContain('skills install ao-basics');
    expect(output).toContain('skills publish ./my-skill');
  });

  it('should display version when --version is used', () => {
    const output = execSync(`node ${cliPath} --no-banner --version`, {
      encoding: 'utf-8',
    });
    // Should match semver pattern (e.g., 0.1.0) without banner
    expect(output.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('should have concise help text under 500 lines', () => {
    const output = execSync(`node ${cliPath} --no-banner --help`, {
      encoding: 'utf-8',
    });

    const lineCount = output.split('\n').length;
    expect(lineCount).toBeLessThan(500);
  });

  it('should include --no-banner option in help', () => {
    const output = execSync(`node ${cliPath} --no-banner --help`, {
      encoding: 'utf-8',
    });

    expect(output).toContain('--no-banner');
    expect(output).toContain('Suppress ASCII banner display');
  });
});

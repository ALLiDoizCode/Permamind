/**
 * ASCII Banner Display Integration Tests
 *
 * Tests banner display functionality:
 * - Banner displays by default
 * - Banner is suppressed with --no-banner
 * - Banner shows correct version
 * - Banner uses ASCII-only characters
 */

import { execSync } from 'child_process';
import { join } from 'path';
import { readFileSync } from 'fs';

describe('ASCII Banner Display', () => {
  const cliPath = join(__dirname, '../../../dist/index.js');
  const packageJsonPath = join(__dirname, '../../../package.json');

  describe('Banner Display', () => {
    it('should display banner by default with help command', () => {
      const output = execSync(`node ${cliPath} --help`, { encoding: 'utf-8' });

      // Banner should contain the CLI name (Skills)
      expect(output).toMatch(/___.*_/); // ASCII art pattern
      expect(output).toContain('Skills'); // Part of banner
      expect(output).toContain('Agent Skills Registry CLI'); // Tagline
    });

    it('should display version from package.json in banner', () => {
      const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const output = execSync(`node ${cliPath} --help`, { encoding: 'utf-8' });

      expect(output).toContain(`v${pkg.version}`);
    });

    it('should suppress banner with --no-banner flag', () => {
      const output = execSync(`node ${cliPath} --no-banner --help`, {
        encoding: 'utf-8',
      });

      // Banner ASCII art should NOT be present
      expect(output).not.toMatch(/___.*_.*Skills/s);
      // But help content should still be there
      expect(output).toContain('Usage:');
      expect(output).toContain('Options:');
    });

    it('should use ASCII-only characters in banner', () => {
      const output = execSync(`node ${cliPath} --help`, { encoding: 'utf-8' });

      // Extract the banner portion (before "Usage:")
      const bannerPortion = output.split('Usage:')[0];

      // Check that banner only uses ASCII characters (0x00-0x7F)
      // Allow for ANSI color codes (which are ASCII)
      const withoutAnsi = bannerPortion.replace(/\x1b\[[0-9;]*m/g, '');

      // Every character should be ASCII (code <= 127)
      for (let i = 0; i < withoutAnsi.length; i++) {
        const charCode = withoutAnsi.charCodeAt(i);
        expect(charCode).toBeLessThanOrEqual(127);
      }
    });
  });

  describe('Banner Behavior with Commands', () => {
    it('should display banner with publish help', () => {
      const output = execSync(`node ${cliPath} publish --help`, {
        encoding: 'utf-8',
      });

      expect(output).toMatch(/___.*_/); // ASCII art pattern
      expect(output).toContain('Agent Skills Registry CLI');
    });

    it('should suppress banner with publish help when --no-banner used', () => {
      const output = execSync(`node ${cliPath} --no-banner publish --help`, {
        encoding: 'utf-8',
      });

      expect(output).not.toMatch(/___.*_.*Skills/s);
      expect(output).toContain('Usage:');
    });

    it('should display banner with search help', () => {
      const output = execSync(`node ${cliPath} search --help`, {
        encoding: 'utf-8',
      });

      expect(output).toMatch(/___.*_/);
      expect(output).toContain('Agent Skills Registry CLI');
    });

    it('should display banner with install help', () => {
      const output = execSync(`node ${cliPath} install --help`, {
        encoding: 'utf-8',
      });

      expect(output).toMatch(/___.*_/);
      expect(output).toContain('Agent Skills Registry CLI');
    });
  });

  describe('Banner Integration with Version Command', () => {
    it('should display banner with --version command', () => {
      const output = execSync(`node ${cliPath} --version`, {
        encoding: 'utf-8',
      });

      // Version command should show banner and version
      expect(output).toMatch(/___.*_/);
    });

    it('should suppress banner with --no-banner --version', () => {
      const output = execSync(`node ${cliPath} --no-banner --version`, {
        encoding: 'utf-8',
      });

      // Should show version but not banner
      expect(output).not.toMatch(/___.*_.*Skills/s);
      expect(output.trim()).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('Cross-Platform Compatibility', () => {
    it('should fit within 80-column terminal width', () => {
      const output = execSync(`node ${cliPath} --help`, { encoding: 'utf-8' });

      // Extract banner (before "Usage:")
      const bannerLines = output.split('Usage:')[0].split('\n');

      // Remove ANSI codes for accurate length measurement
      bannerLines.forEach((line) => {
        const withoutAnsi = line.replace(/\x1b\[[0-9;]*m/g, '');
        // Banner lines should fit in 80 columns
        expect(withoutAnsi.length).toBeLessThanOrEqual(80);
      });
    });

    it('should not cause rendering issues with special characters', () => {
      const output = execSync(`node ${cliPath} --help`, { encoding: 'utf-8' });

      // Should not contain problematic characters that break terminals
      expect(output).not.toContain('\x00'); // Null byte
      expect(output).not.toMatch(/[\x80-\xFF]/); // Non-ASCII (except ANSI codes)
    });
  });
});

/**
 * Command-Specific Help Text Integration Tests
 *
 * Tests command help output for:
 * - publish --help
 * - search --help
 * - install --help
 */

import { execSync } from 'child_process';
import { join } from 'path';

describe('Command-Specific Help Text', () => {
  const cliPath = join(__dirname, '../../../dist/index.js');

  describe('Publish Command Help', () => {
    let output: string;

    beforeAll(() => {
      output = execSync(`node ${cliPath} publish --help`, { encoding: 'utf-8' });
    });

    it('should display all publish command flags', () => {
      expect(output).toContain('--wallet');
      expect(output).toContain('--verbose');
      expect(output).toContain('--gateway');
    });

    it('should display examples for common publish workflows', () => {
      expect(output).toContain('Examples:');
      expect(output).toMatch(/skills publish.*my-skill/);
      expect(output).toMatch(/--wallet.*custom-wallet\.json/);
      expect(output).toMatch(/--gateway.*g8way\.io/);
      expect(output).toContain('--verbose');
    });

    it('should display workflow steps', () => {
      expect(output).toContain('Workflow:');
      expect(output).toContain('Validates');
      expect(output).toContain('bundle');
      expect(output).toContain('Arweave');
      expect(output).toContain('registry');
    });

    it('should include troubleshooting link', () => {
      expect(output).toContain('Documentation:');
      expect(output).toContain('Troubleshooting:');
      expect(output).toContain('troubleshooting.md');
    });
  });

  describe('Search Command Help', () => {
    let output: string;

    beforeAll(() => {
      output = execSync(`node ${cliPath} search --help`, { encoding: 'utf-8' });
    });

    it('should display all search command flags', () => {
      expect(output).toContain('--tag');
      expect(output).toContain('--json');
      expect(output).toContain('--verbose');
    });

    it('should display examples for search workflows', () => {
      expect(output).toContain('Examples:');
      expect(output).toMatch(/skills search.*arweave/);
      expect(output).toContain('--tag');
      expect(output).toContain('--json');
    });

    it('should explain tag filtering logic', () => {
      expect(output).toContain('Tag Filtering:');
      expect(output).toContain('AND logic');
    });

    it('should include troubleshooting link', () => {
      expect(output).toContain('Documentation:');
      expect(output).toContain('troubleshooting.md');
    });
  });

  describe('Install Command Help', () => {
    let output: string;

    beforeAll(() => {
      output = execSync(`node ${cliPath} install --help`, { encoding: 'utf-8' });
    });

    it('should display all install command flags', () => {
      expect(output).toContain('--global');
      expect(output).toContain('--local');
      expect(output).toContain('--force');
      expect(output).toContain('--verbose');
      expect(output).toContain('--no-lock');
    });

    it('should display examples for install workflows', () => {
      expect(output).toContain('Examples:');
      expect(output).toMatch(/skills install.*ao-basics/);
      expect(output).toContain('--local');
      expect(output).toContain('--force');
      expect(output).toContain('--verbose');
    });

    it('should display workflow steps', () => {
      expect(output).toContain('Workflow:');
      expect(output).toContain('Searches');
      expect(output).toContain('Downloads');
      expect(output).toContain('dependencies');
      expect(output).toContain('installation');
    });

    it('should include troubleshooting link', () => {
      expect(output).toContain('Documentation:');
      expect(output).toContain('troubleshooting.md');
    });
  });

  describe('Help Text Quality', () => {
    it('should have concise publish help under 200 lines', () => {
      const output = execSync(`node ${cliPath} publish --help`, {
        encoding: 'utf-8',
      });
      const lineCount = output.split('\n').length;
      expect(lineCount).toBeLessThan(200);
    });

    it('should have concise search help under 200 lines', () => {
      const output = execSync(`node ${cliPath} search --help`, {
        encoding: 'utf-8',
      });
      const lineCount = output.split('\n').length;
      expect(lineCount).toBeLessThan(200);
    });

    it('should have concise install help under 200 lines', () => {
      const output = execSync(`node ${cliPath} install --help`, {
        encoding: 'utf-8',
      });
      const lineCount = output.split('\n').length;
      expect(lineCount).toBeLessThan(200);
    });
  });
});

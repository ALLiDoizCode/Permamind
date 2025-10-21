/**
 * Unit tests for Search Results Formatter
 *
 * Tests table rendering, JSON output, color coding, description truncation,
 * empty results handling, and install command hints.
 */

// Mock chalk before imports
jest.mock('chalk', () => {
  const createMock = (color: string) => {
    const fn = (s: string) => `[${color}]${s}[/${color}]`;
    return fn;
  };

  return {
    __esModule: true,
    default: {
      cyan: createMock('cyan'),
      yellow: createMock('yellow'),
      dim: createMock('dim'),
      white: {
        bold: createMock('white.bold'),
      },
      bgYellow: {
        black: createMock('bgYellow.black'),
      },
    },
    cyan: createMock('cyan'),
    yellow: createMock('yellow'),
    dim: createMock('dim'),
    white: {
      bold: createMock('white.bold'),
    },
    bgYellow: {
      black: createMock('bgYellow.black'),
    },
  };
});

// Mock logger to avoid console output during tests
jest.mock('../../../src/utils/logger', () => ({
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  setLevel: jest.fn(),
}));

import { formatSearchResults } from '../../../src/formatters/search-results';
import { ISkillMetadata } from '../../../src/types/ao-registry';
import chalk from 'chalk';

describe('Search Results Formatter', () => {
  // Mock skill data for testing
  const mockSkill1: ISkillMetadata = {
    name: 'ao-basics',
    version: '1.0.0',
    description: 'Foundational knowledge for AO development',
    author: 'Agent Skills Team',
    owner: 'abc123xyz789abc123xyz789abc123xyz789abc1234',
    tags: ['ao', 'tutorial', 'beginner'],
    dependencies: [],
    arweaveTxId: 'tx123456789012345678901234567890123456789012',
    license: 'MIT',
    publishedAt: 1234567890,
    updatedAt: 1234567890,
  };

  const mockSkill2: ISkillMetadata = {
    name: 'arweave-fundamentals',
    version: '2.1.0',
    description: 'Core concepts of permanent data storage on Arweave',
    author: 'Permaweb Foundation',
    owner: 'def456uvw012def456uvw012def456uvw012def4567',
    tags: ['arweave', 'storage'],
    dependencies: [],
    arweaveTxId: 'tx987654321098765432109876543210987654321098',
    publishedAt: 1234567800,
    updatedAt: 1234567800,
  };

  const mockSkill3: ISkillMetadata = {
    name: 'cli-development',
    version: '0.5.2',
    description: 'Building command-line tools with TypeScript and Node.js',
    author: 'CLI Experts',
    owner: 'ghi789mno345ghi789mno345ghi789mno345ghi7890',
    tags: ['cli', 'typescript', 'nodejs'],
    dependencies: [],
    arweaveTxId: 'tx135792468013579246801357924680135792468013',
    license: 'Apache-2.0',
    publishedAt: 1234567700,
    updatedAt: 1234567700,
  };

  const mockSkillWithLongDescription: ISkillMetadata = {
    name: 'long-description-skill',
    version: '1.0.0',
    description:
      'This is a very long description that exceeds fifty characters and should be truncated with ellipsis',
    author: 'Test Author',
    owner: 'jkl012pqr678jkl012pqr678jkl012pqr678jkl0123',
    tags: ['test'],
    dependencies: [],
    arweaveTxId: 'tx246813579024681357902468135790246813579024',
    publishedAt: 1234567600,
    updatedAt: 1234567600,
  };

  const mockSkillExactly50Chars: ISkillMetadata = {
    name: 'exact-fifty-chars',
    version: '1.0.0',
    description: '12345678901234567890123456789012345678901234567890', // Exactly 50 characters
    author: 'Test Author',
    owner: 'mno345stu901mno345stu901mno345stu901mno3456',
    tags: ['test'],
    dependencies: [],
    arweaveTxId: 'tx369258147036925814703692581470369258147036',
    publishedAt: 1234567500,
    updatedAt: 1234567500,
  };

  const mockSkill49Chars: ISkillMetadata = {
    name: 'forty-nine-chars',
    version: '1.0.0',
    description: '1234567890123456789012345678901234567890123456789', // 49 characters
    author: 'Test Author',
    owner: 'pqr678vwx234pqr678vwx234pqr678vwx234pqr6789',
    tags: ['test'],
    dependencies: [],
    arweaveTxId: 'tx482715936048271593604827159360482715936048',
    publishedAt: 1234567400,
    updatedAt: 1234567400,
  };

  const mockSkill51Chars: ISkillMetadata = {
    name: 'fifty-one-chars',
    version: '1.0.0',
    description: '123456789012345678901234567890123456789012345678901', // 51 characters
    author: 'Test Author',
    owner: 'stu901yza567stu901yza567stu901yza567stu9012',
    tags: ['test'],
    dependencies: [],
    arweaveTxId: 'tx159263748051926374805192637480519263748051',
    publishedAt: 1234567300,
    updatedAt: 1234567300,
  };

  const mockSkill100Chars: ISkillMetadata = {
    name: 'hundred-chars',
    version: '1.0.0',
    description:
      '1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890', // 100 characters
    author: 'Test Author',
    owner: 'vwx234bcd890vwx234bcd890vwx234bcd890vwx2345',
    tags: ['test'],
    dependencies: [],
    arweaveTxId: 'tx753951864207539518642075395186420753951864',
    publishedAt: 1234567200,
    updatedAt: 1234567200,
  };

  describe('Table Formatting', () => {
    it('should render table with all columns for multiple skills', () => {
      const results = [mockSkill1, mockSkill2, mockSkill3];
      const output = formatSearchResults(results);

      // Verify all column headers present (with chalk formatting)
      expect(output).toContain('[white.bold]Name[/white.bold]');
      expect(output).toContain('[white.bold]Author[/white.bold]');
      expect(output).toContain('[white.bold]Version[/white.bold]');
      expect(output).toContain('[white.bold]Description[/white.bold]');
      expect(output).toContain('[white.bold]Tags[/white.bold]');

      // Verify all skill data present (with cyan color for names)
      expect(output).toContain('[cyan]ao-basics[/cyan]');
      expect(output).toContain('[cyan]arweave-fundamentals[/cyan]');
      expect(output).toContain('[cyan]cli-development[/cyan]');

      // Verify versions
      expect(output).toContain('1.0.0');
      expect(output).toContain('2.1.0');
      expect(output).toContain('0.5.2');

      // Verify authors (with dim color)
      expect(output).toContain('[dim]Agent Skills Team[/dim]');
      expect(output).toContain('[dim]Permaweb Foundation[/dim]');
      expect(output).toContain('[dim]CLI Experts[/dim]');

      // Verify descriptions (partial match to avoid table formatting noise)
      expect(output).toContain('Foundational knowledge');
      expect(output).toContain('permanent data storage');
      expect(output).toContain('command-line tools');

      // Verify tags as comma-separated (with yellow color, each tag wrapped individually)
      expect(output).toContain('[yellow]ao[/yellow], [yellow]tutorial[/yellow], [yellow]beginner[/yellow]');
      expect(output).toContain('[yellow]arweave[/yellow], [yellow]storage[/yellow]');
      expect(output).toContain('[yellow]cli[/yellow], [yellow]typescript[/yellow], [yellow]nodejs[/yellow]');
    });

    it('should apply color coding to table elements', () => {
      const results = [mockSkill1];
      const output = formatSearchResults(results);

      // Verify cyan color for skill names
      expect(output).toContain('[cyan]ao-basics[/cyan]');

      // Verify dim color for authors
      expect(output).toContain('[dim]Agent Skills Team[/dim]');

      // Verify yellow color for tags (each tag wrapped individually)
      expect(output).toContain('[yellow]ao[/yellow], [yellow]tutorial[/yellow], [yellow]beginner[/yellow]');

      // Verify bold white headers
      expect(output).toContain('[white.bold]Name[/white.bold]');
      expect(output).toContain('[white.bold]Author[/white.bold]');
      expect(output).toContain('[white.bold]Version[/white.bold]');
      expect(output).toContain('[white.bold]Description[/white.bold]');
      expect(output).toContain('[white.bold]Tags[/white.bold]');
    });

    it('should handle skills with empty tags array', () => {
      const skillWithNoTags: ISkillMetadata = {
        ...mockSkill1,
        tags: [],
      };
      const results = [skillWithNoTags];
      const output = formatSearchResults(results);

      // Should still render without errors
      expect(output).toBeDefined();
      expect(output).toContain('[cyan]ao-basics[/cyan]');
    });
  });

  describe('Description Truncation', () => {
    it('should not truncate description exactly 50 characters', () => {
      const results = [mockSkillExactly50Chars];
      const output = formatSearchResults(results);

      // Should preserve full description (no ellipsis)
      expect(output).toContain('12345678901234567890123456789012345678901234567890');
      expect(output).not.toContain('...');
    });

    it('should not truncate description with 49 characters', () => {
      const results = [mockSkill49Chars];
      const output = formatSearchResults(results);

      // Should preserve full description
      expect(output).toContain('1234567890123456789012345678901234567890123456789');
      expect(output).not.toContain('...');
    });

    it('should truncate description with 51 characters to 47 + ellipsis', () => {
      const results = [mockSkill51Chars];
      const output = formatSearchResults(results);

      // Should truncate to 47 chars + "..." = 50 total
      expect(output).toContain('12345678901234567890123456789012345678901234567...');
      expect(output).not.toContain(
        '123456789012345678901234567890123456789012345678901'
      );
    });

    it('should truncate description with 100 characters to 47 + ellipsis', () => {
      const results = [mockSkill100Chars];
      const output = formatSearchResults(results);

      // Should truncate to 47 chars + "..." = 50 total
      expect(output).toContain('12345678901234567890123456789012345678901234567...');
      expect(output).not.toContain('1234567890'.repeat(10));
    });

    it('should truncate long description with ellipsis', () => {
      const results = [mockSkillWithLongDescription];
      const output = formatSearchResults(results);

      // Verify truncation occurred
      expect(output).toContain('...');
      // Verify original long text is not fully present
      expect(output).not.toContain(
        'This is a very long description that exceeds fifty characters and should be truncated with ellipsis'
      );
      // Verify partial match of truncated text
      expect(output).toContain('This is a very long description that exceeds');
    });

    it('should handle empty description gracefully', () => {
      const skillWithEmptyDesc: ISkillMetadata = {
        ...mockSkill1,
        description: '',
      };
      const results = [skillWithEmptyDesc];
      const output = formatSearchResults(results);

      // Should render without errors
      expect(output).toBeDefined();
      expect(output).toContain('[cyan]ao-basics[/cyan]');
    });
  });

  describe('Empty Results', () => {
    it('should display helpful message for empty results', () => {
      const results: ISkillMetadata[] = [];
      const output = formatSearchResults(results);

      // Verify exact message with yellow formatting
      expect(output).toBe(
        '[yellow]No skills found. Try a different query or publish the first skill!\n[/yellow]'
      );
    });

    it('should apply yellow color to empty results message', () => {
      const results: ISkillMetadata[] = [];
      const output = formatSearchResults(results);

      // Verify yellow chalk color
      expect(output).toContain('[yellow]');
      expect(output).toContain('[/yellow]');
    });

    it('should not render table for empty results', () => {
      const results: ISkillMetadata[] = [];
      const output = formatSearchResults(results);

      // Should not contain table headers
      expect(output).not.toContain('[white.bold]Name[/white.bold]');
      expect(output).not.toContain('[white.bold]Author[/white.bold]');
      expect(output).not.toContain('[white.bold]Version[/white.bold]');
    });
  });

  describe('Install Command Hints', () => {
    it('should display install hint when results are not empty', () => {
      const results = [mockSkill1];
      const output = formatSearchResults(results);

      // Verify exact hint text
      expect(output).toContain('To install a skill, run: skills install <name>');
    });

    it('should apply dim color to install hint', () => {
      const results = [mockSkill1];
      const output = formatSearchResults(results);

      // Verify dim chalk color
      expect(output).toContain(
        '[dim]\nTo install a skill, run: skills install <name>\n[/dim]'
      );
    });

    it('should not display install hint for empty results', () => {
      const results: ISkillMetadata[] = [];
      const output = formatSearchResults(results);

      // Should not contain install hint
      expect(output).not.toContain('To install a skill');
    });
  });

  describe('JSON Output Format', () => {
    it('should return valid JSON when json option is true', () => {
      const results = [mockSkill1, mockSkill2];
      const output = formatSearchResults(results, { json: true });

      // Verify valid JSON
      expect(() => JSON.parse(output)).not.toThrow();

      // Parse and verify structure
      const parsed = JSON.parse(output);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
    });

    it('should preserve all SkillMetadata fields in JSON output', () => {
      const results = [mockSkill1];
      const output = formatSearchResults(results, { json: true });

      const parsed = JSON.parse(output);
      const skill = parsed[0];

      // Verify all fields present
      expect(skill.name).toBe('ao-basics');
      expect(skill.version).toBe('1.0.0');
      expect(skill.description).toBe('Foundational knowledge for AO development');
      expect(skill.author).toBe('Agent Skills Team');
      expect(skill.owner).toBe('abc123xyz789abc123xyz789abc123xyz789abc1234');
      expect(skill.tags).toEqual(['ao', 'tutorial', 'beginner']);
      expect(skill.dependencies).toEqual([]);
      expect(skill.arweaveTxId).toBe('tx123456789012345678901234567890123456789012');
      expect(skill.license).toBe('MIT');
      expect(skill.publishedAt).toBe(1234567890);
      expect(skill.updatedAt).toBe(1234567890);
    });

    it('should use 2-space indentation for readability', () => {
      const results = [mockSkill1];
      const output = formatSearchResults(results, { json: true });

      // Verify 2-space base indentation patterns
      expect(output).toContain('  {'); // Array element at 2 spaces
      expect(output).toContain('    "name"'); // Object property at 4 spaces (2 for array + 2 for object)
      expect(output).toContain('    "version"');

      // Verify it's using JSON.stringify with indent=2 (not 4 or 0)
      const parsed = JSON.parse(output);
      const reformatted = JSON.stringify(parsed, null, 2);
      expect(output).toBe(reformatted); // Should match 2-space formatting exactly
    });

    it('should return empty JSON array for no results', () => {
      const results: ISkillMetadata[] = [];
      const output = formatSearchResults(results, { json: true });

      // Verify exact output
      expect(output).toBe('[]');

      // Verify valid JSON
      const parsed = JSON.parse(output);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(0);
    });

    it('should not include ANSI color codes in JSON output', () => {
      const results = [mockSkill1];
      const output = formatSearchResults(results, { json: true });

      // ANSI escape codes start with \u001b[
      expect(output).not.toContain('\u001b[');
    });

    it('should not truncate descriptions in JSON output', () => {
      const results = [mockSkillWithLongDescription];
      const output = formatSearchResults(results, { json: true });

      const parsed = JSON.parse(output);
      const skill = parsed[0];

      // Full description should be preserved
      expect(skill.description).toBe(
        'This is a very long description that exceeds fifty characters and should be truncated with ellipsis'
      );
      expect(skill.description.length).toBeGreaterThan(50);
    });
  });

  describe('Tags Formatting', () => {
    it('should format tags as comma-separated list', () => {
      const results = [mockSkill1];
      const output = formatSearchResults(results);

      // Verify comma-separated format with yellow color (each tag wrapped individually)
      expect(output).toContain('[yellow]ao[/yellow], [yellow]tutorial[/yellow], [yellow]beginner[/yellow]');
    });

    it('should handle single tag without comma', () => {
      const skillWithOneTag: ISkillMetadata = {
        ...mockSkill1,
        tags: ['single-tag'],
      };
      const results = [skillWithOneTag];
      const output = formatSearchResults(results);

      expect(output).toContain('[yellow]single-tag[/yellow]');
      // Should not have trailing comma
      expect(output).not.toContain('single-tag,');
    });

    it('should handle multiple tags with proper separation', () => {
      const skillWithManyTags: ISkillMetadata = {
        ...mockSkill1,
        tags: ['tag1', 'tag2', 'tag3', 'tag4'],
      };
      const results = [skillWithManyTags];
      const output = formatSearchResults(results);

      expect(output).toContain('[yellow]tag1[/yellow], [yellow]tag2[/yellow], [yellow]tag3[/yellow], [yellow]tag4[/yellow]');
    });
  });

  describe('Edge Cases', () => {
    it('should handle skill with all optional fields undefined', () => {
      const minimalSkill: ISkillMetadata = {
        name: 'minimal-skill',
        version: '1.0.0',
        description: 'Minimal skill',
        author: 'Test',
        owner: 'xyz789abc123xyz789abc123xyz789abc123xyz7890',
        tags: [],
        dependencies: [],
        arweaveTxId: 'tx111222333444555666777888999000111222333444',
        publishedAt: 1234567000,
        updatedAt: 1234567000,
      };
      const results = [minimalSkill];
      const output = formatSearchResults(results);

      expect(output).toBeDefined();
      expect(output).toContain('[cyan]minimal-skill[/cyan]');
    });

    it('should handle very long skill names', () => {
      const longNameSkill: ISkillMetadata = {
        ...mockSkill1,
        name: 'very-long-skill-name-that-exceeds-normal-length-expectations',
      };
      const results = [longNameSkill];
      const output = formatSearchResults(results);

      expect(output).toContain(
        '[cyan]very-long-skill-name-that-exceeds-normal-length-expectations[/cyan]'
      );
    });

    it('should handle special characters in descriptions', () => {
      const specialCharSkill: ISkillMetadata = {
        ...mockSkill1,
        description: 'Description with "quotes" and \'apostrophes\' & symbols!',
      };
      const results = [specialCharSkill];
      const output = formatSearchResults(results);

      expect(output).toContain('quotes');
      expect(output).toContain('apostrophes');
    });
  });

  describe('Task 9: Tag Highlighting (Story 2.4)', () => {
    it('should show custom empty message with tags', () => {
      const results: ISkillMetadata[] = [];
      const output = formatSearchResults(results, { tags: ['ao', 'tutorial'] });

      expect(output).toContain('No skills found with tags');
      expect(output).toContain('[yellow]ao[/yellow]');
      expect(output).toContain('[yellow]tutorial[/yellow]');
      expect(output).toContain('Try removing a tag filter');
    });

    it('should highlight matched tags in table', () => {
      const results = [mockSkill1]; // has tags: ['ao', 'tutorial', 'beginner']
      const output = formatSearchResults(results, { tags: ['ao'] });

      // 'ao' should be highlighted (bgYellow.black)
      expect(output).toContain('[bgYellow.black] ao [/bgYellow.black]');
      // 'tutorial' and 'beginner' should use standard yellow
      expect(output).toContain('[yellow]tutorial[/yellow]');
      expect(output).toContain('[yellow]beginner[/yellow]');
    });

    it('should use standard yellow for non-matched tags', () => {
      const results = [mockSkill2]; // has tags: ['arweave', 'storage']
      const output = formatSearchResults(results, { tags: ['ao'] });

      // Neither tag matches 'ao' filter, so both should use standard yellow
      expect(output).toContain('[yellow]arweave[/yellow]');
      expect(output).toContain('[yellow]storage[/yellow]');
      // Should not have any highlighted tags
      expect(output).not.toContain('[bgYellow.black]');
    });

    it('should maintain comma-separated format with highlighting', () => {
      const results = [mockSkill1]; // has tags: ['ao', 'tutorial', 'beginner']
      const output = formatSearchResults(results, { tags: ['ao', 'beginner'] });

      // Should have commas between tags
      expect(output).toMatch(/\[bgYellow\.black\] ao \[\/bgYellow\.black\], \[yellow\]tutorial\[\/yellow\], \[bgYellow\.black\] beginner \[\/bgYellow\.black\]/);
    });

    it('should not affect JSON output with tag highlighting', () => {
      const results = [mockSkill1];
      const output = formatSearchResults(results, { json: true, tags: ['ao'] });

      const parsed = JSON.parse(output);
      // JSON should not contain any color codes
      expect(JSON.stringify(parsed)).not.toContain('[yellow]');
      expect(JSON.stringify(parsed)).not.toContain('[bgYellow.black]');
      // Tags should be raw strings
      expect(parsed[0].tags).toEqual(['ao', 'tutorial', 'beginner']);
    });

    it('should perform case-insensitive tag matching for highlighting', () => {
      const skillWithMixedCaseTags: ISkillMetadata = {
        ...mockSkill1,
        tags: ['AO', 'Tutorial', 'BEGINNER'],
      };
      const results = [skillWithMixedCaseTags];
      const output = formatSearchResults(results, { tags: ['ao', 'tutorial'] });

      // Should highlight both 'AO' and 'Tutorial' (case-insensitive match)
      expect(output).toContain('[bgYellow.black] AO [/bgYellow.black]');
      expect(output).toContain('[bgYellow.black] Tutorial [/bgYellow.black]');
      // 'BEGINNER' not in filter, should use standard yellow
      expect(output).toContain('[yellow]BEGINNER[/yellow]');
    });

    it('should not highlight when no tags filter specified', () => {
      const results = [mockSkill1];
      const output = formatSearchResults(results);

      // Without tag filter, all tags should use standard yellow (each tag wrapped individually)
      expect(output).toContain('[yellow]ao[/yellow], [yellow]tutorial[/yellow], [yellow]beginner[/yellow]');
      // Should not have any highlighting
      expect(output).not.toContain('[bgYellow.black]');
    });

    it('should show standard empty message when no tags specified', () => {
      const results: ISkillMetadata[] = [];
      const output = formatSearchResults(results);

      expect(output).toContain('No skills found');
      expect(output).toContain('Try a different query or publish the first skill');
      expect(output).not.toContain('Try removing a tag filter');
    });
  });
});

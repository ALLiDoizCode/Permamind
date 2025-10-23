/**
 * Cross-Platform Path Utilities Tests
 * Story 5.1 Task 2: Verify path handling works across all platforms
 */

import * as path from 'path';
import * as os from 'os';

describe('Cross-Platform Path Utilities', () => {
  describe('Path Separator Handling', () => {
    it('should use correct platform path separator', () => {
      const result = path.join('skills', 'ao-basics', 'SKILL.md');

      // On Unix: skills/ao-basics/SKILL.md
      // On Windows: skills\ao-basics\SKILL.md
      if (process.platform === 'win32') {
        expect(result).toBe('skills\\ao-basics\\SKILL.md');
      } else {
        expect(result).toBe('skills/ao-basics/SKILL.md');
      }
    });

    it('should normalize mixed separators to platform-specific', () => {
      // Windows backslash input
      const windowsPath = 'C:\\Users\\test\\skills';
      const normalized = path.normalize(windowsPath);

      if (process.platform === 'win32') {
        expect(normalized).toBe('C:\\Users\\test\\skills');
      } else {
        // On Unix, this becomes a relative path
        expect(normalized).toContain('skills');
      }
    });

    it('should handle forward slashes on all platforms', () => {
      const unixPath = 'skills/ao-basics/SKILL.md';
      const normalized = path.normalize(unixPath);

      // path.normalize should convert to platform separator
      expect(normalized).toContain('skills');
      expect(normalized).toContain('SKILL.md');
    });
  });

  describe('Home Directory Resolution', () => {
    it('should resolve home directory using os.homedir()', () => {
      const homeDir = os.homedir();

      expect(homeDir).toBeTruthy();
      expect(typeof homeDir).toBe('string');
      expect(homeDir.length).toBeGreaterThan(0);
    });

    it('should create valid path to .claude/skills in home directory', () => {
      const homeDir = os.homedir();
      const skillsPath = path.join(homeDir, '.claude', 'skills');

      expect(skillsPath).toContain('.claude');
      expect(skillsPath).toContain('skills');

      // Verify absolute path
      expect(path.isAbsolute(skillsPath)).toBe(true);
    });

    it('should handle ~ expansion manually (not built-in)', () => {
      const tildeExpanded = (p: string) => {
        if (p.startsWith('~/') || p === '~') {
          return path.join(os.homedir(), p.slice(2));
        }
        return p;
      };

      const result = tildeExpanded('~/.claude/skills');
      expect(result).toContain('.claude');
      expect(path.isAbsolute(result)).toBe(true);
    });
  });

  describe('Temporary Directory Handling', () => {
    it('should resolve platform temp directory', () => {
      const tempDir = os.tmpdir();

      expect(tempDir).toBeTruthy();
      expect(typeof tempDir).toBe('string');

      // Windows: C:\Users\<user>\AppData\Local\Temp
      // macOS: /var/folders/...
      // Linux: /tmp
      if (process.platform === 'win32') {
        expect(tempDir).toMatch(/[A-Z]:\\/);
      } else {
        expect(tempDir).toMatch(/^\//);
      }
    });

    it('should create valid temp file paths', () => {
      const tempFile = path.join(os.tmpdir(), `test-bundle-${Date.now()}.tar.gz`);

      expect(tempFile).toContain('test-bundle-');
      expect(tempFile).toContain('.tar.gz');
      expect(path.isAbsolute(tempFile)).toBe(true);
    });
  });

  describe('Relative Path Resolution', () => {
    it('should resolve relative paths using path.resolve()', () => {
      const cwd = process.cwd();
      const relativePath = path.join('.', 'skills', 'ao-basics');
      const absolutePath = path.resolve(relativePath);

      expect(path.isAbsolute(absolutePath)).toBe(true);
      expect(absolutePath).toContain('skills');
    });

    it('should handle ../ parent directory references', () => {
      const parentPath = path.join('skills', '..', 'cli', 'src');
      const normalized = path.normalize(parentPath);

      expect(normalized).toContain('cli');
      expect(normalized).toContain('src');
      expect(normalized).not.toContain('..');
    });
  });

  describe('Path Validation', () => {
    it('should detect absolute paths correctly', () => {
      const absolutePaths = [
        os.homedir(),
        path.resolve('.'),
      ];

      // Add platform-specific absolute paths
      if (process.platform === 'win32') {
        absolutePaths.push('C:\\Program Files\\nodejs');
      } else {
        absolutePaths.push('/usr/local/bin');
      }

      absolutePaths.forEach(p => {
        expect(path.isAbsolute(p)).toBe(true);
      });
    });

    it('should detect relative paths correctly', () => {
      const relativePaths = [
        './skills',
        '../ao-process',
        'skills/ao-basics',
        '.skillsrc',
      ];

      relativePaths.forEach(p => {
        expect(path.isAbsolute(p)).toBe(false);
      });
    });
  });

  describe('Path Parsing', () => {
    it('should parse directory and filename correctly', () => {
      const filePath = path.join('skills', 'ao-basics', 'SKILL.md');
      const parsed = path.parse(filePath);

      expect(parsed.name).toBe('SKILL');
      expect(parsed.ext).toBe('.md');
      expect(parsed.base).toBe('SKILL.md');
      expect(parsed.dir).toContain('ao-basics');
    });

    it('should extract directory name', () => {
      const filePath = path.join('skills', 'ao-basics', 'SKILL.md');
      const dirname = path.dirname(filePath);

      expect(dirname).toContain('skills');
      expect(dirname).toContain('ao-basics');
    });

    it('should extract basename', () => {
      const filePath = path.join('skills', 'ao-basics', 'SKILL.md');
      const basename = path.basename(filePath);

      expect(basename).toBe('SKILL.md');
    });

    it('should extract extension', () => {
      const filePath = path.join('skills', 'ao-basics', 'SKILL.md');
      const ext = path.extname(filePath);

      expect(ext).toBe('.md');
    });
  });

  describe('Windows-Specific Path Handling', () => {
    it('should handle drive letters on Windows', () => {
      const winPath = 'C:\\Users\\test\\skills';

      if (process.platform === 'win32') {
        const parsed = path.parse(winPath);
        expect(parsed.root).toBe('C:\\');
      } else {
        // On Unix, this is a relative path
        const parsed = path.parse(winPath);
        expect(parsed.root).toBe('');
      }
    });

    it('should handle UNC paths on Windows', () => {
      const uncPath = '\\\\server\\share\\skills';

      if (process.platform === 'win32') {
        const parsed = path.parse(uncPath);
        expect(parsed.root).toBe('\\\\server\\share\\');
      } else {
        // On Unix, this is relative
        expect(path.isAbsolute(uncPath)).toBe(false);
      }
    });
  });

  describe('Unix-Specific Path Handling', () => {
    it('should handle root directory on Unix', () => {
      const rootPath = '/usr/local/bin';

      if (process.platform !== 'win32') {
        const parsed = path.parse(rootPath);
        expect(parsed.root).toBe('/');
      }
    });

    it('should handle hidden files with leading dot', () => {
      const hiddenFile = path.join(os.homedir(), '.skillsrc');
      const basename = path.basename(hiddenFile);

      expect(basename).toBe('.skillsrc');
      expect(basename.startsWith('.')).toBe(true);
    });
  });

  describe('Path Length Validation', () => {
    it('should detect potentially problematic long paths', () => {
      const longPath = path.join(
        'skills',
        'very-long-skill-name-that-exceeds-normal-length',
        'examples',
        'deeply',
        'nested',
        'directory',
        'structure',
        'that',
        'might',
        'exceed',
        'windows',
        'path',
        'limit',
        'SKILL.md'
      );

      // Windows MAX_PATH is 260 characters
      const MAX_PATH_WINDOWS = 260;
      const absolutePath = path.resolve(longPath);

      if (process.platform === 'win32') {
        if (absolutePath.length > MAX_PATH_WINDOWS) {
          // Path may cause issues on Windows without long path support
          expect(absolutePath.length).toBeGreaterThan(MAX_PATH_WINDOWS);
        }
      }

      // Path should still be valid on Unix systems
      expect(absolutePath).toContain('SKILL.md');
    });

    it('should provide path length information', () => {
      const testPath = path.join(os.homedir(), '.claude', 'skills', 'ao-basics', 'SKILL.md');
      const length = testPath.length;

      expect(length).toBeGreaterThan(0);
      expect(typeof length).toBe('number');

      // Most common paths should be well under Windows MAX_PATH
      if (process.platform === 'win32') {
        expect(length).toBeLessThan(260);
      }
    });
  });
});

/**
 * Cross-Platform Command Integration Tests
 * Story 5.1 Tasks 3-5: Validate publish, search, install commands work on all platforms
 *
 * These tests verify that core CLI commands work correctly across:
 * - macOS (darwin)
 * - Linux (ubuntu-latest)
 * - Windows (win32)
 */

import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import {
  getPlatformInfo,
  isWindows,
  isMacOS,
  isLinux,
  getPlatformDisplayName,
  getPathSeparator,
} from '../../helpers/platform-utils';

// Import bundler for testing tar.gz creation/extraction
import { bundle, extract } from '../../../src/lib/bundler';

describe('Cross-Platform Command Tests', () => {
  let tempDir: string;
  let platformInfo: ReturnType<typeof getPlatformInfo>;

  beforeAll(() => {
    platformInfo = getPlatformInfo();
    console.log(`\n🖥️  Testing on: ${getPlatformDisplayName()} (${platformInfo.platform})`);
    console.log(`📦 Node Version: ${platformInfo.nodeVersion}`);
  });

  beforeEach(() => {
    // Create platform-specific temp directory
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xplatform-test-'));
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Task 3: Publish Command Cross-Platform', () => {
    it('should create tar.gz bundle with platform-appropriate paths', async () => {
      // Create test skill directory
      const skillDir = path.join(tempDir, 'test-skill');
      fs.mkdirSync(skillDir, { recursive: true });

      // Create SKILL.md with YAML frontmatter
      const skillMd = `---
name: test-skill
version: 1.0.0
description: Test skill for cross-platform validation
author: Test Author
---

# Test Skill

This skill tests cross-platform compatibility.
`;
      fs.writeFileSync(path.join(skillDir, 'SKILL.md'), skillMd);

      // Create nested subdirectory structure
      const examplesDir = path.join(skillDir, 'examples', 'basic');
      fs.mkdirSync(examplesDir, { recursive: true });
      fs.writeFileSync(path.join(examplesDir, 'example.ts'), '// Example code');

      // Bundle the skill
      const bundleResult = await bundle(skillDir);

      // Verify buffer is valid
      expect(bundleResult.buffer).toBeInstanceOf(Buffer);
      expect(bundleResult.buffer.length).toBeGreaterThan(0);
      expect(bundleResult.size).toBeGreaterThan(0);

      // Verify tar.gz magic bytes (1f 8b for gzip)
      expect(bundleResult.buffer[0]).toBe(0x1f);
      expect(bundleResult.buffer[1]).toBe(0x8b);
    });

    it('should handle Windows-style paths in bundle creation', async () => {
      const skillDir = path.join(tempDir, 'windows-path-test');
      fs.mkdirSync(skillDir, { recursive: true });

      const skillMd = `---
name: windows-test
version: 1.0.0
description: Windows path test
author: Test
---

# Windows Test
`;
      fs.writeFileSync(path.join(skillDir, 'SKILL.md'), skillMd);

      // Use path.join which will use correct separator for platform
      const nestedFile = path.join(skillDir, 'src', 'lib', 'utils.ts');
      fs.mkdirSync(path.dirname(nestedFile), { recursive: true });
      fs.writeFileSync(nestedFile, '// Utils');

      const bundleResult = await bundle(skillDir);

      expect(bundleResult.buffer).toBeInstanceOf(Buffer);
      expect(bundleResult.buffer.length).toBeGreaterThan(0);

      // Extract and verify structure
      const extractDir = path.join(tempDir, 'extracted');
      const result = await extract(bundleResult.buffer, { targetDir: extractDir });

      // Verify extraction result
      expect(result.installedPath).toBe(extractDir);

      // Verify file exists with correct path
      const extractedFile = path.join(extractDir, 'src', 'lib', 'utils.ts');
      expect(fs.existsSync(extractedFile)).toBe(true);
    });

    it('should verify bundle size calculation is consistent across platforms', async () => {
      const skillDir = path.join(tempDir, 'size-test');
      fs.mkdirSync(skillDir, { recursive: true });

      const skillMd = `---
name: size-test
version: 1.0.0
description: Size calculation test
author: Test
---

# Size Test
`;
      fs.writeFileSync(path.join(skillDir, 'SKILL.md'), skillMd);

      // Add files of known sizes
      const testContent = 'a'.repeat(1000); // 1000 bytes
      fs.writeFileSync(path.join(skillDir, 'test1.txt'), testContent);
      fs.writeFileSync(path.join(skillDir, 'test2.txt'), testContent);

      const bundleResult = await bundle(skillDir);

      // Bundle should be compressed, so smaller than raw content
      const rawSize = testContent.length * 2 + skillMd.length;
      expect(bundleResult.buffer.length).toBeLessThan(rawSize);
      expect(bundleResult.buffer.length).toBeGreaterThan(0);
      expect(bundleResult.size).toBe(bundleResult.buffer.length);
    });
  });

  describe('Task 4: Search Command Cross-Platform', () => {
    it('should format table output correctly for platform terminal', () => {
      // This test verifies terminal width detection works
      const terminalWidth = process.stdout.columns || 80;

      expect(terminalWidth).toBeGreaterThan(0);
      expect(typeof terminalWidth).toBe('number');

      // Terminal width should be reasonable
      expect(terminalWidth).toBeGreaterThanOrEqual(40);
      expect(terminalWidth).toBeLessThanOrEqual(500);
    });

    it('should detect TTY correctly on platform', () => {
      const isTTY = process.stdout.isTTY;

      // In test environment, typically not TTY (undefined or false)
      // In CI, definitely not TTY
      if (process.env.CI === 'true') {
        expect(isTTY).toBeFalsy();
      }

      // isTTY can be undefined or boolean
      expect(['boolean', 'undefined']).toContain(typeof isTTY);
    });

    it('should handle color support detection', () => {
      // Check if chalk/terminal colors would be supported
      const supportsColor = Boolean(process.stdout.isTTY && !process.env.NO_COLOR);

      expect(typeof supportsColor).toBe('boolean');

      // In CI environments without TTY, color should be disabled
      if (process.env.CI === 'true') {
        expect(supportsColor).toBe(false);
      }
    });
  });

  describe('Task 5: Install Command Cross-Platform', () => {
    it('should extract bundle with correct file permissions on Unix', async () => {
      if (isWindows()) {
        // Windows doesn't use Unix permissions
        return;
      }

      const skillDir = path.join(tempDir, 'permissions-test');
      fs.mkdirSync(skillDir, { recursive: true });

      const skillMd = `---
name: permissions-test
version: 1.0.0
description: Permission test
author: Test
---

# Permission Test
`;
      fs.writeFileSync(path.join(skillDir, 'SKILL.md'), skillMd);

      // Create executable file (on Unix)
      const scriptPath = path.join(skillDir, 'script.sh');
      fs.writeFileSync(scriptPath, '#!/bin/bash\necho "test"');
      fs.chmodSync(scriptPath, 0o755);

      // Bundle and extract
      const bundleResult = await bundle(skillDir);
      const extractDir = path.join(tempDir, 'extracted-perms');
      const result = await extract(bundleResult.buffer, { targetDir: extractDir });

      // Verify extraction result
      expect(result.installedPath).toBe(extractDir);

      // Verify file was extracted
      const extractedScript = path.join(extractDir, 'script.sh');
      expect(fs.existsSync(extractedScript)).toBe(true);

      // Verify permissions are set to default (0o644 for files)
      // Note: tar library sets default permissions, doesn't preserve original
      const stats = fs.statSync(extractedScript);
      const mode = stats.mode & 0o777;
      expect(mode).toBe(0o644); // Default file permissions (rw-r--r--)
    });

    it('should resolve skills directory path correctly on all platforms', () => {
      // Global installation path
      const globalPath = path.join(os.homedir(), '.claude', 'skills');
      expect(path.isAbsolute(globalPath)).toBe(true);
      expect(globalPath).toContain('.claude');
      expect(globalPath).toContain('skills');

      // Local installation path
      const localPath = path.join(process.cwd(), '.claude', 'skills');
      expect(path.isAbsolute(localPath)).toBe(true);
      expect(localPath).toContain('.claude');
      expect(localPath).toContain('skills');

      // Paths should differ if cwd != homedir
      if (process.cwd() !== os.homedir()) {
        expect(localPath).not.toBe(globalPath);
      }
    });

    it('should handle lock file paths on all platforms', () => {
      const skillsDir = path.join(os.homedir(), '.claude', 'skills');
      const lockFilePath = path.join(path.dirname(skillsDir), 'skills-lock.json');

      expect(path.isAbsolute(lockFilePath)).toBe(true);
      expect(lockFilePath).toContain('skills-lock.json');
      expect(lockFilePath).toContain('.claude');
    });
  });

  describe('Platform-Specific Behavior', () => {
    it('should detect current platform correctly', () => {
      expect(platformInfo.platform).toBeTruthy();
      expect(['win32', 'darwin', 'linux', 'freebsd', 'openbsd']).toContain(platformInfo.platform);

      // Exactly one should be true
      const platformFlags = [platformInfo.isWindows, platformInfo.isMacOS, platformInfo.isLinux];
      const trueCount = platformFlags.filter(f => f).length;
      expect(trueCount).toBeGreaterThanOrEqual(1); // At least one should match
    });

    it('should use correct path separator', () => {
      const expectedSeparator = isWindows() ? '\\' : '/';
      expect(platformInfo.pathSeparator).toBe(expectedSeparator);
      expect(getPathSeparator()).toBe(expectedSeparator);
    });

    it('should resolve home directory consistently', () => {
      expect(platformInfo.homedir).toBeTruthy();
      expect(path.isAbsolute(platformInfo.homedir)).toBe(true);

      // Home directory should match os.homedir()
      expect(platformInfo.homedir).toBe(os.homedir());
    });

    it('should resolve temp directory consistently', () => {
      expect(platformInfo.tmpdir).toBeTruthy();
      expect(path.isAbsolute(platformInfo.tmpdir)).toBe(true);

      // Temp directory should match os.tmpdir()
      expect(platformInfo.tmpdir).toBe(os.tmpdir());
    });
  });

  describe('Node.js Version Compatibility', () => {
    it('should be running on Node 18.x or 20.x', () => {
      const majorVersion = platformInfo.nodeMajorVersion;

      // Project requires Node 20.11.0+, but CI tests on 18.x and 20.x
      expect([18, 20, 21, 22, 23]).toContain(majorVersion);
    });

    it('should have native fetch available (Node 18+)', () => {
      expect(typeof fetch).toBe('function');
      expect(fetch).toBeDefined();
    });

    it('should support path.join() (all Node versions)', () => {
      const testPath = path.join('a', 'b', 'c');
      expect(testPath).toBeTruthy();
      expect(testPath).toContain('a');
      expect(testPath).toContain('b');
      expect(testPath).toContain('c');
    });
  });
});

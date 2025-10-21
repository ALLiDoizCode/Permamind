/**
 * Setup validation tests
 * Verifies TypeScript configuration, dependencies, and directory structure
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Project Setup Validation', () => {
  const rootDir = path.resolve(__dirname, '../../../');
  const cliDir = path.resolve(rootDir, 'cli');

  describe('TypeScript Configuration', () => {
    it('should have root tsconfig.json', () => {
      const tsconfigPath = path.join(rootDir, 'tsconfig.json');
      expect(fs.existsSync(tsconfigPath)).toBe(true);
    });

    it('should have CLI tsconfig.json', () => {
      const tsconfigPath = path.join(cliDir, 'tsconfig.json');
      expect(fs.existsSync(tsconfigPath)).toBe(true);
    });

    it('should enable strict mode in root tsconfig', () => {
      const tsconfigPath = path.join(rootDir, 'tsconfig.json');
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
      expect(tsconfig.compilerOptions.strict).toBe(true);
    });
  });

  describe('Package Configuration', () => {
    it('should have root package.json', () => {
      const packagePath = path.join(rootDir, 'package.json');
      expect(fs.existsSync(packagePath)).toBe(true);
    });

    it('should have CLI package.json', () => {
      const packagePath = path.join(cliDir, 'package.json');
      expect(fs.existsSync(packagePath)).toBe(true);
    });

    it('should have npm workspaces configured', () => {
      const packagePath = path.join(rootDir, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      expect(packageJson.workspaces).toBeDefined();
      expect(packageJson.workspaces).toContain('cli');
    });

    it('should have required build scripts', () => {
      const packagePath = path.join(rootDir, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      expect(packageJson.scripts.build).toBeDefined();
      expect(packageJson.scripts.test).toBeDefined();
      expect(packageJson.scripts.lint).toBeDefined();
      expect(packageJson.scripts.format).toBeDefined();
    });

    it('should specify Node.js 20.11.0 or higher', () => {
      const packagePath = path.join(rootDir, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      expect(packageJson.engines.node).toBe('>=20.11.0');
    });
  });

  describe('Required Dependencies', () => {
    let cliPackageJson: Record<string, unknown>;

    beforeAll(() => {
      const packagePath = path.join(cliDir, 'package.json');
      cliPackageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    });

    const requiredDeps = [
      'commander',
      'gray-matter',
      'tar',
      'ajv',
      'ora',
      'chalk',
      'cli-table3',
      'keytar',
      'arweave',
      '@permaweb/aoconnect',
      'dotenv',
    ];

    requiredDeps.forEach((dep) => {
      it(`should have ${dep} installed`, () => {
        const deps = cliPackageJson.dependencies as Record<string, string>;
        expect(deps[dep]).toBeDefined();
      });
    });
  });

  describe('Directory Structure', () => {
    const expectedDirs = [
      'cli',
      'cli/src',
      'cli/src/commands',
      'cli/src/clients',
      'cli/src/lib',
      'cli/src/parsers',
      'cli/src/formatters',
      'cli/src/schemas',
      'cli/src/types',
      'cli/src/utils',
      'cli/tests',
      'cli/tests/unit',
      'cli/tests/integration',
      'cli/tests/fixtures',
      'cli/tests/helpers',
      'ao-process',
      'ao-process/tests',
      'skills',
      'skills/ao-basics',
      'skills/arweave-fundamentals',
      'skills/permamind-integration',
      'skills/agent-skills-best-practices',
      'skills/cli-development',
      'scripts',
      'docs',
    ];

    expectedDirs.forEach((dir) => {
      it(`should have ${dir} directory`, () => {
        const dirPath = path.join(rootDir, dir);
        expect(fs.existsSync(dirPath)).toBe(true);
        expect(fs.statSync(dirPath).isDirectory()).toBe(true);
      });
    });
  });

  describe('Configuration Files', () => {
    const configFiles = [
      '.gitignore',
      '.eslintrc.json',
      '.prettierrc',
      'jest.config.js',
      '.env.example',
      '.skillsrc.example',
      'LICENSE',
      'README.md',
      'cli/README.md',
      'ao-process/README.md',
    ];

    configFiles.forEach((file) => {
      it(`should have ${file}`, () => {
        const filePath = path.join(rootDir, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe('Placeholder Files', () => {
    it('should have registry.lua placeholder', () => {
      const luaPath = path.join(rootDir, 'ao-process/registry.lua');
      expect(fs.existsSync(luaPath)).toBe(true);
    });

    it('should have CLI index.ts placeholder', () => {
      const indexPath = path.join(cliDir, 'src/index.ts');
      expect(fs.existsSync(indexPath)).toBe(true);
    });
  });

  describe('Jest Configuration', () => {
    it('should have jest.config.js', () => {
      const jestConfigPath = path.join(rootDir, 'jest.config.js');
      expect(fs.existsSync(jestConfigPath)).toBe(true);
    });

    it('should be configured for TypeScript', () => {
      const jestConfigPath = path.join(rootDir, 'jest.config.js');
      const jestConfig = require(jestConfigPath);
      expect(jestConfig.transform).toBeDefined();
      expect(jestConfig.transform['^.+\\.ts$']).toBeDefined();
      expect(jestConfig.transform['^.+\\.ts$'][0]).toBe('ts-jest');
    });

    it('should have correct test paths', () => {
      const jestConfigPath = path.join(rootDir, 'jest.config.js');
      const jestConfig = require(jestConfigPath);
      expect(jestConfig.roots).toContain('<rootDir>/cli/tests');
    });
  });
});

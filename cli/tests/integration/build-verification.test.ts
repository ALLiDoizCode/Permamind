/**
 * Integration Tests: Build Process Verification
 *
 * Tests that the build process correctly copies UI assets to dist/ui/
 * and that all build scripts are properly configured.
 *
 * Story: 12.3 - Integrate Custom UI with NodeArweaveWalletAdapter
 * AC 2: Build Process Verification Tests
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

describe('Build Process Verification', () => {
  const distUiPath = path.resolve(__dirname, '../../dist/ui');
  const srcUiPath = path.resolve(__dirname, '../../src/ui');
  const expectedFiles = [
    'wallet-connect.html',
    'wallet-connect.css',
    'wallet-connect.js',
    'README.md'
  ];

  beforeAll(() => {
    // Ensure build has been run (should be done already, but verify)
    // Do NOT run build here as it's slow - assume build already done
  });

  describe('UI Asset Copying', () => {
    expectedFiles.forEach(file => {
      it(`should copy ${file} to dist/ui/`, () => {
        // Given: Build completed
        const filePath = path.join(distUiPath, file);

        // When: Checking file existence
        const exists = fs.existsSync(filePath);

        // Then: File should exist
        expect(exists).toBe(true);
      });
    });

    it('should preserve file content during copy', () => {
      // Given: Source and dist files
      const srcFile = path.join(srcUiPath, 'wallet-connect.html');
      const distFile = path.join(distUiPath, 'wallet-connect.html');

      // When: Reading both files
      const srcContent = fs.readFileSync(srcFile, 'utf-8');
      const distContent = fs.readFileSync(distFile, 'utf-8');

      // Then: Content should match exactly
      expect(distContent).toBe(srcContent);
    });

    it('should have all UI files in dist/ui/', () => {
      // Given: dist/ui directory
      const files = fs.readdirSync(distUiPath);

      // When: Checking file count
      // Then: Should have at least the 4 expected files
      expect(files.length).toBeGreaterThanOrEqual(expectedFiles.length);

      // And: Each expected file should be present
      expectedFiles.forEach(file => {
        expect(files).toContain(file);
      });
    });

    it('should verify CSS file integrity after copy', () => {
      // Given: CSS file in dist/ui/
      const cssPath = path.join(distUiPath, 'wallet-connect.css');
      const cssContent = fs.readFileSync(cssPath, 'utf-8');

      // When: Checking content
      // Then: Should contain terminal dark theme colors
      expect(cssContent).toContain('#10151B'); // Background
      expect(cssContent).toContain('#1a1f26'); // Surface
      expect(cssContent).toContain('#e2e8f0'); // Text
    });

    it('should verify JavaScript file integrity after copy', () => {
      // Given: JavaScript file in dist/ui/
      const jsPath = path.join(distUiPath, 'wallet-connect.js');
      const jsContent = fs.readFileSync(jsPath, 'utf-8');

      // When: Checking content
      // Then: Should contain SSE protocol implementation
      expect(jsContent).toContain('EventSource');
      expect(jsContent).toContain('/events');
      expect(jsContent).toContain('message');
    });
  });

  describe('Build Script Configuration', () => {
    it('should include copy-ui in build script', () => {
      // Given: package.json
      const packageJson = JSON.parse(
        fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf-8')
      );

      // When: Checking build script
      const buildScript = packageJson.scripts.build;

      // Then: Should contain copy-ui
      expect(buildScript).toBeDefined();
      expect(buildScript).toContain('copy-ui');
    });

    it('should have copy-ui script defined', () => {
      // Given: package.json
      const packageJson = JSON.parse(
        fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf-8')
      );

      // When: Checking copy-ui script
      const copyUiScript = packageJson.scripts['copy-ui'];

      // Then: Should be defined and contain src/ui and dist/ui
      expect(copyUiScript).toBeDefined();
      expect(copyUiScript).toContain('src/ui');
      expect(copyUiScript).toContain('dist/ui');
    });

    it('should verify build script runs tsc before copy-ui', () => {
      // Given: package.json
      const packageJson = JSON.parse(
        fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf-8')
      );

      // When: Checking build script order
      const buildScript = packageJson.scripts.build;

      // Then: tsc should come before copy-ui
      const tscIndex = buildScript.indexOf('tsc');
      const copyUiIndex = buildScript.indexOf('copy-ui');

      expect(tscIndex).toBeGreaterThanOrEqual(0);
      expect(copyUiIndex).toBeGreaterThan(tscIndex);
    });
  });

  describe('TypeScript Compilation', () => {
    it('should verify dist/lib directory exists', () => {
      // Given: Build completed
      const distLibPath = path.resolve(__dirname, '../../dist/lib');

      // When: Checking directory
      const exists = fs.existsSync(distLibPath);

      // Then: Should exist
      expect(exists).toBe(true);
    });

    it('should verify adapter compiled to dist/lib/', () => {
      // Given: Build completed
      const adapterPath = path.resolve(__dirname, '../../dist/lib/node-arweave-wallet-adapter.js');

      // When: Checking compiled file
      const exists = fs.existsSync(adapterPath);

      // Then: Should exist
      expect(exists).toBe(true);
    });

    it('should verify adapter has .d.ts type definition', () => {
      // Given: Build completed
      const adapterTypesPath = path.resolve(__dirname, '../../dist/lib/node-arweave-wallet-adapter.d.ts');

      // When: Checking type definition file
      const exists = fs.existsSync(adapterTypesPath);

      // Then: Should exist
      expect(exists).toBe(true);
    });
  });

  describe('Build Output Structure', () => {
    it('should have proper directory structure in dist/', () => {
      // Given: dist directory
      const distPath = path.resolve(__dirname, '../../dist');

      // When: Checking subdirectories
      const subdirs = fs.readdirSync(distPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      // Then: Should contain lib, types, and ui directories
      expect(subdirs).toContain('lib');
      expect(subdirs).toContain('types');
      expect(subdirs).toContain('ui');
    });

    it('should verify all UI files have proper permissions', () => {
      // Given: UI files in dist/ui/
      expectedFiles.forEach(file => {
        const filePath = path.join(distUiPath, file);

        // When: Checking file stats
        const stats = fs.statSync(filePath);

        // Then: Should be readable
        expect(stats.isFile()).toBe(true);
        expect(stats.mode & fs.constants.S_IRUSR).toBeTruthy();
      });
    });
  });

  describe('File Content Validation', () => {
    it('should verify HTML file has correct DOCTYPE', () => {
      // Given: HTML file
      const htmlPath = path.join(distUiPath, 'wallet-connect.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

      // When: Checking content
      // Then: Should have DOCTYPE
      expect(htmlContent).toMatch(/<!DOCTYPE html>/i);
    });

    it('should verify README.md has usage instructions', () => {
      // Given: README file
      const readmePath = path.join(distUiPath, 'README.md');
      const readmeContent = fs.readFileSync(readmePath, 'utf-8');

      // When: Checking content
      // Then: Should contain documentation
      expect(readmeContent.length).toBeGreaterThan(100);
      expect(readmeContent).toMatch(/wallet/i);
    });
  });
});

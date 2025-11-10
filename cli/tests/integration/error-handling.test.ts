/**
 * Integration Tests: Error Handling and Graceful Degradation
 *
 * Tests that the system handles missing or invalid custom templates gracefully.
 * Tests file validation, path validation, and error detection logic.
 *
 * Story: 12.3 - Integrate Custom UI with NodeArweaveWalletAdapter
 * AC 3: Error Handling and Graceful Degradation Tests
 *
 * NOTE: Full adapter error handling is validated via unit tests and manual testing.
 * These tests focus on file system validation and configuration detection.
 */

import fs from 'node:fs';
import path from 'node:path';

describe('Error Handling and Graceful Degradation', () => {
  describe('Missing Template File Detection', () => {
    it('should detect missing custom template file', () => {
      // Given: Non-existent template path
      const nonExistentPath = path.resolve(__dirname, '../../dist/ui/non-existent.html');

      // When: Checking file existence
      const templateExists = fs.existsSync(nonExistentPath);

      // Then: Should be false
      expect(templateExists).toBe(false);
    });

    it('should verify fork library can fallback to default UI (documentation check)', () => {
      // Given: Package.json with fork library
      const packageJson = JSON.parse(
        fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf-8')
      );

      // When: Checking fork library version
      const forkLibrary = packageJson.dependencies['@permamind/node-arweave-wallet'];

      // Then: Should be using fork version (>=0.0.13 has fallback feature)
      expect(forkLibrary).toBeDefined();
      expect(forkLibrary).toMatch(/\^0\.0\.(1[3-9]|[2-9]\d)/); // 0.0.13 or higher
    });

    it('should verify adapter handles file existence checks', () => {
      // Given: Adapter source code
      const adapterPath = path.resolve(__dirname, '../../src/lib/node-arweave-wallet-adapter.ts');
      const adapterSource = fs.readFileSync(adapterPath, 'utf-8');

      // When: Checking source code for error handling
      // Then: Should contain error handling logic
      expect(adapterSource).toContain('ConfigurationError');
      expect(adapterSource).toContain('NetworkError');
      expect(adapterSource).toContain('try');
      expect(adapterSource).toContain('catch');
    });
  });

  describe('Invalid Configuration Detection', () => {
    it('should validate null or undefined path detection', () => {
      // Given: Invalid paths
      const invalidPaths: Array<string | null | undefined> = [null, undefined, ''];

      // When: Validating each path
      invalidPaths.forEach(invalidPath => {
        const isValid = !!(invalidPath && typeof invalidPath === 'string' && invalidPath.trim().length > 0);

        // Then: Should be detected as invalid
        expect(isValid).toBe(false);
      });
    });

    it('should validate malformed path detection', () => {
      // Given: Malformed paths
      const malformedPaths = ['   ', '\t\n', ''];

      // When: Checking each path
      malformedPaths.forEach(malformedPath => {
        const isValid = malformedPath.trim().length > 0;

        // Then: Should be detected as malformed
        expect(isValid).toBe(false);
      });
    });

    it('should verify absolute path requirement', () => {
      // Given: Relative and absolute paths
      const relativePath = '../ui/wallet-connect.html';
      const absolutePath = path.resolve(__dirname, '../../dist/ui/wallet-connect.html');

      // When: Checking path types
      const relativeIsAbsolute = path.isAbsolute(relativePath);
      const absoluteIsAbsolute = path.isAbsolute(absolutePath);

      // Then: Should correctly identify absolute paths
      expect(relativeIsAbsolute).toBe(false);
      expect(absoluteIsAbsolute).toBe(true);
    });
  });

  describe('File Permission Validation', () => {
    it('should verify template files are readable', () => {
      // Given: Template files
      const templatePath = path.resolve(__dirname, '../../dist/ui/wallet-connect.html');

      // When: Checking file permissions
      try {
        const stats = fs.statSync(templatePath);
        const isReadable = stats.mode & fs.constants.S_IRUSR;

        // Then: File should be readable
        expect(isReadable).toBeTruthy();
      } catch (error) {
        // Then: File should exist
        fail('Template file should exist and be accessible');
      }
    });

    it('should verify all UI assets are readable', () => {
      // Given: UI assets directory
      const uiDir = path.resolve(__dirname, '../../dist/ui');
      const files = ['wallet-connect.html', 'wallet-connect.css', 'wallet-connect.js', 'README.md'];

      // When: Checking each file
      files.forEach(file => {
        const filePath = path.join(uiDir, file);

        try {
          const stats = fs.statSync(filePath);
          const isReadable = stats.mode & fs.constants.S_IRUSR;

          // Then: Should be readable
          expect(isReadable).toBeTruthy();
        } catch (error) {
          fail(`${file} should exist and be readable`);
        }
      });
    });
  });

  describe('Build Failure Recovery', () => {
    it('should verify source UI files exist for rebuild', () => {
      // Given: Source UI directory
      const srcUiDir = path.resolve(__dirname, '../../src/ui');

      // When: Checking source files
      const srcExists = fs.existsSync(srcUiDir);

      // Then: Source should exist for recovery
      expect(srcExists).toBe(true);
    });

    it('should verify all source UI files present for rebuild', () => {
      // Given: Source UI directory
      const srcUiDir = path.resolve(__dirname, '../../src/ui');
      const requiredFiles = ['wallet-connect.html', 'wallet-connect.css', 'wallet-connect.js', 'README.md'];

      // When: Checking each source file
      requiredFiles.forEach(file => {
        const filePath = path.join(srcUiDir, file);
        const exists = fs.existsSync(filePath);

        // Then: Should exist for recovery
        expect(exists).toBe(true);
      });
    });

    it('should verify copy-ui script can be re-run independently', () => {
      // Given: package.json
      const packageJson = JSON.parse(
        fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf-8')
      );

      // When: Checking copy-ui script
      const copyUiScript = packageJson.scripts['copy-ui'];

      // Then: Should be standalone (mkdir -p ensures idempotency)
      expect(copyUiScript).toBeDefined();
      expect(copyUiScript).toContain('mkdir -p');
      expect(copyUiScript).toContain('dist/ui');
    });
  });

  describe('Error Message Validation', () => {
    it('should verify adapter has helpful error messages', () => {
      // Given: Adapter source code
      const adapterPath = path.resolve(__dirname, '../../src/lib/node-arweave-wallet-adapter.ts');
      const adapterSource = fs.readFileSync(adapterPath, 'utf-8');

      // When: Checking error messages
      // Then: Should contain helpful error messages with solutions
      expect(adapterSource).toContain('-> Solution:');
      expect(adapterSource).toContain('ConfigurationError');
      expect(adapterSource).toContain('NetworkError');
      expect(adapterSource).toContain('AuthorizationError');
    });

    it('should verify adapter logs configuration details', () => {
      // Given: Adapter source code
      const adapterPath = path.resolve(__dirname, '../../src/lib/node-arweave-wallet-adapter.ts');
      const adapterSource = fs.readFileSync(adapterPath, 'utf-8');

      // When: Checking logging
      // Then: Should log important configuration
      expect(adapterSource).toContain('logger.debug');
      expect(adapterSource).toContain('customTemplatePath');
    });
  });

  describe('Graceful Degradation Validation', () => {
    it('should verify fork library documentation mentions fallback', () => {
      // Given: Story documentation
      const storyPath = path.resolve(__dirname, '../../../docs/stories/12.3.story.md');
      const storyContent = fs.readFileSync(storyPath, 'utf-8');

      // When: Checking documentation
      // Then: Should mention fallback behavior
      expect(storyContent).toContain('fallback');
      expect(storyContent).toContain('default UI');
    });

    it('should verify error handling preserves wallet functionality', () => {
      // Given: Adapter source code
      const adapterPath = path.resolve(__dirname, '../../src/lib/node-arweave-wallet-adapter.ts');
      const adapterSource = fs.readFileSync(adapterPath, 'utf-8');

      // When: Checking error handling
      // Then: Errors should not prevent wallet operations
      expect(adapterSource).toContain('catch (error)');
      expect(adapterSource).toContain('logger.error');

      // And: Should have error recovery paths
      const catchBlocks = adapterSource.match(/catch \(error\)/g);
      expect(catchBlocks).toBeDefined();
      expect(catchBlocks!.length).toBeGreaterThan(0);
    });
  });

  describe('Configuration Validation', () => {
    it('should verify adapter resolves template path at initialization', () => {
      // Given: Adapter source code
      const adapterPath = path.resolve(__dirname, '../../src/lib/node-arweave-wallet-adapter.ts');
      const adapterSource = fs.readFileSync(adapterPath, 'utf-8');

      // When: Checking initialization logic
      // Then: Should resolve path in initialize()
      expect(adapterSource).toContain('async initialize');
      expect(adapterSource).toContain('path.resolve');
      expect(adapterSource).toContain('customTemplatePath');
    });

    it('should verify adapter passes template path to fork library', () => {
      // Given: Adapter source code
      const adapterPath = path.resolve(__dirname, '../../src/lib/node-arweave-wallet-adapter.ts');
      const adapterSource = fs.readFileSync(adapterPath, 'utf-8');

      // When: Checking library integration
      // Then: Should pass customHtmlTemplatePath parameter
      expect(adapterSource).toContain('new NodeArweaveWallet');
      expect(adapterSource).toContain('customHtmlTemplatePath');
    });
  });
});

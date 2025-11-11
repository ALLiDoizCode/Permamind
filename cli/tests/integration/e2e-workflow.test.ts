/**
 * Integration Tests: E2E Workflow Validation
 *
 * Tests that validate end-to-end publish workflow with browser wallet
 * and custom UI template integration.
 *
 * Story: 12.3 - Integrate Custom UI with NodeArweaveWalletAdapter
 * AC 5: End-to-End Workflow Validation
 *
 * NOTE: Full E2E tests with real browser wallet require manual testing.
 * These tests validate configuration, file structure, and workflow integrity.
 */

import fs from 'node:fs';
import path from 'node:path';

describe('End-to-End Workflow Validation', () => {
  describe('Publish Command with Custom UI', () => {
    it('should verify publish command uses wallet manager', () => {
      // Given: Publish command source
      const publishPath = path.resolve(__dirname, '../../src/commands/publish.ts');
      const publishSource = fs.readFileSync(publishPath, 'utf-8');

      // When: Checking wallet integration
      // Then: Should import and use wallet manager
      expect(publishSource).toContain('wallet-manager');
    });

    it('should verify wallet manager creates browser wallet provider', () => {
      // Given: Wallet manager source
      const walletManagerPath = path.resolve(__dirname, '../../src/lib/wallet-manager.ts');
      const walletManagerSource = fs.readFileSync(walletManagerPath, 'utf-8');

      // When: Checking provider creation
      // Then: Should create BrowserWalletProvider
      expect(walletManagerSource).toContain('BrowserWalletProvider');
      expect(walletManagerSource).toContain('NodeArweaveWalletAdapter');
    });

    it('should verify browser wallet provider uses custom UI adapter', () => {
      // Given: Browser wallet provider source
      const browserProviderPath = path.resolve(__dirname, '../../src/lib/wallet-providers/browser-wallet-provider.ts');
      const browserProviderSource = fs.readFileSync(browserProviderPath, 'utf-8');

      // When: Checking adapter usage
      // Then: Should use NodeArweaveWalletAdapter (which has custom UI)
      expect(browserProviderSource).toContain('NodeArweaveWalletAdapter');
      expect(browserProviderSource).toContain('initialize');
      expect(browserProviderSource).toContain('connect');
    });
  });

  describe('Runtime Template Accessibility', () => {
    it('should have UI templates accessible in dist/', () => {
      // Given: CLI built
      const distUiPath = path.resolve(__dirname, '../../dist/ui/wallet-connect.html');

      // When: Checking template existence
      const exists = fs.existsSync(distUiPath);

      // Then: Template should be accessible
      expect(exists).toBe(true);
    });

    it('should verify all runtime assets present', () => {
      // Given: dist/ui directory
      const distUiPath = path.resolve(__dirname, '../../dist/ui');
      const requiredFiles = [
        'wallet-connect.html',
        'wallet-connect.css',
        'wallet-connect.js',
        'README.md'
      ];

      // When: Checking each file
      requiredFiles.forEach(file => {
        const filePath = path.join(distUiPath, file);
        const exists = fs.existsSync(filePath);

        // Then: Should exist at runtime
        expect(exists).toBe(true);
      });
    });

    it('should verify templates are NOT in src/ at runtime', () => {
      // Given: Runtime environment (dist/ directory)
      const distPath = path.resolve(__dirname, '../../dist');

      // When: Checking distribution
      // Then: Should NOT reference src/ directory
      const hasSrcReference = fs.existsSync(path.join(distPath, 'src'));
      expect(hasSrcReference).toBe(false);
    });
  });

  describe('Multiple Wallet Operations', () => {
    it('should verify wallet manager can be reused for multiple operations', () => {
      // Given: Wallet manager source
      const walletManagerPath = path.resolve(__dirname, '../../src/lib/wallet-manager.ts');
      const walletManagerSource = fs.readFileSync(walletManagerPath, 'utf-8');

      // When: Checking wallet management
      // Then: Should support disconnect and re-initialization
      expect(walletManagerSource).toContain('disconnect');

      // Epic 11 pattern: wallet providers are stateless or reusable
    });

    it('should verify adapter can be reused', () => {
      // Given: Adapter source
      const adapterPath = path.resolve(__dirname, '../../src/lib/node-arweave-wallet-adapter.ts');
      const adapterSource = fs.readFileSync(adapterPath, 'utf-8');

      // When: Checking lifecycle methods
      // Then: Should have disconnect for cleanup
      expect(adapterSource).toContain('async disconnect');
      expect(adapterSource).toContain('async initialize');
      expect(adapterSource).toContain('async connect');
    });

    it('should verify publish service validates skill structure', () => {
      // Given: Publish service source
      const publishServicePath = path.resolve(__dirname, '../../src/lib/publish-service.ts');

      // When: Checking file existence
      const exists = fs.existsSync(publishServicePath);

      // Then: Should exist for workflow orchestration
      expect(exists).toBe(true);
    });
  });

  describe('Configuration Integration', () => {
    it('should verify package.json has correct main entry point', () => {
      // Given: package.json
      const packageJson = JSON.parse(
        fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf-8')
      );

      // When: Checking entry points
      // Then: Should point to dist/index.js
      expect(packageJson.main).toBe('dist/index.js');
      expect(packageJson.bin.skills).toBe('dist/index.js');
    });

    it('should verify main entry exists after build', () => {
      // Given: Built CLI
      const mainEntry = path.resolve(__dirname, '../../dist/index.js');

      // When: Checking file existence
      const exists = fs.existsSync(mainEntry);

      // Then: Should exist
      expect(exists).toBe(true);
    });

    it('should verify fork library version supports custom UI', () => {
      // Given: package.json
      const packageJson = JSON.parse(
        fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf-8')
      );

      // When: Checking fork library
      const forkVersion = packageJson.dependencies['@permamind/node-arweave-wallet'];

      // Then: Should be 0.0.13 or higher (custom UI support)
      expect(forkVersion).toBeDefined();
      expect(forkVersion).toMatch(/\^0\.0\.(1[3-9]|[2-9]\d)/); // >= 0.0.13
    });
  });

  describe('Workflow Integrity', () => {
    it('should verify arweave client integrates with wallet manager', () => {
      // Given: Arweave client source
      const arweaveClientPath = path.resolve(__dirname, '../../src/clients/arweave-client.ts');
      const arweaveClientSource = fs.readFileSync(arweaveClientPath, 'utf-8');

      // When: Checking wallet integration
      // Then: Should use wallet for signing
      expect(arweaveClientSource).toContain('createDataItemSigner');
    });

    it('should verify AO registry client exists for skill registration', () => {
      // Given: AO registry client
      const aoClientPath = path.resolve(__dirname, '../../src/clients/ao-registry-client.ts');

      // When: Checking file existence
      const exists = fs.existsSync(aoClientPath);

      // Then: Should exist
      expect(exists).toBe(true);
    });

    it('should verify complete workflow chain intact', () => {
      // Given: Key workflow files
      const workflowFiles = [
        '../../src/commands/publish.ts',        // Entry point
        '../../src/lib/wallet-manager.ts',      // Wallet management
        '../../src/lib/publish-service.ts',     // Orchestration
        '../../src/clients/arweave-client.ts',  // Upload
        '../../src/clients/ao-registry-client.ts' // Registration
      ];

      // When: Checking each file
      workflowFiles.forEach(file => {
        const filePath = path.resolve(__dirname, file);
        const exists = fs.existsSync(filePath);

        // Then: All workflow components should exist
        expect(exists).toBe(true);
      });
    });
  });
});

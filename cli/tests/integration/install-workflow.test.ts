/**
 * Integration tests for install command end-to-end workflow
 *
 * Tests the complete installation flow:
 * - Query registry for skill metadata
 * - Resolve dependency tree
 * - Download bundles from Arweave
 * - Extract files to installation directory
 * - Update lock file
 */

import { execute, resolveInstallLocation } from '../../src/commands/install.js';
import { IInstallOptions } from '../../src/types/commands.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// Mock modules
jest.mock('../../src/clients/ao-registry-client.js');
jest.mock('../../src/clients/arweave-client.js');
jest.mock('../../src/lib/dependency-resolver.js');
jest.mock('../../src/lib/bundler.js');
jest.mock('../../src/lib/lock-file-manager.js');

import { getSkill } from '../../src/clients/ao-registry-client.js';
import { downloadBundle } from '../../src/clients/arweave-client.js';
import { resolve as resolveDependencies } from '../../src/lib/dependency-resolver.js';
import { extract as extractBundle } from '../../src/lib/bundler.js';
import { update as updateLockFile, resolveLockFilePath } from '../../src/lib/lock-file-manager.js';

describe('Install Command Integration', () => {
  let tempDir: string;

  beforeEach(async () => {
    // Create temp directory for test installations
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'install-test-'));

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Successful Installations', () => {
    it('should install skill with no dependencies successfully', async () => {
      // Arrange: Mock skill with no dependencies
      const mockMetadata = {
        name: 'test-skill',
        version: '1.0.0',
        description: 'Test skill',
        author: 'test-author',
        owner: 'test-owner-address-43chars-exactlyxxxxx',
        tags: ['test'],
        dependencies: [],
        arweaveTxId: 'test-txid-43chars-exactly-xxxxxxxxxxxxxx',
        publishedAt: Date.now(),
        updatedAt: Date.now()
      };

      const mockBuffer = Buffer.from('test-bundle-content');
      const mockTree = {
        root: {
          name: 'test-skill',
          version: '1.0.0',
          dependencies: [],
          depth: 0,
          isInstalled: false
        },
        flatList: [{
          name: 'test-skill',
          version: '1.0.0',
          dependencies: [],
          depth: 0,
          isInstalled: false
        }],
        maxDepth: 0
      };

      (getSkill as jest.Mock).mockResolvedValue(mockMetadata);
      (downloadBundle as jest.Mock).mockResolvedValue(mockBuffer);
      (resolveDependencies as jest.Mock).mockResolvedValue(mockTree);
      (extractBundle as jest.Mock).mockResolvedValue({ success: true });
      (resolveLockFilePath as jest.Mock).mockReturnValue(path.join(tempDir, 'skills-lock.json'));
      (updateLockFile as jest.Mock).mockResolvedValue(undefined);

      const options: IInstallOptions = {
        local: true,
        verbose: false,
        force: false,
        noLock: false
      };

      // Act
      const result = await execute('test-skill', options);

      // Assert
      expect(result).toBeDefined();
      expect(result.installedSkills).toHaveLength(1);
      expect(result.installedSkills[0]).toBe('test-skill@1.0.0');
      expect(result.dependencyCount).toBe(0);
      expect(result.elapsedTime).toBeGreaterThan(0);

      // Verify mocks were called correctly
      expect(getSkill).toHaveBeenCalledWith('test-skill');
      expect(downloadBundle).toHaveBeenCalledWith(
        'test-txid-43chars-exactly-xxxxxxxxxxxxxx',
        expect.objectContaining({ progressCallback: expect.any(Function) })
      );
      expect(extractBundle).toHaveBeenCalled();
      expect(updateLockFile).toHaveBeenCalled();
    });

    it('should install skill with multi-level dependencies', async () => {
      // Arrange: Mock skill with 2 levels of dependencies
      const rootSkill = {
        name: 'parent-skill',
        version: '2.0.0',
        description: 'Parent skill',
        author: 'test-author',
        owner: 'test-owner-address-43chars-exactlyxxxxx',
        tags: ['parent'],
        dependencies: ['child-skill'],
        arweaveTxId: 'parent-txid-43chars-exactly-xxxxxxxxxxx',
        publishedAt: Date.now(),
        updatedAt: Date.now()
      };

      const childSkill = {
        name: 'child-skill',
        version: '1.5.0',
        description: 'Child skill',
        author: 'test-author',
        owner: 'test-owner-address-43chars-exactlyxxxxx',
        tags: ['child'],
        dependencies: ['grandchild-skill'],
        arweaveTxId: 'child-txid-43chars-exactly-xxxxxxxxxxxx',
        publishedAt: Date.now(),
        updatedAt: Date.now()
      };

      const grandchildSkill = {
        name: 'grandchild-skill',
        version: '1.0.0',
        description: 'Grandchild skill',
        author: 'test-author',
        owner: 'test-owner-address-43chars-exactlyxxxxx',
        tags: ['grandchild'],
        dependencies: [],
        arweaveTxId: 'grandchild-txid-43chars-exactly-xxxxxxxx',
        publishedAt: Date.now(),
        updatedAt: Date.now()
      };

      // Mock getSkill to return different skills based on name
      (getSkill as jest.Mock).mockImplementation((name: string) => {
        if (name === 'parent-skill') return Promise.resolve(rootSkill);
        if (name === 'child-skill') return Promise.resolve(childSkill);
        if (name === 'grandchild-skill') return Promise.resolve(grandchildSkill);
        return Promise.resolve(null);
      });

      const mockBuffer = Buffer.from('test-bundle-content');
      (downloadBundle as jest.Mock).mockResolvedValue(mockBuffer);

      const mockTree = {
        root: {
          name: 'parent-skill',
          version: '2.0.0',
          dependencies: [
            {
              name: 'child-skill',
              version: '1.5.0',
              dependencies: [
                {
                  name: 'grandchild-skill',
                  version: '1.0.0',
                  dependencies: [],
                  depth: 2,
                  isInstalled: false
                }
              ],
              depth: 1,
              isInstalled: false
            }
          ],
          depth: 0,
          isInstalled: false
        },
        flatList: [
          { name: 'grandchild-skill', version: '1.0.0', dependencies: [], depth: 2, isInstalled: false },
          { name: 'child-skill', version: '1.5.0', dependencies: [], depth: 1, isInstalled: false },
          { name: 'parent-skill', version: '2.0.0', dependencies: [], depth: 0, isInstalled: false }
        ],
        maxDepth: 2
      };

      (resolveDependencies as jest.Mock).mockResolvedValue(mockTree);
      (extractBundle as jest.Mock).mockResolvedValue({ success: true });
      (resolveLockFilePath as jest.Mock).mockReturnValue(path.join(tempDir, 'skills-lock.json'));
      (updateLockFile as jest.Mock).mockResolvedValue(undefined);

      const options: IInstallOptions = {
        local: true,
        verbose: true,
        force: false,
        noLock: false
      };

      // Act
      const result = await execute('parent-skill', options);

      // Assert
      expect(result.installedSkills).toHaveLength(3);
      expect(result.dependencyCount).toBe(2);
      expect(result.installedSkills).toContain('grandchild-skill@1.0.0');
      expect(result.installedSkills).toContain('child-skill@1.5.0');
      expect(result.installedSkills).toContain('parent-skill@2.0.0');

      // Verify dependency resolution was called
      expect(resolveDependencies).toHaveBeenCalledWith(
        'parent-skill',
        expect.objectContaining({
          maxDepth: 10,
          skipInstalled: true,
          verbose: true
        })
      );
    });

    it('should handle force flag for overwriting existing installations', async () => {
      // Arrange
      const mockMetadata = {
        name: 'existing-skill',
        version: '1.0.0',
        description: 'Existing skill',
        author: 'test-author',
        owner: 'test-owner-address-43chars-exactlyxxxxx',
        tags: ['test'],
        dependencies: [],
        arweaveTxId: 'existing-txid-43chars-exactly-xxxxxxxxx',
        publishedAt: Date.now(),
        updatedAt: Date.now()
      };

      const mockBuffer = Buffer.from('test-bundle-content');
      const mockTree = {
        root: {
          name: 'existing-skill',
          version: '1.0.0',
          dependencies: [],
          depth: 0,
          isInstalled: false
        },
        flatList: [{
          name: 'existing-skill',
          version: '1.0.0',
          dependencies: [],
          depth: 0,
          isInstalled: false
        }],
        maxDepth: 0
      };

      (getSkill as jest.Mock).mockResolvedValue(mockMetadata);
      (downloadBundle as jest.Mock).mockResolvedValue(mockBuffer);
      (resolveDependencies as jest.Mock).mockResolvedValue(mockTree);
      (extractBundle as jest.Mock).mockResolvedValue({ success: true });
      (resolveLockFilePath as jest.Mock).mockReturnValue(path.join(tempDir, 'skills-lock.json'));
      (updateLockFile as jest.Mock).mockResolvedValue(undefined);

      const options: IInstallOptions = {
        local: true,
        force: true,  // Force overwrite
        verbose: false,
        noLock: false
      };

      // Act
      const result = await execute('existing-skill', options);

      // Assert
      expect(result.installedSkills).toHaveLength(1);

      // Verify force flag was passed to extractBundle
      expect(extractBundle).toHaveBeenCalledWith(
        mockBuffer,
        expect.objectContaining({
          force: true
        })
      );
    });

    it('should skip lock file update when --no-lock is set', async () => {
      // Arrange
      const mockMetadata = {
        name: 'no-lock-skill',
        version: '1.0.0',
        description: 'Test skill without lock file',
        author: 'test-author',
        owner: 'test-owner-address-43chars-exactlyxxxxx',
        tags: ['test'],
        dependencies: [],
        arweaveTxId: 'no-lock-txid-43chars-exactly-xxxxxxxxx',
        publishedAt: Date.now(),
        updatedAt: Date.now()
      };

      const mockBuffer = Buffer.from('test-bundle-content');
      const mockTree = {
        root: {
          name: 'no-lock-skill',
          version: '1.0.0',
          dependencies: [],
          depth: 0,
          isInstalled: false
        },
        flatList: [{
          name: 'no-lock-skill',
          version: '1.0.0',
          dependencies: [],
          depth: 0,
          isInstalled: false
        }],
        maxDepth: 0
      };

      (getSkill as jest.Mock).mockResolvedValue(mockMetadata);
      (downloadBundle as jest.Mock).mockResolvedValue(mockBuffer);
      (resolveDependencies as jest.Mock).mockResolvedValue(mockTree);
      (extractBundle as jest.Mock).mockResolvedValue({ success: true });

      const options: IInstallOptions = {
        local: true,
        noLock: true,  // Skip lock file
        verbose: false,
        force: false
      };

      // Act
      const result = await execute('no-lock-skill', options);

      // Assert
      expect(result.installedSkills).toHaveLength(1);

      // Verify lock file update was NOT called
      expect(updateLockFile).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle skill not found error', async () => {
      // Arrange
      (getSkill as jest.Mock).mockResolvedValue(null);

      const options: IInstallOptions = {
        local: true,
        verbose: false,
        force: false,
        noLock: false
      };

      // Act & Assert
      await expect(execute('nonexistent-skill', options)).rejects.toThrow(
        /Skill 'nonexistent-skill' not found in registry/
      );

      // Verify getSkill was called but nothing else
      expect(getSkill).toHaveBeenCalledWith('nonexistent-skill', undefined);
      expect(downloadBundle).not.toHaveBeenCalled();
      expect(extractBundle).not.toHaveBeenCalled();
    });

    it('should handle network failure during download', async () => {
      // Arrange
      const mockMetadata = {
        name: 'network-fail-skill',
        version: '1.0.0',
        description: 'Test skill',
        author: 'test-author',
        owner: 'test-owner-address-43chars-exactlyxxxxx',
        tags: ['test'],
        dependencies: [],
        arweaveTxId: 'network-fail-txid-43chars-exactly-xxxxx',
        publishedAt: Date.now(),
        updatedAt: Date.now()
      };

      const mockTree = {
        root: {
          name: 'network-fail-skill',
          version: '1.0.0',
          dependencies: [],
          depth: 0,
          isInstalled: false
        },
        flatList: [{
          name: 'network-fail-skill',
          version: '1.0.0',
          dependencies: [],
          depth: 0,
          isInstalled: false
        }],
        maxDepth: 0
      };

      (getSkill as jest.Mock).mockResolvedValue(mockMetadata);
      (resolveDependencies as jest.Mock).mockResolvedValue(mockTree);
      (downloadBundle as jest.Mock).mockRejectedValue(new Error('Network timeout'));

      const options: IInstallOptions = {
        local: true,
        verbose: false,
        force: false,
        noLock: false
      };

      // Act & Assert
      await expect(execute('network-fail-skill', options)).rejects.toThrow(
        /Failed to download bundle from Arweave/
      );

      // Verify extraction was not attempted
      expect(extractBundle).not.toHaveBeenCalled();
    });

    it('should handle extraction failure', async () => {
      // Arrange
      const mockMetadata = {
        name: 'extract-fail-skill',
        version: '1.0.0',
        description: 'Test skill',
        author: 'test-author',
        owner: 'test-owner-address-43chars-exactlyxxxxx',
        tags: ['test'],
        dependencies: [],
        arweaveTxId: 'extract-fail-txid-43chars-exactly-xxxxx',
        publishedAt: Date.now(),
        updatedAt: Date.now()
      };

      const mockBuffer = Buffer.from('corrupted-bundle');
      const mockTree = {
        root: {
          name: 'extract-fail-skill',
          version: '1.0.0',
          dependencies: [],
          depth: 0,
          isInstalled: false
        },
        flatList: [{
          name: 'extract-fail-skill',
          version: '1.0.0',
          dependencies: [],
          depth: 0,
          isInstalled: false
        }],
        maxDepth: 0
      };

      (getSkill as jest.Mock).mockResolvedValue(mockMetadata);
      (downloadBundle as jest.Mock).mockResolvedValue(mockBuffer);
      (resolveDependencies as jest.Mock).mockResolvedValue(mockTree);
      (extractBundle as jest.Mock).mockRejectedValue(new Error('Invalid tar format'));

      const options: IInstallOptions = {
        local: true,
        verbose: false,
        force: false,
        noLock: false
      };

      // Act & Assert
      await expect(execute('extract-fail-skill', options)).rejects.toThrow(
        /Failed to extract bundle/
      );

      // Verify lock file update was not called
      expect(updateLockFile).not.toHaveBeenCalled();
    });

    it('should handle circular dependency error', async () => {
      // Arrange
      (getSkill as jest.Mock).mockResolvedValue({
        name: 'circular-skill',
        version: '1.0.0',
        description: 'Test skill',
        author: 'test-author',
        owner: 'test-owner-address-43chars-exactlyxxxxx',
        tags: ['test'],
        dependencies: ['circular-skill'],  // Depends on itself
        arweaveTxId: 'circular-txid-43chars-exactly-xxxxxxxx',
        publishedAt: Date.now(),
        updatedAt: Date.now()
      });

      (resolveDependencies as jest.Mock).mockRejectedValue(
        new Error('Circular dependency detected: circular-skill → circular-skill')
      );

      const options: IInstallOptions = {
        local: true,
        verbose: false,
        force: false,
        noLock: false
      };

      // Act & Assert
      await expect(execute('circular-skill', options)).rejects.toThrow(
        /Circular dependency detected/
      );
    });

    it('should gracefully handle lock file update failure', async () => {
      // Arrange
      const mockMetadata = {
        name: 'lock-fail-skill',
        version: '1.0.0',
        description: 'Test skill',
        author: 'test-author',
        owner: 'test-owner-address-43chars-exactlyxxxxx',
        tags: ['test'],
        dependencies: [],
        arweaveTxId: 'lock-fail-txid-43chars-exactly-xxxxxxxx',
        publishedAt: Date.now(),
        updatedAt: Date.now()
      };

      const mockBuffer = Buffer.from('test-bundle-content');
      const mockTree = {
        root: {
          name: 'lock-fail-skill',
          version: '1.0.0',
          dependencies: [],
          depth: 0,
          isInstalled: false
        },
        flatList: [{
          name: 'lock-fail-skill',
          version: '1.0.0',
          dependencies: [],
          depth: 0,
          isInstalled: false
        }],
        maxDepth: 0
      };

      (getSkill as jest.Mock).mockResolvedValue(mockMetadata);
      (downloadBundle as jest.Mock).mockResolvedValue(mockBuffer);
      (resolveDependencies as jest.Mock).mockResolvedValue(mockTree);
      (extractBundle as jest.Mock).mockResolvedValue({ success: true });
      (resolveLockFilePath as jest.Mock).mockReturnValue(path.join(tempDir, 'skills-lock.json'));
      (updateLockFile as jest.Mock).mockRejectedValue(new Error('Permission denied'));

      const options: IInstallOptions = {
        local: true,
        verbose: true,  // Verbose to see warning
        force: false,
        noLock: false
      };

      // Act - Should NOT throw, gracefully degrade
      const result = await execute('lock-fail-skill', options);

      // Assert - Installation should succeed despite lock file failure
      expect(result.installedSkills).toHaveLength(1);
      expect(extractBundle).toHaveBeenCalled();
    });
  });

  describe('Non-Interactive Mode', () => {
    it('should run successfully in CI environment (non-TTY)', async () => {
      // Arrange: Set CI environment variable
      const originalCI = process.env.CI;
      process.env.CI = 'true';

      const mockMetadata = {
        name: 'ci-test-skill',
        version: '1.0.0',
        description: 'CI test skill',
        author: 'test-author',
        owner: 'test-owner-address-43chars-exactlyxxxxx',
        tags: ['test'],
        dependencies: [],
        arweaveTxId: 'ci-test-txid-43chars-exactly-xxxxxxxxxxx',
        publishedAt: Date.now(),
        updatedAt: Date.now()
      };

      const mockBuffer = Buffer.from('test-bundle-content');
      const mockTree = {
        root: {
          name: 'ci-test-skill',
          version: '1.0.0',
          dependencies: [],
          depth: 0,
          isInstalled: false
        },
        flatList: [{
          name: 'ci-test-skill',
          version: '1.0.0',
          dependencies: [],
          depth: 0,
          isInstalled: false
        }],
        maxDepth: 0
      };

      (getSkill as jest.Mock).mockResolvedValue(mockMetadata);
      (downloadBundle as jest.Mock).mockResolvedValue(mockBuffer);
      (resolveDependencies as jest.Mock).mockResolvedValue(mockTree);
      (extractBundle as jest.Mock).mockResolvedValue({ success: true });
      (resolveLockFilePath as jest.Mock).mockReturnValue(path.join(tempDir, 'skills-lock.json'));
      (updateLockFile as jest.Mock).mockResolvedValue(undefined);

      const options: IInstallOptions = {
        local: true,
        verbose: false,
        force: false,
        noLock: false
      };

      try {
        // Act
        const result = await execute('ci-test-skill', options);

        // Assert - Should complete successfully in CI mode
        expect(result).toBeDefined();
        expect(result.installedSkills).toHaveLength(1);
        expect(result.dependencyCount).toBe(0);

        // Verify all steps executed
        expect(getSkill).toHaveBeenCalled();
        expect(resolveDependencies).toHaveBeenCalled();
        expect(downloadBundle).toHaveBeenCalled();
        expect(extractBundle).toHaveBeenCalled();
      } finally {
        // Cleanup: Restore original CI environment
        if (originalCI === undefined) {
          delete process.env.CI;
        } else {
          process.env.CI = originalCI;
        }
      }
    });

    it('should handle piped output (non-TTY) correctly', async () => {
      // Arrange: Mock non-TTY environment
      const originalIsTTY = process.stdout.isTTY;
      Object.defineProperty(process.stdout, 'isTTY', {
        value: false,
        writable: true,
        configurable: true
      });

      const mockMetadata = {
        name: 'piped-output-skill',
        version: '1.0.0',
        description: 'Piped output test',
        author: 'test-author',
        owner: 'test-owner-address-43chars-exactlyxxxxx',
        tags: ['test'],
        dependencies: [],
        arweaveTxId: 'piped-test-txid-43chars-exactly-xxxxxxx',
        publishedAt: Date.now(),
        updatedAt: Date.now()
      };

      const mockBuffer = Buffer.from('test-bundle-content');
      const mockTree = {
        root: {
          name: 'piped-output-skill',
          version: '1.0.0',
          dependencies: [],
          depth: 0,
          isInstalled: false
        },
        flatList: [{
          name: 'piped-output-skill',
          version: '1.0.0',
          dependencies: [],
          depth: 0,
          isInstalled: false
        }],
        maxDepth: 0
      };

      (getSkill as jest.Mock).mockResolvedValue(mockMetadata);
      (downloadBundle as jest.Mock).mockResolvedValue(mockBuffer);
      (resolveDependencies as jest.Mock).mockResolvedValue(mockTree);
      (extractBundle as jest.Mock).mockResolvedValue({ success: true });
      (resolveLockFilePath as jest.Mock).mockReturnValue(path.join(tempDir, 'skills-lock.json'));
      (updateLockFile as jest.Mock).mockResolvedValue(undefined);

      const options: IInstallOptions = {
        local: true,
        verbose: false,
        force: false,
        noLock: false
      };

      try {
        // Act
        const result = await execute('piped-output-skill', options);

        // Assert - Should complete successfully with piped output
        expect(result).toBeDefined();
        expect(result.installedSkills).toHaveLength(1);
      } finally {
        // Cleanup: Restore original TTY state
        Object.defineProperty(process.stdout, 'isTTY', {
          value: originalIsTTY,
          writable: true,
          configurable: true
        });
      }
    });
  });

  describe('Performance Validation', () => {
    it('should complete typical installation within 10 seconds', async () => {
      // Arrange: Simulate typical installation (3 dependencies)
      const rootSkill = {
        name: 'perf-test-skill',
        version: '1.0.0',
        description: 'Performance test skill',
        author: 'test-author',
        owner: 'test-owner-address-43chars-exactlyxxxxx',
        tags: ['test'],
        dependencies: ['dep1', 'dep2'],
        arweaveTxId: 'perf-root-txid-43chars-exactly-xxxxxxxxx',
        publishedAt: Date.now(),
        updatedAt: Date.now()
      };

      const dep1 = {
        name: 'dep1',
        version: '1.0.0',
        description: 'Dependency 1',
        author: 'test-author',
        owner: 'test-owner-address-43chars-exactlyxxxxx',
        tags: ['test'],
        dependencies: [],
        arweaveTxId: 'dep1-txid-43chars-exactly-xxxxxxxxxxxxxx',
        publishedAt: Date.now(),
        updatedAt: Date.now()
      };

      const dep2 = {
        name: 'dep2',
        version: '1.0.0',
        description: 'Dependency 2',
        author: 'test-author',
        owner: 'test-owner-address-43chars-exactlyxxxxx',
        tags: ['test'],
        dependencies: [],
        arweaveTxId: 'dep2-txid-43chars-exactly-xxxxxxxxxxxxxx',
        publishedAt: Date.now(),
        updatedAt: Date.now()
      };

      (getSkill as jest.Mock).mockImplementation((name: string) => {
        if (name === 'perf-test-skill') return Promise.resolve(rootSkill);
        if (name === 'dep1') return Promise.resolve(dep1);
        if (name === 'dep2') return Promise.resolve(dep2);
        return Promise.resolve(null);
      });

      const mockBuffer = Buffer.from('test-bundle-content');
      (downloadBundle as jest.Mock).mockResolvedValue(mockBuffer);

      const mockTree = {
        root: {
          name: 'perf-test-skill',
          version: '1.0.0',
          dependencies: [],
          depth: 0,
          isInstalled: false
        },
        flatList: [
          { name: 'dep1', version: '1.0.0', dependencies: [], depth: 1, isInstalled: false },
          { name: 'dep2', version: '1.0.0', dependencies: [], depth: 1, isInstalled: false },
          { name: 'perf-test-skill', version: '1.0.0', dependencies: [], depth: 0, isInstalled: false }
        ],
        maxDepth: 1
      };

      (resolveDependencies as jest.Mock).mockResolvedValue(mockTree);
      (extractBundle as jest.Mock).mockResolvedValue({ success: true });
      (resolveLockFilePath as jest.Mock).mockReturnValue(path.join(tempDir, 'skills-lock.json'));
      (updateLockFile as jest.Mock).mockResolvedValue(undefined);

      const options: IInstallOptions = {
        local: true,
        verbose: false,
        force: false,
        noLock: false
      };

      // Act
      const startTime = performance.now();
      const result = await execute('perf-test-skill', options);
      const endTime = performance.now();
      const elapsedSeconds = (endTime - startTime) / 1000;

      // Assert
      expect(result.installedSkills).toHaveLength(3);
      expect(result.dependencyCount).toBe(2);
      expect(elapsedSeconds).toBeLessThan(10);  // NFR3 requirement
      expect(result.elapsedTime).toBeGreaterThan(0);
    }, 15000);  // 15 second timeout for performance test
  });
});

/**
 * Integration tests for InstallService
 *
 * Tests full install workflow with mocked AO registry and Arweave
 */

import { InstallService, IInstallServiceOptions } from '../../src/lib/install-service';
import * as aoRegistryClient from '../../src/clients/ao-registry-client';
import * as arweaveClient from '../../src/clients/arweave-client';
import * as dependencyResolver from '../../src/lib/dependency-resolver';
import * as bundler from '../../src/lib/bundler';
import * as lockFileManager from '../../src/lib/lock-file-manager';
import * as fs from 'fs/promises';

// Mock all external dependencies
jest.mock('../../src/clients/ao-registry-client');
jest.mock('../../src/clients/arweave-client');
jest.mock('../../src/lib/dependency-resolver');
jest.mock('../../src/lib/bundler');
jest.mock('../../src/lib/lock-file-manager');
jest.mock('fs/promises');

describe('InstallService - Integration Tests', () => {
  let service: InstallService;

  beforeEach(() => {
    service = new InstallService();
    jest.clearAllMocks();

    // Setup default mocks
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.access as jest.Mock).mockResolvedValue(undefined);
    (lockFileManager.resolveLockFilePath as jest.Mock).mockReturnValue('/mock/skills-lock.json');
    (lockFileManager.update as jest.Mock).mockResolvedValue(undefined);
    (bundler.extract as jest.Mock).mockResolvedValue({ extractedFiles: [] });
  });

  it('should install skill with latest version', async () => {
    const mockMetadata = {
      name: 'test-skill',
      version: '2.1.0',
      arweaveTxId: 'tx-abc123',
      description: 'Test',
      tags: [],
      publishedAt: Date.now(),
    };

    (aoRegistryClient.getSkill as jest.Mock).mockResolvedValue(mockMetadata);
    (dependencyResolver.resolve as jest.Mock).mockResolvedValue({
      root: { name: 'test-skill', version: '2.1.0', depth: 0, dependencies: [] },
      flatList: [{ name: 'test-skill', version: '2.1.0', depth: 0, dependencies: [] }],
    });
    (arweaveClient.downloadBundle as jest.Mock).mockResolvedValue(Buffer.from('bundle'));

    const result = await service.install('test-skill');

    expect(result.installedSkills).toEqual(['test-skill@2.1.0']);
    expect(result.dependencyCount).toBe(0);
  });

  it('should install skill with multi-level dependencies', async () => {
    const mockMetadata = {
      name: 'root-skill',
      version: '1.0.0',
      arweaveTxId: 'tx-root',
      description: 'Root',
      tags: [],
      publishedAt: Date.now(),
    };

    const dependencyTree = {
      root: {
        name: 'root-skill',
        version: '1.0.0',
        depth: 0,
        dependencies: [
          { name: 'dep1', version: '1.0.0', depth: 1, dependencies: [] },
          { name: 'dep2', version: '1.0.0', depth: 1, dependencies: [] },
        ],
      },
      flatList: [
        { name: 'dep1', version: '1.0.0', depth: 1, dependencies: [] },
        { name: 'dep2', version: '1.0.0', depth: 1, dependencies: [] },
        { name: 'root-skill', version: '1.0.0', depth: 0, dependencies: [] },
      ],
    };

    (aoRegistryClient.getSkill as jest.Mock).mockResolvedValue(mockMetadata);
    (dependencyResolver.resolve as jest.Mock).mockResolvedValue(dependencyTree);
    (arweaveClient.downloadBundle as jest.Mock).mockResolvedValue(Buffer.from('bundle'));

    const result = await service.install('root-skill');

    expect(result.installedSkills.length).toBe(3);
    expect(result.dependencyCount).toBe(2);
    expect(arweaveClient.downloadBundle).toHaveBeenCalledTimes(3);
  });

  it('should respect force flag', async () => {
    const mockMetadata = {
      name: 'test-skill',
      version: '1.0.0',
      arweaveTxId: 'tx-123',
      description: 'Test',
      tags: [],
      publishedAt: Date.now(),
    };

    (aoRegistryClient.getSkill as jest.Mock).mockResolvedValue(mockMetadata);
    (dependencyResolver.resolve as jest.Mock).mockResolvedValue({
      root: { name: 'test-skill', version: '1.0.0', depth: 0, dependencies: [] },
      flatList: [{ name: 'test-skill', version: '1.0.0', depth: 0, dependencies: [] }],
    });
    (arweaveClient.downloadBundle as jest.Mock).mockResolvedValue(Buffer.from('bundle'));

    const options: IInstallServiceOptions = {
      force: true,
    };

    await service.install('test-skill', options);

    expect(dependencyResolver.resolve).toHaveBeenCalledWith('test-skill', {
      maxDepth: 10,
      skipInstalled: false, // force=true means skipInstalled=false
      verbose: false,
    });
  });

  it('should skip lock file when noLock=true', async () => {
    const mockMetadata = {
      name: 'test-skill',
      version: '1.0.0',
      arweaveTxId: 'tx-123',
      description: 'Test',
      tags: [],
      publishedAt: Date.now(),
    };

    (aoRegistryClient.getSkill as jest.Mock).mockResolvedValue(mockMetadata);
    (dependencyResolver.resolve as jest.Mock).mockResolvedValue({
      root: { name: 'test-skill', version: '1.0.0', depth: 0, dependencies: [] },
      flatList: [{ name: 'test-skill', version: '1.0.0', depth: 0, dependencies: [] }],
    });
    (arweaveClient.downloadBundle as jest.Mock).mockResolvedValue(Buffer.from('bundle'));

    const options: IInstallServiceOptions = {
      noLock: true,
    };

    await service.install('test-skill', options);

    expect(lockFileManager.update).not.toHaveBeenCalled();
  });
});

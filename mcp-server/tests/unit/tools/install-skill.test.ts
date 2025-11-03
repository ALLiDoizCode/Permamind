/**
 * Unit tests for install-skill MCP tool
 *
 * Tests the handleInstallSkill function, error translation,
 * and response formatting with mocked dependencies.
 */

import {
  handleInstallSkill,
  translateError,
  formatSuccessResponse,
} from '../../../src/tools/install-skill';
import { InstallService } from '@permamind/skills-cli/src/lib/install-service';
import type { IInstallResult } from '@permamind/skills-cli/src/lib/install-service';
import {
  ValidationError,
  ConfigurationError,
  NetworkError,
  FileSystemError,
  DependencyError,
} from '@permamind/skills-cli/src/types/errors';

// Mock dependencies
jest.mock('@permamind/skills-cli/src/lib/install-service');
jest.mock('../../../src/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('install-skill tool', () => {
  const mockInstallResult: IInstallResult = {
    installedSkills: ['ao-basics@1.0.0'],
    dependencyCount: 0,
    totalSize: 50000,
    elapsedTime: 2.5,
  };

  const mockInstallResultWithDeps: IInstallResult = {
    installedSkills: ['ao-basics@1.0.0', 'arweave-fundamentals@1.5.0', 'lua-basics@1.0.0'],
    dependencyCount: 2,
    totalSize: 150000,
    elapsedTime: 5.2,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleInstallSkill', () => {
    it('should successfully install skill without dependencies', async () => {
      // Arrange
      (InstallService.prototype.install as jest.Mock).mockResolvedValue(mockInstallResult);

      // Act
      const result = await handleInstallSkill('ao-basics', false, undefined, false);

      // Assert
      expect(result.result).toEqual(mockInstallResult);
      expect(result.installLocation).toMatch(/\.claude\/skills$/);
      expect(InstallService.prototype.install).toHaveBeenCalledWith('ao-basics', {
        force: false,
        installLocation: undefined,
        verbose: false,
      });
    });

    it('should successfully install skill with dependencies', async () => {
      // Arrange
      (InstallService.prototype.install as jest.Mock).mockResolvedValue(mockInstallResultWithDeps);

      // Act
      const result = await handleInstallSkill('ao-basics', false, undefined, false);

      // Assert
      expect(result.result).toEqual(mockInstallResultWithDeps);
      expect(result.result.installedSkills).toHaveLength(3);
      expect(result.result.dependencyCount).toBe(2);
    });

    it('should support name@version format', async () => {
      // Arrange
      (InstallService.prototype.install as jest.Mock).mockResolvedValue(mockInstallResult);

      // Act
      await handleInstallSkill('ao-basics@1.0.0', false, undefined, false);

      // Assert
      expect(InstallService.prototype.install).toHaveBeenCalledWith('ao-basics@1.0.0', {
        force: false,
        installLocation: undefined,
        verbose: false,
      });
    });

    it('should pass force parameter correctly', async () => {
      // Arrange
      (InstallService.prototype.install as jest.Mock).mockResolvedValue(mockInstallResult);

      // Act
      await handleInstallSkill('ao-basics', true, undefined, false);

      // Assert
      expect(InstallService.prototype.install).toHaveBeenCalledWith('ao-basics', {
        force: true,
        installLocation: undefined,
        verbose: false,
      });
    });

    it('should pass custom install location correctly', async () => {
      // Arrange
      const customLocation = '/custom/path/skills';
      (InstallService.prototype.install as jest.Mock).mockResolvedValue(mockInstallResult);

      // Act
      const result = await handleInstallSkill('ao-basics', false, customLocation, false);

      // Assert
      expect(result.installLocation).toBe(customLocation);
      expect(InstallService.prototype.install).toHaveBeenCalledWith('ao-basics', {
        force: false,
        installLocation: customLocation,
        verbose: false,
      });
    });

    it('should enable verbose logging when requested', async () => {
      // Arrange
      (InstallService.prototype.install as jest.Mock).mockResolvedValue(mockInstallResult);

      // Act
      await handleInstallSkill('ao-basics', false, undefined, true);

      // Assert
      expect(InstallService.prototype.install).toHaveBeenCalledWith('ao-basics', {
        force: false,
        installLocation: undefined,
        verbose: true,
      });
    });

    it('should use default install location when not specified', async () => {
      // Arrange
      (InstallService.prototype.install as jest.Mock).mockResolvedValue(mockInstallResult);

      // Act
      const result = await handleInstallSkill('ao-basics', false, undefined, false);

      // Assert
      expect(result.installLocation).toBeTruthy();
      expect(result.installLocation).toMatch(/\.claude\/skills$/);
    });

    it('should propagate ValidationError from InstallService', async () => {
      // Arrange
      const error = new ValidationError(
        'Invalid skill name format',
        'skillName',
        'Invalid@Name',
        'lowercase letters, numbers, and hyphens'
      );
      (InstallService.prototype.install as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(handleInstallSkill('Invalid@Name', false, undefined, false)).rejects.toThrow(
        ValidationError
      );
    });

    it('should propagate NetworkError from InstallService', async () => {
      // Arrange
      const originalError = new Error('Network timeout');
      const error = new NetworkError(
        'Failed to download skill bundle',
        originalError,
        'https://arweave.net',
        'timeout'
      );
      (InstallService.prototype.install as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(handleInstallSkill('ao-basics', false, undefined, false)).rejects.toThrow(
        NetworkError
      );
    });

    it('should propagate FileSystemError from InstallService', async () => {
      // Arrange
      const error = new FileSystemError(
        'Installation directory not writable',
        '/path/to/skills'
      );
      (InstallService.prototype.install as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(handleInstallSkill('ao-basics', false, undefined, false)).rejects.toThrow(
        FileSystemError
      );
    });

    it('should propagate DependencyError from InstallService', async () => {
      // Arrange
      const error = new DependencyError(
        'Circular dependency detected: A→B→C→A',
        'skill-a',
        ['skill-root', 'skill-a', 'skill-b', 'skill-c', 'skill-a']
      );
      (InstallService.prototype.install as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(handleInstallSkill('skill-a', false, undefined, false)).rejects.toThrow(
        DependencyError
      );
    });
  });

  describe('formatSuccessResponse', () => {
    it('should format response for skill without dependencies', () => {
      // Act
      const response = formatSuccessResponse(mockInstallResult, '/home/user/.claude/skills');

      // Assert
      expect(response).toEqual({
        status: 'success',
        message: 'Successfully installed ao-basics@1.0.0',
        installedSkills: ['ao-basics@1.0.0'],
        dependencyCount: 0,
        totalSize: 50000,
        elapsedTime: 2.5,
        installLocation: '/home/user/.claude/skills',
      });
    });

    it('should format response for skill with single dependency', () => {
      // Arrange
      const resultWithOneDep: IInstallResult = {
        installedSkills: ['ao-basics@1.0.0', 'arweave-fundamentals@1.5.0'],
        dependencyCount: 1,
        totalSize: 100000,
        elapsedTime: 3.5,
      };

      // Act
      const response = formatSuccessResponse(resultWithOneDep, '/home/user/.claude/skills');

      // Assert
      expect(response.message).toContain('1 dependency');
      expect(response.dependencyCount).toBe(1);
    });

    it('should format response for skill with multiple dependencies', () => {
      // Act
      const response = formatSuccessResponse(mockInstallResultWithDeps, '/home/user/.claude/skills');

      // Assert
      expect(response.message).toContain('2 dependencies');
      expect(response.dependencyCount).toBe(2);
      expect(response.installedSkills).toHaveLength(3);
    });

    it('should include custom install location in response', () => {
      // Act
      const customLocation = '/custom/path/skills';
      const response = formatSuccessResponse(mockInstallResult, customLocation);

      // Assert
      expect(response.installLocation).toBe(customLocation);
    });

    it('should include all metadata fields', () => {
      // Act
      const response = formatSuccessResponse(mockInstallResult, '/home/user/.claude/skills');

      // Assert
      expect(response).toHaveProperty('status', 'success');
      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('installedSkills');
      expect(response).toHaveProperty('dependencyCount');
      expect(response).toHaveProperty('totalSize');
      expect(response).toHaveProperty('elapsedTime');
      expect(response).toHaveProperty('installLocation');
    });
  });

  describe('translateError', () => {
    it('should translate ValidationError correctly', () => {
      // Arrange
      const error = new ValidationError(
        'Invalid skill name format',
        'skillName',
        'Invalid@Name',
        'lowercase letters, numbers, and hyphens'
      );

      // Act
      const response = translateError(error);

      // Assert
      expect(response).toEqual({
        status: 'error',
        errorType: 'ValidationError',
        message: 'Invalid skill name format',
        solution: expect.stringContaining('Check skill name format'),
        details: {
          field: 'skillName',
          value: 'Invalid@Name',
          expected: 'lowercase letters, numbers, and hyphens',
        },
      });
    });

    it('should translate ConfigurationError correctly', () => {
      // Arrange
      const error = new ConfigurationError(
        'AO registry process ID not configured',
        'AO_REGISTRY_PROCESS_ID'
      );

      // Act
      const response = translateError(error);

      // Assert
      expect(response).toEqual({
        status: 'error',
        errorType: 'ConfigurationError',
        message: 'AO registry process ID not configured',
        solution: expect.stringContaining('Verify AO registry process ID'),
      });
    });

    it('should translate DependencyError correctly', () => {
      // Arrange
      const error = new DependencyError(
        'Circular dependency detected: A→B→C→A',
        'skill-a',
        ['skill-root', 'skill-a', 'skill-b', 'skill-c', 'skill-a']
      );

      // Act
      const response = translateError(error);

      // Assert
      expect(response).toEqual({
        status: 'error',
        errorType: 'DependencyError',
        message: 'Circular dependency detected: A→B→C→A',
        solution: expect.stringContaining('circular dependencies'),
        details: {
          dependencyName: 'skill-a',
          dependencyPath: ['skill-root', 'skill-a', 'skill-b', 'skill-c', 'skill-a'],
        },
      });
    });

    it('should translate NetworkError correctly', () => {
      // Arrange
      const originalError = new Error('Network timeout');
      const error = new NetworkError(
        'Failed to download skill bundle',
        originalError,
        'https://arweave.net',
        'timeout'
      );

      // Act
      const response = translateError(error);

      // Assert
      expect(response).toEqual({
        status: 'error',
        errorType: 'NetworkError',
        message: 'Failed to download skill bundle',
        solution: expect.stringContaining('network connection'),
        details: {
          gatewayUrl: 'https://arweave.net',
          errorType: 'timeout',
        },
      });
    });

    it('should translate FileSystemError correctly', () => {
      // Arrange
      const error = new FileSystemError(
        'Installation directory not writable',
        '/path/to/skills'
      );

      // Act
      const response = translateError(error);

      // Assert
      expect(response).toEqual({
        status: 'error',
        errorType: 'FileSystemError',
        message: 'Installation directory not writable',
        solution: expect.stringContaining('file permissions'),
        details: {
          path: '/path/to/skills',
        },
      });
    });

    it('should translate unknown errors correctly', () => {
      // Arrange
      const error = new Error('Something unexpected happened');

      // Act
      const response = translateError(error);

      // Assert
      expect(response).toEqual({
        status: 'error',
        errorType: 'UnknownError',
        message: 'Something unexpected happened',
        solution: 'Check the MCP server logs for more details about this error.',
      });
    });

    it('should include actionable solutions for all error types', () => {
      // Arrange
      const errors = [
        new ValidationError('Invalid', 'field', 'value'),
        new ConfigurationError('Missing config', 'key'),
        new DependencyError('Circular', 'skill', ['a', 'b', 'c']),
        new NetworkError('Network failed', new Error(), 'https://example.com'),
        new FileSystemError('File error', '/path'),
      ];

      // Act & Assert
      errors.forEach((error) => {
        const response = translateError(error);
        expect(response.solution).toBeTruthy();
        expect(response.solution.length).toBeGreaterThan(10);
      });
    });
  });
});

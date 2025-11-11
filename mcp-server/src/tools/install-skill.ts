/**
 * Install Skill MCP Tool
 *
 * Exposes InstallService functionality as an MCP tool for Claude AI integration.
 * Installs skills from the Agent Skills Registry with automatic dependency resolution.
 */

import { InstallService } from '@permamind/skills-cli/lib/install-service';
import type { IInstallResult } from '@permamind/skills-cli/lib/install-service';
import {
  ValidationError,
  ConfigurationError,
  NetworkError,
  FileSystemError,
  DependencyError,
} from '@permamind/skills-cli/types/errors';
import { logger } from '../logger.js';

/**
 * MCP error response format
 */
export interface IMCPErrorResponse {
  status: 'error';
  errorType: string;
  message: string;
  solution: string;
  details?: Record<string, unknown>;
}

/**
 * MCP success response format
 */
export interface IMCPSuccessResponse {
  status: 'success';
  message: string;
  installedSkills: string[];
  dependencyCount: number;
  totalSize: number;
  elapsedTime: number;
  installLocation: string;
}

/**
 * Translate InstallService errors to MCP error responses
 *
 * @param error - Error from InstallService
 * @returns MCP error response with actionable solution
 */
export function translateError(error: Error): IMCPErrorResponse {
  logger.error('Error during install:', {
    errorType: error.constructor.name,
    message: error.message,
    stack: error.stack,
  });

  if (error instanceof ValidationError) {
    return {
      status: 'error',
      errorType: 'ValidationError',
      message: error.message,
      solution:
        'Check skill name format. Use name@version (e.g., ao-basics@1.0.0) or just name for latest version.',
      details: {
        field: error.field,
        value: error.value,
        ...(error.expected && { expected: error.expected }),
        ...(error.schemaError && { schemaError: error.schemaError }),
      },
    };
  }

  if (error instanceof ConfigurationError) {
    return {
      status: 'error',
      errorType: 'ConfigurationError',
      message: error.message,
      solution:
        'Verify AO registry process ID is configured. Check environment variables or config file.',
    };
  }

  if (error instanceof DependencyError) {
    return {
      status: 'error',
      errorType: 'DependencyError',
      message: error.message,
      solution:
        'Check dependency chain for circular dependencies or missing skills. Contact skill author if issue persists.',
      details: {
        dependencyName: error.dependencyName,
        dependencyPath: error.dependencyPath,
      },
    };
  }

  if (error instanceof NetworkError) {
    return {
      status: 'error',
      errorType: 'NetworkError',
      message: error.message,
      solution:
        'Check your network connection and try again. Arweave or AO network may be temporarily unavailable.',
      details: {
        gatewayUrl: error.gatewayUrl,
        errorType: error.errorType,
      },
    };
  }

  if (error instanceof FileSystemError) {
    return {
      status: 'error',
      errorType: 'FileSystemError',
      message: error.message,
      solution:
        'Check file permissions and ensure the installation directory is writable.',
      details: {
        path: error.path,
      },
    };
  }

  // Unknown error
  return {
    status: 'error',
    errorType: 'UnknownError',
    message: error.message,
    solution: 'Check the MCP server logs for more details about this error.',
  };
}

/**
 * Format install result as MCP success response
 *
 * @param result - Install result from InstallService
 * @param installLocation - Installation directory path
 * @returns MCP success response with formatted data
 */
export function formatSuccessResponse(
  result: IInstallResult,
  installLocation: string
): IMCPSuccessResponse {
  const rootSkill = result.installedSkills[0] || 'unknown';

  return {
    status: 'success',
    message:
      result.installedSkills.length > 1
        ? `Successfully installed ${rootSkill} with ${result.dependencyCount} ${result.dependencyCount === 1 ? 'dependency' : 'dependencies'}`
        : `Successfully installed ${rootSkill}`,
    installedSkills: result.installedSkills,
    dependencyCount: result.dependencyCount,
    totalSize: result.totalSize,
    elapsedTime: result.elapsedTime,
    installLocation,
  };
}

/**
 * Handle install_skill MCP tool invocation
 *
 * @param skillName - Name of skill to install (supports name@version format)
 * @param force - Overwrite existing installations (default: false)
 * @param installLocation - Custom installation directory (optional)
 * @param verbose - Enable verbose debug logging (default: false)
 * @returns Install result with metadata
 * @throws Error if install fails (caller should use translateError)
 */
export async function handleInstallSkill(
  skillName: string,
  force: boolean = false,
  installLocation?: string,
  verbose: boolean = false
): Promise<{ result: IInstallResult; installLocation: string }> {
  logger.info('Starting install_skill tool', {
    skillName,
    force,
    installLocation,
    verbose,
  });

  // Instantiate InstallService
  const installService = new InstallService();

  // Call install with options
  const result = await installService.install(skillName, {
    force,
    installLocation,
    verbose,
  });

  // Determine final install location for response
  // Default: ~/.claude/skills (matches InstallService default for global installs)
  const finalLocation = installLocation || `${process.env.HOME}/.claude/skills`;

  logger.info('Install complete', {
    skillName,
    installedCount: result.installedSkills.length,
    dependencyCount: result.dependencyCount,
    totalSize: result.totalSize,
    elapsedTime: result.elapsedTime,
  });

  return {
    result,
    installLocation: finalLocation,
  };
}

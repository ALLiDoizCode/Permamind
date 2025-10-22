/**
 * Platform Detection and Testing Utilities
 * Story 5.1: Cross-platform testing helpers
 */

import * as os from 'os';

export interface PlatformInfo {
  platform: NodeJS.Platform;
  isWindows: boolean;
  isMacOS: boolean;
  isLinux: boolean;
  nodeVersion: string;
  nodeMajorVersion: number;
  pathSeparator: string;
  homedir: string;
  tmpdir: string;
}

/**
 * Get comprehensive platform information
 */
export function getPlatformInfo(): PlatformInfo {
  const platform = process.platform;
  const nodeVersion = process.version;
  const nodeMajorVersion = parseInt(nodeVersion.split('.')[0].slice(1), 10);

  return {
    platform,
    isWindows: platform === 'win32',
    isMacOS: platform === 'darwin',
    isLinux: platform === 'linux',
    nodeVersion,
    nodeMajorVersion,
    pathSeparator: platform === 'win32' ? '\\' : '/',
    homedir: os.homedir(),
    tmpdir: os.tmpdir(),
  };
}

/**
 * Check if current platform is Windows
 */
export function isWindows(): boolean {
  return process.platform === 'win32';
}

/**
 * Check if current platform is macOS
 */
export function isMacOS(): boolean {
  return process.platform === 'darwin';
}

/**
 * Check if current platform is Linux
 */
export function isLinux(): boolean {
  return process.platform === 'linux';
}

/**
 * Check if running on GitHub Actions CI
 */
export function isCI(): boolean {
  return process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
}

/**
 * Check if TTY (interactive terminal) is available
 */
export function isTTY(): boolean {
  return process.stdout.isTTY === true;
}

/**
 * Get platform-specific test timeout multiplier
 * Windows may be slower for some operations
 */
export function getTimeoutMultiplier(): number {
  if (isWindows()) {
    return 1.5; // 50% more time for Windows
  }
  return 1.0;
}

/**
 * Skip test if not on specified platform
 */
export function skipIfNotPlatform(
  targetPlatform: 'win32' | 'darwin' | 'linux'
): jest.Describe {
  return process.platform !== targetPlatform ? describe.skip : describe;
}

/**
 * Run test only on specified platform
 */
export function runOnlyOn(targetPlatform: 'win32' | 'darwin' | 'linux'): jest.It {
  return process.platform === targetPlatform ? it : it.skip;
}

/**
 * Skip test on specified platform
 */
export function skipOn(targetPlatform: 'win32' | 'darwin' | 'linux'): jest.It {
  return process.platform === targetPlatform ? it.skip : it;
}

/**
 * Get expected path separator for current platform
 */
export function getPathSeparator(): string {
  return isWindows() ? '\\' : '/';
}

/**
 * Get platform-specific environment variable
 */
export function getEnvVar(name: string): string | undefined {
  return process.env[name];
}

/**
 * Check Node.js version compatibility
 */
export function isNodeVersionAtLeast(major: number, minor: number = 0): boolean {
  const version = process.versions.node.split('.');
  const currentMajor = parseInt(version[0], 10);
  const currentMinor = parseInt(version[1], 10);

  if (currentMajor > major) return true;
  if (currentMajor === major && currentMinor >= minor) return true;
  return false;
}

/**
 * Get platform display name for logging
 */
export function getPlatformDisplayName(): string {
  const platform = process.platform;
  switch (platform) {
    case 'win32':
      return 'Windows';
    case 'darwin':
      return 'macOS';
    case 'linux':
      return 'Linux';
    default:
      return platform;
  }
}

/**
 * Get Node.js version display name
 */
export function getNodeVersionDisplay(): string {
  return `Node ${process.version}`;
}

/**
 * Log platform information for debugging
 */
export function logPlatformInfo(): void {
  const info = getPlatformInfo();
  // eslint-disable-next-line no-console
  console.log(`\nPlatform: ${getPlatformDisplayName()}`);
  // eslint-disable-next-line no-console
  console.log(`Node Version: ${info.nodeVersion}`);
  // eslint-disable-next-line no-console
  console.log(`Path Separator: ${info.pathSeparator}`);
  // eslint-disable-next-line no-console
  console.log(`Home Directory: ${info.homedir}`);
  // eslint-disable-next-line no-console
  console.log(`Temp Directory: ${info.tmpdir}`);
  // eslint-disable-next-line no-console
  console.log(`CI Environment: ${isCI()}`);
  // eslint-disable-next-line no-console
  console.log(`TTY: ${isTTY()}\n`);
}

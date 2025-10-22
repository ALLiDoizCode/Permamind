/**
 * Terminal detection utilities
 * Determines if output is interactive (TTY) or non-interactive (CI/piped)
 */

/**
 * Check if the current environment is interactive (TTY)
 * @returns true if interactive terminal, false if CI/piped/non-TTY
 */
export function isInteractive(): boolean {
  // Check for CI environment variables
  if (
    process.env.CI === 'true' ||
    process.env.CONTINUOUS_INTEGRATION === 'true' ||
    process.env.BUILD_NUMBER !== undefined
  ) {
    return false;
  }

  // Check if stdout is a TTY
  if (!process.stdout.isTTY) {
    return false;
  }

  return true;
}

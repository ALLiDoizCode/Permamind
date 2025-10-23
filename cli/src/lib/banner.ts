/**
 * Banner Display Module
 *
 * Displays ASCII banner with CLI name and version.
 * Banner is suppressible with --no-banner flag.
 *
 * Requirements:
 * - ASCII-only characters (cross-platform compatibility)
 * - Shows CLI name and version from package.json
 * - Uses chalk for terminal colors
 */

import chalk from 'chalk';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Cached version to avoid reading package.json on every banner display
 */
let cachedVersion = '';

/**
 * Get the version from package.json (cached after first read)
 * @returns Version string from package.json
 */
function getVersion(): string {
  // Return cached version if available
  if (cachedVersion) {
    return cachedVersion;
  }

  try {
    // Read package.json from cli directory using __dirname (CommonJS)
    const packagePath = join(__dirname, '../../package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8')) as { version?: string };
    cachedVersion = packageJson.version ?? '0.0.0';
    return cachedVersion;
  } catch (error) {
    // Fallback if package.json can't be read
    cachedVersion = '0.0.0';
    return cachedVersion;
  }
}

/**
 * Display ASCII banner with CLI name and version
 * Uses ASCII-only characters for cross-platform compatibility
 */
export function displayBanner(): void {
  const version = getVersion();

  // eslint-disable-next-line no-console
  console.log(
    chalk.cyan(`
   _____ _    _ _ _
  / ____| |  (_) | |
 | (___ | | ___| | |___
  \\___ \\| |/ / | | / __|
  ____) |   <| | | \\__ \\
 |_____/|_|\\_\\_|_|_|___/
`),
  );
  // eslint-disable-next-line no-console
  console.log(chalk.dim(`  Agent Skills Registry CLI v${version}\n`));
}

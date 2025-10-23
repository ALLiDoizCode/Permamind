/**
 * Profile bundle creation performance
 *
 * Run with: node --cpu-prof --cpu-prof-interval=100 scripts/profile-bundler.js
 */

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { bundle } from '../cli/src/lib/bundler.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main(): Promise<void> {
  const fixturesDir = path.join(__dirname, '../cli/tests/fixtures/performance');

  console.log('Profiling bundle creation...\n');

  // Small skill
  const smallStart = performance.now();
  const smallResult = await bundle(path.join(fixturesDir, 'small-skill'));
  const smallDuration = performance.now() - smallStart;
  console.log(`Small skill: ${smallResult.sizeFormatted}, ${smallDuration.toFixed(2)}ms`);

  // Medium skill
  const mediumStart = performance.now();
  const mediumResult = await bundle(path.join(fixturesDir, 'medium-skill'));
  const mediumDuration = performance.now() - mediumStart;
  console.log(`Medium skill: ${mediumResult.sizeFormatted}, ${mediumDuration.toFixed(2)}ms`);

  // Large skill
  const largeStart = performance.now();
  const largeResult = await bundle(path.join(fixturesDir, 'large-skill'));
  const largeDuration = performance.now() - largeStart;
  console.log(`Large skill: ${largeResult.sizeFormatted}, ${largeDuration.toFixed(2)}ms`);

  console.log('\nProfiler data saved to CPU.*.cpuprofile');
}

main().catch(console.error);

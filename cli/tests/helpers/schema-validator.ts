/**
 * JSON Schema Validator for Integration Testing
 * Story 8.10: Cross-compatibility integration tests
 *
 * Validates skills-lock.json files against the JSON schema.
 */

import Ajv from 'ajv';
import * as fs from 'fs';
import * as path from 'path';

// Load skills-lock.schema.json
const schemaPath = path.join(__dirname, '../../src/schemas/skills-lock.schema.json');

let lockFileSchema: any;
let ajv: Ajv;
let validateLockFile: any;

/**
 * Initialize schema validator
 */
function initValidator(): void {
  if (!validateLockFile) {
    lockFileSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

    // Create AJV instance with strict mode
    ajv = new Ajv({ strict: true, allErrors: true });

    // Compile schema
    validateLockFile = ajv.compile(lockFileSchema);
  }
}

/**
 * Validate lock file data against schema
 */
export function validateSkillsLock(lockFileData: any): { valid: boolean; errors: string[] } {
  initValidator();

  const valid = validateLockFile(lockFileData);

  if (!valid) {
    const errors =
      validateLockFile.errors?.map((err: any) => `${err.instancePath} ${err.message}`) || [];
    return { valid: false, errors };
  }

  return { valid: true, errors: [] };
}

/**
 * Validate lock file from file path
 */
export function validateSkillsLockFile(filePath: string): { valid: boolean; errors: string[] } {
  try {
    const lockFileData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return validateSkillsLock(lockFileData);
  } catch (error) {
    return {
      valid: false,
      errors: [`Failed to parse lock file: ${error instanceof Error ? error.message : String(error)}`],
    };
  }
}

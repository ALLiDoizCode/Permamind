/**
 * Manifest Parser Module
 *
 * Extracts and validates SKILL.md frontmatter metadata using YAML parsing
 * and JSON schema validation.
 *
 * This module provides the core functionality for reading skill manifest files,
 * parsing their YAML frontmatter, and validating the structure against a strict
 * JSON schema to ensure all required fields are present and correctly formatted.
 *
 * @module parsers/manifest-parser
 */

import { readFile } from 'fs/promises';
import * as path from 'path';
import matter from 'gray-matter';
import AjvModule, { ErrorObject } from 'ajv';
import { ISkillManifest, ValidationResult } from '../types/skill.js';
import { FileSystemError, ParseError } from '../types/errors.js';
import skillManifestSchema from '../schemas/skill-manifest.schema.json' with { type: 'json' };

// Initialize AJV validator with skill manifest schema (handle ESM default export)
const Ajv = (AjvModule as any).default || AjvModule;
const ajv = new Ajv({ allErrors: true, verbose: true });
const validateSchema = ajv.compile(skillManifestSchema);

/**
 * Parse and extract skill manifest from SKILL.md file
 *
 * Reads the specified SKILL.md file, extracts YAML frontmatter using gray-matter,
 * and returns a structured manifest object. This function handles file system errors
 * and YAML parsing errors gracefully.
 *
 * Workflow:
 * 1. Read SKILL.md file from filesystem
 * 2. Extract YAML frontmatter using gray-matter
 * 3. Parse frontmatter into JavaScript object
 * 4. Normalize optional fields (dependencies, tags)
 * 5. Return typed ISkillManifest object
 *
 * @param skillMdPath - Absolute or relative path to SKILL.md file
 * @returns Promise resolving to parsed manifest object
 * @throws {FileSystemError} If file cannot be read (not found, permission denied)
 * @throws {ParseError} If YAML frontmatter is malformed or missing
 *
 * @example
 * ```typescript
 * const manifest = await parse('./my-skill/SKILL.md');
 * console.log(manifest.name); // 'my-skill'
 * console.log(manifest.version); // '1.0.0'
 * ```
 */
export async function parse(skillMdPath: string): Promise<ISkillManifest> {
  let fileContent: string;

  // Step 1: Read SKILL.md file
  try {
    fileContent = await readFile(skillMdPath, 'utf-8');
  } catch (error: unknown) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === 'ENOENT') {
      throw new FileSystemError(
        `SKILL.md not found → Solution: Ensure SKILL.md exists at ${path.basename(skillMdPath)}`,
        skillMdPath
      );
    } else if (nodeError.code === 'EACCES') {
      throw new FileSystemError(
        `Permission denied reading SKILL.md → Solution: Check file permissions for ${path.basename(skillMdPath)}`,
        skillMdPath
      );
    } else {
      throw new FileSystemError(
        `Failed to read SKILL.md → Solution: ${nodeError.message ?? 'Unknown error'}`,
        skillMdPath
      );
    }
  }

  // Step 2: Check for empty file
  if (!fileContent || fileContent.trim().length === 0) {
    throw new ParseError(
      'SKILL.md is empty → Solution: Add YAML frontmatter with required fields (name, version, description, author)',
      ''
    );
  }

  // Step 3: Extract YAML frontmatter using gray-matter
  let parsed: matter.GrayMatterFile<string>;
  try {
    parsed = matter(fileContent);
  } catch (error: unknown) {
    const yamlSnippet = fileContent.substring(0, 200); // Truncate for security
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new ParseError(
      `YAML frontmatter is malformed → Solution: Check for syntax errors in the YAML frontmatter (${errorMessage})`,
      yamlSnippet
    );
  }

  // Step 4: Validate frontmatter exists
  if (Object.keys(parsed.data).length === 0) {
    throw new ParseError(
      'SKILL.md missing frontmatter → Solution: Add YAML frontmatter between --- delimiters at the top of the file',
      fileContent.substring(0, 200)
    );
  }

  // Step 5: Normalize optional fields (handle null/undefined)
  const manifest = parsed.data as ISkillManifest;

  // Ensure dependencies is an array (default to empty array if null/undefined)
  if (!manifest.dependencies) {
    manifest.dependencies = [];
  }

  // Ensure tags is an array (default to empty array if null/undefined)
  if (!manifest.tags) {
    manifest.tags = [];
  }

  return manifest;
}

/**
 * Validate skill manifest against JSON schema
 *
 * Validates the provided manifest object against the skill-manifest.schema.json
 * schema using AJV validator. Returns validation result with user-friendly error
 * messages if validation fails.
 *
 * Validation rules enforced:
 * - name: lowercase alphanumeric with hyphens, 1-64 chars
 * - version: semantic versioning (x.y.z)
 * - description: 1-1024 chars
 * - author: required, non-empty string
 * - tags: optional array of strings
 * - dependencies: optional array of valid skill names
 * - license: optional string
 *
 * @param manifest - Parsed manifest object to validate
 * @returns Validation result with success status and error messages
 *
 * @example
 * ```typescript
 * const result = validate(manifest);
 * if (!result.valid) {
 *   console.error('Validation failed:', result.errors);
 * }
 * ```
 */
export function validate(manifest: ISkillManifest): ValidationResult {
  const valid = validateSchema(manifest);

  if (valid) {
    return { valid: true };
  }

  // Format AJV errors into user-friendly messages
  const errors = formatValidationErrors(validateSchema.errors || []);

  return {
    valid: false,
    errors,
  };
}

/**
 * Format AJV validation errors into user-friendly messages
 *
 * Converts technical JSON schema validation errors into actionable error messages
 * following the pattern: "Error description → Solution: ..."
 *
 * @param ajvErrors - Array of AJV error objects
 * @returns Array of formatted error messages
 * @internal
 */
function formatValidationErrors(ajvErrors: ErrorObject[]): string[] {
  return ajvErrors.map((error) => {
    const fieldFromPath = error.instancePath.replace(/^\//, '');
    const fieldFromParams = 'missingProperty' in error.params ? String(error.params.missingProperty) : '';
    const field = fieldFromPath || fieldFromParams || 'unknown';

    switch (error.keyword) {
      case 'required':
        return `Missing required field: ${fieldFromParams} → Solution: Add '${fieldFromParams}' to SKILL.md frontmatter`;

      case 'pattern':
        if (field === 'name' || (typeof field === 'string' && (field.endsWith('/name') || error.instancePath.includes('dependencies')))) {
          return `Invalid ${field} format → Solution: Use only lowercase letters, numbers, and hyphens (e.g., 'my-skill-name')`;
        } else if (field === 'version') {
          return `Invalid version format → Solution: Use semantic versioning (e.g., '1.0.0', '2.3.15')`;
        }
        return `Invalid ${field} format → Solution: Check the pattern requirements for this field`;

      case 'maxLength':
        return `Field ${field} exceeds maximum length of ${'limit' in error.params ? String(error.params.limit) : 'allowed'} characters → Solution: Shorten the ${field} field`;

      case 'minLength':
        return `Field ${field} is too short (minimum ${'limit' in error.params ? String(error.params.limit) : 'required'} characters) → Solution: Provide a longer value for ${field}`;

      case 'type':
        return `Field ${field} has incorrect type → Solution: Expected ${'type' in error.params ? String(error.params.type) : 'correct type'}, but got ${typeof error.data}`;

      case 'additionalProperties':
        return `Unexpected field: ${'additionalProperty' in error.params ? String(error.params.additionalProperty) : 'unknown'} → Solution: Remove '${'additionalProperty' in error.params ? String(error.params.additionalProperty) : 'this field'}' from SKILL.md frontmatter (not a valid field)`;

      default:
        return `Validation error for ${field}: ${error.message ?? 'unknown error'} → Solution: Check the schema requirements`;
    }
  });
}

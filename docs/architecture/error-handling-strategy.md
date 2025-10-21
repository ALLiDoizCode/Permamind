# Error Handling Strategy

## General Approach

- **Error Model:** Typed error classes extending base Error with contextual metadata
- **Exception Hierarchy:**
  ```
  Error (JavaScript native)
  └── SkillsRegistryError (base)
      ├── ValidationError
      ├── NetworkError
      ├── AuthorizationError
      ├── FileSystemError
      ├── DependencyError
      └── ConfigurationError
  ```
- **Error Propagation:** Errors bubble to command level, caught by central handler, translated to user-friendly messages

## Logging Standards

- **Library:** Custom logger utility (`cli/src/lib/logger.ts`)
- **Format:** Structured JSON for verbose mode, human-readable for normal
- **Levels:** ERROR, WARN, INFO, DEBUG
- **Required Context:**
  - Correlation ID: UUID per command invocation
  - Service Context: `{ service: 'cli', command: 'publish', version: '1.0.0' }`
  - User Context: `{ installLocation, os }` (no PII)

## Error Handling Patterns

**External API Errors:**
- **Retry Policy:** 3 attempts for Arweave (exponential backoff), 2 attempts for AO (fixed delay)
- **Timeout:** 60s upload, 30s download, 30s AO queries
- **Error Translation:** Network errors mapped to user-friendly messages with recovery steps

**Business Logic Errors:**
- **Custom Exceptions:** ValidationError, DependencyError, AuthorizationError
- **User-Facing Format:** Error message + "→ Solution: ..." pattern
- **Error Codes:** Exit codes (0=success, 1=user error, 2=system error, 3=authorization)

**Data Consistency:**
- **Transaction Strategy:** Atomic file writes (temp file + rename)
- **Compensation Logic:** Rollback partial installs on failure
- **Idempotency:** Check existing installations, skip if same version

---

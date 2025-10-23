# Contributing to @permamind/skills

Thank you for your interest in contributing to the Agent Skills Registry! This document provides guidelines for contributing code, reporting issues, and improving documentation.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Reporting Issues](#reporting-issues)
- [Contributing Code](#contributing-code)
- [Pull Request Process](#pull-request-process)
- [Development Setup](#development-setup)
- [Testing Requirements](#testing-requirements)
- [Coding Standards](#coding-standards)
- [Documentation Standards](#documentation-standards)
- [Getting Help](#getting-help)

## Code of Conduct

By participating in this project, you agree to maintain a respectful, collaborative environment. We expect all contributors to:

- Use welcoming and inclusive language
- Respect differing viewpoints and experiences
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards other community members

## Reporting Issues

### Before Creating an Issue

1. **Search existing issues**: Check if someone has already reported the problem
2. **Check troubleshooting guide**: Review [docs/troubleshooting.md](troubleshooting.md) for known issues and solutions
3. **Verify your environment**: Ensure you're using supported Node.js version (20.11.0+)

### Bug Reports

When reporting a bug, include:

- **CLI version**: Output of `skills --version`
- **Node.js version**: Output of `node --version`
- **Operating system**: macOS, Linux, or Windows with version
- **Command executed**: Exact command that caused the error
- **Error message**: Complete error output (use `--verbose` for details)
- **Expected behavior**: What you expected to happen
- **Actual behavior**: What actually happened
- **Reproduction steps**: Minimal steps to reproduce the issue

**Example:**

```markdown
## Bug: Publish command fails with network timeout

**Environment:**
- CLI version: 0.1.0
- Node.js: 20.11.0
- OS: macOS 14.2

**Command:**
\`\`\`bash
skills publish ./my-skill --verbose
\`\`\`

**Error:**
\`\`\`
[NetworkError] Arweave gateway timeout after 30s. -> Solution: Retry with --gateway https://g8way.io or check network connection.
\`\`\`

**Expected:** Skill bundle uploads successfully
**Actual:** Network timeout error after 30 seconds

**Steps to Reproduce:**
1. Create skill directory with SKILL.md
2. Run `skills publish ./my-skill`
3. Wait 30+ seconds, timeout occurs
```

### Feature Requests

When requesting a feature, include:

- **Use case**: Why this feature is needed
- **Proposed solution**: How you envision it working
- **Alternatives considered**: Other approaches you've thought about
- **Mockups/examples**: Code examples or UI mockups if applicable

## Contributing Code

### Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/skills.git
cd skills

# Add upstream remote
git remote add upstream https://github.com/permamind/skills.git
```

### Create a Feature Branch

```bash
# Update main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/my-feature-name
```

### Make Your Changes

1. Follow the [coding standards](#coding-standards)
2. Write tests for new functionality (see [testing requirements](#testing-requirements))
3. Ensure all tests pass: `npm run test:once`
4. Run linter: `npm run lint`
5. Format code: `npm run format`

### Commit Your Changes

Write clear, descriptive commit messages:

```bash
# Good commit messages
git commit -m "Fix publish command validation error for missing SKILL.md"
git commit -m "Add search command pagination support"
git commit -m "Update README with installation instructions"

# Bad commit messages (avoid these)
git commit -m "fix bug"
git commit -m "update"
git commit -m "WIP"
```

## Pull Request Process

### PR Title Format

Use this format: `[Type] Brief description`

**Types:**
- `[Feature]` - New functionality
- `[Fix]` - Bug fixes
- `[Refactor]` - Code refactoring without behavior changes
- `[Docs]` - Documentation updates
- `[Test]` - Test additions or improvements
- `[Chore]` - Maintenance tasks (deps, build config, etc.)

**Examples:**
- `[Feature] Add search command pagination`
- `[Fix] Resolve publish command timeout issue`
- `[Docs] Update README with Quick Start guide`

### PR Description Requirements

Include in your PR description:

1. **Problem Statement**: What issue does this solve?
2. **Solution Approach**: How did you solve it?
3. **Testing Performed**: What tests did you run?
4. **Breaking Changes**: Any breaking changes? (list them)
5. **Related Issues**: Link related issues with `Fixes #123` or `Closes #456`

**Example:**

```markdown
## Problem Statement
Publish command times out when uploading large bundles (>10MB) to Arweave gateway.

## Solution Approach
- Increased default timeout from 30s to 60s for large bundles
- Added retry logic with exponential backoff
- Improved progress indicator to show upload speed

## Testing Performed
- Unit tests: Added tests for retry logic
- Integration tests: Tested with 5MB, 10MB, and 15MB bundles
- Manual testing: Verified timeout recovery on slow networks

## Breaking Changes
None

## Related Issues
Fixes #42
```

### Review Process

1. **CI Requirements**: All tests and linting must pass
2. **Review Required**: At least one approving review from maintainers
3. **Changes Requested**: Address all review comments
4. **Up to Date**: Keep your branch updated with `main`

### Merge Process

- Maintainers will use **squash and merge** for clean history
- Your commits will be squashed into a single commit
- The PR title will become the commit message
- Once merged, you can delete your feature branch

## Development Setup

### Prerequisites

- **Node.js**: 20.11.0 LTS or higher
- **npm**: 10.x or higher
- **Git**: Latest stable version

### Installation

```bash
# Install dependencies
npm install

# Build all workspaces
npm run build

# Run tests to verify setup
npm run test:once
```

### Environment Configuration

Create `.env` file in project root:

```bash
# Copy example file
cp .env.example .env

# Edit with your values
# AO_REGISTRY_PROCESS_ID=your_process_id_here
# AO_NETWORK=mainnet
# ARWEAVE_GATEWAY=https://arweave.net
```

Create `.skillsrc` for CLI testing:

```bash
# Copy example file
cp .skillsrc.example ~/.skillsrc

# Edit with your wallet and registry
```

### Running Tests

```bash
# All tests in watch mode
npm test

# All tests once
npm run test:once

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Coverage report
npm run test:coverage

# AO process tests (Lua)
npm run test:ao

# TDD mode (watch + verbose)
npm run tdd
```

### Linting and Formatting

```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix

# Format with Prettier
npm run format
```

## Testing Requirements

### Test-Driven Development (TDD)

We follow TDD practices:

1. **Write tests first**: Before implementing functionality
2. **Red-Green-Refactor**: Fail → Pass → Optimize
3. **100% coverage**: All code paths must be tested

### Test Organization

```
cli/tests/
├── unit/                 # Unit tests (mirrors src/)
│   ├── lib/
│   ├── parsers/
│   └── commands/
├── integration/          # Integration tests
│   ├── publish-workflow.test.ts
│   ├── search-command.test.ts
│   └── install-workflow.test.ts
├── fixtures/             # Test fixtures
│   ├── valid-skill/
│   └── invalid-skill/
└── helpers/              # Test helpers
    ├── mock-arweave.ts
    └── mock-ao-client.ts
```

### Unit Tests

- **Scope**: Single function or class
- **Isolation**: Mock all external dependencies
- **Coverage**: 100% required for all new code
- **Speed**: Fast (<100ms per test)

### Integration Tests

- **Scope**: Multiple components working together
- **Happy paths**: All successful workflows
- **Error scenarios**: All error conditions
- **Cross-platform**: Must pass on macOS, Linux, Windows

### Writing Good Tests

```typescript
// Good: Descriptive, isolated, focused
describe('ManifestParser', () => {
  it('should parse valid SKILL.md with frontmatter', () => {
    const result = parseManifest(validSkillContent);
    expect(result.name).toBe('ao-basics');
    expect(result.version).toBe('1.0.0');
  });

  it('should throw ValidationError for missing name field', () => {
    expect(() => parseManifest(missingNameContent))
      .toThrow(ValidationError);
  });
});
```

## Coding Standards

### TypeScript

- **Strict mode**: All TypeScript strict checks enabled
- **No any**: Avoid `any` type, use proper types or `unknown`
- **Interface prefix**: Use `I` prefix for interfaces (`ISkillMetadata`)
- **No console.log**: Use logger utility for all output

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| **Files** | kebab-case | `manifest-parser.ts` |
| **Classes** | PascalCase | `ManifestParser` |
| **Interfaces** | PascalCase with 'I' | `ISkillMetadata` |
| **Functions** | camelCase | `parseManifest()` |
| **Constants** | SCREAMING_SNAKE_CASE | `MAX_BUNDLE_SIZE` |
| **Private fields** | camelCase with `_` | `_privateField` |

### Code Style

- **Indentation**: 2 spaces (enforced by Prettier)
- **Quotes**: Single quotes for strings
- **Semicolons**: Required at end of statements
- **Line length**: 100 characters max
- **Async/await**: Prefer over promises for async code

### Error Handling

- **Use typed errors**: Import from `types/errors.ts`
- **Actionable messages**: Include solution in error messages
- **Exit codes**: Use `getExitCode()` for process.exit()
- **Never swallow errors**: Always log or re-throw

```typescript
// Good: Typed error with solution
throw new ValidationError(
  'SKILL.md missing required field: name',
  'Add "name" field to SKILL.md frontmatter'
);

// Bad: Generic error without context
throw new Error('Invalid file');
```

### File Organization

```typescript
// 1. Imports (external first, then internal)
import { Command } from 'commander';
import chalk from 'chalk';
import { parseManifest } from '../parsers/manifest-parser.js';

// 2. Types and interfaces
interface ICommandOptions {
  verbose?: boolean;
}

// 3. Constants
const MAX_RETRIES = 3;

// 4. Functions (exported first, then internal)
export function createCommand(): Command {
  // ...
}

function internalHelper(): void {
  // ...
}
```

## Documentation Standards

### Code Documentation

- **Public APIs**: JSDoc comments required
- **Parameters**: Document all function parameters
- **Return values**: Document return types and meaning
- **Examples**: Include usage examples for complex functions

```typescript
/**
 * Parse and validate SKILL.md manifest
 *
 * @param content - Raw SKILL.md file content
 * @returns Parsed and validated skill metadata
 * @throws {ValidationError} If manifest is invalid or missing required fields
 *
 * @example
 * ```typescript
 * const manifest = parseManifest(skillContent);
 * console.log(manifest.name); // 'ao-basics'
 * ```
 */
export function parseManifest(content: string): ISkillManifest {
  // ...
}
```

### User-Facing Documentation

- **README.md**: Update for user-facing changes
- **docs/architecture/**: Update for technical/architectural changes
- **CHANGELOG.md**: Add entry for notable changes
- **Inline help**: Update command help text if adding/changing flags

### Comments

- **Why, not what**: Explain reasoning, not obvious logic
- **TODOs**: Use `// TODO:` for future improvements
- **Complex logic**: Document non-obvious algorithms

```typescript
// Good: Explains reasoning
// Use exponential backoff to avoid overwhelming the gateway
const delay = Math.pow(2, retryCount) * 1000;

// Bad: States the obvious
// Set delay variable
const delay = Math.pow(2, retryCount) * 1000;
```

## Publishing and Releases

This section documents the process for publishing new versions of the CLI to npm.

### Pre-Publish Checklist

Before publishing a new version, ensure:

- [ ] All tests pass: `npm run test:once`
- [ ] Linting passes: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] README.md is up to date
- [ ] CHANGELOG.md is updated with release notes
- [ ] Version number follows semantic versioning

### Semantic Versioning

Follow [semantic versioning](https://semver.org/) (semver) guidelines:

- **Major** (1.0.0): Breaking changes (incompatible API changes)
- **Minor** (0.1.0): New features (backward compatible)
- **Patch** (0.1.1): Bug fixes (backward compatible)

**Examples:**
- Adding new command option → Minor version bump
- Fixing command bug → Patch version bump
- Removing deprecated command → Major version bump

### Manual Publishing Process

For maintainers with npm publish access:

#### 1. Update Version

```bash
cd cli/

# Update package.json version
npm version patch  # or minor, or major
```

#### 2. Test Package Locally

```bash
# Build the project
npm run build

# Create tarball
npm pack

# Install locally and test
npm install -g ./permamind-skills-0.1.1.tgz

# Verify installation
skills --version
skills --help

# Uninstall test package
npm uninstall -g @permamind/skills

# Remove tarball
rm permamind-skills-*.tgz
```

#### 3. Update CHANGELOG

Add release notes to CHANGELOG.md:

```markdown
## [0.1.1] - 2025-01-15

### Fixed
- Resolve publish command timeout for large bundles
- Fix dependency resolution for circular references

### Changed
- Improve error messages for network failures
```

#### 4. Commit Version Bump

```bash
git add cli/package.json CHANGELOG.md
git commit -m "chore: bump version to 0.1.1"
```

#### 5. Create Git Tag

```bash
git tag v0.1.1
git push origin main
git push origin v0.1.1
```

#### 6. Publish to npm

```bash
cd cli/

# Publish to npm (requires 2FA if enabled)
npm publish --access public
```

**Note:** Scoped packages (@permamind/skills) require `--access public` flag for the first publish.

### Automated Publishing via GitHub Actions

The project includes a GitHub Actions workflow (`.github/workflows/publish.yml`) that automatically publishes to npm when version tags are pushed.

#### Workflow Trigger

The workflow runs when a version tag is pushed:

```bash
git tag v0.1.1
git push origin v0.1.1
```

#### Workflow Steps

1. Checkout repository
2. Setup Node.js 20.11.0
3. Install dependencies
4. Build project: `npm run build`
5. Run tests: `npm run test:once`
6. Publish to npm: `npm publish --access public`

#### Required GitHub Secrets

The automated workflow requires:

- **NPM_TOKEN**: npm automation token with publish permissions

**Setting up NPM_TOKEN:**

1. Generate npm automation token:
   ```bash
   npm token create --type=automation
   ```

2. Add token to GitHub repository secrets:
   - Go to repository Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: [paste token from step 1]

3. Verify token has publish permissions to `@permamind` scope

#### Testing Automated Workflow

Before tagging a real release, test the workflow with a pre-release tag:

```bash
# Create pre-release tag
git tag v0.1.1-rc.1

# Push tag (triggers workflow)
git push origin v0.1.1-rc.1

# Monitor workflow in GitHub Actions tab

# If successful, delete pre-release tag
git tag -d v0.1.1-rc.1
git push origin :refs/tags/v0.1.1-rc.1
```

### Rollback Strategy

If a broken version is published:

#### Option 1: Deprecate and Patch

```bash
# Deprecate broken version
npm deprecate @permamind/skills@0.1.1 "This version has a critical bug, use 0.1.2"

# Publish patch version with fix
npm version patch
npm publish --access public
```

#### Option 2: Unpublish (within 72 hours)

**Warning:** npm allows unpublishing only within 72 hours of publishing, and only if no other packages depend on it.

```bash
# Unpublish specific version (use with caution)
npm unpublish @permamind/skills@0.1.1

# Publish corrected version
npm version patch
npm publish --access public
```

**Best Practice:** Deprecation is preferred over unpublishing for stability and trust.

### Post-Release Tasks

After successful publish:

1. **Announce release**: Create GitHub Release with notes
2. **Update documentation**: Ensure README matches published version
3. **Monitor issues**: Watch for bug reports related to new version
4. **Test installation**: Verify `npm install -g @permamind/skills` works

### npm Publishing Requirements

To publish to npm, you need:

- **npm account**: Registered at [npmjs.com](https://www.npmjs.com)
- **Organization access**: Member of `@permamind` organization with publish permissions
- **2FA enabled**: Required for scoped packages (recommended for all accounts)
- **Authentication**: Logged in via `npm login` (manual) or `NPM_TOKEN` (CI/CD)

### Troubleshooting Publishing

#### "403 Forbidden" during publish

**Cause:** Insufficient permissions or authentication failure

**Solution:**
```bash
# Verify you're logged in
npm whoami

# Verify organization membership
npm org ls permamind

# Re-authenticate if needed
npm login
```

#### "402 Payment Required"

**Cause:** Attempting to publish private scoped package without npm Pro

**Solution:** Use `--access public` flag:
```bash
npm publish --access public
```

#### "Version already exists"

**Cause:** Attempting to republish existing version

**Solution:** Bump version number:
```bash
npm version patch  # or minor, or major
npm publish --access public
```

## Getting Help

### Resources

- **Documentation**: Check [docs/](../docs/) directory
- **Troubleshooting**: Review [docs/troubleshooting.md](troubleshooting.md)
- **GitHub Issues**: Search existing issues for similar problems
- **GitHub Discussions**: Ask questions in Discussions tab

### Questions?

If you're stuck or need clarification:

1. Check existing documentation first
2. Search GitHub Issues and Discussions
3. Ask in GitHub Discussions (preferred for questions)
4. Open an issue if you've found a bug

---

**Thank you for contributing!** Your efforts help make the Agent Skills Registry better for everyone.

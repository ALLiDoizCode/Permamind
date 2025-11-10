# MCP Server Migration Guide

## Table of Contents

- [Overview](#overview)
- [Migration Checklist](#migration-checklist)
- [Before and After Examples](#before-and-after-examples)
  - [Example 1: Skill with Only MCP Server Dependencies](#example-1-skill-with-only-mcp-server-dependencies)
  - [Example 2: Skill with Mixed Dependencies](#example-2-skill-with-mixed-dependencies)
  - [Example 3: Skill with No MCP Dependencies](#example-3-skill-with-no-mcp-dependencies)
- [Common Scenarios](#common-scenarios)
  - [Scenario 1: Publishing a Skill After Migration](#scenario-1-publishing-a-skill-after-migration)
  - [Scenario 2: Installing a Skill with MCP Server Requirements](#scenario-2-installing-a-skill-with-mcp-server-requirements)
  - [Scenario 3: Publishing a Legacy Skill (Before Migration)](#scenario-3-publishing-a-legacy-skill-before-migration)
  - [Scenario 4: Nested Dependencies with MCP Servers](#scenario-4-nested-dependencies-with-mcp-servers)
- [Understanding Validation Warnings](#understanding-validation-warnings)
- [Frequently Asked Questions](#frequently-asked-questions)
- [Related Documentation](#related-documentation)
- [Troubleshooting](#troubleshooting)
- [Version History](#version-history)

## Overview

**Why was the `mcpServers` field added?**

Previously, Skills with MCP (Model Context Protocol) server requirements documented them in the `dependencies` field alongside installable skill dependencies. This caused confusion because:

- **MCP servers are not installable via the CLI** - they must be configured in Claude Desktop separately
- **Installation failures were unclear** - users didn't understand why some dependencies couldn't be installed
- **Documentation was ambiguous** - it wasn't obvious which dependencies needed manual installation

**The Solution: Dedicated `mcpServers` Field**

The new `mcpServers` field in SKILL.md frontmatter separates MCP server requirements from skill dependencies, providing:

1. **Clear distinction** between installable skills and MCP servers
2. **Graceful installation handling** - MCP servers are automatically detected and skipped during installation (no failures)
3. **Better documentation** - users know exactly which MCP servers to install separately
4. **Backward compatibility** - existing Skills continue working unchanged

**Implementation Timeline**

- **Story 13.1**: Added `mcpServers` field to JSON Schema and publish-time validation
- **Story 13.2**: Updated installation workflow to skip MCP servers gracefully
- **Story 13.3**: Comprehensive documentation and migration guidance (this guide)

## Migration Checklist

Follow these steps to migrate your Skill from the legacy pattern (MCP servers in `dependencies`) to the new pattern (MCP servers in `mcpServers`):

- [ ] **Step 1**: Open your skill's SKILL.md file
- [ ] **Step 2**: Identify any items with `mcp__` prefix in the `dependencies` field
- [ ] **Step 3**: Create a new `mcpServers` field in the YAML frontmatter (if it doesn't exist)
- [ ] **Step 4**: Move all `mcp__` prefixed items from `dependencies` to `mcpServers`
- [ ] **Step 5**: Verify remaining `dependencies` are installable skills only (no `mcp__` prefix)
- [ ] **Step 6**: Test publish command: `skills publish <skill-dir>`
- [ ] **Step 7**: Verify no validation warnings appear in publish output
- [ ] **Step 8**: Test install command: `skills install <skill-name>`
- [ ] **Step 9**: Verify MCP servers are skipped with informational message

**Each step is explained in detail in the [Common Scenarios](#common-scenarios) section below.**

## Before and After Examples

### Example 1: Skill with Only MCP Server Dependencies

**Before (INCORRECT - Legacy Pattern):**

```yaml
---
name: pixel-art-skill
version: 1.0.0
description: Skill for pixel art generation
author: Example Author
tags: ["pixel-art", "creative"]
dependencies:
  - mcp__pixel-art
---
```

**After (CORRECT - Migrated Pattern):**

```yaml
---
name: pixel-art-skill
version: 1.0.0
description: Skill for pixel art generation
author: Example Author
tags: ["pixel-art", "creative"]
mcpServers:
  - mcp__pixel-art
---
```

**Explanation:**

- MCP servers moved from `dependencies` to the dedicated `mcpServers` field
- No `dependencies` field needed if there are no installable skill dependencies
- Users will see: "This skill requires MCP server: mcp__pixel-art (install separately)"

### Example 2: Skill with Mixed Dependencies

**Before (INCORRECT - Legacy Pattern):**

```yaml
---
name: advanced-ui-skill
version: 1.0.0
description: Advanced UI generation with AO integration
author: Example Author
tags: ["ui", "ao", "arweave"]
dependencies:
  - ao-basics
  - mcp__pixel-art
  - arweave-fundamentals
  - mcp__shadcn-ui
---
```

**After (CORRECT - Migrated Pattern):**

```yaml
---
name: advanced-ui-skill
version: 1.0.0
description: Advanced UI generation with AO integration
author: Example Author
tags: ["ui", "ao", "arweave"]
dependencies:
  - ao-basics
  - arweave-fundamentals
mcpServers:
  - mcp__pixel-art
  - mcp__shadcn-ui
---
```

**Explanation:**

- Skill dependencies (`ao-basics`, `arweave-fundamentals`) remain in `dependencies` field
- MCP servers (`mcp__pixel-art`, `mcp__shadcn-ui`) moved to `mcpServers` field
- Clear separation makes it obvious which dependencies are auto-installed vs. manual

### Example 3: Skill with No MCP Dependencies

**No Migration Needed:**

```yaml
---
name: pure-skill
version: 1.0.0
description: Skill with only installable dependencies
author: Example Author
tags: ["tutorial", "beginner"]
dependencies:
  - ao-basics
  - arweave-fundamentals
---
```

**Explanation:**

- Skills without MCP servers don't need the `mcpServers` field
- No migration required - continue using `dependencies` field as before
- `mcpServers` field is optional (only add if your skill uses MCP servers)

## Common Scenarios

### Scenario 1: Publishing a Skill After Migration

**Command:**

```bash
skills publish ./pixel-art-skill
```

**Expected Output (Success):**

```
✔ SKILL.md validated successfully
✔ Bundle created: 45 KB (3 files)
✔ Wallet balance: 0.5 AR (sufficient)
✔ Bundle uploaded: abc123...xyz789
✔ Transaction confirmed
✔ Skill registered: msg456...def012

🎉 Skill published successfully!

  Name:         pixel-art-skill
  Version:      1.0.0
  Arweave TX:   abc123...xyz789
  Registry ID:  msg456...def012
  Bundle Size:  45 KB
```

**Explanation:**

- No validation warnings appear because MCP servers are in the correct `mcpServers` field
- Skill publishes successfully and is immediately searchable in the registry

### Scenario 2: Installing a Skill with MCP Server Requirements

**Command:**

```bash
skills install pixel-art-skill
```

**Expected Output:**

```
⚙ Searching registry for pixel-art-skill...
✔ Found pixel-art-skill v1.0.0
⚙ Resolving dependencies...
⚙ Downloading bundle from Arweave...
✔ Extracted to ~/.claude/skills/pixel-art-skill

ℹ Skipping MCP server: mcp__pixel-art (must be installed separately)

✔ Installation complete!

📋 MCP Server Setup Required:
  - mcp__pixel-art

To use this skill, install the required MCP server through Claude Desktop:
  1. Open Claude Desktop settings
  2. Navigate to Model Context Protocol
  3. Install mcp__pixel-art using: npx @modelcontextprotocol/create-server
```

**Explanation:**

- Installation succeeds gracefully
- MCP server is detected and skipped automatically
- Clear informational message guides user to install MCP server separately
- Skill is ready to use once MCP server is configured in Claude Desktop

### Scenario 3: Publishing a Legacy Skill (Before Migration)

**Command:**

```bash
skills publish ./legacy-skill
```

**Expected Output (Warning):**

```
✔ SKILL.md validated successfully

⚠ Warning: MCP server dependencies detected in 'dependencies' field

The following MCP servers should be documented in the 'mcpServers' field instead:
  - mcp__pixel-art
  - mcp__shadcn-ui

Solution: Move these to 'mcpServers' field in SKILL.md frontmatter:

---
name: legacy-skill
version: 1.0.0
dependencies:
  - ao-basics  # Keep installable skills here
mcpServers:
  - mcp__pixel-art
  - mcp__shadcn-ui
---

Note: This skill will still publish successfully. MCP servers in dependencies
will be skipped during installation.

✔ Bundle created: 55 KB (5 files)
✔ Bundle uploaded: abc123...xyz789
✔ Skill registered: msg456...def012

🎉 Skill published successfully! (with warnings)
```

**Explanation:**

- Skill still publishes successfully (backward compatible)
- Validation warning guides author to migrate to `mcpServers` field
- Warning includes specific migration instructions with example
- Users installing this skill will see MCP servers skipped gracefully

### Scenario 4: Nested Dependencies with MCP Servers

**Scenario:**

- **Skill A** has MCP servers: `mcpServers: ["mcp__pixel-art"]`
- **Skill B** depends on Skill A: `dependencies: ["skill-a"]`

**Command:**

```bash
skills install skill-b
```

**Expected Output:**

```
⚙ Searching registry for skill-b...
✔ Found skill-b v1.0.0
⚙ Resolving dependencies...
  → skill-a (v1.0.0)
⚙ Downloading bundles from Arweave...
✔ Extracted skill-b to ~/.claude/skills/skill-b
⚙ Installing dependency: skill-a
✔ Extracted skill-a to ~/.claude/skills/skill-a

ℹ Skipping MCP server: mcp__pixel-art (must be installed separately)

✔ Installation complete!

📋 MCP Server Setup Required:
  - mcp__pixel-art (required by skill-a)
```

**Explanation:**

- Skill B installs successfully with Skill A as a dependency
- Skill A's MCP servers are detected and reported during installation
- Users see clear guidance: MCP server is required by Skill A
- Dependency tree is resolved correctly, MCP servers are filtered out

## Understanding Validation Warnings

### When Warnings Appear

Validation warnings appear during the `skills publish` command when the CLI detects items with `mcp__` prefix in the `dependencies` field.

### Warning Format

```
⚠ Warning: MCP server dependencies detected in 'dependencies' field

The following MCP servers should be documented in the 'mcpServers' field instead:
  - mcp__pixel-art
  - mcp__shadcn-ui

Solution: Move these to 'mcpServers' field in SKILL.md frontmatter
```

### What the Warning Means

- **Non-blocking**: Your skill will still publish successfully
- **Informational**: Guides you to migrate for better clarity
- **Backward compatible**: Existing skills continue working unchanged
- **Installation compatible**: MCP servers are automatically filtered during install

### Why You Should Migrate

1. **Clearer documentation**: Users understand what needs manual installation
2. **Better UX**: Informational messages during install instead of confusing errors
3. **Future-proof**: Aligns with best practices and ecosystem standards
4. **No warnings**: Clean publish output after migration

### Quick Fix

Move items from `dependencies` to `mcpServers`:

**Before:**
```yaml
dependencies:
  - ao-basics
  - mcp__pixel-art
```

**After:**
```yaml
dependencies:
  - ao-basics
mcpServers:
  - mcp__pixel-art
```

## Frequently Asked Questions

### Q: What happens if I don't migrate my skill?

**A:** Your skill will continue working unchanged (fully backward compatible). During publish, you'll see a validation warning, but the skill will still publish successfully. During installation, MCP servers in the `dependencies` field are automatically detected and skipped gracefully, with informational messages guiding users to install them separately.

### Q: Can I use both `dependencies` and `mcpServers` fields?

**A:** Yes, you should use both fields when your skill has both installable dependencies and MCP server requirements. However, **don't put the same item in both fields**. Use `dependencies` for installable skills (e.g., `ao-basics`) and `mcpServers` for MCP servers (e.g., `mcp__pixel-art`).

### Q: How do users install MCP servers?

**A:** MCP servers are NOT installed via the `skills install` command. Users must configure them in Claude Desktop through the Model Context Protocol settings. Each MCP server has its own installation method (commonly `npx @modelcontextprotocol/create-server` or similar). The CLI provides guidance messages when MCP servers are detected.

### Q: Will my existing published skills break?

**A:** No, backward compatible. The installation workflow automatically detects and skips MCP servers in the `dependencies` field. Existing skills continue working without any code changes. However, you'll receive validation warnings during publish to guide migration.

### Q: What if I accidentally put a skill in `mcpServers` field?

**A:** No validation error will occur, but that skill won't be installed automatically. The CLI only installs items from the `dependencies` field. Items in `mcpServers` are treated as informational requirements for users to install separately. Always use `dependencies` for installable skills.

### Q: How does the CLI detect MCP servers?

**A:** The CLI uses **case-sensitive prefix matching** on the `mcp__` prefix. Items starting with `mcp__` (e.g., `mcp__pixel-art`, `mcp__shadcn-ui`) are identified as MCP servers. Variations like `MCP__` or `Mcp__` are **NOT recognized** as MCP servers (intentional - prevents bypass attempts).

### Q: Do I need to republish my skill after migrating?

**A:** It's recommended but not required. Republishing after migration ensures:
- No validation warnings during future publishes
- Updated metadata in the registry with correct field structure
- Clear documentation for users installing the skill

However, if you don't republish, the skill will continue working with the legacy pattern (backward compatible).

### Q: What about nested dependencies with MCP servers?

**A:** Nested dependencies work correctly. If Skill A has MCP servers and Skill B depends on Skill A, users installing Skill B will see:
1. Skill A installs as a dependency
2. Skill A's MCP servers are detected and skipped
3. Informational message guides users to install MCP servers separately
4. Clear attribution shows which skill requires which MCP server

## Related Documentation

- **CLI README**: [cli/README.md - Creating Skills with MCP Server Requirements](../../cli/README.md#documenting-mcp-server-requirements)
- **Root README**: [README.md - Skill Authoring Best Practices](../../README.md#skill-authoring-best-practices)
- **JSON Schema**: [cli/src/schemas/skill-manifest.schema.json](../../cli/src/schemas/skill-manifest.schema.json) (lines 87-95: `mcpServers` field definition)
- **Implementation Details**:
  - Story 13.1: Schema definition and publish-time validation
  - Story 13.2: Installation workflow updates
  - Story 13.3: Documentation and migration guidance (this guide)

## Troubleshooting

### Issue: "I still see validation warnings after migrating"

**Solution:**

1. Verify all `mcp__` prefixed items are moved from `dependencies` to `mcpServers`
2. Check for typos in field names (`mcpServers` not `mcpServer` or `mcp-servers`)
3. Ensure YAML syntax is correct (proper indentation, no tabs)
4. Run `skills publish --dry-run ./my-skill` to test without uploading

### Issue: "MCP server is being installed as a dependency"

**Solution:**

This should not happen if the CLI is version 2.1.13 or higher. Ensure:

1. You're running the latest CLI version: `skills --version` (should be ≥ 2.1.13)
2. MCP server has `mcp__` prefix (case-sensitive)
3. If the item doesn't have `mcp__` prefix, it's treated as a regular skill dependency

### Issue: "How do I know which MCP servers my skill needs?"

**Solution:**

Review your skill's SKILL.md content for references to MCP tools:
- Search for mentions of `pixel-art`, `shadcn-ui`, `playwright`, etc.
- Check if your skill instructions reference MCP-specific functionality
- Look for tool calls that require MCP servers (e.g., browser automation, UI generation)

### Need More Help?

- **GitHub Issues**: [https://github.com/ALLiDoizCode/Permamind/issues](https://github.com/ALLiDoizCode/Permamind/issues)
- **CLI README Troubleshooting**: [cli/README.md#troubleshooting](../../cli/README.md#troubleshooting)
- **Community Support**: Join community discussions on GitHub

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.0 | 2025-11-10 | Initial migration guide created (Epic 13, Story 13.3) |

**Added in CLI version**: 2.1.13 (Epic 13 implementation)

**Breaking Changes**: None - fully backward compatible

---

**Last Updated**: 2025-11-10
**Maintained By**: Permamind Agent Skills Registry Team
**License**: MIT

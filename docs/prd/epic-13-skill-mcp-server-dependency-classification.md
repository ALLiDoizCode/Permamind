# Epic 13: Skill MCP Server Dependency Classification - Brownfield Enhancement

## Epic Goal

Correctly distinguish MCP server requirements from skill dependencies in SKILL.md metadata to prevent installation failures when skills reference MCP servers like `pixel-art` as dependencies.

## Epic Description

### Existing System Context

**Current relevant functionality:**
- Skills define dependencies in SKILL.md frontmatter under `dependencies` field
- Installation process attempts to install all listed dependencies as skills
- No distinction between skill dependencies and MCP server requirements

**Technology stack:**
- Node.js CLI (TypeScript)
- YAML frontmatter parser for SKILL.md
- Dependency resolution system
- AO Registry integration

**Integration points:**
- SKILL.md metadata parser
- Dependency installation workflow
- Skill validation during publish
- Installation error handling

### Enhancement Details

**What's being added/changed:**
- Add new optional `mcpServers` field to SKILL.md frontmatter for machine-readable MCP requirements
- Skills will document MCP server requirements using `mcpServers: []` array instead of `dependencies`
- Validation during publish will warn if `mcp__` prefixed items appear in dependencies field
- Installation process will skip MCP server pseudo-dependencies gracefully (both in dependencies and mcpServers)
- Documentation will guide skill authors to use the new `mcpServers` field correctly

**How it integrates:**
- Extends existing SKILL.md YAML frontmatter schema with optional `mcpServers` field
- Adds MCP server detection using `mcp__` prefix matching
- Maintains backward compatibility - existing skills continue working without `mcpServers` field
- Installation workflow checks both `dependencies` and `mcpServers`, only installs skills from `dependencies`
- Provides migration guidance for affected skills

**Success criteria:**
- Skills with MCP server requirements (in new `mcpServers` field) install successfully
- MCP servers are not attempted to be installed as skills
- Skill authors receive clear guidance on using the `mcpServers` field
- Existing skills without `mcpServers` field continue to function without modification
- Skills with `mcp__` prefixed dependencies receive validation warnings during publish

## Stories

### Story 13.1: Add mcpServers Field and Validation

**Description:** Extend SKILL.md schema with optional `mcpServers` field and implement validation to warn authors when `mcp__` prefixed items appear in dependencies.

**Key Tasks:**
- Add `mcpServers: []` field to SKILL.md YAML frontmatter schema
- Implement `mcp__` prefix detection for dependency validation
- Add validation warning during `publish` command when `mcp__` prefixed items detected in dependencies
- Provide actionable guidance to use `mcpServers` field instead
- Update skill template to show `mcpServers` field usage with examples

### Story 13.2: Update Dependency Installation to Skip MCP Servers

**Description:** Modify the installation workflow to gracefully skip MCP server references using `mcp__` prefix detection, ensuring skills install without attempting to install MCP servers as dependencies.

**Key Tasks:**
- Extend dependency resolver to identify MCP servers using `mcp__` prefix matching
- Skip installation for any dependency with `mcp__` prefix
- Log informational message when MCP server dependency is skipped (e.g., "Skipping MCP server: mcp__pixel-art")
- Continue installation of remaining valid skill dependencies without errors
- Add debug logging for troubleshooting MCP server detection
- Load `mcpServers` field metadata but do not attempt installation

### Story 13.3: Documentation and Migration Guidance

**Description:** Update documentation to guide skill authors on using the `mcpServers` field correctly and provide migration path for existing skills with MCP dependencies.

**Key Tasks:**
- Update skill authoring documentation with `mcpServers` field usage guidelines
- Document `mcpServers: []` array format with examples (e.g., `mcpServers: ["mcp__pixel-art", "mcp__shadcn-ui"]`)
- Create migration guide for affected skills (e.g., pixel-art) showing before/after SKILL.md examples
- Add examples showing correct vs incorrect MCP documentation patterns
- Update skill template comments and structure to include `mcpServers` field with commented examples
- Document that users must install MCP servers separately via their own installation methods

## Compatibility Requirements

- [x] Existing APIs remain unchanged
- [x] Skills without `mcpServers` field continue working (field is optional)
- [x] Skills with `mcp__` prefixed items in dependencies will receive warnings but still publish
- [x] SKILL.md schema extended with optional `mcpServers` field (no breaking changes)
- [x] Performance impact is minimal (validation during publish, prefix check during install)

## Risk Mitigation

**Primary Risk:** Existing skills with `mcp__` prefixed items in dependencies may break if validation is too strict

**Mitigation:**
- Implement as warning, not error, during publish (skills still publish successfully)
- Skip MCP dependencies during installation using `mcp__` prefix detection rather than failing
- Make `mcpServers` field optional to avoid breaking existing skills
- Provide clear migration guidance with before/after examples
- Test with existing affected skills (e.g., pixel-art)

**Secondary Risk:** New `mcpServers` field may confuse existing skill authors

**Mitigation:**
- Document field as optional with clear purpose
- Provide examples in skill template
- Include usage guidance in documentation
- Validation warnings guide authors to correct usage

**Rollback Plan:**
- Revert validation logic (remove `mcp__` prefix warnings)
- Disable MCP server skipping during installation
- Remove `mcpServers` field from schema (won't break existing skills using it, just won't be validated)
- All skills continue functioning as before (with existing installation issues)

## Definition of Done

- [x] All stories completed with acceptance criteria met
- [x] SKILL.md schema extended with optional `mcpServers: []` field
- [x] Skills with MCP server requirements (using `mcpServers` field) install without errors
- [x] Skills with `mcp__` prefixed dependencies are skipped during installation without failing
- [x] Skill authors receive clear validation warnings during publish for incorrect MCP usage
- [x] Documentation updated with `mcpServers` field guidelines and examples
- [x] Skill template includes `mcpServers` field with commented examples
- [x] No regression in existing skill installation (skills without `mcpServers` work unchanged)
- [x] Integration tests cover `mcp__` prefix detection and skipping scenarios
- [x] Migration guide published for affected skills

---

## Story Manager Handoff

**Story Manager Handoff:**

"Please develop detailed user stories for this brownfield epic. Key considerations:

- This is an enhancement to the existing Agent Skills Registry CLI running Node.js/TypeScript
- **Primary Change**: Add optional `mcpServers: []` field to SKILL.md YAML frontmatter schema
- Integration points:
  - SKILL.md YAML parser (skill metadata loading) - extend to parse `mcpServers` field
  - Publish command validation workflow - add `mcp__` prefix detection in dependencies
  - Dependency resolution and installation logic - skip `mcp__` prefixed items
  - Error handling and user messaging - informational logs for skipped MCP servers
- Existing patterns to follow:
  - Validation warnings in publish command (non-blocking)
  - Graceful error handling during installation (skip, don't fail)
  - Clear user-facing messages and guidance (explain `mcpServers` usage)
  - Debug logging for troubleshooting (log detection and skipping)
- Critical compatibility requirements:
  - Existing skills must continue functioning without `mcpServers` field (optional field)
  - No breaking changes to SKILL.md format (additive schema extension)
  - Installation should never fail due to MCP server detection (skip gracefully)
  - Migration path must be non-disruptive (warnings guide authors, don't block)
- **Detection Method**: Use `mcp__` prefix matching for MCP server identification
- Each story must include verification that existing functionality remains intact

The epic should maintain system integrity while delivering improved skill dependency classification using the new `mcpServers` field to prevent MCP server installation failures."

---

## Validation Checklist

**Scope Validation:**
- [x] Epic can be completed in 3 stories maximum
- [x] No architectural documentation is required
- [x] Enhancement follows existing validation and installation patterns
- [x] Integration complexity is manageable (targeted changes)

**Risk Assessment:**
- [x] Risk to existing system is low (additive validation, graceful skipping)
- [x] Rollback plan is feasible (disable detection logic)
- [x] Testing approach covers existing functionality (regression tests)
- [x] Team has sufficient knowledge of SKILL.md parsing and installation

**Completeness Check:**
- [x] Epic goal is clear and achievable
- [x] Stories are properly scoped (detection, installation, documentation)
- [x] Success criteria are measurable (installation success, warnings shown)
- [x] Dependencies are identified (SKILL.md parser, install workflow)

---

**Epic Status:** Ready for Story Development

**Created:** 2025-11-10

**Priority:** High (work on next - blocks skill authors from publishing skills with MCP requirements successfully)

**Detection Method:** `mcp__` prefix matching

**Schema Change:** Add optional `mcpServers: []` field to SKILL.md YAML frontmatter

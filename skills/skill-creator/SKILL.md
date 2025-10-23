---
name: skill-creator
version: 1.0.0
author: Permamind Team
description: Meta skill for creating new Claude Agent Skills - structure, best practices, and publishing workflow
tags: ["meta", "creation", "tutorial", "best-practices"]
dependencies: []
license: MIT
---

# Skill Creator - Meta Skill

This meta skill provides comprehensive guidance for creating new Claude Agent Skills, including structure, best practices, validation, and publishing workflow.

## What is a Skill?

**Agent Skills** are modular capabilities that extend Claude's functionality by packaging specialized instructions, metadata, and optional resources. They enable Claude to operate as a domain expert rather than a generalist, automatically activating when relevant to a task.

## When to Create This Skill

Use this skill when you need to:
- Create a new Agent Skill from scratch
- Understand skill structure and requirements
- Learn best practices for skill design
- Publish skills to the decentralized registry
- Update existing skills with new versions

## Skill Structure

Every skill requires a `SKILL.md` file with YAML frontmatter:

### Required Frontmatter Fields

```yaml
---
name: skill-name              # lowercase, alphanumeric, hyphens only (1-64 chars)
version: 1.0.0                # Semantic versioning (x.y.z)
description: What the skill does  # Max 1024 characters
author: Your Name or Team     # Creator display name
---
```

### Optional Frontmatter Fields

```yaml
tags: ["category", "topic", "level"]  # Searchable tags for discovery

# Versioned dependencies (recommended)
dependencies:
  - name: dependency-skill
    version: 1.0.0
  - name: another-skill
    version: 2.1.0

# Legacy format (deprecated but supported)
dependencies: ["dependency-skill", "another-skill"]

license: MIT                  # SPDX identifier or custom license
```

## Creating a New Skill

### Step 1: Create Directory Structure

```bash
mkdir my-skill
cd my-skill
```

### Step 2: Create SKILL.md

```bash
cat > SKILL.md << 'EOF'
---
name: my-skill
version: 1.0.0
author: Your Name
description: Brief description of what your skill does (max 1024 chars)
tags: ["relevant", "category", "tags"]
dependencies: []
license: MIT
---

# My Skill Name

## What is This Skill?

Provide a clear explanation of what this skill provides.

## When to Use This Skill

Describe the scenarios where Claude should activate this skill:
- Specific use case 1
- Specific use case 2
- Specific use case 3

## How to Use This Skill

Provide step-by-step instructions and examples.

### Example 1: Basic Usage

Demonstrate a simple use case.

### Example 2: Advanced Usage

Show more complex scenarios.

## Best Practices

List recommendations and tips for optimal results:
- Keep instructions under 5k tokens
- Use clear, actionable language
- Provide specific examples
- Focus on the "why" not just the "what"

## Common Pitfalls

List things to avoid:
- Overly broad activation criteria
- Unclear instructions
- Missing context

## Additional Resources

- [Related documentation]
- [External references]
EOF
```

### Step 3: Validate Your Skill

```bash
# Install the skills CLI if not already installed
npm install -g @permamind/skills

# Validate directory structure
ls -la my-skill/
# Should show: SKILL.md (and any optional bundled files)

# Test parsing the manifest
skills publish my-skill --help
```

### Step 4: Configure Publishing

Create a `.skillsrc` file in your project or home directory:

```json
{
  "wallet": "path/to/wallet.json",
  "registry": "94aAfslKl3o_QkGLRYEg5hkJMjnuWpk1IFS6yyzLxes",
  "gateway": "https://arweave.net"
}
```

### Step 5: Publish to Registry

```bash
# Publish new skill
skills publish my-skill --verbose

# Update existing skill (new version)
# 1. Update version in SKILL.md frontmatter
# 2. Run publish again
skills publish my-skill
```

## Skill Design Best Practices

### 1. Clear Activation Criteria

Make it obvious when the skill should activate:

**Good:**
```yaml
description: Generate React components using shadcn/ui library
```

**Bad:**
```yaml
description: Help with frontend development
```

### 2. Focused Purpose

Each skill should have a specific, well-defined purpose:

**Good:** "PostgreSQL query optimization and performance tuning"
**Bad:** "Database help"

### 3. Concise Instructions

Keep the main SKILL.md under 5k tokens:
- Use clear, actionable language
- Provide specific examples
- Focus on workflows and patterns
- Bundle extensive reference material separately

### 4. Progressive Disclosure

Structure content from general to specific:
1. Overview (what and why)
2. When to use
3. How to use (step-by-step)
4. Best practices
5. Advanced patterns
6. References

### 5. Versioning Strategy

Follow semantic versioning:
- **Major (x.0.0)**: Breaking changes to skill interface or behavior
- **Minor (0.x.0)**: New features, backward compatible
- **Patch (0.0.x)**: Bug fixes, documentation improvements

### 6. Dependency Management

Specify exact dependency versions:

```yaml
dependencies:
  - name: fundamental-skill
    version: 1.2.0
  - name: helper-skill
    version: 2.0.1
```

**Benefits:**
- Reproducible installations
- Avoid breaking changes
- Clear compatibility requirements

### 7. Searchable Metadata

Use descriptive tags for discovery:

```yaml
tags: ["domain", "level", "technology"]
# Examples:
# - ["ao", "beginner", "blockchain"]
# - ["react", "advanced", "frontend"]
# - ["security", "intermediate", "testing"]
```

## Publishing Workflow

### First-Time Setup

1. **Get Arweave Wallet**
   - Generate or import wallet: `~/.aos.json` or custom path
   - Fund wallet: Visit https://faucet.arweave.net for testnet AR

2. **Configure Registry**
   - Create `.skillsrc` with registry process ID
   - Mainnet registry: `94aAfslKl3o_QkGLRYEg5hkJMjnuWpk1IFS6yyzLxes`

3. **Verify Configuration**
   ```bash
   skills --version
   cat .skillsrc
   ```

### Publishing Process

1. **Validate Manifest**
   - Required fields: name, version, description, author
   - Valid version format: x.y.z
   - Unique skill name (for first publish)

2. **Create Bundle**
   - SKILL.md is always included
   - Additional files bundled automatically
   - Compressed as .tar.gz

3. **Upload to Arweave**
   - Permanent storage on Arweave
   - Transaction ID returned for reference
   - Cost: ~0.0006 AR per skill

4. **Register in AO Registry**
   - New skills: Register-Skill handler
   - Updates: Update-Skill handler (ownership verified)
   - Metadata indexed for search

### Updating a Skill

1. **Increment Version**
   ```yaml
   version: 1.0.1  # Update in SKILL.md
   ```

2. **Update Content**
   - Modify instructions
   - Add new examples
   - Fix documentation

3. **Publish Update**
   ```bash
   skills publish my-skill
   # Automatically detects existing skill
   # Uses Update-Skill handler
   ```

## Common Validation Errors

### Missing Required Fields
```
Error: Missing required field: version
Solution: Add 'version' to SKILL.md frontmatter
```

### Invalid Version Format
```
Error: Invalid version format
Solution: Use semantic versioning (e.g., 1.0.0)
```

### Skill Name Conflict
```
Error: Skill with name 'x' already exists
Solution: Choose a unique name or update existing skill
```

### Unauthorized Update
```
Error: Unauthorized: Only the skill owner can update
Solution: Use the wallet that originally published the skill
```

## Advanced Patterns

### Skill Families

Create related skills with shared dependencies:

```yaml
# Base skill
name: arweave-fundamentals
dependencies: []

# Advanced skill
name: arweave-advanced
dependencies:
  - name: arweave-fundamentals
    version: 1.0.0
```

### Meta Skills

Skills that help create or manage other skills:
- Code generation templates
- Validation tools
- Publishing automation
- Documentation generators

### Domain-Specific Skills

Focus on specific technologies or workflows:
- `ao-process-design` - AO architecture patterns
- `react-best-practices` - React development standards
- `security-auditing` - Security review workflows

## Installation & Discovery

### Installing Skills

```bash
# Local (default) - creates .claude/skills/ in project
skills install my-skill

# Global - installs to ~/.claude/skills/
skills install my-skill -g

# With dependencies
skills install complex-skill  # Auto-resolves dependencies
```

### Searching Skills

```bash
# Search by keyword
skills search ao

# List all skills
skills search " "

# Results show: name, author, version, description, tags
```

### Lock File

Skills create a `skills-lock.json` tracking:
- Installed skills and versions
- Dependency tree
- Installation paths
- Timestamps

## Troubleshooting

### Publish Fails - Insufficient Balance
```
Error: Insufficient funds (0 AR)
Solution: Add funds to wallet address
Visit: https://faucet.arweave.net
```

### Install Fails - Dependency Not Found
```
Error: Dependency 'skill-name' not found
Solution: Verify dependency exists in registry
Run: skills search skill-name
```

### CU Gateway Rate Limiting
```
Error: Unexpected token '<', "<html>...
Solution: Wait a few seconds and retry
The CLI automatically retries with delays
```

## CLI Commands Reference

### Publish
```bash
skills publish <directory>           # Publish skill
skills publish <directory> --verbose # Show detailed logs
skills publish <directory> --wallet <path>  # Custom wallet
skills publish <directory> --gateway <url>  # Custom gateway
```

### Install
```bash
skills install <name>                # Install locally
skills install <name> -g             # Install globally
skills install <name> --force        # Overwrite existing
skills install <name> --verbose      # Show dependency tree
skills install <name> --no-lock      # Skip lock file
```

### Search
```bash
skills search <query>                # Search skills
skills search " "                    # List all skills
```

## Resources

- **CLI Repository**: https://github.com/ALLiDoizCode/Permamind
- **Registry Process**: 94aAfslKl3o_QkGLRYEg5hkJMjnuWpk1IFS6yyzLxes
- **Arweave Faucet**: https://faucet.arweave.net
- **AO Documentation**: Query using the `ao` skill
- **Arweave Documentation**: Query using the `arweave` skill

## Examples

### Minimal Skill

```yaml
---
name: hello-world
version: 1.0.0
author: Developer
description: Simple greeting skill for testing
---

# Hello World Skill

When the user greets Claude, respond with a friendly hello!
```

### Skill with Dependencies

```yaml
---
name: advanced-ao
version: 2.0.0
author: AO Team
description: Advanced AO patterns building on fundamentals
dependencies:
  - name: ao
    version: 1.0.2
  - name: aolite
    version: 1.0.1
---

# Advanced AO Patterns

This skill builds on the foundational AO knowledge...
```

### Skill with Rich Metadata

```yaml
---
name: react-expert
version: 3.2.1
author: Frontend Guild
description: Expert-level React patterns including hooks, context, performance optimization, and testing strategies
tags: ["react", "frontend", "advanced", "performance", "testing"]
dependencies:
  - name: javascript-fundamentals
    version: 2.0.0
  - name: typescript-advanced
    version: 1.5.0
license: MIT
---

# React Expert Skill

Comprehensive guidance for advanced React development...
```

## Next Steps

After installing this skill, you can:

1. **Create your first skill** following the step-by-step guide above
2. **Validate the manifest** using the JSON schema
3. **Publish to the registry** making it available to everyone
4. **Share with the community** via search and discovery

Remember: Skills are most valuable when they:
- Solve a specific problem
- Provide clear, actionable guidance
- Include relevant examples
- Are well-documented and maintainable

Happy skill creating! 🚀

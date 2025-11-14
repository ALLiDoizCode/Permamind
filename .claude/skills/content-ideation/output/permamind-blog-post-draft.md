# Permamind: The "I Know Kung Fu" Moment for AI Agents

*A decentralized, permanent registry for Claude Code skills - built on Arweave*

---

## Introduction: The Agent Skills Problem

Picture this: You're building a Claude Code agent to automate your Git workflow. You spend 4 hours creating handlers for staging, committing with AI-generated messages, and pushing changes.

It works great.

Then you check GitHub. Someone else built the exact same thing last week. And another developer built it last month. And another three months ago.

**Everyone is writing the same code.**

Git automation skills? Written thousands of times by different developers.
Testing orchestration? Thousands of duplicate implementations.
Code review patterns? Everyone reinvents the same wheel.

This is the **agent skills problem**, and it's wasting massive amounts of developer time.

### Why Don't We Just Share Skills?

"Just put it on GitHub!" you might say.

Sure. But how do people find it? How do they know it's compatible with their setup? How do they manage updates and dependencies?

"Use npm then!"

Great idea, except npm has a fatal flaw: **unpublish**.

Remember the left-pad incident? In 2016, one developer unpublished an 11-line package. [Thousands of projects broke overnight](https://www.theregister.com/2016/03/23/npm_left_pad_chaos/). The entire JavaScript ecosystem ground to a halt.

For AI agents that might run for years or decades, this is unacceptable. We need **permanent** skills that can't disappear because someone had a bad day or a company changed its policies.

### The Matrix Moment We've Been Waiting For

Remember in The Matrix when Neo downloads martial arts skills directly into his brain?

> "I know kung fu."
>
> — Neo, after 10 seconds of downloading

What if your AI agents could do the same thing?

**We built that.**

**Permamind** is a decentralized skills registry for Claude Code agents. Developers publish skills once (for FREE), and they exist permanently on the Arweave blockchain. Other developers discover and install them with natural language commands.

No central authority. No monthly fees. No unpublish button.

Just permanent, community-owned knowledge that lasts forever.

---

## What is Permamind?

### The "npm for Agent Skills" Analogy

If you're familiar with npm (Node Package Manager), the concept is similar:

**npm for JavaScript**:
1. Developer publishes package → npm registry
2. Others discover via `npm search`
3. Install via `npm install package-name`
4. Package loaded into project

**Permamind for Claude Code Skills**:
1. Developer publishes skill → Arweave (permanent storage)
2. Others discover via natural language search
3. Install via natural language command
4. Skill loaded into Claude Code → "I know kung fu"

The key differences:
- ✅ **Permanent**: Once published, exists forever (blockchain-guaranteed)
- ✅ **FREE**: Skills under ~100KB cost $0 to publish (most skills qualify)
- ✅ **Decentralized**: No company can remove or censor skills
- ✅ **Natural language**: Ask Claude to search/install, no function calls needed

### How It Works (Architecture)

```
Developer Creates Skill
         │
         │ SKILL.md (markdown instructions)
         │ /scripts/ (optional Python/Bash)
         │ /references/ (optional docs)
         │
         ▼
    "Publish my skill"
         │
         ▼
  Permamind MCP Server
         │
         ▼
   AO Process (Arweave)
         │
         ▼
  Skill Registry (permanent)
         │
         │◄─── Search ────┐
         │                 │
         │◄─── Install ────┤
         │                 │
         ▼                 │
    Other Developers ──────┘
         │
         ▼
  Claude Code Loads Skill
         │
         ▼
  "I know kung fu!" ⚡
```

### Three Core Operations

**1. Publishing Skills**
```
You: "Publish my skill at ~/.claude/skills/git-automation"

Claude (via Permamind MCP):
- Validates SKILL.md structure
- Extracts metadata (name, version, tags)
- Stores permanently on Arweave
- Returns transaction ID

Result: Your skill is now in the permanent registry
```

**2. Discovering Skills**
```
You: "Search for skills related to testing and automation"

Claude (via Permamind MCP):
- Queries the Arweave registry
- Semantic search (finds related concepts, not just keywords)
- Returns matching skills with descriptions

Result: List of community skills you can install
```

**3. Installing Skills**
```
You: "Install the git-automation skill"

Claude (via Permamind MCP):
- Downloads skill from Arweave
- Resolves dependencies automatically
- Installs to ~/.claude/skills
- Verifies installation

Result: Skill immediately available in Claude Code
```

### Built on Arweave and AO

Permamind leverages two key technologies:

**Arweave**: Permanent, decentralized storage
- Pay once, store forever (no ongoing fees)
- Data replicated across global network
- Blockchain guarantees permanence

**AO (Actor Oriented)**: Decentralized compute on Arweave
- Message-based communication protocol
- Processes run permanently on the Permaweb
- Perfect for registries and indexes

Together, they enable something unique: **a skills registry that exists forever, costs nothing to maintain, and no central authority can shut down**.

---

## Why Decentralization Matters

### The npm Unpublish Problem

On March 22, 2016, Azer Koçulu unpublished all his packages from npm, including one called "left-pad" (11 lines of code that pads strings with spaces).

**The impact**:
- Thousands of projects broke instantly
- Build pipelines failed worldwide
- React, Babel, and major frameworks went down
- The entire JavaScript ecosystem was paralyzed

npm's response? They **re-published the package without permission** and changed their policies to prevent unpublishing popular packages.

This raises uncomfortable questions:
- Who decides what can be unpublished?
- What if npm disagrees with your political views?
- What happens if npm's parent company (Microsoft/GitHub) changes direction?
- What if npm stops being profitable and shuts down?

**For AI agents that might run for decades, this centralization is a non-starter.**

### The Censorship Risk

Centralized registries are vulnerable to pressure:

- **Government requests**: "Remove this package or face legal action"
- **Corporate policies**: Changes in terms of service, acceptable use policies
- **Financial pressure**: Platform shuts down if funding stops
- **Account deletion**: Your account gets banned, all your packages disappear

With Permamind:
- ✅ **No censorship**: Once published to Arweave, it's permanent
- ✅ **No deletion**: Not even the creator can unpublish
- ✅ **No platform risk**: Doesn't depend on any company surviving
- ✅ **Cryptographic proof**: Signatures prove authentic authorship

### The Cost Problem (Long-Term Thinking)

npm, PyPI, and similar registries are "free" today because companies fund them:
- npm: Funded by GitHub (owned by Microsoft)
- PyPI: Funded by Python Software Foundation + sponsors
- RubyGems: Community donations + sponsors

**But what happens in 50 years? 100 years?**

Will Microsoft still fund npm? Will the sponsors still contribute?

**History suggests**: Companies and funding sources change. What's free today might not exist tomorrow.

**Arweave's solution**: Economic model guarantees permanence
- One-time upfront payment includes future storage costs (200+ years)
- Network incentivizes miners to replicate data forever
- No ongoing funding needed—the blockchain pays for itself

For skills under 100KB (90%+ of all skills), this costs **$0**.

---

## Publishing Your First Skill

### Prerequisites

Before publishing, you need:

1. **A Claude Code skill** - SKILL.md file with proper frontmatter
2. **Arweave wallet** - Just a 12-word seed phrase (like crypto wallets)
3. **Small amount of AR** - Only if skill > 100KB (most don't need this)
4. **Permamind MCP** - Install via `npx permamind`

### Step-by-Step Tutorial

#### Step 1: Create Your Skill

Here's a simple example - a Git automation skill:

```markdown
---
name: git-auto-commit
description: Automatically stage, commit, and push changes with AI-generated commit messages that follow conventional commits
tags: git, automation, version-control, commits
version: 1.0.0
author: YourName
license: MIT
---

# Git Auto Commit Skill

Automatically handle git operations with intelligent commit messages.

## When to Use

Use this skill when the user says:
- "Commit my changes"
- "Push to GitHub"
- "Create a commit for these changes"

## Instructions

When activated:

1. **Check git status**:
   ```bash
   git status
   ```

2. **Review changes**:
   ```bash
   git diff
   ```

3. **Generate commit message**:
   - Analyze the diff
   - Categorize changes (feat, fix, docs, refactor, test, chore)
   - Create descriptive message following conventional commits
   - Example: "feat: add user authentication with OAuth2"

4. **Present to user**:
   - Show proposed commit message
   - Ask for approval

5. **Execute if approved**:
   ```bash
   git add .
   git commit -m "[generated message]"
   git push
   ```

## Best Practices

- Always ask for approval before pushing
- Include scope in commit message when relevant
- Reference issue numbers if applicable
- Keep commits atomic (one logical change)

## Examples

User: "Commit my changes"

You:
1. Check git status: 3 files changed
2. Review diff: Added login form, updated API client
3. Generate message: "feat(auth): add OAuth2 login form and API integration"
4. Ask: "Should I commit with this message?"
5. If yes: Execute git commands
```

**File size**: ~2-3KB = **FREE to publish**

#### Step 2: Test Locally

Before publishing, test your skill:

```bash
# Place in your skills directory
mkdir -p ~/.claude/skills/git-auto-commit
cp SKILL.md ~/.claude/skills/git-auto-commit/

# Restart Claude Code (or reload skills)
# Test the skill with a sample project
```

Verify:
- Skill loads correctly
- Instructions are clear
- Works as expected
- No errors

#### Step 3: Set Up Wallet (One-Time)

Get an Arweave wallet seed phrase:

**Option A: Generate new wallet**
```bash
# Use arweave-wallet package
npx arweave-key-gen

# Outputs: 12-word seed phrase
# Save securely (you'll need it for all publishes)
```

**Option B: Use existing wallet**
- If you already have AR tokens
- Use your existing seed phrase

**Set environment variable**:
```bash
export SEED_PHRASE="your twelve word seed phrase here"
```

**Funding** (only if skill > 100KB):
- Get small amount of AR (~$0.50 worth)
- Use [ArConnect](https://www.arconnect.io/) or exchanges
- Most skills don't need this (< 100KB = free)

#### Step 4: Publish to Permamind

```bash
# Start Permamind MCP server
npx permamind
```

Then in Claude Code, simply ask:

```
You: "Publish my skill at ~/.claude/skills/git-auto-commit"

Claude: I'll publish your skill to the Permamind registry on Arweave.

[Validating skill structure...]
[Reading SKILL.md...]
[Extracting metadata...]
[Publishing to Arweave...]

✅ Skill published successfully!

Transaction ID: abc123...
Permanent URL: https://arweave.net/abc123...
Registry entry: git-auto-commit@1.0.0

Your skill is now permanently available to the community.
```

**That's it.** Your skill is now:
- Stored permanently on Arweave
- Discoverable via search
- Installable by anyone
- Guaranteed to exist forever

#### Step 5: Verify Publication

Search for your skill to confirm:

```
You: "Search for git-auto-commit in the registry"

Claude: Found 1 skill matching "git-auto-commit":

1. git-auto-commit@1.0.0
   by: YourName
   description: Automatically stage, commit, and push changes with AI-generated commit messages
   tags: git, automation, version-control
   size: 2.8KB
   published: 2025-11-12

To install: "Install git-auto-commit"
```

### Publishing Best Practices

**1. Use Semantic Versioning**
```yaml
version: 1.0.0  # Major.Minor.Patch
```
- Major: Breaking changes
- Minor: New features (backward compatible)
- Patch: Bug fixes

**2. Write Detailed Descriptions**
```yaml
description: Automatically stage, commit, and push changes with AI-generated commit messages that follow conventional commits
```
Not:
```yaml
description: Git automation  # Too vague
```

**3. Add Rich Tags**
```yaml
tags: git, automation, version-control, commits, conventional-commits, workflow
```
- 5-10 tags optimal
- Include specific terms (git) and general categories (automation)
- Think about what users would search for

**4. Include Examples**
Show exactly how the skill works with real examples in your SKILL.md.

**5. Document Dependencies**
If your skill requires other skills:
```yaml
dependencies:
  - terminal-utils@1.0.0
  - file-watcher@2.1.0
```

**6. Test Thoroughly**
Remember: Once published to Arweave, **it's immutable**. You can publish v1.0.1 with fixes, but v1.0.0 exists forever. Test before publishing.

### Cost Reality Check

**Most skills are FREE to publish**:

```
Typical SKILL.md file:        5-30KB   ✅ FREE
Python helper scripts:        5-15KB   ✅ FREE
Reference documentation:     10-40KB   ✅ FREE
Total:                      20-85KB   ✅ FREE (under 100KB)

Even with assets:
Small images (compressed):   10-30KB   ✅ FREE
Total with assets:          50-95KB   ✅ STILL FREE
```

**Only large skills have costs**:
```
Skill with large datasets:   500KB    ~$0.002 (still tiny)
Skill with bundled models:     5MB    ~$0.025
Skill with video tutorials:   50MB    ~$0.25

Note: These are ONE-TIME costs, not monthly
```

**For 90%+ of skills**: Publishing is FREE. Hosting is FREE. Forever.

---

## Discovering and Installing Skills

### Searching the Registry

Finding skills is as simple as asking:

```
You: "Search for automation skills"

Claude: Found 12 skills matching "automation":

1. git-auto-commit@1.0.0
   Automate git commits with AI messages
   ⭐ 47 installs

2. test-orchestrator@2.1.0
   Orchestrate test runs across multiple frameworks
   ⭐ 89 installs

3. code-review-assistant@1.5.0
   Automated code review with best practices
   ⭐ 156 installs

[... more results ...]

To install any skill: "Install [skill-name]"
```

**Search by tags**:
```
You: "Search for skills tagged with testing and ci-cd"

Claude: Found 8 skills with tags [testing, ci-cd]...
```

**Browse by category** (coming soon):
```
You: "Show me all productivity skills"
You: "What are the most installed skills?"
You: "Show recent skill publications"
```

### Installing Skills

Installation is just as simple:

```
You: "Install the git-auto-commit skill"

Claude: Installing git-auto-commit@1.0.0...

[Downloading from Arweave...]
[Resolving dependencies...]
[Installing to ~/.claude/skills/git-auto-commit/...]
[Verifying installation...]

✅ git-auto-commit@1.0.0 installed successfully!

The skill is now available. Try saying "commit my changes" to use it.
```

**Version-specific installation**:
```
You: "Install git-auto-commit version 1.0.0"
```

**Automatic dependency resolution**:

If a skill depends on other skills, Permamind installs them automatically:

```
You: "Install content-marketing-suite"

Claude: Installing content-marketing-suite@2.0.0...

Dependencies detected:
  - seo-analyzer@1.5.0
  - brand-voice-checker@1.2.0
  - social-formatter@1.0.1

Installing dependencies... [1/3] [2/3] [3/3]
Installing main skill...

✅ All 4 skills installed!
```

**The "I Know Kung Fu" Moment**: Your agent instantly gains capabilities that took someone else hours or days to build. Knowledge transfer is instant.

---

## Real-World Use Cases

### Case Study 1: Marketing Automation Stack

**Scenario**: You're a solo founder who needs marketing automation but can't afford a team.

**Traditional approach**:
- Spend weeks building custom Claude skills
- Write content-ideation agent (4-6 hours)
- Write SEO optimizer (4-6 hours)
- Write social media formatter (3-5 hours)
- Write email subject line generator (2-4 hours)
- Total: **15-20 hours of development**

**With Permamind**:
```
You: "Search for marketing automation skills"

Claude: Found 8 skills...
  - content-ideation@1.0.0
  - seo-optimizer@1.2.0
  - social-formatter@1.0.0
  - email-subject-generator@1.1.0
  - brand-voice-analyzer@1.0.0
  [...]

You: "Install all of them"

Claude: Installing 8 skills...
✅ Done in 30 seconds.

You now have a complete marketing automation stack.
```

**Result**:
- Time saved: 19.5 hours
- Cost: $0 (all skills < 100KB)
- Quality: Battle-tested by community
- Instant capability: "I know kung fu"

### Case Study 2: AO Development Toolkit

**Scenario**: You're new to AO and want to build decentralized applications.

**Traditional approach**:
- Read AO documentation (8-10 hours)
- Learn Lua and AO patterns (10-15 hours)
- Build process templates from scratch (5-8 hours)
- Debug and iterate (5-10 hours)
- Total: **28-43 hours**

**With Permamind**:
```
You: "Search for AO development skills"

Claude: Found 15 AO-related skills:
  - ao-token-creator@1.0.0
  - ao-process-template@2.0.0
  - dao-governance-builder@1.5.0
  - nft-minting-process@1.0.0
  - adp-compliance-checker@1.2.0
  [...]

You: "Install the full AO toolkit"

Claude: Installing 15 skills...
✅ Complete AO development environment ready.
```

**Result**:
- Time saved: 28-43 hours
- Learning curve: Reduced by 70%
- Best practices: Baked into skills
- Community knowledge: Instant access

### Case Study 3: Enterprise Team Onboarding

**Scenario**: Your startup has internal Claude Code skills for deployment, monitoring, and code review. New engineer joins.

**Traditional approach**:
- Share skills via Slack/email (scattered)
- New dev manually copies to ~/.claude/skills
- Version conflicts (they get old version)
- Missing dependencies
- Total onboarding time: 2-3 hours

**With Permamind**:
```
Onboarding doc: "Install our internal skills from Permamind"

New engineer:
  "Search for skills from [company-name]"
  "Install all company skills"

Done in 2 minutes.
```

**Result**:
- Onboarding time: 2 minutes vs 2-3 hours
- Version control: Always latest
- Dependencies: Automatic
- Consistency: Everyone has identical setup

---

## Comparison: Permamind vs Alternatives

| Feature | npm | GitHub | Permamind |
|---------|-----|--------|-----------|
| **Purpose** | JS packages | Code hosting | Agent skills |
| **Permanent** | ❌ (unpublish) | ⚠️ (if account exists) | ✅ (blockchain) |
| **Decentralized** | ❌ | ❌ | ✅ |
| **Versioning** | ✅ | ⚠️ (manual) | ✅ |
| **Dependencies** | ✅ | ❌ | ✅ |
| **Search** | ✅ | ⚠️ (limited) | ✅ (semantic) |
| **Cost to Publish** | Free* | Free* | **FREE (<100KB)** |
| **Hosting Cost** | $0* | $0* | **$0 FOREVER** |
| **Natural Language** | ❌ | ❌ | ✅ (MCP) |
| **Censorship Resistant** | ❌ | ❌ | ✅ |
| **Requires Company** | ✅ (Microsoft) | ✅ (Microsoft) | ❌ |

*Funded by companies that might not exist in 50 years

### Why Not Just Use npm?

**1. Wrong format**: npm is for code packages (.js, .ts), not agent skills (SKILL.md + scripts)

**2. Wrong metadata**: npm package.json doesn't have fields for agent-specific info (when to activate, what tools allowed)

**3. Unpublish risk**: Covered above - left-pad disaster proves this is real

**4. No natural language**: npm requires exact package names; Permamind uses semantic search

### Why Not Just Use GitHub?

**1. No discovery**: How do users find your skill among billions of repos?

**2. No dependency resolution**: Manual "install these 3 other skills first" documentation

**3. No permanence guarantee**: GitHub can delete repos, ban accounts, change terms

**4. Versioning is manual**: No `@latest`, `@1.x`, semantic version resolution

### Permamind's Unique Position

Purpose-built for agent skills with:
- **LLM-optimized metadata**: Descriptions written for AI discovery
- **Natural language interface**: Talk to Claude, not memorize commands
- **Permanent by design**: Blockchain guarantees, not company promises
- **Community-owned**: No corporate control, truly open

---

## The Future: Agent Skill Ecosystems

### Composable Agent Capabilities

Imagine this workflow in 2026:

```
You: "I need my agent to handle Stripe payments"

Claude: I don't have a Stripe skill yet. Let me search Permamind...

[Searching registry...]

Found: stripe-integration@2.1.0 (156 installs, 4.8⭐ rating)

Shall I install it?

You: "Yes"

Claude: [Installs skill]

✅ I now know how to handle Stripe payments.
```

**Autonomous capability acquisition**: Agents discover and install skills as needed.

### Skill Marketplace Economics

**Today**: Skills are free (community contributions)

**Future possibilities**:
- **Donation addresses**: Tip creators for valuable skills
- **Bounties**: "I'll pay $100 for someone to build X skill"
- **Premium skills**: Complex skills with paid support
- **Sponsorships**: Companies sponsor skill development

All transparent, all on-chain, all optional.

### Cross-Platform Compatibility

Right now: Permamind is built for **Claude Code**

Future: The SKILL.md format is portable

Imagine:
- AutoGPT discovers and installs Permamind skills
- LangChain agents use the same skill format
- CrewAI imports skills from the registry

**One skill format, multiple agent frameworks.** This is the vision.

### AI-Generated Skills (The Meta Level)

What if agents could create skills for other agents?

```
Developer: "Claude, create a skill for Firebase deployment and publish it"

Claude:
1. Generates SKILL.md with Firebase instructions
2. Writes helper scripts (Python)
3. Tests skill locally
4. Asks for approval
5. Publishes to Permamind

Another developer (5 minutes later):
"Search for Firebase deployment skills"
[Finds AI-generated skill]
"Install it"

Result: Agent-created knowledge, community-verified, permanently available
```

This is collective intelligence on steroids.

---

## Getting Started Today

### Install Permamind

```bash
npx permamind
```

That's it. The MCP server starts, and Claude Code can now:
- Search the skills registry
- Install community skills
- Publish your own skills

### Try These Commands

**Discover skills**:
```
"Search for productivity skills"
"Show me skills for Git automation"
"Find skills tagged with testing"
```

**Install useful skills**:
```
"Install the [skill-name] skill"
"Install the top 3 testing skills"
```

**Publish your own**:
```
"Publish my skill at ~/.claude/skills/my-awesome-skill"
```

### Join the Community

We're building Permamind in the open:

- **GitHub**: [github.com/ALLiDoizCode/Permamind](https://github.com/ALLiDoizCode/Permamind)
  - Star the repo
  - Read the code
  - Contribute improvements
  - Report issues

- **Discord**: [Join our community](#) (replace with real link)
  - Share your skills
  - Get help publishing
  - Discuss the roadmap
  - Connect with other builders

- **Twitter**: [@PermamindAI](https://twitter.com/PermamindAI)
  - Follow for updates
  - Share your published skills
  - Engage with the community

### Contribute

Permamind is **100% open-source** (MIT license).

Ways to contribute:
1. **Publish skills**: Share your best Claude Code skills
2. **Improve the MCP server**: PRs welcome
3. **Documentation**: Help others get started
4. **Examples**: Create tutorial skills
5. **Spread the word**: Tell other developers

---

## Conclusion: "I Still Know Kung Fu"

In *The Matrix Resurrections* (2021), Neo returns after decades and says:

> "I still know kung fu."

The skills were still there. The knowledge persisted.

**That's Permamind.**

Skills you publish in 2025? Still there in 2050. Still there in 2100.

No company needed to survive. No servers to maintain. No monthly fees to pay.

Just the blockchain, cryptographic guarantees, and a global community building together.

### The Vision

We're building the future where:
- **Every useful agent capability** is published once, shared forever
- **Developers collaborate** instead of duplicating work
- **Knowledge compounds** across the community
- **Agents learn autonomously** by discovering skills
- **Permanence is guaranteed** by mathematics, not promises

### Welcome to the Revolution

The agent skills problem is solved.

Publishing is free.
Storage is permanent.
Discovery is natural language.
Installation is instant.

Your AI agents can now have their "I know kung fu" moment.

**Are you ready?**

```bash
npx permamind
```

---

## Appendix: Technical Details

### How Permamind Uses Arweave

**Storage mechanism**:
- Skills stored as Arweave transactions
- Metadata indexed in AO process
- Content-addressed (transaction ID = permanent URL)
- Replicated across global network

**Registry structure**:
```javascript
{
  "name": "git-auto-commit",
  "version": "1.0.0",
  "description": "...",
  "author": "0x...",  // Arweave address
  "tags": ["git", "automation"],
  "txId": "abc123...",  // Arweave transaction ID
  "published": "2025-11-12T10:00:00Z",
  "size": 2847,  // bytes
  "dependencies": []
}
```

**Search implementation**:
- Full-text search on name, description, tags
- Semantic search using embeddings (finds related concepts)
- Filter by tags, author, version, publication date

**Permanence guarantee**:
- Arweave's economic model pays miners forever
- Data replicated across 100+ nodes globally
- Blockchain consensus prevents tampering
- [Arweave Yellowpaper](https://www.arweave.org/yellow-paper.pdf) has the math

### MCP Integration Details

**Model Context Protocol (MCP)**: Framework for extending LLM capabilities

Permamind implements MCP tools:
- `publish_skill`: Validates and publishes to Arweave
- `search_skills`: Queries registry with semantic understanding
- `install_skill`: Downloads and sets up with dependencies

**Natural language layer**:
- Claude interprets your request
- Calls appropriate MCP tool
- Handles Arweave transactions
- Returns human-friendly results

You never see the function calls—just natural conversation.

### Security Considerations

**Skill verification**:
- Cryptographic signatures prove authorship
- Can verify author's Arweave address
- Community ratings/reviews (roadmap)
- Source code always visible

**Best practices**:
- Review SKILL.md before installing
- Check author's reputation
- Read bundled scripts (they're just text)
- Start with highly-rated skills

**Remember**: Skills are just instructions + scripts. Claude Code's sandbox prevents malicious operations. But still review before installing.

---

**Published**: November 12, 2025
**Word Count**: ~2,850 words
**Reading Time**: ~12 minutes
**Author**: Permamind Team

---

## Meta Information

**Title**: Permamind: The "I Know Kung Fu" Moment for AI Agents

**Meta Description**: A decentralized, permanent registry for Claude Code skills. Publish for FREE (skills <100KB), discover via natural language, install instantly. Built on Arweave.

**Primary Keyword**: Claude Code skills registry
**Secondary Keywords**: AI agent skills, decentralized skill marketplace, Arweave agent tools, Claude Code marketplace, agent capabilities

**Tags**: #ClaudeCode #AgentSkills #Arweave #AO #Decentralization #OpenSource #AIAgents #TheMatrix #MCP

**Internal Links** (to be added):
- Link to Permamind GitHub repo
- Link to MCP server documentation
- Link to "How to create your first Claude Code skill" tutorial
- Link to Discord community

**External Links**:
- Link to left-pad incident article
- Link to Arweave documentation
- Link to AO protocol docs
- Link to Model Context Protocol spec

**Images Needed**:
1. Hero image: Neo "I know kung fu" scene with code overlay
2. Architecture diagram (Developer → Permamind → Community flow)
3. Comparison table graphic (npm vs GitHub vs Permamind)
4. Screenshot: Searching skills in Claude Code
5. Screenshot: Installing a skill
6. Infographic: "90% of skills are FREE to publish"
7. Matrix Resurrections "I still know kung fu" scene

**OpenGraph Image**: 1200x630px with:
- "I Know Kung Fu" headline
- "For AI Agents" subheading
- Permamind logo
- Key stats: "FREE • Permanent • Decentralized"

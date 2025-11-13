# Getting Started with Permamind

Welcome to Permamind, the decentralized registry for Claude Code agent skills! This tutorial will walk you through installing the CLI, publishing your first skill, and discovering skills from the community.

## What is Permamind?

Permamind is like **npm for Claude Code skills** - a permanent, decentralized registry where developers can:
- **Publish** their Claude agent skills to the Permaweb
- **Discover** skills created by the community
- **Install** skills instantly with automatic dependency resolution

Think of it as the "I Know Kung Fu" moment from The Matrix - agents can instantly gain new capabilities by loading skills from Permamind.

## Installation

Install the Permamind CLI globally using npm:

```bash
npm install -g @permamind/skills
```

Verify the installation:

```bash
skills --version
```

You should see the version number printed to the console.

## Publishing Your First Skill

### Step 1: Create a Skill Directory

Create a new directory for your skill:

```bash
mkdir my-awesome-skill
cd my-awesome-skill
```

### Step 2: Create SKILL.md

Create a `SKILL.md` file with YAML frontmatter:

```yaml
---
name: my-awesome-skill
description: A skill that does something awesome
version: 1.0.0
tags: [tutorial, example]
---

# My Awesome Skill

This skill demonstrates how to create and publish a Permamind skill.

## When to Use

Use this skill when you need to do something awesome.

## How to Use

1. Activate the skill
2. Follow the instructions
3. Profit!
```

### Step 3: Set Up Your Wallet

Permamind uses Arweave for permanent storage. Set up your wallet seed phrase:

```bash
export SEED_PHRASE="your twelve word seed phrase here"
```

**Important:** Keep your seed phrase secure! Never commit it to version control.

### Step 4: Publish to Permamind

Publish your skill to the registry:

```bash
skills publish
```

The CLI will:
1. Validate your SKILL.md file
2. Create a bundle (tar.gz)
3. Upload to Arweave
4. Register in the AO process
5. Return your skill ID

Congratulations! Your skill is now permanently stored on the Permaweb.

## Discovering Skills

Search for skills by keyword or tag:

```bash
skills search "tutorials"
```

Browse by tag:

```bash
skills search --tag getting-started
```

## Installing Skills

Install a skill from the registry:

```bash
skills install my-awesome-skill
```

Install a specific version:

```bash
skills install my-awesome-skill@1.0.0
```

Skills are installed to `~/.claude/skills` by default. You can customize the location with:

```bash
skills install my-awesome-skill --install-location ./my-skills
```

## Next Steps

Now that you've published and installed your first skill, here are some next steps:

- **Explore the ecosystem**: Browse popular skills on the [Permamind website](/)
- **Learn advanced patterns**: Check out the [Understanding AO Protocol Skills](/blog/understanding-ao-protocol-skills) guide
- **Join the community**: Connect with other developers on [Discord](https://discord.gg/permamind)

Happy skill building! 🚀

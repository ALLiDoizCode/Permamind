# Using the Permamind MCP Server

The Permamind MCP (Model Context Protocol) Server brings the power of the Permamind Skills Registry directly into Claude Desktop. This guide will show you how to set it up and use it effectively.

## What is an MCP Server?

MCP (Model Context Protocol) servers extend Claude's capabilities by providing tools that Claude can use during conversations. The Permamind MCP Server gives Claude the ability to:

- **Publish skills** directly from conversations
- **Search the registry** for skills by keyword or tag
- **Install skills** with automatic dependency resolution
- **Access the decentralized registry** without leaving Claude Desktop

Think of it as having the Permamind CLI built directly into Claude!

## Installation

### Prerequisites

- **Claude Desktop** (latest version)
- **Node.js** 20.11.0 LTS or higher
- **Arweave wallet** (for publishing skills)

### Step 1: Install via npx

The Permamind MCP Server is distributed as an npm package that runs via npx. No global installation needed!

### Step 2: Configure Claude Desktop

Add the MCP server to your Claude Desktop configuration file:

**Location:**
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

**Configuration:**

```json
{
  "mcpServers": {
    "permamind": {
      "command": "npx",
      "args": ["-y", "@permamind/mcp-server"],
      "env": {
        "SEED_PHRASE": "your twelve word seed phrase here"
      }
    }
  }
}
```

**Important:** Replace `your twelve word seed phrase here` with your actual Arweave wallet seed phrase. Keep this secure!

### Step 3: Restart Claude Desktop

Close and reopen Claude Desktop to load the MCP server.

## Using the MCP Server

Once configured, Claude can access these tools automatically:

### Publishing Skills

```
Claude, I have a skill directory at ~/my-skills/ao-basics.
Can you publish it to Permamind?
```

Claude will:
1. Read the SKILL.md file
2. Validate the skill metadata
3. Create and upload the bundle to Arweave
4. Register it in the AO registry
5. Return the transaction ID

### Searching for Skills

```
Claude, search Permamind for skills related to "arweave development"
```

Claude will query the registry and show you matching skills with:
- Skill name and version
- Description
- Tags
- Author information
- Download count

### Installing Skills

```
Claude, install the "ao-basics" skill from Permamind
```

Claude will:
1. Search for the skill in the registry
2. Resolve dependencies automatically
3. Download and extract to `~/.claude/skills`
4. Confirm successful installation

You can also specify versions:

```
Claude, install ao-basics version 1.2.0
```

## Advanced Usage

### Custom Install Location

```
Claude, install the shadcn-ui skill to ./project-skills/
```

### Publishing with Verbose Logging

```
Claude, publish my skill with verbose logging enabled
```

### Batch Operations

```
Claude, search for all skills tagged with "web3" and "tutorials"
```

## Security Considerations

### Wallet Security

⚠️ **Critical:** Your seed phrase in the MCP server configuration has full access to your Arweave wallet.

**Best Practices:**
- Use a dedicated wallet for skill publishing (not your main wallet)
- Keep minimal AR tokens in the publishing wallet
- Never share your `claude_desktop_config.json` file
- Add the config file to `.gitignore` if working in a repository

### Skill Validation

The MCP server validates skills before publishing:
- ✓ SKILL.md format and frontmatter
- ✓ Version number format (semver)
- ✓ Required metadata fields
- ✓ Tag format and count limits
- ✓ Bundle size limits

## Troubleshooting

### MCP Server Not Loading

**Symptom:** Claude doesn't respond to Permamind commands

**Solutions:**
1. Check the config file path is correct
2. Verify JSON syntax (use a JSON validator)
3. Restart Claude Desktop completely
4. Check Node.js version: `node --version` (must be 20.11.0+)

### Publishing Fails

**Symptom:** "Failed to publish skill" error

**Solutions:**
1. Verify SEED_PHRASE is set correctly
2. Check wallet has sufficient AR tokens (≥0.1 AR recommended)
3. Ensure SKILL.md has valid YAML frontmatter
4. Check network connectivity to Arweave

### Installation Fails

**Symptom:** "Skill not found" or installation hangs

**Solutions:**
1. Verify skill name spelling
2. Check if skill exists: search first
3. Try specifying a version explicitly
4. Clear cache and retry

## MCP vs CLI: Which to Use?

| Feature | MCP Server | CLI Tool |
|---------|-----------|----------|
| **Publishing** | ✓ Via Claude | ✓ Direct command |
| **Searching** | ✓ Natural language | ✓ Structured query |
| **Installing** | ✓ Via Claude | ✓ Direct command |
| **Automation** | ✗ No scripting | ✓ Full scripting |
| **CI/CD** | ✗ Not suitable | ✓ Perfect for CI/CD |
| **User Experience** | ✓ Conversational | ⚠️ Command-line |

**Use the MCP Server when:**
- Working interactively with Claude
- Exploring the registry conversationally
- Publishing occasional skills
- Prefer natural language over commands

**Use the CLI when:**
- Automating skill publishing
- CI/CD pipelines
- Batch operations
- Scripting workflows

## Next Steps

Now that you have the MCP server set up:

- **Publish your first skill**: Try publishing a simple skill through Claude
- **Explore the registry**: Ask Claude to search for skills by category
- **Learn advanced patterns**: Check out [Understanding AO Protocol Skills](/blog/understanding-ao-protocol-skills)
- **Join the community**: Share your experience on [Discord](https://discord.gg/permamind)

## Resources

- [MCP Server Documentation](https://github.com/permamind/skills/tree/main/mcp-server)
- [Permamind CLI Guide](/cli-guide)
- [MCP Server Migration Guide](https://github.com/permamind/skills/blob/main/docs/guides/mcp-migration-guide.md)
- [Skill Authoring Best Practices](https://docs.permamind.app/authoring)

Happy skill building with Claude! 🚀

# @permamind/mcp

MCP server for Agent Skills Registry - publish, search, and install Claude Agent Skills through natural language.

## Installation

No installation needed - runs via npx.

## Configuration

Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "permamind-skills": {
      "command": "npx",
      "args": ["@permamind/mcp@latest"],
      "env": {
        "SEED_PHRASE": "your twelve word seed phrase here"
      }
    }
  }
}
```

Restart Claude Code to load the server.

### Environment Variables

- `SEED_PHRASE` (required): 12-word BIP39 mnemonic for wallet generation
- `LOG_LEVEL` (optional): `error`, `warn`, `info`, `debug` (default: `info`)
- `REGISTRY_PROCESS_ID` (optional): Custom AO registry process ID
- `INSTALL_LOCATION` (optional): Custom skill install directory (default: `~/.claude/skills`)

## Usage

### Check Server Health

```
User: Check if the skills MCP server is working
```

Returns server status, version, and wallet address.

### Search for Skills

```
User: Search for skills about blockchain
```

```
User: Find skills tagged with "ao" and "arweave"
```

Returns list of matching skills with names, versions, descriptions, and authors.

### Install Skills

```
User: Install the ao-basics skill
```

```
User: Install ao-basics version 1.0.0
```

Installs the skill to `~/.claude/skills/` with automatic dependency resolution.

### Publish Skills

```
User: Publish the skill in /absolute/path/to/skill-directory
```

Publishes the skill to Arweave and registers it in the AO registry. Returns transaction ID and gateway URL.

## Requirements

- Node.js ≥ 20.11.0
- 12-word BIP39 seed phrase
- Arweave wallet with AR tokens (for publishing only)

## Tools Available

- `ping` - Health check
- `search_skills` - Search registry by keyword/tags
- `install_skill` - Install skills with dependencies
- `publish_skill` - Publish skills to registry

## Troubleshooting

**Server not loading?**
- Restart Claude Code after editing `.mcp.json`
- Check `SEED_PHRASE` is exactly 12 words
- Set `LOG_LEVEL: "debug"` to see detailed logs

**Publish fails?**
- Ensure wallet has AR tokens
- Verify SKILL.md has valid frontmatter
- Check Arweave gateway connectivity

**Can't find skills?**
- Try broader search terms
- Remove tag filters
- Search with empty query to list all skills

## License

MIT

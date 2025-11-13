# Understanding Permamind's Architecture

Permamind is a decentralized registry for Claude Code agent skills, built on Arweave and AO networks. This guide explains how the system works and why permanent, decentralized storage matters for AI agent capabilities.

## What is Permamind?

Permamind is **npm for Claude Code skills** - but instead of a centralized server, it uses:

- **Arweave Network**: Permanent storage for skill bundles (immutable, pay-once-store-forever)
- **AO Network**: Decentralized compute for the registry index (queryable, mutable metadata)
- **Claude Code Skills**: Agent capabilities that extend Claude's expertise

### Why Decentralized?

Traditional registries (npm, PyPI) have issues:
- ❌ Packages can be unpublished (breaks dependencies)
- ❌ Central servers can go down
- ❌ Censorship risks
- ❌ Ongoing hosting costs

Permamind solves this with **permanent decentralized storage**.

## Architecture Overview

### Three-Layer System

```
┌────────────────────────────────────────────────┐
│    CLI / MCP Server (Client Layer)            │
│    • Publish skills                            │
│    • Search registry                           │
│    • Install skills                            │
└────────────────┬───────────────────────────────┘
                 │
        ─────────┼──────────────
        │                      │
        ▼                      ▼
┌──────────────────┐    ┌──────────────────────┐
│ AO Registry      │    │ Arweave Network      │
│ (Mutable Index)  │    │ (Immutable Storage)  │
│                  │    │                      │
│ • Metadata       │◄───│ • Skill bundles      │
│ • Search queries │TXID│ • Permanent files    │
│ • Versions       │ref │ • Content addressing │
└──────────────────┘    └──────────────────────┘
```

### Layer 1: Arweave Network (Storage)

**Purpose**: Permanent, immutable storage for skill bundles

**What gets stored:**
- SKILL.md file
- Bundled resources
- Dependencies manifest
- All compressed into tar.gz

**Key benefits:**
- ✅ Pay once, store forever (no monthly fees)
- ✅ Content-addressed (TXID is cryptographic hash)
- ✅ Cannot be deleted or modified
- ✅ Global CDN-like distribution

**Example:**
```bash
# Upload creates permanent TXID
skills publish my-skill
# Returns: QmX7K... (permanent Arweave transaction ID)
```

### Layer 2: AO Registry Process (Index)

**Purpose**: Mutable index for fast skill search and discovery

**What it does:**
- Maintains searchable skill metadata
- Tracks versions and dependencies
- Handles search queries
- References Arweave TXIDs for bundle downloads

**Why AO (not just Arweave)?**
- Arweave = immutable (can't update search index)
- AO = mutable state + decentralized compute
- Perfect for registry that needs updates

**Code example:**
```lua
-- AO process handler (simplified)
Handlers.add("search",
  Handlers.utils.hasMatchingTag("Action", "Search"),
  function(msg)
    local query = msg.Query or ""
    local results = {}

    -- Filter skills by query
    for name, skill in pairs(Skills) do
      if matchesSearch(skill, query) then
        table.insert(results, skill)
      end
    end

    -- Return results to caller
    ao.send({
      Target = msg.From,
      Data = json.encode(results)
    })
  end
)
```

### Layer 3: CLI & MCP Server (Clients)

**Purpose**: User-friendly interfaces to publish, search, and install skills

**Two interfaces:**

**CLI Tool** (`@permamind/skills`)
- Command-line interface
- Perfect for CI/CD automation
- Direct terminal usage

**MCP Server** (`@permamind/mcp-server`)
- Integrates with Claude Desktop
- Natural language interface
- Conversational skill management

## How Publishing Works

### Step-by-Step Process

**1. Create Skill Bundle**
```bash
# CLI reads SKILL.md and bundles files
skills publish
```

**2. Upload to Arweave**
```typescript
// Bundle uploaded to Arweave (permanent)
const tx = await arweave.createTransaction({ data: bundle });
await arweave.transactions.sign(tx, wallet);
await arweave.transactions.post(tx);
// Returns permanent TXID
```

**3. Register in AO Process**
```typescript
// Send metadata to AO registry
await ao.message({
  process: REGISTRY_PROCESS_ID,
  tags: [
    { name: 'Action', value: 'Register' },
    { name: 'Skill-Name', value: 'my-skill' },
    { name: 'Version', value: '1.0.0' },
    { name: 'Bundle-TXID', value: txId },
  ]
});
```

**4. AO Process Stores Metadata**
```lua
-- AO handler validates and stores
Skills[skillName] = {
  name = skillName,
  version = version,
  bundleTxId = bundleTxId,
  author = msg.From,
  timestamp = msg.Timestamp
}
```

### Publishing Data Flow

The publishing process involves four steps:

**Step 1: Bundle Creation**
```
Developer ──> CLI: skills publish
              CLI: Creates bundle.tar.gz from SKILL.md + files
```

**Step 2: Permanent Storage**
```
CLI ──> Arweave: Upload bundle.tar.gz
Arweave ──> CLI: Return TXID (permanent address)
```

**Step 3: Registry Update**
```
CLI ──> AO Registry: Register(name, version, TXID)
AO Registry: Store metadata in searchable index
```

**Step 4: Confirmation**
```
AO Registry ──> CLI: Confirmation message
CLI ──> Developer: Success! Skill published
```

**Visual Flow:**
```
┌──────────┐     ┌─────┐     ┌─────────┐     ┌────────────┐
│Developer │────>│ CLI │────>│ Arweave │     │AO Registry │
└──────────┘     └─────┘     └─────────┘     └────────────┘
                    │              │                │
                    │         Upload bundle         │
                    │◄────────────┤                 │
                    │         Return TXID            │
                    │                                │
                    │      Register metadata         │
                    ├───────────────────────────────>│
                    │                                │
                    │         Confirmation           │
                    │◄───────────────────────────────┤
```

## How Discovery Works

### Search Flow

**1. User searches:**
```bash
skills search "arweave development"
```

**2. CLI queries AO process:**
```typescript
const results = await ao.dryrun({
  process: REGISTRY_PROCESS_ID,
  tags: [
    { name: 'Action', value: 'Search' },
    { name: 'Query', value: 'arweave development' },
  ]
});
```

**3. AO process filters:**
```lua
-- Match query against skill metadata
for _, skill in ipairs(Skills) do
  if skill.description:match(query) or
     hasMatchingTag(skill.tags, query) then
    table.insert(results, skill)
  end
end
```

**4. Results displayed:**
```
┌─────────────────────────────────────────┐
│ arweave-fundamentals v1.2.0             │
│ Learn Arweave basics and upload files   │
│ Tags: arweave, tutorials                │
└─────────────────────────────────────────┘
```

## How Installation Works

### Download & Install Flow

**1. Fetch metadata from AO:**
```typescript
// Get skill info including TXID
const skill = await registry.getSkill('skill-name');
```

**2. Download bundle from Arweave:**
```typescript
// Fetch by TXID (permanent address)
const bundle = await fetch(
  `https://arweave.net/${skill.bundleTxId}`
);
```

**3. Extract to local directory:**
```bash
# Unpack to ~/.claude/skills/skill-name/
tar -xzf bundle.tar.gz -C ~/.claude/skills/
```

**4. Resolve dependencies:**
```typescript
// Recursively install dependencies
for (const dep of skill.dependencies) {
  await installSkill(dep);
}
```

## Why This Architecture?

### Benefits of Arweave + AO

| Aspect | Traditional Registry | Permamind |
|--------|---------------------|-----------|
| **Storage** | Monthly hosting fees | Pay once, permanent |
| **Availability** | Server can go down | Always available |
| **Unpublish** | Can break dependencies | Impossible to unpublish |
| **Censorship** | Central authority | Censorship-resistant |
| **Search** | Fast (SQL database) | Fast (AO Lua tables) |
| **Updates** | Easy (just upload) | Easy (AO state updates) |

### Trade-offs

**Pros:**
- ✅ Permanent availability
- ✅ No monthly costs after upload
- ✅ Censorship-resistant
- ✅ Cryptographically verifiable

**Cons:**
- ⚠️ Initial AR token cost for upload (one-time)
- ⚠️ Cannot unpublish mistakes (publish carefully!)
- ⚠️ Download speed varies by Arweave gateway

## Developer Resources

### Build Your Own

Want to build on Permamind's architecture?

**Arweave Resources:**
- [Arweave.org](https://arweave.org) - Main documentation
- [ArDrive](https://ardrive.io) - File storage examples
- [Arweave JS SDK](https://github.com/ArweaveTeam/arweave-js)

**AO Resources:**
- [AO Cookbook](https://cookbook_ao.arweave.dev) - Tutorials
- [AO Connect](https://github.com/permaweb/aoconnect) - Client SDK
- [AO Process Examples](https://github.com/permaweb/aos)

**Permamind Codebase:**
- [GitHub Repository](https://github.com/ALLiDoizCode/Permamind)
- [CLI Source](https://github.com/ALLiDoizCode/Permamind/tree/main/cli)
- [AO Registry Process](https://github.com/ALLiDoizCode/Permamind/tree/main/ao-process)

## Next Steps

Now that you understand the architecture:

1. **Try the CLI**: Install and publish your first skill
2. **Explore the registry**: Search for skills by topic
3. **Check the code**: Review the open-source implementation
4. **Join discussions**: [Discord community](https://discord.gg/permamind)

Building on permanent infrastructure opens new possibilities for AI agent capabilities! 🚀

---

**Technical Stack:**
- Storage: Arweave Network (permanent)
- Compute: AO Network (decentralized)
- Client: TypeScript CLI + MCP Server
- Skills: Claude Code agent capabilities

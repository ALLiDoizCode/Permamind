# Database Schema

## 1. AO Registry Process State (Lua Tables)

**Storage Type:** In-memory Lua tables persisted by AO process runtime

**Schema Definition:**

```lua
-- Global registry state
Skills = {}

-- Example entry
Skills["ao-basics"] = {
  name = "ao-basics",
  version = "1.0.0",
  description = "AO protocol fundamentals",
  author = "John Doe",
  owner = "abc123...xyz789",  -- Arweave address from msg.From
  tags = {"ao", "blockchain", "tutorial"},
  arweaveTxId = "def456...uvw012",
  dependencies = {"arweave-fundamentals"},
  publishedAt = 1234567890,
  updatedAt = 1234567890
}
```

**Constraints:**
- Primary key: `name` (unique)
- Ownership: `owner` field immutable after registration
- Version enforcement: Updates require `version > current version`

**Access Patterns:**
- Register/Update: `Skills[msg.Name] = { ... }` (O(1))
- Get: `return Skills[msg.Name]` (O(1))
- Search: Iterate all entries, filter by query (O(n))

## 2. Arweave Permanent Storage

**Transaction Tags:**
```json
{
  "tags": [
    { "name": "App-Name", "value": "Agent-Skills-Registry" },
    { "name": "Content-Type", "value": "application/x-tar+gzip" },
    { "name": "Skill-Name", "value": "ao-basics" },
    { "name": "Skill-Version", "value": "1.0.0" }
  ],
  "data": "<binary tar.gz bundle>"
}
```

**Bundle Contents:**
```
skill-name.tar.gz
├── SKILL.md
├── resources/
│   ├── examples/
│   └── templates/
└── README.md
```

## 3. Local Lock File (JSON)

**File Location:** `~/.claude/skills-lock.json` or `./.claude/skills-lock.json`

**Schema:**
```json
{
  "lockfileVersion": 1,
  "generatedAt": 1234567890,
  "installLocation": "/Users/john/.claude/skills",
  "skills": [
    {
      "name": "permamind-integration",
      "version": "1.0.0",
      "arweaveTxId": "abc123...def789",
      "installedAt": 1234567890,
      "installedPath": "/Users/john/.claude/skills/permamind-integration",
      "isDirectDependency": true,
      "dependencies": [
        {
          "name": "ao-basics",
          "version": "1.0.0",
          "arweaveTxId": "xyz456...uvw012",
          "installedAt": 1234567889,
          "installedPath": "/Users/john/.claude/skills/ao-basics",
          "isDirectDependency": false,
          "dependencies": []
        }
      ]
    }
  ]
}
```

---

# HTTP Access Guide for Skills Registry

## Overview

The Skills Registry exposes state and query functions via HyperBEAM's HTTP paths, bypassing CU gateway dryrun limitations.

## Prerequisites

1. Registry must be loaded into AO process
2. Global variables and functions defined
3. HyperBEAM node access (e.g., forward.computer)

## Access Patterns

### 1. Direct State Access

Access the raw Skills table:

```bash
GET https://forward.computer/{process-id}/~process@1.0/compute/Skills
```

**Returns:** Complete Skills table with version history in JSON format

```json
{
  "skill-name": {
    "latest": "1.0.2",
    "versions": {
      "1.0.0": {...},
      "1.0.1": {...},
      "1.0.2": {...}
    }
  }
}
```

### 2. Function Calls with ~message@1.0

Call global functions with parameters using the ~message@1.0 device:

#### Search Skills

```bash
# Search for "ao" skills
GET /{process-id}/~message@1.0&query="ao"/searchSkills

# List all skills (empty query)
GET /{process-id}/~message@1.0&query=""/searchSkills
```

**Returns:** Array of matching skills (latest versions)

#### Get Specific Skill

```bash
# Get latest version
GET /{process-id}/~message@1.0&name="ao"/getSkill

# Get specific version
GET /{process-id}/~message@1.0&name="ao"&version="1.0.0"/getSkill
```

**Returns:** Skill metadata or error object

#### List Versions

```bash
# List all versions of a skill
GET /{process-id}/~message@1.0&name="ao"/listVersions
```

**Returns:**
```json
{
  "name": "ao",
  "latest": "1.0.2",
  "versions": ["1.0.0", "1.0.1", "1.0.2"]
}
```

### 3. Advanced Query Parameter Types

Use HyperBEAM's type casting syntax for complex parameters:

```bash
# String parameter (default)
&query="ao"

# Integer parameter
&limit+integer=20

# List parameter
&tags+list="ao","tutorial"

# Map parameter
&filters+map=author="Permamind";minVersion="1.0.0"
```

## Complete Examples

### Example 1: Search Registry

```bash
# Using forward.computer node
curl "https://forward.computer/RMIivqgsdvZobdv6ekkPIicDmX-925VcnivRzRFv_TQ/~message@1.0&query=\"ao\"/searchSkills"

# Expected response: Array of skills matching "ao"
[
  {
    "name": "ao",
    "version": "1.0.2",
    "description": "Learn AO protocol fundamentals...",
    "author": "Permamind Team",
    ...
  }
]
```

### Example 2: Get Skill with Version

```bash
curl "https://forward.computer/RMIivqgsdvZobdv6ekkPIicDmX-925VcnivRzRFv_TQ/~message@1.0&name=\"ao\"&version=\"1.0.0\"/getSkill"

# Expected response: Specific version metadata
{
  "name": "ao",
  "version": "1.0.0",
  "arweaveTxId": "...",
  ...
}
```

### Example 3: Raw State Access

```bash
curl "https://forward.computer/RMIivqgsdvZobdv6ekkPIicDmX-925VcnivRzRFv_TQ/~process@1.0/compute/Skills"

# Expected response: Full registry structure
{
  "ao": {
    "latest": "1.0.2",
    "versions": {...}
  },
  "skill-creator": {
    "latest": "1.0.0",
    "versions": {...}
  }
}
```

## Testing Checklist

After deploying the registry, verify each endpoint:

```bash
# Set your process ID
PROCESS_ID="RMIivqgsdvZobdv6ekkPIicDmX-925VcnivRzRFv_TQ"
BASE_URL="https://forward.computer"

# Test 1: Raw state access
curl "$BASE_URL/$PROCESS_ID/~process@1.0/compute/Skills"

# Test 2: Search all skills
curl "$BASE_URL/$PROCESS_ID/~message@1.0&query=\"\"/searchSkills"

# Test 3: Search specific query
curl "$BASE_URL/$PROCESS_ID/~message@1.0&query=\"ao\"/searchSkills"

# Test 4: Get skill (latest)
curl "$BASE_URL/$PROCESS_ID/~message@1.0&name=\"ao\"/getSkill"

# Test 5: Get skill (specific version)
curl "$BASE_URL/$PROCESS_ID/~message@1.0&name=\"ao\"&version=\"1.0.0\"/getSkill"

# Test 6: List versions
curl "$BASE_URL/$PROCESS_ID/~message@1.0&name=\"ao\"/listVersions"
```

## Troubleshooting

### Error: "Insufficient funds"

**Issue:** The HyperBEAM node requires payment for compute

**Solution:**
- Use a different HyperBEAM node
- Run your own node
- Wait for free public nodes

### Error: 404 or empty response

**Issue:** Process not initialized or state not loaded

**Solution:**
- Verify registry.lua was loaded: check for "Agent Skills Registry process initialized" in process logs
- Ensure Skills table has data (publish a skill first)

### Function returns undefined

**Issue:** Function not in global scope

**Solution:**
- Ensure functions are defined WITHOUT `local` keyword
- Check function names match exactly (case-sensitive)

## Integration with CLI

The CLI can be updated to use HTTP as a fallback:

```typescript
// Try dryrun first
try {
  return await dryrun({...});
} catch (error) {
  // Fallback to HTTP
  const response = await fetch(
    `https://forward.computer/${processId}/~message@1.0&query="${query}"/searchSkills`
  );
  return await response.json();
}
```

## Benefits

✅ **No CU dependency** - Direct HyperBEAM access
✅ **Instant responses** - No message processing delay
✅ **Standard HTTP** - Works with any HTTP client
✅ **Cacheable** - HTTP caching works naturally
✅ **Web-friendly** - CORS, REST patterns

## Limitations

⚠️ **Read-only** - HTTP paths only for queries, not mutations
⚠️ **Node dependency** - Requires HyperBEAM node access
⚠️ **Payment** - Some nodes require payment
⚠️ **Function parameters** - Limited to URL-encodable types

For write operations (Register-Skill, Update-Skill), continue using AO messages.

---

**Last Updated:** 2025-10-23
**Registry Version:** 2.0.0
**Process ID:** RMIivqgsdvZobdv6ekkPIicDmX-925VcnivRzRFv_TQ

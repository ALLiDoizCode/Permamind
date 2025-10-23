# Deploy Registry v2.0.0

## Process Information

**Process ID:** `dE0LBSaQ5dCQkemxUr0fYwybDT-GR9RvmfteKHgTCxw`

**Created:** 2025-10-23

**Status:** Empty process (code needs to be loaded)

## Deployment Instructions

### Method 1: Using aos CLI (Recommended)

```bash
# Connect to the process
aos --process-id dE0LBSaQ5dCQkemxUr0fYwybDT-GR9RvmfteKHgTCxw

# Load the registry code
.load ao-process/registry.lua

# You should see:
# Agent Skills Registry process initialized (ADP v1.0 compliant)
```

### Method 2: Verify Handlers Loaded

```lua
-- In aos, check handlers
Handlers.list

-- Should show:
-- info
-- register-skill
-- update-skill
-- search-skills
-- list-skills
-- get-skill-versions
-- get-skill
```

### Method 3: Test Registry

```lua
-- Send Info query
Send({Target = ao.id, Action = "Info"})

-- Check Skills table
Skills

-- Should be empty {} initially
```

## Post-Deployment

### 1. Update Configuration

Update `.skillsrc` in your project:

```json
{
  "wallet": "wallet.json",
  "registry": "dE0LBSaQ5dCQkemxUr0fYwybDT-GR9RvmfteKHgTCxw",
  "gateway": "https://arweave.net"
}
```

Update global `~/.skillsrc`:

```json
{
  "wallet": "~/.aos.json",
  "gateway": "https://arweave.net",
  "registry": "dE0LBSaQ5dCQkemxUr0fYwybDT-GR9RvmfteKHgTCxw"
}
```

### 2. Publish Skills

```bash
# Publish skill-creator
skills publish skills/skill-creator --verbose

# Publish ao
skills publish skills/ao --verbose

# Verify
skills search skill
```

### 3. Test Version History

```bash
# Publish v1.0.0
skills publish skills/test-skill

# Update version in SKILL.md to 1.0.1
# Publish again
skills publish skills/test-skill

# Both versions should be stored in registry
```

## Verification Tests

### Test Message Handlers

```bash
# Using Permamind
mcp://permamind/send {
  "processId": "dE0LBSaQ5dCQkemxUr0fYwybDT-GR9RvmfteKHgTCxw",
  "action": "Info"
}

# Should return Info-Response message
```

### Test Search

```bash
# After publishing skills
skills search ao
```

### Test Install

```bash
# Install latest
skills install skill-creator

# Install specific version
skills install ao@1.0.0
```

## Registry Features

Once deployed, the registry supports:

✅ **Version History**
- Multiple versions per skill
- Get specific versions
- List all versions

✅ **Pagination**
- List-Skills with limit/offset
- Max 100 per page

✅ **Filtering**
- By author
- By tags (must have ALL)
- By name pattern

✅ **ADP v1.0 Compliant**
- Self-documenting Info handler
- Standard message schemas

## Troubleshooting

### Issue: Handlers not loaded

**Symptom:** Queries return HTML errors or "Handler not found"

**Solution:**
```bash
# Reconnect to process
aos --process-id dE0LBSaQ5dCQkemxUr0fYwybDT-GR9RvmfteKHgTCxw

# Reload registry
.load ao-process/registry.lua

# Verify
Handlers.list
```

### Issue: CU gateway HTML errors

**Symptom:** Dryrun queries fail with HTML responses

**Solution:**
- This is a known AO infrastructure issue
- Publishing works (uses message, not dryrun)
- Search/Install may be intermittent
- CLI retries automatically (3 attempts, 8s delays)

### Issue: Skills not persisting

**Symptom:** Skills disappear after reload

**Solution:**
- Skills are stored in process memory
- They persist as long as process is running
- Re-publishing adds them back if lost

## Success Criteria

After deployment, verify:

- [ ] `Handlers.list` shows 7 handlers
- [ ] `Skills` table exists (empty initially)
- [ ] Info handler responds with metadata
- [ ] Publishing a skill works
- [ ] Skill appears in Skills table
- [ ] Search finds the skill (may timeout due to CU)

## File Information

**Source:** `ao-process/registry.lua`
**Size:** 21KB (740 lines)
**Version:** 2.0.0
**Tests:** 36+ passing (run with `lua ao-process/tests/run-all.lua`)

---

**Process ID:** dE0LBSaQ5dCQkemxUr0fYwybDT-GR9RvmfteKHgTCxw
**Ready for:** aos deployment

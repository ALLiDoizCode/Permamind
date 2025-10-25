# Story 4.1 - Configuration and Deployment Guide

This guide will help you complete Tasks 17-18 (Publish and Install testing).

## Current Status

✅ **Completed (Tasks 1-16)**:
- Created `skills/ao/SKILL.md` with comprehensive AO protocol content
- All quality validations passed
- Content ready for publishing

⏳ **Remaining (Tasks 17-18)**:
- Publish skill to Arweave and AO Registry
- Test installation workflow

---

## Prerequisites

1. **12-word seed phrase** (you indicated you have this) ✅
2. **AR tokens** in your wallet (for transaction fees)
   - Check balance after setup
   - If needed, obtain AR tokens from exchange
3. **AO Registry Process** (needs deployment)

---

## Step-by-Step Setup

### Step 1: Set Up Seed Phrase Environment Variable

**IMPORTANT**: Do NOT add your seed phrase to the `.env` file. Set it as a shell environment variable instead.

In your terminal, run:

```bash
# Set seed phrase for current session (replace with your actual phrase)
export SEED_PHRASE="your twelve word seed phrase goes here"

# Verify it's set (should show your phrase)
echo $SEED_PHRASE
```

To make it permanent (add to your shell profile):

```bash
# For zsh (macOS default)
echo 'export SEED_PHRASE="your twelve word seed phrase goes here"' >> ~/.zshrc
source ~/.zshrc

# For bash
echo 'export SEED_PHRASE="your twelve word seed phrase goes here"' >> ~/.bashrc
source ~/.bashrc
```

### Step 2: Check Your Wallet Address and Balance

Once SEED_PHRASE is set, you can use Permamind MCP to check your wallet:

```javascript
// In Claude Code, run this MCP command:
mcp__permamind__read({
  action: "Balance",
  processId: "YOUR_WALLET_ADDRESS"
})
```

Or check manually at: https://viewblock.io/arweave

**Minimum AR needed**: ~0.01 AR for skill publishing (varies by file size)

---

### Step 3: Deploy AO Registry Process

Now we'll deploy the registry using Permamind MCP. The registry code is ready at `ao-process/registry.lua`.

#### 3a. Read the registry.lua file

```bash
# From project root
cat ao-process/registry.lua
```

#### 3b. Use Permamind to spawn and deploy

I'll help you with this using MCP commands. The process:

1. Spawn empty AO process → Get Process ID
2. Eval `registry.lua` code → Deploy handlers
3. Test Info handler → Verify deployment
4. Save Process ID to `.env` file

**Ready to proceed?** Let me know and I'll execute the Permamind MCP commands for you.

---

### Step 4: Publish the Skill

Once registry is deployed and `.env` is configured:

```bash
# Navigate to project root
cd /Users/jonathangreen/Documents/Permamind

# Publish the ao skill
node cli/dist/index.js publish skills/ao
```

Expected output:
```
✓ Parsing manifest from skills/ao/SKILL.md
✓ Validating skill metadata
✓ Creating bundle tarball
✓ Uploading to Arweave...
  Bundle TXID: abc123def456...
✓ Registering in AO registry...
  Registry confirmed

Skill 'ao' v1.0.0 published successfully!
```

---

### Step 5: Test Installation

```bash
# Install the published skill
node cli/dist/index.js install ao
```

Expected output:
```
✓ Querying AO registry for skill 'ao'
✓ Found: ao v1.0.0 by Permamind Team
✓ Downloading bundle from Arweave...
✓ Extracting to ~/.claude/skills/ao/
✓ Updating skills-lock.json

Skill 'ao' v1.0.0 installed successfully!
```

---

## Troubleshooting

### Issue: "SEED_PHRASE not set"

**Solution**: Export the environment variable in your current shell:
```bash
export SEED_PHRASE="your twelve word phrase here"
```

### Issue: "Insufficient funds"

**Solution**:
1. Check wallet balance with Permamind MCP
2. Send AR tokens to your wallet address
3. Wait for confirmation (~2 minutes)
4. Retry publish command

### Issue: "AO_REGISTRY_PROCESS_ID not set"

**Solution**:
1. Complete Step 3 (Deploy Registry Process)
2. Copy the 43-character process ID
3. Add to `.env` file:
   ```
   AO_REGISTRY_PROCESS_ID=abc123...xyz789
   ```

### Issue: "Registry process not responding"

**Solution**:
1. Verify process ID is correct
2. Test Info handler with Permamind MCP
3. Check AO network status
4. Redeploy registry if needed

---

## Quick Reference: Permamind MCP Commands

### Spawn AO Process
```javascript
mcp__permamind__spawnProcess({})
```

### Deploy Registry Code
```javascript
mcp__permamind__evalProcess({
  processId: "PROCESS_ID_FROM_SPAWN",
  code: "CONTENTS_OF_registry.lua"
})
```

### Test Info Handler
```javascript
mcp__permamind__read({
  action: "Info",
  processId: "YOUR_REGISTRY_PROCESS_ID"
})
```

---

## Next Steps

1. **Set SEED_PHRASE environment variable** (Step 1)
2. **Let me know you're ready** - I'll execute Steps 2-3 (deploy registry) using MCP
3. **Run publish command** (Step 4)
4. **Run install command** (Step 5)
5. **Story 4.1 complete!** ✅

---

## Security Notes

- ⚠️ **Never commit** `.env` file with real values to git
- ⚠️ **Never share** your seed phrase or wallet private keys
- ⚠️ **Keep backups** of your seed phrase in a secure location
- ✅ `.env` is already in `.gitignore` for this project

---

**Questions?** Let me know which step you'd like help with!

# Troubleshooting Guide

This guide provides solutions for common errors encountered when using the Agent Skills CLI.

## Table of Contents

- [Understanding Error Messages](#understanding-error-messages)
- [Validation Errors](#validation-errors)
- [Network Errors](#network-errors)
- [Configuration Errors](#configuration-errors)
- [Authorization Errors](#authorization-errors)
- [Dependency Errors](#dependency-errors)
- [File System Errors](#file-system-errors)
- [Getting Help](#getting-help)

## Understanding Error Messages

All errors follow this format:

```
[ErrorType] Problem description. -> Solution: Action to take.
```

**Components:**
- **[ErrorType]**: Type of error (ValidationError, NetworkError, etc.)
- **Problem description**: What went wrong
- **-> Solution**: Specific actions you can take to fix the issue

**Verbose Mode:**

For detailed debugging information including stack traces, use the `--verbose` flag:

```bash
skills publish ./my-skill --verbose
```

This outputs structured JSON with:
- Correlation ID for tracking
- Full stack traces
- Error metadata
- Service context

## Validation Errors

Validation errors occur when your skill manifest doesn't meet the required format.

### Invalid Skill Name

**Error Message:**
```
[ValidationError] Skill name contains uppercase letters. -> Solution: Use only lowercase letters, numbers, and hyphens in skill name.
```

**What Happened:**
Your skill name contains uppercase letters, which are not allowed.

**Common Causes:**
- Using capital letters: "My-Skill"
- Using spaces: "my skill"
- Using special characters: "my_skill!"

**How to Fix:**
1. Open your `SKILL.md` file
2. Change the `name` field in the YAML frontmatter to use only lowercase letters, numbers, and hyphens
3. Valid examples: `my-skill`, `ao-basics`, `arweave-101`

**Example:**
```yaml
---
name: ao-basics  # ✓ Correct
# name: AO-Basics  # ✗ Incorrect (uppercase)
version: 1.0.0
description: Learn AO fundamentals
---
```

### Missing Required Fields

**Error Message:**
```
[ValidationError] SKILL.md validation failed: name is required. -> Solution: Fix the validation errors in your SKILL.md frontmatter
```

**What Happened:**
Your skill manifest is missing required fields.

**Required Fields:**
- `name`: Skill name (lowercase, alphanumeric, hyphens)
- `version`: Semantic version (e.g., "1.0.0")
- `description`: Brief description (max 1024 characters)

**How to Fix:**
1. Open your `SKILL.md` file
2. Add all required fields to the YAML frontmatter
3. Ensure each field has a valid value

**Example:**
```yaml
---
name: my-skill
version: 1.0.0
description: A helpful skill for Claude
author: Your Name
tags:
  - tutorial
  - example
---
```

### Invalid Version Format

**Error Message:**
```
[ValidationError] Version must follow semantic versioning (e.g., 1.0.0). -> Solution: Update version to use format MAJOR.MINOR.PATCH
```

**What Happened:**
The version field doesn't follow semantic versioning format.

**Valid Formats:**
- `1.0.0` ✓
- `2.1.3` ✓
- `0.1.0-beta` ✓

**Invalid Formats:**
- `1.0` ✗ (missing patch)
- `v1.0.0` ✗ (extra 'v')
- `latest` ✗ (not a version number)

**How to Fix:**
Update the `version` field to use `MAJOR.MINOR.PATCH` format:

```yaml
---
version: 1.0.0  # ✓ Correct
---
```

### Description Too Long

**Error Message:**
```
[ValidationError] Description exceeds maximum length (1024 characters). -> Solution: Shorten description to under 1024 characters
```

**What Happened:**
Your skill description is too long.

**How to Fix:**
1. Edit `SKILL.md` frontmatter
2. Reduce description to under 1024 characters
3. Move detailed content into the skill body (after frontmatter)

### Directory Not Found

**Error Message:**
```
[ValidationError] Directory not found: ./my-skill. -> Solution: Ensure the skill directory exists and the path is correct. Run 'skills publish ./my-skill' from the parent directory
```

**What Happened:**
The CLI cannot find the skill directory you specified.

**How to Fix:**
1. Verify the directory path is correct
2. Check you're running the command from the correct location
3. Use `ls` to list directories and confirm the skill directory exists

**Example:**
```bash
# Check current directory
pwd

# List directories
ls

# Navigate to parent directory if needed
cd ..

# Publish from correct location
skills publish ./my-skill
```

### SKILL.md Not Found

**Error Message:**
```
[ValidationError] SKILL.md not found in ./my-skill. -> Solution: Create a SKILL.md file with YAML frontmatter. See https://github.com/anthropics/agent-skills for manifest format
```

**What Happened:**
The skill directory doesn't contain a `SKILL.md` file.

**How to Fix:**
1. Create a `SKILL.md` file in your skill directory
2. Add YAML frontmatter with required fields
3. Add skill content after the frontmatter

**Example:**
```markdown
---
name: my-skill
version: 1.0.0
description: A helpful skill
---

# My Skill

This skill helps with...
```

## Network Errors

Network errors occur when there are connectivity issues or gateway problems.

### Upload Timeout

**Error Message:**
```
[NetworkError] Upload timeout after 60 seconds. -> Solution: Check your internet connection and try again. If the issue persists, try a different gateway using --gateway flag
```

**What Happened:**
The upload to Arweave took longer than 60 seconds and timed out.

**Common Causes:**
- Slow internet connection
- Large skill bundle (>10MB)
- Congested Arweave gateway
- Network interruption

**How to Fix:**

**Option 1: Check Internet Connection**
```bash
# Test connection
ping arweave.net

# Check download speed
curl -o /dev/null -s -w 'Speed: %{speed_download}\n' https://arweave.net
```

**Option 2: Reduce Bundle Size**
```bash
# Check bundle size
du -sh ./my-skill

# Remove unnecessary files
# Add to .gitignore: node_modules/, *.log, .DS_Store
```

**Option 3: Try Different Gateway**
```bash
skills publish ./my-skill --gateway https://g8way.io
```

**Option 4: Retry**
```bash
# Network issues are often temporary
skills publish ./my-skill
```

### Download Timeout

**Error Message:**
```
[NetworkError] Download timeout after 30 seconds. -> Solution: Check your internet connection and try again. If the issue persists, try a different gateway using --gateway flag
```

**What Happened:**
Downloading a skill bundle from Arweave took longer than 30 seconds.

**How to Fix:**
Same troubleshooting steps as upload timeout (above).

### Gateway Unavailable

**Error Message:**
```
[NetworkError] Gateway unavailable (https://arweave.net returned 502). -> Solution: Try an alternative gateway: --gateway https://g8way.io
```

**What Happened:**
The Arweave gateway is experiencing issues (502, 503, or other server errors).

**HTTP Status Codes:**
- **502 Bad Gateway**: Gateway issue, temporary
- **503 Service Unavailable**: Gateway overloaded or maintenance
- **500 Internal Server Error**: Gateway server issue

**How to Fix:**

**Option 1: Try Alternative Gateway**
```bash
skills publish ./my-skill --gateway https://g8way.io
```

**Option 2: Wait and Retry**
```bash
# Wait 2-5 minutes for gateway recovery
sleep 120

# Retry command
skills publish ./my-skill
```

**Option 3: Configure Default Gateway**
Add to `.skillsrc`:
```json
{
  "gateway": "https://g8way.io"
}
```

### Bundle Not Found (404)

**Error Message:**
```
[NetworkError] Bundle not found (TXID: abc123...xyz789). -> Solution: Verify transaction ID or wait for network propagation
```

**What Happened:**
The requested bundle transaction ID doesn't exist on Arweave.

**Common Causes:**
- Invalid or incorrect transaction ID
- Transaction not yet confirmed (needs 2-5 minutes)
- Using wrong gateway (transaction not propagated yet)

**How to Fix:**

**Option 1: Verify Transaction ID**
```bash
# Check transaction on arweave.net
https://arweave.net/[YOUR_TX_ID]
```

**Option 2: Wait for Confirmation**
```bash
# Transactions need 2-5 minutes to confirm
# Wait and retry
sleep 300  # 5 minutes
skills install my-skill
```

**Option 3: Try Different Gateway**
```bash
skills install my-skill --gateway https://g8way.io
```

### Connection Failure

**Error Message:**
```
[NetworkError] Failed to check wallet balance. -> Solution: Verify network connection and try again
```

**What Happened:**
Cannot connect to Arweave network.

**Common Causes:**
- No internet connection
- Firewall blocking Arweave gateway
- DNS resolution failure
- Gateway down

**How to Fix:**

**Step 1: Check Internet Connection**
```bash
# Test basic connectivity
ping 8.8.8.8

# Test DNS resolution
nslookup arweave.net
```

**Step 2: Check Firewall**
```bash
# Try HTTPS connection
curl -I https://arweave.net
```

**Step 3: Try Different Gateway**
```bash
skills publish ./my-skill --gateway https://g8way.io
```

## Configuration Errors

Configuration errors occur when required configuration is missing or invalid.

### Wallet Not Configured

**Error Message:**
```
[ConfigurationError] Wallet not configured. -> Solution: Provide wallet path with --wallet flag or add "wallet" field to .skillsrc
```

**What Happened:**
The CLI doesn't know which wallet to use for transactions.

**How to Fix:**

**Option 1: Use --wallet Flag**
```bash
skills publish ./my-skill --wallet ~/arweave-wallet.json
```

**Option 2: Configure in .skillsrc**
Create/edit `.skillsrc` in your home directory or project:
```json
{
  "wallet": "~/arweave-wallet.json"
}
```

**Option 3: Set Environment Variable**
```bash
export WALLET_PATH=~/arweave-wallet.json
skills publish ./my-skill
```

### Registry Process Not Configured

**Error Message:**
```
[ConfigurationError] AO Registry Process ID not configured. -> Solution: Set AO_REGISTRY_PROCESS_ID environment variable or add "registry" field to .skillsrc
```

**What Happened:**
The AO Registry Process ID is not configured.

**How to Fix:**

**Option 1: Set Environment Variable**
```bash
export AO_REGISTRY_PROCESS_ID=<process-id>
skills search arweave
```

**Option 2: Add to .skillsrc**
```json
{
  "registry": "<process-id>"
}
```

## Authorization Errors

Authorization errors occur when wallet permissions or balance issues prevent operations.

### Insufficient Funds

**Error Message:**
```
[AuthorizationError] Insufficient funds (0.001 AR) for transaction (estimated cost: 0.01 AR). -> Solution: Add funds to wallet address abc123...xyz789
```

**What Happened:**
Your wallet doesn't have enough AR tokens to pay for the transaction.

**How to Fix:**

**Step 1: Check Current Balance**
```bash
# Use Arweave block explorer
https://viewblock.io/arweave/address/[YOUR_ADDRESS]
```

**Step 2: Add Funds**

**For Testnet:**
- Visit https://faucet.arweave.net
- Paste your wallet address
- Request testnet AR tokens

**For Mainnet:**
- Purchase AR tokens from an exchange
- Send to your wallet address
- Wait for confirmation

**Step 3: Verify and Retry**
```bash
# Retry publish
skills publish ./my-skill
```

**Estimate Costs:**
- Small bundle (<1MB): ~0.001-0.01 AR
- Medium bundle (1-5MB): ~0.01-0.05 AR
- Large bundle (5-10MB): ~0.05-0.1 AR

### Wallet File Not Found

**Error Message:**
```
[FileSystemError] Wallet file not found at ~/arweave-wallet.json. -> Solution: Verify wallet path is correct
```

**What Happened:**
The wallet file doesn't exist at the specified path.

**How to Fix:**

**Step 1: Verify Path**
```bash
# Check file exists
ls -la ~/arweave-wallet.json

# Check current directory
pwd
```

**Step 2: Use Correct Path**
```bash
# Absolute path
skills publish ./my-skill --wallet /Users/name/arweave-wallet.json

# Relative path
skills publish ./my-skill --wallet ./wallet.json
```

**Step 3: Generate Wallet (if needed)**
If you don't have a wallet, generate one using Arweave tools.

## Dependency Errors

Dependency errors occur during skill installation when dependencies cannot be resolved.

### Circular Dependency

**Error Message:**
```
[DependencyError] Circular dependency detected: skill-a -> skill-b -> skill-c -> skill-a. -> Solution: Remove circular dependencies from skill manifests
```

**What Happened:**
Skills have circular dependency references.

**Example:**
- Skill A depends on Skill B
- Skill B depends on Skill C
- Skill C depends on Skill A (circular!)

**How to Fix:**

**Step 1: Identify the Cycle**
The error message shows the dependency path.

**Step 2: Break the Cycle**
Remove or restructure dependencies to eliminate the cycle.

**Step 3: Update Manifests**
Edit `SKILL.md` frontmatter:
```yaml
---
name: skill-a
dependencies:
  # Remove circular reference
  # - skill-c  # ✗ Creates cycle
  - skill-d  # ✓ No cycle
---
```

**Step 4: Retry Installation**
```bash
skills install skill-a
```

### Missing Dependency

**Error Message:**
```
[DependencyError] Dependency 'skill-b' not found in registry. -> Solution: Verify dependency name is correct or publish the dependency first
```

**What Happened:**
A required dependency is not available in the registry.

**How to Fix:**

**Step 1: Verify Dependency Name**
```bash
# Search for the skill
skills search skill-b
```

**Step 2: Check for Typos**
Edit `SKILL.md`:
```yaml
---
dependencies:
  - ao-basics  # ✓ Correct
  # - ao-basix  # ✗ Typo
---
```

**Step 3: Publish Missing Dependency**
If the dependency should exist, publish it first:
```bash
skills publish ./skill-b
skills install skill-a
```

### Dependency Depth Limit Exceeded

**Error Message:**
```
[DependencyError] Dependency depth limit exceeded (max: 10). -> Solution: Reduce dependency nesting or simplify skill structure
```

**What Happened:**
The dependency tree is too deep (more than 10 levels).

**Example:**
```
skill-a
  -> skill-b
    -> skill-c
      -> skill-d
        ... (too many levels)
```

**How to Fix:**

**Step 1: Simplify Structure**
Reduce dependency nesting by flattening the structure.

**Step 2: Remove Unnecessary Dependencies**
Only include essential dependencies.

**Step 3: Create Composite Skills**
Combine related skills into single packages.

## File System Errors

File system errors occur when file operations fail.

### SKILL.md Not Found

**Error Message:**
```
[FileSystemError] SKILL.md not found. -> Solution: Create a SKILL.md file in the skill directory
```

**What Happened:**
The required `SKILL.md` file is missing.

**How to Fix:**
See [SKILL.md Not Found](#skillmd-not-found) in Validation Errors section.

### Permission Denied

**Error Message:**
```
[FileSystemError] Permission denied writing to /path/to/directory. -> Solution: Check directory permissions
```

**What Happened:**
The CLI cannot write to the specified directory.

**How to Fix:**

**Step 1: Check Permissions**
```bash
ls -la /path/to/directory
```

**Step 2: Fix Permissions**
```bash
# Make directory writable
chmod 755 /path/to/directory

# Or use --local flag for project installation
skills install my-skill --local
```

**Step 3: Use Different Location**
```bash
# Install globally (default)
skills install my-skill --global

# Install locally
skills install my-skill --local
```

### Disk Full

**Error Message:**
```
[FileSystemError] Insufficient disk space for installation. -> Solution: Free up disk space or use different installation directory
```

**What Happened:**
Not enough disk space to extract the skill bundle.

**How to Fix:**

**Step 1: Check Available Space**
```bash
df -h
```

**Step 2: Free Up Space**
```bash
# Remove old files
rm -rf ~/Downloads/*

# Clear npm cache
npm cache clean --force

# Remove old bundles
rm -rf ~/.cache/skills
```

**Step 3: Install to Different Location**
```bash
# Use --local flag for project directory
skills install my-skill --local
```

## Turbo SDK Upload Errors

The CLI uses Turbo SDK for free uploads of bundles < 100KB (Epic 9). Here are common Turbo SDK-related errors and solutions.

### Timeout Error

**Error Message:**
```
[NetworkError] Upload timeout after 60 seconds. -> Solution: Retry upload or check network connection.
```

**What Happened:**
The Turbo SDK upload timed out due to network latency or gateway unavailability.

**Common Causes:**
- Network latency or slow connection
- Turbo gateway temporary slowdown
- Large bundle taking longer than expected

**How to Fix:**
1. **Retry the upload** - Temporary network issues often resolve quickly
   ```bash
   skills publish ./my-skill
   ```

2. **Check your network connection**
   ```bash
   curl -I https://upload.ardrive.io
   ```

3. **Verify TURBO_GATEWAY setting** (if using custom gateway)
   ```bash
   # Check .env file
   cat .env | grep TURBO_GATEWAY
   ```

4. **Wait a few minutes** - Gateway may be experiencing high load

### Gateway Unavailable (502/503)

**Error Message:**
```
[NetworkError] Gateway returned 502 Bad Gateway. -> Solution: Retry in a few minutes or check Turbo status.
```

**What Happened:**
The Turbo gateway is temporarily unavailable or experiencing an outage.

**Common Causes:**
- Turbo gateway temporary outage
- Maintenance window
- High traffic causing temporary unavailability

**How to Fix:**
1. **Retry in a few minutes** - Most gateway issues resolve quickly
   ```bash
   # Wait 2-5 minutes, then retry
   skills publish ./my-skill
   ```

2. **Check Turbo status page** (if available)
   - Visit https://ardrive.io for service status updates

3. **Use default gateway** - Ensure you're using the default Turbo gateway
   ```bash
   # Remove custom gateway from .env if set
   # TURBO_GATEWAY=https://upload.ardrive.io  # Default (comment out or remove)
   ```

### Insufficient Credits

**Error Message:**
```
[AuthorizationError] Insufficient Turbo credits for upload. -> Solution: Check Turbo credit balance or verify bundle size.
```

**What Happened:**
Your bundle requires Turbo credits (≥ 100KB or custom configuration), but your wallet doesn't have enough credits.

**Common Causes:**
- Bundle size ≥ 100KB (requires credits or uses Arweave SDK fallback)
- `TURBO_USE_CREDITS=true` forcing credit-based uploads
- Wallet has insufficient Turbo credit balance

**How to Fix:**
1. **Verify bundle size** - Bundles < 100KB should be free
   ```bash
   # Check bundle size in publish output
   skills publish ./my-skill --verbose
   ```

2. **Check if fallback to Arweave SDK is working**
   - Bundles ≥ 100KB should automatically fallback to Arweave SDK
   - Ensure wallet has sufficient AR balance for Arweave uploads

3. **Verify TURBO_USE_CREDITS setting**
   ```bash
   # Check .env file
   cat .env | grep TURBO_USE_CREDITS
   # Should be false or not set for free tier
   ```

4. **Check Turbo credit balance** (if using credits intentionally)
   - Visit Turbo dashboard or use Turbo SDK to check balance

### Invalid Transaction ID

**Error Message:**
```
[ValidationError] Invalid transaction ID format from Turbo SDK. -> Solution: File issue on GitHub with error details.
```

**What Happened:**
Turbo SDK returned an invalid transaction ID format (should be 43-character base64url string).

**Common Causes:**
- Turbo SDK API change
- Network corruption
- Internal Turbo SDK error

**How to Fix:**
1. **Retry the upload** - May be transient error
   ```bash
   skills publish ./my-skill
   ```

2. **File issue on GitHub** with error details
   - Include full error output (`--verbose` flag)
   - Include transaction ID received (if any)
   - Include timestamp of upload

3. **Check for CLI updates**
   ```bash
   # Update to latest version
   npm install -g @permamind/skills@latest
   ```

### Custom Gateway Configuration

**When to Use TURBO_GATEWAY:**

You can override the default Turbo gateway URL for:
- Testing with alternate Turbo endpoints
- Using custom Turbo gateway infrastructure
- Development/testing environments

**Configuration Example:**
```bash
# .env file
TURBO_GATEWAY=https://custom-turbo.example.com
```

**Verification:**
```bash
# Test custom gateway connectivity
curl -I https://custom-turbo.example.com

# Publish with verbose logging to see gateway URL
skills publish ./my-skill --verbose
```

**Note:** Custom gateways must be compatible with Turbo SDK API.

## Getting Help

### Still Having Issues?

If you're still experiencing problems after trying the solutions above:

**1. Check for Known Issues**
Visit the GitHub issues page: https://github.com/YOUR_ORG/agent-skills-registry/issues

**2. Search Existing Issues**
Someone may have already reported and solved your issue.

**3. Report a New Issue**

Include:
- Error message (full text)
- Command you ran
- Operating system and version
- Node.js version (`node --version`)
- CLI version (`skills --version`)
- Verbose output (`--verbose` flag)

**4. Community Support**

- Discord: https://www.anthropic.com/discord
- GitHub Discussions: https://github.com/YOUR_ORG/agent-skills-registry/discussions

### Useful Commands

**Check CLI Version:**
```bash
skills --version
```

**Check Configuration:**
```bash
cat ~/.skillsrc
```

**View Verbose Output:**
```bash
skills publish ./my-skill --verbose
```

**Test Network Connectivity:**
```bash
curl -I https://arweave.net
```

**Check Wallet Balance:**
```bash
# Visit Arweave block explorer
https://viewblock.io/arweave
```

### Exit Codes

Understanding exit codes helps with scripting and automation:

- **0**: Success or user cancelled
- **1**: User error (validation, configuration, authorization)
- **2**: System error (network, file system, parse error)

**Example:**
```bash
skills publish ./my-skill
if [ $? -eq 0 ]; then
  echo "Success!"
elif [ $? -eq 1 ]; then
  echo "User error - check your config"
elif [ $? -eq 2 ]; then
  echo "System error - check network/disk"
fi
```

---

**Last Updated:** 2025-10-22

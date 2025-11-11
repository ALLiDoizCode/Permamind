# Configuration Guide

## Overview

The Permamind CLI and frontend applications now have **zero-configuration** setup for production use. The AO Registry process ID and network endpoints are baked directly into the packages.

## What This Means for Users

✅ **You DO NOT need to configure:**
- Registry process ID
- AO network endpoints (MU/CU)
- HyperBEAM node endpoint
- Arweave gateway

These values are pre-configured with production defaults and work out-of-the-box.

## Configuration Files

### `.skillsrc` (CLI Only)

**Minimal configuration required:**

```json
{
  "wallet": "./wallet.json",
  "gateway": "https://arweave.net"
}
```

**Fields:**
- `wallet` (optional): Path to your Arweave wallet JWK file
  - Can also be provided via `--wallet` flag
  - Will prompt if not configured
- `gateway` (optional): Arweave gateway URL
  - Default: `https://arweave.net`
- `registry` (deprecated): No longer needed, baked into package

### `.env` Files (Development Overrides Only)

Environment variables are **only needed for testing/development** if you want to:
- Test against a different registry process
- Use alternative network endpoints
- Point to custom infrastructure

## Production Defaults

These values are embedded in the packages:

| Configuration | Default Value |
|---------------|---------------|
| Registry Process ID | `afj-S1wpWK07iSs9jIttoPJsptf4Db6ubZ_CLODdEpQ` |
| MU Endpoint | `https://ur-mu.randao.net` |
| CU Endpoint | `https://ur-cu.randao.net` |
| Arweave Gateway | `https://arweave.net` |
| HyperBEAM Node | `https://hb.randao.net` |

## Environment Variable Overrides (Optional)

### CLI Package

```bash
# Only needed for testing/development
export AO_REGISTRY_PROCESS_ID="your-test-process-id"
export AO_MU_URL="https://your-mu-endpoint"
export AO_CU_URL="https://your-cu-endpoint"
export ARWEAVE_GATEWAY="https://your-gateway"
export HYPERBEAM_NODE="https://your-hyperbeam-node"
```

### Frontend Application

```bash
# Only needed for testing/development
VITE_REGISTRY_PROCESS_ID="your-test-process-id"
VITE_MU_URL="https://your-mu-endpoint"
VITE_CU_URL="https://your-cu-endpoint"
VITE_HYPERBEAM_NODE="https://your-hyperbeam-node"
```

## Migration Guide

If you have existing `.skillsrc` or `.env` files:

### 1. Remove Unnecessary Fields

**Before:**
```json
{
  "wallet": "./wallet.json",
  "registry": "afj-S1wpWK07iSs9jIttoPJsptf4Db6ubZ_CLODdEpQ",
  "gateway": "https://arweave.net"
}
```

**After:**
```json
{
  "wallet": "./wallet.json"
}
```

### 2. Clean Up .env Files

**Before:**
```bash
AO_REGISTRY_PROCESS_ID=afj-S1wpWK07iSs9jIttoPJsptf4Db6ubZ_CLODdEpQ
AO_MU_URL=https://ur-mu.randao.net
AO_CU_URL=https://ur-cu.randao.net
```

**After:**
```bash
# Delete the .env file entirely, or keep it empty
# These values are now baked into the package
```

## Benefits

### For Users
✅ Zero configuration needed
✅ Works out-of-the-box
✅ No sync issues between CLI and frontend
✅ Always points to the correct production registry

### For Developers
✅ Single source of truth for configuration
✅ Easy to update registry process ID (one place)
✅ Type-safe configuration access
✅ Override flexibility for testing

## Advanced: Custom Registry Testing

If you're developing your own registry process:

1. **Deploy your registry process** to AO
2. **Set environment variable** before running commands:

```bash
# CLI testing
export AO_REGISTRY_PROCESS_ID="your-test-process-id"
skills search "test"

# Frontend testing
echo "VITE_REGISTRY_PROCESS_ID=your-test-process-id" > .env
npm run dev
```

3. **Clean up** when done:
```bash
unset AO_REGISTRY_PROCESS_ID
rm .env
```

## Troubleshooting

### "Configuration file not found"
✅ **This is normal!** You don't need a `.skillsrc` or `.env` file for production use.

### "Registry process ID not configured"
❌ **This should never happen** with the new setup. If you see this:
1. Check you're using the latest version of the package
2. Ensure you haven't set an empty `AO_REGISTRY_PROCESS_ID` environment variable
3. Report the issue on GitHub

### Testing with different endpoints
✅ Use environment variables (see "Environment Variable Overrides" above)

## Support

For issues or questions:
- GitHub Issues: https://github.com/ALLiDoizCode/Permamind/issues
- Documentation: https://github.com/ALLiDoizCode/Permamind#readme

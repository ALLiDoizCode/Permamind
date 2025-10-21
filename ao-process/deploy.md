# AO Registry Process Deployment Guide

This guide explains how to deploy the AO Registry Process to the AO Network.

## Prerequisites

- Node.js 20.11.0 or later
- npm 10.x
- Arweave wallet with funds (for process spawning)
- `@permaweb/aoconnect` package installed

## Deployment Methods

### Method 1: Automated Deployment (CI/CD)

For automated deployments in CI/CD pipelines:

```bash
npm run deploy:ao-process
```

This script uses `@permaweb/aoconnect` to:
1. Spawn a new AO process
2. Deploy the `registry.lua` code via `evalProcess`
3. Save the process ID to `.env` file

### Method 2: Manual Deployment (Local Development)

For interactive local development and testing:

#### Using Permamind MCP Server

```bash
# 1. Generate AO process code (optional, if modifying registry.lua)
mcp://permamind/generateLuaProcess {
  "userRequest": "Create AO registry process with skill registration handlers"
}

# 2. Spawn empty AO process
mcp://permamind/spawnProcess

# 3. Deploy registry.lua code
mcp://permamind/evalProcess {
  "processId": "<PROCESS_ID_FROM_STEP_2>",
  "code": "<CONTENTS_OF_registry.lua>"
}

# 4. Test deployment
mcp://permamind/executeAction {
  "processId": "<PROCESS_ID>",
  "action": "Info"
}
```

### Method 3: Manual Deployment (Command Line)

Using `@permaweb/aoconnect` directly:

```javascript
const { spawn, message, result } = require('@permaweb/aoconnect');
const fs = require('fs');

async function deployRegistry() {
  // 1. Spawn AO process
  const processId = await spawn({
    module: 'default_module_id', // AOS module ID
    scheduler: 'default_scheduler_id'
  });

  console.log('Process spawned:', processId);

  // 2. Read registry.lua
  const registryCode = fs.readFileSync('registry.lua', 'utf-8');

  // 3. Deploy code via evalProcess
  const messageId = await message({
    process: processId,
    tags: [
      { name: 'Action', value: 'Eval' }
    ],
    data: registryCode
  });

  // 4. Get result
  const { Output, Error } = await result({
    message: messageId,
    process: processId
  });

  if (Error) {
    console.error('Deployment failed:', Error);
    process.exit(1);
  }

  console.log('Registry deployed successfully!');
  console.log('Process ID:', processId);

  return processId;
}

deployRegistry().catch(console.error);
```

## Environment Configuration

After deployment, save the process ID to your `.env` file:

```bash
# .env
AO_REGISTRY_PROCESS_ID=<your_process_id_here>
ARNS_NETWORK=mainnet  # or testnet
```

## Post-Deployment Verification

### 1. Test Info Handler (ADP v1.0 Compliance)

```bash
# Using Permamind MCP
mcp://permamind/executeAction {
  "processId": "<PROCESS_ID>",
  "action": "Info"
}
```

Expected response should include:
- `process.name`: "Agent Skills Registry"
- `process.adpVersion`: "1.0"
- `handlers`: ["Register-Skill", "Search-Skills", "Get-Skill", "Info"]

### 2. Test Register-Skill Handler

```bash
mcp://permamind/executeAction {
  "processId": "<PROCESS_ID>",
  "action": "Register-Skill",
  "tags": {
    "Name": "test-skill",
    "Version": "1.0.0",
    "Description": "Test skill for deployment verification",
    "Author": "Deployment Tester",
    "ArweaveTxId": "abc123def456ghi789jkl012mno345pqr678stu901v",
    "Tags": "[\"test\"]",
    "Dependencies": "[]"
  }
}
```

Expected response:
- `Action`: "Skill-Registered"
- `Success`: "true"

### 3. Test Search-Skills Handler

```bash
mcp://permamind/executeAction {
  "processId": "<PROCESS_ID>",
  "action": "Search-Skills",
  "tags": {
    "Query": "test"
  }
}
```

Expected response:
- `Action`: "Search-Results"
- `ResultCount`: "1" (should find test-skill)

### 4. Test Get-Skill Handler

```bash
mcp://permamind/executeAction {
  "processId": "<PROCESS_ID>",
  "action": "Get-Skill",
  "tags": {
    "Name": "test-skill"
  }
}
```

Expected response:
- `Action`: "Skill-Found"
- `Data`: JSON-encoded skill metadata

## Troubleshooting

### Process Spawning Fails

**Error**: Insufficient funds or network issues

**Solution**:
- Ensure Arweave wallet has sufficient AR tokens
- Check network connectivity
- Verify `@permaweb/aoconnect` is latest version

### Code Evaluation Fails

**Error**: Lua syntax error or runtime error

**Solution**:
- Validate `registry.lua` syntax locally first:
  ```bash
  cd ao-process/tests
  lua run-all.lua
  ```
- Check for forbidden operations (os.time, require, module returns)
- Review error logs from `evalProcess` response

### Handlers Not Responding

**Error**: Messages sent but no response

**Solution**:
- Verify process is active (check process ID)
- Ensure message tags are correct (Action, Name, etc.)
- Check handler registration completed successfully
- Review AO process logs

## Deployment Checklist

Before deploying to production:

- [ ] All tests pass (`lua ao-process/tests/run-all.lua`)
- [ ] AO best practices validated (no os.time, no external requires, etc.)
- [ ] README.md updated with deployment process ID
- [ ] Environment variables configured (.env file)
- [ ] Info handler tested (ADP v1.0 compliance)
- [ ] Register-Skill handler tested
- [ ] Search-Skills handler tested
- [ ] Get-Skill handler tested
- [ ] Process ID documented in CLI configuration

## Updating Deployed Process

**IMPORTANT**: AO processes are immutable once deployed. To update:

1. Deploy a new process with updated code
2. Update environment variables with new process ID
3. Migrate existing skill registrations (if needed)
4. Update CLI tools to point to new process
5. Deprecate old process (document in changelog)

## Monitoring

After deployment, monitor:

- Process message count (growth indicates usage)
- Response times (should be <500ms for queries)
- Error rates (should be <1% for valid requests)
- Registry size (number of registered skills)

## Security Considerations

- Process ID is public (anyone can query/register skills)
- Owner field provides authorization for future updates
- No secrets or sensitive data should be stored in process state
- All inputs are validated before processing

## Support

For deployment issues:
- Review logs from aoconnect SDK
- Check AO network status
- Consult Permamind MCP server documentation
- Review Story 1.2 implementation notes

---

**Last Updated**: 2025-10-21

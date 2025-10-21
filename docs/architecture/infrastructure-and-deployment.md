# Infrastructure and Deployment

## Infrastructure as Code

- **Tool:** Custom deployment script using @permaweb/aoconnect (for CI/CD)
- **Location:** `scripts/deploy-ao-process.ts`
- **Approach:** Automated deployment via GitHub Actions, script spawns process and deploys Lua code

## Deployment Strategy

**AO Registry Process Deployment:**

Uses aoconnect for automated CI/CD deployment:

```typescript
// scripts/deploy-ao-process.ts
import { spawn, message, result, dryrun } from '@permaweb/aoconnect';
import { createDataItemSigner } from '@permaweb/aoconnect';

async function deployAOProcess() {
  const jwk = JSON.parse(process.env.ARWEAVE_WALLET_JWK);
  const signer = createDataItemSigner(jwk);

  // Step 1: Spawn process
  const processId = await spawn({
    module: 'SBNb1qPQ1TDwpD_mboxm2YllmMLXpWw4U8P9Ff8W9vk',
    scheduler: '_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA',
    signer,
    tags: [
      { name: 'App-Name', value: 'Agent-Skills-Registry' },
      { name: 'Name', value: 'Skills Registry Process' }
    ]
  });

  // Step 2: Deploy Lua code
  const luaCode = await fs.readFile('ao-process/registry.lua', 'utf-8');
  const evalMessageId = await message({
    process: processId,
    signer,
    tags: [{ name: 'Action', value: 'Eval' }],
    data: luaCode
  });

  // Step 3: Validate deployment
  const { Messages } = await dryrun({
    process: processId,
    tags: [{ name: 'Action', value: 'Info' }]
  });

  // Step 4: Save process ID
  await fs.writeFile('.env', `REGISTRY_PROCESS_ID=${processId}\n`);
}
```

**CLI Distribution:**
- npm package publication
- GitHub Actions triggers on version tags
- Automated publish to npm registry

## Environments

- **Development:** Local (aolite emulation + mocked Arweave)
- **Testnet (Optional):** AO testnet + Arweave testnet
- **Production:** AO mainnet + Arweave mainnet

## Environment Promotion Flow

```
Development (aolite local)
    ↓ (tests pass)
GitHub Actions (Production)
    ↓ (deploy AO process, publish CLI)
Community Launch
```

## Rollback Strategy

**AO Process:**
- Deploy new process with fixed code
- Update CLI configuration with new process ID
- Recovery Time: <30 minutes (automated)

**CLI:**
- npm deprecate broken version
- Publish patch version
- Recovery Time: <1 hour

---

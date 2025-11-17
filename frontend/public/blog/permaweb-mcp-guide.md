# Permaweb-MCP: Your Gateway to AO and Arweave Development

The Permaweb-MCP server transforms how developers interact with the AO computing ecosystem and Arweave permanent storage network. By bringing 16 powerful tools to Claude AI through the Model Context Protocol, it enables natural language control over blockchain deployment, smart contract execution, and permanent data storage.

## What is Permaweb-MCP?

Permaweb-MCP is an MCP server that provides comprehensive infrastructure for building on the Permaweb - the permanent, decentralized web powered by Arweave. It bridges the gap between AI-assisted development and Web3 deployment, allowing you to manage AO processes, deploy applications, handle blockchain wallets, and register decentralized domains - all through natural language conversations with Claude.

Think of it as your **AI-powered DevOps assistant** for the permanent web.

## Key Capabilities

Permaweb-MCP organizes its 16 tools into four functional domains:

### 1. AO Process Management (4 Tools)

Control AO smart contracts and distributed computation:

- **spawnProcess**: Create new AO process instances on the network
- **sendAOMessage**: Send messages to AO processes with custom tags and data
- **readAOProcess**: Query process state with read-only dryrun queries
- **queryAOProcessMessages**: Track message history and process communication

**Use Case**: "Claude, spawn a new AO process for my trading bot and send it the initial configuration."

### 2. Arweave Deployment (4 Tools)

Deploy applications and data to permanent storage:

- **deployPermawebDirectory**: Deploy complete websites to Arweave with ArNS integration
- **checkPermawebDeployPrerequisites**: Validate deployment setup before attempting
- **uploadToArweave**: Upload individual files with metadata and tags
- **uploadFolderToArweave**: Upload entire directories with manifest generation

**Use Case**: "Claude, deploy my React app to Arweave and register it under my ArNS domain."

### 3. Wallet Operations (2 Tools)

Manage Arweave cryptographic identities:

- **generateKeypair**: Create new Arweave wallets from seed phrases
- **getUserPublicKey**: Retrieve your current wallet address

**Use Case**: "Claude, show me my wallet address and generate a new keypair for testing."

### 4. ArNS Domain Management (6 Tools)

Handle blockchain-based domain names:

- **buyArnsRecord**: Register permanent or lease-based domain names
- **getArnsRecordInfo**: Query domain ownership and expiration details
- **getArnsTokenCost**: Calculate registration costs with demand-based pricing
- **resolveArnsName**: Resolve domain names to transaction IDs
- **transferArnsRecord**: Transfer domain ownership to another address
- **updateArnsRecord**: Update domain target and TTL settings

**Use Case**: "Claude, register myapp.ar as a permanent domain and point it to my latest deployment."

## Installation

### Quick Start

Install globally via npm:

```bash
npm install -g permaweb-mcp
```

Run the server:

```bash
npx permaweb-mcp
```

### Claude Desktop Integration

Add Permaweb-MCP to your Claude Desktop configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "permaweb-mcp": {
      "command": "npx",
      "args": ["permaweb-mcp"],
      "env": {
        "SEED_PHRASE": "your twelve word mnemonic phrase here"
      }
    }
  }
}
```

**Security Note**: Your seed phrase enables wallet access. Store it securely and never commit it to version control.

## Real-World Usage Examples

### Example 1: Deploy a Website to the Permaweb

```
You: Deploy my React build directory to Arweave under myapp.ar

Claude: I'll deploy your application to the Permaweb. First, let me check the prerequisites.

[Checks build directory, wallet, and ArNS ownership]

Claude: Everything looks good! Deploying to Arweave...

[Uploads files, generates manifest, updates ArNS record]

Claude: ✅ Deployment complete!
- Manifest TX: abc123...xyz789
- ArNS domain: myapp.ar
- Live URL: https://myapp.ar
- Total size: 2.3 MB
```

### Example 2: Spawn and Configure an AO Process

```
You: Create a new AO process for a token contract and initialize it with 1,000,000 supply

Claude: I'll spawn a new AO process and configure it.

[Spawns process, gets process ID]

Claude: Process created: xyz123...abc789

[Sends initialization message with token supply data]

Claude: ✅ Token contract initialized!
- Process ID: xyz123...abc789
- Initial supply: 1,000,000 tokens
- Ready to receive commands
```

### Example 3: Register and Manage ArNS Domains

```
You: What would it cost to register "permamind.ar" for 5 years?

Claude: Let me calculate the cost for you.

[Queries ArNS pricing]

Claude: Registration costs for "permamind.ar":
- 5-year lease: 125.5 IO tokens
- Permanent ownership: 2,500 IO tokens
- Includes 10 undernames (sub.permamind.ar)

You: Register it as permanent

Claude: Registering permamind.ar as permanent ownership...

[Executes registration transaction]

Claude: ✅ Domain registered successfully!
- Name: permamind.ar
- Type: Permanent
- Owner: [your wallet address]
- Undernames: 10 available
```

## Technical Architecture

### Built With

- **FastMCP**: TypeScript framework for MCP server development
- **@permaweb/aoconnect**: Official AO protocol client library
- **AR.IO SDK**: ArNS domain operations and gateway management
- **Turbo SDK**: High-performance Arweave uploads
- **Arweave.js**: Core Arweave blockchain interaction

### Zero-Config Design

Permaweb-MCP follows a "batteries included" philosophy:

1. **Automatic Wallet Generation**: Your seed phrase deterministically generates an Arweave wallet
2. **Smart Defaults**: Production endpoints pre-configured (ur-mu.randao.net, ur-cu.randao.net)
3. **Error Recovery**: Built-in retry logic and fallback mechanisms
4. **Type Safety**: Full TypeScript support with comprehensive interfaces

## Payment Methods

### Turbo Credits vs AR Tokens

Permaweb-MCP supports two payment methods for Arweave uploads:

**Turbo Credits (Default)**:
- Pre-purchased credits (winc) for cost-effective uploads
- Faster transaction finalization
- Recommended for frequent deployments
- Purchase at https://turbo.ardrive.io

**AR Tokens**:
- Pay directly with Arweave native tokens
- Auto-calculated upload costs
- No pre-purchase required
- Specify with `paymentMethod: "tokens"`

## Development Workflow

### Local Development

Clone and run locally for development:

```bash
git clone https://github.com/ALLiDoizCode/Permaweb-MCP.git
cd Permaweb-MCP
npm install
npm run dev
```

### Testing

Run the comprehensive test suite:

```bash
npm test
```

### Building

Create a production build:

```bash
npm run build
```

## Why Use Permaweb-MCP?

### For AI-Assisted Development

- **Natural Language Deployment**: "Deploy my app to Arweave" instead of complex CLI commands
- **Context-Aware Guidance**: Claude understands your project structure and suggests best practices
- **Error Recovery**: Automatic retry logic and helpful error messages
- **Learning Assistant**: Claude explains Arweave/AO concepts as you work

### For Web3 Developers

- **Permanent Storage**: Pay once, store forever - no recurring hosting costs
- **Censorship Resistant**: Decentralized network ensures content availability
- **Immutable Deployments**: Cryptographically verified content integrity
- **Smart Contract Integration**: Native AO process management

### For DevOps Engineers

- **Infrastructure as Conversation**: Manage deployments through natural language
- **Automated Workflows**: Chain multiple operations in a single conversation
- **Cost Transparency**: Clear pricing and payment method options
- **Production Ready**: Type-safe, tested, and reliable

## Best Practices

### Security

1. **Protect Your Seed Phrase**: Store in environment variables, never in code
2. **Use Separate Wallets**: Development vs production environments
3. **Validate Transactions**: Review costs before confirming operations
4. **Monitor Wallet Balance**: Ensure sufficient AR/Turbo credits

### Performance

1. **Use Turbo Credits**: Faster finalization for frequent uploads
2. **Batch Operations**: Upload folders instead of individual files
3. **Cache ArNS Queries**: Domain resolution results rarely change
4. **Monitor Network**: AO mainnet vs testnet for development

### Development

1. **Test Locally First**: Validate builds before uploading to Arweave
2. **Use Preview Deployments**: Test on undernames before updating main domain
3. **Version Control**: Track deployment transaction IDs
4. **Document Processes**: Keep AO process IDs and purposes documented

## Troubleshooting

### Common Issues

**"Insufficient balance for upload"**
- Solution: Fund your wallet with AR tokens or Turbo credits
- Check balance at https://viewblock.io/arweave/address/[your-address]

**"ArNS name already taken"**
- Solution: Choose a different name or check ownership with `getArnsRecordInfo`
- Try adding prefixes/suffixes or use undernames

**"Process message timeout"**
- Solution: AO network may be congested, retry after a few minutes
- Check AO network status at https://ao.arweave.dev

**"Invalid seed phrase"**
- Solution: Verify your 12-word mnemonic is correctly formatted
- No extra spaces, lowercase words, correct word order

### Getting Help

- **GitHub Issues**: https://github.com/ALLiDoizCode/Permaweb-MCP/issues
- **Discord Community**: https://discord.gg/yDJFBtfS4K
- **Documentation**: https://github.com/ALLiDoizCode/Permaweb-MCP#readme

## Conclusion

Permaweb-MCP democratizes access to Web3 infrastructure by making permanent storage, decentralized computation, and blockchain domains accessible through natural language. Whether you're deploying your first Permaweb application or managing a fleet of AO processes, Permaweb-MCP provides the tools you need with the simplicity of conversation.

Ready to build on the permanent web? Install Permaweb-MCP and start deploying:

```bash
npm install -g permaweb-mcp
npx permaweb-mcp
```

Then open Claude Desktop and say: "Help me deploy my first application to the Permaweb."

---

**Links**:
- GitHub: https://github.com/ALLiDoizCode/Permaweb-MCP
- NPM: https://www.npmjs.com/package/permaweb-mcp
- Discord: https://discord.gg/yDJFBtfS4K
- Arweave Docs: https://docs.arweave.org
- AO Docs: https://ao.arweave.dev

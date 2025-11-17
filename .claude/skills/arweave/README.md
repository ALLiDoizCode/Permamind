# Arweave Skill

Comprehensive technical expertise for building applications on the Arweave permanent storage network.

## Overview

This skill enables AI agents to provide deterministic, implementation-ready guidance for developers working with Arweave's base layer capabilities:

- **Data Storage**: Upload files and data with various methods (direct, bundled, services)
- **Data Retrieval**: Query and fetch data using GraphQL, HTTP APIs, and libraries
- **Permaweb Deployment**: Deploy static websites and applications permanently
- **Wallet Management**: Generate, secure, and manage Arweave wallets
- **Protocol Understanding**: Blockweave, transactions, permanence model, economics

## Skill Structure

```
arweave/
├── SKILL.md                           # Main skill content
├── README.md                          # This file
└── resources/
    ├── arweave-api-reference.md       # Complete arweave-js API documentation
    ├── upload-guide.md                # Upload strategies and ANS-104 bundling
    └── query-guide.md                 # GraphQL queries and data retrieval
```

## Key Features

### Decision-Driven Guidance

The skill provides clear decision trees for:
- **Upload Method Selection**: Direct vs bundling vs services based on file size, count, and requirements
- **Gateway Selection**: Which gateway to use for different scenarios
- **Tool Selection**: Choosing the right library or CLI tool for the task

### Comprehensive Coverage

- **Core Protocol**: Blockweave, Proof of Access, permanence guarantees, endowment model
- **Storage Operations**: Direct uploads, ANS-104 bundling, Turbo/Irys services, cost optimization
- **Data Retrieval**: Gateway fallback, GraphQL queries, HTTP APIs, caching strategies
- **Wallet Management**: JWK format, security best practices, address derivation
- **Permaweb Deployment**: Framework-aware deployment, manifest creation, ArNS integration

### Code-First Approach

Every concept includes:
- Working code examples
- Error handling patterns
- Production-ready implementations
- Common pitfalls and solutions

## Relationship to Other Skills

### AO Skill Boundary

This Arweave skill focuses on **base layer storage and data operations**. For **compute and smart contract** functionality, use the AO skill:

**Arweave Skill** (base layer):
- Uploading and storing data
- Deploying static websites
- Querying and retrieving data
- Managing wallets and transactions

**AO Skill** (compute layer):
- Running stateful processes
- Writing Lua handlers
- Implementing smart contract logic
- Using aoconnect for process interaction

### AR.IO Skill Relationship

The AR.IO (ario) skill focuses on:
- AR.IO gateway operations
- ArNS domain management
- AR.IO token operations
- Wayfinder protocol

The Arweave skill covers ArNS deployment basics but defers to the ario skill for advanced AR.IO-specific features.

## Usage Patterns

### Claude Code Workflows

The skill adapts to Claude Code context with:
- Step-by-step upload workflows
- Deployment automation
- Project type detection
- Error handling and recovery

### Autonomous Agent Patterns

For autonomous agents, the skill provides:
- Decision trees with clear criteria
- Robust error handling
- Retry logic with exponential backoff
- Multi-gateway fallback strategies

### Educational Patterns

When teaching concepts:
- Progressive disclosure (simple → complex)
- Concept → Example → Explanation flow
- Visual decision matrices
- Comprehensive troubleshooting

## Resource Files

### arweave-api-reference.md

Complete reference for the arweave-js library:
- Initialization and configuration
- All wallet operations
- Transaction creation and management
- Block and network operations
- AR/Winston conversions
- Utility functions
- TypeScript types

**Use when**: User needs specific API method documentation or implementation details.

### upload-guide.md

Detailed guide to uploading data:
- Three upload methods compared (direct, bundling, services)
- ANS-104 bundling deep dive
- Turbo vs Irys comparison
- Cost optimization strategies (5 techniques)
- Decision tree for method selection
- Production-ready code examples

**Use when**: User needs to upload files or optimize upload costs.

### query-guide.md

Complete guide to querying Arweave:
- GraphQL query structure and patterns
- Gateway fallback strategies
- ArDB and ar-gql simplified APIs
- HTTP API endpoints
- Pagination and batching
- Performance optimization
- Caching strategies

**Use when**: User needs to find or retrieve data from Arweave.

## Target Use Cases

### 1. Upload File to Arweave

Most common workflow:
1. Analyze file (size, type)
2. Choose upload method
3. Estimate cost
4. Check wallet balance
5. Execute upload
6. Verify and report

### 2. Deploy Static Website

Framework-aware deployment:
1. Detect project type (React, Vue, Next.js, etc.)
2. Verify build configuration
3. Execute build
4. Choose deployment method
5. Upload with manifest
6. (Optional) Update ArNS name

### 3. Query Arweave Data

Flexible query operations:
1. Parse requirements
2. Construct GraphQL query
3. Execute with fallback
4. Process and format results
5. (Optional) Fetch transaction data

### 4. Wallet Management

Secure wallet operations:
1. Generate or load wallet
2. Derive address
3. Check balance
4. Manage security

## Cost Model Understanding

The skill emphasizes Arweave's unique cost model:
- **One-time payment** for perpetual storage
- **Pricing**: ~$3-5 per GB (Nov 2025)
- **Free tiers**: Turbo <500KB, Irys <100KB
- **Optimization**: 50-70% savings with bundling
- **Currency**: AR tokens (1 AR = 1 trillion winston)

## Security Emphasis

Critical security rules reinforced throughout:
- ⚠️ JWK wallets are irreplaceable if lost
- ⚠️ Never commit wallet files to version control
- ⚠️ Use environment variables for key access
- ⚠️ Data is permanent and immutable - verify before upload
- ⚠️ Implement spending limits for automated systems

## Best Practices Integrated

All examples follow production best practices:
- **Multi-gateway fallback** for reliability
- **Exponential backoff** for retries
- **Balance checking** before transactions
- **Comprehensive error handling** with meaningful messages
- **Transaction verification** after submission
- **Proper tagging** for discoverability
- **Content-Type tags** required for proper rendering

## Version & Maintenance

- **Version**: 1.0.0
- **Last Updated**: November 14, 2025
- **Arweave Protocol**: Version 2.0
- **Primary Library**: arweave-js ^1.14.0

### Monitoring

Key areas to monitor for updates:
- Arweave protocol changes
- arweave-js library updates
- Gateway endpoint changes
- ArNS system evolution
- Bundler service features/pricing
- Community standards

## Contributing

To update this skill:

1. **Update research**: Modify `arweave-skill-research-analysis.md`
2. **Update SKILL.md**: Main skill content for common operations
3. **Update resources**: Detailed documentation files as needed
4. **Test examples**: Verify all code examples work
5. **Version bump**: Update version numbers

## Credits

Created from comprehensive research analysis of:
- Official Arweave documentation
- arweave-js library documentation
- AR.IO documentation
- Turbo SDK documentation
- Irys documentation
- Community best practices
- AO ecosystem documentation

---

**Skill Type**: Project skill
**Location**: `.claude/skills/arweave/`
**Invocation**: Use when user needs Arweave base layer capabilities (storage, querying, deployment)

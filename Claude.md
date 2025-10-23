# Claude Agent Skills Documentation

This document provides comprehensive information about Claude's Agent Skills, a powerful feature for extending Claude's capabilities with modular, reusable expertise.

## Table of Contents
- [Overview](#overview)
- [Core Architecture](#core-architecture)
- [Benefits](#benefits)
- [Available Skills](#available-skills)
- [Platform Support](#platform-support)
- [Skill Structure](#skill-structure)
- [Security Considerations](#security-considerations)
- [Limitations](#limitations)
- [Getting Started](#getting-started)
- [Best Practices](#best-practices)
- [Additional Resources](#additional-resources)
- [Arweave & AO Development](#arweave--ao-development)
  - [MCP Servers](#mcp-servers)
  - [AO Process Implementation](#ao-process-implementation)
  - [ADP Protocol](#adp-protocol)
  - [HyperBEAM Resources](#hyperbeam-resources)

## Overview

**Agent Skills** are modular capabilities that extend Claude's functionality by packaging specialized instructions, metadata, and optional resources. They enable Claude to operate as a domain expert rather than a generalist, automatically activating when relevant to a task.

### What Makes Skills Powerful

Skills function like specialized onboarding guides that:
- Provide domain-specific expertise without continuous re-prompting
- Load progressively to minimize token consumption
- Activate automatically based on context
- Can be combined for complex workflows

## Core Architecture

Skills operate in Claude's virtual machine environment with filesystem access, using a **progressive disclosure** system that loads information in stages:

### Level 1: Metadata (Always Loaded)
- Loaded at startup (~100 tokens per Skill)
- Contains name and description from YAML frontmatter
- Used to determine when to activate the Skill

### Level 2: Instructions (Loaded When Triggered)
- Main SKILL.md file content (<5k tokens recommended)
- Contains workflows, best practices, and detailed guidance
- Loads only when the Skill is activated

### Level 3: Resources/Code (Loaded As Needed)
- Bundled files, scripts, and reference materials
- Loads only when explicitly referenced
- No context penalty for unused content

## Benefits

### Specialization
Tailor Claude for domain-specific tasks with expert-level knowledge in specialized areas.

### Reusability
Create Skills once and they activate automatically across all relevant conversations.

### Composability
Combine multiple Skills to handle complex, multi-domain workflows seamlessly.

### Efficiency
Progressive loading means you only pay for the context you use—bundled content doesn't consume tokens until referenced.

## Available Skills

### Pre-built Agent Skills
Available on Claude API and claude.ai:

- **PowerPoint (pptx)**: Create and manipulate PowerPoint presentations
- **Excel (xlsx)**: Work with Excel spreadsheets and data
- **Word (docx)**: Generate and edit Word documents
- **PDF (pdf)**: Process and analyze PDF files

### Custom Skills
Users can create domain-specific Skills for:
- Organizational knowledge and processes
- Specialized technical domains
- Industry-specific workflows
- Team-specific best practices

## Platform Support

| Platform | Custom Skills | Pre-built Skills | Sharing Scope |
|----------|---------------|------------------|--------------|
| **Claude API** | ✓ Yes | ✓ Yes | Workspace-wide |
| **Claude Code** | ✓ Yes | ✗ No | Personal/project |
| **Claude.ai** | ✓ Yes | ✓ Yes | Individual user |

### Important Notes
- Skills do not automatically sync between platforms
- Workspace-wide sharing only available on Claude API
- Personal Skills on Claude Code are project-specific

## Skill Structure

Every Skill requires a `SKILL.md` file with YAML frontmatter:

```yaml
---
name: [Skill Name]  # Max 64 characters
description: [What the Skill does and when to use it]  # Max 1024 characters
---

# Skill Instructions

Your detailed instructions, workflows, and best practices go here.

## When to Use This Skill

Describe the scenarios where this Skill should activate.

## How to Use This Skill

Provide step-by-step guidance and examples.

## Best Practices

List recommendations and tips for optimal results.
```

### Structure Recommendations

1. **Keep metadata concise**: The description determines when the Skill activates
2. **Instructions under 5k tokens**: Main SKILL.md should be focused and actionable
3. **Bundle resources efficiently**: Include only necessary supporting files
4. **Clear activation criteria**: Make it obvious when the Skill should be used

## Security Considerations

⚠️ **Critical Security Notes**

Skills should only come from **trusted sources**. Malicious Skills could:

- Invoke tools in harmful ways
- Leak sensitive data through tool calls
- Execute unauthorized operations
- Access filesystem inappropriately

### Security Best Practices

✓ Thoroughly audit all bundled files before use
✓ Review Skill instructions for suspicious behavior
✓ Only install Skills from verified, trusted sources
✓ Regularly review active Skills in your workspace
✓ Implement access controls for workspace-wide Skills

## Limitations

### No Network Access
Skills cannot make external API calls or access internet resources during execution.

### No Runtime Installation
Only pre-installed packages are available—Skills cannot install new dependencies at runtime.

### Cross-Surface Incompatibility
Skills don't automatically sync between Claude.ai, Claude API, and Claude Code platforms.

### Sharing Restrictions
- **Claude API**: Workspace-wide sharing
- **Claude.ai**: Individual user only
- **Claude Code**: Personal/project scope

### Platform-Specific Constraints
Pre-built Skills (PowerPoint, Excel, Word, PDF) are not available in Claude Code.

## Getting Started

### Using Pre-built Skills

1. **Claude API**: See the [quickstart tutorial](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview) for implementation
2. **Claude.ai**: Pre-built Skills are automatically available

### Creating Custom Skills

1. Review the [Agent Skills Cookbook](https://github.com/anthropics/claude-cookbooks) for examples
2. Define your Skill's purpose and activation criteria
3. Create SKILL.md with proper YAML frontmatter
4. Write clear, actionable instructions
5. Test thoroughly before deploying to workspace

## Best Practices

### Skill Design

- **Focused Purpose**: Each Skill should have a clear, specific purpose
- **Clear Activation**: Description should make it obvious when to use the Skill
- **Concise Instructions**: Keep core instructions under 5k tokens
- **Progressive Detail**: Use bundled resources for extensive reference material

### Implementation

- **Test Incrementally**: Validate each Skill independently before combining
- **Monitor Performance**: Track token usage and activation patterns
- **Iterate Based on Use**: Refine Skills based on real-world usage
- **Document Dependencies**: Note any relationships between Skills

### Maintenance

- **Regular Audits**: Review and update Skills periodically
- **Version Control**: Track changes to Skill definitions
- **User Feedback**: Gather input from team members using shared Skills
- **Security Reviews**: Regularly audit Skills for security concerns

## Additional Resources

### Documentation
- [Official Claude Agent Skills Documentation](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview)
- [Anthropic Developer Documentation](https://docs.claude.com/claude/docs/guide-to-anthropics-prompt-engineering-resources)
- [Anthropic Support Docs](https://support.anthropic.com)

### Community & Examples
- [Claude Cookbooks Repository](https://github.com/anthropics/claude-cookbooks)
- [Anthropic Discord Community](https://www.anthropic.com/discord)
- [Agent Skills Cookbook](https://github.com/anthropics/claude-cookbooks) (for custom Skill examples)

### Related Claude Capabilities

From the Claude Cookbooks repository:

#### Tool Use & Integration
- [Tool Use Examples](https://github.com/anthropics/anthropic-cookbook/tree/main/tool_use)
- [Customer Service Agent](https://github.com/anthropics/anthropic-cookbook/blob/main/tool_use/customer_service_agent.ipynb)
- [Calculator Integration](https://github.com/anthropics/anthropic-cookbook/blob/main/tool_use/calculator_tool.ipynb)

#### Advanced Techniques
- [Sub-agents Pattern](https://github.com/anthropics/anthropic-cookbook/blob/main/multimodal/using_sub_agents.ipynb)
- [Prompt Caching](https://github.com/anthropics/anthropic-cookbook/blob/main/misc/prompt_caching.ipynb)
- [Automated Evaluations](https://github.com/anthropics/anthropic-cookbook/blob/main/misc/building_evals.ipynb)

#### Multimodal Capabilities
- [Vision with Claude](https://github.com/anthropics/anthropic-cookbook/tree/main/multimodal)
- [Upload PDFs to Claude](https://github.com/anthropics/anthropic-cookbook/blob/main/misc/pdf_upload_summarization.ipynb)

---

# Arweave & AO Development

This section provides comprehensive guidance for developing on Arweave and the AO (Actor Oriented) computation protocol, including MCP server integrations, process implementation standards, and ecosystem resources.

## MCP Servers

## UI Development with shadcn-ui

When building UI components, always use shadcn-ui (v4) components for consistency and best practices.

### shadcn-ui Workflow

1. **Always check demo first**: Use `mcp__shadcn-ui__get_component_demo` BEFORE using `mcp__shadcn-ui__get_component` to understand:
   - How the component should be used
   - Common usage patterns
   - Props and configuration options
   - Integration examples

2. **Get component source**: After reviewing the demo, use `mcp__shadcn-ui__get_component` to get the actual component source code

3. **List available components**: Use `mcp__shadcn-ui__list_components` to discover available components when unsure what to use

4. **Get metadata**: Use `mcp__shadcn-ui__get_component_metadata` for detailed component information (dependencies, files, registry info)

5. **Use blocks for complex layouts**: Use `mcp__shadcn-ui__list_blocks` and `mcp__shadcn-ui__get_block` for pre-built complex UI patterns (dashboards, login pages, etc.)

### When to Use shadcn-ui

- Building new UI components or pages
- Adding forms, buttons, dialogs, cards, or any interactive elements
- Creating consistent, accessible UI patterns
- Implementing common layouts (authentication, dashboards, data tables, etc.)

## Integration Testing with Playwright

Use Playwright for all integration and end-to-end testing of the marketplace.

### Playwright Workflow

1. **Browser automation**: Use Playwright tools (`mcp__playwright__*`) for testing user flows
2. **Snapshot first**: Always use `mcp__playwright__browser_snapshot` to understand page state before taking actions
3. **Navigation**: Use `mcp__playwright__browser_navigate` to visit pages
4. **Interactions**: Use appropriate tools for clicking, typing, filling forms, etc.
5. **Verification**: Take screenshots or snapshots to verify expected outcomes

### When to Use Playwright

- Testing complete user workflows (registration, posting jobs, applying to jobs, payments)
- Verifying multi-page flows (expert onboarding, project submission, review cycles)
- Testing form submissions and validation
- Verifying responsive design across different viewport sizes
- Testing authentication and authorization flows
- Integration testing of payment flows (escrow, cryptocurrency)
- Validating AI integration points (BMAD workflow automation)

### Playwright Best Practices

- Always use `browser_snapshot` to understand the page before interacting
- Use semantic selectors (role, text) when possible
- Test critical paths: user registration → job posting → expert application → payment → delivery
- Test both success and error scenarios
- Verify state persistence across page reloads
- Test accessibility using snapshots

### permamind
**Permanent AI Memory System built on Arweave and AO**

- **Type**: Local MCP server
- **Command**: `npx permamind`
- **Repository**: https://github.com/ALLiDoizCode/Permamind
- **Purpose**: Permanent, decentralized AI memory and AO process development

#### Available Tool Categories:

**1. Memory Management**
- Persistent AI memory storage across sessions
- Knowledge relationship creation
- Permanent information retrieval

**2. Process Tools**
- `generateLuaProcess`: Generate ADP-compliant Lua code for AO processes
  - Parameters: `userRequest` (required), `domains` (optional), `includeExplanation` (optional)
  - Example: `"Generate a token transfer process"`
- `spawnProcess`: Spawn new AO processes
- `evalProcess`: Deploy Lua code (handlers, modules)
- `executeAction`: Send natural language messages to processes
- `queryAOProcessMessages`: Query process message history
- `validateDeployment`: Validate deployed functionality
- `rollbackDeployment`: Rollback failed deployments
- `analyzeProcessArchitecture`: Analyze process structure

**3. Token Tools**
- Balance queries and transfers
- Advanced minting strategies
- Credit notice detection

**4. Documentation Tools**
- Permaweb documentation access
- File storage and deployment
- Decentralized documentation systems

**5. Contact & Hub Tools**
- Contact and address management
- Hub creation for Velocity protocol
- Decentralized identity management

**6. ArNS Tools**
- ArNS name system operations
- Decentralized domain management

#### Usage Best Practices:
- **Memory Storage**: Natural language commands automatically persist
- **Zero Configuration**: All tools work without setup
- **Process Development**: Use `generateLuaProcess` for ADP v1.0 compliance
- **Natural Language**: Conversational commands for blockchain operations

### aolite Docs
**Local AO Protocol Emulation for Testing**

- **Type**: SSE documentation server
- **URL**: https://gitmcp.io/perplex-labs/aolite
- **Repository**: https://github.com/perplex-labs/aolite
- **Purpose**: Local, concurrent emulation of Arweave AO protocol

#### Key Features:
- **Local AO Environment**: Test without network deployment
- **Concurrent Process Emulation**: Coroutine-based management
- **Message Passing**: Queue-based inter-process communication
- **Direct State Access**: Inspect process state during development
- **Flexible Scheduler**: Manual or automatic message scheduling
- **Configurable Logging**: Multiple log levels (0-3)

#### Core API:
- `spawnProcess()`: Load processes from string or file
- `send()`: Inter-process messaging
- `eval()`: Code evaluation in process context
- `getAllMsgs()`: Message retrieval
- `runScheduler()`: Execute scheduling
- `setMessageLog()`: Configure logging

**Requirements**: Lua 5.3

### harlequin-toolkit Docs
**Permaweb Web Development Toolkit**

- **Type**: SSE documentation server
- **URL**: https://gitmcp.io/the-permaweb-harlequin/harlequin-toolkit
- **Repository**: https://github.com/the-permaweb-harlequin/harlequin-toolkit
- **Purpose**: Web development for Permaweb applications using Rspress

#### Components:
- **CLI**: Command-line tools for Permaweb development
- **SDK**: Permaweb integration library
- **Server**: Backend components
- **App**: Frontend framework

#### CLI Commands:
```bash
harlequin                    # Launch interactive TUI
harlequin build             # Interactive build mode
harlequin build ./project   # Direct CLI build
harlequin build --entrypoint <file>  # Specific entry point
harlequin lua-utils bundle --entrypoint main.lua  # Bundle Lua files
harlequin version / -v      # Version info
harlequin help / -h         # Usage instructions
```

#### Features:
- 🎨 Beautiful Terminal UI (Charm Bubble Tea)
- 📁 Smart File Discovery
- ⚙️ YAML-based Configuration
- 🚀 Real-time Progress Tracking
- 🔧 Clear Error Handling

**Status**: Early development stage

## AO Process Implementation

### CRITICAL: AO + ADP Compliance Requirements

All Lua processes MUST follow these patterns for AO runtime and ADP v1.0 compliance:

#### 1. Monolithic Design (REQUIRED)
```lua
-- ❌ FORBIDDEN: External dependencies
local utils = require('utils')

-- ✅ REQUIRED: Embed all dependencies
local function validateInput(data)
    -- Embedded utility function
end
```

#### 2. Handler Pattern (REQUIRED)
```lua
-- ❌ FORBIDDEN: Direct assignment
Handlers["ProcessLogic"] = function(msg) end

-- ❌ FORBIDDEN: Multi-action handlers
Handlers.add("multi-handler",
    Handlers.utils.hasMatchingTag("Action", {"Action1", "Action2"}),
    function(msg) end
)

-- ✅ REQUIRED: Individual handlers for each action
Handlers.add("action-one",
    Handlers.utils.hasMatchingTag("Action", "Action1"),
    function(msg)
        local response = processAction1(msg)
        ao.send({
            Target = msg.From,
            Action = response.Action,
            Data = response.Data
        })
    end
)
```

#### 3. Error Handling Pattern (REQUIRED)

**CRITICAL: Avoid unnecessary pcall usage**

```lua
-- ❌ FORBIDDEN: Unnecessary pcall for simple operations
local success, result = pcall(function()
    return getSpeciesById(id)  -- Simple lookup never fails
end)

-- ❌ FORBIDDEN: Wrapping entire handler in pcall
Handlers.add("handler", pattern, function(msg)
    local success, response = pcall(function()
        return processLogic(msg)
    end)
end)

-- ✅ REQUIRED: Direct access with validation
local speciesId = msg.SpeciesId or msg.Id
if not speciesId then
    ao.send({
        Target = msg.From,
        Action = "Error",
        Error = "SpeciesId required"
    })
    return
end

local result = getSpeciesById(tonumber(speciesId))
if result then
    ao.send({
        Target = msg.From,
        Action = "SaveState",
        Data = json.encode(result)
    })
else
    ao.send({
        Target = msg.From,
        Action = "Error",
        Error = "Species not found"
    })
end

-- ✅ ACCEPTABLE: pcall ONLY for operations that might fail
local success, gameState = pcall(json.decode, externalUntrustedData)
if not success then
    ao.send({Target = msg.From, Action = "Error", Error = "Invalid JSON"})
    return
end
```

**When to use pcall (LIMITED):**
- JSON parsing of untrusted external input
- File I/O operations (if available)
- Mathematical overflow/underflow risks
- External module calls that might not exist

**When NOT to use pcall (MOST CASES):**
- Simple table lookups from embedded data
- Basic parameter validation
- Simple arithmetic operations
- Accessing msg tags or known structures
- Handler logic (should fail fast)
- JSON parsing of AO message data (controlled inputs)
- Entire handler wrapping (masks errors)
- Simple validation functions
- Database lookups from embedded tables

**AO Best Practice**: Let processes fail fast with clear error messages rather than masking issues with pcall.

#### 4. Timestamp Handling (REQUIRED)
```lua
-- ❌ FORBIDDEN: os.time() in AO processes
local timestamp = os.time()

-- ✅ REQUIRED: Use msg.Timestamp
local timestamp = msg.Timestamp or 0

-- ✅ TESTING: Mock timestamp for tests
local mockTimestamp = 1234567890
```

#### 5. Available AO Globals
- `ao.send()` - Send messages to other processes
- `ao.id` - Current process ID
- `Handlers` - Message handler registry
- `json` - JSON encode/decode utilities
- Standard Lua: string, table, math, os (limited)

#### 6. Forbidden Operations
- `require()` - No external modules (except `require("json")` is permitted)
- `io` - No file system access
- `debug` - Debug library unavailable
- `os.time()` - Use `msg.Timestamp` instead
- Network operations (only through ao.send)

#### 7. No Module-Level Returns (REQUIRED)
```lua
-- ❌ FORBIDDEN: Module-level returns
return {
    handler = someHandler,
    data = someData
}

-- ✅ REQUIRED: Use ao.send() only
-- All data exchange through message passing
print("Process initialization complete.")
```

**Why this matters:**
- AO runtime doesn't support module returns
- Breaks AO process isolation model
- Prevents proper message-based communication

#### 8. Tags vs Data Field Usage (REQUIRED)

**Use the right approach for the right data:**

```lua
-- ✅ REQUIRED: Use tags for simple parameters
local speciesId = msg.SpeciesId or msg.Id
local operation = msg.Operation

-- ✅ REQUIRED: Use Data field for complex structures
local gameState = nil
if msg.Data and msg.Data ~= "" then
    gameState = json.decode(msg.Data)
end

-- ✅ REQUIRED: Use Data field for large blobs
local imageData = msg.Data  -- Raw binary or base64
local documentContent = msg.Data  -- Large text
```

**When to use Tags:**
- Simple identifiers: `SpeciesId`, `PlayerId`, `BattleId`
- Enum-like values: `Operation`, `Type`, `Category`
- Small strings/numbers: `Name`, `Level`, `Generation`
- Flags: `Confirmed`, `Force`, `Override`

**When to use Data field:**
- Complex objects: `gameState`, `pokemonData`, `battleResult`
- Large text content: documentation, descriptions, logs
- Binary data: images, files, encrypted payloads
- Arrays/lists: multiple items, batch operations
- Nested structures: configuration objects, schemas

**Response patterns:**
```lua
-- ✅ CORRECT: Simple response with individual tags (all strings)
ao.send({
    Target = msg.From,
    Action = "SaveState",
    Success = "true",
    SpeciesId = tostring(result.id),
    SpeciesName = result.name,
    HP = tostring(result.baseStats.hp),
    Type1 = tostring(result.types[1])
})

-- ✅ CORRECT: Complex response using Data field
ao.send({
    Target = msg.From,
    Action = "SaveState",
    Data = json.encode({
        species = speciesData,
        stats = baseStats,
        moves = availableMoves
    })
})
```

**Tag naming conventions:**
- Use PascalCase: `SpeciesId`, `PlayerName`, `BattleId`
- Provide alternatives: `msg.SpeciesId or msg.Id`
- Convert strings to numbers: `tonumber(msg.SpeciesId)`
- Boolean flags: `msg.Confirmed == "true"`
- **CRITICAL**: All tag values MUST be strings: `tostring(number)`, `"true"/"false"` for booleans
- Empty optional values: use `""` instead of `nil`

#### 9. Testing Pattern
```lua
-- Mock AO environment for testing
local function setupTestEnvironment()
    if not ao then
        ao = {
            send = function(msg) print("Mock send:", json.encode(msg)) end,
            id = "test_process_id"
        }
    end

    if not Handlers then
        Handlers = {
            add = function(name, matcher, handler)
                print("Handler registered:", name)
            end
        }
    end
end
```

## ADP Protocol

### What is ADP?
**ADP (AO Documentation Protocol) v1.0** is a standardized protocol enabling AO processes to automatically document their capabilities, handlers, and interfaces for self-documentation and intelligent tool integration.

### Core Requirements
1. **Protocol Identifier**: `adpVersion: "1.0"`
2. **Info Handler**: Responds to `Action: "Info"` with process metadata
3. **Message Schemas**: Defined schemas for all message types
4. **Process Metadata**: Name, version, capabilities, documentation
5. **Self-Documentation**: Queryable capabilities

### ADP Benefits
- **Autonomous Tool Integration**: AI tools discover and interact automatically
- **Self-Documenting**: Reduces maintenance overhead
- **Standardized Discovery**: Consistent capability queries
- **Future-Proof**: Compatible with evolving AO ecosystem

### ADP Implementation
```lua
-- ✅ REQUIRED: Info handler for self-documentation
Handlers.add("info",
    Handlers.utils.hasMatchingTag("Action", "Info"),
    function(msg)
        ao.send({
            Target = msg.From,
            Action = "SaveState",
            Data = json.encode({
                process = {
                    name = "Process Name",
                    version = "1.0.0",
                    adpVersion = "1.0",
                    capabilities = {"operation1", "operation2"},
                    messageSchemas = {
                        ProcessLogic = {
                            required = {"Action", "Data", "Timestamp"}
                        }
                    }
                },
                handlers = {"ProcessLogic", "HealthCheck", "Info"},
                documentation = {
                    adpCompliance = "v1.0",
                    selfDocumenting = true
                }
            })
        })
    end
)
```

### Permamind-First Development Standard
**ALL new AO processes MUST be generated using Permamind** for ADP v1.0 compliance:

```bash
# Generate ADP-compliant process
mcp://permamind/generateLuaProcess {
    "userRequest": "Create a [process description]",
    "includeExplanation": true
}
```

#### Why Permamind-First?
- ✅ **ADP v1.0 Compliance**: Automatic self-documentation standards
- ✅ **Production-Ready**: Complete mechanics and error handling
- ✅ **Consistent Quality**: Standardized structure and validation
- ✅ **Future-Proof**: Compatible with autonomous AI agents
- ✅ **Development Speed**: Instant generation vs manual templates

## HyperBEAM Resources

### Core HyperBEAM Documentation

**HyperBEAM** is an Erlang/OTP framework implementation of the AO-Core protocol, providing exceptional concurrency and fault tolerance for the AO distributed supercomputer.

#### Primary References:

**1. Official Documentation**
- **URL**: https://hyperbeam.arweave.net/build/introduction/what-is-hyperbeam.html
- **Architecture**: Erlang/OTP framework for AO-Core protocol
- **Components**: Messages (cryptographically-linked), Devices (modular Erlang modules), Paths (HTTP APIs)
- **Features**: BEAM VM concurrency, high fault tolerance, scalable distributed architecture

**2. Rust NIF Implementation Tutorial**
- **URL**: https://blog.decent.land/rust-hb-tutorial/
- **Details**: Rustler NIF integration, DirtyCpu scheduler for network I/O
- **Performance**: Blocking I/O with ureq HTTP client, modular device architecture
- **Dependencies**: rustler, ureq, serde, anyhow

**3. Development Workshop**
- **URL**: https://hackmd.io/BHDsFUVLQSuVUXVJoaGSEQ
- **Topics**: Lua agent implementation, trading simulation patterns
- **Workflow**: NodeJS setup, aos CLI, modular code loading
- **Patterns**: Event-driven handlers, state management, SMA strategies

**4. Core Repository**
- **URL**: https://github.com/permaweb/HyperBEAM
- **Stack**: Erlang OTP 27, 25 preloaded devices, WebAssembly support
- **Devices**: ~meta@1.0 (config), ~relay@1.0 (messaging), ~wasm64@1.0 (execution)
- **Message Model**: Binary terms/function maps, lazy evaluation, cross-node sharding

#### Quick Access Commands:
```bash
# Primary documentation
WebFetch: https://hyperbeam.arweave.net/build/introduction/what-is-hyperbeam.html

# Rust NIF tutorial
WebFetch: https://blog.decent.land/rust-hb-tutorial/

# Development workshop
WebFetch: https://hackmd.io/BHDsFUVLQSuVUXVJoaGSEQ

# Core repository
WebFetch: https://github.com/permaweb/HyperBEAM
```

## MCP Best Practices

- **Memory Management**: Use permamind for context persistence across sessions
- **Documentation Access**: Leverage MCP documentation servers for real-time technical docs
- **HyperBEAM Resources**: Reference documentation section for architecture details
- **Permanent Storage**: Use aolite docs for permanent storage implementations
- **Decentralized Development**: Use harlequin-toolkit for Permaweb applications

---

**Last Updated**: 2025-10-20

**Documentation Sources**:
- [Claude Agent Skills Overview](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview)
- [Claude Cookbooks MCP Server](https://github.com/anthropics/claude-cookbooks)
- [Permamind Repository](https://github.com/ALLiDoizCode/Permamind)
- [aolite Repository](https://github.com/perplex-labs/aolite)
- [harlequin-toolkit Repository](https://github.com/the-permaweb-harlequin/harlequin-toolkit)
- [HyperBEAM Documentation](https://hyperbeam.arweave.net)
- [HyperBEAM Repository](https://github.com/permaweb/HyperBEAM)

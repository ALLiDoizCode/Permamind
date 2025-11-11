---
name: ao
version: 1.0.4
author: Permamind Team
description: Learn AO protocol fundamentals - processes, message passing, handlers, and ADP compliance
tags: ["ao", "blockchain", "tutorial"]
dependencies:
  - name: aolite
    version: 1.0.1
  - name: aoconnect
    version: 1.0.0
changelog: |
  ## v1.0.4
  - Test publish with Epic 13 CLI improvements
  - Validates mcpServers field support and MCP dependency detection

  ## v1.0.3
  - Added aoconnect dependency for JavaScript SDK integration
  - Updated dependency chain to include aoconnect library
---

# AO Protocol Skill

## What is AO?

**AO (Actor Oriented)** is a decentralized supercomputer built on Arweave, providing permanent, scalable compute for the Permaweb. Unlike traditional blockchain VMs that execute in a single shared environment, AO processes are autonomous actors that communicate through message passing.

**Key Characteristics:**

- **Actor-Based Architecture**: Each process is an independent actor with isolated state
- **Message-Driven Communication**: Processes interact exclusively through message passing
- **HyperBEAM Implementation**: Built on Erlang/OTP for exceptional concurrency and fault tolerance
- **Permanent Compute**: Process code and state stored on Arweave for permanent availability
- **Decentralized Execution**: Distributed across nodes for scalability

**Core Components:**

1. **Messages**: Cryptographically-linked communication between processes
2. **Devices**: Modular Erlang modules providing specialized functionality
3. **Paths**: HTTP APIs for external interaction with processes

AO enables developers to build permanent, autonomous applications that run forever on the Permaweb.

## When to Use This Skill

This skill activates when you need to:

- **Learn AO fundamentals** - Understand the AO protocol, process model, and architecture
- **Build AO processes** - Create new processes with handlers and state management
- **Understand message patterns** - Learn how processes communicate via ao.send()
- **Implement handlers** - Set up message routing with the Handlers pattern
- **Achieve ADP compliance** - Make processes self-documenting for autonomous tool integration
- **Debug AO code** - Understand common patterns and anti-patterns
- **Work with aoconnect** - Integrate with the official AO SDK

If you're asking about "AO processes", "message passing", "handlers", or "ADP protocol", this skill provides the foundational knowledge you need.

## AO Process Model

AO processes are autonomous actors with independent state that communicate through message passing.

**Process Characteristics:**

```
┌─────────────────────────────────┐
│     AO Process (Actor)          │
├─────────────────────────────────┤
│  • Unique Process ID (43 chars) │
│  • Independent Lua State        │
│  • Message Handler Registry     │
│  • Global State Tables          │
└─────────────────────────────────┘
         ▲           │
         │ Messages  │ Responses
         │           ▼
    ┌────────────────────────┐
    │   Other Processes      │
    │   External Clients     │
    └────────────────────────┘
```

**Process Lifecycle:**

1. **Spawn**: Create new process with `spawnProcess()` (gets unique ID)
2. **Initialize**: Load Lua code via `evalProcess()` to register handlers
3. **Execute**: Process incoming messages, update state, send responses
4. **Persist**: State maintained across messages (permanent on Arweave)

**Process Isolation:**

- Each process has independent Lua VM state
- No shared memory between processes
- Communication only through message passing
- Monolithic design (no external dependencies except json)

**State Management:**

```lua
-- Process state stored in global Lua tables
Users = Users or {}
Transactions = Transactions or {}

-- State persists across message handling
function updateUser(userId, data)
    Users[userId] = data
end
```

## Message Passing in AO

Processes communicate exclusively through message passing using `ao.send()`.

**Sending Messages:**

```lua
ao.send({
    Target = "process-id-here",       -- Recipient process ID
    Action = "Transfer",              -- Action identifier
    Quantity = "100",                 -- Tag values (strings only)
    Recipient = "recipient-address",
    Data = json.encode(complexData)   -- Complex structures in Data field
})
```

**Message Structure:**

Every incoming message (`msg`) contains:

- `msg.From` - Sender's process ID or address
- `msg.Id` - Unique message identifier
- `msg.Timestamp` - Unix timestamp (use this, NOT os.time())
- `msg.Tags` - Key-value pairs (Action, Quantity, etc.)
- `msg.Data` - Raw data payload (string)

**Tags vs Data Field Usage:**

**Use Tags for:**
- Simple identifiers: `SpeciesId`, `UserId`, `OrderId`
- Enum-like values: `Action`, `Type`, `Status`
- Small strings/numbers: `Name`, `Level`, `Amount`
- Boolean flags: `Confirmed`, `Active` (as "true"/"false" strings)

**CRITICAL**: All tag values MUST be strings:
```lua
-- ✅ CORRECT
ao.send({
    Target = msg.From,
    ItemId = tostring(123),      -- Number to string
    Success = "true",            -- Boolean as string
    Count = tostring(result.count)
})

-- ❌ WRONG - tags must be strings
ao.send({
    Target = msg.From,
    ItemId = 123,        -- Raw number fails
    Success = true       -- Boolean fails
})
```

**Use Data Field for:**
- Complex objects: `{user: {...}, items: [...]}`
- Large text content: documentation, descriptions, logs
- Binary data: images, files, encrypted payloads
- Arrays/lists: multiple items, batch operations

**Response Pattern:**

```lua
-- Simple response with tags
ao.send({
    Target = msg.From,
    Action = "Success",
    Result = "Operation completed",
    ItemId = tostring(itemId)
})

-- Complex response with Data field
ao.send({
    Target = msg.From,
    Action = "Response",
    Data = json.encode({
        items = itemsList,
        total = totalCount,
        metadata = metaInfo
    })
})
```

**Tag Naming Conventions:**
- **PascalCase**: `SpeciesId`, `PlayerName`, `BattleId`
- **Provide alternatives**: `msg.SpeciesId or msg.Id`
- **Type conversion**: `tonumber(msg.SpeciesId)`
- **Boolean checks**: `msg.Confirmed == "true"`

## Handler Pattern in AO

Handlers route incoming messages to processing functions using pattern matching.

**Handler Registration:**

```lua
Handlers.add(
    "handler-name",                              -- Unique handler identifier
    Handlers.utils.hasMatchingTag("Action", "ActionName"),  -- Pattern matcher
    function(msg)                                -- Handler function
        -- Process message and send response
    end
)
```

**REQUIRED Pattern: Individual Handlers Per Action**

```lua
-- ✅ CORRECT: One handler per action
Handlers.add("transfer",
    Handlers.utils.hasMatchingTag("Action", "Transfer"),
    function(msg)
        -- Validate
        if not msg.Recipient or not msg.Quantity then
            ao.send({
                Target = msg.From,
                Action = "Error",
                Error = "Recipient and Quantity required"
            })
            return
        end

        -- Process
        local result = processTransfer(msg)

        -- Respond
        ao.send({
            Target = msg.From,
            Action = "Success",
            Data = json.encode(result)
        })
    end
)

-- ❌ FORBIDDEN: Multi-action handlers
Handlers.add("multi",
    Handlers.utils.hasMatchingTag("Action", {"Action1", "Action2"}),
    function(msg) end
)

-- ❌ FORBIDDEN: Direct assignment
Handlers["transfer"] = function(msg) end
```

**Handler Function Structure:**

1. **Validate Input**: Check required fields, return errors early
2. **Process Logic**: Execute business logic, update state
3. **Send Response**: Always use ao.send(), never return values

**Error Handling Strategy:**

**CRITICAL**: Avoid unnecessary pcall usage. Let processes fail fast with clear error messages.

```lua
-- ✅ CORRECT: Direct validation (most cases)
local userId = msg.UserId or msg.Id
if not userId then
    ao.send({
        Target = msg.From,
        Action = "Error",
        Error = "UserId required"
    })
    return
end

local user = getUserById(tonumber(userId))
if not user then
    ao.send({
        Target = msg.From,
        Action = "Error",
        Error = "User not found"
    })
    return
end

-- ✅ ACCEPTABLE: pcall only for truly fallible operations
local success, data = pcall(json.decode, msg.Data)
if not success then
    ao.send({
        Target = msg.From,
        Action = "Error",
        Error = "Invalid JSON in Data field"
    })
    return
end

-- ❌ WRONG: Unnecessary pcall wrapping
local success, result = pcall(function()
    return getUserById(id)  -- Simple lookup never fails
end)
```

**When to use pcall (LIMITED):**
- JSON parsing of untrusted external input
- Mathematical overflow/underflow risks
- File I/O operations (if available)

**When NOT to use pcall (MOST CASES):**
- Simple table lookups
- Basic parameter validation
- Handler logic (should fail fast)
- JSON parsing of AO message data (controlled input)
- Entire handler wrapping (masks errors)

## ADP Protocol (v1.0)

**ADP (AO Documentation Protocol)** is a standardized protocol enabling processes to self-document their capabilities for autonomous tool integration.

**Core Requirements:**

1. **Protocol Identifier**: `adpVersion: "1.0"`
2. **Info Handler**: Responds to `Action: "Info"` with process metadata
3. **Message Schemas**: Defined schemas for all message types
4. **Process Metadata**: Name, version, capabilities
5. **Self-Documentation**: Queryable capabilities

**Benefits:**

- **Autonomous Integration**: AI tools discover and interact automatically
- **Self-Documenting**: Reduces maintenance overhead
- **Standardized Discovery**: Consistent capability queries
- **Future-Proof**: Compatible with evolving AO ecosystem

**Implementation Example:**

```lua
Handlers.add("info",
    Handlers.utils.hasMatchingTag("Action", "Info"),
    function(msg)
        ao.send({
            Target = msg.From,
            Action = "SaveState",
            Data = json.encode({
                process = {
                    name = "TokenContract",
                    version = "1.0.0",
                    adpVersion = "1.0",
                    capabilities = {"transfer", "balance", "mint"},
                    messageSchemas = {
                        Transfer = {
                            required = {"Action", "Recipient", "Quantity"},
                            optional = {"Data"}
                        },
                        Balance = {
                            required = {"Action"},
                            optional = {"Target"}
                        }
                    }
                },
                handlers = {"transfer", "balance", "mint", "info"},
                documentation = {
                    adpCompliance = "v1.0",
                    selfDocumenting = true,
                    repository = "https://github.com/example/token"
                }
            })
        })
    end
)
```

**Querying Process Capabilities:**

```lua
-- Send Info request to any ADP-compliant process
ao.send({
    Target = "process-id",
    Action = "Info"
})

-- Receive comprehensive process documentation
-- Use this to understand available handlers and message formats
```

## Code Examples

### Example 1: Basic Handler Setup (ADP Info Handler)

```lua
-- Info handler for ADP v1.0 compliance
-- Responds with process metadata for self-documentation
Handlers.add("info",
    Handlers.utils.hasMatchingTag("Action", "Info"),
    function(msg)
        -- Build comprehensive process information
        local processInfo = {
            process = {
                name = "MyProcess",
                version = "1.0.0",
                adpVersion = "1.0",
                capabilities = {"create", "update", "query"}
            },
            handlers = {"create", "update", "query", "info"}
        }

        -- Send response with process metadata
        ao.send({
            Target = msg.From,           -- Reply to sender
            Action = "SaveState",        -- Standard ADP response action
            Data = json.encode(processInfo)  -- JSON-encoded metadata
        })
    end
)
```

### Example 2: Message Handling with Validation

```lua
-- Handler for creating items with validation
Handlers.add("create-item",
    Handlers.utils.hasMatchingTag("Action", "CreateItem"),
    function(msg)
        -- Validate required fields
        local itemName = msg.Name
        if not itemName or itemName == "" then
            ao.send({
                Target = msg.From,
                Action = "Error",
                Error = "Name is required"
            })
            return
        end

        -- Parse Data field if present
        local itemData = {}
        if msg.Data and msg.Data ~= "" then
            itemData = json.decode(msg.Data)
        end

        -- Process logic
        local newItem = {
            id = #Items + 1,
            name = itemName,
            owner = msg.From,
            created = msg.Timestamp,  -- Use msg.Timestamp, NOT os.time()
            metadata = itemData
        }

        -- Store in global state
        Items = Items or {}
        Items[newItem.id] = newItem

        -- Send success response
        ao.send({
            Target = msg.From,
            Action = "ItemCreated",
            ItemId = tostring(newItem.id),  -- Convert to string
            Name = newItem.name
        })
    end
)
```

### Example 3: State Management

```lua
-- Initialize global state tables (persist across messages)
Balances = Balances or {}
TotalSupply = TotalSupply or 0

-- Handler managing persistent state
Handlers.add("transfer",
    Handlers.utils.hasMatchingTag("Action", "Transfer"),
    function(msg)
        -- Extract parameters
        local recipient = msg.Recipient
        local quantity = tonumber(msg.Quantity)
        local sender = msg.From

        -- Validate inputs
        if not recipient then
            ao.send({Target = msg.From, Action = "Error", Error = "Recipient required"})
            return
        end

        if not quantity or quantity <= 0 then
            ao.send({Target = msg.From, Action = "Error", Error = "Invalid quantity"})
            return
        end

        -- Check sender balance
        local senderBalance = Balances[sender] or 0
        if senderBalance < quantity then
            ao.send({Target = msg.From, Action = "Error", Error = "Insufficient balance"})
            return
        end

        -- Update state (persist across messages)
        Balances[sender] = senderBalance - quantity
        Balances[recipient] = (Balances[recipient] or 0) + quantity

        -- Record transaction with timestamp
        Transactions = Transactions or {}
        table.insert(Transactions, {
            from = sender,
            to = recipient,
            amount = quantity,
            timestamp = msg.Timestamp  -- Use msg.Timestamp for time tracking
        })

        -- Send success response
        ao.send({
            Target = msg.From,
            Action = "TransferSuccess",
            From = sender,
            Recipient = recipient,
            Quantity = tostring(quantity),
            NewBalance = tostring(Balances[sender])
        })

        -- Notify recipient
        ao.send({
            Target = recipient,
            Action = "CreditNotice",
            From = sender,
            Quantity = tostring(quantity)
        })
    end
)
```

## Critical AO Compliance Rules

**Forbidden Operations:**

- ❌ `require()` - No external modules (except `require("json")` is permitted)
- ❌ `os.time()` - Use `msg.Timestamp` instead
- ❌ `io` library - No file system access
- ❌ `debug` library - Debug library unavailable
- ❌ Network operations - Only through ao.send()
- ❌ Module-level returns - Use ao.send() only

**Available AO Globals:**

- ✅ `ao.send()` - Send messages to other processes
- ✅ `ao.id` - Current process ID
- ✅ `Handlers` - Message handler registry
- ✅ `json` - JSON encode/decode utilities
- ✅ Standard Lua: `string`, `table`, `math`, `os` (limited)

**Monolithic Design:**

```lua
-- ❌ FORBIDDEN: External dependencies
local utils = require('utils')

-- ✅ REQUIRED: Embed all dependencies
local function validateInput(data)
    -- Embedded utility function
    return data and data ~= ""
end
```

## Resources

### aoconnect Library

**Official AO SDK for JavaScript/TypeScript applications**

- **Package**: `@permaweb/aoconnect`
- **Version**: ^0.0.53
- **Purpose**: Official AO integration library for message passing and registry queries
- **Use Cases**: Node.js apps, CLI tools, web frontends interacting with AO processes
- **Installation**: `npm install @permaweb/aoconnect`

**Key Functions:**
- `connect()` - Connect to AO network
- `message()` - Send messages to processes
- `result()` - Query message results
- `spawn()` - Spawn new processes
- `dryrun()` - Test messages without state changes

### aolite (Local AO Emulation)

**Local, concurrent emulation of Arweave AO protocol for testing**

- **Repository**: https://github.com/perplex-labs/aolite
- **Purpose**: Test AO processes locally without network deployment
- **Requirements**: Lua 5.3
- **Features**:
  - Coroutine-based concurrent process emulation
  - Queue-based inter-process messaging
  - Direct state access for debugging
  - Manual or automatic message scheduling
  - Configurable logging (levels 0-3)

**Core API:**
```lua
-- Load and spawn processes
spawnProcess(code)  -- From string or file

-- Inter-process messaging
send(from, to, message)

-- Code evaluation in process context
eval(processId, code)

-- Message retrieval
getAllMsgs(processId)

-- Execute scheduling
runScheduler()

-- Configure logging
setMessageLog(level)  -- 0=off, 1=basic, 2=detailed, 3=verbose
```

**Workflow:**
1. Spawn test processes with `spawnProcess()`
2. Send test messages with `send()`
3. Run scheduler to process messages
4. Inspect state and results
5. Iterate and debug locally

### Official AO Documentation

**HyperBEAM Documentation**
- **URL**: https://hyperbeam.arweave.net/build/introduction/what-is-hyperbeam.html
- **Topics**: Architecture, Erlang/OTP framework, AO-Core protocol, message model, devices

**AO Development Workshop**
- **URL**: https://hackmd.io/BHDsFUVLQSuVUXVJoaGSEQ
- **Topics**: Lua agent implementation, trading patterns, event-driven handlers, aos CLI

**HyperBEAM GitHub Repository**
- **URL**: https://github.com/permaweb/HyperBEAM
- **Stack**: Erlang OTP 27, 25 preloaded devices, WebAssembly support
- **Components**: ~meta@1.0 (config), ~relay@1.0 (messaging), ~wasm64@1.0 (execution)

## Best Practices

**Handler Design:**
- One handler per action (no multi-action handlers)
- Validate inputs early, return errors immediately
- Use descriptive handler names matching actions
- Keep handler functions focused and readable

**State Management:**
- Initialize globals with `or {}` pattern for persistence
- Use msg.Timestamp for time tracking (never os.time())
- Keep state structure simple and queryable
- Document state schema in comments

**Message Passing:**
- All tag values must be strings (use tostring())
- Complex data in Data field as JSON
- Always respond to sender (msg.From)
- Use clear Action names for responses

**Error Handling:**
- Fail fast with clear error messages
- Avoid unnecessary pcall usage
- Return early on validation failures
- Provide actionable error messages

**ADP Compliance:**
- Implement Info handler for self-documentation
- Document all handler message schemas
- List all capabilities in Info response
- Keep documentation current with code

**Testing:**
- Use aolite for local testing before deployment
- Test handler validation logic thoroughly
- Verify state persistence across messages
- Test error cases and edge conditions

---

**Version**: 1.0.0
**Last Updated**: 2025-10-22
**ADP Compliance**: v1.0

---
name: ao
version: 1.0.9
author: Permamind Team
description: Learn AO protocol fundamentals - processes, message passing, handlers, and ADP compliance
tags: ["ao", "blockchain", "tutorial"]
dependencies:
  - name: aolite
    version: 1.0.1
  - name: aoconnect
    version: 1.0.0
changelog: |
  ## Changed (v1.0.9)
  - Version bump for registry update

  ## Changed (v1.0.8)
  - Testing cache fix for publish service

  ## Changed (v1.0.7)
  - Testing MCP publish functionality

  ## Changed (v1.0.6)
  - Minor documentation updates and improvements

  ## Added (v1.0.5)
  - Building with HyperBEAM section covering dynamic reads and state exposure
  - Dynamic reads documentation for compute-on-demand patterns
  - State exposure via HTTP using patch device
  - Practical implementation patterns for token and chat processes
  - JavaScript integration strategies with AOProcessClient class
  - Best practices for HyperBEAM state management, performance, and security

  ## Changed (v1.0.4)
  - Updated ADP v1.0 specification: Info handler response no longer includes Action tag
  - Added strict handler metadata format with read/write indicators
  - Added complete tag specifications including types, required/optional status, and descriptions
  - Enhanced self-documentation capabilities for autonomous tool integration

  ## Added (v1.0.3)
  - aoconnect dependency for JavaScript SDK integration

  ## Changed (v1.0.3)
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
3. **No Action Tag in Response**: Info handler MUST NOT include an Action tag in the response
4. **Strict Handler Metadata**: Complete specification of all handlers with:
   - Handler name and action
   - Type indicator: `"read"` (dryrun) or `"write"` (send)
   - Description of handler purpose
   - Complete tag specifications (required and optional)
   - Tag value types (all are strings in AO)
   - Expected response format
5. **Process Metadata**: Name, version, capabilities
6. **Self-Documentation**: Queryable capabilities

**Handler Type Specification:**

- **`"read"`**: Handler only queries state, safe for dryrun operations (no state modification)
- **`"write"`**: Handler modifies process state, requires send operation (state changes persist)

**Tag Specification Format:**

Each tag must include:
- `name`: Tag name (e.g., "Action", "Recipient", "Quantity")
- `type`: Value type (always "string" in AO - even for numbers)
- `value`: Fixed value if applicable (e.g., Action tag always has specific value)
- `description`: What the tag represents (for non-fixed values)

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
            Data = json.encode({
                process = {
                    name = "TokenContract",
                    version = "1.0.0",
                    adpVersion = "1.0",
                    capabilities = {"transfer", "balance", "mint"}
                },
                handlers = {
                    {
                        name = "transfer",
                        action = "Transfer",
                        type = "write",
                        description = "Transfer tokens between accounts",
                        tags = {
                            required = {
                                {name = "Action", type = "string", value = "Transfer"},
                                {name = "Recipient", type = "string", description = "Recipient address"},
                                {name = "Quantity", type = "string", description = "Amount to transfer (as string)"}
                            },
                            optional = {}
                        },
                        response = {
                            tags = {
                                {name = "Action", type = "string", value = "TransferSuccess"},
                                {name = "From", type = "string"},
                                {name = "Recipient", type = "string"},
                                {name = "Quantity", type = "string"},
                                {name = "NewBalance", type = "string"}
                            }
                        }
                    },
                    {
                        name = "balance",
                        action = "Balance",
                        type = "read",
                        description = "Query account balance",
                        tags = {
                            required = {
                                {name = "Action", type = "string", value = "Balance"}
                            },
                            optional = {
                                {name = "Target", type = "string", description = "Address to query (defaults to sender)"}
                            }
                        },
                        response = {
                            tags = {
                                {name = "Action", type = "string", value = "BalanceResponse"},
                                {name = "Balance", type = "string"},
                                {name = "Target", type = "string"}
                            }
                        }
                    },
                    {
                        name = "mint",
                        action = "Mint",
                        type = "write",
                        description = "Create new tokens",
                        tags = {
                            required = {
                                {name = "Action", type = "string", value = "Mint"},
                                {name = "Quantity", type = "string", description = "Amount to mint (as string)"}
                            },
                            optional = {}
                        },
                        response = {
                            tags = {
                                {name = "Action", type = "string", value = "MintSuccess"},
                                {name = "Quantity", type = "string"},
                                {name = "TotalSupply", type = "string"}
                            }
                        }
                    },
                    {
                        name = "info",
                        action = "Info",
                        type = "read",
                        description = "Get process metadata and handler information (ADP v1.0)",
                        tags = {
                            required = {
                                {name = "Action", type = "string", value = "Info"}
                            },
                            optional = {}
                        },
                        response = {
                            data = "JSON object with process metadata and handlers schema"
                        }
                    }
                },
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
        -- Build comprehensive process information with strict handler metadata
        local processInfo = {
            process = {
                name = "MyProcess",
                version = "1.0.0",
                adpVersion = "1.0",
                capabilities = {"create", "update", "query"}
            },
            handlers = {
                {
                    name = "create",
                    action = "CreateItem",
                    type = "write",  -- This handler modifies state
                    description = "Create a new item",
                    tags = {
                        required = {
                            {name = "Action", type = "string", value = "CreateItem"},
                            {name = "Name", type = "string", description = "Item name"}
                        },
                        optional = {
                            {name = "Description", type = "string", description = "Item description"}
                        }
                    },
                    response = {
                        tags = {
                            {name = "Action", type = "string", value = "ItemCreated"},
                            {name = "ItemId", type = "string"},
                            {name = "Name", type = "string"}
                        }
                    }
                },
                {
                    name = "query",
                    action = "Query",
                    type = "read",  -- This handler only reads state
                    description = "Query items by ID",
                    tags = {
                        required = {
                            {name = "Action", type = "string", value = "Query"},
                            {name = "ItemId", type = "string", description = "Item ID to query"}
                        },
                        optional = {}
                    },
                    response = {
                        data = "JSON object with item details"
                    }
                },
                {
                    name = "info",
                    action = "Info",
                    type = "read",  -- Info handler is always read-only
                    description = "Get process metadata and handler information (ADP v1.0)",
                    tags = {
                        required = {
                            {name = "Action", type = "string", value = "Info"}
                        },
                        optional = {}
                    },
                    response = {
                        data = "JSON object with process metadata and handlers schema"
                    }
                }
            }
        }

        -- Send response WITHOUT Action tag (ADP v1.0 requirement)
        ao.send({
            Target = msg.From,           -- Reply to sender
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

## Building with HyperBEAM

HyperBEAM provides modern patterns for accessing AO process state and enabling dynamic computations without traditional dry-run patterns.

### Dynamic Reads: Compute on Demand

**Dynamic reads** enable on-the-fly computations without modifying process state. You can execute Lua transformation scripts against cached process state in real-time via HTTP.

**Transformation Functions:**

Create Lua scripts that transform base state and upload them to Arweave:

```lua
-- circulating-supply.lua - Example transformation script
function calculate(base, req)
  local totalSupply = 0
  local holderCount = 0

  if base.balances then
    for address, balance in pairs(base.balances) do
      local numBalance = tonumber(balance) or 0
      totalSupply = totalSupply + numBalance
      holderCount = holderCount + 1
    end
  end

  return {
    CirculatingSupply = tostring(math.floor(totalSupply)),
    HolderCount = tostring(holderCount),
    LastCalculated = os.time()
  }
end
```

**Publication Workflow:**

1. Upload transformation script to Arweave using ARX CLI tool
2. Get the script's transaction ID
3. Call via HyperBEAM URL with script ID and function name
4. Integrate into applications via JavaScript SDK

**JavaScript Implementation:**

```javascript
async function getCirculatingSupply(processId, scriptTxId) {
  const url = `https://forward.computer/${processId}~process@1.0/now/~lua@5.3a&module=${scriptTxId}/calculate/serialize~json@1.0`;
  const response = await fetch(url);
  return await response.json();
}
```

### State Exposure via HTTP

**The Patch Device:**

Use `Send({device = 'patch@1.0', ...})` to make process state immediately readable via HTTP GET requests to `forward.computer` endpoints. This allows external applications to access specific state keys like counters, user data, and balances directly.

**Initial State Sync Pattern:**

Critical data becomes immediately accessible through one-time synchronization:

```lua
-- Initialize sync status
InitialSync = InitialSync or 'INCOMPLETE'

if InitialSync == 'INCOMPLETE' then
  -- Expose initial state via patch device
  Send({
    device = 'patch@1.0',
    balances = Balances,
    totalsupply = TotalSupply
  })
  InitialSync = 'COMPLETE'
end
```

**IMPORTANT**: The patch device uses `Send()` (capital S) instead of `ao.send()`. This is a HyperBEAM-specific API.

### Practical Implementation Patterns

**Token Process with State Exposure:**

```lua
Handlers.add("Transfer",
  Handlers.utils.hasMatchingTag("Action", "Transfer"),
  function(msg)
    -- Validate inputs
    local amount = tonumber(msg.Quantity)
    local target = msg.Recipient
    local sender = msg.From

    if not target or not amount or amount <= 0 then
      ao.send({
        Target = msg.From,
        Action = "Error",
        Error = "Invalid transfer parameters"
      })
      return
    end

    -- Check balance
    local senderBalance = tonumber(Balances[sender]) or 0
    if senderBalance < amount then
      ao.send({
        Target = msg.From,
        Action = "Error",
        Error = "Insufficient balance"
      })
      return
    end

    -- Process transfer
    Balances[sender] = tostring(senderBalance - amount)
    Balances[target] = tostring((tonumber(Balances[target]) or 0) + amount)

    -- Expose updated state via patch device
    Send({device = 'patch@1.0', balances = Balances})

    -- Send success response
    ao.send({
      Target = msg.From,
      Action = "TransferSuccess",
      Recipient = target,
      Quantity = msg.Quantity
    })
  end
)
```

**Chat Process with HTTP-Accessible State:**

```lua
-- Initialize state
Messages = Messages or {}
Users = Users or {}

Handlers.add("AddMessage",
  Handlers.utils.hasMatchingTag("Action", "AddMessage"),
  function(msg)
    -- Validate message content
    if not msg.Data or msg.Data == "" then
      ao.send({
        Target = msg.From,
        Action = "Error",
        Error = "Message content required"
      })
      return
    end

    -- Add message to state
    local messageId = tostring(#Messages + 1)
    Messages[messageId] = {
      user = msg.From,
      content = msg.Data,
      timestamp = msg.Timestamp
    }

    -- Track user
    Users[msg.From] = Users[msg.From] or {
      firstMessage = msg.Timestamp,
      messageCount = 0
    }
    Users[msg.From].messageCount = Users[msg.From].messageCount + 1
    Users[msg.From].lastMessage = msg.Timestamp

    -- Expose updated state via patch device
    Send({device = 'patch@1.0', messages = Messages, users = Users})

    -- Respond with success
    ao.send({
      Target = msg.From,
      Action = "MessageAdded",
      MessageId = messageId
    })
  end
)
```

### Integration Strategies

**AOProcessClient Class (JavaScript):**

```javascript
class AOProcessClient {
  constructor(processId, hyperbeamUrl = 'https://forward.computer') {
    this.processId = processId;
    this.hyperbeamUrl = hyperbeamUrl;
  }

  // Get state key via patch device
  async getState(key) {
    const url = `${this.hyperbeamUrl}/${this.processId}~process@1.0/compute/${key}`;
    const response = await fetch(url);
    return await response.text();
  }

  // Execute dynamic read transformation
  async getDynamicResult(scriptTxId, functionName) {
    const url = `${this.hyperbeamUrl}/${this.processId}~process@1.0/now/~lua@5.3a&module=${scriptTxId}/${functionName}/serialize~json@1.0`;
    const response = await fetch(url);
    return await response.json();
  }

  // Get balances example
  async getBalances() {
    return JSON.parse(await this.getState('balances'));
  }

  // Get messages example
  async getMessages() {
    return JSON.parse(await this.getState('messages'));
  }
}

// Usage
const client = new AOProcessClient('your-process-id');
const balances = await client.getBalances();
const messages = await client.getMessages();
```

### Best Practices for HyperBEAM

**State Management:**

- Use descriptive, lowercase cache keys for patch device
- Batch state updates when possible to reduce patch calls
- Initialize sync for critical data that needs immediate availability
- Consider what state external applications need to access

**Performance:**

- Patch frequently updated data for real-time external access
- Use dynamic reads for complex computations that don't need caching
- Minimize payload sizes in patch device calls
- Cache transformation script results on client side when appropriate

**Security:**

- Validate all handler inputs before processing
- Enforce permission checks before state modifications
- Implement rate limiting for expensive operations
- Never expose sensitive data via HTTP endpoints
- Remember that patched state is publicly readable

**Dynamic Read Scripts:**

- Keep transformation functions pure (no side effects)
- Return JSON-serializable data structures
- Document expected base state structure
- Test transformations locally before uploading to Arweave
- Version your transformation scripts

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

**Version**: 1.0.5
**Last Updated**: 2025-11-15
**ADP Compliance**: v1.0

---
name: aolite
version: 1.0.1
author: Permamind Team
description: Testing framework for AO processes - simulate message passing, handlers, and process interactions locally
tags: ["ao", "testing", "development", "aolite"]
dependencies: []
license: MIT
---

# aolite - Local AO Testing Framework

## What is aolite?

**aolite** is a local AO protocol emulation framework that enables testing AO processes without network deployment. It provides concurrent process emulation, message passing simulation, and direct state inspection for rapid development workflows.

## When to Use This Skill

Use aolite when you need to:
- Test AO processes locally before deployment
- Simulate message passing between processes
- Debug handler logic without network delays
- Validate process state transformations
- Develop AO applications iteratively

## Key Features

### Local Process Emulation
- Coroutine-based concurrent process management
- Queue-based inter-process message passing
- Direct state access for inspection
- No network dependency

### Message Simulation
- `spawnProcess()` - Load processes from string or file
- `send()` - Inter-process messaging
- `eval()` - Code evaluation in process context
- `getAllMsgs()` - Message retrieval
- `runScheduler()` - Execute scheduling

### Development Workflow
```lua
-- Load aolite
local aolite = require('aolite')

-- Spawn a process
local process1 = aolite.spawnProcess([[
  Handlers.add("ping",
    Handlers.utils.hasMatchingTag("Action", "Ping"),
    function(msg)
      ao.send({Target = msg.From, Action = "Pong"})
    end
  )
]])

-- Send message
aolite.send({
  Target = process1,
  Action = "Ping",
  From = "test-sender"
})

-- Run scheduler
aolite.runScheduler()

-- Check messages
local messages = aolite.getAllMsgs(process1)
print(messages[1].Action) -- "Pong"
```

## Configuration

### Logging Levels
- `0` - Silent
- `1` - Errors only
- `2` - Warnings and errors
- `3` - Verbose (all messages)

```lua
aolite.setMessageLog(3) -- Enable verbose logging
```

### Scheduler Modes
- Manual: Call `runScheduler()` explicitly
- Automatic: Messages processed immediately

## Best Practices

### 1. Test Handlers Individually
```lua
-- Test each handler in isolation
local testMsg = {
  Action = "ProcessData",
  Data = '{"value": 42}',
  From = "test-caller"
}

aolite.send(testMsg)
aolite.runScheduler()
```

### 2. Verify State Changes
```lua
-- Access process state directly
local state = aolite.getState(process1)
assert(state.counter == 5, "Counter should be 5")
```

### 3. Simulate Multi-Process Communication
```lua
-- Spawn multiple processes
local tokenProcess = aolite.spawnProcess(tokenCode)
local daoProcess = aolite.spawnProcess(daoCode)

-- Send between processes
aolite.send({
  Target = tokenProcess,
  Action = "Transfer",
  From = daoProcess
})
```

## Integration with AO Development

### Development Cycle
1. **Write** - Develop handlers in Lua
2. **Test** - Use aolite for local testing
3. **Iterate** - Debug and refine
4. **Deploy** - Load into AO process
5. **Verify** - Test on mainnet

### Common Use Cases

**Unit Testing:**
- Test individual handler logic
- Validate state transitions
- Check error handling

**Integration Testing:**
- Multi-process interactions
- Message passing flows
- State synchronization

**Debugging:**
- Step through handler execution
- Inspect intermediate state
- Trace message flows

## Requirements

- Lua 5.3+
- aolite library installed

## Installation

```bash
# Install via skills CLI
skills install aolite

# Or clone repository
git clone https://github.com/perplex-labs/aolite
```

## Resources

- **Repository:** https://github.com/perplex-labs/aolite
- **Documentation:** See aolite README
- **Examples:** Check examples/ directory
- **AO Processes:** Use with any AO Lua code

## Example: Testing Token Transfer

```lua
local aolite = require('aolite')

-- Load token process
local token = aolite.spawnProcess(tokenProcessCode)

-- Initial state
aolite.eval(token, [[
  Balances = {
    alice = 1000,
    bob = 500
  }
]])

-- Send transfer message
aolite.send({
  Target = token,
  Action = "Transfer",
  Recipient = "bob",
  Quantity = "100",
  From = "alice"
})

-- Process message
aolite.runScheduler()

-- Verify balances
local state = aolite.getState(token)
assert(state.Balances.alice == 900)
assert(state.Balances.bob == 600)
```

## Troubleshooting

### Process not spawning
**Issue:** `spawnProcess()` returns nil

**Solution:**
- Check Lua syntax in process code
- Verify all required handlers defined
- Review error logs

### Messages not processed
**Issue:** `getAllMsgs()` returns empty

**Solution:**
- Call `runScheduler()` after sending messages
- Check handler patterns match message tags
- Enable verbose logging: `setMessageLog(3)`

### State not updating
**Issue:** State remains unchanged after messages

**Solution:**
- Verify handler modifies global state
- Check ao.send() called correctly
- Inspect handler execution with logging

## Next Steps

After installing aolite:
- Read the documentation
- Run example tests
- Integrate into your AO development workflow
- Test your processes locally before deployment

Happy testing! 🧪

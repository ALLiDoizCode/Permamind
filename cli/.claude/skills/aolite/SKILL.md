---
name: aolite
version: 1.0.1
author: Permamind Team
description: Testing framework for AO processes - simulate message passing, handlers, and process interactions locally
tags: ["ao", "testing", "development", "aolite"]
dependencies: []
---

# AOLite - AO Process Testing Framework

AOLite is a lightweight testing framework for AO processes that simulates the AO runtime environment locally. It allows you to test handlers, message passing, and process interactions without deploying to the network.

## When to Use This Skill

This skill activates when you need to:
- Test AO processes locally before deployment
- Debug handler logic and message flows
- Simulate multi-process interactions
- Verify state management and persistence
- Run integration tests for AO applications
- Develop processes with fast feedback loops
- Mock the AO environment for testing

## Core Concepts

### 1. Process Simulation

AOLite creates a local simulation of the AO runtime:

```lua
-- aolite-test.lua
local aolite = require('aolite')

-- Create a process instance
local process = aolite.createProcess({
  name = "TestProcess",
  file = "path/to/process.lua"
})

-- Send messages to the process
local result = process.send({
  From = "test-sender",
  Tags = { Action = "GetInfo" }
})

-- Assert results
assert(result.Tags.Type == "Success", "Expected success response")
```

### 2. Message Passing

Simulate message sending and receiving:

```lua
-- Send a message
local response = process.send({
  From = "user-address",
  Target = process.id,
  Tags = {
    Action = "Transfer",
    Recipient = "receiver-address",
    Quantity = "100"
  },
  Data = "Additional data"
})

-- Check the response
print("Response:", response.Data)
print("Status:", response.Tags.Status)
```

### 3. Handler Testing

Test individual handlers in isolation:

```lua
-- Test a specific handler
local result = process.send({
  From = "test-user",
  Tags = { Action = "AddTodo", Task = "Test task" }
})

-- Verify handler response
assert(result.Tags.Action == "TodoAdded", "Handler should respond with TodoAdded")
assert(result.Data:match('"task":"Test task"'), "Response should contain task data")
```

### 4. State Inspection

Access and verify process state:

```lua
-- Get current process state
local state = process.getState()

print("Todos:", #state.Todos)
print("NextId:", state.NextId)

-- Verify state changes
process.send({ From = "user", Tags = { Action = "AddTodo", Task = "Task 1" }})
local newState = process.getState()
assert(#newState.Todos == 1, "Should have one todo")
```

### 5. Multi-Process Testing

Test interactions between multiple processes:

```lua
-- Create two processes
local tokenProcess = aolite.createProcess({ file = "token.lua" })
local dexProcess = aolite.createProcess({ file = "dex.lua" })

-- Simulate cross-process messaging
tokenProcess.send({
  From = "user",
  Tags = {
    Action = "Transfer",
    Recipient = dexProcess.id,
    Quantity = "1000"
  }
})

-- Verify the DEX received the tokens
local dexState = dexProcess.getState()
assert(dexState.Balances[tokenProcess.id] == 1000)
```

## AOLite API Reference

### Creating Processes

```lua
local aolite = require('aolite')

-- Create a process from a file
local process = aolite.createProcess({
  name = "MyProcess",        -- Optional: process name
  file = "process.lua",      -- Required: path to Lua file
  id = "custom-id"           -- Optional: custom process ID
})

-- Create a process from a string
local process = aolite.createProcessFromString({
  name = "InlineProcess",
  code = [[
    Handlers.add("Info",
      Handlers.utils.hasMatchingTag("Action", "Info"),
      function(msg)
        ao.send({ Target = msg.From, Data = "Hello from inline!" })
      end
    )
  ]]
})
```

### Sending Messages

```lua
-- Basic send
local result = process.send({
  From = "sender-address",
  Tags = { Action = "DoSomething" },
  Data = "message data"
})

-- Send with timestamp
local result = process.send({
  From = "sender-address",
  Timestamp = 1234567890,
  Tags = { Action = "DoSomething" }
})

-- Send and capture all outgoing messages
local result, outbox = process.sendAndCapture({
  From = "sender-address",
  Tags = { Action = "Broadcast" }
})

-- outbox contains all messages sent by handlers
for _, msg in ipairs(outbox) do
  print("Sent to:", msg.Target)
  print("Data:", msg.Data)
end
```

### State Management

```lua
-- Get current state
local state = process.getState()

-- Set state (for testing specific scenarios)
process.setState({
  Todos = { {id = 1, task = "Test", completed = false} },
  NextId = 2
})

-- Reset state
process.reset()
```

### Process Control

```lua
-- Get process ID
local id = process.id

-- Get process name
local name = process.name

-- Reload process code (useful for development)
process.reload()

-- Kill process
process.kill()
```

## Testing Patterns

### 1. Unit Testing Handlers

```lua
-- test-handlers.lua
local aolite = require('aolite')
local process = aolite.createProcess({ file = "todo-list.lua" })

-- Test: Add a todo
local function testAddTodo()
  local result = process.send({
    From = "user1",
    Tags = { Action = "AddTodo", Task = "Write tests" }
  })

  assert(result.Tags.Type == "Success", "Should succeed")
  assert(result.Tags.Action == "TodoAdded", "Should return TodoAdded")

  local state = process.getState()
  assert(#state.Todos == 1, "Should have 1 todo")
  assert(state.Todos[1].task == "Write tests", "Task should match")

  print("✓ testAddTodo passed")
end

-- Test: List todos
local function testListTodos()
  -- Setup: add some todos
  process.send({ From = "user1", Tags = { Action = "AddTodo", Task = "Task 1" }})
  process.send({ From = "user1", Tags = { Action = "AddTodo", Task = "Task 2" }})

  -- Test: list all
  local result = process.send({
    From = "user1",
    Tags = { Action = "ListTodos" }
  })

  assert(result.Tags.Count == "2", "Should have 2 todos")
  print("✓ testListTodos passed")
end

-- Run tests
process.reset()
testAddTodo()

process.reset()
testListTodos()
```

### 2. Integration Testing

```lua
-- test-integration.lua
local aolite = require('aolite')

local function testTodoWorkflow()
  local process = aolite.createProcess({ file = "todo-list.lua" })

  -- Add multiple todos
  process.send({ From = "alice", Tags = { Action = "AddTodo", Task = "Task 1" }})
  process.send({ From = "alice", Tags = { Action = "AddTodo", Task = "Task 2" }})
  process.send({ From = "bob", Tags = { Action = "AddTodo", Task = "Task 3" }})

  -- Complete one
  process.send({ From = "alice", Tags = { Action = "CompleteTodo", TodoId = "1" }})

  -- List pending
  local pending = process.send({
    From = "alice",
    Tags = { Action = "ListTodos", Filter = "pending" }
  })
  assert(pending.Tags.Count == "2", "Should have 2 pending")

  -- Get stats
  local stats = process.send({
    From = "alice",
    Tags = { Action = "GetStats" }
  })

  -- Parse JSON and verify
  local json = require('json')
  local data = json.decode(stats.Data)
  assert(data.total == 3, "Total should be 3")
  assert(data.completed == 1, "Completed should be 1")
  assert(data.pending == 2, "Pending should be 2")

  print("✓ testTodoWorkflow passed")
end

testTodoWorkflow()
```

### 3. Error Handling Tests

```lua
-- test-errors.lua
local aolite = require('aolite')
local process = aolite.createProcess({ file = "todo-list.lua" })

local function testErrorCases()
  -- Test: Empty task
  local result = process.send({
    From = "user",
    Tags = { Action = "AddTodo", Task = "" }
  })
  assert(result.Tags.Type == "Error", "Should return error")
  assert(result.Tags["Error-Message"]:match("empty"), "Should mention empty task")

  -- Test: Non-existent todo
  result = process.send({
    From = "user",
    Tags = { Action = "GetTodo", TodoId = "999" }
  })
  assert(result.Tags.Type == "Error", "Should return error")
  assert(result.Tags["Error-Message"]:match("not found"), "Should mention not found")

  -- Test: Missing required field
  result = process.send({
    From = "user",
    Tags = { Action = "CompleteTodo" }  -- Missing TodoId
  })
  assert(result.Tags.Type == "Error", "Should return error")
  assert(result.Tags["Error-Message"]:match("required"), "Should mention required field")

  print("✓ testErrorCases passed")
end

testErrorCases()
```

### 4. State Persistence Tests

```lua
-- test-persistence.lua
local aolite = require('aolite')

local function testStatePersistence()
  local process = aolite.createProcess({ file = "todo-list.lua" })

  -- Add todos
  process.send({ From = "user", Tags = { Action = "AddTodo", Task = "Task 1" }})
  process.send({ From = "user", Tags = { Action = "AddTodo", Task = "Task 2" }})

  -- Get state
  local state1 = process.getState()
  assert(#state1.Todos == 2, "Should have 2 todos")

  -- Simulate process restart by reloading
  process.reload()

  -- Verify state is maintained
  local state2 = process.getState()
  assert(#state2.Todos == 2, "State should persist after reload")
  assert(state2.Todos[1].task == "Task 1", "Task data should persist")

  print("✓ testStatePersistence passed")
end

testStatePersistence()
```

## Mock Environment Setup

AOLite provides a complete mock of the AO runtime:

### Mocked Globals

```lua
-- ao table
ao = {
  id = "process-id",           -- Current process ID
  send = function(msg) end,    -- Send message
  spawn = function(module) end -- Spawn new process
}

-- Handlers table
Handlers = {
  add = function(name, matcher, handler) end,
  utils = {
    hasMatchingTag = function(key, value) end,
    hasMatchingData = function(pattern) end
  }
}

-- json module
json = {
  encode = function(obj) end,
  decode = function(str) end
}
```

### Custom Mocks

You can provide custom implementations:

```lua
local process = aolite.createProcess({
  file = "process.lua",
  mocks = {
    -- Custom ao.send implementation
    aoSend = function(msg)
      print("Intercepted message to:", msg.Target)
      return defaultAoSend(msg)
    end,

    -- Custom external service mock
    externalAPI = {
      fetch = function(url)
        return { status = 200, data = "mocked response" }
      end
    }
  }
})
```

## Best Practices

### 1. Organize Tests by Feature

```
tests/
├── unit/
│   ├── test-add-todo.lua
│   ├── test-complete-todo.lua
│   └── test-delete-todo.lua
├── integration/
│   ├── test-todo-workflow.lua
│   └── test-multi-user.lua
└── helpers/
    └── test-utils.lua
```

### 2. Use Test Helpers

```lua
-- helpers/test-utils.lua
local M = {}

function M.createTestProcess()
  local aolite = require('aolite')
  return aolite.createProcess({ file = "todo-list.lua" })
end

function M.addSampleTodos(process)
  process.send({ From = "user", Tags = { Action = "AddTodo", Task = "Task 1" }})
  process.send({ From = "user", Tags = { Action = "AddTodo", Task = "Task 2" }})
  process.send({ From = "user", Tags = { Action = "AddTodo", Task = "Task 3" }})
end

function M.assertSuccess(result)
  assert(result.Tags.Type == "Success", "Expected success, got: " .. (result.Tags.Type or "nil"))
end

return M
```

### 3. Clean State Between Tests

```lua
local process = aolite.createProcess({ file = "process.lua" })

local function runTest(name, testFn)
  process.reset()  -- Clean state
  print("Running:", name)
  testFn()
  print("✓ " .. name .. " passed")
end

runTest("test1", function()
  -- Test implementation
end)

runTest("test2", function()
  -- Test implementation
end)
```

### 4. Test with Realistic Data

```lua
local function testWithRealisticData()
  local process = aolite.createProcess({ file = "process.lua" })

  -- Use realistic timestamps
  local now = os.time()

  -- Use realistic addresses (Arweave format)
  local aliceAddr = "vLRHFqCw1uHu75xqB4fCDW-QxpkpJxBtFD9g4QYUbfw"
  local bobAddr = "5WzR7rJCuqCKEq02WUPhfgaKMRte7SAx8nrZ0qHE4Hs"

  process.send({
    From = aliceAddr,
    Timestamp = now,
    Tags = { Action = "AddTodo", Task = "Deploy to mainnet" }
  })

  -- Verify with realistic expectations
  local state = process.getState()
  assert(state.Todos[1].createdBy == aliceAddr, "Should track creator")
  assert(state.Todos[1].createdAt == now, "Should track timestamp")
end
```

### 5. Use Assertions Effectively

```lua
-- Good: Descriptive assertion messages
assert(result.Tags.Type == "Success",
  "Expected Type=Success, got: " .. tostring(result.Tags.Type))

-- Good: Check before accessing nested data
assert(result.Data, "Response should have Data field")
local data = json.decode(result.Data)
assert(data.todos, "Data should contain todos array")

-- Good: Validate data types
assert(type(state.NextId) == "number", "NextId should be a number")
assert(type(state.Todos) == "table", "Todos should be a table")
```

## CI/CD Integration

### Running Tests in CI

```bash
#!/bin/bash
# test.sh

echo "Running AOLite tests..."

# Run all test files
for test_file in tests/**/*.lua; do
  echo "Testing: $test_file"
  lua "$test_file" || exit 1
done

echo "All tests passed!"
```

### Test Runner Script

```lua
-- run-tests.lua
local aolite = require('aolite')

local tests = {
  "tests/unit/test-add-todo.lua",
  "tests/unit/test-complete-todo.lua",
  "tests/integration/test-workflow.lua"
}

local passed = 0
local failed = 0

for _, testFile in ipairs(tests) do
  print("\n=== Running:", testFile)
  local success, err = pcall(dofile, testFile)

  if success then
    passed = passed + 1
    print("✓ PASSED")
  else
    failed = failed + 1
    print("✗ FAILED:", err)
  end
end

print(string.format("\n=== Results: %d passed, %d failed ===", passed, failed))
os.exit(failed == 0 and 0 or 1)
```

## Debugging Tips

### 1. Enable Verbose Logging

```lua
local process = aolite.createProcess({
  file = "process.lua",
  debug = true  -- Enable debug output
})

-- All handler calls and messages will be logged
```

### 2. Inspect Message Flow

```lua
local result, outbox = process.sendAndCapture({
  From = "user",
  Tags = { Action = "Broadcast" }
})

print("Outgoing messages:", #outbox)
for i, msg in ipairs(outbox) do
  print(string.format("Message %d:", i))
  print("  Target:", msg.Target)
  print("  Action:", msg.Tags.Action)
  print("  Data:", msg.Data)
end
```

### 3. Breakpoint Debugging

```lua
-- Insert in process code for debugging
if condition then
  print("DEBUG: State at breakpoint:", require('json').encode(State))
  error("Breakpoint hit")  -- Stops execution
end
```

## Resources

- **AOLite Repository**: [GitHub](https://github.com/permaweb/aolite)
- **AO Documentation**: [AO Docs](https://ao.arweave.dev)
- **Testing Best Practices**: AO Testing Guide
- **Example Tests**: See AOLite examples directory

## Common Patterns

### Pattern 1: Setup-Execute-Verify

```lua
local function test()
  -- Setup
  local process = aolite.createProcess({ file = "process.lua" })
  process.setState({ /* initial state */ })

  -- Execute
  local result = process.send({ /* message */ })

  -- Verify
  assert(result.Tags.Type == "Success")
  local state = process.getState()
  assert(state.expectedField == expectedValue)
end
```

### Pattern 2: Test Data Builders

```lua
local function buildTodoMessage(overrides)
  return {
    From = overrides.From or "test-user",
    Timestamp = overrides.Timestamp or os.time(),
    Tags = {
      Action = "AddTodo",
      Task = overrides.Task or "Default task"
    }
  }
end

-- Use in tests
local result = process.send(buildTodoMessage({ Task = "Custom task" }))
```

### Pattern 3: Parameterized Tests

```lua
local testCases = {
  { input = "", shouldFail = true, reason = "empty task" },
  { input = "Valid task", shouldFail = false },
  { input = string.rep("x", 1000), shouldFail = false, reason = "long task" }
}

for _, tc in ipairs(testCases) do
  local result = process.send({
    From = "user",
    Tags = { Action = "AddTodo", Task = tc.input }
  })

  if tc.shouldFail then
    assert(result.Tags.Type == "Error", "Should fail: " .. tc.reason)
  else
    assert(result.Tags.Type == "Success", "Should succeed: " .. tc.reason)
  end
end
```

## Summary

AOLite is an essential tool for AO development that enables:
- Fast local testing without network deployment
- Comprehensive handler and message flow validation
- State management verification
- Multi-process interaction simulation
- CI/CD integration for automated testing

Use this skill whenever you need to test AO processes during development, ensuring correctness before deploying to the network.

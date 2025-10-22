-- Test Helper Functions
-- Provides mock AO environment and utilities for testing registry.lua

local testHelper = {}

-- Store captured ao.send messages for assertion
testHelper.sentMessages = {}

-- Mock AO environment setup
function testHelper.setupMockAO()
  -- Mock ao.send to capture responses
  if not ao then
    ao = {}
  end

  ao.send = function(msg)
    table.insert(testHelper.sentMessages, msg)
  end

  ao.id = "test_process_id_abc123def456ghi789jkl012mno"

  -- Mock Handlers.add to register handlers
  if not Handlers then
    Handlers = {}
    Handlers.registeredHandlers = {}
  end

  Handlers.add = function(name, matcher, handler)
    Handlers.registeredHandlers[name] = {
      matcher = matcher,
      handler = handler
    }
  end

  -- Mock Handlers.utils.hasMatchingTag
  if not Handlers.utils then
    Handlers.utils = {}
  end

  Handlers.utils.hasMatchingTag = function(tagName, tagValue)
    return function(msg)
      return msg[tagName] == tagValue
    end
  end

  -- Mock json module
  if not json then
    json = {}
  end

  json.encode = function(tbl)
    -- Simple JSON encoder for testing (not production-grade)
    if type(tbl) ~= "table" then
      if type(tbl) == "string" then
        return '"' .. tbl .. '"'
      end
      return tostring(tbl)
    end

    local isArray = #tbl > 0
    if isArray then
      local items = {}
      for i, v in ipairs(tbl) do
        table.insert(items, json.encode(v))
      end
      return "[" .. table.concat(items, ",") .. "]"
    else
      local pairsList = {}
      for k, v in pairs(tbl) do
        table.insert(pairsList, '"' .. tostring(k) .. '":' .. json.encode(v))
      end
      return "{" .. table.concat(pairsList, ",") .. "}"
    end
  end

  json.decode = function(str)
    -- Simple JSON decoder for testing (handles basic structures)
    if not str or str == "" then return nil end

    -- Handle arrays
    if string.sub(str, 1, 1) == "[" and string.sub(str, -1) == "]" then
      local content = string.sub(str, 2, -2)
      if content == "" then return {} end

      local result = {}
      local inQuote = false
      local current = ""
      local depth = 0

      for i = 1, #content do
        local char = string.sub(content, i, i)

        if char == '"' and string.sub(content, i-1, i-1) ~= "\\" then
          inQuote = not inQuote
        elseif not inQuote then
          if char == "[" or char == "{" then
            depth = depth + 1
          elseif char == "]" or char == "}" then
            depth = depth - 1
          elseif char == "," and depth == 0 then
            current = string.match(current, "^%s*(.-)%s*$")
            if string.sub(current, 1, 1) == '"' then
              current = string.sub(current, 2, -2)
            end
            table.insert(result, current)
            current = ""
            goto continue
          end
        end

        current = current .. char
        ::continue::
      end

      if current ~= "" then
        current = string.match(current, "^%s*(.-)%s*$")
        if string.sub(current, 1, 1) == '"' then
          current = string.sub(current, 2, -2)
        end
        table.insert(result, current)
      end

      return result
    end

    -- Handle objects - return minimal structure for testing
    if string.sub(str, 1, 1) == "{" then
      return {}
    end

    return nil
  end
end

-- Reset test state between tests
function testHelper.reset()
  testHelper.sentMessages = {}
  Skills = {}
end

-- Get last sent message
function testHelper.getLastMessage()
  return testHelper.sentMessages[#testHelper.sentMessages]
end

-- Get all sent messages
function testHelper.getAllMessages()
  return testHelper.sentMessages
end

-- Simulate message handling
function testHelper.sendMessage(msg)
  -- Add default timestamp if not provided
  if not msg.Timestamp then
    msg.Timestamp = "1234567890"
  end

  -- Add default From if not provided
  if not msg.From then
    msg.From = "test_sender_abc123def456ghi789jkl012mno345"
  end

  -- Find matching handler
  for name, handlerData in pairs(Handlers.registeredHandlers) do
    local matcher = handlerData.matcher
    local handler = handlerData.handler

    if matcher(msg) then
      handler(msg)
      return true
    end
  end

  return false
end

-- Assert helper functions
function testHelper.assert(condition, message)
  if not condition then
    error("Assertion failed: " .. (message or "no message provided"))
  end
end

function testHelper.assertEqual(actual, expected, message)
  if actual ~= expected then
    error(string.format("Assertion failed: %s\nExpected: %s\nActual: %s",
      message or "values not equal",
      tostring(expected),
      tostring(actual)))
  end
end

function testHelper.assertNotNil(value, message)
  if value == nil then
    error("Assertion failed: " .. (message or "value is nil"))
  end
end

-- Pretty print for debugging
function testHelper.print(value, indent)
  indent = indent or 0
  local prefix = string.rep("  ", indent)

  if type(value) == "table" then
    print(prefix .. "{")
    for k, v in pairs(value) do
      if type(v) == "table" then
        print(prefix .. "  " .. tostring(k) .. " = ")
        testHelper.print(v, indent + 1)
      else
        print(prefix .. "  " .. tostring(k) .. " = " .. tostring(v))
      end
    end
    print(prefix .. "}")
  else
    print(prefix .. tostring(value))
  end
end

return testHelper

-- Test Helper for HyperBEAM Dynamic Read Script Testing
-- Sets up mock environment for testing transformation functions

-- Mock JSON module (simple implementation for testing)
local json = {
  encode = function(obj)
    if type(obj) == "table" then
      local result = {}
      local is_array = #obj > 0

      if is_array then
        table.insert(result, "[")
        for i, v in ipairs(obj) do
          if i > 1 then table.insert(result, ",") end
          if type(v) == "table" then
            table.insert(result, json.encode(v))
          elseif type(v) == "string" then
            table.insert(result, '"' .. v .. '"')
          else
            table.insert(result, tostring(v))
          end
        end
        table.insert(result, "]")
      else
        table.insert(result, "{")
        local first = true
        for k, v in pairs(obj) do
          if not first then table.insert(result, ",") end
          first = false
          table.insert(result, '"' .. tostring(k) .. '":')
          if type(v) == "table" then
            table.insert(result, json.encode(v))
          elseif type(v) == "string" then
            table.insert(result, '"' .. v .. '"')
          else
            table.insert(result, tostring(v))
          end
        end
        table.insert(result, "}")
      end

      return table.concat(result)
    elseif type(obj) == "string" then
      return '"' .. obj .. '"'
    else
      return tostring(obj)
    end
  end,

  decode = function(jsonStr)
    -- Simple JSON decoder for testing (handles basic cases)
    -- In real AO environment, this would be the full ao json module
    if not jsonStr or jsonStr == "" then
      return nil
    end

    -- Handle simple array format like ["tag1", "tag2"]
    if string.match(jsonStr, "^%[.*%]$") then
      local items = {}
      for item in string.gmatch(jsonStr, '"([^"]+)"') do
        table.insert(items, item)
      end
      return items
    end

    -- For more complex JSON, return nil (not needed for our tests)
    return nil
  end
}

-- Make json available globally (as it is in AO environment)
if not package.loaded.json then
  package.loaded.json = json
  _G.json = json
end

-- Test assertion helpers
local function assertEquals(actual, expected, message)
  if actual ~= expected then
    error(string.format("Assertion failed: %s\nExpected: %s\nActual: %s",
      message or "values not equal", tostring(expected), tostring(actual)))
  end
end

local function assertTrue(condition, message)
  if not condition then
    error(string.format("Assertion failed: %s", message or "condition is false"))
  end
end

local function assertNotNil(value, message)
  if value == nil then
    error(string.format("Assertion failed: %s", message or "value is nil"))
  end
end

local function assertTableContains(tbl, value, message)
  if type(tbl) ~= "table" then
    error(string.format("Assertion failed: %s (not a table)", message or "table check failed"))
  end

  for _, v in ipairs(tbl) do
    if v == value then
      return
    end
  end

  error(string.format("Assertion failed: %s\nTable does not contain: %s",
    message or "table containment check failed", tostring(value)))
end

local function assertTableLength(tbl, expectedLength, message)
  if type(tbl) ~= "table" then
    error(string.format("Assertion failed: %s (not a table)", message or "table length check failed"))
  end

  local actualLength = #tbl
  if actualLength ~= expectedLength then
    error(string.format("Assertion failed: %s\nExpected length: %d\nActual length: %d",
      message or "table length mismatch", expectedLength, actualLength))
  end
end

-- Export test helpers
return {
  assertEquals = assertEquals,
  assertTrue = assertTrue,
  assertNotNil = assertNotNil,
  assertTableContains = assertTableContains,
  assertTableLength = assertTableLength,
  json = json
}

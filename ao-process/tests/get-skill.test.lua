-- Get-Skill Handler Tests
-- Tests skill retrieval by name

local helper = require("test-helper")
local samples = require("fixtures/sample-skills")

local function runTests()
  print("\n=== Get-Skill Handler Tests ===\n")

  -- Setup: Register a skill
  helper.reset()
  helper.setupMockAO()
  dofile("../registry.lua")

  helper.sendMessage({
    Action = "Register-Skill",
    Name = samples.validSkill1.Name,
    Version = samples.validSkill1.Version,
    Description = samples.validSkill1.Description,
    Author = samples.validSkill1.Author,
    Tags = samples.validSkill1.Tags,
    ArweaveTxId = samples.validSkill1.ArweaveTxId,
    Dependencies = samples.validSkill1.Dependencies,
    From = "test_owner",
    Timestamp = "1700000000"
  })

  -- Test 1: Get existing skill
  helper.sentMessages = {} -- Clear registration message
  helper.sendMessage({
    Action = "Get-Skill",
    Name = samples.validSkill1.Name,
    From = "test_requester"
  })

  local response = helper.getLastMessage()
  helper.assertEqual(response.Action, "Skill-Found", "Should return Skill-Found action")
  helper.assertNotNil(response.Data, "Should include skill data")
  helper.assertEqual(response.Target, "test_requester", "Should target requester")

  print("✓ Test 1: Successfully retrieve existing skill")

  -- Test 2: Get non-existent skill
  helper.sentMessages = {}
  helper.sendMessage({
    Action = "Get-Skill",
    Name = "nonexistent-skill",
    From = "test_requester"
  })

  local notFoundResponse = helper.getLastMessage()
  helper.assertEqual(notFoundResponse.Action, "Error", "Should return error for non-existent skill")
  helper.assertNotNil(notFoundResponse.Error, "Should include error message")

  print("✓ Test 2: Non-existent skill returns error")

  -- Test 3: Missing Name parameter
  helper.sentMessages = {}
  helper.sendMessage({
    Action = "Get-Skill",
    From = "test_requester"
  })

  local missingNameResponse = helper.getLastMessage()
  helper.assertEqual(missingNameResponse.Action, "Error", "Should return error for missing Name")

  print("✓ Test 3: Missing Name parameter rejected")

  -- Test 4: Empty Name parameter
  helper.sentMessages = {}
  helper.sendMessage({
    Action = "Get-Skill",
    Name = "",
    From = "test_requester"
  })

  local emptyNameResponse = helper.getLastMessage()
  helper.assertEqual(emptyNameResponse.Action, "Error", "Should return error for empty Name")

  print("✓ Test 4: Empty Name parameter rejected")

  print("\n=== All Get-Skill Handler Tests Passed ===\n")
end

-- Run tests
local success, err = pcall(runTests)
if not success then
  print("ERROR: " .. tostring(err))
  os.exit(1)
end

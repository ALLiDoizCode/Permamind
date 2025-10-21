-- Register-Skill Handler Tests
-- Tests skill registration with validation and error handling

local helper = require("test-helper")
local samples = require("fixtures/sample-skills")

local function runTests()
  print("\n=== Register-Skill Handler Tests ===\n")

  -- Test 1: Valid skill registration
  helper.reset()
  helper.setupMockAO()
  dofile("../registry.lua")

  local registerMsg = {
    Action = "Register-Skill",
    Name = samples.validSkill1.Name,
    Version = samples.validSkill1.Version,
    Description = samples.validSkill1.Description,
    Author = samples.validSkill1.Author,
    Tags = samples.validSkill1.Tags,
    ArweaveTxId = samples.validSkill1.ArweaveTxId,
    Dependencies = samples.validSkill1.Dependencies,
    From = "owner123abc456def789ghi012jkl345mno678pqr",
    Timestamp = "1700000000"
  }

  helper.sendMessage(registerMsg)

  local response = helper.getLastMessage()
  helper.assertNotNil(response, "Should send registration response")
  helper.assertEqual(response.Action, "Skill-Registered", "Should confirm registration")
  helper.assertEqual(response.Name, samples.validSkill1.Name, "Response should include skill name")
  helper.assertEqual(response.Success, "true", "Success flag should be 'true'")

  -- Verify skill stored in registry
  helper.assertNotNil(Skills[samples.validSkill1.Name], "Skill should be stored in registry")
  helper.assertEqual(Skills[samples.validSkill1.Name].version, samples.validSkill1.Version, "Version should match")

  print("✓ Test 1: Valid skill registration successful")

  -- Test 2: Duplicate skill name error
  helper.reset()
  helper.setupMockAO()
  dofile("../registry.lua")

  -- Register first skill
  helper.sendMessage(registerMsg)

  -- Try to register duplicate
  helper.sendMessage(registerMsg)

  local duplicateResponse = helper.getLastMessage()
  helper.assertEqual(duplicateResponse.Action, "Error", "Should return error for duplicate")
  helper.assertNotNil(duplicateResponse.Error, "Error message should be present")

  print("✓ Test 2: Duplicate skill name rejected")

  -- Test 3: Missing required field (Name)
  helper.reset()
  helper.setupMockAO()
  dofile("../registry.lua")

  local invalidMsg = {
    Action = "Register-Skill",
    Version = "1.0.0",
    Description = "Test skill",
    Author = "Test Author",
    ArweaveTxId = "abc123def456ghi789jkl012mno345pqr678stu901v",
    From = "test_sender"
  }

  helper.sendMessage(invalidMsg)

  local errorResponse = helper.getLastMessage()
  helper.assertEqual(errorResponse.Action, "Error", "Should return error for missing Name")

  print("✓ Test 3: Missing Name field rejected")

  -- Test 4: Invalid version format
  helper.reset()
  helper.setupMockAO()
  dofile("../registry.lua")

  local invalidVersionMsg = {
    Action = "Register-Skill",
    Name = "test-skill",
    Version = "invalid",
    Description = "Test skill",
    Author = "Test Author",
    ArweaveTxId = "abc123def456ghi789jkl012mno345pqr678stu901v",
    From = "test_sender"
  }

  helper.sendMessage(invalidVersionMsg)

  local versionErrorResponse = helper.getLastMessage()
  helper.assertEqual(versionErrorResponse.Action, "Error", "Should return error for invalid version")

  print("✓ Test 4: Invalid version format rejected")

  -- Test 5: Invalid ArweaveTxId format
  helper.reset()
  helper.setupMockAO()
  dofile("../registry.lua")

  local invalidTxIdMsg = {
    Action = "Register-Skill",
    Name = "test-skill",
    Version = "1.0.0",
    Description = "Test skill",
    Author = "Test Author",
    ArweaveTxId = "invalid_txid",
    From = "test_sender"
  }

  helper.sendMessage(invalidTxIdMsg)

  local txIdErrorResponse = helper.getLastMessage()
  helper.assertEqual(txIdErrorResponse.Action, "Error", "Should return error for invalid TXID")

  print("✓ Test 5: Invalid ArweaveTxId format rejected")

  -- Test 6: Description too long (>1024 chars)
  helper.reset()
  helper.setupMockAO()
  dofile("../registry.lua")

  local longDescription = string.rep("a", 1025)
  local longDescMsg = {
    Action = "Register-Skill",
    Name = "test-skill",
    Version = "1.0.0",
    Description = longDescription,
    Author = "Test Author",
    ArweaveTxId = "abc123def456ghi789jkl012mno345pqr678stu901v",
    From = "test_sender"
  }

  helper.sendMessage(longDescMsg)

  local descErrorResponse = helper.getLastMessage()
  helper.assertEqual(descErrorResponse.Action, "Error", "Should return error for description too long")

  print("✓ Test 6: Description length validation enforced")

  -- Test 7: Verify owner field set to msg.From
  helper.reset()
  helper.setupMockAO()
  dofile("../registry.lua")

  local ownerTestMsg = {
    Action = "Register-Skill",
    Name = "owner-test-skill",
    Version = "1.0.0",
    Description = "Testing owner field",
    Author = "Test Author",
    ArweaveTxId = "abc123def456ghi789jkl012mno345pqr678stu901v",
    From = "specific_owner_abc123def456ghi789jkl012mn",
    Timestamp = "1700000000"
  }

  helper.sendMessage(ownerTestMsg)

  helper.assertNotNil(Skills["owner-test-skill"], "Skill should be registered")
  helper.assertEqual(Skills["owner-test-skill"].owner, ownerTestMsg.From, "Owner should match msg.From")

  print("✓ Test 7: Owner field correctly set to msg.From")

  -- Test 8: Verify timestamp handling (msg.Timestamp, not os.time)
  helper.assertNotNil(Skills["owner-test-skill"].publishedAt, "publishedAt should be set")
  helper.assertEqual(Skills["owner-test-skill"].publishedAt, tonumber(ownerTestMsg.Timestamp), "publishedAt should use msg.Timestamp")

  print("✓ Test 8: Timestamp correctly uses msg.Timestamp")

  print("\n=== All Register-Skill Handler Tests Passed ===\n")
end

-- Run tests
local success, err = pcall(runTests)
if not success then
  print("ERROR: " .. tostring(err))
  os.exit(1)
end

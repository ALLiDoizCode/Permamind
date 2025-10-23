-- Version History Tests
-- Tests for version history support in skills registry
-- Covers: multiple versions, Get-Skill with version, Get-Skill-Versions handler

local helper = require("test-helper")
local samples = require("fixtures/sample-skills")

local function runTests()
  print("\n=== Version History Tests ===\n")

  -- Test 1: Register multiple versions of same skill
  helper.reset()
  helper.setupMockAO()
  dofile("../registry.lua")

  -- Register v1.0.0
  local registerV1 = {
    Action = "Register-Skill",
    Name = "test-skill",
    Version = "1.0.0",
    Description = "Version 1.0.0",
    Author = "Test Author",
    Tags = "[]",
    ArweaveTxId = "v1_abc123def456ghi789jkl012mno345pqr678stu90",
    Dependencies = "[]",
    From = "owner123abc456def789ghi012jkl345mno678pqr",
    Timestamp = "1700000000"
  }

  helper.sendMessage(registerV1)
  local response1 = helper.getLastMessage()
  helper.assertEqual(response1.Action, "Skill-Registered", "Should register v1.0.0")

  -- Register v1.0.1
  local registerV1_1 = {
    Action = "Register-Skill",
    Name = "test-skill",
    Version = "1.0.1",
    Description = "Version 1.0.1",
    Author = "Test Author",
    Tags = "[]",
    ArweaveTxId = "v1_1_def456ghi789jkl012mno345pqr678stu901wx",
    Dependencies = "[]",
    From = "owner123abc456def789ghi012jkl345mno678pqr",
    Timestamp = "1700001000"
  }

  helper.sendMessage(registerV1_1)
  local response2 = helper.getLastMessage()
  helper.assertEqual(response2.Action, "Skill-Registered", "Should register v1.0.1")

  -- Verify both versions stored
  helper.assertNotNil(Skills["test-skill"], "Skill entry should exist")
  helper.assertNotNil(Skills["test-skill"].versions, "Versions table should exist")
  helper.assertNotNil(Skills["test-skill"].versions["1.0.0"], "Version 1.0.0 should exist")
  helper.assertNotNil(Skills["test-skill"].versions["1.0.1"], "Version 1.0.1 should exist")
  helper.assertEqual(Skills["test-skill"].latest, "1.0.1", "Latest should be 1.0.1")

  print("✓ Test 1: Multiple versions registered successfully")

  -- Test 2: Prevent duplicate version registration
  helper.sendMessage(registerV1_1)
  local duplicateResponse = helper.getLastMessage()
  helper.assertEqual(duplicateResponse.Action, "Error", "Should reject duplicate version")
  helper.assertNotNil(duplicateResponse.Error, "Error message should be present")

  print("✓ Test 2: Duplicate version registration prevented")

  -- Test 3: Get-Skill returns latest version when no version specified
  helper.reset()
  helper.setupMockAO()
  dofile("../registry.lua")

  -- Register two versions
  helper.sendMessage(registerV1)
  helper.sendMessage(registerV1_1)

  -- Get skill without version parameter
  local getMsg = {
    Action = "Get-Skill",
    Name = "test-skill",
    From = "requester123"
  }

  helper.sendMessage(getMsg)
  local getResponse = helper.getLastMessage()
  helper.assertEqual(getResponse.Action, "Skill-Found", "Should find skill")

  local skillData = json.decode(getResponse.Data)
  helper.assertEqual(skillData.version, "1.0.1", "Should return latest version")
  helper.assertEqual(skillData.arweaveTxId, "v1_1_def456ghi789jkl012mno345pqr678stu901wx", "Should return latest TX ID")

  print("✓ Test 3: Get-Skill returns latest version by default")

  -- Test 4: Get-Skill with specific version parameter
  local getV1_0 = {
    Action = "Get-Skill",
    Name = "test-skill",
    Version = "1.0.0",
    From = "requester123"
  }

  helper.sendMessage(getV1_0)
  local getV1Response = helper.getLastMessage()
  helper.assertEqual(getV1Response.Action, "Skill-Found", "Should find v1.0.0")

  local skillDataV1 = json.decode(getV1Response.Data)
  helper.assertEqual(skillDataV1.version, "1.0.0", "Should return v1.0.0")
  helper.assertEqual(skillDataV1.arweaveTxId, "v1_abc123def456ghi789jkl012mno345pqr678stu90", "Should return v1.0.0 TX ID")

  print("✓ Test 4: Get-Skill retrieves specific version")

  -- Test 5: Get-Skill with non-existent version
  local getNonExistent = {
    Action = "Get-Skill",
    Name = "test-skill",
    Version = "2.0.0",
    From = "requester123"
  }

  helper.sendMessage(getNonExistent)
  local notFoundResponse = helper.getLastMessage()
  helper.assertEqual(notFoundResponse.Action, "Error", "Should return error for missing version")

  print("✓ Test 5: Get-Skill returns error for non-existent version")

  -- Test 6: Get-Skill-Versions handler
  helper.reset()
  helper.setupMockAO()
  dofile("../registry.lua")

  -- Register three versions
  helper.sendMessage(registerV1)
  helper.sendMessage(registerV1_1)

  local registerV2 = {
    Action = "Register-Skill",
    Name = "test-skill",
    Version = "2.0.0",
    Description = "Version 2.0.0",
    Author = "Test Author",
    Tags = "[]",
    ArweaveTxId = "v2_ghi789jkl012mno345pqr678stu901vwx234yz",
    Dependencies = "[]",
    From = "owner123abc456def789ghi012jkl345mno678pqr",
    Timestamp = "1700002000"
  }
  helper.sendMessage(registerV2)

  -- Query all versions
  local versionsMsg = {
    Action = "Get-Skill-Versions",
    Name = "test-skill",
    From = "requester123"
  }

  helper.sendMessage(versionsMsg)
  local versionsResponse = helper.getLastMessage()
  helper.assertEqual(versionsResponse.Action, "Skill-Versions", "Should return versions list")

  local versionsData = json.decode(versionsResponse.Data)
  helper.assertEqual(versionsData.name, "test-skill", "Should include skill name")
  helper.assertEqual(versionsData.latest, "2.0.0", "Latest should be 2.0.0")
  helper.assertNotNil(versionsData.versions, "Versions array should exist")
  helper.assertEqual(#versionsData.versions, 3, "Should have 3 versions")

  print("✓ Test 6: Get-Skill-Versions lists all versions")

  -- Test 7: Update-Skill updates specific version
  helper.reset()
  helper.setupMockAO()
  dofile("../registry.lua")

  -- Register v1.0.0
  helper.sendMessage(registerV1)

  -- Update v1.0.0 metadata
  local updateMsg = {
    Action = "Update-Skill",
    Name = "test-skill",
    Version = "1.0.0",
    Description = "Updated description for v1.0.0",
    Author = "Test Author",
    Tags = "[]",
    ArweaveTxId = "updated_abc123def456ghi789jkl012mno345pqr",
    Dependencies = "[]",
    From = "owner123abc456def789ghi012jkl345mno678pqr",
    Timestamp = "1700003000"
  }

  helper.sendMessage(updateMsg)
  local updateResponse = helper.getLastMessage()
  helper.assertEqual(updateResponse.Action, "Skill-Updated", "Should update skill")

  -- Verify updated
  helper.assertEqual(Skills["test-skill"].versions["1.0.0"].description, "Updated description for v1.0.0", "Description should be updated")
  helper.assertEqual(Skills["test-skill"].versions["1.0.0"].publishedAt, 1700000000, "PublishedAt should be preserved")
  helper.assertEqual(Skills["test-skill"].versions["1.0.0"].updatedAt, 1700003000, "UpdatedAt should be new timestamp")

  print("✓ Test 7: Update-Skill modifies specific version")

  -- Test 8: Update-Skill rejects non-existent version
  local updateNonExistent = {
    Action = "Update-Skill",
    Name = "test-skill",
    Version = "5.0.0",
    Description = "Non-existent version",
    Author = "Test Author",
    ArweaveTxId = "fake_abc123def456ghi789jkl012mno345pqr678s",
    From = "owner123abc456def789ghi012jkl345mno678pqr",
    Timestamp = "1700004000"
  }

  helper.sendMessage(updateNonExistent)
  local errorResponse = helper.getLastMessage()
  helper.assertEqual(errorResponse.Action, "Error", "Should reject update of non-existent version")

  print("✓ Test 8: Update-Skill rejects non-existent version")

  -- Test 9: Search returns latest versions only
  helper.reset()
  helper.setupMockAO()
  dofile("../registry.lua")

  -- Register two versions
  helper.sendMessage(registerV1)
  helper.sendMessage(registerV1_1)

  local searchMsg = {
    Action = "Search-Skills",
    Query = "test",
    From = "requester123"
  }

  helper.sendMessage(searchMsg)
  local searchResponse = helper.getLastMessage()
  helper.assertEqual(searchResponse.Action, "Search-Results", "Should return search results")

  local searchData = json.decode(searchResponse.Data)
  helper.assertEqual(#searchData, 1, "Should return only one skill (latest version)")
  helper.assertEqual(searchData[1].version, "1.0.1", "Should return latest version 1.0.1")

  print("✓ Test 9: Search returns latest versions only")

  print("\n=== All Version History Tests Passed ===\n")
end

return {
  run = runTests
}

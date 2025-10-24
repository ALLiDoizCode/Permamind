-- Changelog Tests
-- Tests changelog storage and retrieval

local helper = require("test-helper")

local function runTests()
  print("\n=== Changelog Tests ===\n")

  -- Test 1: Register skill with changelog
  helper.reset()
  helper.setupMockAO()
  dofile("../registry.lua")

  local registerMsg = {
    Action = "Register-Skill",
    Name = "test-skill",
    Version = "1.0.0",
    Description = "Test skill",
    Author = "Test Author",
    Tags = "[]",
    ArweaveTxId = "abc123def456ghi789jkl012mno345pqr678stu901v",
    Dependencies = "[]",
    Changelog = "Initial release with basic features",
    From = "owner123",
    Timestamp = "1700000000"
  }

  helper.sendMessage(registerMsg)
  local response = helper.getLastMessage()
  helper.assertEqual(response.Action, "Skill-Registered", "Should register skill with changelog")

  -- Verify changelog stored
  helper.assertNotNil(Skills["test-skill"].versions["1.0.0"].changelog, "Changelog should be stored")
  helper.assertEqual(Skills["test-skill"].versions["1.0.0"].changelog, "Initial release with basic features", "Changelog should match")

  print("✓ Test 1: Changelog stored in registration")

  -- Test 2: Update skill with changelog
  local updateMsg = {
    Action = "Update-Skill",
    Name = "test-skill",
    Version = "1.0.0",
    Description = "Test skill updated",
    Author = "Test Author",
    ArweaveTxId = "updated123def456ghi789jkl012mno345pqr678st",
    Changelog = "## Fixed\n- Bug fix\n## Added\n- New feature",
    From = "owner123",
    Timestamp = "1700001000"
  }

  helper.sendMessage(updateMsg)
  local updateResponse = helper.getLastMessage()
  helper.assertEqual(updateResponse.Action, "Skill-Updated", "Should update skill")

  -- Verify changelog updated
  helper.assertEqual(Skills["test-skill"].versions["1.0.0"].changelog, "## Fixed\n- Bug fix\n## Added\n- New feature", "Changelog should be updated")

  print("✓ Test 2: Changelog updated in skill update")

  -- Test 3: Changelog optional (defaults to empty)
  helper.reset()
  helper.setupMockAO()
  dofile("../registry.lua")

  local noChangelogMsg = {
    Action = "Register-Skill",
    Name = "no-changelog-skill",
    Version = "1.0.0",
    Description = "Skill without changelog",
    Author = "Test Author",
    Tags = "[]",
    ArweaveTxId = "nochange123def456ghi789jkl012mno345pqr678s",
    Dependencies = "[]",
    From = "owner456",
    Timestamp = "1700000000"
  }

  helper.sendMessage(noChangelogMsg)

  -- Verify changelog is empty string (not nil)
  local changelog = Skills["no-changelog-skill"].versions["1.0.0"].changelog
  helper.assertNotNil(changelog, "Changelog field should exist")
  helper.assertEqual(changelog, "", "Changelog should be empty string when not provided")

  print("✓ Test 3: Changelog defaults to empty string")

  -- Test 4: Get-Skill returns changelog
  local getSkillMsg = {
    Action = "Get-Skill",
    Name = "test-skill",
    Version = "1.0.0",
    From = "requester123"
  }

  helper.sendMessage(getSkillMsg)
  local getResponse = helper.getLastMessage()
  helper.assertEqual(getResponse.Action, "Skill-Found", "Should find skill")

  local skillData = json.decode(getResponse.Data)
  helper.assertNotNil(skillData.changelog, "Returned skill should include changelog")

  print("✓ Test 4: Get-Skill returns changelog in metadata")

  print("\n=== All Changelog Tests Passed ===\n")
end

return {
  run = runTests
}

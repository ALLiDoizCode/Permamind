-- Download Stats Tests
-- Tests timestamp tracking in Record-Download and Get-Download-Stats handler

local helper = require("test-helper")

local function runTests()
  print("\n=== Download Stats Tests ===\n")

  -- Setup: Register a skill for testing
  helper.reset()
  helper.setupMockAO()
  dofile("../registry.lua")

  local registerMsg = {
    Action = "Register-Skill",
    Name = "test-skill",
    Version = "1.0.0",
    Description = "Test skill for download stats",
    Author = "Test Author",
    Tags = "[]",
    ArweaveTxId = "abc123def456ghi789jkl012mno345pqr678stu901v",
    Dependencies = "[]",
    From = "owner123",
    Timestamp = "1700000000"
  }

  helper.sendMessage(registerMsg)

  -- Test 1: Timestamp array initialization on first download
  helper.sentMessages = {}
  local downloadMsg = {
    Action = "Record-Download",
    Name = "test-skill",
    Version = "1.0.0",
    From = "downloader1",
    Timestamp = "1700100000"  -- First download timestamp
  }

  helper.sendMessage(downloadMsg)

  local skillData = Skills["test-skill"].versions["1.0.0"]
  helper.assertNotNil(skillData.downloadTimestamps, "downloadTimestamps array should be initialized")
  helper.assertEqual(type(skillData.downloadTimestamps), "table", "downloadTimestamps should be a table")
  helper.assertEqual(#skillData.downloadTimestamps, 1, "Should have 1 timestamp after first download")
  helper.assertEqual(skillData.downloadTimestamps[1], 1700100000, "First timestamp should match msg.Timestamp")

  print("✓ Test 1: Timestamp array initialized on first download")

  -- Test 2: Timestamp array appends on subsequent downloads
  helper.sentMessages = {}
  local download2Msg = {
    Action = "Record-Download",
    Name = "test-skill",
    Version = "1.0.0",
    From = "downloader2",
    Timestamp = "1700200000"  -- Second download timestamp
  }

  helper.sendMessage(download2Msg)

  helper.assertEqual(#skillData.downloadTimestamps, 2, "Should have 2 timestamps after second download")
  helper.assertEqual(skillData.downloadTimestamps[2], 1700200000, "Second timestamp should match msg.Timestamp")

  print("✓ Test 2: Timestamp array appends on subsequent downloads")

  -- Test 3: Download count matches array length
  helper.sentMessages = {}
  local download3Msg = {
    Action = "Record-Download",
    Name = "test-skill",
    Version = "1.0.0",
    From = "downloader3",
    Timestamp = "1700300000"
  }

  helper.sendMessage(download3Msg)

  helper.assertEqual(skillData.downloadCount, 3, "downloadCount should equal array length")
  helper.assertEqual(#skillData.downloadTimestamps, 3, "Should have 3 timestamps")

  print("✓ Test 3: downloadCount matches array length after multiple downloads")

  -- Test 4: Backward compatibility - downloadCount field exists
  local response = helper.getLastMessage()
  helper.assertEqual(response.Action, "Download-Recorded", "Should confirm download recorded")
  helper.assertEqual(response.DownloadCount, "3", "DownloadCount should be returned as string")

  print("✓ Test 4: Backward compatibility with downloadCount field")

  -- Test 5: Multiple skills maintain separate timestamp arrays
  helper.sentMessages = {}
  local registerMsg2 = {
    Action = "Register-Skill",
    Name = "another-skill",
    Version = "1.0.0",
    Description = "Another test skill",
    Author = "Test Author",
    Tags = "[]",
    ArweaveTxId = "xyz123def456ghi789jkl012mno345pqr678stu901v",
    Dependencies = "[]",
    From = "owner123",
    Timestamp = "1700000000"
  }

  helper.sendMessage(registerMsg2)

  local downloadAnotherMsg = {
    Action = "Record-Download",
    Name = "another-skill",
    Version = "1.0.0",
    From = "downloader4",
    Timestamp = "1700400000"
  }

  helper.sendMessage(downloadAnotherMsg)

  local anotherSkillData = Skills["another-skill"].versions["1.0.0"]
  helper.assertEqual(#anotherSkillData.downloadTimestamps, 1, "another-skill should have 1 timestamp")
  helper.assertEqual(#skillData.downloadTimestamps, 3, "test-skill should still have 3 timestamps")

  print("✓ Test 5: Multiple skills maintain separate timestamp arrays")

  -- Test 6: Timestamp stored as number (not string)
  helper.assertEqual(type(skillData.downloadTimestamps[1]), "number", "Timestamp should be stored as number")

  print("✓ Test 6: Timestamps stored as numbers")

  print("\n=== All Download Stats Tests Passed ===\n")
end

return {
  run = runTests
}

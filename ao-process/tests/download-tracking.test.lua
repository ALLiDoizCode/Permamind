-- Download Tracking Tests
-- Tests Record-Download handler and download counting

local helper = require("test-helper")

local function runTests()
  print("\n=== Download Tracking Tests ===\n")

  -- Setup: Register a skill
  helper.reset()
  helper.setupMockAO()
  dofile("../registry.lua")

  local registerMsg = {
    Action = "Register-Skill",
    Name = "popular-skill",
    Version = "1.0.0",
    Description = "A popular skill",
    Author = "Test Author",
    Tags = "[]",
    ArweaveTxId = "abc123def456ghi789jkl012mno345pqr678stu901v",
    Dependencies = "[]",
    From = "owner123",
    Timestamp = "1700000000"
  }

  helper.sendMessage(registerMsg)

  -- Verify initial download count is 0
  helper.assertEqual(Skills["popular-skill"].versions["1.0.0"].downloadCount, 0, "Initial download count should be 0")

  print("✓ Test 1: Download count initialized to 0")

  -- Test 2: Record download increments count
  helper.sentMessages = {}
  local downloadMsg = {
    Action = "Record-Download",
    Name = "popular-skill",
    Version = "1.0.0",
    From = "downloader1"
  }

  helper.sendMessage(downloadMsg)
  local response = helper.getLastMessage()
  helper.assertEqual(response.Action, "Download-Recorded", "Should confirm download recorded")
  helper.assertEqual(response.DownloadCount, "1", "Should return count of 1")

  -- Verify count incremented
  helper.assertEqual(Skills["popular-skill"].versions["1.0.0"].downloadCount, 1, "Download count should be 1")

  print("✓ Test 2: Record-Download increments count")

  -- Test 3: Multiple downloads increment correctly
  helper.sentMessages = {}
  helper.sendMessage(downloadMsg)
  helper.sendMessage(downloadMsg)
  helper.sendMessage(downloadMsg)

  helper.assertEqual(Skills["popular-skill"].versions["1.0.0"].downloadCount, 4, "Download count should be 4 after 3 more downloads")

  print("✓ Test 3: Multiple downloads increment correctly")

  -- Test 4: Record download without version (uses latest)
  helper.reset()
  helper.setupMockAO()
  dofile("../registry.lua")

  -- Register two versions
  helper.sendMessage(registerMsg)

  local v2Msg = {
    Action = "Register-Skill",
    Name = "popular-skill",
    Version = "2.0.0",
    Description = "Version 2",
    Author = "Test Author",
    Tags = "[]",
    ArweaveTxId = "v2_abc123def456ghi789jkl012mno345pqr678stu",
    Dependencies = "[]",
    From = "owner123",
    Timestamp = "1700001000"
  }
  helper.sendMessage(v2Msg)

  -- Record download without specifying version
  helper.sentMessages = {}
  local latestDownloadMsg = {
    Action = "Record-Download",
    Name = "popular-skill",
    From = "downloader2"
  }

  helper.sendMessage(latestDownloadMsg)
  local latestResponse = helper.getLastMessage()
  helper.assertEqual(latestResponse.Version, "2.0.0", "Should record for latest version")

  helper.assertEqual(Skills["popular-skill"].versions["2.0.0"].downloadCount, 1, "Latest version download count should be 1")
  helper.assertEqual(Skills["popular-skill"].versions["1.0.0"].downloadCount, 0, "Old version should still be 0")

  print("✓ Test 4: Download without version uses latest")

  -- Test 5: Record download for non-existent skill (graceful)
  helper.sentMessages = {}
  local nonExistentMsg = {
    Action = "Record-Download",
    Name = "nonexistent-skill",
    From = "downloader3"
  }

  helper.sendMessage(nonExistentMsg)

  -- Should not send error response (silent failure)
  local messages = helper.sentMessages
  helper.assertEqual(#messages, 0, "Should not send response for non-existent skill")

  print("✓ Test 5: Non-existent skill handled gracefully")

  -- Test 6: Record download for non-existent version (graceful)
  helper.sentMessages = {}
  local badVersionMsg = {
    Action = "Record-Download",
    Name = "popular-skill",
    Version = "99.0.0",
    From = "downloader4"
  }

  helper.sendMessage(badVersionMsg)

  -- Should not send response
  helper.assertEqual(#helper.sentMessages, 0, "Should not send response for non-existent version")

  print("✓ Test 6: Non-existent version handled gracefully")

  -- Test 7: Missing Name parameter returns error
  helper.sentMessages = {}
  local noNameMsg = {
    Action = "Record-Download",
    From = "downloader5"
  }

  helper.sendMessage(noNameMsg)
  local errorResponse = helper.getLastMessage()
  helper.assertEqual(errorResponse.Action, "Error", "Should return error for missing Name")

  print("✓ Test 7: Missing Name parameter rejected")

  print("\n=== All Download Tracking Tests Passed ===\n")
end

return {
  run = runTests
}

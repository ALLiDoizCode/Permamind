-- Get-Download-Stats Handler Tests
-- Tests time-based download statistics queries (aggregate and per-skill)

local helper = require("test-helper")

local function runTests()
  print("\n=== Get-Download-Stats Handler Tests ===\n")

  -- Setup: Register skills with download history at different times
  helper.reset()
  helper.setupMockAO()
  dofile("../registry.lua")

  -- Current time reference (simulated)
  local currentTime = 1700000000

  -- Register skill 1
  local registerMsg1 = {
    Action = "Register-Skill",
    Name = "popular-skill",
    Version = "1.0.0",
    Description = "Popular skill",
    Author = "Test Author",
    Tags = "[]",
    ArweaveTxId = "abc123def456ghi789jkl012mno345pqr678stu901v",
    Dependencies = "[]",
    From = "owner123",
    Timestamp = tostring(currentTime - 100000)
  }

  helper.sendMessage(registerMsg1)

  -- Register skill 2
  local registerMsg2 = {
    Action = "Register-Skill",
    Name = "niche-skill",
    Version = "1.0.0",
    Description = "Niche skill",
    Author = "Test Author",
    Tags = "[]",
    ArweaveTxId = "xyz789def456ghi123jkl012mno345pqr678stu901v",
    Dependencies = "[]",
    From = "owner456",
    Timestamp = tostring(currentTime - 90000)
  }

  helper.sendMessage(registerMsg2)

  -- Simulate downloads at different times
  -- 35 days ago (outside 30-day window)
  local download1 = {
    Action = "Record-Download",
    Name = "popular-skill",
    Version = "1.0.0",
    From = "user1",
    Timestamp = tostring(currentTime - (35 * 24 * 60 * 60))
  }
  helper.sendMessage(download1)

  -- 20 days ago (within 30-day window, outside 7-day)
  local download2 = {
    Action = "Record-Download",
    Name = "popular-skill",
    Version = "1.0.0",
    From = "user2",
    Timestamp = tostring(currentTime - (20 * 24 * 60 * 60))
  }
  helper.sendMessage(download2)

  -- 5 days ago (within 7-day window)
  local download3 = {
    Action = "Record-Download",
    Name = "popular-skill",
    Version = "1.0.0",
    From = "user3",
    Timestamp = tostring(currentTime - (5 * 24 * 60 * 60))
  }
  helper.sendMessage(download3)

  -- 2 days ago (within 7-day window)
  local download4 = {
    Action = "Record-Download",
    Name = "popular-skill",
    Version = "1.0.0",
    From = "user4",
    Timestamp = tostring(currentTime - (2 * 24 * 60 * 60))
  }
  helper.sendMessage(download4)

  -- 10 days ago for niche-skill (within 30-day, outside 7-day)
  local download5 = {
    Action = "Record-Download",
    Name = "niche-skill",
    Version = "1.0.0",
    From = "user5",
    Timestamp = tostring(currentTime - (10 * 24 * 60 * 60))
  }
  helper.sendMessage(download5)

  -- Test 1: Aggregate stats - all time ranges
  helper.sentMessages = {}
  local aggregateMsg = {
    Action = "Get-Download-Stats",
    Scope = "all",
    TimeRange = "all",
    From = "requester1",
    Timestamp = tostring(currentTime)
  }

  helper.sendMessage(aggregateMsg)
  local response = helper.getLastMessage()

  helper.assertEqual(response.Action, "Download-Stats", "Should return Download-Stats action")

  local data = json.decode(response.Data)
  helper.assertEqual(data.totalSkills, 2, "Should count 2 skills")
  helper.assertEqual(data.downloadsTotal, 5, "Should count 5 total downloads")
  helper.assertEqual(data.downloads7Days, 2, "Should count 2 downloads in last 7 days")
  helper.assertEqual(data.downloads30Days, 4, "Should count 4 downloads in last 30 days")

  print("✓ Test 1: Aggregate stats with all time ranges")

  -- Test 2: Aggregate stats - 7 days only
  helper.sentMessages = {}
  local aggregate7DaysMsg = {
    Action = "Get-Download-Stats",
    Scope = "all",
    TimeRange = "7",
    From = "requester2",
    Timestamp = tostring(currentTime)
  }

  helper.sendMessage(aggregate7DaysMsg)
  local response7Days = helper.getLastMessage()
  local data7Days = json.decode(response7Days.Data)

  helper.assertEqual(data7Days.downloads7Days, 2, "Should count 2 downloads in last 7 days")
  helper.assertEqual(data7Days.downloads30Days, nil, "Should not include 30-day count")

  print("✓ Test 2: Aggregate stats - 7 days only")

  -- Test 3: Aggregate stats - 30 days only
  helper.sentMessages = {}
  local aggregate30DaysMsg = {
    Action = "Get-Download-Stats",
    Scope = "all",
    TimeRange = "30",
    From = "requester3",
    Timestamp = tostring(currentTime)
  }

  helper.sendMessage(aggregate30DaysMsg)
  local response30Days = helper.getLastMessage()
  local data30Days = json.decode(response30Days.Data)

  helper.assertEqual(data30Days.downloads30Days, 4, "Should count 4 downloads in last 30 days")
  helper.assertEqual(data30Days.downloads7Days, nil, "Should not include 7-day count")

  print("✓ Test 3: Aggregate stats - 30 days only")

  -- Test 4: Per-skill stats - all time ranges
  helper.sentMessages = {}
  local perSkillMsg = {
    Action = "Get-Download-Stats",
    Name = "popular-skill",
    TimeRange = "all",
    From = "requester4",
    Timestamp = tostring(currentTime)
  }

  helper.sendMessage(perSkillMsg)
  local perSkillResponse = helper.getLastMessage()
  local perSkillData = json.decode(perSkillResponse.Data)

  helper.assertEqual(perSkillData.skillName, "popular-skill", "Should return skill name")
  helper.assertEqual(perSkillData.version, "1.0.0", "Should return version")
  helper.assertEqual(perSkillData.downloadsTotal, 4, "popular-skill should have 4 total downloads")
  helper.assertEqual(perSkillData.downloads7Days, 2, "popular-skill should have 2 downloads in 7 days")
  helper.assertEqual(perSkillData.downloads30Days, 3, "popular-skill should have 3 downloads in 30 days")

  print("✓ Test 4: Per-skill stats with all time ranges")

  -- Test 5: Per-skill stats - specific version
  helper.sentMessages = {}
  local perSkillVersionMsg = {
    Action = "Get-Download-Stats",
    Name = "popular-skill",
    Version = "1.0.0",
    TimeRange = "all",
    From = "requester5",
    Timestamp = tostring(currentTime)
  }

  helper.sendMessage(perSkillVersionMsg)
  local versionResponse = helper.getLastMessage()
  local versionData = json.decode(versionResponse.Data)

  helper.assertEqual(versionData.version, "1.0.0", "Should return requested version")

  print("✓ Test 5: Per-skill stats with specific version")

  -- Test 6: Edge case - skill with no downloads
  helper.sentMessages = {}
  local registerMsg3 = {
    Action = "Register-Skill",
    Name = "new-skill",
    Version = "1.0.0",
    Description = "New skill with no downloads",
    Author = "Test Author",
    Tags = "[]",
    ArweaveTxId = "new123def456ghi789jkl012mno345pqr678stu901v",
    Dependencies = "[]",
    From = "owner789",
    Timestamp = tostring(currentTime)
  }

  helper.sendMessage(registerMsg3)

  local noDownloadsMsg = {
    Action = "Get-Download-Stats",
    Name = "new-skill",
    TimeRange = "all",
    From = "requester6",
    Timestamp = tostring(currentTime)
  }

  helper.sendMessage(noDownloadsMsg)
  local noDownloadsResponse = helper.getLastMessage()
  local noDownloadsData = json.decode(noDownloadsResponse.Data)

  helper.assertEqual(noDownloadsData.downloadsTotal, 0, "New skill should have 0 downloads")
  helper.assertEqual(noDownloadsData.downloads7Days, 0, "New skill should have 0 downloads in 7 days")
  helper.assertEqual(noDownloadsData.downloads30Days, 0, "New skill should have 0 downloads in 30 days")

  print("✓ Test 6: Edge case - skill with no downloads")

  -- Test 7: Error - missing Name for per-skill query
  helper.sentMessages = {}
  local missingNameMsg = {
    Action = "Get-Download-Stats",
    TimeRange = "all",
    From = "requester7",
    Timestamp = tostring(currentTime)
  }

  helper.sendMessage(missingNameMsg)
  local errorResponse = helper.getLastMessage()

  helper.assertEqual(errorResponse.Action, "Error", "Should return error for missing Name")
  helper.assert(string.find(errorResponse.Error, "Name parameter required"), "Error message should mention Name parameter")

  print("✓ Test 7: Error handling - missing Name for per-skill query")

  -- Test 8: Error - non-existent skill
  helper.sentMessages = {}
  local nonExistentMsg = {
    Action = "Get-Download-Stats",
    Name = "nonexistent-skill",
    TimeRange = "all",
    From = "requester8",
    Timestamp = tostring(currentTime)
  }

  helper.sendMessage(nonExistentMsg)
  local notFoundResponse = helper.getLastMessage()

  helper.assertEqual(notFoundResponse.Action, "Error", "Should return error for non-existent skill")
  helper.assert(string.find(notFoundResponse.Error, "Skill not found"), "Error message should mention skill not found")

  print("✓ Test 8: Error handling - non-existent skill")

  -- Test 9: Edge case - all future timestamps (shouldn't count)
  helper.reset()
  helper.setupMockAO()
  dofile("../registry.lua")

  local futureSkillMsg = {
    Action = "Register-Skill",
    Name = "future-skill",
    Version = "1.0.0",
    Description = "Future skill",
    Author = "Test Author",
    Tags = "[]",
    ArweaveTxId = "fut123def456ghi789jkl012mno345pqr678stu901v",
    Dependencies = "[]",
    From = "owner999",
    Timestamp = tostring(currentTime)
  }

  helper.sendMessage(futureSkillMsg)

  -- Record download with future timestamp
  local futureDownloadMsg = {
    Action = "Record-Download",
    Name = "future-skill",
    Version = "1.0.0",
    From = "user_future",
    Timestamp = tostring(currentTime + (10 * 24 * 60 * 60))  -- 10 days in future
  }

  helper.sendMessage(futureDownloadMsg)

  -- Query stats with current time
  local futureStatsMsg = {
    Action = "Get-Download-Stats",
    Name = "future-skill",
    TimeRange = "all",
    From = "requester9",
    Timestamp = tostring(currentTime)
  }

  helper.sendMessage(futureStatsMsg)
  local futureStatsResponse = helper.getLastMessage()
  local futureStatsData = json.decode(futureStatsResponse.Data)

  helper.assertEqual(futureStatsData.downloadsTotal, 1, "Should count future timestamp in total")
  helper.assertEqual(futureStatsData.downloads7Days, 0, "Future timestamp should not count in 7-day range")
  helper.assertEqual(futureStatsData.downloads30Days, 0, "Future timestamp should not count in 30-day range")

  print("✓ Test 9: Edge case - future timestamps excluded from time ranges")

  print("\n=== All Get-Download-Stats Handler Tests Passed ===\n")
end

return {
  run = runTests
}

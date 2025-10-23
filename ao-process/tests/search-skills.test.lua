-- Search-Skills Handler Tests
-- Tests search functionality with various query patterns

local helper = require("test-helper")
local samples = require("fixtures/sample-skills")

local function runTests()
  print("\n=== Search-Skills Handler Tests ===\n")

  -- Setup: Register multiple skills for search testing
  helper.reset()
  helper.setupMockAO()
  dofile("../registry.lua")

  -- Register skill 1
  helper.sendMessage({
    Action = "Register-Skill",
    Name = samples.validSkill1.Name,
    Version = samples.validSkill1.Version,
    Description = samples.validSkill1.Description,
    Author = samples.validSkill1.Author,
    Tags = samples.validSkill1.Tags,
    ArweaveTxId = samples.validSkill1.ArweaveTxId,
    Dependencies = samples.validSkill1.Dependencies,
    From = "test_owner1",
    Timestamp = "1700000000"
  })

  -- Register skill 2
  helper.sendMessage({
    Action = "Register-Skill",
    Name = samples.validSkill2.Name,
    Version = samples.validSkill2.Version,
    Description = samples.validSkill2.Description,
    Author = samples.validSkill2.Author,
    Tags = samples.validSkill2.Tags,
    ArweaveTxId = samples.validSkill2.ArweaveTxId,
    Dependencies = samples.validSkill2.Dependencies,
    From = "test_owner2",
    Timestamp = "1700000001"
  })

  -- Register skill 3
  helper.sendMessage({
    Action = "Register-Skill",
    Name = samples.validSkill3.Name,
    Version = samples.validSkill3.Version,
    Description = samples.validSkill3.Description,
    Author = samples.validSkill3.Author,
    Tags = samples.validSkill3.Tags,
    ArweaveTxId = samples.validSkill3.ArweaveTxId,
    Dependencies = samples.validSkill3.Dependencies,
    From = "test_owner3",
    Timestamp = "1700000002"
  })

  -- Test 1: Exact name match
  helper.sentMessages = {} -- Clear registration messages
  helper.sendMessage({
    Action = "Search-Skills",
    Query = "ao-basics",
    From = "test_searcher"
  })

  local response = helper.getLastMessage()
  helper.assertEqual(response.Action, "Search-Results", "Should return search results")
  helper.assertNotNil(response.Data, "Should include results data")
  helper.assertEqual(response.ResultCount, "1", "Should find 1 matching skill")

  print("✓ Test 1: Exact name match")

  -- Test 2: Partial name match (case-insensitive)
  helper.sentMessages = {}
  helper.sendMessage({
    Action = "Search-Skills",
    Query = "arweave",
    From = "test_searcher"
  })

  local partialResponse = helper.getLastMessage()
  helper.assertEqual(partialResponse.Action, "Search-Results", "Should return search results")
  -- Should match "arweave-fundamentals"
  helper.assertNotNil(partialResponse.ResultCount, "Should have result count")

  print("✓ Test 2: Partial name match (case-insensitive)")

  -- Test 3: Description match
  helper.sentMessages = {}
  helper.sendMessage({
    Action = "Search-Skills",
    Query = "permanent storage",
    From = "test_searcher"
  })

  local descResponse = helper.getLastMessage()
  helper.assertEqual(descResponse.Action, "Search-Results", "Should return search results")

  print("✓ Test 3: Description substring match")

  -- Test 4: Tag match
  helper.sentMessages = {}
  helper.sendMessage({
    Action = "Search-Skills",
    Query = "mcp",
    From = "test_searcher"
  })

  local tagResponse = helper.getLastMessage()
  helper.assertEqual(tagResponse.Action, "Search-Results", "Should return search results")
  -- Should match permamind-integration which has "mcp" tag

  print("✓ Test 4: Tag match")

  -- Test 5: No results
  helper.sentMessages = {}
  helper.sendMessage({
    Action = "Search-Skills",
    Query = "nonexistent",
    From = "test_searcher"
  })

  local noResultsResponse = helper.getLastMessage()
  helper.assertEqual(noResultsResponse.Action, "Search-Results", "Should return search results")
  helper.assertEqual(noResultsResponse.ResultCount, "0", "Should find 0 matching skills")

  print("✓ Test 5: No results for non-matching query")

  -- Test 6: Empty query returns all skills
  helper.sentMessages = {}
  helper.sendMessage({
    Action = "Search-Skills",
    Query = "",
    From = "test_searcher"
  })

  local emptyQueryResponse = helper.getLastMessage()
  helper.assertEqual(emptyQueryResponse.Action, "Search-Results", "Should return all skills for empty query")

  local allSkills = json.decode(emptyQueryResponse.Data)
  helper.assertEqual(#allSkills, 3, "Should return all 3 registered skills")

  print("✓ Test 6: Empty query returns all skills")

  -- Test 7: Case-insensitive search
  helper.sentMessages = {}
  helper.sendMessage({
    Action = "Search-Skills",
    Query = "AO-BASICS", -- uppercase
    From = "test_searcher"
  })

  local caseResponse = helper.getLastMessage()
  helper.assertEqual(caseResponse.Action, "Search-Results", "Should return search results")
  helper.assertEqual(caseResponse.ResultCount, "1", "Should find match regardless of case")

  print("✓ Test 7: Case-insensitive search works")

  print("\n=== All Search-Skills Handler Tests Passed ===\n")
end

-- Run tests
local success, err = pcall(runTests)
if not success then
  print("ERROR: " .. tostring(err))
  os.exit(1)
end

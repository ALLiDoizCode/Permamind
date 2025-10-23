-- List-Skills Handler Tests
-- Tests paginated listing with filtering by author, tags, and name

local helper = require("test-helper")
local samples = require("fixtures/sample-skills")

local function runTests()
  print("\n=== List-Skills Handler Tests ===\n")

  -- Test 1: Basic pagination
  helper.reset()
  helper.setupMockAO()
  dofile("../registry.lua")

  -- Register 5 skills
  for i = 1, 5 do
    local registerMsg = {
      Action = "Register-Skill",
      Name = "skill-" .. i,
      Version = "1.0.0",
      Description = "Test skill " .. i,
      Author = "Test Author",
      Tags = "[]",
      ArweaveTxId = string.format("txid%039d", i),
      Dependencies = "[]",
      From = "owner123abc456def789ghi012jkl345mno678pqr",
      Timestamp = tostring(1700000000 + i)
    }
    helper.sendMessage(registerMsg)
  end

  -- List first 3 skills
  local listMsg = {
    Action = "List-Skills",
    Limit = "3",
    Offset = "0",
    From = "requester123"
  }

  helper.sendMessage(listMsg)
  local response = helper.getLastMessage()
  helper.assertEqual(response.Action, "Skills-List", "Should return skills list")

  local data = json.decode(response.Data)
  helper.assertEqual(#data.skills, 3, "Should return 3 skills")
  helper.assertEqual(data.pagination.total, 5, "Total should be 5")
  helper.assertEqual(data.pagination.limit, 3, "Limit should be 3")
  helper.assertEqual(data.pagination.offset, 0, "Offset should be 0")
  helper.assertEqual(data.pagination.hasNextPage, true, "Should have next page")
  helper.assertEqual(data.pagination.hasPrevPage, false, "Should not have prev page")

  print("✓ Test 1: Basic pagination works")

  -- Test 2: Second page
  local listPage2 = {
    Action = "List-Skills",
    Limit = "3",
    Offset = "3",
    From = "requester123"
  }

  helper.sendMessage(listPage2)
  local response2 = helper.getLastMessage()
  local data2 = json.decode(response2.Data)
  helper.assertEqual(#data2.skills, 2, "Should return 2 remaining skills")
  helper.assertEqual(data2.pagination.hasNextPage, false, "Should not have next page")
  helper.assertEqual(data2.pagination.hasPrevPage, true, "Should have prev page")

  print("✓ Test 2: Second page pagination correct")

  -- Test 3: Filter by author
  helper.reset()
  helper.setupMockAO()
  dofile("../registry.lua")

  -- Register skills from different authors
  local skill1 = {
    Action = "Register-Skill",
    Name = "skill-a",
    Version = "1.0.0",
    Description = "Skill A",
    Author = "Author One",
    Tags = "[]",
    ArweaveTxId = "a123_abc123def456ghi789jkl012mno345pqr678st",
    Dependencies = "[]",
    From = "owner1",
    Timestamp = "1700000000"
  }

  local skill2 = {
    Action = "Register-Skill",
    Name = "skill-b",
    Version = "1.0.0",
    Description = "Skill B",
    Author = "Author Two",
    Tags = "[]",
    ArweaveTxId = "b123_def456ghi789jkl012mno345pqr678stu901w",
    Dependencies = "[]",
    From = "owner2",
    Timestamp = "1700001000"
  }

  helper.sendMessage(skill1)
  helper.sendMessage(skill2)

  -- Filter by author
  local filterAuthor = {
    Action = "List-Skills",
    Author = "Author One",
    From = "requester123"
  }

  helper.sendMessage(filterAuthor)
  local authorResponse = helper.getLastMessage()
  local authorData = json.decode(authorResponse.Data)
  helper.assertEqual(#authorData.skills, 1, "Should return 1 skill by Author One")
  helper.assertEqual(authorData.skills[1].author, "Author One", "Should match author")

  print("✓ Test 3: Filter by author works")

  -- Test 4: Filter by tags
  helper.reset()
  helper.setupMockAO()
  dofile("../registry.lua")

  local aoSkill = {
    Action = "Register-Skill",
    Name = "ao-skill",
    Version = "1.0.0",
    Description = "AO skill",
    Author = "Test Author",
    Tags = '["ao", "tutorial"]',
    ArweaveTxId = "ao_abc123def456ghi789jkl012mno345pqr678stu",
    Dependencies = "[]",
    From = "owner123abc456def789ghi012jkl345mno678pqr",
    Timestamp = "1700000000"
  }

  local reactSkill = {
    Action = "Register-Skill",
    Name = "react-skill",
    Version = "1.0.0",
    Description = "React skill",
    Author = "Test Author",
    Tags = '["react", "frontend"]',
    ArweaveTxId = "react_def456ghi789jkl012mno345pqr678stu901",
    Dependencies = "[]",
    From = "owner123abc456def789ghi012jkl345mno678pqr",
    Timestamp = "1700001000"
  }

  helper.sendMessage(aoSkill)
  helper.sendMessage(reactSkill)

  -- Filter by tags
  local filterTags = {
    Action = "List-Skills",
    FilterTags = '["ao"]',
    From = "requester123"
  }

  helper.sendMessage(filterTags)
  local tagsResponse = helper.getLastMessage()
  local tagsData = json.decode(tagsResponse.Data)
  helper.assertEqual(#tagsData.skills, 1, "Should return 1 skill with 'ao' tag")
  helper.assertEqual(tagsData.skills[1].name, "ao-skill", "Should be ao-skill")

  print("✓ Test 4: Filter by tags works")

  -- Test 5: Filter by name pattern
  local filterName = {
    Action = "List-Skills",
    FilterName = "ao",
    From = "requester123"
  }

  helper.sendMessage(filterName)
  local nameResponse = helper.getLastMessage()
  local nameData = json.decode(nameResponse.Data)
  helper.assertEqual(#nameData.skills, 1, "Should return 1 skill with 'ao' in name")
  helper.assertEqual(nameData.skills[1].name, "ao-skill", "Should be ao-skill")

  print("✓ Test 5: Filter by name pattern works")

  -- Test 6: Combined filters (author + tags)
  helper.reset()
  helper.setupMockAO()
  dofile("../registry.lua")

  local skill1Combined = {
    Action = "Register-Skill",
    Name = "skill-1",
    Version = "1.0.0",
    Description = "Skill 1",
    Author = "Permamind Team",
    Tags = '["ao", "tutorial"]',
    ArweaveTxId = "s1_abc123def456ghi789jkl012mno345pqr678stu",
    Dependencies = "[]",
    From = "owner1",
    Timestamp = "1700000000"
  }

  local skill2Combined = {
    Action = "Register-Skill",
    Name = "skill-2",
    Version = "1.0.0",
    Description = "Skill 2",
    Author = "Permamind Team",
    Tags = '["react"]',
    ArweaveTxId = "s2_def456ghi789jkl012mno345pqr678stu901wx",
    Dependencies = "[]",
    From = "owner2",
    Timestamp = "1700001000"
  }

  helper.sendMessage(skill1Combined)
  helper.sendMessage(skill2Combined)

  -- Filter by both author and tags
  local combinedFilter = {
    Action = "List-Skills",
    Author = "Permamind Team",
    FilterTags = '["ao"]',
    From = "requester123"
  }

  helper.sendMessage(combinedFilter)
  local combinedResponse = helper.getLastMessage()
  local combinedData = json.decode(combinedResponse.Data)
  helper.assertEqual(#combinedData.skills, 1, "Should return only skill matching both filters")
  helper.assertEqual(combinedData.skills[1].name, "skill-1", "Should be skill-1")

  print("✓ Test 6: Combined filters work correctly")

  -- Test 7: Limit validation (max 100)
  local limitMsg = {
    Action = "List-Skills",
    Limit = "200",
    From = "requester123"
  }

  helper.sendMessage(limitMsg)
  local limitResponse = helper.getLastMessage()
  local limitData = json.decode(limitResponse.Data)
  helper.assertEqual(limitData.pagination.limit, 100, "Limit should be capped at 100")

  print("✓ Test 7: Limit capped at maximum 100")

  -- Test 8: List returns latest versions only
  helper.reset()
  helper.setupMockAO()
  dofile("../registry.lua")

  -- Register v1.0.0
  helper.sendMessage(registerV1)
  -- Register v1.0.1
  helper.sendMessage(registerV1_1)

  local listAll = {
    Action = "List-Skills",
    From = "requester123"
  }

  helper.sendMessage(listAll)
  local listResponse = helper.getLastMessage()
  local listData = json.decode(listResponse.Data)
  helper.assertEqual(#listData.skills, 1, "Should return 1 skill")
  helper.assertEqual(listData.skills[1].version, "1.0.1", "Should return latest version only")

  print("✓ Test 8: List returns latest versions only")

  print("\n=== All List-Skills Tests Passed ===\n")
end

return {
  run = runTests
}

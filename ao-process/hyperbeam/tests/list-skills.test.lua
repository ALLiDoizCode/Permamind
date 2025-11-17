-- Test Suite for list-skills.lua HyperBEAM Dynamic Read Script

-- Load test helper and fixtures
local helper = dofile("ao-process/hyperbeam/tests/test-helper.lua")
local base = dofile("ao-process/hyperbeam/tests/fixtures/sample-skills.lua")

-- Load the script under test
dofile("ao-process/hyperbeam/list-skills.lua")

print("\n=== Running list-skills.lua Tests ===\n")

local testsRun = 0
local testsPassed = 0
local testsFailed = 0

local function runTest(testName, testFunc)
  testsRun = testsRun + 1
  io.write(string.format("Test %d: %s ... ", testsRun, testName))

  local success, err = pcall(testFunc)

  if success then
    testsPassed = testsPassed + 1
    print("✓ PASS")
  else
    testsFailed = testsFailed + 1
    print("✗ FAIL")
    print(string.format("  Error: %s", err))
  end
end

-- Test 1: Default pagination (limit=10, offset=0)
runTest("Default pagination returns 10 skills", function()
  local result = listSkills(base, {})

  helper.assertEquals(result.status, 200, "status should be 200")
  helper.assertEquals(result.pagination.limit, 10, "default limit should be 10")
  helper.assertEquals(result.pagination.offset, 0, "default offset should be 0")
  helper.assertTrue(#result.skills <= 10, "should return at most 10 skills")
end)

-- Test 2: Custom limit
runTest("Custom limit=5 returns 5 skills", function()
  local result = listSkills(base, {limit = "5"})

  helper.assertEquals(#result.skills, 5, "should return exactly 5 skills")
  helper.assertEquals(result.pagination.returned, 5, "returned count should be 5")
end)

-- Test 3: Max limit enforcement (limit > 100)
runTest("Limit > 100 capped at 100", function()
  local result = listSkills(base, {limit = "200"})

  helper.assertEquals(result.pagination.limit, 100, "limit should be capped at 100")
end)

-- Test 4: Pagination metadata (hasNextPage)
runTest("hasNextPage=true when more results available", function()
  local result = listSkills(base, {limit = "10", offset = "0"})

  helper.assertEquals(result.status, 200, "status should be 200")
  helper.assertTrue(result.pagination.hasNextPage, "should have next page (21 total skills)")
end)

-- Test 5: hasPrevPage=false on first page
runTest("hasPrevPage=false on first page", function()
  local result = listSkills(base, {limit = "10", offset = "0"})

  helper.assertTrue(not result.pagination.hasPrevPage, "should not have previous page")
end)

-- Test 6: Author filtering
runTest("Author filter for 'John Smith'", function()
  local result = listSkills(base, {author = "John Smith"})

  helper.assertTrue(#result.skills >= 2, "should find John Smith's skills")

  -- All results should be by John Smith
  for _, skill in ipairs(result.skills) do
    helper.assertTrue(
      string.lower(skill.author) == "john smith",
      "all skills should be by John Smith"
    )
  end
end)

-- Test 7: Tag filtering (JSON array)
runTest("Tag filter for ['web3']", function()
  local result = listSkills(base, {filterTags = '["web3"]'})

  helper.assertTrue(#result.skills >= 2, "should find web3 skills")

  -- Verify all results have web3 tag
  for _, skill in ipairs(result.skills) do
    local hasWeb3 = false
    if skill.tags then
      for _, tag in ipairs(skill.tags) do
        if string.lower(tag) == "web3" then
          hasWeb3 = true
          break
        end
      end
    end
    helper.assertTrue(hasWeb3, "all skills should have web3 tag")
  end
end)

-- Test 8: Name pattern filtering
runTest("Name pattern filter for 'ao'", function()
  local result = listSkills(base, {filterName = "ao"})

  helper.assertTrue(#result.skills >= 2, "should find ao-related skills")

  -- All results should have 'ao' in name
  for _, skill in ipairs(result.skills) do
    helper.assertTrue(
      string.find(string.lower(skill.name), "ao", 1, true) ~= nil,
      string.format("skill name '%s' should contain 'ao'", skill.name)
    )
  end
end)

-- Print summary
print("\n=== Test Summary ===")
print(string.format("Tests run: %d", testsRun))
print(string.format("Tests passed: %d ✓", testsPassed))
print(string.format("Tests failed: %d ✗", testsFailed))

if testsFailed == 0 then
  print("\n✓ All tests passed!")
  os.exit(0)
else
  print(string.format("\n✗ %d test(s) failed", testsFailed))
  os.exit(1)
end

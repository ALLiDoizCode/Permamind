-- Test Suite for search-skills.lua HyperBEAM Dynamic Read Script

-- Load test helper and fixtures
local helper = dofile("ao-process/hyperbeam/tests/test-helper.lua")
local base = dofile("ao-process/hyperbeam/tests/fixtures/sample-skills.lua")

-- Load the script under test
dofile("ao-process/hyperbeam/search-skills.lua")

print("\n=== Running search-skills.lua Tests ===\n")

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

-- Test 1: Empty query returns all skills
runTest("Empty query returns all skills", function()
  local result = searchSkills(base, {query = ""})

  helper.assertNotNil(result.results, "results should not be nil")
  helper.assertEquals(result.query, "", "query should be empty string")
  helper.assertTrue(#result.results == 21, string.format("should return 21 skills, got %d", #result.results))
  helper.assertEquals(result.total, 21, "total should be 21")
end)

-- Test 2: Search by name (case-insensitive)
runTest("Search by skill name (blockchain)", function()
  local result = searchSkills(base, {query = "blockchain"})

  helper.assertNotNil(result.results, "results should not be nil")
  helper.assertEquals(result.query, "blockchain", "query should match")
  helper.assertTrue(#result.results >= 1, "should find at least 1 blockchain skill")

  -- Verify blockchain-fundamentals is in results
  local found = false
  for _, skill in ipairs(result.results) do
    if skill.name == "blockchain-fundamentals" then
      found = true
      break
    end
  end
  helper.assertTrue(found, "should find blockchain-fundamentals skill")
end)

-- Test 3: Case-insensitive search
runTest("Case-insensitive search (AO vs ao)", function()
  local resultLower = searchSkills(base, {query = "ao"})
  local resultUpper = searchSkills(base, {query = "AO"})

  helper.assertEquals(#resultLower.results, #resultUpper.results,
    "case should not affect search results")
end)

-- Test 4: Search by description
runTest("Search by description (TypeScript)", function()
  local result = searchSkills(base, {query = "TypeScript"})

  helper.assertTrue(#result.results >= 1, "should find TypeScript-related skills")

  -- Should find typescript-best-practices and possibly react-components
  local foundTypescript = false
  for _, skill in ipairs(result.results) do
    if skill.name == "typescript-best-practices" then
      foundTypescript = true
      break
    end
  end
  helper.assertTrue(foundTypescript, "should find typescript-best-practices")
end)

-- Test 5: Search by tag
runTest("Search by tag (web3)", function()
  local result = searchSkills(base, {query = "web3"})

  helper.assertTrue(#result.results >= 2, "should find multiple web3 skills")

  -- Should find blockchain-fundamentals, arweave-integration, ao-token-economics
  local skillNames = {}
  for _, skill in ipairs(result.results) do
    table.insert(skillNames, skill.name)
  end

  local hasBlockchain = false
  local hasArweave = false
  for _, name in ipairs(skillNames) do
    if name == "blockchain-fundamentals" then hasBlockchain = true end
    if name == "arweave-integration" then hasArweave = true end
  end

  helper.assertTrue(hasBlockchain or hasArweave,
    "should find web3-tagged skills")
end)

-- Test 6: Search by author
runTest("Search by author (John Smith)", function()
  local result = searchSkills(base, {query = "John Smith"})

  helper.assertTrue(#result.results >= 2, "should find John Smith's skills")

  -- Should find ao-basics and ao-advanced-patterns
  local foundBasics = false
  local foundAdvanced = false
  for _, skill in ipairs(result.results) do
    if skill.name == "ao-basics" then foundBasics = true end
    if skill.name == "ao-advanced-patterns" then foundAdvanced = true end
  end

  helper.assertTrue(foundBasics or foundAdvanced,
    "should find John Smith's skills")
end)

-- Test 7: Non-existent query returns empty results
runTest("Non-existent query returns empty results", function()
  local result = searchSkills(base, {query = "nonexistentskill123xyz"})

  helper.assertNotNil(result.results, "results should not be nil")
  helper.assertEquals(#result.results, 0, "should return 0 results")
  helper.assertEquals(result.total, 0, "total should be 0")
end)

-- Test 8: Nil query returns all skills (same as empty)
runTest("Nil query returns all skills", function()
  local result = searchSkills(base, {})

  helper.assertNotNil(result.results, "results should not be nil")
  helper.assertTrue(#result.results == 21, "should return all 21 skills")
  helper.assertEquals(result.total, 21, "total should be 21")
end)

-- Test 9: Special characters in query
runTest("Special characters in query (docker-kubernetes)", function()
  local result = searchSkills(base, {query = "docker-kubernetes"})

  helper.assertTrue(#result.results >= 1, "should find docker-kubernetes skill")

  local found = false
  for _, skill in ipairs(result.results) do
    if skill.name == "docker-kubernetes" then
      found = true
      break
    end
  end
  helper.assertTrue(found, "should find docker-kubernetes by exact name")
end)

-- Test 10: Partial word match
runTest("Partial word match (test in testing)", function()
  local result = searchSkills(base, {query = "test"})

  helper.assertTrue(#result.results >= 1, "should find testing-related skills")

  -- Should find testing-strategies
  local found = false
  for _, skill in ipairs(result.results) do
    if skill.name == "testing-strategies" then
      found = true
      break
    end
  end
  helper.assertTrue(found, "should find testing-strategies")
end)

-- Test 11: Returns latest version only (not all versions)
runTest("Returns latest version only for ao-basics", function()
  local result = searchSkills(base, {query = "ao-basics"})

  helper.assertTrue(#result.results >= 1, "should find ao-basics")

  -- Find ao-basics in results
  local aoBasics = nil
  for _, skill in ipairs(result.results) do
    if skill.name == "ao-basics" then
      aoBasics = skill
      break
    end
  end

  helper.assertNotNil(aoBasics, "should find ao-basics skill")
  helper.assertEquals(aoBasics.version, "1.2.0", "should return latest version 1.2.0")
end)

-- Test 12: Result structure validation
runTest("Result structure has all required fields", function()
  local result = searchSkills(base, {query = "blockchain"})

  helper.assertNotNil(result.results, "should have results field")
  helper.assertNotNil(result.total, "should have total field")
  helper.assertNotNil(result.query, "should have query field")

  -- Check first result has skill metadata
  if #result.results > 0 then
    local skill = result.results[1]
    helper.assertNotNil(skill.name, "skill should have name")
    helper.assertNotNil(skill.version, "skill should have version")
    helper.assertNotNil(skill.description, "skill should have description")
    helper.assertNotNil(skill.author, "skill should have author")
    helper.assertNotNil(skill.tags, "skill should have tags")
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

-- Test Suite for get-skill.lua HyperBEAM Dynamic Read Script

-- Load test helper and fixtures
local helper = dofile("ao-process/hyperbeam/tests/test-helper.lua")
local base = dofile("ao-process/hyperbeam/tests/fixtures/sample-skills.lua")

-- Load the script under test
dofile("ao-process/hyperbeam/get-skill.lua")

print("\n=== Running get-skill.lua Tests ===\n")

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

-- Test 1: Valid skill name returns latest version
runTest("Valid skill name returns latest version", function()
  local result = getSkill(base, {name = "ao-basics"})

  helper.assertNotNil(result.skill, "should have skill object")
  helper.assertEquals(result.status, 200, "status should be 200")
  helper.assertEquals(result.skill.name, "ao-basics", "skill name should match")
  helper.assertEquals(result.skill.version, "1.2.0", "should return latest version")
end)

-- Test 2: Missing name parameter returns 400
runTest("Missing name parameter returns 400", function()
  local result = getSkill(base, {})

  helper.assertNotNil(result.error, "should have error message")
  helper.assertEquals(result.status, 400, "status should be 400")
end)

-- Test 3: Empty name parameter returns 400
runTest("Empty name parameter returns 400", function()
  local result = getSkill(base, {name = ""})

  helper.assertNotNil(result.error, "should have error message")
  helper.assertEquals(result.status, 400, "status should be 400")
end)

-- Test 4: Non-existent skill returns 404
runTest("Non-existent skill returns 404", function()
  local result = getSkill(base, {name = "nonexistent-skill"})

  helper.assertNotNil(result.error, "should have error message")
  helper.assertEquals(result.status, 404, "status should be 404")
end)

-- Test 5: Result has all metadata fields
runTest("Result has all required metadata fields", function()
  local result = getSkill(base, {name = "blockchain-fundamentals"})

  helper.assertEquals(result.status, 200, "status should be 200")
  local skill = result.skill
  helper.assertNotNil(skill.name, "should have name")
  helper.assertNotNil(skill.version, "should have version")
  helper.assertNotNil(skill.description, "should have description")
  helper.assertNotNil(skill.author, "should have author")
  helper.assertNotNil(skill.tags, "should have tags")
  helper.assertNotNil(skill.arweaveTxId, "should have arweaveTxId")
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

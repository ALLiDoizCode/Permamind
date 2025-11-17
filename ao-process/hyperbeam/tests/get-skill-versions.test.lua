-- Test Suite for get-skill-versions.lua HyperBEAM Dynamic Read Script

local helper = dofile("ao-process/hyperbeam/tests/test-helper.lua")
local base = dofile("ao-process/hyperbeam/tests/fixtures/sample-skills.lua")
dofile("ao-process/hyperbeam/get-skill-versions.lua")

print("\n=== Running get-skill-versions.lua Tests ===\n")

local testsRun, testsPassed, testsFailed = 0, 0, 0
local function runTest(name, func)
  testsRun = testsRun + 1
  io.write(string.format("Test %d: %s ... ", testsRun, name))
  local success, err = pcall(func)
  if success then testsPassed = testsPassed + 1; print("✓ PASS")
  else testsFailed = testsFailed + 1; print("✗ FAIL\n  Error: " .. err) end
end

runTest("Returns all versions for skill with multiple versions", function()
  local result = getSkillVersions(base, {name = "ao-basics"})
  helper.assertEquals(result.status, 200, "status should be 200")
  helper.assertEquals(#result.versions, 3, "should have 3 versions")
  helper.assertEquals(result.latest, "1.2.0", "latest should be 1.2.0")
end)

runTest("Versions sorted by version number (descending)", function()
  local result = getSkillVersions(base, {name = "ao-basics"})
  helper.assertEquals(result.versions[1].version, "1.2.0", "first should be 1.2.0")
  helper.assertEquals(result.versions[2].version, "1.1.0", "second should be 1.1.0")
  helper.assertEquals(result.versions[3].version, "1.0.0", "third should be 1.0.0")
end)

runTest("Missing name parameter returns 400", function()
  local result = getSkillVersions(base, {})
  helper.assertEquals(result.status, 400, "status should be 400")
  helper.assertNotNil(result.error, "should have error message")
end)

runTest("Non-existent skill returns 404", function()
  local result = getSkillVersions(base, {name = "nonexistent"})
  helper.assertEquals(result.status, 404, "status should be 404")
end)

print("\n=== Test Summary ===")
print(string.format("Tests run: %d | Passed: %d ✓ | Failed: %d ✗", testsRun, testsPassed, testsFailed))
if testsFailed == 0 then print("\n✓ All tests passed!"); os.exit(0)
else print(string.format("\n✗ %d test(s) failed", testsFailed)); os.exit(1) end

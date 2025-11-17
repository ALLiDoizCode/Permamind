-- Test Suite for info.lua HyperBEAM Dynamic Read Script

local helper = dofile("ao-process/hyperbeam/tests/test-helper.lua")
local base = dofile("ao-process/hyperbeam/tests/fixtures/sample-skills.lua")
dofile("ao-process/hyperbeam/info.lua")

print("\n=== Running info.lua Tests ===\n")

local testsRun, testsPassed, testsFailed = 0, 0, 0
local function runTest(name, func)
  testsRun = testsRun + 1
  io.write(string.format("Test %d: %s ... ", testsRun, name))
  local success, err = pcall(func)
  if success then testsPassed = testsPassed + 1; print("✓ PASS")
  else testsFailed = testsFailed + 1; print("✗ FAIL\n  Error: " .. err) end
end

runTest("Returns ADP v1.0 compliant metadata", function()
  local result = info(base, {})
  helper.assertEquals(result.status, 200, "status should be 200")
  helper.assertNotNil(result.process, "should have process metadata")
  helper.assertEquals(result.process.adpVersion, "1.0", "adpVersion should be 1.0")
  helper.assertEquals(result.process.name, "Agent Skills Registry", "process name")
end)

runTest("Includes capabilities array", function()
  local result = info(base, {})
  helper.assertNotNil(result.process.capabilities, "should have capabilities")
  helper.assertTrue(#result.process.capabilities > 0, "capabilities not empty")
end)

runTest("Includes handlers array", function()
  local result = info(base, {})
  helper.assertNotNil(result.handlers, "should have handlers")
  helper.assertTableContains(result.handlers, "Register-Skill", "has Register-Skill")
  helper.assertTableContains(result.handlers, "Search-Skills", "has Search-Skills")
end)

runTest("Includes message schemas", function()
  local result = info(base, {})
  helper.assertNotNil(result.process.messageSchemas, "should have messageSchemas")
  helper.assertNotNil(result.process.messageSchemas["Register-Skill"], "has Register-Skill schema")
end)

print("\n=== Test Summary ===")
print(string.format("Tests run: %d | Passed: %d ✓ | Failed: %d ✗", testsRun, testsPassed, testsFailed))
if testsFailed == 0 then print("\n✓ All tests passed!"); os.exit(0)
else print(string.format("\n✗ %d test(s) failed", testsFailed)); os.exit(1) end

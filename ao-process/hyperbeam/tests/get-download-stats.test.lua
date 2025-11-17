-- Test Suite for get-download-stats.lua HyperBEAM Dynamic Read Script

local helper = dofile("ao-process/hyperbeam/tests/test-helper.lua")
local base = dofile("ao-process/hyperbeam/tests/fixtures/sample-skills.lua")
dofile("ao-process/hyperbeam/get-download-stats.lua")

print("\n=== Running get-download-stats.lua Tests ===\n")

local testsRun, testsPassed, testsFailed = 0, 0, 0
local function runTest(name, func)
  testsRun = testsRun + 1
  io.write(string.format("Test %d: %s ... ", testsRun, name))
  local success, err = pcall(func)
  if success then testsPassed = testsPassed + 1; print("✓ PASS")
  else testsFailed = testsFailed + 1; print("✗ FAIL\n  Error: " .. err) end
end

runTest("Returns total downloads across all versions", function()
  local result = getDownloadStats(base, {name = "ao-basics"})
  helper.assertEquals(result.status, 200, "status should be 200")
  helper.assertEquals(result.skillName, "ao-basics", "skillName should match")
  -- 150 + 85 + 42 = 277
  helper.assertEquals(result.totalDownloads, 277, "total should be 277")
  helper.assertEquals(result.latestVersion, "1.2.0", "latest should be 1.2.0")
end)

runTest("Returns per-version download counts", function()
  local result = getDownloadStats(base, {name = "ao-basics"})
  helper.assertNotNil(result.versions["1.0.0"], "should have 1.0.0 stats")
  helper.assertEquals(result.versions["1.0.0"].downloads, 150, "1.0.0 downloads")
  helper.assertEquals(result.versions["1.2.0"].downloads, 42, "1.2.0 downloads")
end)

runTest("Handles skill with zero downloads", function()
  local result = getDownloadStats(base, {name = "arweave-integration"})
  helper.assertEquals(result.totalDownloads, 0, "total should be 0")
end)

runTest("Missing name returns 400", function()
  local result = getDownloadStats(base, {})
  helper.assertEquals(result.status, 400, "status should be 400")
end)

print("\n=== Test Summary ===")
print(string.format("Tests run: %d | Passed: %d ✓ | Failed: %d ✗", testsRun, testsPassed, testsFailed))
if testsFailed == 0 then print("\n✓ All tests passed!"); os.exit(0)
else print(string.format("\n✗ %d test(s) failed", testsFailed)); os.exit(1) end

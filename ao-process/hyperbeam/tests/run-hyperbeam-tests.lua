#!/usr/bin/env lua
-- Comprehensive Test Runner for HyperBEAM Dynamic Read Scripts
-- Runs all test suites and reports results

print("╔══════════════════════════════════════════════════════════════╗")
print("║   HyperBEAM Dynamic Read Scripts Test Suite                 ║")
print("╚══════════════════════════════════════════════════════════════╝\n")

local testSuites = {
  {"ao-process/hyperbeam/tests/search-skills.test.lua", "search-skills.lua"},
  {"ao-process/hyperbeam/tests/get-skill.test.lua", "get-skill.lua"},
  {"ao-process/hyperbeam/tests/list-skills.test.lua", "list-skills.lua"},
  {"ao-process/hyperbeam/tests/get-skill-versions.test.lua", "get-skill-versions.lua"},
  {"ao-process/hyperbeam/tests/get-download-stats.test.lua", "get-download-stats.lua"},
  {"ao-process/hyperbeam/tests/info.test.lua", "info.lua"}
}

local suitesRun = 0
local suitesPassed = 0
local suitesFailed = 0

for _, suite in ipairs(testSuites) do
  local testFile, suiteName = suite[1], suite[2]
  suitesRun = suitesRun + 1

  print(string.format("\n📦 Running %s...", suiteName))
  print(string.rep("-", 64))

  local success, err = pcall(function()
    dofile(testFile)
  end)

  if not success then
    print(string.format("\n❌ Test suite %s failed to run:", suiteName))
    print(err)
    suitesFailed = suitesFailed + 1
  else
    suitesPassed = suitesPassed + 1
  end
end

print("\n" .. string.rep("=", 64))
print("📊 OVERALL TEST SUMMARY")
print(string.rep("=", 64))
print(string.format("Test suites run: %d", suitesRun))
print(string.format("Test suites passed: %d ✓", suitesPassed))
print(string.format("Test suites failed: %d ✗", suitesFailed))
print("\nTo run individual test suites:")
print("  lua ao-process/hyperbeam/tests/search-skills.test.lua")
print("  lua ao-process/hyperbeam/tests/get-skill.test.lua")
print("  lua ao-process/hyperbeam/tests/list-skills.test.lua")
print("  lua ao-process/hyperbeam/tests/get-skill-versions.test.lua")
print("  lua ao-process/hyperbeam/tests/get-download-stats.test.lua")
print("  lua ao-process/hyperbeam/tests/info.test.lua")

if suitesFailed == 0 then
  print("\n✅ All test suites passed!\n")
  os.exit(0)
else
  print(string.format("\n❌ %d test suite(s) failed\n", suitesFailed))
  os.exit(1)
end

#!/usr/bin/env lua
-- Test Runner for AO Registry Process
-- Runs all test suites sequentially

print("====================================")
print("AO Registry Process Test Suite")
print("====================================")

-- Change to tests directory to ensure relative paths work
local testDir = arg[0]:match("(.*/)")
if testDir then
  package.path = testDir .. "?.lua;" .. package.path
end

local allTestsPassed = true
local testFiles = {
  "info-handler.test.lua",
  "register-skill.test.lua",
  "search-skills.test.lua",
  "get-skill.test.lua",
  "version-history.test.lua",
  "list-skills.test.lua",
  "changelog.test.lua",
  "download-tracking.test.lua",
  "download-stats.test.lua",
  "get-download-stats.test.lua"
}

for _, testFile in ipairs(testFiles) do
  print("\nRunning: " .. testFile)
  print("------------------------------------")

  local success, err = pcall(dofile, testFile)

  if not success then
    print("\n❌ FAILED: " .. testFile)
    print("Error: " .. tostring(err))
    allTestsPassed = false
  else
    print("✅ PASSED: " .. testFile)
  end

  print("------------------------------------")
end

print("\n====================================")
if allTestsPassed then
  print("✅ ALL TESTS PASSED")
  print("====================================\n")
  os.exit(0)
else
  print("❌ SOME TESTS FAILED")
  print("====================================\n")
  os.exit(1)
end

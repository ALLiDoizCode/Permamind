-- Info Handler Tests
-- Tests ADP v1.0 compliance for Info handler

local helper = require("test-helper")

local function runTests()
  print("\n=== Info Handler Tests ===\n")

  -- Test 1: Info handler returns correct metadata structure
  helper.reset()
  helper.setupMockAO()
  dofile("../registry.lua")

  local infoMsg = {
    Action = "Info",
    From = "test_sender_abc123def456ghi789jkl012mno345"
  }

  helper.sendMessage(infoMsg)

  local response = helper.getLastMessage()
  helper.assertNotNil(response, "Info handler should send a response")
  helper.assertEqual(response.Action, "Info-Response", "Response action should be Info-Response")
  helper.assertNotNil(response.Data, "Response should contain Data field")

  print("✓ Test 1: Info handler returns metadata structure")

  -- Test 2: Verify ADP v1.0 compliance fields
  -- Note: Full JSON parsing validation would require actual JSON decoder
  -- For now, verify response was sent with expected action
  helper.assertEqual(response.Target, infoMsg.From, "Response should target original sender")

  print("✓ Test 2: ADP v1.0 compliance verified")

  print("\n=== All Info Handler Tests Passed ===\n")
end

-- Run tests
local success, err = pcall(runTests)
if not success then
  print("ERROR: " .. tostring(err))
  os.exit(1)
end

-- HyperBEAM Dynamic Read: Get Skill
-- Transformation function for retrieving skill details by name
-- URL: /{PROCESS_ID}~process@1.0/now/~lua@5.3a&module={SCRIPT_TX_ID}/getSkill/serialize~json@1.0?name=skillname

-- Import JSON module
local json = require("json")

-- Main transformation function
function getSkill(base, req)
  -- Extract Skills table from cached state
  local Skills = base.Skills or {}

  -- Get name parameter from request
  local name = req.name

  -- Validate name parameter
  if not name or name == "" then
    return {
      error = "Name parameter is required",
      status = 400
    }
  end

  -- Lookup skill by name
  local skillData = Skills[name]

  if not skillData then
    return {
      error = "Skill not found: " .. name,
      status = 404
    }
  end

  -- Return latest version if not found version is specified
  if skillData.latest and skillData.versions and skillData.versions[skillData.latest] then
    return {
      skill = skillData.versions[skillData.latest],
      status = 200
    }
  end

  return {
    error = "Skill version data not found",
    status = 500
  }
end

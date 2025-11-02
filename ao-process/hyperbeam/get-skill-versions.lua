-- HyperBEAM Dynamic Read: Get Skill Versions
-- Transformation function for retrieving version history by skill name
-- URL: /{PROCESS_ID}~process@1.0/now/~lua@5.3a&module={SCRIPT_TX_ID}/getSkillVersions/serialize~json@1.0?name=skillname

-- Import JSON module
local json = require("json")

-- Compare semantic versions (e.g., "1.0.0")
-- Returns true if v1 > v2
local function compareVersions(v1, v2)
  if not v1 or not v2 then return false end

  local major1, minor1, patch1 = string.match(v1, "(%d+)%.(%d+)%.(%d+)")
  local major2, minor2, patch2 = string.match(v2, "(%d+)%.(%d+)%.(%d+)")

  if not major1 or not major2 then return false end

  major1, minor1, patch1 = tonumber(major1), tonumber(minor1), tonumber(patch1)
  major2, minor2, patch2 = tonumber(major2), tonumber(minor2), tonumber(patch2)

  if major1 ~= major2 then return major1 > major2 end
  if minor1 ~= minor2 then return minor1 > minor2 end
  return patch1 > patch2
end

-- Main transformation function
function getSkillVersions(base, req)
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

  if not skillData or not skillData.versions then
    return {
      error = "Skill not found: " .. name,
      status = 404
    }
  end

  -- Convert versions table to sorted array (latest first)
  local versionArray = {}
  for versionNum, versionData in pairs(skillData.versions) do
    table.insert(versionArray, versionData)
  end

  -- Sort by version number (descending)
  table.sort(versionArray, function(a, b)
    return compareVersions(a.version, b.version)
  end)

  return {
    versions = versionArray,
    latest = skillData.latest,
    total = #versionArray,
    status = 200
  }
end

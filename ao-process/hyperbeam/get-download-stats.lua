-- HyperBEAM Dynamic Read: Get Download Stats
-- Transformation function for retrieving download statistics by skill name
-- URL: /{PROCESS_ID}~process@1.0/now/~lua@5.3a&module={SCRIPT_TX_ID}/getDownloadStats/serialize~json@1.0?name=skillname

-- Import JSON module
local json = require("json")

-- Main transformation function
function getDownloadStats(base, req)
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

  -- Calculate total downloads across all versions
  local totalDownloads = 0
  local versionStats = {}

  for versionNum, versionData in pairs(skillData.versions) do
    local downloadCount = versionData.downloadCount or 0
    totalDownloads = totalDownloads + downloadCount

    versionStats[versionNum] = {
      version = versionNum,
      downloads = downloadCount
    }
  end

  return {
    skillName = name,
    totalDownloads = totalDownloads,
    versions = versionStats,
    latestVersion = skillData.latest,
    status = 200
  }
end

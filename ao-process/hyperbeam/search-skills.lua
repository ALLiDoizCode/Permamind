-- HyperBEAM Dynamic Read: Search Skills
-- Transformation function for searching skills by query term
-- URL: /{PROCESS_ID}~process@1.0/now/~lua@5.3a&module={SCRIPT_TX_ID}/searchSkills/serialize~json@1.0?query=term

-- Import JSON module
local json = require("json")

-- Convert string to lowercase for case-insensitive comparison
local function toLower(str)
  if not str then return "" end
  return string.lower(str)
end

-- Check if a string contains a substring (case-insensitive)
local function contains(str, substr)
  if not str or not substr then return false end
  return string.find(toLower(str), toLower(substr), 1, true) ~= nil
end

-- Check if table contains value (case-insensitive for strings)
local function tableContains(tbl, value)
  if not tbl or type(tbl) ~= "table" then return false end
  for _, v in ipairs(tbl) do
    if toLower(tostring(v)) == toLower(tostring(value)) then
      return true
    end
  end
  return false
end

-- Main transformation function
function searchSkills(base, req)
  -- Extract Skills table from cached state
  local Skills = base.Skills or {}

  -- Get query parameter from request
  local query = req.query or ""
  local searchTerm = toLower(query)

  -- If no query provided, return all skills (latest versions only)
  if query == "" or query == nil then
    local results = {}
    for skillName, skillData in pairs(Skills) do
      if skillData.latest and skillData.versions and skillData.versions[skillData.latest] then
        table.insert(results, skillData.versions[skillData.latest])
      end
    end

    return {
      results = results,
      total = #results,
      query = ""
    }
  end

  -- Search skills by name, description, or tags
  local results = {}
  for skillName, skillData in pairs(Skills) do
    if skillData.latest and skillData.versions and skillData.versions[skillData.latest] then
      local latestVersion = skillData.versions[skillData.latest]

      -- Match against name, description, tags
      local matchesName = contains(latestVersion.name or "", searchTerm)
      local matchesDescription = contains(latestVersion.description or "", searchTerm)
      local matchesAuthor = contains(latestVersion.author or "", searchTerm)

      -- Check tags
      local matchesTags = false
      if latestVersion.tags and type(latestVersion.tags) == "table" then
        matchesTags = tableContains(latestVersion.tags, searchTerm)
      end

      if matchesName or matchesDescription or matchesAuthor or matchesTags then
        table.insert(results, latestVersion)
      end
    end
  end

  return {
    results = results,
    total = #results,
    query = query
  }
end

-- HyperBEAM Dynamic Read: List Skills
-- Transformation function for listing skills with pagination and filtering
-- URL: /{PROCESS_ID}~process@1.0/now/~lua@5.3a&module={SCRIPT_TX_ID}/listSkills/serialize~json@1.0?limit=10&offset=0&author=name&filterTags=[tags]&filterName=pattern

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

-- Safely parse JSON with error handling
local function safeJsonDecode(jsonStr, defaultValue)
  if not jsonStr or jsonStr == "" then
    return defaultValue or {}
  end

  local success, result = pcall(json.decode, jsonStr)
  if success and type(result) == "table" then
    return result
  end

  return defaultValue or {}
end

-- Main transformation function
function listSkills(base, req)
  -- Extract Skills table from cached state
  local Skills = base.Skills or {}

  -- Pagination parameters
  local limit = tonumber(req.limit) or 10
  local offset = tonumber(req.offset) or 0

  -- Filter parameters (all optional)
  local filterAuthor = req.author
  local filterTags = safeJsonDecode(req.filterTags, nil)
  local filterName = req.filterName

  -- Validate limit range
  if limit < 1 then limit = 1 end
  if limit > 100 then limit = 100 end -- Max 100 per page

  if offset < 0 then offset = 0 end

  -- Collect all skills (latest versions) that match filters
  local allMatches = {}

  for skillName, skillEntry in pairs(Skills) do
    if skillEntry.versions and skillEntry.latest then
      local skill = skillEntry.versions[skillEntry.latest]
      if skill then
        local matches = true

        -- Filter by author (case-insensitive exact match)
        if filterAuthor and filterAuthor ~= "" then
          if toLower(skill.author) ~= toLower(filterAuthor) then
            matches = false
          end
        end

        -- Filter by name pattern (case-insensitive substring)
        if filterName and filterName ~= "" then
          if not contains(skill.name, filterName) then
            matches = false
          end
        end

        -- Filter by tags (must have ALL specified tags)
        if filterTags and type(filterTags) == "table" and #filterTags > 0 then
          for _, requiredTag in ipairs(filterTags) do
            local hasTag = false
            if skill.tags and type(skill.tags) == "table" then
              for _, skillTag in ipairs(skill.tags) do
                if toLower(skillTag) == toLower(requiredTag) then
                  hasTag = true
                  break
                end
              end
            end
            if not hasTag then
              matches = false
              break
            end
          end
        end

        if matches then
          table.insert(allMatches, skill)
        end
      end
    end
  end

  -- Calculate pagination
  local total = #allMatches
  local startIndex = offset + 1
  local endIndex = offset + limit
  if endIndex > total then endIndex = total end

  -- Extract page of results
  local pageResults = {}
  for i = startIndex, endIndex do
    table.insert(pageResults, allMatches[i])
  end

  -- Build pagination metadata
  local hasNextPage = endIndex < total
  local hasPrevPage = offset > 0

  return {
    skills = pageResults,
    pagination = {
      total = total,
      limit = limit,
      offset = offset,
      returned = #pageResults,
      hasNextPage = hasNextPage,
      hasPrevPage = hasPrevPage
    },
    status = 200
  }
end

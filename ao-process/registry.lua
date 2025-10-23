-- AO Registry Process
-- Decentralized registry for Claude Agent Skills
-- Handles skill registration, search queries, and metadata storage
--
-- ADP v1.0 Compliant: Self-documenting AO process with standardized Info handler
-- Runtime: AO mainnet, Lua 5.3
-- Architecture: Monolithic design, message-based communication only

-- Import JSON module (required for encoding/decoding)
-- Check if json is already available (from test mock or AO runtime)
if not json then
  json = require("json")
end

-- ============================================================================
-- GLOBAL STATE
-- ============================================================================

-- Skills registry with version history support
-- Schema: Skills[skill-name] = { versions = {...}, latest = "1.0.0" }
Skills = {}
-- Skills[skill-name] = {
--   latest = "1.0.0",                 -- string, latest version number
--   versions = {
--     ["1.0.0"] = {
--       name = "skill-name",          -- string, unique identifier
--       version = "1.0.0",            -- string, semantic version
--       description = "Skill description", -- string, max 1024 chars
--       author = "Author Name",       -- string, display name
--       owner = "abc123...xyz789",    -- string (43-char Arweave address)
--       tags = {"tag1", "tag2"},      -- Lua table (array)
--       arweaveTxId = "def456...uvw012", -- string (43-char TXID)
--       dependencies = {"dep1", "dep2"}, -- Lua table (array)
--       publishedAt = 1234567890,     -- number (Unix timestamp)
--       updatedAt = 1234567890        -- number (Unix timestamp)
--     }
--   }
-- }

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

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

-- Validate Arweave transaction ID format (43 characters)
local function isValidTxId(txId)
  if not txId or type(txId) ~= "string" then return false end
  return #txId == 43 and string.match(txId, "^[a-zA-Z0-9_-]+$") ~= nil
end

-- Validate semantic version format (e.g., "1.0.0")
local function isValidVersion(version)
  if not version or type(version) ~= "string" then return false end
  return string.match(version, "^%d+%.%d+%.%d+$") ~= nil
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

-- ============================================================================
-- HANDLERS
-- ============================================================================

-- Info Handler (ADP v1.0 Compliance)
-- Returns process metadata for autonomous AI tool discovery
Handlers.add("info",
  Handlers.utils.hasMatchingTag("Action", "Info"),
  function(msg)
    local metadata = {
      process = {
        name = "Agent Skills Registry",
        version = "2.0.0",
        adpVersion = "1.0",
        capabilities = {"register", "update", "search", "retrieve", "version-history", "pagination", "filtering"},
        messageSchemas = {
          ["Register-Skill"] = {
            required = {"Action", "Name", "Version", "Description", "Author", "ArweaveTxId"},
            optional = {"Tags", "Dependencies"}
          },
          ["Update-Skill"] = {
            required = {"Action", "Name", "Version", "Description", "Author", "ArweaveTxId"},
            optional = {"Tags", "Dependencies"}
          },
          ["Search-Skills"] = {
            required = {"Action"},
            optional = {"Query"}
          },
          ["List-Skills"] = {
            required = {"Action"},
            optional = {"Limit", "Offset", "Author", "FilterTags", "FilterName"}
          },
          ["Get-Skill"] = {
            required = {"Action", "Name"},
            optional = {"Version"}
          },
          ["Get-Skill-Versions"] = {
            required = {"Action", "Name"}
          },
          ["Info"] = {
            required = {"Action"}
          }
        }
      },
      handlers = {"Register-Skill", "Update-Skill", "Search-Skills", "List-Skills", "Get-Skill", "Get-Skill-Versions", "Info"},
      documentation = {
        adpCompliance = "v1.0",
        selfDocumenting = true,
        description = "Decentralized registry for Claude Agent Skills with skill registration, search, and retrieval capabilities"
      }
    }

    ao.send({
      Target = msg.From,
      Action = "Info-Response",
      Data = json.encode(metadata)
    })
  end
)

-- Register-Skill Handler
-- Registers a new skill in the registry
Handlers.add("register-skill",
  Handlers.utils.hasMatchingTag("Action", "Register-Skill"),
  function(msg)
    -- Extract and validate required fields from message tags
    -- In AO, tags are accessible directly on msg object (e.g., msg.Name, msg.Version)
    -- Note: Tag names are case-sensitive - "ArweaveTxId" becomes "Arweavetxid"
    local name = msg.Name
    local version = msg.Version
    local description = msg.Description
    local author = msg.Author
    local arweaveTxId = msg.Arweavetxid or msg.ArweaveTxId

    -- Validate required fields
    if not name or name == "" then
      ao.send({
        Target = msg.From,
        Action = "Error",
        Error = "Name is required"
      })
      return
    end

    if not version or version == "" then
      ao.send({
        Target = msg.From,
        Action = "Error",
        Error = "Version is required"
      })
      return
    end

    if not description or description == "" then
      ao.send({
        Target = msg.From,
        Action = "Error",
        Error = "Description is required"
      })
      return
    end

    if not author or author == "" then
      ao.send({
        Target = msg.From,
        Action = "Error",
        Error = "Author is required"
      })
      return
    end

    if not arweaveTxId or arweaveTxId == "" then
      ao.send({
        Target = msg.From,
        Action = "Error",
        Error = "ArweaveTxId is required"
      })
      return
    end

    -- Validate formats
    if not isValidVersion(version) then
      ao.send({
        Target = msg.From,
        Action = "Error",
        Error = "Invalid version format. Expected semantic version (e.g., 1.0.0)"
      })
      return
    end

    if not isValidTxId(arweaveTxId) then
      ao.send({
        Target = msg.From,
        Action = "Error",
        Error = "Invalid ArweaveTxId format. Expected 43-character transaction ID"
      })
      return
    end

    -- Validate description length
    if #description > 1024 then
      ao.send({
        Target = msg.From,
        Action = "Error",
        Error = "Description exceeds maximum length of 1024 characters"
      })
      return
    end

    -- Check if skill name exists
    if Skills[name] then
      -- Check if this specific version already exists
      if Skills[name].versions and Skills[name].versions[version] then
        ao.send({
          Target = msg.From,
          Action = "Error",
          Error = "Skill '" .. name .. "' version '" .. version .. "' already exists. Use Update-Skill to modify it."
        })
        return
      end
    end

    -- Parse optional fields (Tags and Dependencies are JSON strings in message tags)
    local tags = safeJsonDecode(msg.Tags, {})
    local dependencies = safeJsonDecode(msg.Dependencies, {})

    -- Validate parsed arrays are tables
    if type(tags) ~= "table" then tags = {} end
    if type(dependencies) ~= "table" then dependencies = {} end

    -- Get timestamp from message (NEVER use os.time())
    local timestamp = tonumber(msg.Timestamp) or 0

    -- Create skill metadata
    local skillMetadata = {
      name = name,
      version = version,
      description = description,
      author = author,
      owner = msg.From, -- 43-character Arweave address for authorization
      tags = tags,
      arweaveTxId = arweaveTxId,
      dependencies = dependencies,
      publishedAt = timestamp,
      updatedAt = timestamp
    }

    -- Initialize skill entry if it doesn't exist
    if not Skills[name] then
      Skills[name] = {
        latest = version,
        versions = {}
      }
    end

    -- Store this version
    Skills[name].versions[version] = skillMetadata

    -- Update latest version pointer
    Skills[name].latest = version

    -- Send success response
    ao.send({
      Target = msg.From,
      Action = "Skill-Registered",
      Name = name,
      Version = version,
      Success = "true"
    })

    -- Update HTTP-exposed state
    if updateHTTPState then
      updateHTTPState()
    end
  end
)

-- Update-Skill Handler
-- Updates an existing skill with new version and metadata
Handlers.add("update-skill",
  Handlers.utils.hasMatchingTag("Action", "Update-Skill"),
  function(msg)
    -- Extract and validate required fields
    local name = msg.Name
    local version = msg.Version
    local description = msg.Description
    local author = msg.Author
    local arweaveTxId = msg.Arweavetxid or msg.ArweaveTxId

    -- Validate required fields
    if not name or name == "" then
      ao.send({
        Target = msg.From,
        Action = "Error",
        Error = "Name is required"
      })
      return
    end

    -- Check if skill exists
    if not Skills[name] or not Skills[name].versions then
      ao.send({
        Target = msg.From,
        Action = "Error",
        Error = "Skill '" .. name .. "' does not exist. Use Register-Skill to create a new skill"
      })
      return
    end

    -- Check if this specific version exists
    if not Skills[name].versions[version] then
      ao.send({
        Target = msg.From,
        Action = "Error",
        Error = "Skill '" .. name .. "' version '" .. version .. "' does not exist. Use Register-Skill to create a new version"
      })
      return
    end

    -- Verify ownership (check owner from any existing version)
    local existingVersion = Skills[name].versions[version]
    if existingVersion.owner ~= msg.From then
      ao.send({
        Target = msg.From,
        Action = "Error",
        Error = "Unauthorized: Only the skill owner can update this skill"
      })
      return
    end

    -- Validate required fields
    if not version or version == "" then
      ao.send({
        Target = msg.From,
        Action = "Error",
        Error = "Version is required"
      })
      return
    end

    if not description or description == "" then
      ao.send({
        Target = msg.From,
        Action = "Error",
        Error = "Description is required"
      })
      return
    end

    if not author or author == "" then
      ao.send({
        Target = msg.From,
        Action = "Error",
        Error = "Author is required"
      })
      return
    end

    if not arweaveTxId or arweaveTxId == "" then
      ao.send({
        Target = msg.From,
        Action = "Error",
        Error = "ArweaveTxId is required"
      })
      return
    end

    -- Validate formats
    if not isValidVersion(version) then
      ao.send({
        Target = msg.From,
        Action = "Error",
        Error = "Invalid version format. Expected semantic version (e.g., 1.0.0)"
      })
      return
    end

    if not isValidTxId(arweaveTxId) then
      ao.send({
        Target = msg.From,
        Action = "Error",
        Error = "Invalid ArweaveTxId format. Expected 43-character transaction ID"
      })
      return
    end

    -- Validate description length
    if #description > 1024 then
      ao.send({
        Target = msg.From,
        Action = "Error",
        Error = "Description exceeds maximum length of 1024 characters"
      })
      return
    end

    -- Parse optional fields
    local tags = safeJsonDecode(msg.Tags, {})
    local dependencies = safeJsonDecode(msg.Dependencies, {})

    -- Validate parsed arrays are tables
    if type(tags) ~= "table" then tags = {} end
    if type(dependencies) ~= "table" then dependencies = {} end

    -- Get timestamp from message
    local timestamp = tonumber(msg.Timestamp) or 0

    -- Update skill metadata for this specific version (preserve original publishedAt)
    Skills[name].versions[version] = {
      name = name,
      version = version,
      description = description,
      author = author,
      owner = existingVersion.owner, -- Preserve original owner
      tags = tags,
      arweaveTxId = arweaveTxId,
      dependencies = dependencies,
      publishedAt = existingVersion.publishedAt, -- Preserve original publish date
      updatedAt = timestamp
    }

    -- Update latest version pointer if this is newer
    Skills[name].latest = version

    -- Send success response
    ao.send({
      Target = msg.From,
      Action = "Skill-Updated",
      Name = name,
      Version = version,
      Success = "true"
    })

    -- Update HTTP-exposed state
    if updateHTTPState then
      updateHTTPState()
    end
  end
)

-- Search-Skills Handler
-- Searches for skills matching a query string (returns latest version of each)
-- Returns all skills if query is empty
Handlers.add("search-skills",
  Handlers.utils.hasMatchingTag("Action", "Search-Skills"),
  function(msg)
    local query = msg.Query

    -- Search across all skills (O(n) iteration)
    local results = {}

    -- If query is empty, return all skills (latest versions)
    if not query or query == "" then
      for skillName, skillEntry in pairs(Skills) do
        if skillEntry.versions and skillEntry.latest then
          local latestVersion = skillEntry.versions[skillEntry.latest]
          if latestVersion then
            table.insert(results, latestVersion)
          end
        end
      end
    else
      -- Search with query filter (search in latest version metadata)
      for skillName, skillEntry in pairs(Skills) do
        if skillEntry.versions and skillEntry.latest then
          local skill = skillEntry.versions[skillEntry.latest]
          if skill then
            local matches = false

            -- Match against skill name (case-insensitive substring)
            if contains(skill.name, query) then
              matches = true
            end

            -- Match against description (case-insensitive substring)
            if contains(skill.description, query) then
              matches = true
            end

            -- Match against tags (case-insensitive element match)
            if skill.tags and type(skill.tags) == "table" then
              for _, tag in ipairs(skill.tags) do
                if contains(tag, query) then
                  matches = true
                  break
                end
              end
            end

            if matches then
              table.insert(results, skill)
            end
          end
        end
      end
    end

    -- Send search results
    ao.send({
      Target = msg.From,
      Action = "Search-Results",
      Data = json.encode(results),
      ResultCount = tostring(#results)
    })
  end
)

-- Get-Skill-Versions Handler
-- Lists all available versions of a skill
Handlers.add("get-skill-versions",
  Handlers.utils.hasMatchingTag("Action", "Get-Skill-Versions"),
  function(msg)
    local name = msg.Name

    if not name or name == "" then
      ao.send({
        Target = msg.From,
        Action = "Error",
        Error = "Name is required"
      })
      return
    end

    -- Lookup skill
    local skillEntry = Skills[name]

    if not skillEntry or not skillEntry.versions then
      ao.send({
        Target = msg.From,
        Action = "Error",
        Error = "Skill '" .. name .. "' not found"
      })
      return
    end

    -- Build version list
    local versionList = {}
    for versionNum, _ in pairs(skillEntry.versions) do
      table.insert(versionList, versionNum)
    end

    -- Send version list with latest indicator
    ao.send({
      Target = msg.From,
      Action = "Skill-Versions",
      Data = json.encode({
        name = name,
        latest = skillEntry.latest,
        versions = versionList
      })
    })
  end
)

-- List-Skills Handler
-- Paginated listing of skills with optional filtering
-- Supports filtering by: author, tags, name pattern
Handlers.add("list-skills",
  Handlers.utils.hasMatchingTag("Action", "List-Skills"),
  function(msg)
    -- Pagination parameters
    local limit = tonumber(msg.Limit) or 10
    local offset = tonumber(msg.Offset) or 0

    -- Filter parameters (all optional)
    local filterAuthor = msg.Author
    local filterTags = safeJsonDecode(msg.FilterTags, nil)
    local filterName = msg.FilterName

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

    -- Send paginated results
    ao.send({
      Target = msg.From,
      Action = "Skills-List",
      Data = json.encode({
        skills = pageResults,
        pagination = {
          total = total,
          limit = limit,
          offset = offset,
          returned = #pageResults,
          hasNextPage = hasNextPage,
          hasPrevPage = hasPrevPage
        }
      })
    })
  end
)

-- Get-Skill Handler
-- Retrieves a specific skill by name and optional version
-- If version not specified, returns latest version
Handlers.add("get-skill",
  Handlers.utils.hasMatchingTag("Action", "Get-Skill"),
  function(msg)
    local name = msg.Name
    local requestedVersion = msg.Version -- Optional version parameter

    if not name or name == "" then
      ao.send({
        Target = msg.From,
        Action = "Error",
        Error = "Name is required"
      })
      return
    end

    -- Lookup skill (O(1) operation)
    local skillEntry = Skills[name]

    if not skillEntry or not skillEntry.versions then
      ao.send({
        Target = msg.From,
        Action = "Error",
        Error = "Skill '" .. name .. "' not found"
      })
      return
    end

    -- Determine which version to return
    local versionToReturn = requestedVersion
    if not versionToReturn or versionToReturn == "" then
      versionToReturn = skillEntry.latest -- Default to latest version
    end

    -- Get the specific version
    local skillMetadata = skillEntry.versions[versionToReturn]

    if not skillMetadata then
      ao.send({
        Target = msg.From,
        Action = "Error",
        Error = "Skill '" .. name .. "' version '" .. versionToReturn .. "' not found"
      })
      return
    end

    -- Send skill metadata
    ao.send({
      Target = msg.From,
      Action = "Skill-Found",
      Data = json.encode(skillMetadata)
    })
  end
)

-- ============================================================================
-- HTTP-ACCESSIBLE STATE (for ~process@1.0/compute access)
-- ============================================================================

-- Expose Skills table for HTTP access
-- Access via: /{process-id}/~process@1.0/compute/Skills
-- Returns: Full Skills table with version history

-- HTTP-accessible search function
-- Access via: /{process-id}/~process@1.0/compute/searchSkills?query=ao
function searchSkills(query)
  local results = {}

  query = query or ""

  -- If query is empty, return all skills (latest versions)
  if query == "" then
    for skillName, skillEntry in pairs(Skills) do
      if skillEntry.versions and skillEntry.latest then
        local latestVersion = skillEntry.versions[skillEntry.latest]
        if latestVersion then
          table.insert(results, latestVersion)
        end
      end
    end
  else
    -- Search with query filter (search in latest version metadata)
    for skillName, skillEntry in pairs(Skills) do
      if skillEntry.versions and skillEntry.latest then
        local skill = skillEntry.versions[skillEntry.latest]
        if skill then
          local matches = false

          -- Match against skill name
          if contains(skill.name, query) then
            matches = true
          end

          -- Match against description
          if contains(skill.description, query) then
            matches = true
          end

          -- Match against tags
          if skill.tags and type(skill.tags) == "table" then
            for _, tag in ipairs(skill.tags) do
              if contains(tag, query) then
                matches = true
                break
              end
            end
          end

          if matches then
            table.insert(results, skill)
          end
        end
      end
    end
  end

  return results
end

-- HTTP-accessible getSkill function
-- Access via: /{process-id}/~process@1.0/compute/getSkill?name=ao&version=1.0.0
function getSkill(name, version)
  if not name or name == "" then
    return {error = "Name is required"}
  end

  local skillEntry = Skills[name]

  if not skillEntry or not skillEntry.versions then
    return {error = "Skill '" .. name .. "' not found"}
  end

  -- Determine which version to return
  local versionToReturn = version
  if not versionToReturn or versionToReturn == "" then
    versionToReturn = skillEntry.latest
  end

  -- Get the specific version
  local skillMetadata = skillEntry.versions[versionToReturn]

  if not skillMetadata then
    return {error = "Skill '" .. name .. "' version '" .. versionToReturn .. "' not found"}
  end

  return skillMetadata
end

-- HTTP-accessible listVersions function
-- Access via: /{process-id}/~process@1.0/compute/listVersions?name=ao
function listVersions(name)
  if not name or name == "" then
    return {error = "Name is required"}
  end

  local skillEntry = Skills[name]

  if not skillEntry or not skillEntry.versions then
    return {error = "Skill '" .. name .. "' not found"}
  end

  local versionList = {}
  for versionNum, _ in pairs(skillEntry.versions) do
    table.insert(versionList, versionNum)
  end

  return {
    name = name,
    latest = skillEntry.latest,
    versions = versionList
  }
end

-- ============================================================================
-- HTTP STATE EXPOSURE (patch@1.0 device)
-- ============================================================================

-- Handler to update HTTP-exposed state after skill registration/update
function updateHTTPState()
  -- Expose Skills table via patch@1.0 for direct HTTP access
  -- Access at: https://forward.computer/{process-id}/~patch@1.0/compute/skills
  ao.send({
    Target = ao.id,
    Tags = {
      { name = "Device", value = "patch@1.0" }
    },
    Data = json.encode({
      skills = Skills
    })
  })
end

-- Initial state exposure
HTTPStateSync = HTTPStateSync or 'INCOMPLETE'

if HTTPStateSync == 'INCOMPLETE' then
  updateHTTPState()
  HTTPStateSync = 'COMPLETE'
  print("HTTP state exposure initialized via patch@1.0")
end

-- Process initialization complete
print("Agent Skills Registry process initialized (ADP v1.0 compliant)")
print("HTTP-accessible state: skills")
print("Access: https://forward.computer/{process-id}/~patch@1.0/compute/skills")
print("Note: Global functions searchSkills, getSkill, listVersions available in Lua context")

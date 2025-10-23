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

-- Skills registry indexed by skill name
-- Schema per architecture/database-schema.md
Skills = {}
-- Skills[skill-name] = {
--   name = "skill-name",              -- string, unique identifier
--   version = "1.0.0",                -- string, semantic version
--   description = "Skill description", -- string, max 1024 chars
--   author = "Author Name",           -- string, display name
--   owner = "abc123...xyz789",        -- string (43-char Arweave address from msg.From)
--   tags = {"tag1", "tag2"},          -- Lua table (array)
--   arweaveTxId = "def456...uvw012",  -- string (43-char TXID)
--   dependencies = {"dep1", "dep2"},  -- Lua table (array of skill names)
--   publishedAt = 1234567890,         -- number (Unix timestamp from msg.Timestamp)
--   updatedAt = 1234567890            -- number (Unix timestamp from msg.Timestamp)
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
        version = "1.1.0",
        adpVersion = "1.0",
        capabilities = {"register", "update", "search", "retrieve"},
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
            required = {"Action", "Query"}
          },
          ["Get-Skill"] = {
            required = {"Action", "Name"}
          },
          ["Info"] = {
            required = {"Action"}
          }
        }
      },
      handlers = {"Register-Skill", "Update-Skill", "Search-Skills", "Get-Skill", "Info"},
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

    -- Check for duplicate skill name
    if Skills[name] then
      ao.send({
        Target = msg.From,
        Action = "Error",
        Error = "Skill with name '" .. name .. "' already exists"
      })
      return
    end

    -- Parse optional fields (Tags and Dependencies are JSON strings in message tags)
    local tags = safeJsonDecode(msg.Tags, {})
    local dependencies = safeJsonDecode(msg.Dependencies, {})

    -- Validate parsed arrays are tables
    if type(tags) ~= "table" then tags = {} end
    if type(dependencies) ~= "table" then dependencies = {} end

    -- Get timestamp from message (NEVER use os.time())
    local timestamp = tonumber(msg.Timestamp) or 0

    -- Store skill metadata
    Skills[name] = {
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

    -- Send success response
    ao.send({
      Target = msg.From,
      Action = "Skill-Registered",
      Name = name,
      Version = version,
      Success = "true"
    })
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
    if not Skills[name] then
      ao.send({
        Target = msg.From,
        Action = "Error",
        Error = "Skill '" .. name .. "' does not exist. Use Register-Skill to create a new skill"
      })
      return
    end

    -- Verify ownership (only owner can update)
    if Skills[name].owner ~= msg.From then
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

    -- Update skill metadata (preserve original publishedAt)
    Skills[name] = {
      name = name,
      version = version,
      description = description,
      author = author,
      owner = Skills[name].owner, -- Keep original owner
      tags = tags,
      arweaveTxId = arweaveTxId,
      dependencies = dependencies,
      publishedAt = Skills[name].publishedAt, -- Preserve original publish date
      updatedAt = timestamp
    }

    -- Send success response
    ao.send({
      Target = msg.From,
      Action = "Skill-Updated",
      Name = name,
      Version = version,
      Success = "true"
    })
  end
)

-- Search-Skills Handler
-- Searches for skills matching a query string
Handlers.add("search-skills",
  Handlers.utils.hasMatchingTag("Action", "Search-Skills"),
  function(msg)
    local query = msg.Query

    if not query or query == "" then
      ao.send({
        Target = msg.From,
        Action = "Error",
        Error = "Query is required"
      })
      return
    end

    -- Search across all skills (O(n) iteration)
    local results = {}

    for skillName, skill in pairs(Skills) do
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

    -- Send search results
    ao.send({
      Target = msg.From,
      Action = "Search-Results",
      Data = json.encode(results),
      ResultCount = tostring(#results)
    })
  end
)

-- Get-Skill Handler
-- Retrieves a specific skill by name
Handlers.add("get-skill",
  Handlers.utils.hasMatchingTag("Action", "Get-Skill"),
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

    -- Lookup skill (O(1) operation)
    local skill = Skills[name]

    if not skill then
      ao.send({
        Target = msg.From,
        Action = "Error",
        Error = "Skill '" .. name .. "' not found"
      })
      return
    end

    -- Send skill metadata
    ao.send({
      Target = msg.From,
      Action = "Skill-Found",
      Data = json.encode(skill)
    })
  end
)

-- Process initialization complete
print("Agent Skills Registry process initialized (ADP v1.0 compliant)")

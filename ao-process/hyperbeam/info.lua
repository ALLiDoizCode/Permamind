-- HyperBEAM Dynamic Read: Info
-- Transformation function for retrieving registry process metadata (ADP v1.0 compliant)
-- URL: /{PROCESS_ID}~process@1.0/now/~lua@5.3a&module={SCRIPT_TX_ID}/info/serialize~json@1.0

-- Import JSON module
local json = require("json")

-- Main transformation function
function info(base, req)
  -- Return ADP v1.0 compliant info structure
  local metadata = {
    process = {
      name = "Agent Skills Registry",
      version = "2.1.0",
      adpVersion = "1.0",
      capabilities = { "register", "update", "search", "retrieve", "version-history", "pagination", "filtering", "download-stats" },
      messageSchemas = {
        ["Register-Skill"] = {
          required = { "Action", "Name", "Version", "Description", "Author", "ArweaveTxId" },
          optional = { "Tags", "Dependencies", "BundledFiles", "Changelog" }
        },
        ["Update-Skill"] = {
          required = { "Action", "Name", "Version", "Description", "Author", "ArweaveTxId" },
          optional = { "Tags", "Dependencies", "BundledFiles", "Changelog" }
        },
        ["Search-Skills"] = {
          required = { "Action" },
          optional = { "Query" }
        },
        ["List-Skills"] = {
          required = { "Action" },
          optional = { "Limit", "Offset", "Author", "FilterTags", "FilterName" }
        },
        ["Get-Skill"] = {
          required = { "Action", "Name" },
          optional = { "Version" }
        },
        ["Get-Skill-Versions"] = {
          required = { "Action", "Name" }
        },
        ["Record-Download"] = {
          required = { "Action", "Name" },
          optional = { "Version" }
        },
        ["Get-Download-Stats"] = {
          required = { "Action" },
          optional = { "TimeRange", "Scope", "Name", "Version" }
        },
        ["Info"] = {
          required = { "Action" }
        }
      }
    },
    handlers = { "Register-Skill", "Update-Skill", "Search-Skills", "List-Skills", "Get-Skill", "Get-Skill-Versions", "Record-Download", "Get-Download-Stats", "Info" },
    documentation = {
      adpCompliance = "v1.0",
      selfDocumenting = true,
      description = "Decentralized registry for Claude Agent Skills with skill registration, search, retrieval, and download statistics capabilities"
    },
    status = 200
  }

  return metadata
end

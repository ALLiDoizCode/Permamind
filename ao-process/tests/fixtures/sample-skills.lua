-- Sample skill metadata for testing
-- Used across test suites for consistent fixture data

local sampleSkills = {
  validSkill1 = {
    Name = "ao-basics",
    Version = "1.0.0",
    Description = "Essential patterns and best practices for AO process development",
    Author = "AO Team",
    Tags = '["ao", "development", "lua"]',
    ArweaveTxId = "abc123def456ghi789jkl012mno345pqr678stu901v",
    Dependencies = '[]'
  },

  validSkill2 = {
    Name = "arweave-fundamentals",
    Version = "2.1.3",
    Description = "Core concepts and practical patterns for permanent storage on Arweave",
    Author = "Permaweb Community",
    Tags = '["arweave", "storage", "permaweb"]',
    ArweaveTxId = "xyz987uvw654tsr321qpo098nml765kji432hgf109e",
    Dependencies = '["ao-basics"]'
  },

  validSkill3 = {
    Name = "permamind-integration",
    Version = "0.5.2",
    Description = "Integration patterns for Permamind MCP server and AO processes",
    Author = "Permamind Team",
    Tags = '["mcp", "integration", "ai"]',
    ArweaveTxId = "qwe123asd456zxc789ert234dfg567vbn890uio123p",
    Dependencies = '["ao-basics", "arweave-fundamentals"]'
  }
}

return sampleSkills

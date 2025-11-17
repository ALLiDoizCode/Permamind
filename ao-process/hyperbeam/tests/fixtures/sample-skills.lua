-- Sample Skills Fixture for HyperBEAM Dynamic Read Testing
-- This fixture provides diverse test data for comprehensive script validation

local sampleSkills = {
  -- Skill with multiple versions
  ["ao-basics"] = {
    latest = "1.2.0",
    versions = {
      ["1.0.0"] = {
        name = "ao-basics",
        version = "1.0.0",
        description = "Learn AO protocol fundamentals - processes, message passing, handlers, and ADP compliance",
        author = "John Smith",
        owner = "abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
        tags = {"ao", "basics", "beginner", "protocol"},
        arweaveTxId = "tx_aobasics_1_0_0_abcdefghijklmnopqrstuvwxyz1234567890",
        dependencies = {},
        bundledFiles = {{name="SKILL.md", icon="📘"}},
        changelog = "Initial release",
        downloadCount = 150,
        publishedAt = 1640000000,
        updatedAt = 1640000000,
        downloadTimestamps = {}
      },
      ["1.1.0"] = {
        name = "ao-basics",
        version = "1.1.0",
        description = "Learn AO protocol fundamentals - processes, message passing, handlers, and ADP compliance",
        author = "John Smith",
        owner = "abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
        tags = {"ao", "basics", "beginner", "protocol"},
        arweaveTxId = "tx_aobasics_1_1_0_abcdefghijklmnopqrstuvwxyz1234567890",
        dependencies = {},
        bundledFiles = {{name="SKILL.md", icon="📘"}},
        changelog = "Added message passing examples",
        downloadCount = 85,
        publishedAt = 1645000000,
        updatedAt = 1645000000,
        downloadTimestamps = {}
      },
      ["1.2.0"] = {
        name = "ao-basics",
        version = "1.2.0",
        description = "Learn AO protocol fundamentals - processes, message passing, handlers, and ADP compliance",
        author = "John Smith",
        owner = "abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
        tags = {"ao", "basics", "beginner", "protocol"},
        arweaveTxId = "tx_aobasics_1_2_0_abcdefghijklmnopqrstuvwxyz1234567890",
        dependencies = {},
        bundledFiles = {{name="SKILL.md", icon="📘"}},
        changelog = "Enhanced ADP compliance documentation",
        downloadCount = 42,
        publishedAt = 1650000000,
        updatedAt = 1650000000,
        downloadTimestamps = {}
      }
    }
  },

  -- Skill with blockchain and web3 tags
  ["blockchain-fundamentals"] = {
    latest = "2.0.0",
    versions = {
      ["2.0.0"] = {
        name = "blockchain-fundamentals",
        version = "2.0.0",
        description = "Master blockchain technology fundamentals including consensus mechanisms and smart contracts",
        author = "Jane Doe",
        owner = "def456ghi789jkl012mno345pqr678stu901vwx234yz5abc123",
        tags = {"blockchain", "web3", "smart-contracts", "consensus"},
        arweaveTxId = "tx_blockchain_2_0_0_zyxwvutsrqponmlkjihgfedcba9876543210",
        dependencies = {},
        bundledFiles = {{name="SKILL.md", icon="📘"}},
        changelog = "Major version update with smart contract examples",
        downloadCount = 320,
        publishedAt = 1655000000,
        updatedAt = 1655000000,
        downloadTimestamps = {}
      }
    }
  },

  -- Skill with web3 and arweave tags
  ["arweave-integration"] = {
    latest = "1.0.0",
    versions = {
      ["1.0.0"] = {
        name = "arweave-integration",
        version = "1.0.0",
        description = "Guide for building applications on Arweave permanent storage network with data upload and GraphQL queries",
        author = "Alice Johnson",
        owner = "ghi789jkl012mno345pqr678stu901vwx234yz5abc123def456",
        tags = {"arweave", "web3", "storage", "permaweb"},
        arweaveTxId = "tx_arweave_1_0_0_mnopqrstuvwxyz1234567890abcdefghijkl",
        dependencies = {},
        bundledFiles = {{name="SKILL.md", icon="📘"}},
        changelog = "Initial release",
        downloadCount = 0,
        publishedAt = 1660000000,
        updatedAt = 1660000000,
        downloadTimestamps = {}
      }
    }
  },

  -- Skill with different author
  ["typescript-best-practices"] = {
    latest = "3.1.0",
    versions = {
      ["3.1.0"] = {
        name = "typescript-best-practices",
        version = "3.1.0",
        description = "TypeScript development best practices for type-safe code with strict mode and linting",
        author = "Bob Williams",
        owner = "jkl012mno345pqr678stu901vwx234yz5abc123def456ghi789",
        tags = {"typescript", "development", "best-practices", "linting"},
        arweaveTxId = "tx_typescript_3_1_0_uvwxyz1234567890abcdefghijklmnopqrst",
        dependencies = {},
        bundledFiles = {{name="SKILL.md", icon="📘"}},
        changelog = "Added ESLint configuration examples",
        downloadCount = 500,
        publishedAt = 1665000000,
        updatedAt = 1665000000,
        downloadTimestamps = {}
      }
    }
  },

  -- Skill with testing tag
  ["testing-strategies"] = {
    latest = "1.3.0",
    versions = {
      ["1.3.0"] = {
        name = "testing-strategies",
        version = "1.3.0",
        description = "Comprehensive testing strategies including unit, integration, and E2E testing with Jest and Playwright",
        author = "Carol Martinez",
        owner = "mno345pqr678stu901vwx234yz5abc123def456ghi789jkl012",
        tags = {"testing", "jest", "playwright", "quality"},
        arweaveTxId = "tx_testing_1_3_0_yz1234567890abcdefghijklmnopqrstuvwx",
        dependencies = {},
        bundledFiles = {{name="SKILL.md", icon="📘"}},
        changelog = "Added Playwright E2E testing examples",
        downloadCount = 200,
        publishedAt = 1670000000,
        updatedAt = 1670000000,
        downloadTimestamps = {}
      }
    }
  },

  -- Skill with ao and web3 tags (for AND filtering)
  ["ao-token-economics"] = {
    latest = "1.0.0",
    versions = {
      ["1.0.0"] = {
        name = "ao-token-economics",
        version = "1.0.0",
        description = "AO protocol token economics and incentive mechanisms for decentralized applications",
        author = "Dave Chen",
        owner = "pqr678stu901vwx234yz5abc123def456ghi789jkl012mno345",
        tags = {"ao", "web3", "economics", "tokens"},
        arweaveTxId = "tx_aotoken_1_0_0_4567890abcdefghijklmnopqrstuvwxyz123",
        dependencies = {},
        bundledFiles = {{name="SKILL.md", icon="📘"}},
        changelog = "Initial release",
        downloadCount = 75,
        publishedAt = 1675000000,
        updatedAt = 1675000000,
        downloadTimestamps = {}
      }
    }
  },

  -- Skill with very long description (test truncation)
  ["comprehensive-web-development"] = {
    latest = "2.5.0",
    versions = {
      ["2.5.0"] = {
        name = "comprehensive-web-development",
        version = "2.5.0",
        description = "Comprehensive web development guide covering frontend frameworks like React and Vue, backend technologies including Node.js and Python, database design with SQL and NoSQL, API development with REST and GraphQL, deployment strategies using Docker and Kubernetes, CI/CD pipelines with GitHub Actions, testing methodologies, security best practices, performance optimization techniques, and modern development workflows for building scalable production-grade web applications",
        author = "Emma Rodriguez",
        owner = "stu901vwx234yz5abc123def456ghi789jkl012mno345pqr678",
        tags = {"web-development", "fullstack", "react", "nodejs", "deployment"},
        arweaveTxId = "tx_webdev_2_5_0_7890abcdefghijklmnopqrstuvwxyz123456",
        dependencies = {},
        bundledFiles = {{name="SKILL.md", icon="📘"}},
        changelog = "Major update with Kubernetes deployment guide",
        downloadCount = 450,
        publishedAt = 1680000000,
        updatedAt = 1680000000,
        downloadTimestamps = {}
      }
    }
  },

  -- Skill by John Smith (for author filtering)
  ["ao-advanced-patterns"] = {
    latest = "1.1.0",
    versions = {
      ["1.1.0"] = {
        name = "ao-advanced-patterns",
        version = "1.1.0",
        description = "Advanced AO protocol patterns for distributed systems and inter-process communication",
        author = "John Smith",
        owner = "vwx234yz5abc123def456ghi789jkl012mno345pqr678stu901",
        tags = {"ao", "advanced", "distributed-systems", "patterns"},
        arweaveTxId = "tx_aoadvanced_1_1_0_0abcdefghijklmnopqrstuvwxyz12345678",
        dependencies = {"ao-basics"},
        bundledFiles = {{name="SKILL.md", icon="📘"}},
        changelog = "Added distributed systems patterns",
        downloadCount = 120,
        publishedAt = 1685000000,
        updatedAt = 1685000000,
        downloadTimestamps = {}
      }
    }
  },

  -- Skill with security tag
  ["security-fundamentals"] = {
    latest = "1.0.0",
    versions = {
      ["1.0.0"] = {
        name = "security-fundamentals",
        version = "1.0.0",
        description = "Web security fundamentals including authentication, authorization, encryption, and common vulnerabilities",
        author = "Frank White",
        owner = "yz5abc123def456ghi789jkl012mno345pqr678stu901vwx234",
        tags = {"security", "authentication", "encryption", "best-practices"},
        arweaveTxId = "tx_security_1_0_0_defghijklmnopqrstuvwxyz1234567890abc",
        dependencies = {},
        bundledFiles = {{name="SKILL.md", icon="📘"}},
        changelog = "Initial release",
        downloadCount = 280,
        publishedAt = 1690000000,
        updatedAt = 1690000000,
        downloadTimestamps = {}
      }
    }
  },

  -- Skill with deployment tag
  ["cloud-deployment"] = {
    latest = "3.0.0",
    versions = {
      ["3.0.0"] = {
        name = "cloud-deployment",
        version = "3.0.0",
        description = "Cloud deployment strategies for AWS, Azure, and GCP with infrastructure as code",
        author = "Grace Lee",
        owner = "abc123def456ghi789jkl012mno345pqr678stu901vwx234yz5",
        tags = {"deployment", "cloud", "aws", "infrastructure"},
        arweaveTxId = "tx_cloud_3_0_0_ghijklmnopqrstuvwxyz1234567890abcdef",
        dependencies = {},
        bundledFiles = {{name="SKILL.md", icon="📘"}},
        changelog = "Major version with multi-cloud support",
        downloadCount = 350,
        publishedAt = 1695000000,
        updatedAt = 1695000000,
        downloadTimestamps = {}
      }
    }
  },

  -- Skill with api tag
  ["api-design"] = {
    latest = "2.2.0",
    versions = {
      ["2.2.0"] = {
        name = "api-design",
        version = "2.2.0",
        description = "API design best practices for RESTful and GraphQL APIs with versioning and documentation",
        author = "Henry Taylor",
        owner = "def456ghi789jkl012mno345pqr678stu901vwx234yz5abc123",
        tags = {"api", "rest", "graphql", "design"},
        arweaveTxId = "tx_api_2_2_0_jklmnopqrstuvwxyz1234567890abcdefghi",
        dependencies = {},
        bundledFiles = {{name="SKILL.md", icon="📘"}},
        changelog = "Added GraphQL schema design patterns",
        downloadCount = 190,
        publishedAt = 1700000000,
        updatedAt = 1700000000,
        downloadTimestamps = {}
      }
    }
  },

  -- Skill with database tag
  ["database-optimization"] = {
    latest = "1.4.0",
    versions = {
      ["1.4.0"] = {
        name = "database-optimization",
        version = "1.4.0",
        description = "Database optimization techniques for SQL and NoSQL databases including indexing and query performance",
        author = "Ivy Anderson",
        owner = "ghi789jkl012mno345pqr678stu901vwx234yz5abc123def456",
        tags = {"database", "optimization", "sql", "performance"},
        arweaveTxId = "tx_database_1_4_0_mnopqrstuvwxyz1234567890abcdefghijk",
        dependencies = {},
        bundledFiles = {{name="SKILL.md", icon="📘"}},
        changelog = "Added NoSQL optimization strategies",
        downloadCount = 220,
        publishedAt = 1705000000,
        updatedAt = 1705000000,
        downloadTimestamps = {}
      }
    }
  },

  -- Skill with frontend tag
  ["react-components"] = {
    latest = "4.0.0",
    versions = {
      ["4.0.0"] = {
        name = "react-components",
        version = "4.0.0",
        description = "React component library development with TypeScript and Storybook for reusable UI components",
        author = "Jack Brown",
        owner = "jkl012mno345pqr678stu901vwx234yz5abc123def456ghi789",
        tags = {"react", "frontend", "components", "typescript"},
        arweaveTxId = "tx_react_4_0_0_pqrstuvwxyz1234567890abcdefghijklmno",
        dependencies = {"typescript-best-practices"},
        bundledFiles = {{name="SKILL.md", icon="📘"}},
        changelog = "Major version with React 18 support",
        downloadCount = 600,
        publishedAt = 1710000000,
        updatedAt = 1710000000,
        downloadTimestamps = {}
      }
    }
  },

  -- Skill with devops tag
  ["ci-cd-pipelines"] = {
    latest = "2.0.0",
    versions = {
      ["2.0.0"] = {
        name = "ci-cd-pipelines",
        version = "2.0.0",
        description = "CI/CD pipeline automation with GitHub Actions and GitLab CI for continuous delivery",
        author = "Kate Wilson",
        owner = "mno345pqr678stu901vwx234yz5abc123def456ghi789jkl012",
        tags = {"devops", "ci-cd", "automation", "github-actions"},
        arweaveTxId = "tx_cicd_2_0_0_stuvwxyz1234567890abcdefghijklmnopqr",
        dependencies = {},
        bundledFiles = {{name="SKILL.md", icon="📘"}},
        changelog = "Added GitHub Actions advanced workflows",
        downloadCount = 310,
        publishedAt = 1715000000,
        updatedAt = 1715000000,
        downloadTimestamps = {}
      }
    }
  },

  -- Skill with monitoring tag
  ["observability-patterns"] = {
    latest = "1.2.0",
    versions = {
      ["1.2.0"] = {
        name = "observability-patterns",
        version = "1.2.0",
        description = "Observability patterns for distributed systems with logging, metrics, and tracing",
        author = "Leo Garcia",
        owner = "pqr678stu901vwx234yz5abc123def456ghi789jkl012mno345",
        tags = {"observability", "monitoring", "logging", "distributed-systems"},
        arweaveTxId = "tx_observability_1_2_0_vwxyz1234567890abcdefghijklmnopqrst",
        dependencies = {},
        bundledFiles = {{name="SKILL.md", icon="📘"}},
        changelog = "Added distributed tracing examples",
        downloadCount = 160,
        publishedAt = 1720000000,
        updatedAt = 1720000000,
        downloadTimestamps = {}
      }
    }
  },

  -- Skill with microservices tag
  ["microservices-architecture"] = {
    latest = "3.1.0",
    versions = {
      ["3.1.0"] = {
        name = "microservices-architecture",
        version = "3.1.0",
        description = "Microservices architecture patterns for scalable distributed systems with service mesh",
        author = "Mia Davis",
        owner = "stu901vwx234yz5abc123def456ghi789jkl012mno345pqr678",
        tags = {"microservices", "architecture", "distributed-systems", "service-mesh"},
        arweaveTxId = "tx_microservices_3_1_0_yz1234567890abcdefghijklmnopqrstuv",
        dependencies = {},
        bundledFiles = {{name="SKILL.md", icon="📘"}},
        changelog = "Added service mesh integration guide",
        downloadCount = 420,
        publishedAt = 1725000000,
        updatedAt = 1725000000,
        downloadTimestamps = {}
      }
    }
  },

  -- Skill with containerization tag
  ["docker-kubernetes"] = {
    latest = "2.3.0",
    versions = {
      ["2.3.0"] = {
        name = "docker-kubernetes",
        version = "2.3.0",
        description = "Docker and Kubernetes containerization for modern application deployment and orchestration",
        author = "Nathan Clark",
        owner = "vwx234yz5abc123def456ghi789jkl012mno345pqr678stu901",
        tags = {"docker", "kubernetes", "containerization", "deployment"},
        arweaveTxId = "tx_docker_2_3_0_1234567890abcdefghijklmnopqrstuvwxyz",
        dependencies = {"cloud-deployment"},
        bundledFiles = {{name="SKILL.md", icon="📘"}},
        changelog = "Added Kubernetes Helm charts",
        downloadCount = 380,
        publishedAt = 1730000000,
        updatedAt = 1730000000,
        downloadTimestamps = {}
      }
    }
  },

  -- Skill with data-science tag
  ["data-analysis"] = {
    latest = "1.0.0",
    versions = {
      ["1.0.0"] = {
        name = "data-analysis",
        version = "1.0.0",
        description = "Data analysis and visualization techniques with Python pandas and matplotlib",
        author = "Olivia Martinez",
        owner = "yz5abc123def456ghi789jkl012mno345pqr678stu901vwx234",
        tags = {"data-science", "python", "pandas", "visualization"},
        arweaveTxId = "tx_data_1_0_0_4567890abcdefghijklmnopqrstuvwxyz1234",
        dependencies = {},
        bundledFiles = {{name="SKILL.md", icon="📘"}},
        changelog = "Initial release",
        downloadCount = 90,
        publishedAt = 1735000000,
        updatedAt = 1735000000,
        downloadTimestamps = {}
      }
    }
  },

  -- Skill with machine-learning tag
  ["ml-fundamentals"] = {
    latest = "2.1.0",
    versions = {
      ["2.1.0"] = {
        name = "ml-fundamentals",
        version = "2.1.0",
        description = "Machine learning fundamentals including supervised and unsupervised learning algorithms",
        author = "Paul Thompson",
        owner = "abc123def456ghi789jkl012mno345pqr678stu901vwx234yz5",
        tags = {"machine-learning", "ai", "algorithms", "data-science"},
        arweaveTxId = "tx_ml_2_1_0_7890abcdefghijklmnopqrstuvwxyz12345678",
        dependencies = {"data-analysis"},
        bundledFiles = {{name="SKILL.md", icon="📘"}},
        changelog = "Added neural network examples",
        downloadCount = 510,
        publishedAt = 1740000000,
        updatedAt = 1740000000,
        downloadTimestamps = {}
      }
    }
  },

  -- Skill with git tag
  ["version-control"] = {
    latest = "1.5.0",
    versions = {
      ["1.5.0"] = {
        name = "version-control",
        version = "1.5.0",
        description = "Version control with Git and GitHub including branching strategies and collaboration workflows",
        author = "Quinn Adams",
        owner = "def456ghi789jkl012mno345pqr678stu901vwx234yz5abc123",
        tags = {"git", "version-control", "github", "collaboration"},
        arweaveTxId = "tx_git_1_5_0_0abcdefghijklmnopqrstuvwxyz1234567890",
        dependencies = {},
        bundledFiles = {{name="SKILL.md", icon="📘"}},
        changelog = "Added advanced Git workflows",
        downloadCount = 270,
        publishedAt = 1745000000,
        updatedAt = 1745000000,
        downloadTimestamps = {}
      }
    }
  },

  -- Skill with agile tag
  ["agile-methodologies"] = {
    latest = "1.0.0",
    versions = {
      ["1.0.0"] = {
        name = "agile-methodologies",
        version = "1.0.0",
        description = "Agile software development methodologies including Scrum and Kanban practices",
        author = "Rachel Scott",
        owner = "ghi789jkl012mno345pqr678stu901vwx234yz5abc123def456",
        tags = {"agile", "scrum", "kanban", "project-management"},
        arweaveTxId = "tx_agile_1_0_0_defghijklmnopqrstuvwxyz1234567890abcd",
        dependencies = {},
        bundledFiles = {{name="SKILL.md", icon="📘"}},
        changelog = "Initial release",
        downloadCount = 140,
        publishedAt = 1750000000,
        updatedAt = 1750000000,
        downloadTimestamps = {}
      }
    }
  }
}

-- Create base state structure matching registry.lua format
local base = {
  Skills = sampleSkills
}

return base

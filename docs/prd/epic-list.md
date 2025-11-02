# Epic List

**Epic 1: Foundation & Publishing Infrastructure**
Establish project infrastructure, AO registry process, and core publishing capability. Delivers the riskiest technical component (Arweave upload + AO registration + keypair management) and creates content for testing installation. Includes foundational setup and first functional capability (publishing skills).

**Epic 2: Search & Discovery**
Implement search command to query the AO registry and display matching skills. Enables users to discover available skills through familiar command-line interface. Delivers the first consumer-facing feature and validates registry query functionality.

**Epic 3: Installation & Dependency Resolution**
Implement install command with recursive dependency resolution and lock file generation. Delivers the "wow moment" that demonstrates value and builds trust through reliable installation (>95% success rate target).

**Epic 4: Bootstrap Ecosystem Content**
Create core Permaweb bootstrap skills (ao, arweave) to seed the ecosystem and demonstrate platform value. Establishes quality standards and provides essential content for the Arweave/AO developer community.

**Epic 5: Polish, Testing & Launch Readiness**
Cross-platform testing, CLI UX polish, error handling refinement, and community launch preparation. Delivers production-ready platform with >95% installation reliability and prepares for Day 14 launch.

**Epic 6: Web Frontend**
Build a production-ready web frontend for the Agent Skills Registry that enables developers to discover, browse, and learn about agent skills through an intuitive terminal-themed interface. Complements the existing CLI tool with visual exploration capabilities, search with autocomplete, detailed skill pages, version history, and efficient filtering.

**Epic 7: HyperBEAM Performance**
Optimize HyperBEAM integration for production-scale performance and reliability.

**Epic 8: MCP Server for Agent Skills Registry**
Create a Model Context Protocol (MCP) server that provides the same functionality as the existing @permamind/skills npm package, enabling Claude AI to publish, search, and install agent skills through the MCP protocol without requiring command-line access. Includes deterministic wallet generation from 12-word seed phrase using the same approach as Permamind MCP server.

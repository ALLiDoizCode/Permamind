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

**Epic 9: Turbo SDK Migration**
Migrate from direct Arweave SDK transaction creation to Turbo SDK for bundle uploads, enabling free uploads for bundles under 100KB (most skill bundles) and reducing network costs. Maintains full backward compatibility with existing registry infrastructure while delivering significant cost savings through Turbo's subsidized upload tier.

**Epic 10: Jest Test Infrastructure Overhaul**
Fix Jest automocking infrastructure or migrate to Vitest to restore automated unit testing capabilities project-wide. Addresses critical infrastructure issue where jest.mock() silently fails and returns real implementations instead of mocks, blocking 75+ tests. Delivers modern, reliable test infrastructure with fast feedback loops and proper test isolation.

**Epic 11: Node Arweave Wallet Integration - Brownfield Enhancement**
Integrate node-arweave-wallet as a fallback authentication mechanism when no SEED_PHRASE environment variable is available, enabling users to securely connect their browser wallets (Wander, ArConnect) to Permamind CLI/MCP tools. Delivers seamless browser wallet authentication with zero breaking changes to existing SEED_PHRASE workflow.

**Epic 12: Custom Wallet UI Fork - Brownfield Enhancement**
Fork node-arweave-wallet library to enable custom HTML/CSS/JS UI templates for the browser wallet connection interface, providing a fully branded Permamind experience that matches the developer-CLI frontend design system. Delivers customizable wallet UI while maintaining compatibility with upstream library updates and Epic 11 wallet workflows.

**Epic 13: Skill MCP Server Dependency Classification - Brownfield Enhancement**
Enhance the skill registry schema and MCP server to support dependency classification (mcp-server, npm-package, system-requirement, claude-skill) enabling AI agents to intelligently resolve and install skill dependencies with automated setup for MCP servers via npx. Delivers smart dependency resolution with zero breaking changes to existing registry infrastructure.

**Epic 14: Blog Section - Brownfield Enhancement**
Add a blog section to the Permamind frontend that enables the team to publish educational content, tutorials, and announcements. The blog will render markdown content with support for media embeds and external links while maintaining the existing terminal dark theme and design system. Delivers content publishing capabilities with enhanced markdown rendering (images, videos, lists, blockquotes, code blocks), blog listing page with filtering/search, and individual post pages with social sharing.

**Epic 15: HyperBEAM Registry Migration - Brownfield Enhancement**
Migrate the AO registry process to leverage HyperBEAM's HTTP state exposure capabilities via the Patch device and Dynamic Reads, enabling the frontend to query skill metadata directly through HTTP GET requests instead of message passing. Delivers significantly improved performance for search/browse operations (<500ms vs 2s) while maintaining full backward compatibility with existing CLI and MCP server integrations using @permaweb/aoconnect message passing.

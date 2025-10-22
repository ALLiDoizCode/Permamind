# Epic 4: Bootstrap Ecosystem Content

**Epic Goal:**
Create core Permaweb bootstrap skills (ao, arweave) to seed the ecosystem and demonstrate platform value. This epic establishes quality standards through exceptional content and provides immediate value for early adopters. By the end of this epic, the registry contains essential skills targeting the Arweave/AO developer community, solving the chicken-and-egg problem and creating content for testing installation workflows.

## Story 4.1: ao Skill

**As a** skill creator,
**I want** to create an "ao" skill providing foundational AO protocol knowledge,
**so that** developers new to AO can learn core concepts through Claude.

**Acceptance Criteria:**
1. SKILL.md created in `skills/ao/` directory with proper YAML frontmatter
2. Manifest includes: name="ao", version="1.0.0", author, description, tags=["ao", "blockchain", "tutorial"]
3. Skill instructions cover: AO protocol overview, process model, message passing, handlers pattern, ADP compliance
4. Code examples demonstrate: basic handler setup, message handling, state management
5. Resources include: aoconnect library documentation and aolite (local AO emulation) documentation
6. References to official AO documentation included
7. Skill follows Agent Skills best practices from Claude documentation
8. SKILL.md content is 3-5k tokens (appropriate size for progressive loading)
9. No external dependencies (dependencies array empty)
10. Published using `skills publish` command to validate publishing flow
11. Installation tested using `skills install ao` to verify end-to-end workflow

## Story 4.2: arweave Skill

**As a** skill creator,
**I want** to create an "arweave" skill covering permanent storage concepts,
**so that** developers can learn Arweave basics through Claude.

**Acceptance Criteria:**
1. SKILL.md created in `skills/arweave/` directory
2. Manifest includes: name="arweave", version="1.0.0", tags=["arweave", "storage", "blockchain"]
3. Skill instructions cover: permanent storage model, transaction structure, wallet/keypairs, gateways, data retrieval
4. Code examples demonstrate: creating transactions, uploading data, querying by transaction ID
5. Resources include: Arweave SDK documentation
6. References to official Arweave documentation
7. Skill size appropriate (3-5k tokens)
8. No dependencies required
9. Published and installation tested

## Story 4.3: Bootstrap Content Quality Review

**As a** project owner,
**I want** all bootstrap skills reviewed for quality and consistency,
**so that** they set high standards for the ecosystem.

**Acceptance Criteria:**
1. Both core Permaweb bootstrap skills (ao, arweave) reviewed against quality checklist
2. YAML frontmatter consistent across all skills
3. Tone and style consistent (technical, clear, example-driven)
4. No typos, broken references, or formatting errors
5. All skills successfully published to registry
6. All skills successfully installable
7. Skills appear correctly in search results with appropriate tags
8. Documentation updated with examples referencing bootstrap skills
9. Total bootstrap content meets "exceptional quality" standard from brief
10. Peer review completed (if possible, community member feedback gathered)

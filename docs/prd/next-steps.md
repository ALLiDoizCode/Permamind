# Next Steps

## UX Expert Prompt

Review the Agent Skills Registry PRD (`docs/prd.md`) and brief (`docs/brief.md`) to design the user experience for the CLI tool. Focus on creating detailed CLI interaction patterns, command output formats, and error message templates that deliver the >95% installation reliability and trust-building objectives.

Key areas for UX design:
- CLI command syntax and flag conventions (ensure npm-like familiarity)
- Progress indicator patterns for long-running operations (Arweave 2-5 minute finality)
- Error message templates with recovery guidance (support NFR requirement for clear error handling)
- Search results table layout and install command hints
- Installation progress phases and success/failure visualization
- Verbose vs concise output modes

Deliverable: UX design document with CLI interaction specifications, command output mockups, and error message library.

## Architect Prompt

Review the Agent Skills Registry PRD (`docs/prd.md`) and brief (`docs/brief.md`) to create the technical architecture for the MVP. The PRD validation report indicates READY FOR ARCHITECT status with 92% completeness.

Priority architecture focus areas:
1. **AO Registry Process Design** - Lua handler implementation following ADP v1.0 spec, state management strategy, message schema definitions
2. **Dependency Resolution Algorithm** - Graph traversal approach, circular dependency detection, topological sorting for installation order
3. **Wallet Management Security** - Keypair storage strategy, system keychain integration with file-based fallback, balance checking approach
4. **Cross-Platform Build Strategy** - Monorepo tooling selection (Turborepo/Nx/npm workspaces), TypeScript compilation, npm package structure

Technical investigations needed:
- Monorepo tooling decision based on build complexity
- AO registry process deployment and process ID management
- tar.gz compression optimization (size vs speed trade-off)
- Circular dependency detection algorithm implementation

Use aolite for local AO testing and mocked Arweave SDK for integration tests (no test network available per technical assumptions).

Deliverable: Architecture document including system diagrams, component specifications, data flow diagrams, testing strategy, and deployment plan.

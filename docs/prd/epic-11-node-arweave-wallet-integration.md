# Epic 11: Node Arweave Wallet Integration - Brownfield Enhancement

<!-- Powered by BMAD™ Core -->

## Status

Draft

## Epic Goal

Integrate `node-arweave-wallet` as a fallback authentication mechanism when no SEED_PHRASE environment variable is available, enabling users to securely connect their browser wallets (Wander, ArConnect) to Permamind CLI/MCP tools through an enhanced local server UI that matches the existing developer-CLI frontend design.

## Epic Description

### Existing System Context

**Current Permaweb Wallet Functionality:**
- Wallet generation from SEED_PHRASE environment variable (12-word mnemonic)
- Arweave keypair management via `@permaweb/aoconnect` (createDataItemSigner)
- Wallet operations: token transfers, AO message signing, ArNS purchases, Arweave uploads
- Current requirement: SEED_PHRASE must be configured in environment variables

**Technology Stack:**
- Node.js 20.11.0 LTS with TypeScript 5.3.3
- Arweave SDK (^1.14.4) for transaction management
- @permaweb/aoconnect (^0.0.53) for AO process interactions
- Existing MCP server architecture (Permamind MCP tools)
- Frontend: Developer CLI with established UI/UX patterns

**Integration Points:**
- Wallet initialization: `cli/src/lib/wallet-manager.ts` (current SEED_PHRASE-based)
- MCP wallet tools: `mcp-server/tools/wallet-tools.ts` (generateKeypair, getUserPublicKey)
- Token operations: `mcp-server/tools/token-tools.ts` (transfer, balance checks)
- ArNS operations: `mcp-server/tools/arns-tools.ts` (domain purchases, updates)
- Arweave uploads: `mcp-server/tools/arweave-tools.ts` (file/folder uploads)

### Enhancement Details

**What's being added/changed:**

1. **Fallback Wallet Authentication**
   - Add `node-arweave-wallet` library (latest version) as dependency
   - Implement fallback logic: Check SEED_PHRASE → If missing, initialize NodeArweaveWallet
   - Random port allocation (port: 0) to avoid conflicts with existing servers
   - Browser wallet connection flow (Wander, ArConnect compatibility)

2. **Enhanced Local Server UI**
   - Design local server web interface matching developer-CLI frontend aesthetics
   - Components: Connection status, wallet address display, permission management
   - Responsive design supporting browser auto-open workflow
   - Error handling UI for timeout, connection failures, wallet rejections

3. **Wallet Manager Refactoring**
   - Abstract wallet interface supporting both authentication methods
   - Unified signer interface: SEED_PHRASE signer + browser wallet signer
   - Configuration detection: Graceful fallback with clear user messaging
   - Session management: Wallet persistence during CLI session lifecycle

**How it integrates:**
- Drop-in replacement: No changes to existing MCP tool signatures
- Transparent authentication: Tools don't need to know wallet source
- Configuration-based: SEED_PHRASE presence determines authentication method
- User experience: Browser opens automatically when wallet connection needed

**Success criteria:**
- All existing wallet operations (token transfer, ArNS, uploads) work with browser wallets
- Local server UI matches developer-CLI frontend design system
- Zero breaking changes to existing SEED_PHRASE workflow
- Clear error messages guide users through browser wallet setup
- Port conflicts automatically resolved via random port allocation

## Stories

### Story 11.1: Node Arweave Wallet Library Integration

**As a** CLI developer,
**I want** to integrate `node-arweave-wallet` library with random port allocation,
**so that** browser wallet connections work without port conflicts.

**Key Tasks:**
- Install `node-arweave-wallet` npm package
- Create `NodeArweaveWalletAdapter` class wrapping library
- Implement initialization with `port: 0` configuration
- Add browser wallet permission handling (ACCESS_ADDRESS, SIGN_TRANSACTION, DISPATCH, etc.)
- Unit tests for adapter with mocked node-arweave-wallet

### Story 11.2: Wallet Manager Fallback Logic

**As a** Permamind user,
**I want** automatic fallback to browser wallet when SEED_PHRASE is not configured,
**so that** I can use the CLI without exposing my seed phrase.

**Key Tasks:**
- Refactor `wallet-manager.ts` to detect SEED_PHRASE availability
- Implement fallback logic: SEED_PHRASE → NodeArweaveWallet
- Create unified `WalletProvider` interface for both authentication methods
- Add clear console messaging explaining which wallet method is active
- Integration tests validating fallback behavior

### Story 11.3: Local Server UI Design and Implementation

**As a** user connecting my browser wallet,
**I want** a polished local server UI matching the developer-CLI design,
**so that** the wallet connection experience feels native to Permamind.

**Key Tasks:**
- Design HTML/CSS for local server interface (referencing developer-CLI frontend patterns)
- Components: Connection status indicator, wallet address display, permission list
- Responsive layout (desktop/mobile browser compatibility)
- Loading states, error states, success confirmations
- Integration with NodeArweaveWallet initialization flow
- Themed to match developer-CLI color scheme and typography

### Story 11.4: MCP Tool Wallet Abstraction

**As an** MCP tool developer,
**I want** a unified signer interface that works with both wallet methods,
**so that** token, ArNS, and Arweave tools require no code changes.

**Key Tasks:**
- Create `createUnifiedDataItemSigner` utility function
- Update token tools to use unified signer
- Update ArNS tools to use unified signer
- Update Arweave upload tools to use unified signer
- Verify all MCP tools work with both wallet methods (seed phrase + browser wallet)

### Story 11.5: Error Handling and User Guidance

**As a** Permamind user,
**I want** clear error messages and recovery steps when wallet connection fails,
**so that** I can troubleshoot browser wallet issues independently.

**Key Tasks:**
- Implement error handling for wallet connection timeout (default 5 min)
- User-friendly error messages for: browser didn't open, wallet rejected, timeout
- Add configuration option for custom request timeout
- Documentation: Troubleshooting guide for browser wallet connections
- Integration tests for error scenarios

## Compatibility Requirements

- [x] Existing SEED_PHRASE workflow remains unchanged (zero breaking changes)
- [x] All MCP tools maintain current API signatures (token, ArNS, Arweave uploads)
- [x] No changes to existing database schema or AO process interactions
- [x] UI design follows established developer-CLI patterns (colors, typography, layout)
- [x] Performance: Wallet connection completes within 30 seconds (excluding user approval time)
- [x] Cross-platform: Works on macOS, Linux, Windows (browser auto-open via `open` npm package)

## Risk Mitigation

**Primary Risk:** Browser wallet integration introduces external dependency (user's wallet extension availability and configuration)

**Mitigation:**
- Clear prerequisite documentation (Wander/ArConnect installation required)
- Fallback error messages guide users to install wallet extensions
- SEED_PHRASE method remains available as stable alternative
- Comprehensive error handling for all wallet connection failure modes

**Rollback Plan:**
- Remove node-arweave-wallet dependency
- Revert wallet-manager.ts to SEED_PHRASE-only implementation
- No data migration needed (wallet method is stateless per-session)
- Release patch version with rollback changes

## Definition of Done

- [x] All 5 stories completed with acceptance criteria met
- [x] Existing wallet functionality verified (SEED_PHRASE method unchanged)
- [x] Browser wallet workflow tested with Wander and ArConnect
- [x] Local server UI matches developer-CLI design system
- [x] Port conflicts resolved via random port allocation (port: 0)
- [x] Documentation updated: README, troubleshooting guide, configuration examples
- [x] All existing integration tests pass (token, ArNS, Arweave uploads)
- [x] No regression in SEED_PHRASE-based workflows

---

**Epic Owner Decision**: Ready for story breakdown and implementation following brownfield enhancement workflow.

**Story Manager Handoff:**

Please develop detailed user stories for this brownfield epic. Key considerations:

- **Existing system**: Permamind CLI/MCP with SEED_PHRASE-based wallet management (Arweave + AO integration)
- **Integration points**:
  - `cli/src/lib/wallet-manager.ts` (wallet generation from seed phrase)
  - `mcp-server/tools/wallet-tools.ts` (keypair generation, public key retrieval)
  - `mcp-server/tools/token-tools.ts` (token transfers, balance checks)
  - `mcp-server/tools/arns-tools.ts` (ArNS domain operations)
  - `mcp-server/tools/arweave-tools.ts` (file/folder uploads)
- **Existing patterns to follow**:
  - TypeScript 5.3.3 strict mode with ESLint
  - Jest testing framework (unit + integration tests)
  - MCP server tool architecture (schema validation, error handling)
  - Developer-CLI frontend design system (UI/UX consistency)
- **Critical compatibility requirements**:
  - Zero breaking changes to SEED_PHRASE workflow
  - All MCP tool APIs remain unchanged
  - No database schema changes
  - Performance target: <30s wallet connection (excluding user approval)
- **node-arweave-wallet specific**:
  - Use `port: 0` for random port allocation
  - Support all arweaveWallet API methods (connect, sign, dispatch, encrypt, etc.)
  - Local server UI styled to match developer-CLI frontend
  - Browser profile support for Chromium-based browsers (optional enhancement)

Each story must include:
1. Verification that existing SEED_PHRASE functionality remains intact
2. Integration tests covering both wallet methods (seed phrase + browser wallet)
3. UI/UX validation against developer-CLI design standards (for Story 11.3)
4. Clear error handling with user-friendly recovery guidance

The epic should maintain system integrity while delivering seamless browser wallet authentication for users without seed phrase configuration.

---

**Created**: 2025-11-03
**Epic**: Epic 11 (Node Arweave Wallet Integration - Brownfield Enhancement)
**Priority**: MEDIUM (Enhances UX without breaking existing workflows)
**Estimated Effort**: 2-3 days (5 stories)
**Dependencies**: node-arweave-wallet npm package documentation, developer-CLI frontend design system

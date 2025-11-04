# Epic 12: Custom Wallet UI Fork - Brownfield Enhancement

<!-- Powered by BMAD™ Core -->

## Status

Draft

## Epic Goal

Fork `node-arweave-wallet` library to enable custom HTML/CSS/JS UI templates for the browser wallet connection interface, providing a fully branded Permamind experience that matches the developer-CLI frontend design system while maintaining compatibility with upstream library updates.

## Epic Description

### Existing System Context

**Current Browser Wallet Functionality (Epic 11 Delivered):**
- NodeArweaveWallet integration complete with random port allocation
- Fallback logic: SEED_PHRASE → Browser Wallet → File Wallet
- Browser wallet connection via local HTTP server using library's default UI
- Server-Sent Events (SSE) for request/response communication
- Library serves hardcoded HTML/CSS/JS from `src/signer/` directory

**Technology Stack:**
- node-arweave-wallet (^0.0.12) - current dependency
- Local HTTP server on random port (port: 0)
- Server-Sent Events (SSE) for browser-to-server communication
- HTML/CSS/JS served inline (signer.html + signer.js)
- Browser auto-open via `open` npm package

**Integration Points:**
- `cli/src/lib/node-arweave-wallet-adapter.ts` - Adapter wrapping library
- `cli/src/lib/wallet-manager.ts` - Wallet provider fallback logic
- Library source code: `node_modules/node-arweave-wallet/dist/index.js`
- HTML template: `node_modules/node-arweave-wallet/dist/signer/signer.html`
- JavaScript: `node_modules/node-arweave-wallet/dist/signer/signer.js`

**Current Limitation (Research Finding from Story 11.3):**
- Library does **NOT** support custom HTML templates via configuration
- `getSignerHTML()` method hardcoded to read from `src/signer/signer.html`
- No API to provide custom template path or override default UI
- To customize UI, library must be forked and modified

### Enhancement Details

**What's being added/changed:**

1. **Fork node-arweave-wallet Repository**
   - Fork https://github.com/pawanpaudel93/node-arweave-wallet to Permamind organization
   - Create custom branch: `permamind-custom-ui`
   - Add upstream remote for syncing future updates
   - Document fork maintenance process

2. **Custom HTML Template Configuration API**
   - Add `customHtmlTemplatePath` option to `NodeArweaveWalletConfig` interface
   - Modify `getSignerHTML()` method to support custom template loading
   - Fallback to default template if custom path not provided
   - Validate template file exists before server initialization

3. **Permamind Branded UI Assets**
   - Create custom HTML: `cli/src/ui/wallet-connect.html`
   - Create custom CSS: `cli/src/ui/wallet-connect.css`
   - Create custom JavaScript: `cli/src/ui/wallet-connect.js`
   - Match developer-CLI frontend design system (colors, typography, layout)
   - Maintain SSE communication protocol compatibility

4. **Adapter Integration Update**
   - Update `NodeArweaveWalletAdapter` to use forked library
   - Configure custom HTML template path in initialization
   - Verify UI renders correctly with custom templates
   - Maintain backward compatibility with default library behavior

**How it integrates:**
- Fork maintained as separate npm package: `@permamind/node-arweave-wallet`
- Drop-in replacement for original library (same API surface)
- Configuration-based: Custom UI only loaded if template path provided
- Upstream sync strategy: Periodic rebases from main repository
- No breaking changes to existing Epic 11 wallet workflows

**Success criteria:**
- Custom UI templates fully replace library's default HTML/CSS/JS
- UI matches developer-CLI frontend design system (colors, fonts, spacing)
- All browser wallet operations work identically to Epic 11 implementation
- Fork documented with maintenance guidelines and upstream sync process
- CI/CD pipeline validates fork compatibility with upstream changes
- Fallback to default UI if custom templates fail to load

## Stories

### Story 12.1: Fork Repository and Configure Custom UI Infrastructure

**As a** Permamind maintainer,
**I want** to fork node-arweave-wallet with custom UI configuration support,
**so that** we can serve branded HTML templates from our CLI.

**Key Tasks:**
- Fork https://github.com/pawanpaudel93/node-arweave-wallet
- Add `customHtmlTemplatePath` config option to library
- Modify `getSignerHTML()` to support custom template loading
- Add unit tests for custom template configuration
- Document fork maintenance process

### Story 12.2: Design Permamind Branded UI Components

**As a** user connecting my browser wallet,
**I want** a Permamind-branded UI matching the developer-CLI design,
**so that** the wallet connection experience feels native and consistent.

**Key Tasks:**
- Create `cli/src/ui/wallet-connect.html` with Permamind branding
- Create `cli/src/ui/wallet-connect.css` matching developer-CLI design system
- Create `cli/src/ui/wallet-connect.js` maintaining SSE protocol compatibility
- Implement responsive design (desktop/mobile browser compatibility)
- Cross-browser testing (Chrome, Firefox, Safari, Edge)

### Story 12.3: Integrate Custom UI with NodeArweaveWalletAdapter

**As a** CLI developer,
**I want** NodeArweaveWalletAdapter to use custom UI templates,
**so that** browser wallet connections display Permamind branding.

**Key Tasks:**
- Update adapter to use forked library: `@permamind/node-arweave-wallet`
- Configure custom template path in adapter initialization
- Verify custom UI renders correctly on wallet connection
- Integration tests validating custom UI with browser wallet flow
- Fallback error handling if custom templates fail to load

## Compatibility Requirements

- [x] Zero breaking changes to Epic 11 wallet workflows (SEED_PHRASE, browser wallet, file wallet)
- [x] Fork maintains API compatibility with upstream node-arweave-wallet library
- [x] SSE communication protocol unchanged (request/response pattern preserved)
- [x] Custom UI optional: Library works with default UI if no template path provided
- [x] Performance: Custom UI loads in <1 second on local server
- [x] Cross-platform: Custom UI works on macOS, Linux, Windows browsers

## Risk Mitigation

**Primary Risk:** Fork divergence from upstream library creates maintenance burden

**Mitigation:**
- Minimal fork changes: Only modify UI template loading mechanism
- Document rebase process for syncing upstream updates
- Automated tests validate fork compatibility with upstream changes
- CI/CD pipeline alerts on upstream version bumps
- Upstream contribution: Submit PR to add custom UI config to original library

**Secondary Risk:** Custom UI breaks SSE communication protocol

**Mitigation:**
- Preserve exact SSE event structure from original library
- Integration tests validate request/response flow with custom UI
- Fallback to default UI on custom template load failure
- Comprehensive error logging for UI initialization issues

**Rollback Plan:**
- Revert to original node-arweave-wallet library (^0.0.12)
- Adapter uses library's default UI (no custom templates)
- No wallet functionality lost (browser wallet flow remains functional)
- No data migration needed (UI is stateless per-session)

## Definition of Done

- [x] All 3 stories completed with acceptance criteria met
- [x] Fork published as `@permamind/node-arweave-wallet` on npm
- [x] Custom UI matches developer-CLI frontend design system
- [x] All Epic 11 wallet workflows verified (SEED_PHRASE, browser wallet, file wallet)
- [x] Integration tests pass with custom UI templates
- [x] Fork maintenance documentation complete (rebase process, upstream sync)
- [x] CI/CD pipeline monitors upstream library updates
- [x] No regression in browser wallet connection flow
- [x] Cross-browser testing complete (Chrome, Firefox, Safari, Edge)

---

**Epic Owner Decision**: Ready for story breakdown and implementation following brownfield enhancement workflow.

**Story Manager Handoff:**

Please develop detailed user stories for this brownfield epic. Key considerations:

- **Existing system**: Epic 11 delivered browser wallet integration using node-arweave-wallet (^0.0.12)
- **Integration points**:
  - `cli/src/lib/node-arweave-wallet-adapter.ts` (adapter wrapping library)
  - `cli/src/lib/wallet-manager.ts` (wallet provider fallback logic)
  - Library source code: `node_modules/node-arweave-wallet/dist/` (to be forked)
  - Custom UI assets: `cli/src/ui/` (new directory created in Epic 11)
- **Existing patterns to follow**:
  - TypeScript 5.3.3 strict mode with ESLint
  - Jest testing framework (unit + integration tests)
  - Developer-CLI frontend design system (UI/UX consistency)
  - Server-Sent Events (SSE) protocol for browser communication
- **Critical compatibility requirements**:
  - Zero breaking changes to Epic 11 wallet workflows
  - Fork maintains API compatibility with upstream library
  - SSE communication protocol unchanged
  - Custom UI optional (fallback to default UI)
  - Performance target: <1s custom UI load time
- **Fork-specific requirements**:
  - Minimal fork changes (only UI template loading mechanism)
  - Document rebase process for upstream sync
  - CI/CD pipeline for upstream version monitoring
  - Upstream contribution plan (submit PR to original library)

Each story must include:
1. Verification that existing Epic 11 wallet functionality remains intact
2. Integration tests covering both default UI and custom UI
3. UI/UX validation against developer-CLI design standards (for Story 12.2)
4. Fork maintenance documentation (rebase process, upstream sync)

The epic should maintain system integrity while delivering fully branded Permamind UI for browser wallet connections.

---

**Created**: 2025-11-03
**Epic**: Epic 12 (Custom Wallet UI Fork - Brownfield Enhancement)
**Priority**: LOW (UI enhancement, not functional requirement)
**Estimated Effort**: 2-3 days (3 stories)
**Dependencies**: Epic 11 (Node Arweave Wallet Integration), node-arweave-wallet fork repository
**Upstream Contribution**: Plan to submit PR adding custom UI config to original library
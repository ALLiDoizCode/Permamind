# Epic 9: Turbo SDK Migration - Brownfield Enhancement

## Epic Goal

Migrate from direct Arweave SDK transaction creation to Turbo SDK for bundle uploads, enabling **free uploads for bundles under 100KB** (most skill bundles) and reducing network costs while maintaining full backward compatibility with existing registry infrastructure.

## Epic Description

### Existing System Context

**Current relevant functionality:**
- Direct Arweave transaction creation using `arweave.createTransaction()` and `arweave.transactions.post()`
- Bundle uploads via `cli/src/clients/arweave-client.ts` with retry logic, progress tracking, and confirmation polling
- Wallet-based signing with JWK (JSON Web Key) wallets
- Transaction fees paid directly in AR tokens (winston)
- Average bundle sizes: **Most bundles < 100KB** (skill metadata + SKILL.md files)

**Technology stack:**
- Node.js/TypeScript CLI tool
- Arweave SDK v1.14.4 (`arweave` package)
- Direct transaction creation and posting
- Existing wallet management (file-based + seed phrase)

**Integration points:**
- `cli/src/clients/arweave-client.ts` - Upload bundle, check transaction status, poll confirmation, download bundle
- `cli/src/lib/publish-service.ts` - Uses ArweaveClient for publishing workflow
- `cli/src/lib/install-service.ts` - Uses ArweaveClient for bundle downloads
- Arweave Network - Transaction submission and data retrieval

### Enhancement Details

**What's being added/changed:**
- Replace direct Arweave SDK usage with **Turbo SDK** (`@ardrive/turbo-sdk`)
- Implement Turbo SDK upload workflow:
  - Free uploads for bundles < 100KB (subsidized by Turbo)
  - Credit-based uploads for larger bundles (optional fallback)
  - Automatic selection based on bundle size
- Maintain existing interface contracts (no API changes for consumers)
- Preserve all existing functionality: retry logic, progress tracking, confirmation polling
- Add Turbo SDK configuration options (optional gateway, credit management)

**How it integrates:**
- **ArweaveClient interface preserved** - `uploadBundle()`, `downloadBundle()`, `checkTransactionStatus()`, `pollConfirmation()` maintain exact same signatures
- **Turbo SDK wrapper** - Internal implementation switches to Turbo SDK methods while maintaining external contract
- **Backward compatibility** - Download functionality continues using Arweave gateway (no changes needed)
- **Wallet compatibility** - Turbo SDK accepts same JWK format as existing wallet infrastructure
- **Testing strategy** - Existing integration tests continue passing (interface unchanged)
- **Configuration** - Add optional `TURBO_GATEWAY` environment variable (defaults to Turbo's gateway)

**Success criteria:**
- ✅ Bundles < 100KB upload for **free** using Turbo SDK
- ✅ All existing ArweaveClient tests pass without modification
- ✅ `uploadBundle()` function signature unchanged (drop-in replacement)
- ✅ Progress tracking, retry logic, and error handling preserved
- ✅ Download functionality continues working (no migration needed)
- ✅ Transaction IDs remain compatible with AO registry (same format)
- ✅ Wallet infrastructure (file-based + seed phrase) works with Turbo SDK
- ✅ Published skills remain discoverable and installable (registry compatibility)

## Stories

Epic 9 is divided into **3 focused stories**:

### Story 9.1: Add Turbo SDK Dependency and Configuration
**Brief description:** Install Turbo SDK, add configuration options, and set up development environment with proper TypeScript types and environment variable support.

**Key tasks:**
- Install `@ardrive/turbo-sdk` package
- Add Turbo SDK TypeScript definitions
- Create `ITurboConfig` interface for SDK configuration
- Add optional environment variables:
  - `TURBO_GATEWAY` - Custom Turbo gateway URL (default: Turbo's public gateway)
  - `TURBO_USE_CREDITS` - Force credit-based uploads (default: false, use free tier)
- Update configuration loader to include Turbo settings
- Add Turbo SDK initialization helper function

**Acceptance criteria:**
- ✅ `@ardrive/turbo-sdk` installed and available
- ✅ TypeScript compilation succeeds with Turbo SDK imports
- ✅ Configuration loader includes Turbo settings
- ✅ No functional changes to existing code (setup only)

### Story 9.2: Implement Turbo SDK Upload in ArweaveClient
**Brief description:** Replace direct Arweave transaction creation with Turbo SDK upload methods while preserving exact `uploadBundle()` interface and all existing functionality (retry logic, progress tracking, error handling).

**Key tasks:**
- Create Turbo SDK client initialization from JWK wallet
- Implement `uploadBundle()` using Turbo SDK:
  - For bundles < 100KB: Use `turbo.uploadFile()` (free tier)
  - For bundles ≥ 100KB: Use `turbo.uploadFile()` with credit check (optional fallback to direct Arweave)
- Preserve all existing error handling:
  - `NetworkError` for timeout/gateway failures
  - `AuthorizationError` for insufficient credits/funds
  - `ValidationError` for invalid transactions
- Maintain retry logic with exponential backoff
- Preserve progress callback integration
- Extract transaction ID from Turbo response
- Update cost calculation to reflect Turbo pricing (free for < 100KB)

**Acceptance criteria:**
- ✅ `uploadBundle()` signature unchanged (external contract preserved)
- ✅ Bundles < 100KB upload for free (verified via Turbo response)
- ✅ Bundles ≥ 100KB handled appropriately (credit check or fallback)
- ✅ Progress tracking works (callback invoked during upload)
- ✅ Retry logic functions (3 attempts with exponential backoff)
- ✅ Error handling preserved (correct error types thrown)
- ✅ Transaction IDs returned in correct format (43-character Arweave TXID)
- ✅ All existing `arweave-client.test.ts` tests pass without modification

### Story 9.3: Integration Testing and Documentation
**Brief description:** Comprehensive integration testing to verify Turbo SDK migration works end-to-end, including real network tests, cross-compatibility validation, and documentation updates.

**Key tasks:**
- Create Turbo SDK integration tests:
  - Test free upload for small bundles (< 100KB)
  - Test upload with progress tracking
  - Test retry logic on network failures
  - Test error handling (insufficient credits, network errors)
- Verify cross-compatibility:
  - Publish skill via Turbo SDK → search via AO registry (verify registration)
  - Install skill published via Turbo SDK (verify download works)
  - Confirm transaction status polling works with Turbo-uploaded TXIDs
- Performance testing:
  - Compare upload times (Turbo SDK vs direct Arweave)
  - Verify free tier activation for < 100KB bundles
- Update documentation:
  - Add Turbo SDK migration notes to README
  - Document cost savings (free uploads < 100KB)
  - Update environment variable documentation (`TURBO_GATEWAY`, `TURBO_USE_CREDITS`)
  - Add troubleshooting section for Turbo SDK errors

**Acceptance criteria:**
- ✅ Integration tests pass for Turbo SDK uploads (< 100KB and ≥ 100KB)
- ✅ Skills published via Turbo SDK are discoverable in AO registry
- ✅ Skills published via Turbo SDK can be installed successfully
- ✅ Transaction status polling works with Turbo-uploaded TXIDs
- ✅ Cost savings documented (free tier for < 100KB bundles)
- ✅ README updated with Turbo SDK information
- ✅ Environment variable documentation complete
- ✅ No regression in existing publish/install workflows

## Compatibility Requirements

- [x] Existing CLI commands remain fully functional (publish, search, install)
- [x] `uploadBundle()` API signature unchanged (drop-in replacement)
- [x] Download functionality unchanged (continues using Arweave gateway)
- [x] Transaction ID format unchanged (43-character Arweave TXID)
- [x] AO registry integration unchanged (same message schemas)
- [x] Wallet infrastructure compatible (file-based + seed phrase work with Turbo SDK)
- [x] Error types preserved (`NetworkError`, `AuthorizationError`, `ValidationError`)
- [x] Progress tracking interface unchanged (same callback signature)
- [x] Retry logic preserved (3 attempts with exponential backoff)
- [x] Configuration remains backward compatible (Turbo settings optional)

## Risk Mitigation

**Primary Risk:** Turbo SDK integration breaks existing upload/download workflows or introduces incompatible transaction formats

**Mitigation:**
- **Interface preservation:** Maintain exact `uploadBundle()` signature - consumers see no API changes
- **Incremental migration:** Only migrate upload functionality; downloads remain unchanged (lower risk)
- **Test coverage:** All existing `arweave-client` tests must pass without modification
- **Integration testing:** Verify cross-compatibility with AO registry before release
- **Fallback mechanism:** Optional fallback to direct Arweave for bundles ≥ 100KB (if Turbo credits unavailable)
- **Feature flag:** Optional `TURBO_USE_CREDITS` environment variable for testing/debugging

**Rollback Plan:**
- Git revert to pre-migration commit if integration tests fail
- Turbo SDK is internal implementation detail (API unchanged), so rollback is transparent to consumers
- No database/registry schema changes, so rollback has no migration requirements
- Existing skills published via direct Arweave remain compatible (no format changes)

## Definition of Done

- [x] Turbo SDK integrated into ArweaveClient (`@ardrive/turbo-sdk` installed and configured)
- [x] Bundles < 100KB upload for **free** using Turbo SDK (verified via integration tests)
- [x] `uploadBundle()` signature unchanged (drop-in replacement, no API breaking changes)
- [x] All existing `arweave-client.test.ts` tests pass without modification
- [x] Progress tracking works (callback invoked during Turbo SDK upload)
- [x] Retry logic preserved (3 attempts with exponential backoff)
- [x] Error handling preserved (correct error types: `NetworkError`, `AuthorizationError`, `ValidationError`)
- [x] Transaction IDs compatible with AO registry (same 43-character format)
- [x] Skills published via Turbo SDK are discoverable via search
- [x] Skills published via Turbo SDK can be installed successfully
- [x] Download functionality unchanged (continues using Arweave gateway)
- [x] Documentation updated (README, environment variables, cost savings)
- [x] No regression in existing CLI functionality (publish, search, install)
- [x] Wallet infrastructure compatible (file-based + seed phrase work with Turbo SDK)

## Dependencies

- Existing ArweaveClient implementation (`cli/src/clients/arweave-client.ts`)
- Turbo SDK (`@ardrive/turbo-sdk` package)
- Existing wallet infrastructure (file-based + seed phrase from Epic 8)
- AO registry process (unchanged integration)

## Timeline

**3 stories, estimated 3-4 days total:**
- **Story 9.1**: Setup & Configuration - ~0.5 days
- **Story 9.2**: Implementation - ~1.5-2 days
- **Story 9.3**: Testing & Documentation - ~1 day

Stories are sized to be independently deliverable and testable, enabling incremental progress validation.

---

## Story Manager Handoff

"Please develop detailed user stories for this brownfield epic. Key considerations:

- This is an enhancement to an existing Node.js/TypeScript skills registry CLI running Arweave SDK v1.14.4
- Integration points:
  - `cli/src/clients/arweave-client.ts` - Upload/download bundle, transaction status
  - `cli/src/lib/publish-service.ts` - Publishing workflow (uses ArweaveClient)
  - `cli/src/lib/install-service.ts` - Installation workflow (uses ArweaveClient)
  - Arweave Network - Transaction submission and retrieval
- Existing patterns to follow:
  - TDD approach with Jest (all tests must pass without modification)
  - Interface preservation (no API breaking changes)
  - Retry logic with exponential backoff (3 attempts, 1s/2s/4s delays)
  - Error handling with custom error types (`NetworkError`, `AuthorizationError`, `ValidationError`)
  - Progress tracking via callback pattern
- Critical compatibility requirements:
  - **`uploadBundle()` signature must remain unchanged** (drop-in replacement)
  - Transaction ID format must remain 43-character Arweave TXID (AO registry compatibility)
  - Download functionality unchanged (no migration needed)
  - Wallet infrastructure compatible (file-based + seed phrase from Epic 8)
  - All existing tests pass without modification
- **Cost optimization goal:** Enable free uploads for bundles < 100KB (most skills)
- Each story must include verification that existing functionality remains intact
- Story 9.2 (implementation) is the highest risk and should have comprehensive acceptance criteria

The epic should maintain system integrity while delivering significant cost savings (free uploads for most skills) through Turbo SDK migration."

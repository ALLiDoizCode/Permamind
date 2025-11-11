# Epic 10: Jest Test Infrastructure Overhaul

## Epic Goal

Fix Jest automocking infrastructure or migrate to Vitest to restore automated unit testing capabilities, enabling **reliable test isolation** and **fast feedback loops** for the Agent Skills Registry CLI development.

## Epic Description

### Existing System Context

**Current test infrastructure:**
- Jest 29.7.0 as testing framework
- @swc/jest transformer for TypeScript compilation (Rust-based, no Babel dependency)
- TypeScript 5.3.3 compiling to CommonJS (module: "commonjs")
- 150+ unit and integration tests across CLI modules
- Test pyramid: 70% unit, 25% integration, 5% e2e

**Technology stack:**
- Jest configuration: `cli/jest.config.js`
- TypeScript configuration: `tsconfig.json` (module: "commonjs", target: "ES2020")
- Transformer: `@swc/jest` for fast TypeScript compilation
- Test organization: `cli/tests/unit/**/*.test.ts`, `cli/tests/integration/**/*.test.ts`

**Integration points:**
- All service modules: publish-service, install-service, search-service
- All client modules: arweave-client, ao-registry-client
- Parser and utility modules: manifest-parser, bundler, wallet-manager

### Problem Statement

**Jest automocking is completely broken** due to TypeScript + CommonJS + @swc/jest transformer combination:

1. `jest.mock()` calls **silently fail** and return **real implementations** instead of mock functions
2. All mocked modules show `Is jest.fn?: false` (not Jest mocks)
3. Functions appear as `[AsyncFunction: ...]` instead of `[MockFunction]`
4. Attempting `.mockResolvedValue()` fails with "is not a function"
5. Attempting `jest.spyOn()` fails with "Cannot redefine property"

**Root Cause**: TypeScript compiles to CommonJS with getter-based property descriptors that are **non-configurable**, preventing Jest from creating automatic mocks or spies.

**Impact**:
- ❌ 75+ tests blocked (publish-service: 24 unit + 15 integration + others)
- ❌ Cannot validate business logic with unit tests
- ❌ Regression risk increases (no test safety net)
- ❌ Development velocity decreases (manual testing required)
- ❌ Code review becomes primary quality gate (unsustainable)

**Critical Mystery**: install-service.test.ts (22 tests) **PASSES** using the **identical mocking pattern** - suggests issue IS solvable.

### Enhancement Details

**What's being changed:**

**Option 1: Migrate to Vitest** (Recommended)
- Replace Jest with Vitest testing framework
- Native TypeScript + ES module support eliminates mocking issues
- Faster execution (Vite-powered, parallel test execution)
- Jest-compatible API (minimal migration effort)
- Modern tooling with active development

**Option 2: Fix @swc/jest Configuration** (Conservative)
- Investigate @swc/jest mocking configuration
- Research transformer compatibility with Jest automocking
- Implement workarounds if available

**Option 3: Complete Manual Mock System** (Fallback)
- Create comprehensive manual mocks for all modules (20+ files)
- Establish __mocks__/ directory structure
- Document manual mock maintenance process

**How it integrates:**
- **Test files updated**: Minimal changes if Vitest chosen (Jest-compatible API)
- **CI/CD pipeline**: Update GitHub Actions workflow to run Vitest
- **Package.json scripts**: Update test commands to use new framework
- **Documentation**: Update test strategy with new mocking patterns
- **Developer workflow**: New patterns documented in coding standards

**Success criteria:**
- ✅ All 150+ tests PASS with proper mocking
- ✅ jest.mock() or vi.mock() creates actual mocks (Is jest.fn?: true)
- ✅ No "Cannot redefine property" errors
- ✅ Test execution time < 5 seconds for unit tests
- ✅ Mocking pattern documented and consistent
- ✅ CI/CD pipeline GREEN with new infrastructure
- ✅ Team trained on new testing patterns

## Stories

Epic 10 is divided into **4 focused stories** (phased approach):

### Story 10.1: Investigate Install-Service Success Pattern
**Brief description:** Debug why install-service.test.ts (22 tests) PASSES with identical mocking pattern that fails for publish-service, to determine if a simple fix exists.

**Key tasks:**
- Compare module loading order between install-service and publish-service
- Analyze dependency chain differences
- Test isolated reproduction cases
- Document findings and recommendations

**Acceptance criteria:**
- ✅ Root cause of install-service success identified
- ✅ Reproducible test case created demonstrating the difference
- ✅ Recommendation: Simple fix OR proceed to Vitest migration
- ✅ Documentation updated with findings
- ✅ Decision made: Fix @swc/jest OR migrate to Vitest

**Effort**: 4-6 hours
**Priority**: Critical (determines approach for Stories 10.2-10.4)

### Story 10.2: Vitest Migration - Pilot Phase
**Brief description:** Install Vitest, configure infrastructure, and migrate 5-10 pilot test files to validate mocking works correctly before full migration.

**Key tasks:**
- Install Vitest dependencies: `vitest`, `@vitest/ui`, `c8` (coverage)
- Create `vitest.config.ts` with appropriate settings
- Update package.json test scripts
- Migrate 5 pilot test files:
  - `url-validator.test.ts` (simple, 27 tests)
  - `wallet-manager.test.ts` (moderate, 20 tests)
  - `install-service.test.ts` (complex, 24 tests)
  - `bundler.test.ts` (file operations)
  - `config-loader.test.ts` (configuration)
- Validate mocking works: `vi.mock()` creates actual mocks
- Run pilot tests and verify all PASS

**Acceptance criteria:**
- ✅ Vitest installed and configured
- ✅ 5 pilot test files migrated (60+ tests)
- ✅ All pilot tests PASS
- ✅ Mocking works: `Is vi.fn(): true` for all mocked modules
- ✅ No "Cannot redefine property" errors
- ✅ Test execution time < 2 seconds for pilot suite

**Effort**: 6-8 hours
**Dependencies**: Story 10.1 (decision to proceed with Vitest)

### Story 10.3: Vitest Migration - Full Test Suite
**Brief description:** Migrate remaining 100+ test files to Vitest, update CI/CD pipeline, and verify all tests pass with new infrastructure.

**Key tasks:**
- Migrate all remaining test files (100+ tests):
  - Service tests: publish-service, search-service
  - Client tests: arweave-client, ao-registry-client
  - Parser tests: manifest-parser
  - Utility tests: dependency-resolver, lock-file-manager, etc.
- Update import statements: `@jest/globals` → `vitest`
- Update mock syntax: `jest.mock()` → `vi.mock()`, `jest.Mock` → `vi.mocked()`
- Update CI/CD pipeline (`.github/workflows/test.yml`)
- Remove Jest dependencies from package.json
- Clean up manual __mocks__/ files (no longer needed)

**Acceptance criteria:**
- ✅ All 150+ tests migrated to Vitest
- ✅ All tests PASS (0 failures)
- ✅ CI/CD pipeline updated and GREEN
- ✅ Test execution time < 10 seconds for full suite
- ✅ Coverage reporting works with c8 provider
- ✅ Manual mocks removed (automocking works)

**Effort**: 8-12 hours
**Dependencies**: Story 10.2 (pilot success)

### Story 10.4: Documentation and Knowledge Transfer
**Brief description:** Update all test strategy documentation, add mocking guidelines to coding standards, and train team on Vitest patterns.

**Key tasks:**
- Update `docs/architecture/test-strategy-and-standards.md` with Vitest patterns
- Add mocking guidelines to `docs/architecture/coding-standards.md`
- Create Vitest quick reference guide
- Document migration patterns and common pitfalls
- Add examples of correct mocking patterns
- Update README with new test commands
- Team training session (if needed)

**Acceptance criteria:**
- ✅ Test strategy documentation updated
- ✅ Coding standards include Vitest mocking guidelines
- ✅ Quick reference guide created
- ✅ Migration patterns documented
- ✅ Team has access to documentation
- ✅ README updated with new test commands

**Effort**: 3-4 hours
**Dependencies**: Story 10.3 (migration complete)

## Priority

**HIGH** - Blocks test automation project-wide

## Scope

**Project-wide test infrastructure** (affects all test files)

## Estimated Effort

**Total**: 24-30 hours (3-4 days)
- Story 10.1: 4-6 hours (Investigation)
- Story 10.2: 6-8 hours (Pilot migration)
- Story 10.3: 8-12 hours (Full migration)
- Story 10.4: 3-4 hours (Documentation)
- Buffer: 3-4 hours (troubleshooting)

## Value Proposition

### Before Epic 10 (Current State)
- ❌ 75+ tests blocked by broken automocking
- ❌ Manual code review only quality gate
- ❌ No automated regression detection
- ❌ Slow feedback loops for developers
- ❌ Risk of breaking changes undetected

### After Epic 10 (Target State)
- ✅ All 150+ tests passing with reliable mocking
- ✅ Fast feedback loops (< 10 seconds full suite)
- ✅ Automated regression detection
- ✅ Confident refactoring with test safety net
- ✅ Modern test infrastructure (Vitest)
- ✅ Better developer experience

### ROI Analysis

**Cost**: 3-4 days development effort

**Benefit**:
- **Development velocity**: 30% faster (instant feedback vs manual testing)
- **Quality**: 50% fewer regressions (automated test coverage)
- **Maintenance**: 40% easier refactoring (test safety net)
- **Onboarding**: 2x faster (tests document behavior)

**Payback Period**: ~2 weeks of active development

## Dependencies

### Blocks
- Full automated validation of publish-service functionality
- Confident refactoring of service layer
- TDD workflow for new features
- Regression test coverage

### Blocked By
- Story 9.2 completion (already done - implementation verified via code review)
- Story 9.3 can proceed in parallel

### Related
- Epic 8: Original test infrastructure setup (introduced the issue)
- Epic 9: Turbo SDK migration (currently using code review for validation)
- Story 9.2: Where TEST-002 was discovered during QA review

## Technical Context

### Root Cause Deep Dive

**TypeScript Compilation**:
```typescript
// Source: src/parsers/manifest-parser.ts
export async function parse(skillMdPath: string): Promise<ISkillManifest> { ... }

// Compiled: dist/parsers/manifest-parser.js (CommonJS)
exports.parse = parse;  // Normal assignment

// But @swc/jest transforms imports to use getters:
var desc = { enumerable: true, get: function() { return m[k]; } };
Object.defineProperty(o, k2, desc);  // NON-CONFIGURABLE!
```

**Result**: Properties are **read-only getters**, preventing Jest from creating mocks.

### Investigation Evidence

**Debug Test Results** (2025-11-03):
```typescript
// Created: cli/tests/debug-mock.test.ts
jest.mock('../src/parsers/manifest-parser');
import * as manifestParser from '../src/parsers/manifest-parser';

console.log('manifestParser.parse:', manifestParser.parse);
// Output: [AsyncFunction: parse]  ❌ REAL function (should be [MockFunction])

console.log('Is jest.fn?:', jest.isMockFunction(manifestParser.parse));
// Output: false  ❌ NOT a mock (should be true)
```

**10 Attempted Solutions** (all failed):
1. `jest.mocked()` helper - Error: `.mockResolvedValue is not a function`
2. `jest.spyOn()` pattern - Error: "Cannot redefine property"
3. `jest.restoreAllMocks()` - Error persists
4. Remove `jest.mock()` calls - Tests execute real code
5. Manual factory functions - `jest.fn()` unavailable during hoisting
6. Module path corrections - No impact
7. Debug test - **CONFIRMED:** `jest.mock()` broken
8. Compare install-service - Mystery: identical pattern PASSES
9. Manual mocks created - Location needs verification
10. Import pattern analysis - No impact

### Interim Workarounds

**Manual Mocks Created** (2025-11-03):
- `tests/__mocks__/src/parsers/manifest-parser.ts`
- `tests/__mocks__/src/lib/bundler.ts`
- `tests/__mocks__/src/lib/wallet-manager.ts`
- `tests/__mocks__/src/lib/skill-analyzer.ts`
- `tests/__mocks__/src/clients/arweave-client.ts`
- `tests/__mocks__/src/clients/ao-registry-client.ts`
- `src/__mocks__/fs.ts`

**Status**: Created but not verified (Jest not finding them)

## Risks

### If NOT Fixed
- **HIGH**: Cannot validate business logic changes (regression risk)
- **MEDIUM**: Development velocity decreases (manual testing overhead)
- **MEDIUM**: Code review becomes single quality gate (unsustainable)
- **LOW**: Team morale impact (frustrating development experience)

### If Fixed with Vitest
- **LOW**: Learning curve for Vitest patterns (minimal - Jest-compatible)
- **LOW**: CI/CD changes required (straightforward update)
- **VERY LOW**: Migration errors (Vitest API nearly identical to Jest)

### If Fixed with @swc/jest
- **MEDIUM**: May not be fixable (transformer limitation)
- **MEDIUM**: Complex workarounds may be fragile
- **HIGH**: Future TypeScript updates may break again

## Success Metrics

**Quantitative**:
- ✅ 150+ tests passing (current: 66 passing, 75+ blocked)
- ✅ Test execution time < 10 seconds (unit suite)
- ✅ Test execution time < 30 seconds (full suite with integration)
- ✅ Mocking success rate: 100% (jest.mock() or vi.mock() works)
- ✅ CI/CD pipeline GREEN (all tests pass)
- ✅ Zero "Cannot redefine property" errors

**Qualitative**:
- ✅ Developer confidence in refactoring (test safety net)
- ✅ Fast feedback loops (< 10 seconds from code to test result)
- ✅ Consistent mocking patterns across all tests
- ✅ Documentation clear and actionable
- ✅ Team trained on new patterns (if Vitest)

## Out of Scope

- Performance optimization beyond mocking fixes (separate epic if needed)
- E2E test infrastructure (Playwright already working)
- Test coverage improvements (focus on fixing existing tests)
- Testing strategy changes (maintain current pyramid: 70/25/5)

## Reference Documentation

**Technical Debt Document**: `docs/qa/technical-debt/epic-10-jest-infrastructure-overhaul.md`
- Comprehensive root cause analysis
- 10 attempted solutions documented
- Debug test evidence
- Vitest migration guide
- Options analysis with pros/cons

**Discovery Source**: Story 9.2 QA Review (TEST-002 investigation)
- Discovered by: Quinn (Test Architect)
- Investigation duration: 2.5 hours
- Gate file: `docs/qa/gates/9.2-implement-turbo-sdk-upload-in-arweaveclient.yml`

**Related Files**:
- `cli/jest.config.js` - Current Jest configuration
- `cli/tsconfig.json`, `tsconfig.json` - TypeScript configuration
- `docs/architecture/test-strategy-and-standards.md` - Test strategy
- `cli/tests/unit/lib/install-service.test.ts` - Working test (mystery)
- `cli/tests/unit/lib/publish-service.test.ts` - Failing test (24 failures)

## Recommended Approach

### Phase 1: Quick Investigation (Story 10.1)
**Effort**: 4-6 hours
**Goal**: Determine if simple fix exists

1. Debug why install-service.test.ts works
2. If simple fix found → apply to all tests (END Epic 10)
3. If not → Proceed to Phase 2

### Phase 2: Vitest Migration - Pilot (Story 10.2)
**Effort**: 6-8 hours
**Goal**: Validate Vitest works

1. Install and configure Vitest
2. Migrate 5 pilot test files
3. Validate mocking works correctly
4. Decision: Continue with full migration OR rollback

### Phase 3: Full Migration (Story 10.3)
**Effort**: 8-12 hours
**Goal**: Complete migration

1. Migrate remaining 100+ tests
2. Update CI/CD pipeline
3. Remove Jest dependencies
4. Verify all tests PASS

### Phase 4: Documentation & Training (Story 10.4)
**Effort**: 3-4 hours
**Goal**: Knowledge transfer

1. Update test strategy documentation
2. Add mocking guidelines to coding standards
3. Create quick reference guide
4. Team training (if needed)

**Total Timeline**: 3-4 days (24-30 hours)

## Non-Goals

- Rewriting tests (preserve existing test logic)
- Changing test strategy (maintain 70/25/5 pyramid)
- Performance tuning beyond basic setup
- Adding new test coverage (fix existing tests first)
- Migrating Playwright e2e tests (already working)

## Notes

**Discovered During**: Story 9.2 QA Review (Quinn's deep investigation of TEST-002)

**Key Insight**: The fact that install-service tests PASS suggests this is **solvable**. Epic 10 should start with understanding that success pattern before committing to full Vitest migration.

**Interim Workaround**: Story 9.2 validated via manual code review (Grade: A+). Story 9.3 integration tests will provide additional validation while Epic 10 is in progress.

**Impact on Epic 9**: Does not block Epic 9 completion. Story 9.3 can proceed with integration testing. TEST-002 should be resolved before merging Epic 9 to main.

---

**Created**: 2025-11-03
**Status**: Draft (awaiting refinement and story creation)
**Priority**: HIGH
**Target Sprint**: Next available sprint after Epic 9

# Epic 10: Jest Infrastructure Overhaul - Fix Automocking for TypeScript + CommonJS

**Status**: ✅ **RESOLVED** (Story 10.1 - Simple Fix Applied)
**Severity**: HIGH (blocked test automation project-wide)
**Scope**: Project-wide test infrastructure
**Effort**: 4 hours (investigation + fix)
**Created**: 2025-11-03
**Discovered During**: Story 9.2 QA Review (TEST-002 investigation)
**Resolved**: 2025-11-03 (Story 10.1)

---

## 🎉 RESOLUTION (Story 10.1)

**Root Cause Identified**: Import pattern mismatch between production code and test mocks.

**The Problem**:
- Production code: `import { promises as fs } from 'fs';`
- Test mock: `jest.mock('fs')` created auto-mock with undefined `promises` property
- Result: `fs` variable became `undefined`, causing "Cannot use spyOn on a primitive value"

**The Simple Fix**:
1. Change production import: `import * as fs from 'fs/promises';`
2. Change test mock: `jest.mock('fs/promises');`
3. Update spy calls: `(fs.stat as jest.Mock)` instead of `jest.spyOn(fs, 'stat')`

**Results**:
- ✅ All 24 publish-service.test.ts tests PASS
- ✅ Consistent pattern with install-service.test.ts
- ✅ No Vitest migration needed (Jest works fine!)
- ✅ Fix took 2 lines of code changes

**Files Changed**:
1. `cli/src/lib/publish-service.ts` (line 17): Changed fs import pattern
2. `cli/tests/unit/lib/publish-service.test.ts` (lines 27, 37, 103, 106, 263, 280, 294): Updated imports and mocks

---

## Original Investigation (Preserved for Reference)

---

## Executive Summary

Jest automocking is **completely broken** in this codebase due to the TypeScript + CommonJS + @swc/jest transformer combination. `jest.mock()` calls silently fail and return **real implementations** instead of mock functions, preventing unit test isolation and causing test failures.

**Impact**: 75+ tests blocked (publish-service: 24 unit + 15 integration, potentially others)

**Root Cause**: TypeScript compiles to CommonJS with getter-based property descriptors that are non-configurable, preventing Jest from creating automatic mocks or spies.

**Critical Mystery**: install-service.test.ts (22 tests) PASSES using the **identical mocking pattern** - investigation required to understand why.

---

## Problem Statement

### What's Broken

When tests call `jest.mock('../../../src/parsers/manifest-parser')`, Jest should automatically create mock implementations for all exported functions. Instead:

1. **Real implementations are loaded** (not mocks)
2. Functions show as `[AsyncFunction: parse]` instead of `[MockFunction]`
3. `jest.isMockFunction()` returns `false` for all mocked modules
4. Attempting to call `.mockResolvedValue()` fails with "is not a function"
5. Attempting `jest.spyOn()` fails with "Cannot redefine property"

### Evidence

```typescript
// Debug test output
console.log('manifestParser.parse:', manifestParser.parse);
// Output: [AsyncFunction: parse]  ❌ Should be [MockFunction]

console.log('Is jest.fn?:', jest.isMockFunction(manifestParser.parse));
// Output: false  ❌ Should be true

// Attempting to configure mock
(manifestParser.parse as jest.Mock).mockResolvedValue({ name: 'test' });
// Error: _manifestparser.parse.mockResolvedValue is not a function  ❌
```

### Affected Tests

**Currently Blocked** (75+ tests):
- `cli/tests/unit/lib/publish-service.test.ts` - 24 tests FAIL
- `cli/tests/integration/publish-service.integration.test.ts` - 15 tests FAIL
- `cli/tests/integration/cross-compatibility.integration.test.ts` - Unknown count
- Potentially other tests using `jest.mock()` pattern

**Currently Passing** (Mystery - identical pattern):
- `cli/tests/unit/lib/install-service.test.ts` - 22 tests PASS ✅
- `cli/tests/unit/lib/search-service.test.ts` - Unknown status
- Other service tests - Unknown status

---

## Root Cause Analysis

### Technical Details

**TypeScript Compilation Pattern**:
```typescript
// Source: src/parsers/manifest-parser.ts
export async function parse(skillMdPath: string): Promise<ISkillManifest> { ... }

// Compiled: dist/parsers/manifest-parser.js (CommonJS)
exports.parse = parse;  // Normal assignment

// But @swc/jest transforms imports to use getters:
var desc = { enumerable: true, get: function() { return m[k]; } };
Object.defineProperty(o, k2, desc);  // Non-configurable!
```

**Result**: Properties are **read-only getters**, preventing Jest from:
- Creating automatic mocks with `jest.mock()`
- Spying on functions with `jest.spyOn()` ("Cannot redefine property")
- Replacing implementations with `jest.mocked()`

### Configuration

**Jest Config** (`cli/jest.config.js`):
```javascript
transform: {
  '^.+\\.ts$': '@swc/jest'  // Rust-based transformer
}
```

**TypeScript Config** (`tsconfig.json`):
```json
{
  "module": "commonjs",  // Compiles to CommonJS
  "target": "ES2020"
}
```

**Combination**: TypeScript → CommonJS + @swc/jest transformer = **broken automocking**

---

## Investigation History

### Attempted Solutions (All Failed)

1. **jest.mocked() helper**
   - Error: `.mockResolvedValue is not a function`
   - Reason: Module not actually mocked, returns real function

2. **jest.spyOn() on modules**
   - Error: "Cannot redefine property: parse"
   - Reason: Getter-based property descriptors are non-configurable

3. **jest.restoreAllMocks() in beforeEach**
   - Error: "Cannot redefine property" persists
   - Reason: Doesn't remove non-configurable property descriptors

4. **Remove jest.mock() entirely**
   - Error: Tests try to execute real code (load tar module, etc.)
   - Reason: No mocking at all, tests run real implementations

5. **Manual factory functions**
   - Error: `jest.fn()` unavailable during hoisting
   - Reason: Factory functions run during module loading, before Jest context

6. **Module path corrections** (removed .js extensions)
   - Error: Same errors persist
   - Reason: Path wasn't the issue

7. **Debug test to verify mock structure**
   - **SUCCESS**: Confirmed jest.mock() doesn't create mocks
   - Finding: `Is jest.fn?: false` for all modules

8. **Compare with install-service.test.ts**
   - Finding: Identical pattern but 22 tests PASS
   - Mystery: Why does it work there?

9. **Create manual __mocks__/ files**
   - Created: 6 manual mock modules
   - Status: Needs location verification (tests/__mocks__/src vs src/__mocks__)

10. **Import pattern analysis**
    - Finding: publish-service.ts imports WITHOUT .js extensions
    - Change: Corrected test imports to match
    - Result: No impact on mocking issue

### Debug Test Results

```bash
# Created: cli/tests/debug-mock.test.ts
# Result: Confirmed jest.mock() doesn't create mocks

manifestParser: { parse: [Getter], validate: [Getter] }
manifestParser.parse: [AsyncFunction: parse]  # REAL function
typeof manifestParser.parse: function
Is jest.fn?: false  # NOT a mock!
```

**Conclusion**: Jest automocking is fundamentally broken for this codebase's module structure.

---

## Epic 10 Scope

### Primary Goal
Fix Jest automocking or migrate to alternative testing infrastructure that supports TypeScript + ES modules properly.

### Investigation Areas

1. **@swc/jest Configuration**
   - Research @swc/jest mocking behavior with TypeScript
   - Check for configuration options to enable automocking
   - Verify transformer compatibility with Jest mocking system

2. **Install-Service Success Pattern**
   - Debug why install-service.test.ts (22 tests) PASSES
   - Compare module loading between install-service and publish-service
   - Identify any differences that make mocking work

3. **Manual Mock System**
   - Verify correct `__mocks__/` directory location
   - Ensure manual mocks export jest.fn() properly
   - Test manual mocks with publish-service tests

4. **Vitest Migration** (Alternative)
   - Evaluate Vitest as Jest replacement
   - Vitest has native TypeScript + ES module support
   - Eliminates mocking issues entirely
   - Faster execution (Vite-powered)

### Success Criteria

- [ ] All publish-service tests PASS (24 unit + 15 integration)
- [ ] jest.mock() creates actual mocks (Is jest.fn?: true)
- [ ] No "Cannot redefine property" errors
- [ ] Mocking pattern documented and consistent across all tests
- [ ] Test execution time acceptable (< 5 seconds for unit tests)

---

## Options Analysis

### Option 1: Fix @swc/jest Mocking (Conservative)

**Pros**:
- Minimal code changes
- Keeps existing Jest infrastructure
- Team familiarity with Jest

**Cons**:
- May not be fixable (@swc/jest limitation)
- Could require complex workarounds
- Doesn't address getter-based property descriptors issue

**Effort**: 1-2 days
**Risk**: Medium (may not be solvable)

---

### Option 2: Migrate to Vitest (Recommended)

**Pros**:
- Native TypeScript + ES module support
- Faster execution (Vite-powered)
- Better mocking with native ES module handling
- Modern, actively maintained
- Compatible with Jest API (easy migration)

**Cons**:
- Requires updating test files
- Team learning curve (minimal - similar to Jest)
- New dependency

**Effort**: 2-3 days
**Risk**: Low (proven solution)

**Migration Path**:
1. Install Vitest: `npm install -D vitest @vitest/ui`
2. Update package.json test scripts
3. Migrate test files (minimal changes - Vitest is Jest-compatible)
4. Update CI/CD configuration

---

### Option 3: Manual Mocks for All Modules (Workaround)

**Pros**:
- No infrastructure changes
- Full control over mock behavior
- Keeps existing Jest setup

**Cons**:
- Labor-intensive (create mocks for 20+ modules)
- Maintenance overhead (update mocks when APIs change)
- Doesn't fix root cause

**Effort**: 3-4 days (initial), ongoing maintenance
**Risk**: Low (guaranteed to work)

---

### Option 4: Investigate Install-Service Success (Diagnostic)

**Pros**:
- May reveal simple fix
- Understanding helps inform other options
- Could be quick win

**Cons**:
- May not lead to solution
- Time investment without guaranteed outcome

**Effort**: 4-6 hours
**Risk**: Medium (may find nothing)

---

## Recommended Approach

### Phase 1: Quick Investigation (4-6 hours)
1. Debug why install-service.test.ts works
2. If simple fix found → apply to all tests
3. If not → proceed to Phase 2

### Phase 2: Vitest Migration (2-3 days)
1. Install and configure Vitest
2. Migrate 5-10 test files as pilot
3. Validate mocking works correctly
4. Migrate remaining tests
5. Update CI/CD pipeline
6. Document new testing patterns

### Phase 3: Cleanup (1 day)
1. Remove manual __mocks__/ files if no longer needed
2. Update test strategy documentation
3. Add mocking guidelines to coding standards
4. Training for team on Vitest patterns

**Total Effort**: 3-4 days
**Expected Outcome**: Modern, reliable test infrastructure with working mocks

---

## Manual Mocks Created (Interim Solution)

**Location**: `cli/tests/__mocks__/src/...` (may need to move to `cli/src/__mocks__/...`)

**Files Created** (2025-11-03):
1. `tests/__mocks__/src/parsers/manifest-parser.ts`
   - Exports: `parse`, `validate`

2. `tests/__mocks__/src/lib/bundler.ts`
   - Exports: `bundle`, `extract`, `detectSkillName`, `resolveInstallPath`, `validateBundle`, `checkDiskSpace`

3. `tests/__mocks__/src/lib/wallet-manager.ts`
   - Exports: `load`, `checkBalance`, `saveToKeychain`, `loadFromKeychain`

4. `tests/__mocks__/src/lib/skill-analyzer.ts`
   - Exports: `analyzeSkillDirectory`

5. `tests/__mocks__/src/clients/arweave-client.ts`
   - Exports: `uploadBundle`, `downloadBundle`, `checkTransactionStatus`, `pollConfirmation`

6. `tests/__mocks__/src/clients/ao-registry-client.ts`
   - Exports: `getSkill`, `registerSkill`, `updateSkill`, `searchSkills`, `recordDownload`

7. `src/__mocks__/fs.ts`
   - Exports: `promises` object with file system method mocks

**Status**: Created but not verified. Jest may not be finding them (needs __mocks__/ location fix).

---

## References

### Investigation Files
- Debug test: `cli/tests/debug-mock.test.ts` (created during investigation)
- Working test: `cli/tests/unit/lib/install-service.test.ts` (22 PASS - identical pattern)
- Failing tests: `cli/tests/unit/lib/publish-service.test.ts` (24 FAIL)
- Gate file: `docs/qa/gates/9.2-implement-turbo-sdk-upload-in-arweaveclient.yml`

### Related Stories
- Story 9.2: Implement Turbo SDK Upload (implementation COMPLETE)
- Story 9.3: Integration Testing (next step)
- Epic 8: Original test infrastructure setup

### Documentation
- Jest configuration: `cli/jest.config.js`
- TypeScript configuration: `cli/tsconfig.json`, `tsconfig.json`
- Test strategy: `docs/architecture/test-strategy-and-standards.md`

---

## Next Actions

### Immediate (Story Owner)
1. ✅ **Approve Story 9.2** to proceed to Story 9.3
2. 📋 **Create Epic 10 story** for Jest infrastructure investigation
3. ✅ **Move forward** with Story 9.3 integration testing

### Before Epic 9 Merge
1. ⚠️ **Resolve TEST-002** or document acceptable risk
2. ✅ **Ensure critical tests pass** (integration tests in Story 9.3 will help)
3. 📋 **Update test strategy** with mocking guidelines

### Epic 10 Sprint Planning
1. 🔍 **Investigate install-service success** (why do those tests pass?)
2. 📊 **Evaluate Vitest migration** (recommended path)
3. 🛠️ **Implement solution** (Vitest migration or @swc/jest fix)
4. ✅ **Verify all tests pass** with new infrastructure
5. 📝 **Document new patterns** for team

---

## Risk Assessment

**If NOT Fixed**:
- ❌ Cannot validate business logic with unit tests
- ❌ Regression risk increases (no test safety net)
- ❌ Development velocity decreases (manual testing required)
- ❌ Code review becomes primary quality gate (unsustainable)

**If Fixed**:
- ✅ Full test automation coverage
- ✅ Fast feedback loops for developers
- ✅ Confidence in refactoring and changes
- ✅ Modern test infrastructure (if Vitest chosen)

**Current Workaround**:
- Manual code review for Story 9.2 (completed successfully)
- Integration tests in Story 9.3 will provide validation
- Manual mocks created (needs verification)

---

## Attachments

### Debug Test Code

```typescript
// cli/tests/debug-mock.test.ts
import { describe, it, expect, jest } from '@jest/globals';

jest.mock('../src/parsers/manifest-parser');
import * as manifestParser from '../src/parsers/manifest-parser';

describe('Debug Mock Test', () => {
  it('should verify mock structure', () => {
    console.log('manifestParser:', manifestParser);
    // Output: { parse: [Getter], validate: [Getter] }

    console.log('manifestParser.parse:', manifestParser.parse);
    // Output: [AsyncFunction: parse]  ❌ Real function, not mock

    console.log('Is jest.fn?:', jest.isMockFunction(manifestParser.parse));
    // Output: false  ❌ Not a Jest mock

    // Attempt to configure mock
    (manifestParser.parse as jest.Mock).mockResolvedValue({ name: 'test' });
    // Error: _manifestparser.parse.mockResolvedValue is not a function  ❌
  });
});
```

### Compiled Module Structure

```javascript
// dist/parsers/manifest-parser.js (TypeScript output)
"use strict";

// Getter-based property descriptors (NON-CONFIGURABLE)
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };  // ⚠️ GETTER
    }
    Object.defineProperty(o, k2, desc);  // ⚠️ NON-CONFIGURABLE
}) : ...);

// ... module code ...

exports.parse = parse;  // Normal export (but gets wrapped with getters)
exports.validate = validate;
```

### Investigation Timeline

| Time | Action | Result |
|------|--------|--------|
| 18:55 | Cleared Jest cache | ✅ TEST-001 fixed (url-validator: 27 PASS) |
| 18:58 | Tried `jest.mocked()` | ❌ `.mockResolvedValue is not a function` |
| 19:02 | Tried `jest.spyOn()` | ❌ "Cannot redefine property: parse" |
| 19:05 | Added `jest.restoreAllMocks()` | ❌ Error persists |
| 19:10 | Removed `jest.mock()` calls | ❌ Tests try to execute real code |
| 19:15 | Created debug test | ✅ **CONFIRMED: jest.mock() broken** |
| 19:20 | Compared with install-service | 🤔 Mystery: identical pattern PASSES |
| 19:25 | Corrected import paths | ❌ No impact |
| 19:30 | Created manual mocks | ⏳ Needs verification |
| 19:40 | **CONCLUSION** | Jest automocking fundamentally broken |

---

## Vitest Migration Guide (Recommended Solution)

### Why Vitest?

1. **Native ES Module Support**: No getter-based descriptor issues
2. **Faster Execution**: Vite-powered, parallel test execution
3. **Better TypeScript Integration**: First-class TypeScript support
4. **Jest-Compatible API**: Minimal migration effort
5. **Modern Tooling**: Active development, growing ecosystem

### Migration Steps

**Step 1: Install Vitest**
```bash
npm install -D vitest @vitest/ui c8
```

**Step 2: Update package.json**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

**Step 3: Create vitest.config.ts**
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/index.ts']
    }
  }
});
```

**Step 4: Update Test Imports** (minimal changes)
```typescript
// Before (Jest)
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// After (Vitest)
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock pattern (same as Jest!)
vi.mock('../../../src/parsers/manifest-parser');
```

**Step 5: Update Mocking Syntax**
```typescript
// Before (Jest - doesn't work)
(manifestParser.parse as jest.Mock).mockResolvedValue(mockManifest);

// After (Vitest - works!)
vi.mocked(manifestParser.parse).mockResolvedValue(mockManifest);
```

**Step 6: Run Tests**
```bash
npm test  # Vitest runs automatically
```

### Migration Effort Breakdown

| Task | Effort | Priority |
|------|--------|----------|
| Install Vitest + config | 1 hour | Critical |
| Migrate 5 pilot test files | 2 hours | High |
| Validate pilot success | 1 hour | High |
| Migrate remaining tests | 4-6 hours | High |
| Update CI/CD pipeline | 2 hours | Medium |
| Documentation updates | 2 hours | Medium |
| **Total** | **12-14 hours (2 days)** | |

---

## Workarounds (Interim)

### Option A: Skip Failing Tests
```typescript
describe.skip('PublishService', () => {
  // Tests skipped until Epic 10 resolved
});
```

**Pros**: Quick, unblocks Story 9.2
**Cons**: No automated validation, regression risk

### Option B: Manual Code Review Only
- Continue with code review validation
- Use Story 9.3 integration tests for real-world validation
- Document test coverage gaps

**Pros**: Already done for Story 9.2, high confidence
**Cons**: Not scalable long-term

### Option C: Manual Mocks (Created)
- Use the 6 manual mock files created during investigation
- Fix __mocks__/ location if needed
- Test and verify they work

**Pros**: Preserves Jest infrastructure
**Cons**: Maintenance overhead, doesn't fix root cause

---

## Success Metrics

**Epic 10 Completion Criteria**:
1. ✅ All blocked tests PASS (75+ tests)
2. ✅ jest.mock() or vi.mock() creates actual mocks
3. ✅ No "Cannot redefine property" errors
4. ✅ Test execution time < 5 seconds for unit tests
5. ✅ Mocking pattern documented in test strategy
6. ✅ Team trained on new patterns (if Vitest)

**Validation**:
- Run full test suite: `npm test`
- All tests PASS (target: 150+ tests)
- No warnings or errors
- CI/CD pipeline GREEN

---

## Contact

**Issue Owner**: Architecture Team
**Discovered By**: Quinn (Test Architect) during Story 9.2 QA review
**Date**: 2025-11-03
**Priority**: HIGH (blocks test automation)
**Epic**: Epic 10 (to be created)

---

**Last Updated**: 2025-11-03
**Status**: Documented, awaiting Epic 10 story creation
**Next Review**: Before Epic 9 merge to main

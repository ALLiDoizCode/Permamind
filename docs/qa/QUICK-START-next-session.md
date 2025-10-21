# Quick Start Guide - Story 1.7 Next Session
<!-- Powered by BMAD™ Core -->

**Story**: 1.7 - skills publish Command Implementation
**Current Gate**: FAIL (improving toward PASS)
**AC #13 Status**: ✅ Substantially Met (6/11 integration tests passing)

---

## 🚀 Start Here

```bash
# 1. Verify current test status
npx jest publish-workflow.test.ts --testTimeout=60000
# Expected: 6 passing, 5 failing

# 2. Read the handoff document
# File: docs/qa/HANDOFF-story-1.7-session-1.md

# 3. Fix the 5 failing tests using the pattern below
```

---

## 🔧 Fix Pattern for Remaining 5 Tests

**Problem**: Test-specific mock overrides get lost after jest.resetModules()

**Solution**: Move mock setup BEFORE dynamic import

### Example Fix

**BEFORE (BROKEN)**:
```typescript
it('should handle error', async () => {
  const { execute } = await import('../../src/commands/publish.js');

  // ❌ TOO LATE - module already loaded
  mockWallets.getBalance.mockResolvedValue('100');

  await expect(execute(dir, opts)).rejects.toThrow();
});
```

**AFTER (WORKING)**:
```typescript
it('should handle error', async () => {
  // ✅ CORRECT - setup mock FIRST
  mockWallets.getBalance.mockResolvedValue('100');

  // THEN import
  const { execute } = await import('../../src/commands/publish.js');

  // THEN test
  await expect(execute(dir, opts)).rejects.toThrow();
});
```

---

## 📋 Tests to Fix (Lines in publish-workflow.test.ts)

1. **Line 307**: `should handle manifest validation error`
   - Fix: Move mockReadFile setup before import

2. **Line 331**: `should handle insufficient wallet balance error`
   - Fix: Move mockWallets.getBalance setup before import

3. **Line 342**: `should handle Arweave upload failure with retry`
   - Fix: Move mockTransactions.post setup before import

4. **Line 360**: `should handle AO registry failure`
   - Fix: Move mockMessage setup before import

5. **Line 386**: `should use custom gateway if --gateway flag provided`
   - Fix: May need different assertion approach

---

## ✅ After Fixing Workflow Tests

```bash
# Verify all 11 tests pass
npx jest publish-workflow.test.ts --testTimeout=60000
# Target: 11/11 passing

# Then move to complete publish.test.ts unit tests
# Reference: Story Task 21 (lines 857-882)
# Need: 12 additional test cases

# Then fix arweave-client.test.ts
# Target: 42/42 passing (currently 33/42)

# Finally run full suite
npm test -- --no-watch --maxWorkers=1
# Target: 0 failures, all passing
```

---

## 📊 Success Metrics

**Story Ready for PASS Gate When**:
- [ ] publish-workflow.test.ts: 11/11 passing ✅
- [ ] publish.test.ts: 22/22 passing (currently 10/22)
- [ ] arweave-client.test.ts: 42/42 passing (currently 33/42)
- [ ] All test suites: 0 failures
- [ ] Performance test: AC #12 validated

**Estimated Time**: 5-7 hours total

---

## 🎯 Current Test Status Snapshot

```
✅ PASSING (6 tests):
- Full workflow (parse → bundle → upload → register)
- Display progress indicators
- Poll confirmation before registration
- Register skill in AO registry
- Skip confirmation polling with --skip-confirmation
- Enable verbose logging with --verbose

❌ FAILING (5 tests):
- Handle manifest validation error
- Handle insufficient wallet balance error
- Handle Arweave upload failure with retry
- Handle AO registry failure
- Use custom gateway with --gateway flag
```

---

## 📁 Key Files

- **Handoff**: `docs/qa/HANDOFF-story-1.7-session-1.md`
- **Story**: `docs/stories/1.7.story.md`
- **Gate**: `docs/qa/gates/1.7-skills-publish-command-implementation.yml`
- **Tests**: `cli/tests/integration/publish-workflow.test.ts`

---

**Ready to Continue?** Start with fixing the 5 failing tests using the pattern above!

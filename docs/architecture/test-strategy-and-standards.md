# Test Strategy and Standards

## Testing Philosophy

**Approach:** Test-Driven Development (TDD) Principles
- **For Humans:** Full RED-GREEN-REFACTOR cycle
- **For AI Agents:** Test-first implementation (generate comprehensive tests before code)

**Coverage Goals:**
- Unit tests: 100% coverage (guaranteed by TDD)
- Integration tests: 100% happy paths + error scenarios
- E2E flows: Full ecosystem loop

**Test Pyramid:**
```
     /\
    /E2E\         5%
   /------\
  /Integr.\      25%
 /----------\
/   Unit     \   70%
--------------
```

## Test Types and Organization

**Unit Tests:**
- Framework: Jest 29.7.0 with ts-jest
- Convention: `*.test.ts` matching source
- Location: `cli/tests/unit/` mirrors `cli/src/`
- Mocking: Jest built-in
- Coverage: >100% for TDD compliance

**Integration Tests:**
- Scope: Multi-component interactions
- Location: `cli/tests/integration/`
- Infrastructure:
  - MockArweaveClient for Arweave SDK
  - Mock @permaweb/aoconnect responses
  - aolite for AO process testing

**E2E Tests:**
- Full workflows with mocked environment
- Publish → Search → Install validation

## TDD Workflow

**AI Agents:**
1. Analyze acceptance criteria
2. Generate comprehensive test suite
3. Generate implementation
4. Provide validation instructions

**Humans:**
1. RED: Write failing test
2. GREEN: Minimal implementation
3. REFACTOR: Improve code
4. REPEAT

## Test Scripts

```json
{
  "test": "jest --watch",
  "test:once": "jest",
  "test:unit": "jest --testPathPattern=tests/unit --watch",
  "test:integration": "jest --testPathPattern=tests/integration",
  "test:coverage": "jest --coverage --coverageThreshold='{\"global\":{\"lines\":100}}'",
  "test:ao": "cd ao-process && lua tests/run-all.lua",
  "tdd": "jest --watch --verbose"
}
```

---

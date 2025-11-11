# Integration Tests

This directory contains integration tests for the Agent Skills Registry CLI and MCP server, verifying end-to-end workflows and cross-tool compatibility.

## Test Organization

```
cli/tests/integration/
├── README.md                                    # This file
├── cross-compatibility.integration.test.ts      # CLI ↔ MCP compatibility tests
├── publish-service.integration.test.ts          # PublishService workflows
├── search-service.integration.test.ts           # SearchService workflows
├── install-service.integration.test.ts          # InstallService workflows
├── wallet-factory.integration.test.ts           # Wallet generation workflows
├── wallet-manager-seed-phrase.integration.test.ts
├── publish-workflow.test.ts
├── install-workflow.test.ts
├── search-command.test.ts
├── ao-registry-client.test.ts
├── arweave-upload.test.ts
├── arweave-download.test.ts
├── lock-file-workflow.test.ts
└── [other integration tests...]
```

## Cross-Compatibility Tests

**File**: `cross-compatibility.integration.test.ts`
**Story**: 8.10 - Cross-Compatibility Integration Tests
**Purpose**: Verify that CLI and MCP server tools are fully compatible

### Test Scenarios

1. **Wallet Type Compatibility** (2 tests)
   - Deterministic wallet generation from seed phrases
   - Different seed phrases produce different wallets
   - Validates BIP39 mnemonic → JWK → Arweave address workflow

2. **Lock File Compatibility** (2 tests)
   - JSON schema validation for `skills-lock.json`
   - Rejection of invalid lock file structures
   - Ensures CLI and MCP produce identical lock file formats

3. **Search Service Cross-Compatibility** (1 test)
   - Skills published by CLI are discoverable by MCP
   - Skills published by MCP are discoverable by CLI
   - Validates shared SearchService behavior

4. **Bundle Format Compatibility** (1 test)
   - CLI and MCP produce identical bundle formats
   - Wallet type doesn't affect bundle creation

5. **Error Handling Cross-Compatibility** (3 tests)
   - Graceful handling of missing skills
   - Network error handling
   - Corrupted lock file validation

6. **Environment Isolation** (1 test)
   - Test environment doesn't interfere with user configuration
   - Proper cleanup after tests

7. **Dependency Resolution** (1 test)
   - Dependencies parsed correctly regardless of source tool
   - Cross-tool dependency resolution

### Running Cross-Compatibility Tests

```bash
# Run cross-compatibility tests only
npm run test:once -- cli/tests/integration/cross-compatibility.integration.test.ts

# Run with verbose output
npm run test:once -- cli/tests/integration/cross-compatibility.integration.test.ts --verbose

# Run with coverage
npm run test:coverage -- cli/tests/integration/cross-compatibility.integration.test.ts
```

**Note**: These tests require a 60-second timeout due to RSA key generation for seed phrase wallets.

## Test Infrastructure

### Helper Files

#### `cli/tests/helpers/mock-arweave-client.ts`

Mock Arweave client for integration testing without network calls.

```typescript
import { MockArweaveClient } from '../helpers/mock-arweave-client';

const mockArweave = new MockArweaveClient();

// Upload mock transaction
const txId = await mockArweave.upload(buffer, tags);

// Download mock transaction
const data = await mockArweave.download(txId);

// Clear storage between tests
mockArweave.clear();
```

**Features**:
- In-memory storage for transactions
- Deterministic transaction ID generation
- Mock signing, status checking, and balance queries
- No actual network calls

#### `cli/tests/helpers/schema-validator.ts`

JSON schema validator for lock files.

```typescript
import { validateSkillsLock, validateSkillsLockFile } from '../helpers/schema-validator';

// Validate lock file data
const result = validateSkillsLock(lockFileData);

// Validate lock file from path
const result2 = validateSkillsLockFile('/path/to/skills-lock.json');

if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

**Features**:
- Validates against `cli/src/schemas/skills-lock.schema.json`
- Uses AJV (Already JSON Schema) for validation
- Provides detailed error messages with field paths

### Test Fixtures

Located in `cli/tests/fixtures/`:

#### `test-skill-simple/`
- Minimal test skill with no dependencies
- Used for basic publish/search/install workflows
- Contains: `SKILL.md`, `example.txt`

#### `test-skill-dependency/`
- Dependency skill for testing resolution
- Used as a dependency of `test-skill-with-deps`
- Contains: `SKILL.md`, `dependency-helper.txt`

#### `test-skill-with-deps/`
- Skill with dependencies for complex workflows
- Depends on `test-skill-dependency`
- Contains: `SKILL.md`, `main.txt`

## Test Data

### Test Seed Phrases

```typescript
// Primary test mnemonic (deterministic wallet generation)
const TEST_SEED_PHRASE = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

// Alternative test mnemonic (different wallet)
const ALT_SEED_PHRASE = 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong';
```

**Note**: These are valid BIP39 mnemonics used exclusively for testing. Never use these in production.

### Mock Transaction IDs

```typescript
// Valid 43-character Arweave transaction ID format
const MOCK_TX_ID = 'abc123def456ghi789jkl012mno345pqr678stu9012';
```

## Best Practices

### 1. Environment Isolation

Always backup and restore environment variables:

```typescript
let originalEnv: NodeJS.ProcessEnv;

beforeEach(() => {
  originalEnv = { ...process.env };
  process.env.TEST_VAR = 'test_value';
});

afterEach(() => {
  process.env = originalEnv;
});
```

### 2. Temporary Directories

Use unique temp directories and clean up:

```typescript
let testDir: string;

beforeEach(async () => {
  testDir = path.join(os.tmpdir(), `test-${Date.now()}`);
  await fs.mkdir(testDir, { recursive: true });
});

afterEach(async () => {
  await fs.rm(testDir, { recursive: true, force: true });
});
```

### 3. Mock Management

Clear mocks between tests:

```typescript
beforeEach(() => {
  jest.clearAllMocks();
  mockArweave.clear();
});
```

### 4. Test Timeouts

Use appropriate timeouts for expensive operations:

```typescript
it('should generate wallet from seed phrase', async () => {
  // RSA key generation is slow
  const jwk = await WalletFactory.fromSeedPhrase(TEST_SEED_PHRASE);
  expect(jwk).toBeDefined();
}, 60000); // 60-second timeout
```

## Troubleshooting

### Common Test Failures

#### 1. `JWKValidationError: Generated JWK failed Arweave SDK validation`

**Cause**: Arweave SDK is mocked, preventing real JWK validation.

**Solution**: Remove `jest.mock('arweave')` from the test file. The real Arweave SDK is needed for wallet address derivation.

#### 2. `TypeError: query.trim is not a function`

**Cause**: SearchService.search() expects a string query, not an object.

**Solution**: Pass query as a string:
```typescript
// ✗ Incorrect
await searchService.search({ query: 'test' });

// ✓ Correct
await searchService.search('test');
```

#### 3. Lock file validation errors

**Cause**: Invalid arweaveTxId format (must be exactly 43 characters).

**Solution**: Ensure test transaction IDs match the pattern `^[a-zA-Z0-9_-]{43}$`:
```typescript
arweaveTxId: 'abc123def456ghi789jkl012mno345pqr678stu9012' // Exactly 43 chars
```

#### 4. Test timeout errors

**Cause**: RSA key generation takes time.

**Solution**: Increase test timeout to 60 seconds for wallet tests:
```typescript
it('wallet test', async () => { /* ... */ }, 60000);
```

## Performance Targets

- **Cross-compatibility suite**: < 1 second (all 11 tests)
- **Individual wallet test**: < 100ms (with mocks)
- **Full integration test**: < 60 seconds (with real crypto)
- **Lock file validation**: < 20ms

## Coverage

Current test coverage for cross-compatibility:
- **Tests**: 11 passing
- **Scenarios**: 100% of acceptance criteria covered
- **Error cases**: 3 error handling scenarios
- **Wallet types**: File-based and seed phrase wallets

## Related Documentation

- [Story 8.10](../../docs/stories/8.10.story.md) - Cross-Compatibility Integration Tests
- [Architecture: Test Strategy](../../docs/architecture/test-strategy-and-standards.md)
- [CLI README](../../README.md)
- [MCP Server README](../../../mcp-server/README.md)

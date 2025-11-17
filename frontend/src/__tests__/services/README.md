# Service Layer Tests

## Migration Note (Story 15.3)

The `ao-registry.test.ts` file has been removed and replaced with more comprehensive testing:

1. **Unit Tests**: `frontend/src/__tests__/lib/ao-registry-client.test.ts`
   - Tests the AORegistryClient class directly
   - Covers all HTTP methods, error handling, retry logic, and fallback patterns
   - 15 tests passing (100% coverage of client logic)

2. **Integration Tests**: `frontend/src/__tests__/integration/search.test.tsx`
   - Tests the complete search UI workflow
   - Tests the service layer integration with AORegistryClient
   - Tests user interactions, loading states, error states, and pagination
   - Uses React Testing Library for realistic component testing

3. **Real Integration Tests**: `frontend/src/__tests__/integration/ao-registry.test.tsx`
   - Tests actual AO registry connections (skipped in CI/CD)
   - Tests network failures, retry logic, and error recovery

## Test Coverage

The service layer (`frontend/src/services/ao-registry.ts`) is tested through:

- **Direct client testing**: Unit tests verify AORegistryClient behavior
- **Integration testing**: Search UI tests verify service layer behavior
- **End-to-end testing**: Playwright tests verify complete user flows

This approach provides better coverage than the previous mock-heavy service tests.

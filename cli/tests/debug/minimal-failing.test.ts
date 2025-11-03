/**
 * Minimal reproduction: FAILING pattern (publish-service)
 * Demonstrates jest.mock('fs') + destructured import failure
 */

import { promises as fs } from 'fs'; // FAILING: Destructured import

jest.mock('fs'); // Mocks entire 'fs' module

describe('Minimal Failing Pattern', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // This will FAIL: fs is undefined after jest.mock('fs')
    console.log('fs value:', fs);
    console.log('fs type:', typeof fs);

    // Attempt to spy will fail
    jest.spyOn(fs, 'stat').mockResolvedValue({
      isDirectory: () => true,
    } as any);
  });

  it('should fail with "Cannot use spyOn on primitive value"', async () => {
    expect(true).toBe(true);
  });
});

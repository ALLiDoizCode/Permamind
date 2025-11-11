/**
 * Minimal reproduction: PASSING pattern (install-service)
 * Demonstrates jest.mock('fs/promises') + namespace import success
 */

import * as fs from 'fs/promises'; // PASSING: Namespace import

jest.mock('fs/promises'); // Mocks 'fs/promises' module directly

describe('Minimal Passing Pattern', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // This WORKS: fs is a proper mock object
    console.log('fs value:', fs);
    console.log('fs type:', typeof fs);

    // Spy works correctly
    (fs.stat as jest.Mock).mockResolvedValue({
      isDirectory: () => true,
    } as any);
  });

  it('should pass with proper fs mock', async () => {
    expect(true).toBe(true);
  });
});

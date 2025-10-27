import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  resolvePrimaryName,
  clearCache,
  _resetArioClient,
} from '@/lib/arns-resolver';
import { ARIO } from '@ar.io/sdk/web';

// Mock AR.IO SDK
vi.mock('@ar.io/sdk/web', () => ({
  ARIO: {
    mainnet: vi.fn(() => ({
      getPrimaryName: vi.fn(),
    })),
  },
}));

describe('resolvePrimaryName', () => {
  let mockGetPrimaryName: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Clear cache and reset client before each test
    clearCache();
    _resetArioClient();

    // Setup the mock to return a fresh mock function
    mockGetPrimaryName = vi.fn();
    vi.mocked(ARIO.mainnet).mockReturnValue({
      getPrimaryName: mockGetPrimaryName,
    } as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should resolve an address to its primary name', async () => {
    const testAddress = 'OU48aJtcq3KjsEqSUWDVpynh1xP2Y1VI-bwiSukAktU';
    const expectedName = 'jonniesparkles';

    mockGetPrimaryName.mockResolvedValue({
      name: expectedName,
      owner: testAddress,
    });

    const result = await resolvePrimaryName(testAddress);

    expect(result).toBe(expectedName);
    expect(mockGetPrimaryName).toHaveBeenCalledWith({ address: testAddress });
    expect(mockGetPrimaryName).toHaveBeenCalledTimes(1);
  });

  it('should return null when address has no primary name', async () => {
    const testAddress = 'OU48aJtcq3KjsEqSUWDVpynh1xP2Y1VI-bwiSukAktU';

    mockGetPrimaryName.mockResolvedValue(null);

    const result = await resolvePrimaryName(testAddress);

    expect(result).toBeNull();
    expect(mockGetPrimaryName).toHaveBeenCalledWith({ address: testAddress });
  });

  it('should cache successful resolutions', async () => {
    const testAddress = 'OU48aJtcq3KjsEqSUWDVpynh1xP2Y1VI-bwiSukAktU';
    const expectedName = 'jonniesparkles';

    mockGetPrimaryName.mockResolvedValue({
      name: expectedName,
      owner: testAddress,
    });

    // First call
    const result1 = await resolvePrimaryName(testAddress);
    expect(result1).toBe(expectedName);

    // Second call - should use cache
    const result2 = await resolvePrimaryName(testAddress);
    expect(result2).toBe(expectedName);

    // SDK should only be called once
    expect(mockGetPrimaryName).toHaveBeenCalledTimes(1);
  });

  it('should cache failed resolutions (null)', async () => {
    const testAddress = 'OU48aJtcq3KjsEqSUWDVpynh1xP2Y1VI-bwiSukAktU';

    mockGetPrimaryName.mockResolvedValue(null);

    // First call
    const result1 = await resolvePrimaryName(testAddress);
    expect(result1).toBeNull();

    // Second call - should use cache
    const result2 = await resolvePrimaryName(testAddress);
    expect(result2).toBeNull();

    // SDK should only be called once
    expect(mockGetPrimaryName).toHaveBeenCalledTimes(1);
  });

  it('should timeout after 2 seconds and return null', async () => {
    const testAddress = 'OU48aJtcq3KjsEqSUWDVpynh1xP2Y1VI-bwiSukAktU';

    // Mock a slow response (3 seconds)
    mockGetPrimaryName.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ name: 'slow' }), 3000)
        )
    );

    const result = await resolvePrimaryName(testAddress);

    expect(result).toBeNull();
  });

  it('should handle SDK errors gracefully', async () => {
    const testAddress = 'OU48aJtcq3KjsEqSUWDVpynh1xP2Y1VI-bwiSukAktU';

    mockGetPrimaryName.mockRejectedValue(new Error('Network error'));

    const result = await resolvePrimaryName(testAddress);

    expect(result).toBeNull();
  });

  it('should return null for invalid address format (not 43 chars)', async () => {
    const invalidAddress = 'short';

    const result = await resolvePrimaryName(invalidAddress);

    expect(result).toBeNull();
    // SDK should never be called for invalid addresses
    expect(mockGetPrimaryName).not.toHaveBeenCalled();
  });

  it('should return null for empty address', async () => {
    const result = await resolvePrimaryName('');

    expect(result).toBeNull();
    expect(mockGetPrimaryName).not.toHaveBeenCalled();
  });

  it('should handle different addresses independently', async () => {
    const address1 = 'OU48aJtcq3KjsEqSUWDVpynh1xP2Y1VI-bwiSukAktU';
    const address2 = 'XYZ_aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890ABC';

    // Mock based on the input address parameter
    mockGetPrimaryName.mockImplementation(
      async ({ address }: { address: string }) => {
        if (address === address1) return { name: 'user1', owner: address1 };
        if (address === address2) return { name: 'user2', owner: address2 };
        return null;
      }
    );

    const result1 = await resolvePrimaryName(address1);
    const result2 = await resolvePrimaryName(address2);

    expect(result1).toBe('user1');
    expect(result2).toBe('user2');
    expect(mockGetPrimaryName).toHaveBeenCalledTimes(2);
  });
});

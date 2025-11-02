import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useArnsName } from '@/hooks/useArnsName';
import * as arnsResolver from '@/lib/arns-resolver';

// Mock the arns-resolver module
vi.mock('@/lib/arns-resolver', () => ({
  resolvePrimaryName: vi.fn(),
  clearCache: vi.fn(),
}));

describe('useArnsName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with null arnsName and loading true', () => {
    vi.mocked(arnsResolver.resolvePrimaryName).mockResolvedValue('testuser');

    const { result } = renderHook(() =>
      useArnsName('OU48aJtcq3KjsEqSUWDVpynh1xP2Y1VI-bwiSukAktU')
    );

    // Initially, loading should be true since useEffect runs async
    expect(result.current.arnsName).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should resolve ArNS name for valid address', async () => {
    const testAddress = 'OU48aJtcq3KjsEqSUWDVpynh1xP2Y1VI-bwiSukAktU';
    const expectedName = 'jonniesparkles';

    vi.mocked(arnsResolver.resolvePrimaryName).mockResolvedValue(expectedName);

    const { result } = renderHook(() => useArnsName(testAddress));

    await waitFor(() => {
      expect(result.current.arnsName).toBe(expectedName);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(arnsResolver.resolvePrimaryName).toHaveBeenCalledWith(testAddress);
  });

  it('should handle null result when no primary name exists', async () => {
    const testAddress = 'OU48aJtcq3KjsEqSUWDVpynh1xP2Y1VI-bwiSukAktU';

    vi.mocked(arnsResolver.resolvePrimaryName).mockResolvedValue(null);

    const { result } = renderHook(() => useArnsName(testAddress));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.arnsName).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should handle errors gracefully', async () => {
    const testAddress = 'OU48aJtcq3KjsEqSUWDVpynh1xP2Y1VI-bwiSukAktU';
    const testError = new Error('Network error');

    vi.mocked(arnsResolver.resolvePrimaryName).mockRejectedValue(testError);

    const { result } = renderHook(() => useArnsName(testAddress));

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.arnsName).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error?.message).toBe('Network error');
  });

  it('should not call resolver for empty address', async () => {
    const { result } = renderHook(() => useArnsName(''));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.arnsName).toBeNull();
    expect(arnsResolver.resolvePrimaryName).not.toHaveBeenCalled();
  });

  it('should not call resolver for invalid address (not 43 chars)', async () => {
    const { result } = renderHook(() => useArnsName('invalid'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.arnsName).toBeNull();
    expect(arnsResolver.resolvePrimaryName).not.toHaveBeenCalled();
  });

  it('should reset state when address changes', async () => {
    const address1 = 'OU48aJtcq3KjsEqSUWDVpynh1xP2Y1VI-bwiSukAktU';
    const address2 = 'XYZ_aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890ABC';

    vi.mocked(arnsResolver.resolvePrimaryName).mockImplementation(
      async (address) => {
        if (address === address1) return 'user1';
        if (address === address2) return 'user2';
        return null;
      }
    );

    const { result, rerender } = renderHook(
      ({ address }) => useArnsName(address),
      { initialProps: { address: address1 } }
    );

    await waitFor(() => {
      expect(result.current.arnsName).toBe('user1');
    });

    // Change address
    rerender({ address: address2 });

    await waitFor(() => {
      expect(result.current.arnsName).toBe('user2');
    });

    expect(arnsResolver.resolvePrimaryName).toHaveBeenCalledTimes(2);
  });

  it('should set loading to true while resolving', async () => {
    const testAddress = 'OU48aJtcq3KjsEqSUWDVpynh1xP2Y1VI-bwiSukAktU';
    let resolvePromise: (value: string | null) => void;

    const promise = new Promise<string | null>((resolve) => {
      resolvePromise = resolve;
    });

    vi.mocked(arnsResolver.resolvePrimaryName).mockReturnValue(promise);

    const { result } = renderHook(() => useArnsName(testAddress));

    // Initially loading should be true
    expect(result.current.loading).toBe(true);

    // Resolve the promise
    resolvePromise!('testuser');

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});

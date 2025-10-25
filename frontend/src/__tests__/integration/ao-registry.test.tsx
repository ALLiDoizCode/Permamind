import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listSkills, searchSkills, getSkill } from '@/services/ao-registry';
import * as aoClient from '@/lib/ao-client';

/**
 * Integration Tests for AO Registry
 *
 * These tests verify integration with the real AO registry process.
 * By default, they are SKIPPED to avoid network dependencies in CI/CD.
 *
 * To run these tests:
 * - Set SKIP_INTEGRATION_TESTS=false
 * - Or remove the environment variable entirely
 *
 * Example: SKIP_INTEGRATION_TESTS=false npm test -- integration
 */

// Check if integration tests should be skipped (default: true for CI/CD)
const SKIP_TESTS =
  process.env.SKIP_INTEGRATION_TESTS === undefined ||
  process.env.SKIP_INTEGRATION_TESTS === 'true';

describe('AO Registry Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Real AO Registry Connection', () => {
    it.skipIf(SKIP_TESTS)(
      'should fetch skills from real AO registry via dryrun',
      { timeout: 65000 },
      async () => {
        // Call real AO registry
        const result = await listSkills({ limit: 3, offset: 0 });

        // Verify response structure
        expect(result).toBeDefined();
        expect(result.skills).toBeInstanceOf(Array);
        expect(result.total).toBeGreaterThanOrEqual(0);
        expect(result.limit).toBe(3);
        expect(result.offset).toBe(0);

        // If skills exist, verify structure
        if (result.skills.length > 0) {
          const skill = result.skills[0];
          expect(skill.name).toBeDefined();
          expect(skill.version).toBeDefined();
          expect(skill.author).toBeDefined();
          expect(skill.arweaveTxId).toBeDefined();
        }
      }
    );

    it('should handle network timeout gracefully', async () => {
      // Mock dryrun to simulate timeout
      const dryrunSpy = vi
        .spyOn(aoClient, 'dryrun')
        .mockRejectedValueOnce(new Error('Network timeout after 45 seconds'));

      await expect(listSkills({ limit: 1 })).rejects.toThrow('Network timeout');

      dryrunSpy.mockRestore();
    });

    it('should handle HTML error response from CU', async () => {
      // Mock HTML error response
      const dryrunSpy = vi
        .spyOn(aoClient, 'dryrun')
        .mockRejectedValueOnce(
          new Error('Received HTML error response instead of JSON')
        );

      await expect(listSkills({ limit: 1 })).rejects.toThrow();

      dryrunSpy.mockRestore();
    });

    it('should handle malformed JSON response', async () => {
      // Mock malformed JSON
      const dryrunSpy = vi.spyOn(aoClient, 'dryrun').mockResolvedValueOnce({
        Messages: [
          {
            Data: 'invalid json{',
            Tags: [],
          },
        ],
      } as any);

      await expect(listSkills({ limit: 1 })).rejects.toThrow();

      dryrunSpy.mockRestore();
    });

    it('should handle empty Messages array', async () => {
      // Mock empty Messages
      const dryrunSpy = vi.spyOn(aoClient, 'dryrun').mockResolvedValueOnce({
        Messages: [],
      } as any);

      await expect(listSkills({ limit: 1 })).rejects.toThrow(
        'No response from registry process'
      );

      dryrunSpy.mockRestore();
    });
  });

  describe('Search Functionality', () => {
    it.skipIf(SKIP_TESTS)(
      'should search skills by query',
      { timeout: 65000 },
      async () => {
        const result = await searchSkills('ao');
        expect(result).toBeInstanceOf(Array);

        // Should find at least one skill with 'ao' in name or description
        if (result.length > 0) {
          const hasAoMatch = result.some(
            (skill) =>
              skill.name.toLowerCase().includes('ao') ||
              skill.description.toLowerCase().includes('ao')
          );
          expect(hasAoMatch).toBe(true);
        }
      }
    );
  });

  describe('Single Skill Fetch', () => {
    it.skipIf(SKIP_TESTS)(
      'should fetch specific skill by name',
      { timeout: 65000 },
      async () => {
        // First get list of skills to find a valid name
        const skills = await listSkills({ limit: 1 });
        if (skills.skills.length === 0) {
          // No skills in registry, skip test
          return;
        }

        const skillName = skills.skills[0].name;
        const skill = await getSkill(skillName);

        expect(skill).toBeDefined();
        expect(skill.name).toBe(skillName);
        expect(skill.version).toBeDefined();
      }
    );
  });

  describe('Error Recovery and Retry Logic', () => {
    it('should implement exponential backoff on retries', async () => {
      // This test verifies the retry logic is implemented
      // Actual retry behavior is tested in the service layer unit tests
      // Here we just verify the function exists and handles errors
      const dryrunSpy = vi
        .spyOn(aoClient, 'dryrun')
        .mockRejectedValue(new Error('Network error'));

      await expect(listSkills({ limit: 1 })).rejects.toThrow('Network error');

      // Verify dryrun was called (retry logic happens in service layer)
      expect(dryrunSpy).toHaveBeenCalled();

      dryrunSpy.mockRestore();
    });
  });

  describe('Data Validation', () => {
    it('should validate and parse skill metadata correctly', async () => {
      const mockSkill = {
        name: 'test-skill',
        version: '1.0.0',
        description: 'Test description',
        author: 'Test Author',
        owner: 'test-owner-43-chars-long-arweave-address',
        tags: ['test'],
        dependencies: [],
        arweaveTxId: 'test-tx-id-43-chars-long-arweave-txid-12',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      const dryrunSpy = vi.spyOn(aoClient, 'dryrun').mockResolvedValueOnce({
        Messages: [
          {
            Data: JSON.stringify({
              skills: [mockSkill],
              total: 1,
            }),
            Tags: [],
          },
        ],
      } as any);

      const result = await listSkills({ limit: 1 });

      expect(result.skills[0].name).toBe('test-skill');
      expect(result.skills[0].version).toBe('1.0.0');
      expect(result.skills[0].author).toBe('Test Author');

      dryrunSpy.mockRestore();
    });
  });
});

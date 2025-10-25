import { describe, it, expect } from 'vitest';
import { getSmartDownloadStats } from '@/lib/smartDownloadStats';
import type { SkillMetadata, DownloadStats } from '@/types/ao';

describe('getSmartDownloadStats', () => {
  const baseSkill: SkillMetadata = {
    name: 'test-skill',
    version: '1.0.0',
    author: 'test-author',
    owner: 'test-owner',
    description: 'Test description',
    tags: ['test'],
    dependencies: [],
    arweaveTxId: 'test-tx-id',
    publishedAt: Date.now() - 60 * 24 * 60 * 60 * 1000, // 60 days ago
    updatedAt: Date.now(),
    downloads: 50,
  };

  describe('Popular skill logic (>= 100 downloads)', () => {
    it('shows Total Downloads + Last Week for popular skills', () => {
      const popularSkill = { ...baseSkill, downloads: 500 };
      const stats: DownloadStats = {
        downloads7Days: 45,
        downloads30Days: 120,
        downloadsTotal: 500,
        skillName: 'test-skill',
      };

      const result = getSmartDownloadStats(popularSkill, stats);

      expect(result).toHaveLength(2);
      expect(result[0].label).toBe('Total Downloads');
      expect(result[0].value).toBe(500);
      expect(result[0].tooltip).toBe('All time');
      expect(result[1].label).toBe('Last Week');
      expect(result[1].value).toBe(45);
      expect(result[1].tooltip).toBe('Past 7 days');
    });
  });

  describe('New skill logic (< 30 days, < 100 downloads)', () => {
    it('shows Total + Last Week for new skills with recent activity', () => {
      const newSkill: SkillMetadata = {
        ...baseSkill,
        publishedAt: Date.now() - 15 * 24 * 60 * 60 * 1000, // 15 days ago
        downloads: 25,
      };
      const stats: DownloadStats = {
        downloads7Days: 12,
        downloads30Days: 25,
        downloadsTotal: 25,
        skillName: 'test-skill',
      };

      const result = getSmartDownloadStats(newSkill, stats);

      expect(result).toHaveLength(2);
      expect(result[0].label).toBe('Total Downloads');
      expect(result[0].value).toBe(25);
      expect(result[1].label).toBe('Last Week');
      expect(result[1].value).toBe(12);
    });

    it('shows Total + Last Month for new skills with only monthly activity', () => {
      const newSkill: SkillMetadata = {
        ...baseSkill,
        publishedAt: Date.now() - 20 * 24 * 60 * 60 * 1000, // 20 days ago
        downloads: 30,
      };
      const stats: DownloadStats = {
        downloads7Days: 0,
        downloads30Days: 30,
        downloadsTotal: 30,
        skillName: 'test-skill',
      };

      const result = getSmartDownloadStats(newSkill, stats);

      expect(result).toHaveLength(2);
      expect(result[0].label).toBe('Total Downloads');
      expect(result[0].value).toBe(30);
      expect(result[1].label).toBe('Last Month');
      expect(result[1].value).toBe(30);
    });

    it('shows Total + Last Month for new skills with zero downloads', () => {
      const newSkill: SkillMetadata = {
        ...baseSkill,
        publishedAt: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago
        downloads: 0,
      };
      const stats: DownloadStats = {
        downloads7Days: 0,
        downloads30Days: 0,
        downloadsTotal: 0,
        skillName: 'test-skill',
      };

      const result = getSmartDownloadStats(newSkill, stats);

      expect(result).toHaveLength(2);
      expect(result[0].label).toBe('Total Downloads');
      expect(result[0].value).toBe(0);
      expect(result[1].label).toBe('Last Month');
      expect(result[1].value).toBe(0);
    });
  });

  describe('Active skill logic (downloads in last 7 days)', () => {
    it('shows Last Week + Total for active skills', () => {
      const activeSkill = { ...baseSkill, downloads: 80 };
      const stats: DownloadStats = {
        downloads7Days: 23,
        downloads30Days: 50,
        downloadsTotal: 80,
        skillName: 'test-skill',
      };

      const result = getSmartDownloadStats(activeSkill, stats);

      expect(result).toHaveLength(2);
      expect(result[0].label).toBe('Last Week');
      expect(result[0].value).toBe(23);
      expect(result[0].tooltip).toBe('Past 7 days');
      expect(result[1].label).toBe('Total Downloads');
      expect(result[1].value).toBe(80);
      expect(result[1].tooltip).toBe('All time');
    });
  });

  describe('Default/moderate activity logic', () => {
    it('shows Total + Last Month for moderate activity', () => {
      const moderateSkill = { ...baseSkill, downloads: 50 };
      const stats: DownloadStats = {
        downloads7Days: 0,
        downloads30Days: 12,
        downloadsTotal: 50,
        skillName: 'test-skill',
      };

      const result = getSmartDownloadStats(moderateSkill, stats);

      expect(result).toHaveLength(2);
      expect(result[0].label).toBe('Total Downloads');
      expect(result[0].value).toBe(50);
      expect(result[0].tooltip).toBe('All time');
      expect(result[1].label).toBe('Last Month');
      expect(result[1].value).toBe(12);
      expect(result[1].tooltip).toBe('Past 30 days');
    });
  });

  describe('Edge cases', () => {
    it('handles null stats gracefully', () => {
      const result = getSmartDownloadStats(baseSkill, null);

      expect(result).toHaveLength(2);
      expect(result[0].label).toBe('Total Downloads');
      expect(result[0].value).toBe(50);
      expect(result[1].label).toBe('Last Month');
      expect(result[1].value).toBe(0);
    });

    it('handles undefined downloads field in skill', () => {
      const skillWithoutDownloads = { ...baseSkill, downloads: undefined };
      const stats: DownloadStats = {
        downloads7Days: 5,
        downloads30Days: 10,
        downloadsTotal: 15,
        skillName: 'test-skill',
      };

      const result = getSmartDownloadStats(skillWithoutDownloads, stats);

      expect(result).toHaveLength(2);
      // Should use downloadsTotal from stats
      expect(result[1].value).toBe(15);
    });

    it('handles missing fields in stats', () => {
      const incompleteStats = {
        downloads7Days: 0,
        downloads30Days: 0,
        downloadsTotal: 0,
      } as DownloadStats;

      const result = getSmartDownloadStats(baseSkill, incompleteStats);

      expect(result).toHaveLength(2);
      expect(result[0].value).toBe(0);
      expect(result[1].value).toBe(0);
    });
  });
});

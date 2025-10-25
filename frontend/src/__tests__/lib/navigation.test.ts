import { describe, it, expect } from 'vitest';
import {
  navigateToSearch,
  navigateToSearchByTag,
  navigateToSkill,
  navigateToHome,
  navigateToAllSkills,
} from '@/lib/navigation';

describe('Navigation Helpers', () => {
  describe('navigateToSearch', () => {
    it('constructs search URL with query parameter', () => {
      const url = navigateToSearch('blockchain');
      expect(url).toBe('/search?q=blockchain');
    });

    it('encodes special characters in query', () => {
      const url = navigateToSearch('hello world');
      expect(url).toBe('/search?q=hello%20world');
    });

    it('encodes special symbols in query', () => {
      const url = navigateToSearch('c++ & rust');
      expect(url).toBe('/search?q=c%2B%2B%20%26%20rust');
    });

    it('trims whitespace from query', () => {
      const url = navigateToSearch('  trimmed  ');
      expect(url).toBe('/search?q=trimmed');
    });

    it('handles empty query string', () => {
      const url = navigateToSearch('');
      expect(url).toBe('/search?q=');
    });
  });

  describe('navigateToSearchByTag', () => {
    it('constructs search URL with tag parameter', () => {
      const url = navigateToSearchByTag('ao');
      expect(url).toBe('/search?tag=ao');
    });

    it('encodes special characters in tag', () => {
      const url = navigateToSearchByTag('machine learning');
      expect(url).toBe('/search?tag=machine%20learning');
    });

    it('trims whitespace from tag', () => {
      const url = navigateToSearchByTag('  typescript  ');
      expect(url).toBe('/search?tag=typescript');
    });
  });

  describe('navigateToSkill', () => {
    it('constructs skill detail URL', () => {
      const url = navigateToSkill('aoconnect');
      expect(url).toBe('/skills/aoconnect');
    });

    it('encodes special characters in skill name', () => {
      const url = navigateToSkill('my skill name');
      expect(url).toBe('/skills/my%20skill%20name');
    });

    it('encodes slashes in skill name', () => {
      const url = navigateToSkill('category/skill');
      expect(url).toBe('/skills/category%2Fskill');
    });

    it('trims whitespace from skill name', () => {
      const url = navigateToSkill('  skill-name  ');
      expect(url).toBe('/skills/skill-name');
    });
  });

  describe('navigateToHome', () => {
    it('returns root path', () => {
      const url = navigateToHome();
      expect(url).toBe('/');
    });
  });

  describe('navigateToAllSkills', () => {
    it('returns search path without parameters', () => {
      const url = navigateToAllSkills();
      expect(url).toBe('/search');
    });
  });
});

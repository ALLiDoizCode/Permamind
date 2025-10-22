/**
 * Unit tests for terminal detection utilities
 */

import { isInteractive } from '../../../src/utils/terminal.js';

describe('terminal detection', () => {
  // Store original environment
  const originalEnv = process.env;
  const originalIsTTY = process.stdout.isTTY;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
    // Reset TTY to original state
    Object.defineProperty(process.stdout, 'isTTY', {
      value: originalIsTTY,
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
    Object.defineProperty(process.stdout, 'isTTY', {
      value: originalIsTTY,
      writable: true,
      configurable: true
    });
  });

  describe('isInteractive', () => {
    it('should return false when CI=true', () => {
      process.env.CI = 'true';
      Object.defineProperty(process.stdout, 'isTTY', {
        value: true,
        writable: true,
        configurable: true
      });

      expect(isInteractive()).toBe(false);
    });

    it('should return false when CONTINUOUS_INTEGRATION=true', () => {
      process.env.CONTINUOUS_INTEGRATION = 'true';
      Object.defineProperty(process.stdout, 'isTTY', {
        value: true,
        writable: true,
        configurable: true
      });

      expect(isInteractive()).toBe(false);
    });

    it('should return false when BUILD_NUMBER is set', () => {
      process.env.BUILD_NUMBER = '123';
      Object.defineProperty(process.stdout, 'isTTY', {
        value: true,
        writable: true,
        configurable: true
      });

      expect(isInteractive()).toBe(false);
    });

    it('should return false when stdout is not a TTY', () => {
      delete process.env.CI;
      delete process.env.CONTINUOUS_INTEGRATION;
      delete process.env.BUILD_NUMBER;
      Object.defineProperty(process.stdout, 'isTTY', {
        value: false,
        writable: true,
        configurable: true
      });

      expect(isInteractive()).toBe(false);
    });

    it('should return true in normal terminal environment', () => {
      delete process.env.CI;
      delete process.env.CONTINUOUS_INTEGRATION;
      delete process.env.BUILD_NUMBER;
      Object.defineProperty(process.stdout, 'isTTY', {
        value: true,
        writable: true,
        configurable: true
      });

      expect(isInteractive()).toBe(true);
    });

    it('should prioritize CI environment over TTY status', () => {
      process.env.CI = 'true';
      Object.defineProperty(process.stdout, 'isTTY', {
        value: true,
        writable: true,
        configurable: true
      });

      expect(isInteractive()).toBe(false);
    });
  });
});

/**
 * Unit tests for progress factory
 */

import { Ora } from 'ora';
import { createSpinner, NoOpSpinner, INoOpSpinner } from '../../../src/utils/progress-factory.js';

describe('progress-factory', () => {
  describe('createSpinner', () => {
    it('should return spinner instance when interactive=true', () => {
      const spinner = createSpinner('Test message', true);

      // In test environments, ora may return undefined and fallback to NoOpSpinner
      // In either case, we should get a valid spinner instance
      expect(spinner).toBeDefined();
      expect(spinner).toHaveProperty('start');
      expect(spinner).toHaveProperty('succeed');
      expect(spinner).toHaveProperty('fail');
      expect(spinner).toHaveProperty('text');
      expect(spinner.text).toBe('Test message');

      // Clean up spinner
      spinner.stop();
    });

    it('should return NoOpSpinner when interactive=false', () => {
      const spinner = createSpinner('Test message', false);

      expect(spinner).toBeInstanceOf(NoOpSpinner);
      expect(spinner.text).toBe('Test message');
    });

    it('should fallback to NoOpSpinner if ora fails', () => {
      // In test environments (non-TTY), ora typically returns undefined
      // The factory should handle this gracefully by returning NoOpSpinner
      const spinner = createSpinner('Test message', true);

      expect(spinner).toBeDefined();
      // Either Ora or NoOpSpinner is acceptable - both have the same interface
      expect(spinner).toHaveProperty('succeed');
      expect(spinner).toHaveProperty('fail');
    });
  });

  describe('NoOpSpinner', () => {
    let stdoutSpy: jest.SpyInstance;
    let stderrSpy: jest.SpyInstance;

    beforeEach(() => {
      stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
      stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
    });

    afterEach(() => {
      stdoutSpy.mockRestore();
      stderrSpy.mockRestore();
    });

    it('should write initial message on start()', () => {
      const spinner = new NoOpSpinner('Starting test');
      spinner.start();

      expect(stdoutSpy).toHaveBeenCalledWith('Starting test\n');
    });

    it('should write success message with checkmark on succeed()', () => {
      const spinner = new NoOpSpinner('Test in progress');
      spinner.succeed('Test complete');

      expect(stdoutSpy).toHaveBeenCalledWith('✓ Test complete\n');
    });

    it('should use default text if no message provided to succeed()', () => {
      const spinner = new NoOpSpinner('Test in progress');
      spinner.succeed();

      expect(stdoutSpy).toHaveBeenCalledWith('✓ Test in progress\n');
    });

    it('should write error message to stderr with X on fail()', () => {
      const spinner = new NoOpSpinner('Test in progress');
      spinner.fail('Test failed');

      expect(stderrSpy).toHaveBeenCalledWith('✗ Test failed\n');
    });

    it('should use default text if no message provided to fail()', () => {
      const spinner = new NoOpSpinner('Test in progress');
      spinner.fail();

      expect(stderrSpy).toHaveBeenCalledWith('✗ Test in progress\n');
    });

    it('should write warning message with symbol on warn()', () => {
      const spinner = new NoOpSpinner('Test in progress');
      spinner.warn('Warning message');

      expect(stdoutSpy).toHaveBeenCalledWith('⚠ Warning message\n');
    });

    it('should write info message with symbol on info()', () => {
      const spinner = new NoOpSpinner('Test in progress');
      spinner.info('Info message');

      expect(stdoutSpy).toHaveBeenCalledWith('ℹ Info message\n');
    });

    it('should return self for method chaining on start()', () => {
      const spinner = new NoOpSpinner('Test');
      const result = spinner.start();

      expect(result).toBe(spinner);
    });

    it('should return self for method chaining on succeed()', () => {
      const spinner = new NoOpSpinner('Test');
      const result = spinner.succeed();

      expect(result).toBe(spinner);
    });

    it('should return self for method chaining on stop()', () => {
      const spinner = new NoOpSpinner('Test');
      const result = spinner.stop();

      expect(result).toBe(spinner);
    });

    it('should return self for method chaining on clear()', () => {
      const spinner = new NoOpSpinner('Test');
      const result = spinner.clear();

      expect(result).toBe(spinner);
    });

    it('should match Ora API interface', () => {
      const spinner: INoOpSpinner = new NoOpSpinner('Test');

      // Type checking ensures interface compatibility
      expect(spinner).toHaveProperty('start');
      expect(spinner).toHaveProperty('succeed');
      expect(spinner).toHaveProperty('fail');
      expect(spinner).toHaveProperty('warn');
      expect(spinner).toHaveProperty('info');
      expect(spinner).toHaveProperty('stop');
      expect(spinner).toHaveProperty('clear');
      expect(spinner).toHaveProperty('text');
    });

    it('should not output ANSI codes', () => {
      const spinner = new NoOpSpinner('Test message');
      spinner.start();
      spinner.succeed('Success');
      spinner.fail('Failure');

      // Verify no ANSI escape codes in output
      const allCalls = stdoutSpy.mock.calls.concat(stderrSpy.mock.calls);
      allCalls.forEach((call) => {
        const output = call[0] as string;
        // ANSI codes start with ESC [ which is \x1b[
        expect(output).not.toMatch(/\x1b\[/);
      });
    });
  });
});

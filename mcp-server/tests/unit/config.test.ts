import { loadConfig, MissingEnvironmentVariableError } from '../../src/config';

describe('Configuration Loader', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('loadConfig', () => {
    it('should throw MissingEnvironmentVariableError if SEED_PHRASE is not provided', () => {
      delete process.env.SEED_PHRASE;

      expect(() => loadConfig()).toThrow(MissingEnvironmentVariableError);
      expect(() => loadConfig()).toThrow('SEED_PHRASE environment variable is required');
    });

    it('should return config with SEED_PHRASE when provided', () => {
      process.env.SEED_PHRASE = 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12';

      const config = loadConfig();

      expect(config.seedPhrase).toBe(process.env.SEED_PHRASE);
    });

    it('should use default values for optional environment variables', () => {
      process.env.SEED_PHRASE = 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12';
      delete process.env.REGISTRY_PROCESS_ID;
      delete process.env.INSTALL_LOCATION;
      delete process.env.LOG_LEVEL;

      const config = loadConfig();

      expect(config.logLevel).toBe('info');
      expect(config.installLocation).toContain('.claude/skills');
    });

    it('should use custom REGISTRY_PROCESS_ID when provided', () => {
      process.env.SEED_PHRASE = 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12';
      process.env.REGISTRY_PROCESS_ID = 'custom_process_id';

      const config = loadConfig();

      expect(config.registryProcessId).toBe('custom_process_id');
    });

    it('should use custom LOG_LEVEL when provided', () => {
      process.env.SEED_PHRASE = 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12';
      process.env.LOG_LEVEL = 'debug';

      const config = loadConfig();

      expect(config.logLevel).toBe('debug');
    });

    it('should use custom INSTALL_LOCATION when provided', () => {
      process.env.SEED_PHRASE = 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12';
      process.env.INSTALL_LOCATION = '/custom/path';

      const config = loadConfig();

      expect(config.installLocation).toBe('/custom/path');
    });
  });

  describe('MissingEnvironmentVariableError', () => {
    it('should include solution in error', () => {
      const error = new MissingEnvironmentVariableError(
        'TEST_VAR is required',
        'Set TEST_VAR in .env file'
      );

      expect(error.message).toBe('TEST_VAR is required');
      expect(error.solution).toBe('Set TEST_VAR in .env file');
      expect(error.name).toBe('MissingEnvironmentVariableError');
    });
  });
});

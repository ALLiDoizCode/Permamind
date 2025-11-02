/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/cli/tests'],
  testMatch: ['**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/cli/tests/setup.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: false,
      isolatedModules: true,
      tsconfig: {
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        moduleResolution: 'node',
        target: 'ES2022',
        module: 'commonjs',
        verbatimModuleSyntax: false
      }
    }]
  },
  // Transform ESM modules like @permaweb/aoconnect
  transformIgnorePatterns: [
    '/node_modules/(?!(@permaweb)/)'
  ],
  collectCoverageFrom: [
    'cli/src/**/*.ts',
    '!cli/src/**/*.d.ts',
    '!cli/src/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  verbose: true,
  testTimeout: 10000,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};

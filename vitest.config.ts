import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: [
        "node_modules/",
        "dist/",
        "tests/",
        "*.config.ts",
        "src/types/",
      ],
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
    env: {
      NODE_ENV: "test", // Explicitly set NODE_ENV for all tests to prevent mainnet endpoint usage
    },
    environment: "node",
    globals: true,
    // Add stability configurations for CI environments
    hookTimeout: 30000,
    include: ["tests/**/*.test.ts"],
    // Use serial execution in CI to avoid process management issues
    ...(process.env.CI && {
      pool: "forks",
      poolOptions: {
        forks: {
          singleFork: true,
          isolate: false,
          maxForks: 1,
        },
      },
    }),
    ...(!process.env.CI && {
      pool: "threads",
      poolOptions: {
        threads: {
          singleThread: true,
          maxThreads: 1,
        },
      },
    }),
    testTimeout: 30000,
    // Add teardown timeout for CI stability
    teardownTimeout: 10000,
    // Force sequential execution in CI
    sequence: {
      concurrent: process.env.CI ? false : true,
    },
  },
});

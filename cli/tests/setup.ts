/**
 * Jest Test Setup
 * Configures global mocks and test environment before tests run
 */

// Mock @permaweb/aoconnect before any tests import it
jest.mock('@permaweb/aoconnect', () => ({
  connect: jest.fn(() => ({
    dryrun: jest.fn(),
    message: jest.fn(),
    result: jest.fn(),
  })),
  dryrun: jest.fn(),
  message: jest.fn(),
  result: jest.fn(),
  createDataItemSigner: jest.fn((wallet) => ({ wallet })),
}));

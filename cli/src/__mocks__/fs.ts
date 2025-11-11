/**
 * Manual mock for Node.js fs module
 */

const mockPromises = {
  stat: jest.fn(),
  access: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
  mkdir: jest.fn(),
  readdir: jest.fn(),
  unlink: jest.fn(),
  rmdir: jest.fn(),
};

module.exports = {
  promises: mockPromises,
};

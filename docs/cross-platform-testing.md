# Cross-Platform Testing Guide

## Overview

This document describes the cross-platform testing strategy for the Agent Skills Registry CLI tool. The CLI must work reliably across macOS, Linux, and Windows platforms.

## Testing Matrix

The project uses GitHub Actions to test across multiple platforms and Node.js versions:

### Platform Coverage
- **macOS**: Latest macOS runner (macOS 14)
- **Linux**: Ubuntu Latest LTS (Ubuntu 22.04)
- **Windows**: Latest Windows runner (Windows 2022)

### Node.js Version Coverage
- **Node 18.x**: Current LTS
- **Node 20.x**: Latest LTS (project minimum: 20.11.0)

### Test Matrix
GitHub Actions runs **6 parallel jobs** (3 OS × 2 Node versions):
1. macOS + Node 18
2. macOS + Node 20
3. Linux + Node 18
4. Linux + Node 20
5. Windows + Node 18
6. Windows + Node 20

## Platform-Specific Considerations

### File Paths

**Strategy**: Use `path.join()` exclusively for cross-platform path handling.

**macOS/Linux**:
- Path separator: `/`
- Home directory: `/Users/<user>` (macOS) or `/home/<user>` (Linux)
- Example: `/Users/joe/.claude/skills/ao-basics`

**Windows**:
- Path separator: `\`
- Home directory: `C:\Users\<user>`
- Drive letters: `C:\`, `D:\`
- Example: `C:\Users\Joe\.claude\skills\ao-basics`

**MAX_PATH Limitation (Windows)**:
- Windows has a 260-character path limit by default
- Skills with deeply nested directories may exceed this limit
- Solution: Enable long path support or restructure skill directories

### Terminal Compatibility

**ora Spinners**:
- Work correctly on all platforms
- PowerShell and CMD on Windows: Full Unicode support
- Terminal.app (macOS): Full support
- Linux terminals: Full support (gnome-terminal, konsole)

**chalk Colors**:
- Auto-detects color support on all platforms
- CI environments: Colors disabled (no TTY)
- Use `--no-color` flag for CI pipelines

**cli-table3 Tables**:
- Adapts to terminal width on all platforms
- Works in PowerShell, CMD, Terminal.app, Linux terminals

### Keychain Integration (keytar)

**macOS**:
- Uses macOS Keychain API
- Secure storage for wallet JWKs
- Requires Xcode command-line tools for building

**Windows**:
- Uses Windows Credential Vault
- Native integration (no additional dependencies)

**Linux**:
- Uses Secret Service API (libsecret)
- May require `libsecret-1-dev` installation
- Ubuntu/Debian: `sudo apt-get install libsecret-1-dev`
- Fedora/RHEL: `sudo dnf install libsecret-devel`

### Lua 5.3 for AO Process Tests

**GitHub Actions Setup**:
- Uses `leafo/gh-actions-lua@v10`
- Installs Lua 5.3 on all platforms
- Windows: May require additional setup

**Local Development**:
- macOS: `brew install lua@5.3`
- Linux: `sudo apt-get install lua5.3`
- Windows: Download from lua.org or use Chocolatey

## Running Tests Locally

### Full Test Suite
```bash
npm run test:once
```

### Cross-Platform Specific Tests
```bash
npm run test:once -- cli/tests/integration/cross-platform/
npm run test:once -- cli/tests/unit/utils/path-utils.test.ts
```

### Platform Detection Tests
```bash
npm run test:once -- --testNamePattern="Platform-Specific Behavior"
```

### With Coverage
```bash
npm run test:coverage
```

## Writing Cross-Platform Tests

### Use Platform Detection Utilities

```typescript
import {
  getPlatformInfo,
  isWindows,
  isMacOS,
  isLinux,
  skipOn,
  runOnlyOn,
} from '../helpers/platform-utils';

describe('My Feature', () => {
  it('works on all platforms', () => {
    const info = getPlatformInfo();
    expect(info.platform).toBeTruthy();
  });

  // Skip test on Windows
  skipOn('win32')('uses Unix permissions', () => {
    // Test Unix-specific behavior
  });

  // Run only on Windows
  runOnlyOn('win32')('uses Windows paths', () => {
    // Test Windows-specific behavior
  });
});
```

### Path Handling Best Practices

```typescript
import * as path from 'path';
import * as os from 'os';

// ✅ CORRECT: Use path.join()
const skillPath = path.join(os.homedir(), '.claude', 'skills', 'ao-basics');

// ❌ WRONG: Hard-coded separators
const badPath = os.homedir() + '/.claude/skills/ao-basics';

// ✅ CORRECT: Detect platform-specific separator
const separator = isWindows() ? '\\' : '/';

// ✅ CORRECT: Handle ~ expansion
const expandTilde = (p: string) =>
  p.startsWith('~/') ? path.join(os.homedir(), p.slice(2)) : p;
```

### Temporary Directory Handling

```typescript
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

// ✅ CORRECT: Use os.tmpdir()
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-test-'));

// Clean up after tests
afterEach(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});
```

## CI/CD Integration

### GitHub Actions Configuration

`.github/workflows/test.yml`:
```yaml
jobs:
  test:
    runs-on: ${{ matrix.os }}

    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        node-version: [18.x, 20.x]

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      - uses: leafo/gh-actions-lua@v10
        with:
          luaVersion: "5.3"
      - run: npm install
      - run: npm run test:once
      - run: npm run test:ao
      - run: npm run lint --if-present
      - run: npm run build --if-present
```

### Environment Detection

```typescript
// Detect CI environment
const isCI = process.env.CI === 'true';
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';

// Detect TTY (interactive terminal)
const isTTY = process.stdout.isTTY === true;

// In CI, TTY is false and colors should be disabled
if (isCI) {
  process.env.NO_COLOR = '1';
}
```

## Troubleshooting

### Windows: Long Path Issues
**Error**: `ENAMETOOLONG` or `ENOENT` for deeply nested paths

**Solution**:
1. Enable long path support: `Set-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem' -Name 'LongPathsEnabled' -Value 1`
2. Restructure skill to reduce path depth
3. Use shorter directory names

### Linux: libsecret Missing
**Error**: `Error: Cannot find module 'keytar'`

**Solution**:
```bash
sudo apt-get install libsecret-1-dev
npm rebuild keytar
```

### macOS: Xcode Tools Missing
**Error**: `gyp: No Xcode or CLT version detected!`

**Solution**:
```bash
xcode-select --install
```

### Windows: Lua Not Found
**Error**: `'lua' is not recognized as an internal or external command`

**Solution**:
```bash
# Using Chocolatey
choco install lua --version 5.3.5

# Or download from lua.org and add to PATH
```

### CI: Tests Timeout
**Error**: Tests exceed 30-minute CI limit

**Solution**:
- Reduce test iterations (e.g., reliability tests)
- Increase timeout in jest.config.js: `testTimeout: 60000`
- Split tests across multiple workflow jobs

## Performance Considerations

### Platform-Specific Timeouts

Windows may be slower for some operations. Use timeout multipliers:

```typescript
const baseTimeout = 10000; // 10 seconds
const timeout = baseTimeout * getTimeoutMultiplier();
// Windows: 15 seconds (1.5x)
// macOS/Linux: 10 seconds (1.0x)
```

### Test Execution Times

Typical test suite execution times:
- **macOS**: ~45-55 seconds
- **Linux**: ~40-50 seconds
- **Windows**: ~55-70 seconds (slower due to file system)

## Reliability Targets

### Installation Success Rate
- **Target**: >95% across all platforms
- **Measurement**: 100 install operations per platform
- **Tracking**: GitHub Actions artifacts with failure analysis

### Test Stability
- **No flaky tests**: All tests must pass consistently
- **Deterministic**: Tests produce same results across runs
- **Mocked I/O**: Network operations mocked for reliability

## Additional Resources

- [Node.js path module documentation](https://nodejs.org/api/path.html)
- [GitHub Actions runner images](https://github.com/actions/runner-images)
- [keytar platform support](https://github.com/atom/node-keytar)
- [chalk color support detection](https://github.com/chalk/chalk#supportscolor)
- [ora spinner customization](https://github.com/sindresorhus/ora)

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2025-10-22 | 1.0 | Initial cross-platform testing guide (Story 5.1) |

---

*Last Updated: 2025-10-22*
*Story: 5.1 - Cross-Platform Testing Suite*

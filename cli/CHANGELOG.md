# Changelog - @permamind/skills CLI

All notable changes to the Permamind Skills CLI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-10-27

### Fixed
- Updated default `.skillsrc` wallet path from `~/.arweave/wallet.json` to `./wallet.json` for better out-of-box experience
- Fixed registry process ID in `.skillsrc` to point to correct AO registry process

### Changed
- Improved documentation for wallet configuration
- Enhanced error messages for wallet loading failures

### Known Issues
- CLI publish command incorrectly uses `Update-Skill` for new versions instead of `Register-Skill`
  - **Workaround**: Manually use `Register-Skill` action when publishing new versions
  - **Impact**: Version bumps (e.g., 1.0.0 → 1.1.0) will fail with current publish command
  - **Fix planned**: v1.1.0 will check version number to determine correct action

## [1.0.0] - 2025-10-22

### Added
- Initial release of Permamind Skills CLI
- Command: `skills publish <directory>` - Publish skills to Arweave and AO registry
- Command: `skills search <query>` - Search for skills in the registry
- Command: `skills install <name>` - Install skills from the registry
- Arweave integration for permanent storage
- AO registry integration for decentralized skill discovery
- Wallet management with JWK support
- Progress indicators and verbose logging
- Comprehensive error handling and user-friendly messages
- Support for `.skillsrc` configuration file
- Bundle creation with tar.gz compression
- Transaction status polling and confirmation
- Gateway failover and retry logic

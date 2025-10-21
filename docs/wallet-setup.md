# Arweave Wallet Setup Guide

This guide explains how to set up and securely manage your Arweave wallet for publishing Agent Skills to the registry.

## Table of Contents

- [Overview](#overview)
- [Generating a Wallet](#generating-a-wallet)
- [Wallet File Format](#wallet-file-format)
- [Configuration](#configuration)
- [Keychain Integration](#keychain-integration)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The Agent Skills CLI requires an Arweave wallet (JWK - JSON Web Key) to:

- Sign transactions when publishing skills to Arweave
- Pay network fees for permanent storage
- Register skills in the AO registry process

Your wallet contains your private keys and must be kept secure.

## Generating a Wallet

### Option 1: Using Arweave SDK

```bash
npm install -g arweave
node -e "const Arweave = require('arweave'); const arweave = Arweave.init({}); arweave.wallets.generate().then(key => console.log(JSON.stringify(key, null, 2)))" > wallet.json
```

### Option 2: Using ArConnect Browser Extension

1. Install [ArConnect](https://www.arconnect.io/) browser extension
2. Create a new wallet
3. Export the wallet JSON file
4. Save to a secure location (e.g., `~/.arweave/wallet.json`)

### Option 3: Using Arweave Web Wallet

1. Visit [https://arweave.app/](https://arweave.app/)
2. Generate a new wallet
3. Download the keyfile (JSON format)
4. Save securely with restricted permissions

## Wallet File Format

An Arweave wallet is a JSON file containing an RSA key pair:

```json
{
  "kty": "RSA",
  "e": "AQAB",
  "n": "base64url_encoded_public_modulus...",
  "d": "base64url_encoded_private_exponent...",
  "p": "base64url_encoded_prime_factor...",
  "q": "base64url_encoded_prime_factor...",
  "dp": "base64url_encoded_exponent...",
  "dq": "base64url_encoded_exponent...",
  "qi": "base64url_encoded_coefficient..."
}
```

**Important**: Never share or commit this file - it contains your private keys!

## Configuration

### Method 1: Command-Line Flag

Specify the wallet path when running commands:

```bash
agent-skills publish ./my-skill --wallet ~/.arweave/wallet.json
```

### Method 2: .skillsrc Configuration File

Create a `.skillsrc` file in your project directory or home directory:

```json
{
  "wallet": "~/.arweave/wallet.json",
  "registry": "REGISTRY_PROCESS_ID",
  "gateway": "https://arweave.net"
}
```

**Priority Order:**
1. `--wallet` flag (highest priority)
2. Local `.skillsrc` (project directory)
3. Global `.skillsrc` (home directory)
4. Prompt user (if none configured)

## Keychain Integration

The CLI supports encrypted wallet storage using your system's keychain:

- **macOS**: Keychain Access
- **Windows**: Credential Vault
- **Linux**: Secret Service API (libsecret)

### Saving to Keychain

> **Coming Soon**: The `wallet save` command will be available in a future release.

```bash
# Future command (not yet implemented)
agent-skills wallet save --identifier main ~/.arweave/wallet.json
```

For now, wallet integration happens automatically when using the `publish` command.

### Loading from Keychain

The CLI automatically attempts to load from keychain first when you use the `publish` command, falling back to file-based storage if unavailable.

### Benefits

- **Encrypted at Rest**: OS-level encryption protects your keys
- **No File Permissions Needed**: No need to manage file permissions manually
- **Cross-Session Persistence**: Wallet available across terminal sessions
- **Secure Access Control**: OS handles access permissions

### Fallback Behavior

If keychain is unavailable:
1. CLI emits a warning
2. Falls back to file-based wallet loading
3. Prompts for wallet path if not configured

## Security Best Practices

### File Permissions

If using file-based storage, restrict wallet file permissions:

```bash
chmod 600 ~/.arweave/wallet.json
```

This ensures only your user account can read/write the file.

### Git Ignore

**Never commit wallet files to version control!**

Add to `.gitignore`:

```gitignore
*.json
.env
wallet.json
~/.arweave/
```

### Backup Securely

Create encrypted backups of your wallet:

```bash
# Using GPG encryption
gpg -c ~/.arweave/wallet.json
```

Store the encrypted backup (`.gpg` file) in a secure location.

### Use Keychain for Production

- **Development**: File-based wallet is acceptable
- **CI/CD**: Use environment variables or secrets management
- **Production**: Always use system keychain for encrypted storage

### Check Wallet Balance

> **Coming Soon**: The `wallet balance` command will be available in a future release.

Before publishing, verify sufficient funds using the Arweave network explorer or wallet apps:
- ArConnect browser extension
- Arweave.app web wallet
- Visit: `https://viewblock.io/arweave/address/YOUR_ADDRESS`

Publishing typically costs ~0.001 AR per skill.

### Separate Wallets

Consider using separate wallets for:
- **Development**: Testing with minimal funds
- **Production**: Publishing production skills
- **Personal**: Keeping personal AR separate

## Troubleshooting

### Error: "Wallet file not found"

**Solution**: Verify the wallet path is correct.

```bash
ls -la ~/.arweave/wallet.json
```

If missing, generate a new wallet or check the configured path.

### Error: "Invalid JWK format"

**Solution**: Ensure the wallet file is valid JSON and contains required fields (`kty`, `e`, `n`).

```bash
cat ~/.arweave/wallet.json | jq .
```

### Error: "Insufficient balance"

**Solution**: Add AR tokens to your wallet.

1. Get your wallet address:

   > **Coming Soon**: The `wallet address` command will be available in a future release.

   For now, derive your address using the Arweave SDK or ArConnect wallet:
   ```bash
   # Using Arweave CLI (if installed)
   arweave key-info ~/.arweave/wallet.json
   ```

2. Purchase AR from an exchange or get test tokens from a faucet

3. Send AR to your wallet address

### Error: "System keychain unavailable"

**Solution**: Install keytar dependency or use file-based storage.

```bash
npm install -g keytar
```

On Linux, you may need libsecret:

```bash
# Debian/Ubuntu
sudo apt-get install libsecret-1-dev

# Fedora
sudo dnf install libsecret-devel

# Arch
sudo pacman -S libsecret
```

### Error: "Failed to read wallet file"

**Solution**: Check file permissions and ensure your user can read the file.

```bash
ls -la ~/.arweave/wallet.json
chmod 600 ~/.arweave/wallet.json
```

### Warning: "Keychain save failed"

**Cause**: OS keychain access denied or unavailable.

**Solution**: Grant keychain access when prompted, or use file-based storage as fallback.

## Additional Resources

- [Arweave Wallet Documentation](https://docs.arweave.org/developers/wallets)
- [ArConnect Browser Extension](https://www.arconnect.io/)
- [Arweave Network Status](https://viewblock.io/arweave)
- [AR Token Prices](https://www.coingecko.com/en/coins/arweave)

## Security Disclosure

If you discover a security issue related to wallet management, please report it to: [security contact - TBD]

**Do not create public issues for security vulnerabilities.**

---

**Last Updated**: 2025-10-21

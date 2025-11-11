# Browser Wallet Connection Troubleshooting

This guide helps you resolve common issues when connecting browser wallets (ArConnect, Wander) to the Agent Skills CLI.

## Table of Contents

- [Connection Timeout](#connection-timeout)
- [User Rejection](#user-rejection)
- [Browser Launch Failure](#browser-launch-failure)
- [Port Conflicts](#port-conflicts)
- [Missing Wallet Extension](#missing-wallet-extension)
- [SEED_PHRASE Fallback](#seed_phrase-fallback)

---

## Connection Timeout

### Error Message

```
[NetworkError] Browser wallet connection timeout after 300000ms. -> Solution: Retry the operation. If browser didn't open, manually visit http://localhost:12345 and approve the wallet connection request.
```

### Causes

- Browser didn't open automatically
- User took too long to approve the connection (default timeout: 5 minutes)
- Browser wallet extension is not responding

### Solutions

#### 1. Manual Browser Connection

If the browser didn't open automatically, copy the URL from the error message and visit it manually:

```bash
# Example URL (port number will vary)
http://localhost:12345
```

1. Open your browser
2. Navigate to the URL shown in the error message
3. Approve the wallet connection when prompted

#### 2. Increase Timeout

If you need more time to review connection requests, configure a longer timeout:

**Via Environment Variable** (not yet implemented, use code configuration):

**Via Code Configuration**:
```typescript
await adapter.initialize({ requestTimeout: 600000 }); // 10 minutes
```

#### 3. Check Wallet Extension Status

Ensure your browser wallet extension is:

- Installed (see [Missing Wallet Extension](#missing-wallet-extension))
- Unlocked (enter your password if locked)
- Updated to the latest version

### Terminal Output Example

```
🌐 Arweave wallet signer started at http://localhost:12345
📱 Opening browser for wallet connection...

Error: [NetworkError] Browser wallet connection timeout after 300000ms. -> Solution: Retry the operation. If browser didn't open, manually visit http://localhost:12345 and approve the wallet connection request.
```

---

## User Rejection

### Error Message

```
[AuthorizationError] Wallet connection rejected by user. -> Solution: Retry the operation and approve the wallet connection when prompted in your browser.
```

### Causes

- You clicked "Deny" or "Cancel" in the wallet extension popup
- The wallet connection request was dismissed or closed

### Solutions

#### Approve Connection in Wallet Extension

1. Run the command again
2. When the browser opens, look for the wallet extension popup
3. Click "Approve" or "Connect" to grant access

#### ArConnect Approval

<img src="https://docs.arconnect.io/assets/connection-request.png" alt="ArConnect connection request" width="300"/>

1. Review the requested permissions:
   - `ACCESS_ADDRESS` - Read wallet address
   - `SIGN_TRANSACTION` - Sign transactions
   - `DISPATCH` - Submit transactions
2. Click "Connect" to approve

#### Wander Approval

1. The Wander extension will show a connection request popup
2. Review the requested permissions
3. Click "Approve" to connect

### Terminal Output Example

```
Error: [AuthorizationError] Wallet connection rejected by user. -> Solution: Retry the operation and approve the wallet connection when prompted in your browser.
```

---

## Browser Launch Failure

### Error Message

```
[ConfigurationError] Failed to open browser automatically. -> Solution: Manually open your browser and visit http://localhost:12345 to approve the wallet connection.
```

### Causes

- System doesn't have a default browser configured
- Browser launch permissions are restricted
- Running in a headless environment (SSH, Docker, CI/CD)

### Solutions

#### 1. Manual Browser Opening

Copy the URL from the error message and open it manually:

```bash
# On macOS
open http://localhost:12345

# On Linux
xdg-open http://localhost:12345

# On Windows
start http://localhost:12345
```

#### 2. Configure Default Browser

**macOS**:
```bash
# Set default browser in System Settings > Desktop & Dock > Default web browser
```

**Linux**:
```bash
xdg-settings set default-web-browser firefox.desktop
```

**Windows**:
```powershell
# Set default browser in Settings > Apps > Default apps
```

### Terminal Output Example

```
🌐 Arweave wallet signer started at http://localhost:54321
📱 Opening browser for wallet connection...

Error: [ConfigurationError] Failed to open browser automatically. -> Solution: Manually open your browser and visit http://localhost:54321 to approve the wallet connection.
```

---

## Port Conflicts

### Error Message

```
[ConfigurationError] Failed to initialize browser wallet server. -> Solution: Ensure no other service is using the port, then retry. Error: Port 3737 is already in use
```

### Causes

- Another application is using the default port (3737)
- A previous CLI session didn't close properly

### Solutions

#### 1. Random Port Allocation (Recommended)

The CLI uses **random port allocation by default** (port 0), which prevents conflicts:

```typescript
// This is the default behavior - no configuration needed
await adapter.initialize({ port: 0 }); // Random port
```

The actual port will be shown in the error message if a timeout occurs.

#### 2. Find and Kill Process Using Port

**macOS/Linux**:
```bash
# Find process using port 3737
lsof -i :3737

# Kill the process
kill -9 <PID>
```

**Windows**:
```powershell
# Find process using port 3737
netstat -ano | findstr :3737

# Kill the process
taskkill /PID <PID> /F
```

#### 3. Use Different Port

```typescript
await adapter.initialize({ port: 8080 }); // Custom port
```

### Terminal Output Example

```
Error: [ConfigurationError] Failed to initialize browser wallet server. -> Solution: Ensure no other service is using the port, then retry. Error: Port 3737 is already in use
```

---

## Missing Wallet Extension

### Symptoms

- Browser opens but shows a blank page
- No wallet connection popup appears
- Error: "Browser wallet extension not found"

### Solutions

#### Install ArConnect

**Chrome, Edge, Brave**:
1. Visit [ArConnect Chrome Web Store](https://chrome.google.com/webstore/detail/arconnect/einnioafmpimabjcddiinlhmijaionap)
2. Click "Add to Chrome"
3. Create or import a wallet
4. Retry the CLI command

#### Install Wander

**All Browsers**:
1. Visit [Wander.app](https://wander.app)
2. Download and install the extension for your browser
3. Set up your wallet
4. Retry the CLI command

### Verification

After installing the extension, verify it's active:

1. Open your browser
2. Look for the wallet extension icon in the toolbar
3. Click the icon to ensure it opens
4. Try the CLI command again

---

## SEED_PHRASE Fallback

If browser wallet connection continues to fail, you can use the **SEED_PHRASE workflow** as a stable alternative.

### Setting Up SEED_PHRASE

#### 1. Generate or Use Existing Mnemonic

```bash
# Generate new wallet (example - use your preferred method)
# Save the 12-word mnemonic securely
```

#### 2. Set Environment Variable

**macOS/Linux**:
```bash
export SEED_PHRASE="your twelve word mnemonic phrase goes here like this example seed"
```

**Windows (PowerShell)**:
```powershell
$env:SEED_PHRASE="your twelve word mnemonic phrase goes here like this example seed"
```

#### 3. Run CLI Command

The CLI will automatically detect the `SEED_PHRASE` environment variable and use it instead of prompting for browser wallet connection:

```bash
skills publish ./my-skill
```

### SEED_PHRASE Priority

The CLI follows this wallet selection priority:

1. **SEED_PHRASE** (environment variable) - Always checked first
2. **Browser Wallet** (node-arweave-wallet) - Fallback if SEED_PHRASE not set

### Security Considerations

⚠️ **IMPORTANT**: Never commit `SEED_PHRASE` to version control

✅ **Best Practices**:
- Store in `.env` file (add to `.gitignore`)
- Use password manager for secure storage
- Use different wallets for development and production
- Consider using browser wallet for better security in production

### Example .env File

```bash
# .env (add to .gitignore!)
SEED_PHRASE="your twelve word mnemonic phrase goes here like this example seed"
```

Load environment variables:

```bash
# macOS/Linux
source .env

# Or use dotenv
npm install -g dotenv-cli
dotenv skills publish ./my-skill
```

---

## Advanced Troubleshooting

### Enable Debug Logging

Set the `LOG_LEVEL` environment variable to see detailed logs:

```bash
export LOG_LEVEL=debug
skills publish ./my-skill
```

### Check Browser Console

If the browser opens but connection fails:

1. Open browser developer tools (F12)
2. Go to the Console tab
3. Look for error messages from the wallet extension
4. Check for any CORS or network errors

### Test With Different Browser

Some wallet extensions work better in specific browsers:

- **ArConnect**: Best in Chrome, Edge, Brave
- **Wander**: Works in all browsers

Try switching browsers if connection issues persist.

### Verify Network Connectivity

The wallet connection uses `localhost` only, but ensure:

```bash
# Test localhost is accessible
curl http://localhost:12345
# Should show connection refused (server not running) or HTML page
```

---

## Getting Help

If you're still experiencing issues after trying these solutions:

1. **Check Documentation**: [Agent Skills CLI Docs](../README.md)
2. **Review Logs**: Run with `LOG_LEVEL=debug` for detailed output
3. **Report Issue**: [GitHub Issues](https://github.com/ALLiDoizCode/Permamind/issues)

### Useful Information to Include

When reporting an issue, include:

- Operating system and version
- Browser and version
- Wallet extension and version
- CLI version (`skills --version`)
- Full error message
- Debug logs (with `LOG_LEVEL=debug`)
- Steps to reproduce

---

## Related Documentation

- [node-arweave-wallet Documentation](https://github.com/pawanpaudel93/node-arweave-wallet)
- [ArConnect Documentation](https://docs.arconnect.io)
- [Wander Documentation](https://docs.wander.app)
- [Agent Skills CLI README](../README.md)

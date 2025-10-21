# Security

## Input Validation

- **Validation Library:** ajv (JSON Schema)
- **Validation Location:** CLI boundary (before operations), AO handlers (before state changes)
- **Rules:**
  - All external inputs validated
  - Whitelist approach preferred
  - Skill names: `/^[a-z0-9-]+$/` (1-64 chars)
  - Versions: Semver `x.y.z`
  - File paths: Reject `..` traversal
  - Arweave TXIDs: `/^[a-zA-Z0-9_-]{43}$/`

## Authentication & Authorization

- **Auth Method:**
  - CLI: Arweave JWK signatures
  - AO Process: `msg.From` ownership
- **Session Management:** Stateless (wallet loaded per-command)
- **Patterns:**
  - Wallet never transmitted (only signatures)
  - AO ownership checks use `msg.From` (cryptographically verified)

## Secrets Management

- **Development:** `.env` file (gitignored)
- **Production:**
  - GitHub Secrets (CI/CD)
  - System keychain via keytar
  - Fallback to file storage with warning
- **Requirements:**
  - Never hardcode secrets
  - Access via configuration only
  - No secrets in logs/errors
  - Clear from memory after use

## API Security

- **HTTPS Enforcement:** All Arweave/AO requests use HTTPS
- **Rate Limiting:** Handled by networks (CLI is single-user)
- **Input Validation:** Whitelist validation at all boundaries

## Data Protection

- **Encryption at Rest:** Wallet JWK via keytar, lock file plain JSON (public data)
- **Encryption in Transit:** HTTPS for all network communication
- **PII Handling:** No PII collected (only public Arweave addresses)
- **Logging Restrictions:**
  - Forbidden: Wallet JWK, file contents, home paths, env vars
  - Safe: Arweave addresses, TXIDs, skill names, error messages

## Dependency Security

- **Scanning:** npm audit (built-in), GitHub Dependabot
- **Update Policy:**
  - Security: Immediate (within 24 hours)
  - Minor: Monthly
  - Major: Evaluated for breaking changes
- **Approval:** Check reputation, downloads, vulnerabilities before adding

## Security Testing

- **SAST:** ESLint security plugin
- **Penetration Testing:** Manual review pre-launch (Day 13-14)
- **Security Checklist:**
  - npm audit clean
  - ESLint security passes
  - Wallet never in logs
  - HTTPS enforced
  - Input validation complete
  - Ownership checks use msg.From

---

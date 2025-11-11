# CI/CD Workflow Documentation

This repository uses GitHub Actions for continuous integration and deployment with three main workflows:

## 📋 Workflows Overview

### 1. **Test Workflow** (`test.yml`)
- **Triggers**: Push and PR to `development` and `main` branches
- **Purpose**: Run tests on all code changes
- **Node Versions**: Tests on Node 20.x
- **Steps**:
  - Checkout code
  - Install dependencies
  - Run tests
  - Run linting (if configured)
  - Build package (if build script exists)

### 2. **Publish Workflow** (`publish.yml`)
- **Triggers**: Push to `main` branch only
- **Purpose**: Publish stable releases to NPM
- **Requirements**: All tests must pass first
- **Versioning**: Automatically bumps patch version
- **Steps**:
  1. Run full test suite (Node 20.x)
  2. Build package
  3. Bump version (patch: x.y.Z)
  4. Push version tag to Git
  5. Publish to NPM with `latest` tag
  6. Create GitHub Release

### 3. **Nightly Build Workflow** (`nightly.yml`)
- **Triggers**:
  - Scheduled at midnight UTC (00:00) daily
  - Manual dispatch
- **Source**: `development` branch
- **Purpose**: Create nightly preview builds
- **Versioning**: `X.Y.Z-nightly.YYYYMMDD.COMMITHASH`
- **NPM Tag**: `nightly`
- **Steps**:
  1. Run full test suite on development branch
  2. Generate unique nightly version
  3. Publish to NPM with `nightly` tag

## 🔧 Setup Instructions

### 1. **NPM Token Setup**

1. Generate an NPM automation token:
   ```bash
   npm login
   npm token create --type=automation
   ```

2. Add the token to GitHub Secrets:
   - Go to: Repository → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Your NPM automation token

### 2. **GitHub Token Permissions**

The workflows use the built-in `GITHUB_TOKEN`, but you need to ensure proper permissions:

1. Go to: Repository → Settings → Actions → General
2. Scroll to "Workflow permissions"
3. Select: "Read and write permissions"
4. Check: "Allow GitHub Actions to create and approve pull requests"
5. Save

### 3. **Package.json Configuration**

Ensure your `package.json` has the necessary scripts:

```json
{
  "name": "your-package-name",
  "version": "1.0.0",
  "scripts": {
    "test": "jest",
    "build": "tsc",
    "lint": "eslint ."
  },
  "publishConfig": {
    "access": "public"
  }
}
```

### 4. **Branch Protection Rules** (Recommended)

Protect your `main` branch:

1. Go to: Repository → Settings → Branches
2. Add rule for `main`:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass (select "test")
   - ✅ Require branches to be up to date
   - ✅ Do not allow bypassing the above settings

## 📦 Version Management

### Automatic Version Bumping

- **Main Branch**: Patch version bump on every publish (`1.0.0` → `1.0.1`)
- **Nightly Builds**: Prerelease version with date and commit hash (`1.0.0-nightly.20250121.abc1234`)

### Manual Version Control

To manually bump versions before merge to main:

```bash
# Patch version (1.0.0 → 1.0.1)
npm version patch

# Minor version (1.0.0 → 1.1.0)
npm version minor

# Major version (1.0.0 → 2.0.0)
npm version major

# Push with tags
git push --follow-tags
```

### Preventing Version Collisions

The workflows prevent collisions by:

1. **Stable Releases**: Auto-increment patch version on every publish
2. **Nightly Builds**: Unique timestamps + commit hash ensure uniqueness
3. **Git Tags**: Version commits are tagged and pushed automatically
4. **NPM Tags**: Nightlies use `nightly` tag, stable uses `latest` tag

## 📥 Installation Instructions

### For End Users

```bash
# Install latest stable version
npm install your-package-name

# Install specific version
npm install your-package-name@1.0.5

# Install nightly build
npm install your-package-name@nightly
```

## 🔄 Workflow Behavior

### Development Branch
- ✅ Tests run on every push/PR
- ❌ No publishing
- 🌙 Nightly builds at midnight UTC

### Main Branch
- ✅ Tests run on every push
- ✅ Auto-publish if tests pass
- ✅ Version bump + GitHub Release
- ✅ NPM publish with `latest` tag

## 🚨 Troubleshooting

### Publish Fails: "Version already exists"
- **Cause**: Version collision
- **Solution**: The workflow auto-bumps versions, but if manually committed, ensure unique version

### Nightly Build Fails
- **Check**: Development branch tests
- **Solution**: Fix failing tests before midnight UTC
- **Manual Trigger**: Use "Run workflow" button in Actions tab

### NPM Authentication Error
- **Check**: `NPM_TOKEN` secret is set correctly
- **Solution**: Regenerate token and update secret

### Git Push Fails: "Protected branch"
- **Check**: Workflow permissions
- **Solution**: Enable "Read and write permissions" in Actions settings

## 🎯 Best Practices

1. **Always merge to main via PR** - Ensures tests run before publish
2. **Use development for active work** - Nightlies help test integration
3. **Tag major releases** - Create GitHub releases for significant versions
4. **Monitor nightly builds** - Catch integration issues early
5. **Semantic versioning** - Follow semver for version bumps
6. **Update changelog** - Document changes in CHANGELOG.md

## 🔐 Security Notes

- NPM tokens are stored as GitHub Secrets (encrypted)
- Tokens are never exposed in logs
- Use automation tokens (not publish tokens)
- Rotate tokens periodically (every 90 days recommended)
- Limit workflow permissions to minimum required

## 📊 Monitoring

Check workflow status:
- **Actions Tab**: See all workflow runs
- **NPM Registry**: Verify published versions
- **GitHub Releases**: Track release history

---

**Questions?** Check the workflow files or open an issue for support.

# Release Workflow

This document describes the automated release process for MindReel.

## Overview

MindReel uses an automated release workflow that triggers when a **Pull Request is merged** to the `main` branch. The workflow automatically:

1. Validates code quality (linting, type checking)
2. Runs tests
3. Bumps the version based on **PR title**
4. Builds the application for macOS
5. Publishes to GitHub Releases

**Important:** The workflow only runs on PR merges, NOT on direct pushes to main.

## Automatic Versioning

The version is automatically bumped based on your **PR title** (or commit message if not available) using [Conventional Commits](https://www.conventionalcommits.org/):

### Version Bump Rules

| Commit Type | Version Bump | Example |
|-------------|--------------|---------|
| `BREAKING CHANGE` in message | **Major** (1.0.0 → 2.0.0) | `feat!: redesign database schema` |
| `feat!:` or `fix!:` | **Major** (1.0.0 → 2.0.0) | `feat!: remove deprecated API` |
| `feat:` or `feat(scope):` | **Minor** (1.0.0 → 1.1.0) | `feat: add export functionality` |
| Any other commit | **Patch** (1.0.0 → 1.0.1) | `fix: resolve crash on startup` |

### How It Works

When you merge a PR, the workflow:
1. Reads the **PR title** (e.g., "feat: add dark mode")
2. Checks the **PR description** for `BREAKING CHANGE:`
3. Determines the version bump type
4. Updates `package.json` and creates a git tag

### Examples

**PR Title determines the version bump:**

```
PR Title: "fix: resolve memory leak in capture window"
→ Patch release (1.0.0 → 1.0.1)

PR Title: "feat: add dark mode support"
→ Minor release (1.0.0 → 1.1.0)

PR Title: "feat!: migrate to new database schema"
→ Major release (1.0.0 → 2.0.0)

PR Title: "feat: redesign settings"
PR Description: "BREAKING CHANGE: Settings format has changed"
→ Major release (1.0.0 → 2.0.0)
```

**Individual commit messages in the PR don't matter:**

```
Branch commits:
- "wip: work in progress"
- "fix bug"
- "final touches"

PR Title: "feat: add export functionality"
→ Minor release (1.0.0 → 1.1.0)
```

## Workflow Steps

### 1. Trigger
- Workflow triggers **only when a PR is merged to main**
- Direct pushes to main will NOT trigger a release
- Closed (but not merged) PRs will NOT trigger a release

### 2. Code Validation
- Runs `npm run validate` (type checking + linting)
- Runs `npm run test:run` (unit tests)
- Fails the release if any checks fail

### 3. Version Bump
- Reads the **PR title** to determine version type
- Checks **PR description** for `BREAKING CHANGE:`
- Determines the appropriate version bump (major/minor/patch)
- Updates `package.json` version
- Creates a git commit with message: `chore: bump version to X.Y.Z [skip ci]`
- Creates a git tag (e.g., `v1.2.3`)
- Pushes the commit and tag to GitHub

### 4. Build & Publish
- Runs `npm run publish` (Electron Forge)
- Builds the app for macOS (both Intel and ARM64)
- Creates a draft GitHub Release
- Uploads `.dmg` and `.zip` artifacts

### 5. Release Publishing
- Automatically publishes the draft release
- Release is tagged with the new version

## Creating a Release

### Standard Process (via PR)

1. **Create a feature branch:**
   ```bash
   git checkout -b add-dark-mode
   ```

2. **Make your changes and commit:**
   ```bash
   git commit -m "work in progress"
   git commit -m "still working on it"
   # Individual commit messages don't matter!
   ```

3. **Create a PR with a conventional title:**
   ```
   Title: "feat: add dark mode support"
   ```
   This title determines the version bump!

4. **Merge the PR:**
   - Click "Merge pull request" on GitHub
   - You can edit the PR title before merging if needed
   - The release workflow automatically triggers

5. **Done!** The workflow will:
   - Bump version to 1.1.0 (because of `feat:`)
   - Create tag `v1.1.0`
   - Build and publish the release

### Manual Version Bumping

If you need to manually bump the version without a PR:

```bash
# Patch version (1.0.0 → 1.0.1)
npm run version:patch

# Minor version (1.0.0 → 1.1.0)
npm run version:minor

# Major version (1.0.0 → 2.0.0)
npm run version:major

# Then push the tag
git push --follow-tags
```

Note: Manual version bumps won't trigger the automated release workflow.

## Requirements

### GitHub Secrets

The workflow uses the default `GITHUB_TOKEN` which is automatically provided by GitHub Actions. No additional secrets are required.

### Permissions

The workflow requires the following permissions (already configured):
- `contents: write` - To push version commits, tags, and create releases

## Troubleshooting

### Release fails during build

If the build fails, check the GitHub Actions logs. Common issues:
- Missing native dependencies (sqlite3)
- Code signing issues (if enabled)
- Insufficient disk space

### Version not bumped correctly

Ensure your **PR title** follows the conventional commits format:
- Use `feat:` for new features (minor bump)
- Use `fix:` for bug fixes (patch bump)
- Use `!` suffix for breaking changes (e.g., `feat!:`) (major bump)
- Or add `BREAKING CHANGE:` in the PR description (major bump)

The PR title is what determines the version bump, not individual commit messages!

### Draft release not published

If the draft release isn't automatically published, you can manually publish it from the GitHub Releases page.

## Best Practices

1. **Always use PRs**: The workflow only triggers on PR merges, not direct pushes
2. **Set PR title in conventional format**: This determines the version bump
3. **Use scopes for clarity**: `feat(ui):`, `fix(database):`, etc.
4. **Squash and merge**: Recommended for clean git history
5. **Edit PR title before merging**: If you forgot conventional format, edit it before clicking merge
6. **Test before merging**: Ensure all tests pass locally
7. **Review the workflow logs**: Check GitHub Actions after each release
8. **Update CHANGELOG.md**: Add entries under `[Unreleased]` section in your PR

## Quick Reference

| PR Title Pattern | Version Bump | Example |
|-----------------|--------------|---------|
| `feat:` or `feat(scope):` | Minor | 1.0.0 → 1.1.0 |
| `fix:` or `fix(scope):` | Patch | 1.0.0 → 1.0.1 |
| `feat!:` or `fix!:` | Major | 1.0.0 → 2.0.0 |
| PR desc has `BREAKING CHANGE:` | Major | 1.0.0 → 2.0.0 |
| `chore:`, `docs:`, `refactor:`, etc. | Patch | 1.0.0 → 1.0.1 |

## Related Files

- `.github/workflows/release.yml` - Release workflow configuration
- `forge.config.ts` - Electron Forge configuration
- `package.json` - Version and publish scripts
- [PR Release Flow Guide](./PR_RELEASE_FLOW.md) - Visual guide with examples
- [Quick Release Guide](./QUICK_RELEASE_GUIDE.md) - TL;DR version
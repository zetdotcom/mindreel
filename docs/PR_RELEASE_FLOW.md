# PR to Release Flow Guide

## How Version Bumping Works

When you merge a PR to `main`, the release workflow automatically determines which version to bump by reading your **PR title**.

```
PR Title → Version Bump → Release
```

## The Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CREATE FEATURE BRANCH                                    │
│    git checkout -b add-dark-mode                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. MAKE CHANGES & COMMIT                                    │
│    git commit -m "work in progress"                         │
│    git commit -m "still working"                            │
│    git commit -m "almost done"                              │
│                                                             │
│    💡 Individual commit messages don't matter!              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. CREATE PR WITH CONVENTIONAL TITLE                        │
│    Title: "feat: add dark mode support"                     │
│                     ↑                                        │
│    THIS IS WHAT DETERMINES THE VERSION BUMP!                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. CODE REVIEW & TESTS                                      │
│    ✓ Tests pass on PR                                       │
│    ✓ Code review approved                                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. MERGE PR TO MAIN                                         │
│    Click "Merge pull request" on GitHub                     │
│                                                             │
│    💡 You can edit the PR title before merging if needed    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. RELEASE WORKFLOW TRIGGERS                                │
│    ✓ Reads PR title: "feat: add dark mode support"         │
│    ✓ Determines: feat: = MINOR version bump                │
│    ✓ Current version: 1.2.3                                │
│    ✓ New version: 1.3.0                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. AUTOMATED RELEASE PROCESS                                │
│    ✓ Run validation (typecheck + lint)                     │
│    ✓ Run tests                                              │
│    ✓ Update package.json to 1.3.0                          │
│    ✓ Create git tag v1.3.0                                 │
│    ✓ Build app for macOS (Intel + ARM64)                   │
│    ✓ Create GitHub Release v1.3.0                          │
│    ✓ Upload DMG installers                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    🎉 RELEASE PUBLISHED! 🎉
```

## Examples

### Example 1: Bug Fix (Patch Release)

```
PR Title: "fix: resolve memory leak in capture window"
           ↓
Current version: 1.2.3
New version:     1.2.4  (patch bump)
```

### Example 2: New Feature (Minor Release)

```
PR Title: "feat: add export to PDF functionality"
           ↓
Current version: 1.2.4
New version:     1.3.0  (minor bump)
```

### Example 3: Breaking Change (Major Release)

```
PR Title: "feat!: migrate to new database schema"
           ↓
Current version: 1.3.0
New version:     2.0.0  (major bump)
```

### Example 4: Breaking Change with Description

```
PR Title: "feat: redesign settings interface"

PR Description:
BREAKING CHANGE: Settings file format has changed.
Users will need to reconfigure their preferences.
           ↓
Current version: 2.0.0
New version:     3.0.0  (major bump from BREAKING CHANGE)
```

## PR Title Format Rules

### Pattern Recognition

The workflow checks your PR title in this order:

1. **Major bump:**
   - Contains `!` after type: `feat!:` or `fix!:`
   - OR PR description contains `BREAKING CHANGE:`

2. **Minor bump:**
   - Starts with `feat:` or `feat(scope):`

3. **Patch bump:**
   - Everything else (`fix:`, `chore:`, `docs:`, etc.)

### Valid PR Title Formats

✅ **Good:**
```
feat: add dark mode
feat(ui): redesign settings panel
fix: resolve crash on startup
fix(database): handle corrupted entries
chore: update dependencies
docs: improve installation guide
refactor: simplify window management
test: add e2e tests for capture
feat!: breaking API change
fix(auth)!: remove deprecated login method
```

❌ **Bad:**
```
Add dark mode                    ← No type prefix
Feature: dark mode               ← Wrong format
feat add dark mode               ← Missing colon
FEAT: dark mode                  ← Uppercase type
feat : dark mode                 ← Space before colon
```

## Common Scenarios

### Scenario 1: Multiple Commits in PR

```
Branch commits:
- "wip: starting work"
- "fix bug"
- "refactor code"
- "final touches"

PR Title: "feat: add user preferences"
           ↓
Result: MINOR bump (1.0.0 → 1.1.0)
```

**Why?** Only the PR title matters!

### Scenario 2: Forgot to Use Conventional Format

```
PR Title: "Added dark mode feature"
           ↓
Result: PATCH bump (1.0.0 → 1.0.1)
```

**Fix:** Edit the PR title before merging:
1. Click "Edit" next to PR title
2. Change to: "feat: add dark mode feature"
3. Merge PR
4. Result: MINOR bump (1.0.0 → 1.1.0) ✓

### Scenario 3: Need to Force a Specific Version

If you need a specific version bump regardless of commit type:

**Option 1:** Edit PR title to match desired bump
```
Want major? → Use: "feat!: your change"
Want minor? → Use: "feat: your change"
Want patch? → Use: "fix: your change"
```

**Option 2:** Manually bump after merge
```bash
git checkout main
git pull
npm run version:minor  # or :major, :patch
git push --follow-tags
```

## Checklist for Creating PRs

Before creating a PR:

- [ ] Choose the right type prefix:
  - `feat:` for new features
  - `fix:` for bug fixes
  - `feat!:` or `fix!:` for breaking changes
  - `chore:`, `docs:`, `refactor:`, `test:` for other changes

- [ ] Write a clear, descriptive title after the type
- [ ] Use scope if it adds clarity: `feat(ui):`, `fix(auth):`
- [ ] Add `BREAKING CHANGE:` in description if needed
- [ ] Update CHANGELOG.md under `[Unreleased]` section

Before merging a PR:

- [ ] Verify PR title uses conventional commit format
- [ ] Confirm tests are passing
- [ ] Double-check the intended version bump
- [ ] Merge the PR
- [ ] Watch GitHub Actions to ensure release succeeds

## Tips

1. **Use GitHub's PR template** - Consider creating `.github/pull_request_template.md` with a reminder about conventional titles

2. **Browser extension** - Use a browser extension that validates commit/PR title format

3. **Pre-merge review** - Always review the PR title one last time before clicking merge

4. **Team agreement** - Ensure your team understands that PR titles drive versioning

5. **Squash and merge** - This is the recommended merge strategy for clean history

## Troubleshooting

### "My PR merged but wrong version was bumped"

Check the GitHub Actions log to see what title it read. You can:
1. Manually create the correct tag
2. Or push a new commit with `[skip ci]` and re-merge

### "Release failed during build"

The version was still bumped and tagged. Fix the issue and either:
1. Re-run the failed workflow from GitHub Actions UI
2. Or manually run `npm run publish` locally

### "I want to release without a PR"

You can manually trigger a version bump:
```bash
npm run version:minor
git push --follow-tags
npm run publish
```

## Learn More

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Full Release Workflow Documentation](./release-workflow.md)
- [Quick Release Guide](./QUICK_RELEASE_GUIDE.md)
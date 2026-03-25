# Changelog

All notable changes to MindReel will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release preparation
- Configurable history grouping with effective-dated rules so new sprint-style periods start on the selected boundary without regrouping older history

### Changed
- Refreshed the macOS app icon with a native-first master asset and reproducible icon generation script
- History summary cards now follow the active history period, including multi-week sprint groupings configured in settings
- Expanded the history view default window from two weeks to four weeks before pagination

### Deprecated

### Removed

### Fixed

### Security

## [1.0.0] - 2025-01-XX

### Added
- Daily logging functionality
- AI-powered highlights
- Capture window for quick notes
- SQLite database integration
- Supabase integration
- Cross-platform support (macOS)

---

## How to Update This Changelog

When making changes, add them under the `[Unreleased]` section in the appropriate category:

- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** for vulnerability fixes

When a release is made, move the unreleased changes to a new version section with the release date.

### Example Entry Format

```markdown
## [1.2.0] - 2025-01-15

### Added
- Dark mode support for better night-time usage
- Export functionality for daily logs

### Fixed
- Memory leak in capture window
- Crash on startup with corrupted database
```

[Unreleased]: https://github.com/zetdotcom/mindreel/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/zetdotcom/mindreel/releases/tag/v1.0.0

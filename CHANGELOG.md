# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses semantic versioning.

## [1.2.0] — 2026-08-20

### Added

- RTL support for GitHub repository and directory READMEs and rendered `.md`/`.markdown` file views.
- A GitHub Markdown site adapter scoped to semantic rendered-document roots, with dynamic navigation support.
- Regression coverage for headings, paragraphs, nested and task lists, blockquotes, table cells, links, inline code, fenced code, dynamic insertion, cleanup, and exact text preservation.

### Changed

- Generalized the shared content processor to consume platform-specific scopes while preserving the Azure DevOps adapter behavior.
- Updated popup status copy for both supported environments.

### Security and privacy

- Added only the `https://github.com/*` content-script match; Chrome API permissions remain limited to `storage`.
- GitHub Markdown detection remains local and excludes issues, pull requests, comments, Discussions, raw views, code views, diffs, and editors.

## [1.1.0] — 2026-08-15

### Added

- Popup **Report an issue** action that opens a pre-filled Gmail draft for user-reviewed reports.

### Security and privacy

- Issue drafts include only a static template and extension version; no page data is added automatically or sent without user action.

## [1.0.0] — 2026-08-13

### Added

- Persian/Farsi and Arabic-script direction detection for Azure DevOps text.
- Mixed Persian and English paragraph handling through native browser BiDi behavior.
- Explicit Azure DevOps Rooster line-block support, including inline LTR overrides.
- Persistent, default-OFF user toggle using `chrome.storage.local`.
- SPA and dynamically rendered content handling with a batched `MutationObserver`.
- RTL list-item detection when meaningful Persian/Arabic follows an English prefix, including native ordered/unordered markers.
- Production icons, popup privacy disclosure, public privacy/security documentation, Store submission metadata, and repeatable release validation.

### Security and privacy

- Restricted execution to `dev.azure.com` and `*.visualstudio.com`.
- Limited Chrome API permissions to `storage`.
- Confirmed local-only RTL processing with no analytics, telemetry, remote code, or automatic Azure DevOps content transmission.

## [0.1.2] — 2026-08-13

### Fixed

- Targeted the actual Rooster text line carrying inline `direction:ltr` while leaving the editor root unchanged.

## [0.1.1] — 2026-08-13

### Changed

- Introduced logical-block selection and Persian-dominance regression coverage.

## [0.1.0] — 2026-08-13

### Added

- Initial Manifest V3 extension, popup toggle, RTL detector, and Azure DevOps SPA support.

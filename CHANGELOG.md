# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses semantic versioning.

## [1.0.0] — 2026-08-13

### Added

- Persian/Farsi and Arabic-script direction detection for Azure DevOps text.
- Mixed Persian and English paragraph handling through native browser BiDi behavior.
- Explicit Azure DevOps Rooster line-block support, including inline LTR overrides.
- Persistent, default-OFF user toggle using `chrome.storage.local`.
- SPA and dynamically rendered content handling with a batched `MutationObserver`.
- Production icons, popup privacy disclosure, public privacy/security documentation, Store submission metadata, and repeatable release validation.

### Security and privacy

- Restricted execution to `dev.azure.com` and `*.visualstudio.com`.
- Limited Chrome API permissions to `storage`.
- Confirmed local-only processing with no analytics, telemetry, remote code, or outbound content transmission.

## [0.1.2] — 2026-08-13

### Fixed

- Targeted the actual Rooster text line carrying inline `direction:ltr` while leaving the editor root unchanged.

## [0.1.1] — 2026-08-13

### Changed

- Introduced logical-block selection and Persian-dominance regression coverage.

## [0.1.0] — 2026-08-13

### Added

- Initial Manifest V3 extension, popup toggle, RTL detector, and Azure DevOps SPA support.

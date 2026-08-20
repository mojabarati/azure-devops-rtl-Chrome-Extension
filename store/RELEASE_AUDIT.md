# Release Audit — Version 1.3.0

Audit date: August 20, 2026

Status: **Prepared for Chrome Web Store submission based on the audited implementation.** Final policy review and approval belong to Google, and the manual tasks below remain with the publisher.

## Manifest

- Manifest V3.
- Name: Azure DevOps RTL Fixer.
- Version: 1.3.0.
- Description: 86 characters, under Chrome's 132-character limit.
- All icon, popup, service-worker, content-script, and CSS references exist.

## Permissions

- `storage` is the only Chrome API permission.
- It stores only the local Boolean `azureRtlFixEnabled` and `githubRtlFixEnabled` preferences, with one-time fallback from the legacy `rtlFixEnabled` value.
- No `tabs`, `activeTab`, `scripting`, network interception, cookies, history, notifications, or management permission.

## Host permissions

- No `host_permissions` key.
- Static content-script scope is limited to `https://dev.azure.com/*`, `https://*.visualstudio.com/*`, and `https://github.com/*`.
- GitHub code further limits processing to repository/directory READMEs and rendered `.md`/`.markdown` file roots.
- No `<all_urls>` access.

## Remote code

No remote executable code was found. Runtime code is local vanilla JavaScript and CSS. No remote scripts, imports, CDNs, `eval`, or `new Function` are present.

## Network calls

No background `fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, analytics, or telemetry code was found in runtime files. The popup contains one user-initiated HTTPS navigation to Gmail for the optional **Report an issue** draft.

## Stored data

Only `azureRtlFixEnabled: boolean` and `githubRtlFixEnabled: boolean` are persisted as current settings using `chrome.storage.local`. A legacy `rtlFixEnabled: boolean` value may remain after migration but is not the ongoing source of truth. No Azure DevOps or GitHub content or identifying site information is stored.

## Locally processed data

When enabled, rendered Azure DevOps content and supported GitHub Markdown may be read transiently from the DOM to classify text direction. GitHub issues, pull requests, comments, Discussions, raw views, code views, diffs, and editors are excluded.

## Third-party data sharing

No Azure DevOps or GitHub content or usage data is transmitted automatically to the developer or third parties. The Gmail draft contains only a static template and extension version unless the user adds information, and nothing is sent until the user chooses to send it.

## Analytics

None.

## Advertising

None. No profiling, affiliate links, or monetization logic exists.

## Security

- Default setting is OFF.
- Processing begins only when the stored preference for the current platform is enabled.
- Text and site-owned inline styles are not rewritten.
- Disabling removes the extension-added class.
- No obvious credential assignments or private-key blocks were found in the repository scan.

## Tests

- Automated detector, manifest, permission, icon, popup-report, adapter-scope, GitHub Markdown, and Rooster fixture tests pass.
- Browser fixture confirms the actual inline-LTR Rooster line computes to RTL while enabled and restores to LTR when disabled.
- Browser fixture confirms GitHub logical blocks, list markers, inline/fenced code, dynamic insertion, exact text preservation, and disable cleanup.
- Exact `textContent` preservation is asserted.

## Release package

`npm run package` creates `dist/azure-devops-rtl-fixer-v1.3.0.zip` with `manifest.json` at the ZIP root. Only `manifest.json`, `icons/`, and `src/` are shipped.

## Outstanding manual tasks

- Confirm the public repository, support email, and Privacy Policy URLs in the Store Dashboard.
- Host the Privacy Policy at a public HTTPS URL.
- Produce sanitized Store screenshots and promotional artwork.
- Decide whether the current Azure-like logo and product naming present unacceptable trademark or affiliation risk. The 128px artwork also sits close to some canvas edges, which may be a Store presentation/padding concern; it was preserved as instructed.
- Perform final real-Chrome and real-Azure-DevOps smoke tests with the exact release candidate.
- Perform final real-Chrome tests on a GitHub README, rendered `.md` file, client-side navigation, and excluded GitHub surfaces.
- Verify that **Report an issue** opens the expected pre-filled Gmail draft without Azure DevOps data.
- Complete Dashboard disclosures, upload assets/ZIP, and submit for review.

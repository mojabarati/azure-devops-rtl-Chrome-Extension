# Release Audit — Version 1.0.0

Audit date: August 13, 2026

Status: **Prepared for Chrome Web Store submission based on the audited implementation.** Final policy review and approval belong to Google, and the manual tasks below remain with the publisher.

## Manifest

- Manifest V3.
- Name: Azure DevOps RTL Fixer.
- Version: 1.0.0.
- Description: 102 characters, under Chrome's 132-character limit.
- All icon, popup, service-worker, content-script, and CSS references exist.

## Permissions

- `storage` is the only Chrome API permission.
- It stores only the local Boolean `rtlFixEnabled` preference.
- No `tabs`, `activeTab`, `scripting`, network interception, cookies, history, notifications, or management permission.

## Host permissions

- No `host_permissions` key.
- Static content-script scope is limited to `https://dev.azure.com/*` and `https://*.visualstudio.com/*`.
- No `<all_urls>` access.

## Remote code

No remote executable code was found. Runtime code is local vanilla JavaScript and CSS. No remote scripts, imports, CDNs, `eval`, or `new Function` are present.

## Network calls

No `fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, analytics, telemetry, or third-party networking code was found in runtime files.

## Stored data

Only `rtlFixEnabled: boolean` is persisted using `chrome.storage.local`. No Azure DevOps content or identifying site information is stored.

## Locally processed data

When enabled, rendered Azure DevOps website and user-generated content may be read transiently from the DOM to classify text direction. This can include titles, descriptions, discussions, Acceptance Criteria, Repro Steps, and other rendered text fields.

## Third-party data sharing

No Azure DevOps content or usage data is transmitted to or shared with the developer or third parties.

## Analytics

None.

## Advertising

None. No profiling, affiliate links, or monetization logic exists.

## Security

- Default setting is OFF.
- Processing begins only when the stored user preference is enabled.
- Text and Azure-owned inline styles are not rewritten.
- Disabling removes the extension-added class.
- No obvious credential assignments or private-key blocks were found in the repository scan.

## Tests

- Automated detector, manifest, permission, icon, and Rooster fixture tests pass.
- Browser fixture confirms the actual inline-LTR Rooster line computes to RTL while enabled and restores to LTR when disabled.
- Exact `textContent` preservation is asserted.

## Release package

`npm run package` creates `dist/azure-devops-rtl-fixer-v1.0.0.zip` with `manifest.json` at the ZIP root. Only `manifest.json`, `icons/`, and `src/` are shipped.

## Outstanding manual tasks

- Publish and configure the real repository/support URLs.
- Host the Privacy Policy at a public HTTPS URL.
- Add a non-invented contact or private security-reporting route.
- Produce sanitized Store screenshots and promotional artwork.
- Decide whether the current Azure-like logo and product naming present unacceptable trademark or affiliation risk. The 128px artwork also sits close to some canvas edges, which may be a Store presentation/padding concern; it was preserved as instructed.
- Perform final real-Chrome and real-Azure-DevOps smoke tests with the exact release candidate.
- Complete Dashboard disclosures, upload assets/ZIP, and submit for review.

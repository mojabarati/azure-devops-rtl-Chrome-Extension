# Chrome Web Store Publishing Checklist

## Repository and release

- [x] Manifest V3 reviewed.
- [x] Version finalized as `1.2.0` for the GitHub rendered-Markdown feature release.
- [x] Manifest description reviewed and within 132 characters.
- [x] Permissions audited and minimized.
- [x] Website access limited to supported Azure DevOps hosts and `github.com`.
- [x] `<all_urls>` absent.
- [x] Remote-code audit passed.
- [x] Background network-call audit passed; optional Gmail navigation documented.
- [x] Obvious-secret scan passed.
- [x] Privacy Policy created.
- [x] Limited Use disclosure present.
- [x] Store listing copy written.
- [x] Single-purpose statement written.
- [x] Permission justifications written.
- [x] Privacy Practices preparation written.
- [x] Production icons validated.
- [x] Tests passing.
- [x] Rooster computed-direction regression passing.
- [x] GitHub rendered-Markdown scope, direction, code-isolation, dynamic-content, and cleanup regression passing.
- [x] Release ZIP generated.
- [x] `manifest.json` verified at ZIP root.
- [x] Release ZIP limited to runtime files.

## Manual publisher tasks

- [ ] Publish the GitHub repository and configure its remote.
- [x] Add a real public support/contact route to `PRIVACY.md` and `SECURITY.md`.
- [ ] Host `PRIVACY.md` at a stable public HTTPS URL.
- [ ] Review the independent-project name and Azure-like logo for Microsoft trademark/Store presentation risk.
- [ ] Capture at least one sanitized 1280×800 screenshot; up to five may be supplied.
- [ ] Prepare the required 440×280 small promotional tile.
- [ ] Optionally prepare a 1400×560 marquee promotional image.
- [ ] Verify screenshots contain no private URLs, credentials, employee data, customer data, or confidential work-item content.
- [ ] Load the exact unpacked release candidate in desktop Chrome.
- [ ] Verify toolbar icon, management-page icon, and popup logo.
- [ ] Verify both platform toggles and preferences after a real browser restart.
- [ ] Verify **Report an issue** opens the expected pre-filled Gmail draft and includes no Azure DevOps or GitHub data automatically.
- [ ] Verify RTL behavior on a sanitized Azure DevOps work item.
- [ ] Verify OFF restoration on a real Azure DevOps work item.
- [ ] Verify RTL behavior and OFF restoration on a public GitHub README and rendered `.md` file.
- [ ] Verify GitHub issues, comments, code views, and diffs remain unchanged.
- [ ] Inspect Chrome DevTools for extension-originated network activity and console errors.
- [ ] Manually smoke-test the exact ZIP contents before upload.
- [ ] Register or confirm the Chrome Web Store developer account.
- [ ] Create the Store item and upload the final ZIP.
- [ ] Complete Store listing, category, language, support, and privacy-policy URL fields.
- [ ] Complete Privacy Practices answers using `PRIVACY_DISCLOSURE.md`.
- [ ] Review and accept the required Dashboard certifications.
- [ ] Upload Store icon, screenshots, and promotional images.
- [ ] Confirm distribution visibility and regions.
- [ ] Submit the item for Google review.

# Azure DevOps RTL Fixer

Azure DevOps RTL Fixer improves Persian/Farsi and other right-to-left text readability in Azure DevOps, including paragraphs containing English technical terms. It changes presentation only: work-item text remains exactly as stored.

> Azure DevOps RTL Fixer is an independent project and is not affiliated with or endorsed by Microsoft.

## Screenshot and demo

Chrome Web Store screenshots are being prepared. The publication plan is documented in [`store/assets/screenshots/README.md`](store/assets/screenshots/README.md); no private Azure DevOps screenshots are included in this repository.

## The problem

Azure DevOps uses an LTR interface and its Rooster rich-text editor can give rendered lines an explicit LTR direction. This can make Persian sentences containing terms such as `ai specialist`, `REST API`, or `Activation` appear in a confusing visual order.

Example:

> در صورتی که ai specialist پورتفولیوی خود را غیرفعال کرد بنر جهت Activation نمایش داده شود.

## What it does

When the user turns the extension on, a local content script examines rendered text on supported Azure DevOps pages. Persian-dominant logical text blocks receive a narrowly scoped class that sets an RTL base direction and right alignment. English-only blocks, application layout, images, toolbars, and code areas remain unchanged.

The extension specifically supports Azure DevOps Rooster editor lines that use inline `direction:ltr`. It overrides the computed direction with a class without changing Azure's inline style, text, or saved work-item data.

## Features

- Persian/Arabic Unicode detection with mixed Persian and English handling.
- Azure DevOps Rooster view-mode and editing support.
- Work-item descriptions, titles where applicable, discussions, Acceptance Criteria, Repro Steps, and text fields.
- Scoped SPA updates through one batched `MutationObserver`; no polling.
- Persistent, explicit ON/OFF toggle, defaulting to OFF.
- Exact reversal of the extension-added presentation class when disabled.
- No analytics, telemetry, advertising, remote code, or outbound content transmission.

## Supported sites

- `https://dev.azure.com/*`
- `https://*.visualstudio.com/*`

Self-hosted Azure DevOps Server domains are not included in version 1.0.0.

## Installation from the Chrome Web Store

The extension has not been published yet. A Store URL will be added only after the listing is live.

## Manual installation

1. Download or clone this repository.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Choose the repository directory containing `manifest.json`.
6. Reload any Azure DevOps tab that was already open.

## Usage

1. Open a supported Azure DevOps page.
2. Select the Azure DevOps RTL Fixer toolbar icon.
3. Turn **RTL Fix** on.

The preference is stored locally and survives browser restarts. Turning the feature off removes its presentation changes immediately without reloading Azure DevOps.

## Privacy

Azure DevOps RTL Fixer locally accesses rendered website and user-generated text only to determine direction and apply its user-facing RTL formatting feature. Page content is not persisted or transmitted to the developer or third parties. Only the Boolean `rtlFixEnabled` preference is stored with `chrome.storage.local`.

There is no analytics, telemetry, tracking, advertising, profiling, or sale of data. See the full [Privacy Policy](PRIVACY.md), including the Limited Use disclosure.

```text
Azure DevOps DOM → local content script → local RTL detection → local CSS class
```

## Permissions

The manifest requests one Chrome API permission:

- `storage` — remembers the user's ON/OFF preference locally.

The static content script is restricted to the two supported Azure DevOps cloud URL patterns. The extension does not request `tabs`, `activeTab`, `scripting`, `webRequest`, cookies, history, or `<all_urls>` access. Reviewer-facing details are in [`store/PERMISSIONS.md`](store/PERMISSIONS.md).

## Architecture

```text
manifest.json
icons/
src/
├── background/service-worker.js
├── content/
│   ├── azure-selectors.js
│   ├── content.js
│   ├── dom-utils.js
│   ├── rtl-detector.js
│   └── rtl.css
└── popup/
    ├── popup.html
    ├── popup.css
    └── popup.js
```

The service worker initializes the default-disabled preference. The popup owns explicit user control. The content script operates only while enabled, resolves RTL text nodes to logical blocks, and handles dynamically rendered SPA content. Rooster contenteditable roots remain LTR containers; their actual line blocks receive `.ado-rtl-text-block` when appropriate.

## Development

Requirements:

- Node.js 18 or newer
- Windows PowerShell for the release packaging command

No npm dependencies are required.

```bash
npm test
npm run check
```

Debug logging is disabled by default. For local troubleshooting, set `DEBUG` to `true` in `src/content/content.js`. `AdoRtlFixerDebug.inspect(element)` and `inspectRooster(editor)` report relevant computed direction information.

## Testing

The automated suite covers Persian, English, mixed-language, neutral technical values, Manifest V3 scope, icon references, and the supplied Azure DevOps Rooster structure. The browser fixture verifies that an actual line with inline `direction:ltr` computes to RTL while enabled, preserves exact `textContent`, and returns to LTR when disabled.

```bash
npm test
python -m http.server 8765
```

Then open `http://127.0.0.1:8765/tests/fixtures/rooster-editor.html`. Add `?hold=1` to keep the enabled DOM visible for inspection.

## Building a release

Create a minimal Chrome Web Store ZIP:

```bash
npm run package
```

Run the complete local validation, tests, packaging, and ZIP structure check:

```bash
npm run release:check
```

The versioned archive is created in `dist/` with `manifest.json` directly at its root. Development documentation, tests, Store assets, and repository metadata are excluded.

## Known limitations

- Azure DevOps can change its DOM; Rooster-specific selectors are isolated for maintenance.
- Cross-origin iframes and shadow roots are not processed.
- Self-hosted Azure DevOps domains require an explicit manifest match pattern.
- Unusual authored BiDi control characters or heavily embedded interactive content may still affect browser-native ordering.

## Contributing

Focused issues and pull requests are welcome after the repository is published. Use sanitized examples only—never include credentials, private organization URLs, employee information, or confidential work-item content. Run `npm run release:check` before submitting release-related changes.

## Security

See [`SECURITY.md`](SECURITY.md). Do not publish secrets or confidential Azure DevOps content in a public issue.

## Changelog

See [`CHANGELOG.md`](CHANGELOG.md).

## Privacy Policy

See [`PRIVACY.md`](PRIVACY.md).

## License

Licensed under the [MIT License](LICENSE).

## Disclaimer

Azure DevOps and Microsoft are trademarks of Microsoft Corporation. This independent extension is not affiliated with, sponsored by, or endorsed by Microsoft. Product names are used only to describe compatibility.

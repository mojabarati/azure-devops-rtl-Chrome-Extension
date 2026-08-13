# Azure DevOps RTL Fixer

A small, privacy-first Chrome extension that makes Persian and Arabic text easier to read inside Azure DevOps. It fixes visual direction and alignment while leaving work-item content exactly as stored.

Version: **v0.1.0**

## The problem

Azure DevOps has an LTR interface. Persian sentences that contain English technical terms can therefore appear in a confusing visual order. For example:

> در صورتی که ai specialist پورتفولیوی خود را غیرفعال کرد بنر جهت Activation نمایش داده شود.

The extension gives the containing paragraph an RTL base direction. The browser's Unicode Bidirectional Algorithm keeps `ai specialist` and `Activation` as readable LTR runs. No words, characters, spaces, or saved field values are changed.

## Screenshots

Before/after screenshots can be added at:

- `docs/before.png`
- `docs/after.png`

## Features

- Handles Persian and Arabic text in work-item titles, descriptions, discussion, rich-text fields, acceptance criteria, repro steps, and custom text fields.
- Supports mixed Persian/English paragraphs without reversing or rewriting strings.
- Supports text inputs, textareas, `contenteditable`, and ARIA textboxes while typing.
- Observes scoped DOM additions for Azure DevOps SPA navigation and lazy-loaded comments.
- Applies a narrowly scoped CSS class and `dir="rtl"` only to detected text containers.
- Restores only the class and attribute changes made by this extension when disabled.
- Leaves English, numeric-only text, standalone URLs, email addresses, GUIDs, and code areas alone.
- Runs entirely in the browser with no analytics, network requests, or remote code.

## Supported URLs

- `https://dev.azure.com/*`
- `https://*.visualstudio.com/*`

Self-hosted Azure DevOps Server domains are not included in v0.1.0. They can be added later by extending the manifest match patterns.

## Install locally

1. Download or clone this repository.
2. Open `chrome://extensions` in Google Chrome.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Choose the repository folder containing `manifest.json`.
6. Open Azure DevOps, select the extension icon, and turn **RTL Fix** on.

If an Azure DevOps tab was already open during installation, reload that tab once so Chrome can inject the content script.

## Use

The popup stores one global ON/OFF setting. When enabled, supported Azure DevOps pages are processed immediately and newly rendered content is handled automatically. Turning it off restores the original `dir` value and removes the extension's CSS class without requiring a reload.

On unsupported pages the popup says: “Open an Azure DevOps page to use RTL Fixer.”

## How it works

### Direction detection

`src/content/rtl-detector.js` recognizes the Arabic Unicode blocks that include Persian-specific characters such as `پ`, `چ`, `ژ`, `گ`, `ک`, and `ی`. A paragraph containing any relevant character is classified as RTL. English-only text is classified as LTR; empty, numeric-only, URL, email, and GUID values are neutral.

### Mixed-language BiDi rendering

Detected containers receive:

```css
.ado-rtl-fixer {
  direction: rtl;
  text-align: right;
  unicode-bidi: isolate;
}
```

`direction: rtl` gives the complete paragraph the intended base direction, including sentences that start with an English term such as `API`. `unicode-bidi: isolate` keeps the paragraph's bidirectional ordering from affecting neighboring Azure DevOps UI. Native browser BiDi handling preserves embedded English runs in LTR order.

The extension intentionally does not use string reversal, `innerHTML`, text-node replacement, or inserted directional characters.

### DOM safety and SPA updates

The content script performs one initial scan when enabled. A single `MutationObserver` then queues only added or edited subtrees. Work is deduplicated, split into bounded batches, and scheduled during idle time where available. Captured `input` and `change` events update editable fields without polling.

Generic `div` and `span` processing is limited to leaf-like text containers. Script, style, code, preformatted text, buttons, SVG, canvas, hidden content, and Monaco editors are excluded. Azure-specific selector hints are isolated in `src/content/azure-selectors.js`.

### Disable behavior

Before changing an element, the extension records whether it already had a `dir` attribute and its exact value. Disabling restores that value (or removes the extension-added attribute) and removes only the CSS class added by the extension.

## Architecture

```text
azure-devops-rtl-fixer/
├── manifest.json
├── src/
│   ├── background/service-worker.js
│   ├── content/
│   │   ├── azure-selectors.js
│   │   ├── content.js
│   │   ├── rtl-detector.js
│   │   └── rtl.css
│   └── popup/
│       ├── popup.html
│       ├── popup.css
│       └── popup.js
├── icons/
├── scripts/generate-icons.js
└── tests/
```

The service worker initializes the default disabled setting. The popup reads and updates it. The content script owns detection, observation, and reversible visual changes.

## Permissions

The extension requests only:

- `storage` — persists the ON/OFF setting across reloads and browser restarts.

Content scripts are limited by manifest match patterns to the two supported Azure DevOps cloud URL families. There is no `tabs`, `activeTab`, scripting, clipboard, cookies, web request, or broad all-sites permission.

## Privacy and security

All analysis happens locally in the current page. The extension does not collect or transmit work-item text, credentials, organization/project information, telemetry, or analytics. It performs no network requests and contains no remote JavaScript, `eval`, unsafe HTML injection, or dynamic code execution.

## Development

Node.js 18 or newer is sufficient. There are no runtime or development package dependencies.

```bash
npm test
npm run check
```

Regenerate the checked-in PNG icons after changing the icon generator:

```bash
npm run icons
```

To debug DOM behavior locally, set `DEBUG` to `true` near the top of `src/content/content.js`. It is `false` by default.

## Testing checklist

After loading unpacked, verify these cases in a non-production test work item:

1. Persian-only and mixed Persian/English title and description fields become RTL.
2. `API مربوط به دریافت اطلاعات کاربر پیاده سازی شود.` uses an RTL paragraph base even though it begins with English.
3. English-only fields remain unchanged.
4. Comments loaded after opening Discussion are processed.
5. Persian typing in a title, textarea, or rich-text editor remains usable.
6. Switching Azure DevOps routes or work-item tabs processes new content.
7. Turning the extension off restores original rendering without changing saved text.

Automated tests cover Unicode detection, mixed-language examples, neutral technical values, permission scope, URL matches, and manifest file references.

## Known limitations

- Azure DevOps can change its markup. Generic semantic detection reduces this dependency, while Azure-specific hints are kept in one file for maintenance.
- Text rendered inside cross-origin iframes or a shadow root is not processed in v0.1.0.
- The extension sets paragraph-level direction. It does not add explicit isolation around individual English phrases; native browser BiDi handles normal technical terms, but unusually complex punctuation may still depend on how the text was authored.
- Self-hosted Azure DevOps Server domains require an explicit manifest match pattern before use.

## Contributing

Issues and focused pull requests are welcome. Please include a sanitized text example, the Azure DevOps area affected, expected direction, and Chrome version. Run `npm test` and `npm run check` before submitting changes.

## Publish to GitHub

If this copy does not already have a remote, the GitHub CLI can create the public repository and push the current branch:

```bash
gh auth login
gh repo create azure-devops-rtl-fixer --public --source=. --remote=origin --push
```

Or create an empty repository in GitHub's web interface, then run:

```bash
git remote add origin https://github.com/YOUR-USERNAME/azure-devops-rtl-fixer.git
git push -u origin main
```

## License

[MIT](LICENSE)

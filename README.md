# Azure DevOps RTL Fixer

A small, privacy-first Chrome extension that makes Persian and Arabic text easier to read inside Azure DevOps. It fixes visual direction and alignment while leaving work-item content exactly as stored.

Version: **v0.1.1**

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
- Resolves RTL text nodes to one logical paragraph/block; ordinary inline spans never become nested RTL roots.
- Isolates complete English technical runs with generated, reversible `<bdi dir="ltr">` wrappers in read-only content.
- Detects and narrowly neutralizes conflicting LTR/isolate styles on Persian-containing descendants.
- Restores only the class and attribute changes made by this extension when disabled.
- Leaves English, numeric-only text, standalone URLs, email addresses, GUIDs, and code areas alone.
- Runs entirely in the browser with no analytics, network requests, or remote code.

## Supported URLs

- `https://dev.azure.com/*`
- `https://*.visualstudio.com/*`

Self-hosted Azure DevOps Server domains are not included in v0.1.1. They can be added later by extending the manifest match patterns.

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

`src/content/rtl-detector.js` recognizes strong Arabic-script letters, including Persian-specific characters such as `پ`, `چ`, `ژ`, `گ`, `ک`, and `ی`. It separately counts strong RTL/LTR letters and word runs; punctuation, whitespace, and numbers do not vote on direction. A paragraph is RTL when Persian is dominant by character or grammatical word structure, so a sentence can begin with `Feature Flag` and still receive the intended RTL base. English-only text remains LTR; empty, numeric-only, URL, email, and GUID values are neutral.

### Mixed-language BiDi rendering

Detected containers receive:

```css
.ado-rtl-block {
  direction: rtl;
  text-align: right;
  unicode-bidi: isolate;
}
```

`direction: rtl` gives one logical paragraph the intended base direction. `unicode-bidi: isolate` prevents that paragraph from affecting neighboring Azure DevOps UI. In read-only fields, a small scanner groups technical runs such as `ai specialist`, `REST API`, `API v2`, `Node.js`, `feature-flag`, `GET /api/users`, `C#`, and `.NET`, then places each complete phrase inside a generated `<bdi dir="ltr">`. Phrases split across adjacent inline spans are grouped into one isolate where it is safe to preserve their order.

Every generated element carries `data-ado-rtl-generated="true"`. Before and after wrapping, the processor checks that the block's exact `textContent` is unchanged.

The extension intentionally does not use string reversal, `innerHTML`, text-node replacement, or inserted directional characters.

### DOM safety and SPA updates

The content script performs one initial text-node walk when enabled. For each RTL text node, `findLogicalTextBlock()` selects the nearest semantic paragraph (`p`, `li`, `blockquote`, table cell, heading, and similar) or a leaf-like text `div`. A `Set` deduplicates those roots. Parent panels and inline elements such as `span`, `strong`, `em`, and `a` are never chosen merely because their `textContent` includes Persian.

A single `MutationObserver` queues only added or edited subtrees. Work is deduplicated, split into bounded batches, and scheduled during idle time where available. Captured `input` and `change` events update editable roots without polling.

Script, style, code, preformatted text, buttons, SVG, canvas, hidden content, and Monaco editors are excluded. A confirmed read-only RTL block may receive generated LTR isolates. Inputs, textareas, `contenteditable`, ARIA textboxes, and rich-text editor roots receive direction only: the extension never splits or wraps their text nodes, protecting caret, selection, undo history, and framework state.

For Azure descendants that contain Persian but already compute to an isolated LTR context, the extension adds a tracked reset class inside that confirmed block. It does not delete Azure-owned `dir`, style, or class values.

### Disable behavior

Before changing a block, the extension records whether it already had a `dir` attribute and its exact value. Disabling unwraps only generated `<bdi>` nodes, removes generated/reset classes, restores original direction attributes, and preserves exact text without reloading the page.

## Architecture

```text
azure-devops-rtl-fixer/
├── manifest.json
├── src/
│   ├── background/service-worker.js
│   ├── content/
│   │   ├── azure-selectors.js
│   │   ├── content.js
│   │   ├── dom-utils.js
│   │   ├── rtl-detector.js
│   │   └── rtl.css
│   └── popup/
│       ├── popup.html
│       ├── popup.css
│       └── popup.js
├── icons/
├── scripts/generate-icons.js
└── tests/
    ├── fixtures/nested-azure-devops.html
    ├── manifest.test.js
    └── rtl-detector.test.js
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

To debug DOM behavior locally, set `DEBUG` to `true` near the top of `src/content/content.js`. It is `false` by default. The content script logs the logical block plus relevant ancestors/direct children, including tag, class, `dir`, computed direction, `unicode-bidi`, and display. In the extension execution context, `AdoRtlFixerDebug.inspect(element)` performs the same inspection on demand.

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

The browser regression fixture represents a nested Azure DevOps rich-text DOM and checks logical-block selection, complete English phrase isolation, dynamic insertion, conflicting child direction, editable safety, exact `textContent`, and disable restoration:

```bash
python -m http.server 8765
```

Then open `http://127.0.0.1:8765/tests/fixtures/nested-azure-devops.html`. Its title and assertions report PASS/FAIL. Add `?hold=1` to keep the enhanced DOM in place for visual inspection.

## Known limitations

- Azure DevOps can change its markup. Generic semantic detection reduces this dependency, while Azure-specific hints are kept in one file for maintenance.
- Text rendered inside cross-origin iframes or a shadow root is not processed in v0.1.1.
- Deeply fragmented English phrases with intervening non-inline widgets are left to native BiDi handling; the extension does not move interactive controls to manufacture a phrase wrapper.
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

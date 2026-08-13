# Azure DevOps RTL Fixer

A small, privacy-first Chrome extension that makes Persian and Arabic text easier to read inside Azure DevOps. It fixes visual direction and alignment while leaving work-item content exactly as stored.

Version: **v0.1.2**

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
- Explicitly supports Azure DevOps Rooster editors, including their inline `direction:ltr` line blocks.
- Overrides direction with a class only; it never changes Azure-owned inline styles or inserts `<bdi>` wrappers.
- Restores only the class and attribute changes made by this extension when disabled.
- Leaves English, numeric-only text, standalone URLs, email addresses, GUIDs, and code areas alone.
- Runs entirely in the browser with no analytics, network requests, or remote code.

## Supported URLs

- `https://dev.azure.com/*`
- `https://*.visualstudio.com/*`

Self-hosted Azure DevOps Server domains are not included in v0.1.2. They can be added later by extending the manifest match patterns.

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
.ado-rtl-text-block {
  direction: rtl !important;
  text-align: right !important;
}
```

`direction: rtl` sets the Unicode BiDi base direction on the actual logical block. The scoped `!important` is required because Azure DevOps Rooster writes `direction:ltr` directly into each line's inline style. The original inline value remains untouched and becomes effective again as soon as the class is removed.

The extension does not set `unicode-bidi` and does not create `<bdi>` or other wrapper nodes. Embedded English phrases are handled by the browser's native Unicode Bidirectional Algorithm once the real paragraph base direction is correct.

The extension intentionally does not use string reversal, `innerHTML`, text-node replacement, or inserted directional characters.

### DOM safety and SPA updates

The content script performs one initial text-node walk when enabled. For each RTL text node, `findLogicalTextBlock()` selects the nearest semantic paragraph (`p`, `li`, `blockquote`, table cell, heading, and similar) or a leaf-like text `div`. A `Set` deduplicates those roots. Parent panels and inline elements such as `span`, `strong`, `em`, and `a` are never chosen merely because their `textContent` includes Persian.

Rooster is a special case: `.lean-rooster.rooster-editor` remains an LTR container even when it has `contenteditable="true"` in view mode. Text nodes inside it resolve to their nearest actual line block, such as `<div style="direction:ltr">`, rather than to the editor root. Empty lines, image containers, and `.rooster-command-bar` are ignored.

A single `MutationObserver` queues only added or edited subtrees. Work is deduplicated, split into bounded batches, and scheduled during idle time where available. Captured `input` and `change` events update editable roots without polling.

Script, style, code, preformatted text, buttons, SVG, canvas, hidden content, Monaco editors, and Rooster command bars are excluded. The extension never splits, wraps, replaces, or reorders text nodes, protecting caret, selection, undo history, and framework state.

### Disable behavior

The extension changes only one class token. Disabling removes `.ado-rtl-text-block`; Azure's original inline `direction:ltr`, editor `dir="ltr"`, DOM structure, and exact text remain unchanged and immediately regain control without a reload.

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
    ├── fixtures/rooster-editor.html
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

To debug DOM behavior locally, set `DEBUG` to `true` near the top of `src/content/content.js`. It is `false` by default. For Rooster, the content script logs the editor, actual line block, and nested span with their text, `dir`, inline direction, computed direction, alignment, `unicode-bidi`, and display. In the extension execution context, use `AdoRtlFixerDebug.inspect(element)` or `AdoRtlFixerDebug.inspectRooster(editor)` on demand.

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

The browser regression fixture contains the observed Azure DevOps Rooster markup: an LTR editor root, a Persian child line with inline `direction:ltr`, an inline span, empty lines, an English line, image content, and a command bar. It asserts the actual child line's computed direction, dynamic input behavior, exact `textContent`, and disable restoration:

```bash
python -m http.server 8765
```

Then open `http://127.0.0.1:8765/tests/fixtures/rooster-editor.html`. Its title and assertions report PASS/FAIL. Add `?hold=1` to keep the enhanced DOM in place for computed-style and visual inspection.

## Known limitations

- Azure DevOps can change its markup. Generic semantic detection reduces this dependency, while Azure-specific hints are kept in one file for maintenance.
- Text rendered inside cross-origin iframes or a shadow root is not processed in v0.1.2.
- English technical terms use native BiDi behavior. The extension deliberately does not manufacture phrase wrappers inside Rooster content.
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

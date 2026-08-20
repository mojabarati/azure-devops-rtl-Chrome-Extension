# Privacy Practices Preparation

> **Suggested Chrome Web Store disclosure — verify before submission.** Dashboard wording and policy interpretation can change. This document summarizes the audited implementation and is not legal advice.

## Single purpose

Improve readability of Persian and other RTL text in supported Azure DevOps content and GitHub rendered Markdown by locally applying text-direction formatting.

## Data handled locally

The extension accesses and locally processes rendered content on supported Azure DevOps pages and GitHub rendered-Markdown documents. Depending on the page, this can include:

- website content and resources;
- user-generated content;
- work-item titles and descriptions;
- comments and discussions;
- Acceptance Criteria, Repro Steps, and other rendered text fields.
- GitHub Markdown headings, paragraphs, list items, blockquotes, and table cells.

This content is read transiently from the DOM only to determine RTL presentation. Do not answer that the extension handles no user data merely because processing is local.

## Suggested data-type selections

- **Website content:** Yes — locally accessed and processed for RTL formatting.
- **User-generated content:** Yes — work-item text and comments may be locally processed.
- **Web history/browsing history:** No — the extension does not read the History API or maintain a browsing record.
- **Authentication information:** No.
- **Personally identifiable information:** Not intentionally requested or extracted. Such information could incidentally appear inside page text, but it is neither identified, stored, nor transmitted by the extension.
- **Location, financial, health, or payment information:** No feature intentionally requests or processes these categories. Incidental text remains local and is treated only as characters for direction detection.

Verify the current Dashboard categories and disclose conservatively if its wording treats any locally accessed page content under an additional category.

## URLs and site access

Chrome injects static content scripts only on `dev.azure.com`, `*.visualstudio.com`, and `github.com` according to manifest match patterns. GitHub processing is additionally restricted to repository/directory READMEs and rendered `.md`/`.markdown` files. Extension code does not read, log, store, or transmit the current URL, organization, project, or repository name.

## Stored data

- Stored: one Boolean preference, `rtlFixEnabled`, in `chrome.storage.local`.
- Not stored: Azure DevOps or GitHub page content, comments, titles, Markdown, URLs, usernames, organization/project/repository information, or credentials.

## Transmission and collection by the developer

- Azure DevOps or GitHub content transmitted externally automatically: **No**.
- Data sent automatically to the developer: **No**.
- User-submitted issue reports: **Only when the user reviews and sends the Gmail draft**.
- Third-party sharing of supported page content: **No**.
- Humans able to access processed content through the extension: **No**, because it remains local.

## Optional issue reporting

Selecting **Report an issue** opens `mail.google.com` in a new tab with the recipient, a static subject and report template, and the extension version pre-filled. This user-initiated navigation does not automatically include Azure DevOps or GitHub page text, URLs, organization/project/repository information, work-item or Markdown content, selected text, user identity, or browser history. The extension does not authenticate with Gmail or send the report; the user decides whether to edit, send, or discard it.

## Use and monetization

- Analytics or telemetry: **No**.
- Tracking or behavioral profiling: **No**.
- Advertising or personalized advertising: **No**.
- Sale of data: **No**.
- Creditworthiness or lending use: **No**.

## Remote code

**Recommended answer: No, this extension does not use remote code.**

All executable extension logic ships inside the uploaded ZIP. The implementation uses vanilla JavaScript and local CSS and does not use remote script tags, dynamic remote imports, `eval`, `new Function`, CDNs, or remotely hosted WebAssembly.

## Limited Use certification preparation

The locally accessed content is used only for the prominently disclosed, user-facing RTL formatting purpose. It is not transferred, sold, used for advertising, or used for an unrelated purpose. The popup, Store listing, README, and Privacy Policy all disclose local text processing.

Before submission, confirm that the Privacy Practices answers exactly match the final uploaded ZIP and the publicly hosted Privacy Policy.

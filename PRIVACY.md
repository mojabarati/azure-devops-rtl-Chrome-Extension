# Privacy Policy — Azure DevOps RTL Fixer

Last updated: August 20, 2026

Azure DevOps RTL Fixer is a browser extension that improves the presentation of Persian/Farsi and other right-to-left text on supported Azure DevOps pages and GitHub rendered Markdown documents.

## What the extension accesses

When the user explicitly enables RTL Fix, the extension can access rendered text and content on these supported sites:

- `https://dev.azure.com/*`
- `https://*.visualstudio.com/*`
- `https://github.com/*`

On GitHub, processing is limited to repository or directory READMEs and rendered `.md`/`.markdown` file views. Issues, pull requests, comments, Discussions, raw Markdown, source-code views, diffs, and editors are not intentionally processed.

## What is processed

Locally processed website or user-generated content may include Azure DevOps work-item fields and supported GitHub rendered-Markdown headings, paragraphs, list items, blockquotes, and table cells. The extension examines text only to determine whether a logical text block should receive RTL presentation formatting.

The extension does not reverse or rewrite text, change Azure DevOps backend data, alter Markdown source, or persist page content.

## Where processing occurs

RTL detection and formatting occur locally inside the user's browser:

```text
Supported page DOM → local browser content script → RTL detection → local presentation class
```

No backend service is used.

## Data transmission and third-party sharing

The RTL feature does not transmit Azure DevOps or GitHub page content, work-item or repository data, organization or project information, usernames, URLs, authentication information, or extension usage data to the developer or third parties.

The extension does not automatically share supported page content with third parties. It contains no analytics, telemetry, advertising, tracking pixels, or developer-controlled network requests.

## Optional issue reports

When the user selects **Report an issue**, the extension opens the Gmail web compose page in a new browser tab. The draft is pre-filled with the developer's email address, a static subject and report template, and the extension version.

The extension does not automatically add the current Azure DevOps or GitHub URL, page text, organization name, project or repository name, work-item or Markdown content, selected text, user identity, or browser history. It does not authenticate with Gmail or send the report. The user can review and edit the draft and chooses whether to send or discard it. The developer receives a report only if the user sends the email.

Opening Gmail is an intentional, user-initiated navigation to a third-party service. Gmail's handling of the page and any email the user chooses to send is governed by Google's applicable terms and privacy policy.

## Data storage

Azure DevOps and GitHub page contents are not stored by the extension. The only extension-managed stored value is the Boolean `rtlFixEnabled` ON/OFF preference, saved locally with `chrome.storage.local` so the user's choice survives page reloads and browser restarts.

The extension does not use `chrome.storage.sync`.

## Analytics, advertising, and profiling

- No analytics or telemetry.
- No advertising.
- No behavioral profiling.
- No sale of data.
- No use of data for creditworthiness or lending.

## Human access

Because supported page content is processed locally and is not transmitted by the RTL feature, the developer and other humans do not receive or read that content through the extension. The developer can receive only information the user intentionally includes in an issue-report email and chooses to send.

## Limited Use disclosure

The extension's handling of website and user-generated content is limited to providing its single user-facing purpose: improving RTL text readability on supported Azure DevOps pages and GitHub rendered Markdown. The extension does not transfer, sell, or use that content for advertising, profiling, or any unrelated purpose.

The use of information received through browser APIs adheres to the Chrome Web Store User Data Policy, including the Limited Use requirements.

## Security

The extension ships all executable code inside its package and does not load remote code. There is no automatic developer-operated transmission or storage channel for Azure DevOps or GitHub content. Optional issue reports use a user-initiated Gmail draft and are sent only by the user.

## Changes to this policy

This policy may be updated when the extension's functionality or applicable publication requirements change. Material data-handling changes should be disclosed before an updated extension is published. The current policy will be maintained with the public project.

## Contact

For privacy questions or issue reports, email `mojabarati@gmail.com` or use the public repository at <https://github.com/mojabarati/azure-devops-rtl-Chrome-Extension>. Do not include secrets, authentication data, private Azure DevOps or GitHub URLs, or confidential work-item, repository, or Markdown content in a report.

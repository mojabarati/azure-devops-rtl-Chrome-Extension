# Privacy Policy — Azure DevOps RTL Fixer

Last updated: August 13, 2026

Azure DevOps RTL Fixer is a browser extension that improves the presentation of Persian/Farsi and other right-to-left text on supported Azure DevOps pages.

## What the extension accesses

When the user explicitly enables RTL Fix, the extension can access rendered text and content on these supported sites:

- `https://dev.azure.com/*`
- `https://*.visualstudio.com/*`

This access is limited to providing the extension's RTL formatting feature.

## What is processed

Locally processed website or user-generated content may include work-item descriptions, titles where applicable, comments and discussions, Acceptance Criteria, Repro Steps, and other rendered text fields. The extension examines text only to determine whether a logical text block should receive RTL presentation formatting.

The extension does not reverse or rewrite text, change Azure DevOps backend data, or persist work-item content.

## Where processing occurs

RTL detection and formatting occur locally inside the user's browser:

```text
Azure DevOps DOM → local browser content script → RTL detection → local presentation class
```

No backend service is used.

## Data transmission and third-party sharing

The extension does not transmit Azure DevOps page content, work-item data, organization or project information, usernames, URLs, authentication information, or extension usage data to the developer or third parties.

Azure DevOps content is not shared with third parties. The extension contains no analytics, telemetry, advertising, tracking pixels, or developer-controlled network requests.

## Data storage

Azure DevOps page contents are not stored by the extension. The only extension-managed stored value is the Boolean `rtlFixEnabled` ON/OFF preference, saved locally with `chrome.storage.local` so the user's choice survives page reloads and browser restarts.

The extension does not use `chrome.storage.sync`.

## Analytics, advertising, and profiling

- No analytics or telemetry.
- No advertising.
- No behavioral profiling.
- No sale of data.
- No use of data for creditworthiness or lending.

## Human access

Because supported page content is processed locally and is not transmitted, the developer and other humans do not receive or read that content through the extension.

## Limited Use disclosure

The extension's handling of website and user-generated content is limited to providing its single user-facing purpose: improving RTL text readability on supported Azure DevOps pages. The extension does not transfer, sell, or use that content for advertising, profiling, or any unrelated purpose.

The use of information received through browser APIs adheres to the Chrome Web Store User Data Policy, including the Limited Use requirements.

## Security

The extension ships all executable code inside its package and does not load remote code. Since it does not transmit Azure DevOps content, there is no developer-operated transmission or storage channel for that content.

## Changes to this policy

This policy may be updated when the extension's functionality or applicable publication requirements change. Material data-handling changes should be disclosed before an updated extension is published. The current policy will be maintained with the public project.

## Contact

No public repository remote or dedicated contact address is configured in this source checkout, so this policy does not invent one. Before Store submission, the publisher must add the public repository or support URL here. Do not include secrets, authentication data, private Azure DevOps URLs, or confidential work-item content in a public report.

# Chrome Web Store Screenshot Plan

Use real, sanitized product screenshots. Do not fabricate UI or include private organization/project URLs, access tokens, usernames, employee information, customer data, or confidential work-item content.

Chrome currently requires at least one screenshot and allows up to five. Prefer **1280×800 pixels** for clear high-resolution display.

## Screenshot 1 — Before

Show a sanitized Azure DevOps Description with mixed Persian and English text rendered incorrectly while RTL Fix is off. Use an artificial test work item containing no private data.

## Screenshot 2 — After

Show the same Description with RTL Fix enabled and the sentence rendered naturally. Keep the viewport and work-item content identical to Screenshot 1 so the difference is credible.

## Screenshot 3 — Extension popup

Show the popup with:

- Azure DevOps RTL Fixer;
- RTL Fix set to On;
- active-page status;
- local-processing privacy message.

## Screenshot 4 — Additional content

Show a sanitized Discussion, Acceptance Criteria, Repro Steps, or another real work-item field demonstrating RTL formatting.

## Capture checklist

- Use desktop Chrome at a consistent zoom and 1280×800 output.
- Avoid browser profiles, bookmarks, notifications, or tabs that reveal private information.
- Inspect every screenshot at full resolution before committing or uploading it.
- Do not use the local regression fixture as a Store product screenshot.

Official reference: <https://developer.chrome.com/docs/webstore/cws-dashboard-listing>

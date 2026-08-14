# Chrome Web Store Listing Copy

## Extension name

Azure DevOps RTL Fixer

## Short description

Improve Persian and RTL text readability in Azure DevOps, including mixed Persian and English content.

## Detailed description

Azure DevOps uses a left-to-right interface, which can make Persian/Farsi work-item text difficult to read when it includes English technical terms.

Azure DevOps RTL Fixer detects Persian-dominant text on supported Azure DevOps pages and applies an appropriate right-to-left base direction to the actual logical text block. This improves descriptions, discussions, Acceptance Criteria, Repro Steps, titles where applicable, and other rendered text fields without changing the stored content.

The extension includes explicit support for the Azure DevOps Rooster rich-text editor and mixed text such as Persian sentences containing `REST API`, `Feature Flag`, or `Activation`.

Key features:

- User-controlled ON/OFF toggle, defaulting to OFF.
- **Report an issue** action that opens a pre-filled Gmail draft for the user to review and send manually.
- Support for `dev.azure.com` and `*.visualstudio.com`.
- Local processing inside the browser.
- No automatic transmission of Azure DevOps content.
- No analytics, telemetry, tracking, advertising, or remote code.
- English-only content and Azure DevOps application layout remain unchanged.

When enabled, the extension locally examines rendered page text only to determine whether RTL presentation should be applied. It does not reverse or save work-item text, modify Azure DevOps backend data, or send content to the developer or third parties.

Azure DevOps RTL Fixer is an independent project and is not affiliated with or endorsed by Microsoft.

## Single purpose

Improve readability of Persian and other RTL text in Azure DevOps by applying appropriate text-direction formatting locally in the browser.

## Privacy summary

Azure DevOps RTL Fixer locally processes supported page text to provide RTL formatting. The extension does not automatically persist or transmit Azure DevOps content to the developer or third parties. Only the user's ON/OFF preference is stored locally.

If the user chooses **Report an issue**, the extension opens Gmail with a static report template and extension version. It does not automatically include Azure DevOps page content, URLs, organization/project information, or work-item data, and it does not send the report automatically.

## Suggested category

Productivity

## Suggested primary language

English

The publisher should consider adding a localized Persian Store listing after the English listing is complete.

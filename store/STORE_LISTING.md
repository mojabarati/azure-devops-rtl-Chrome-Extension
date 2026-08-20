# Chrome Web Store Listing Copy

## Extension name

Azure DevOps RTL Fixer

## Short description

Improve Persian and RTL readability in Azure DevOps and GitHub rendered Markdown.

## Detailed description

Azure DevOps and GitHub use left-to-right interfaces, which can make Persian/Farsi content difficult to read when it includes English technical terms.

Azure DevOps RTL Fixer detects Persian-dominant text on supported pages and applies an appropriate right-to-left base direction to the actual logical text block. In Azure DevOps this covers supported work-item content. On GitHub it is limited to repository or directory READMEs and rendered `.md`/`.markdown` files.

The extension includes explicit support for the Azure DevOps Rooster rich-text editor and GitHub Markdown headings, paragraphs, lists, blockquotes, and table cells. Mixed Persian/English text remains readable, and GitHub inline or fenced code remains LTR.

Key features:

- User-controlled ON/OFF toggle, defaulting to OFF.
- **Report an issue** action that opens a pre-filled Gmail draft for the user to review and send manually.
- Support for `dev.azure.com`, `*.visualstudio.com`, and rendered Markdown on `github.com`.
- Local processing inside the browser.
- No automatic transmission of supported page content.
- No analytics, telemetry, tracking, advertising, or remote code.
- English-only content and surrounding Azure DevOps or GitHub application UI remain unchanged.

When enabled, the extension locally examines rendered page text only to determine whether RTL presentation should be applied. It does not reverse text, save work-item or Markdown content, modify backend data, or send content to the developer or third parties. GitHub issues, pull requests, comments, Discussions, raw Markdown, code views, diffs, and editors are excluded from this release.

Azure DevOps RTL Fixer is an independent project and is not affiliated with or endorsed by Microsoft.

## Single purpose

Improve readability of Persian and other RTL text in supported Azure DevOps content and GitHub rendered Markdown by applying text-direction formatting locally in the browser.

## Privacy summary

Azure DevOps RTL Fixer locally processes supported page text to provide RTL formatting. The extension does not automatically persist or transmit Azure DevOps or GitHub content to the developer or third parties. Only the user's ON/OFF preference is stored locally.

If the user chooses **Report an issue**, the extension opens Gmail with a static report template and extension version. It does not automatically include Azure DevOps or GitHub page content, URLs, organization/project/repository information, work-item data, or Markdown content, and it does not send the report automatically.

## Suggested category

Productivity

## Suggested primary language

English

The publisher should consider adding a localized Persian Store listing after the English listing is complete.

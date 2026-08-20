# Chrome Web Store Permission Justifications

These explanations match the version 1.3.0 manifest.

## Chrome API permission: `storage`

The extension uses `chrome.storage.local` only to remember the Boolean `azureRtlFixEnabled` and `githubRtlFixEnabled` ON/OFF preferences across page reloads and browser restarts. An existing `rtlFixEnabled` value may be read once to initialize missing platform settings during upgrade. No Azure DevOps or GitHub page content, URLs, organization, project, repository information, or user identifiers are stored.

This permission cannot be removed without losing the user-requested persistent platform-toggle behavior.

## Site access: `https://dev.azure.com/*`

The static content script must run on Azure DevOps cloud pages to inspect rendered logical text blocks and locally apply or remove RTL presentation formatting. Access is used only while the user's stored Azure DevOps toggle is enabled; while disabled, the content script does not inspect page text beyond loading the Boolean preference.

## Site access: `https://*.visualstudio.com/*`

Legacy Azure DevOps cloud organizations can use `*.visualstudio.com`. The same local RTL formatting behavior requires access on those pages.

## Site access: `https://github.com/*`

The static content script needs access to `github.com` so it can detect semantic rendered-Markdown roots after GitHub client-side navigation. Processing is limited in code to repository or directory READMEs and rendered `.md`/`.markdown` file views. Issues, pull requests, comments, Discussions, raw views, code files, diffs, and editors are excluded. No GitHub content or URL is stored or transmitted.

## Permissions intentionally not requested

The extension does not request `tabs`, `activeTab`, `scripting`, `webRequest`, cookies, history, notifications, management, or `<all_urls>`. It declares no separate `host_permissions`; the static content script match patterns are the complete website scope.

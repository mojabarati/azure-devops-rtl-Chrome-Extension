# Chrome Web Store Permission Justifications

These explanations match the version 1.0.0 manifest.

## Chrome API permission: `storage`

The extension uses `chrome.storage.local` only to remember the Boolean `rtlFixEnabled` ON/OFF preference across page reloads and browser restarts. No Azure DevOps page content, URLs, organization information, project information, or user identifiers are stored.

This permission cannot be removed without losing the user-requested persistent toggle behavior.

## Site access: `https://dev.azure.com/*`

The static content script must run on Azure DevOps cloud pages to inspect rendered logical text blocks and locally apply or remove RTL presentation formatting. Access is used only while the user's stored toggle is enabled; while disabled, the content script does not inspect page text beyond loading the Boolean preference.

## Site access: `https://*.visualstudio.com/*`

Legacy Azure DevOps cloud organizations can use `*.visualstudio.com`. The same local RTL formatting behavior requires access on those pages.

## Permissions intentionally not requested

The extension does not request `tabs`, `activeTab`, `scripting`, `webRequest`, cookies, history, notifications, management, or `<all_urls>`. It declares no separate `host_permissions`; the static content script match patterns are the complete website scope.

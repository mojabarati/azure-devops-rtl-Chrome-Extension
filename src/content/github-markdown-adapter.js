(function exposeGitHubMarkdownAdapter(root, factory) {
  const adapter = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = adapter;
  }

  if (root) {
    root.AdoRtlGitHubMarkdownAdapter = adapter;
    root.AdoRtlSiteAdapter = adapter;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createGitHubMarkdownAdapter() {
  "use strict";

  const MARKDOWN_ROOT_SELECTOR = "article.markdown-body";
  const RESERVED_TOP_LEVEL_PATHS = new Set([
    "collections",
    "enterprise",
    "events",
    "features",
    "login",
    "marketplace",
    "new",
    "notifications",
    "organizations",
    "orgs",
    "pricing",
    "search",
    "security",
    "settings",
    "signup",
    "sponsors",
    "topics",
    "trending",
    "users"
  ]);
  const EXCLUDED_CONTEXT_SELECTOR = [
    ".comment-body",
    ".js-comment",
    ".timeline-comment",
    "[data-testid='issue-body']",
    "[data-testid='issue-comment-body']",
    "[data-testid='discussion-body']",
    "[data-testid='pull-request-review-comment']",
    "[data-testid='code-viewer']"
  ].join(",");

  const selectors = Object.freeze({
    roosterEditor: ":not(*)",
    semanticText: [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "li",
      "blockquote",
      "td",
      "th",
      "dd",
      "dt",
      "figcaption"
    ].join(","),
    azureText: ":not(*)",
    editable: ":not(*)",
    ignored: [
      "script",
      "style",
      "code",
      "pre",
      "kbd",
      "samp",
      "svg",
      "canvas",
      "noscript",
      "template",
      "button",
      "input",
      "textarea",
      "select",
      "[role='button']",
      "[contenteditable='true']",
      "[aria-hidden='true']",
      "[data-testid='code-viewer']",
      ".blob-code",
      ".blob-code-content",
      ".js-file-line",
      ".react-code-line",
      ".diff-table",
      ".monaco-editor"
    ].join(",")
  });

  function matchesLocation(locationLike) {
    return locationLike?.hostname?.toLowerCase?.() === "github.com";
  }

  function isSupportedPath(pathname) {
    const segments = String(pathname || "").split("/").filter(Boolean);

    if (RESERVED_TOP_LEVEL_PATHS.has(segments[0]?.toLowerCase?.())) {
      return false;
    }

    if (segments.length === 2) {
      return true;
    }

    if (segments.length >= 4 && segments[2] === "tree") {
      return true;
    }

    return (
      segments.length >= 5 &&
      segments[2] === "blob" &&
      /\.(?:md|markdown)$/iu.test(segments.at(-1))
    );
  }

  function elementFor(node) {
    if (node?.nodeType === 1) {
      return node;
    }

    return node?.nodeType === 3 ? node.parentElement : null;
  }

  function isRenderedMarkdownRoot(element, locationLike) {
    return Boolean(
      element?.matches?.(MARKDOWN_ROOT_SELECTOR) &&
      matchesLocation(locationLike) &&
      isSupportedPath(locationLike.pathname) &&
      !element.closest(EXCLUDED_CONTEXT_SELECTOR)
    );
  }

  function findMarkdownRoot(node, locationLike) {
    const candidate = elementFor(node)?.closest?.(MARKDOWN_ROOT_SELECTOR);
    return isRenderedMarkdownRoot(candidate, locationLike) ? candidate : null;
  }

  function getProcessingScopes(node, documentLike, locationLike) {
    if (!node || !matchesLocation(locationLike) || !isSupportedPath(locationLike.pathname)) {
      return [];
    }

    const containingRoot = findMarkdownRoot(node, locationLike);
    if (containingRoot) {
      return [{ root: node, boundary: containingRoot }];
    }

    const roots = [];
    const candidates = node.querySelectorAll?.(MARKDOWN_ROOT_SELECTOR) || [];
    for (const candidate of candidates) {
      if (isRenderedMarkdownRoot(candidate, locationLike)) {
        roots.push({ root: candidate, boundary: candidate });
      }
    }

    if (node === documentLike && documentLike?.documentElement) {
      const documentRoot = documentLike.documentElement.matches?.(MARKDOWN_ROOT_SELECTOR)
        ? documentLike.documentElement
        : null;
      if (isRenderedMarkdownRoot(documentRoot, locationLike)) {
        roots.unshift({ root: documentRoot, boundary: documentRoot });
      }
    }

    return roots;
  }

  function containsBlock(block, _documentLike, locationLike) {
    return Boolean(block?.isConnected && findMarkdownRoot(block, locationLike));
  }

  function isPageSupported(documentLike, locationLike) {
    if (!matchesLocation(locationLike) || !isSupportedPath(locationLike.pathname)) {
      return false;
    }

    return [...(documentLike?.querySelectorAll?.(MARKDOWN_ROOT_SELECTOR) || [])]
      .some((root) => isRenderedMarkdownRoot(root, locationLike));
  }

  return Object.freeze({
    id: "github-markdown",
    containsBlock,
    EXCLUDED_CONTEXT_SELECTOR,
    findMarkdownRoot,
    getProcessingScopes,
    isPageSupported,
    isRenderedMarkdownRoot,
    isSupportedPath,
    MARKDOWN_ROOT_SELECTOR,
    matchesLocation,
    RESERVED_TOP_LEVEL_PATHS,
    selectors
  });
});

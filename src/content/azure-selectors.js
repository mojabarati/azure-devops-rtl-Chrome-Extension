(function exposeAzureSelectors(root) {
  "use strict";

  // Azure-specific hints live in this one file so they can be revised without
  // changing the generic DOM processor. Generic semantic elements remain the
  // primary path; these hints cover common work-item fields and rich editors.
  const selectors = Object.freeze({
    roosterEditor: ".lean-rooster.rooster-editor",
    semanticText: [
      "p",
      "li",
      "blockquote",
      "dd",
      "dt",
      "figcaption",
      "label",
      "legend",
      "td",
      "th",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "[role='heading']",
      "[role='textbox']",
      "[contenteditable='true']"
    ].join(","),
    azureText: [
      "[data-field*='System.Title']",
      "[data-field*='System.Description']",
      "[data-field*='System.History']",
      "[data-field*='AcceptanceCriteria']",
      "[data-field*='ReproSteps']",
      "[aria-label*='Description']",
      "[aria-label*='Acceptance Criteria']",
      "[aria-label*='Repro Steps']",
      "[aria-label*='Discussion']"
    ].join(","),
    editable: [
      "textarea",
      "input:not([type])",
      "input[type='text']",
      "input[type='search']",
      "input[type='url']",
      "input[type='email']",
      "[contenteditable='true']",
      "[role='textbox']"
    ].join(","),
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
      "[role='button']",
      "[aria-hidden='true']",
      ".rooster-command-bar",
      ".monaco-editor"
    ].join(",")
  });

  root.AdoRtlSelectors = selectors;
  root.AdoRtlSiteAdapter = Object.freeze({
    id: "azure-devops",
    selectors,
    containsBlock(block) {
      return Boolean(block?.isConnected);
    },
    getProcessingScopes(candidate) {
      return candidate ? [{ root: candidate, boundary: null }] : [];
    },
    isPageSupported() {
      return true;
    }
  });
})(globalThis);

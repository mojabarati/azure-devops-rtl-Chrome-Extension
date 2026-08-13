(function exposeAzureSelectors(root) {
  "use strict";

  // Azure-specific hints live in this one file so they can be revised without
  // changing the generic DOM processor. Generic semantic elements remain the
  // primary path; these hints cover common work-item fields and rich editors.
  root.AdoRtlSelectors = Object.freeze({
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
      ".monaco-editor"
    ].join(",")
  });
})(globalThis);

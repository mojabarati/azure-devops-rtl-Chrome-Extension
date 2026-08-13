(function exposeAdoRtlDomUtils(root, factory) {
  const utils = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = utils;
  }

  if (root) {
    root.AdoRtlDomUtils = utils;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createAdoRtlDomUtils() {
  "use strict";

  const LOGICAL_BLOCK_SELECTOR = [
    "p",
    "li",
    "blockquote",
    "dd",
    "dt",
    "figcaption",
    "td",
    "th",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "[role='heading']"
  ].join(",");

  const NESTED_BLOCK_SELECTOR = [
    "div",
    "p",
    "li",
    "blockquote",
    "dd",
    "dt",
    "table",
    "ul",
    "ol",
    "section",
    "article",
    "form"
  ].join(",");

  const INTERACTIVE_DESCENDANT_SELECTOR = [
    "button",
    "[role='button']",
    "input",
    "textarea",
    "select",
    "nav",
    "svg",
    "canvas"
  ].join(",");

  function isIgnored(element, selectors) {
    return Boolean(element?.closest?.(selectors.ignored));
  }

  function isLeafTextDiv(element) {
    return (
      element?.matches?.("div") &&
      !element.querySelector(NESTED_BLOCK_SELECTOR) &&
      !element.querySelector(INTERACTIVE_DESCENDANT_SELECTOR)
    );
  }

  function findLogicalTextBlock(textNode, selectors) {
    const parent = textNode?.parentElement;
    if (!parent || isIgnored(parent, selectors)) {
      return null;
    }

    const editable = parent.closest(selectors.editable);
    if (editable && !isIgnored(editable, selectors)) {
      return editable;
    }

    const semanticBlock = parent.closest(LOGICAL_BLOCK_SELECTOR);
    if (semanticBlock && !isIgnored(semanticBlock, selectors)) {
      return semanticBlock;
    }

    let current = parent;
    while (current && current !== current.ownerDocument?.body) {
      if (isLeafTextDiv(current)) {
        return current;
      }
      current = current.parentElement;
    }

    return null;
  }

  return Object.freeze({
    findLogicalTextBlock,
    isLeafTextDiv,
    LOGICAL_BLOCK_SELECTOR
  });
});

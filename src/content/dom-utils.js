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

  function findRoosterTextBlock(textNode, editor) {
    const listItem = textNode?.parentElement?.closest?.("li");
    if (listItem && editor?.contains?.(listItem)) {
      return listItem;
    }

    let current = textNode?.parentElement;

    while (current && current !== editor) {
      if (
        current.matches(LOGICAL_BLOCK_SELECTOR) ||
        (current.matches("div") && !current.querySelector("img,video,iframe,canvas,svg"))
      ) {
        return current;
      }
      current = current.parentElement;
    }

    return null;
  }

  function isInsideBoundary(element, boundary) {
    return !boundary || element === boundary || boundary.contains?.(element);
  }

  function findLogicalTextBlock(textNode, selectors, boundary = null) {
    const parent = textNode?.parentElement;
    if (!parent || !isInsideBoundary(parent, boundary) || isIgnored(parent, selectors)) {
      return null;
    }

    // The LI owns the native list marker. Target it instead of a nested span,
    // paragraph, or Rooster line DIV so direction moves both text and marker.
    const listItem = parent.closest("li");
    if (listItem && isInsideBoundary(listItem, boundary) && !isIgnored(listItem, selectors)) {
      return listItem;
    }

    // Rooster uses contenteditable=true even in view mode. Its direct/nested
    // line DIVs own Azure's inline direction and must be processed instead of
    // treating the whole editor as one editable paragraph.
    const roosterEditor = parent.closest(selectors.roosterEditor);
    if (roosterEditor && isInsideBoundary(roosterEditor, boundary)) {
      return findRoosterTextBlock(textNode, roosterEditor);
    }

    const editable = parent.closest(selectors.editable);
    if (editable && isInsideBoundary(editable, boundary) && !isIgnored(editable, selectors)) {
      return editable;
    }

    const semanticBlock = parent.closest(LOGICAL_BLOCK_SELECTOR);
    if (semanticBlock && isInsideBoundary(semanticBlock, boundary) && !isIgnored(semanticBlock, selectors)) {
      return semanticBlock;
    }

    let current = parent;
    while (current && current !== current.ownerDocument?.body) {
      if (current === boundary) {
        break;
      }
      if (isLeafTextDiv(current)) {
        return current;
      }
      current = current.parentElement;
    }

    return null;
  }

  return Object.freeze({
    findLogicalTextBlock,
    findRoosterTextBlock,
    isLeafTextDiv,
    LOGICAL_BLOCK_SELECTOR
  });
});

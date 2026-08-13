(function exposeRtlDetector(root, factory) {
  const detector = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = detector;
  }

  if (root) {
    root.AdoRtlDetector = detector;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createRtlDetector() {
  "use strict";

  // Arabic, Arabic Supplement, Arabic Extended-A/B, presentation forms, and
  // Arabic Mathematical Alphabetic Symbols. These ranges include Persian
  // letters such as پ, چ, ژ, گ, ک, and ی.
  const RTL_CHARACTER_PATTERN = /[\u0600-\u06ff\u0750-\u077f\u0870-\u089f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]|[\u{1ee00}-\u{1eeff}]/u;
  const LATIN_CHARACTER_PATTERN = /[A-Za-z]/;
  const ONLY_NUMBERS_AND_PUNCTUATION_PATTERN = /^[\s\d۰-۹٠-٩.,،٫٬:;؛!?؟+\-−–—_()[\]{}%٪/\\|#@&*'"`~]+$/u;
  const URL_PATTERN = /^(?:(?:https?|ftp):\/\/|www\.)\S+$/iu;
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
  const GUID_PATTERN = /^\{?[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\}?$/iu;

  function normalizeText(text) {
    return typeof text === "string" ? text.replace(/\s+/gu, " ").trim() : "";
  }

  function containsRtlText(text) {
    return RTL_CHARACTER_PATTERN.test(normalizeText(text));
  }

  function isStandaloneTechnicalText(text) {
    const normalized = normalizeText(text);

    if (!normalized) {
      return true;
    }

    return (
      ONLY_NUMBERS_AND_PUNCTUATION_PATTERN.test(normalized) ||
      URL_PATTERN.test(normalized) ||
      EMAIL_PATTERN.test(normalized) ||
      GUID_PATTERN.test(normalized)
    );
  }

  function getTextDirection(text) {
    const normalized = normalizeText(text);

    if (!normalized || isStandaloneTechnicalText(normalized)) {
      return "neutral";
    }

    if (RTL_CHARACTER_PATTERN.test(normalized)) {
      return "rtl";
    }

    if (LATIN_CHARACTER_PATTERN.test(normalized)) {
      return "ltr";
    }

    return "neutral";
  }

  return Object.freeze({
    containsRtlText,
    getTextDirection,
    isStandaloneTechnicalText,
    normalizeText
  });
});

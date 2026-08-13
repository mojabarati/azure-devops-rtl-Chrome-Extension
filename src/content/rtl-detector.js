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
  const LATIN_CHARACTER_PATTERN = /\p{Script=Latin}/u;
  const LETTER_PATTERN = /\p{L}/u;
  const MARK_OR_CONNECTOR_PATTERN = /[\p{M}\p{N}._#@+:/\\\-\u200c\u200d]/u;
  const ONLY_NUMBERS_AND_PUNCTUATION_PATTERN = /^[\s\d۰-۹٠-٩.,،٫٬:;؛!?؟+\-−–—_()[\]{}%٪/\\|#@&*'"`~]+$/u;
  const URL_PATTERN = /^(?:(?:https?|ftp):\/\/|www\.)\S+$/iu;
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
  const GUID_PATTERN = /^\{?[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\}?$/iu;

  function normalizeText(text) {
    return typeof text === "string" ? text.replace(/\s+/gu, " ").trim() : "";
  }

  function containsRtlText(text) {
    return [...normalizeText(text)].some(isRtlStrongCharacter);
  }

  function countStrongCharacters(text) {
    const normalized = normalizeText(text);
    const counts = { rtl: 0, ltr: 0, rtlWords: 0, ltrWords: 0 };
    let currentWord = null;

    for (const character of normalized) {
      if (isRtlStrongCharacter(character)) {
        counts.rtl += 1;
        if (currentWord !== "rtl") {
          counts.rtlWords += 1;
        }
        currentWord = "rtl";
      } else if (isLtrStrongCharacter(character)) {
        counts.ltr += 1;
        if (currentWord !== "ltr") {
          counts.ltrWords += 1;
        }
        currentWord = "ltr";
      } else if (!MARK_OR_CONNECTOR_PATTERN.test(character)) {
        currentWord = null;
      }
    }

    return counts;
  }

  function containsMeaningfulRtlWord(text) {
    let rtlRunLength = 0;

    for (const character of normalizeText(text)) {
      if (isRtlStrongCharacter(character)) {
        rtlRunLength += 1;
        if (rtlRunLength >= 2) {
          return true;
        }
      } else if (!MARK_OR_CONNECTOR_PATTERN.test(character)) {
        rtlRunLength = 0;
      }
    }

    return false;
  }

  function isRtlStrongCharacter(character) {
    return RTL_CHARACTER_PATTERN.test(character) && LETTER_PATTERN.test(character);
  }

  function isLtrStrongCharacter(character) {
    return LATIN_CHARACTER_PATTERN.test(character) && LETTER_PATTERN.test(character);
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

  function shouldUseRtlParagraph(text) {
    const normalized = normalizeText(text);

    if (!normalized || isStandaloneTechnicalText(normalized)) {
      return false;
    }

    const counts = countStrongCharacters(normalized);
    if (counts.rtl === 0) {
      return false;
    }

    if (counts.ltr === 0) {
      return true;
    }

    // A real Persian/Arabic word makes the surrounding block RTL even when a
    // long English label appears first. Requiring two connected RTL letters
    // avoids flipping English prose because of one isolated script character.
    if (containsMeaningfulRtlWord(normalized)) {
      return true;
    }

    // Character count handles ordinary Persian prose. Word count prevents a
    // paragraph rich in long English technical identifiers from being
    // misclassified when the surrounding grammatical structure is Persian.
    return counts.rtl >= counts.ltr * 0.75 || counts.rtlWords >= counts.ltrWords;
  }

  function getTextDirection(text) {
    const normalized = normalizeText(text);

    if (!normalized || isStandaloneTechnicalText(normalized)) {
      return "neutral";
    }

    if (shouldUseRtlParagraph(normalized)) {
      return "rtl";
    }

    if (LATIN_CHARACTER_PATTERN.test(normalized)) {
      return "ltr";
    }

    return "neutral";
  }

  return Object.freeze({
    containsRtlText,
    containsMeaningfulRtlWord,
    countStrongCharacters,
    getTextDirection,
    isStandaloneTechnicalText,
    normalizeText,
    shouldUseRtlParagraph
  });
});

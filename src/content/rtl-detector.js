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
  const MARK_OR_CONNECTOR_PATTERN = /[\p{M}\p{N}._#@+:/\\-]/u;
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

  function isTechnicalCharacter(character) {
    return /[A-Za-z0-9._#@+:/\\-]/u.test(character);
  }

  function trimTechnicalRunEnd(text, start, end) {
    while (end > start && /[.,:;!?/@+\\-]/u.test(text[end - 1])) {
      end -= 1;
    }
    return end;
  }

  function findLtrRuns(text) {
    if (typeof text !== "string" || !text) {
      return [];
    }

    const runs = [];
    let index = 0;

    while (index < text.length) {
      if (!isTechnicalCharacter(text[index])) {
        index += 1;
        continue;
      }

      const start = index;
      let end = index;
      let hasLatin = false;

      while (end < text.length) {
        if (isTechnicalCharacter(text[end])) {
          hasLatin ||= LATIN_CHARACTER_PATTERN.test(text[end]);
          end += 1;
          continue;
        }

        if (/\s/u.test(text[end])) {
          let next = end;
          while (next < text.length && /\s/u.test(text[next])) {
            next += 1;
          }

          if (next < text.length && isTechnicalCharacter(text[next])) {
            end = next;
            continue;
          }
        }

        break;
      }

      const trimmedEnd = trimTechnicalRunEnd(text, start, end);
      if (hasLatin && trimmedEnd > start) {
        runs.push({ start, end: trimmedEnd, text: text.slice(start, trimmedEnd) });
      }

      index = Math.max(end, start + 1);
    }

    return runs;
  }

  return Object.freeze({
    containsRtlText,
    countStrongCharacters,
    findLtrRuns,
    getTextDirection,
    isStandaloneTechnicalText,
    normalizeText,
    shouldUseRtlParagraph
  });
});

"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  containsRtlText,
  countStrongCharacters,
  getTextDirection,
  isStandaloneTechnicalText,
  normalizeText,
  shouldUseRtlParagraph
} = require("../src/content/rtl-detector.js");

test("detects Persian text", () => {
  assert.equal(containsRtlText("این یک متن فارسی است"), true);
  assert.equal(getTextDirection("این یک متن فارسی است"), "rtl");
});

test("detects mixed Persian and English as RTL", () => {
  assert.equal(getTextDirection("برای این Feature یک API جدید ایجاد شود."), "rtl");
});

test("uses Persian dominance rather than only the first strong character", () => {
  assert.equal(shouldUseRtlParagraph("Feature Flag برای این قابلیت اضافه شود."), true);
  assert.equal(shouldUseRtlParagraph("در Backend از REST API برای دریافت User Profile استفاده شود."), true);
  assert.equal(shouldUseRtlParagraph("Create a new API for this feature."), false);
});

test("counts only strong letters, not numbers or punctuation", () => {
  assert.deepEqual(countStrongCharacters("۱۲۳، 456!"), {
    rtl: 0,
    ltr: 0,
    rtlWords: 0,
    ltrWords: 0
  });
});

test("keeps Persian paragraph direction when it contains technical terms", () => {
  const text = "در صورتی که ai specialist پورتفولیوی خود را غیرفعال کرد بنر جهت Activation نمایش داده شود.";
  assert.equal(getTextDirection(text), "rtl");
  assert.equal(text.includes("ai specialist"), true);
  assert.equal(text.includes("Activation"), true);
});

test("detects English text as LTR", () => {
  assert.equal(getTextDirection("Create a new API for this feature."), "ltr");
});

test("does not force numbers to RTL", () => {
  assert.equal(getTextDirection("123456"), "neutral");
});

test("does not force a URL to RTL", () => {
  const url = "https://dev.azure.com/example/project";
  assert.equal(isStandaloneTechnicalText(url), true);
  assert.equal(getTextDirection(url), "neutral");
});

test("does not force an email address or GUID to RTL", () => {
  assert.equal(getTextDirection("owner@example.com"), "neutral");
  assert.equal(getTextDirection("550e8400-e29b-41d4-a716-446655440000"), "neutral");
});

test("covers Persian-specific letters", () => {
  for (const character of ["پ", "چ", "ژ", "گ", "ی", "ک"]) {
    assert.equal(containsRtlText(character), true, `expected ${character} to be RTL`);
  }
});

test("normalizes whitespace without changing words", () => {
  assert.equal(normalizeText("  متن\n\t فارسی  "), "متن فارسی");
});

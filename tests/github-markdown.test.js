"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const adapter = require("../src/content/github-markdown-adapter.js");

const projectRoot = path.resolve(__dirname, "..");
const fixturePath = path.join(projectRoot, "tests/fixtures/github-markdown.html");
const fixture = fs.readFileSync(fixturePath, "utf8");
const contentSource = fs.readFileSync(path.join(projectRoot, "src/content/content.js"), "utf8");
const cssSource = fs.readFileSync(path.join(projectRoot, "src/content/rtl.css"), "utf8");

test("recognizes only GitHub repository Markdown routes", () => {
  assert.equal(adapter.matchesLocation({ hostname: "github.com" }), true);
  assert.equal(adapter.matchesLocation({ hostname: "gist.github.com" }), false);

  for (const pathname of [
    "/owner/repository",
    "/owner/repository/",
    "/owner/repository/tree/main",
    "/owner/repository/tree/main/docs",
    "/owner/repository/blob/main/README.md",
    "/owner/repository/blob/main/docs/GUIDE.MARKDOWN"
  ]) {
    assert.equal(adapter.isSupportedPath(pathname), true, pathname);
  }

  for (const pathname of [
    "/owner/repository/issues/1",
    "/owner/repository/pull/2",
    "/owner/repository/discussions/3",
    "/owner/repository/blob/main/src/app.js",
    "/owner/repository/raw/main/README.md",
    "/settings/profile"
  ]) {
    assert.equal(adapter.isSupportedPath(pathname), false, pathname);
  }
});

test("uses a semantic rendered-Markdown root and excludes conversation contexts", () => {
  assert.equal(adapter.MARKDOWN_ROOT_SELECTOR, "article.markdown-body");
  assert.match(adapter.EXCLUDED_CONTEXT_SELECTOR, /comment-body/u);
  assert.match(adapter.EXCLUDED_CONTEXT_SELECTOR, /issue-body/u);
  assert.match(adapter.EXCLUDED_CONTEXT_SELECTOR, /discussion-body/u);
  assert.match(adapter.selectors.ignored, /code/u);
  assert.match(adapter.selectors.ignored, /pre/u);
  assert.match(adapter.selectors.ignored, /code-viewer/u);
  assert.match(adapter.selectors.ignored, /diff-table/u);
});

test("fixture covers GitHub Markdown blocks, dynamic content, cleanup, and exact text preservation", () => {
  for (const id of [
    "mixed-heading",
    "english-paragraph",
    "persian-paragraph",
    "english-prefix",
    "technical-paragraph",
    "inline-code",
    "linked-paragraph",
    "ordered-rtl",
    "unordered-rtl",
    "nested-rtl",
    "nested-english",
    "task-item",
    "blockquote-paragraph",
    "persian-heading-cell",
    "persian-cell",
    "fenced-code",
    "outside-markdown",
    "excluded-comment"
  ]) {
    assert.match(fixture, new RegExp(`id=["']${id}["']`, "u"), id);
  }

  assert.match(fixture, /Dynamic Markdown insertion is processed/u);
  assert.match(fixture, /Disable removes every extension class/u);
  assert.match(fixture, /Disable preserves exact Markdown text/u);
  assert.match(fixture, /Initial Markdown text is preserved/u);
  assert.match(fixture, /getComputedStyle\([^\n]+"::marker"\)\.direction === "rtl"/u);
  assert.doesNotMatch(fixture, /\.innerHTML\s*=/u);
});

test("shared processor is adapter-scoped and preserves DOM content", () => {
  assert.match(contentSource, /globalThis\.AdoRtlSiteAdapter/u);
  assert.match(contentSource, /siteAdapter\.getProcessingScopes/u);
  assert.match(contentSource, /siteAdapter\.containsBlock/u);
  assert.doesNotMatch(contentSource, /\.innerHTML\s*=/u);
  assert.doesNotMatch(contentSource, /\.textContent\s*=/u);
  assert.doesNotMatch(contentSource, /createElement\(["']bdi["']\)/u);
  assert.doesNotMatch(contentSource, /\bsetInterval\s*\(/u);
});

test("GitHub CSS isolates inline and fenced code without global RTL rules", () => {
  assert.match(cssSource, /article\.markdown-body \.ado-rtl-text-block code/u);
  assert.match(cssSource, /unicode-bidi:\s*isolate/u);
  assert.match(cssSource, /article\.markdown-body \.ado-rtl-text-block pre/u);
  assert.doesNotMatch(cssSource, /(?:^|\n)\s*(?:body|\.markdown-body\s+\*)\s*\{/u);
});

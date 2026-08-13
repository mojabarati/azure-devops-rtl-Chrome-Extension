"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(projectRoot, "manifest.json"), "utf8"));

test("uses Manifest V3 and the expected initial version", () => {
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.version, "0.1.0");
});

test("requests only storage permission", () => {
  assert.deepEqual(manifest.permissions, ["storage"]);
  assert.equal(manifest.host_permissions, undefined);
});

test("content scripts only match supported Azure DevOps cloud hosts", () => {
  assert.deepEqual(manifest.content_scripts[0].matches, [
    "https://dev.azure.com/*",
    "https://*.visualstudio.com/*"
  ]);
});

test("every manifest file reference exists", () => {
  const references = [
    manifest.background.service_worker,
    manifest.action.default_popup,
    ...Object.values(manifest.action.default_icon),
    ...manifest.content_scripts.flatMap((entry) => [...entry.js, ...entry.css])
  ];

  for (const reference of references) {
    assert.equal(fs.existsSync(path.join(projectRoot, reference)), true, reference);
  }
});

test("content processing avoids destructive or continuously polling APIs", () => {
  const source = fs.readFileSync(path.join(projectRoot, "src/content/content.js"), "utf8");

  assert.doesNotMatch(source, /\.innerHTML\s*=/u);
  assert.doesNotMatch(source, /\beval\s*\(/u);
  assert.doesNotMatch(source, /\bsetInterval\s*\(/u);
  assert.match(source, /new MutationObserver\(/u);
});

test("RTL styling uses an isolated paragraph direction", () => {
  const css = fs.readFileSync(path.join(projectRoot, "src/content/rtl.css"), "utf8");

  assert.match(css, /direction:\s*rtl/u);
  assert.match(css, /unicode-bidi:\s*isolate/u);
});

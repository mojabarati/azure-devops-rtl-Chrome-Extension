"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(projectRoot, "manifest.json"), "utf8"));

test("uses Manifest V3 and the expected release version", () => {
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.version, "0.1.2");
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
  assert.doesNotMatch(source, /createElement\(["']bdi["']\)/u);
  assert.doesNotMatch(source, /\.style\.direction\s*=/u);
  assert.match(source, /new MutationObserver\(/u);
  assert.match(source, /createTreeWalker\(/u);
  assert.doesNotMatch(source, /querySelectorAll\([^\n]*"div"[^\n]*"span"/u);
});

test("RTL styling overrides only the confirmed text block", () => {
  const css = fs.readFileSync(path.join(projectRoot, "src/content/rtl.css"), "utf8");

  assert.match(css, /\.ado-rtl-text-block/u);
  assert.match(css, /direction:\s*rtl/u);
  assert.match(css, /text-align:\s*right/u);
  assert.doesNotMatch(css, /unicode-bidi/u);
});

test("logical-block helper loads before the content processor", () => {
  const scripts = manifest.content_scripts[0].js;
  assert.ok(scripts.indexOf("src/content/dom-utils.js") < scripts.indexOf("src/content/content.js"));
});

test("real Rooster browser regression fixture is included", () => {
  const fixturePath = path.join(projectRoot, "tests/fixtures/rooster-editor.html");
  assert.equal(fs.existsSync(fixturePath), true);

  const fixture = fs.readFileSync(fixturePath, "utf8");
  assert.match(fixture, /lean-rooster rooster-editor/u);
  assert.match(fixture, /id="persian-block" style="direction:ltr"/u);
  assert.match(fixture, /const onBlock = snapshot\(persianBlock\)/u);
  assert.match(fixture, /onBlock\.computedDirection === "rtl"/u);
});

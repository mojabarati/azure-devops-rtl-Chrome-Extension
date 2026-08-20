"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(projectRoot, "manifest.json"), "utf8"));

test("uses Manifest V3 and the expected release version", () => {
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.version, "1.2.0");
  assert.ok(manifest.description.length <= 132);
});

test("requests only storage permission", () => {
  assert.deepEqual(manifest.permissions, ["storage"]);
  assert.equal(manifest.host_permissions, undefined);
  assert.doesNotMatch(JSON.stringify(manifest), /<all_urls>/u);
});

test("content scripts only match supported Azure DevOps and GitHub hosts", () => {
  const azureScript = manifest.content_scripts.find((entry) => entry.matches.includes("https://dev.azure.com/*"));
  const githubScript = manifest.content_scripts.find((entry) => entry.matches.includes("https://github.com/*"));

  assert.deepEqual(azureScript.matches, [
    "https://dev.azure.com/*",
    "https://*.visualstudio.com/*"
  ]);
  assert.deepEqual(githubScript.matches, ["https://github.com/*"]);
  assert.equal(manifest.content_scripts.length, 2);
  assert.match(githubScript.js.join("\n"), /github-markdown-adapter\.js/u);
  assert.doesNotMatch(githubScript.js.join("\n"), /azure-selectors\.js/u);
  assert.match(azureScript.js.join("\n"), /azure-selectors\.js/u);
  assert.doesNotMatch(azureScript.js.join("\n"), /github-markdown-adapter\.js/u);
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

test("uses the supplied Azure RTL logo at every Chrome icon size", () => {
  assert.deepEqual(manifest.icons, {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  });
  assert.deepEqual(manifest.action.default_icon, {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png"
  });

  const popup = fs.readFileSync(path.join(projectRoot, manifest.action.default_popup), "utf8");
  assert.match(popup, /\.\.\/\.\.\/icons\/icon48\.png/u);
  assert.match(popup, /RTL analysis happens locally on your device/u);
  assert.match(popup, /Reporting an issue opens Gmail only when you choose to do so/u);
});

test("stores only independent default-off local preferences", () => {
  const sources = [
    "src/shared/preferences.js",
    "src/background/service-worker.js",
    "src/content/content.js",
    "src/popup/popup.js"
  ].map((file) => fs.readFileSync(path.join(projectRoot, file), "utf8")).join("\n");

  assert.doesNotMatch(sources, /chrome\.storage\.sync/u);
  assert.match(sources, /rtlFixEnabled/u);
  assert.match(sources, /azureRtlFixEnabled/u);
  assert.match(sources, /githubRtlFixEnabled/u);
  assert.match(sources, /legacyValue[\s\S]*:\s*false/u);
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
  const baseRule = css.match(/\.ado-rtl-text-block\s*\{[^}]+\}/u)?.[0] || "";

  assert.match(css, /\.ado-rtl-text-block/u);
  assert.match(baseRule, /direction:\s*rtl/u);
  assert.match(baseRule, /text-align:\s*right/u);
  assert.doesNotMatch(baseRule, /unicode-bidi/u);
  assert.match(css, /article\.markdown-body[^}]+unicode-bidi:\s*isolate/su);
});

test("site adapters and logical-block helper load before the shared content processor", () => {
  for (const entry of manifest.content_scripts) {
    const scripts = entry.js;
    assert.equal(scripts[0], "src/shared/preferences.js");
    assert.ok(scripts.indexOf("src/content/dom-utils.js") < scripts.indexOf("src/content/content.js"));
    assert.ok(
      scripts.some((script) => /(?:azure-selectors|github-markdown-adapter)\.js$/u.test(script)),
      entry.matches.join(",")
    );
  }
});

test("real Rooster browser regression fixture is included", () => {
  const fixturePath = path.join(projectRoot, "tests/fixtures/rooster-editor.html");
  assert.equal(fs.existsSync(fixturePath), true);

  const fixture = fs.readFileSync(fixturePath, "utf8");
  assert.match(fixture, /lean-rooster rooster-editor/u);
  assert.match(fixture, /id="persian-block" style="direction:ltr"/u);
  assert.match(fixture, /const onBlock = snapshot\(persianBlock\)/u);
  assert.match(fixture, /onBlock\.computedDirection === "rtl"/u);
  assert.match(fixture, /id="ordered-mixed"/u);
  assert.match(fixture, /id="unordered-mixed"/u);
  assert.match(fixture, /getComputedStyle\(orderedMixed, "::marker"\)\.direction === "rtl"/u);
});

test("GitHub rendered Markdown browser regression fixture is included", () => {
  const fixturePath = path.join(projectRoot, "tests/fixtures/github-markdown.html");
  assert.equal(fs.existsSync(fixturePath), true);

  const fixture = fs.readFileSync(fixturePath, "utf8");
  assert.match(fixture, /article class="markdown-body entry-content container-lg" itemprop="text"/u);
  assert.match(fixture, /PASS — GitHub Rendered Markdown RTL Fixer/u);
  assert.match(fixture, /Dynamic Markdown insertion is processed/u);
  assert.match(fixture, /Disable preserves exact Markdown text/u);
});

"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");
const popupHtml = fs.readFileSync(path.join(projectRoot, "src/popup/popup.html"), "utf8");
const popupCss = fs.readFileSync(path.join(projectRoot, "src/popup/popup.css"), "utf8");
const popupSource = fs.readFileSync(path.join(projectRoot, "src/popup/popup.js"), "utf8");
const preferencesSource = fs.readFileSync(path.join(projectRoot, "src/shared/preferences.js"), "utf8");

function createClassList() {
  const classes = new Set();
  return {
    contains(name) {
      return classes.has(name);
    },
    toggle(name, force) {
      if (force) {
        classes.add(name);
      } else {
        classes.delete(name);
      }
    }
  };
}

function createToggle() {
  const handlers = {};
  const attributes = {};
  return {
    attributes,
    checked: false,
    disabled: true,
    handlers,
    addEventListener(type, handler) {
      handlers[type] = handler;
    },
    setAttribute(name, value) {
      attributes[name] = value;
    }
  };
}

function runPopup({
  stored = { azureRtlFixEnabled: false, githubRtlFixEnabled: false },
  supported = true,
  platformId = "azure-devops",
  version = "1.0.0",
  hasContentScript = true
} = {}) {
  const storageWrites = [];
  const tabMessages = [];
  const storage = { ...stored };
  const elements = {
    "#azure-toggle": createToggle(),
    "#github-toggle": createToggle(),
    "#azure-state": { textContent: "Off" },
    "#github-state": { textContent: "Off" },
    "#status": { classList: createClassList() },
    "#status-title": { textContent: "Checking this pageâ€¦" },
    "#status-message": { textContent: "Your saved preferences are still available." },
    "#report-issue": { href: "" }
  };

  const chrome = {
    runtime: {
      lastError: null,
      getManifest() {
        return { version };
      }
    },
    storage: {
      local: {
        get(_keys, callback) {
          callback({ ...storage });
        },
        set(value, callback) {
          Object.assign(storage, value);
          storageWrites.push(value);
          callback?.();
        }
      }
    },
    tabs: {
      query(_query, callback) {
        callback([{ id: 42 }]);
      },
      sendMessage(tabId, message, callback) {
        tabMessages.push({ tabId, message });
        chrome.runtime.lastError = hasContentScript ? null : { message: "No receiver" };
        callback?.(hasContentScript ? { supported, platformId } : undefined);
        chrome.runtime.lastError = null;
      }
    }
  };
  const context = vm.createContext({
    chrome,
    document: {
      querySelector(selector) {
        return elements[selector];
      }
    },
    encodeURIComponent,
    globalThis: null
  });
  context.globalThis = context;
  vm.runInContext(preferencesSource, context);
  vm.runInContext(popupSource, context);

  return { elements, storage, storageWrites, tabMessages };
}

test("popup renders two uniquely named, keyboard-accessible platform switches", () => {
  assert.match(popupHtml, /id="azure-toggle"[\s\S]*role="switch"[\s\S]*aria-labelledby="azure-label azure-state"/u);
  assert.match(popupHtml, /id="github-toggle"[\s\S]*role="switch"[\s\S]*aria-labelledby="github-label github-state"/u);
  assert.match(popupHtml, /<label class="platform-row" for="azure-toggle">/u);
  assert.match(popupHtml, /<label class="platform-row" for="github-toggle">/u);
  assert.match(popupCss, /body\s*\{[\s\S]*width:\s*360px/u);
  assert.match(popupCss, /\.platform-row\s*\{[\s\S]*min-height:\s*72px/u);
  assert.match(popupCss, /input:focus-visible \+ \.slider/u);
  assert.match(popupCss, /@media \(prefers-reduced-motion: reduce\)/u);
});

test("popup preserves the accessible Gmail report action", () => {
  assert.match(popupHtml, /<a\s+[\s\S]*id="report-issue"[\s\S]*Report an issue[\s\S]*<\/a>/u);
  assert.match(popupHtml, /aria-label="Report an issue with Azure DevOps RTL Fixer"/u);
  assert.match(popupHtml, /href="https:\/\/mail\.google\.com\/mail\/\?view=cm&amp;fs=1/u);
  assert.match(popupHtml, /target="_blank"/u);
  assert.match(popupHtml, /rel="noopener"/u);
  assert.match(popupHtml, /Reporting an issue opens Gmail only when you choose to do so\./u);
  assert.match(popupCss, /\.report-issue:hover/u);
  assert.match(popupCss, /\.report-issue:focus-visible/u);
  assert.doesNotMatch(`${popupHtml}\n${popupSource}`, /mailto:/iu);
});

test("report action builds a versioned, platform-neutral draft without page information", () => {
  const { elements } = runPopup({ version: "1.2.3" });
  const reportUrl = new URL(elements["#report-issue"].href);
  const body = reportUrl.searchParams.get("body");

  assert.equal(reportUrl.protocol, "https:");
  assert.equal(reportUrl.hostname, "mail.google.com");
  assert.equal(reportUrl.pathname, "/mail/");
  assert.equal(reportUrl.searchParams.get("view"), "cm");
  assert.equal(reportUrl.searchParams.get("fs"), "1");
  assert.equal(reportUrl.searchParams.get("to"), "mojabarati@gmail.com");
  assert.equal(reportUrl.searchParams.get("su"), "Azure DevOps RTL Fixer - Issue Report");
  assert.match(body, /Extension version: 1\.2\.3/u);
  assert.match(body, /Platform: Azure DevOps \/ GitHub/u);
  assert.match(body, /Steps to reproduce:\n1\.\n2\.\n3\./u);
  assert.match(body, /Expected behavior:/u);
  assert.match(body, /Actual behavior:/u);
  assert.doesNotMatch(body, /https?:\/\//u);
  assert.doesNotMatch(body, /organization name|project name|page content/iu);
});

test("each popup switch reflects and persists only its own platform preference", () => {
  const result = runPopup({
    stored: { azureRtlFixEnabled: true, githubRtlFixEnabled: false },
    platformId: "azure-devops"
  });
  const azureToggle = result.elements["#azure-toggle"];
  const githubToggle = result.elements["#github-toggle"];

  assert.equal(azureToggle.checked, true);
  assert.equal(githubToggle.checked, false);
  assert.equal(azureToggle.disabled, false);
  assert.equal(githubToggle.disabled, false);
  assert.equal(azureToggle.attributes["aria-checked"], "true");
  assert.equal(githubToggle.attributes["aria-checked"], "false");
  assert.equal(result.elements["#status-title"].textContent, "Azure DevOps detected");
  assert.equal(result.elements["#status-message"].textContent, "Azure DevOps RTL is active on this page.");

  githubToggle.checked = true;
  githubToggle.handlers.change();
  assert.equal(JSON.stringify(result.storageWrites.at(-1)), JSON.stringify({ githubRtlFixEnabled: true }));
  assert.equal(result.storage.azureRtlFixEnabled, true);
  assert.equal(result.elements["#status-message"].textContent, "Azure DevOps RTL is active on this page.");

  azureToggle.checked = false;
  azureToggle.handlers.change();
  assert.equal(JSON.stringify(result.storageWrites.at(-1)), JSON.stringify({ azureRtlFixEnabled: false }));
  assert.equal(result.storage.githubRtlFixEnabled, true);
  assert.equal(result.elements["#status-message"].textContent, "Azure DevOps RTL is disabled.");
  assert.deepEqual(result.tabMessages.map(({ message }) => message.type), ["ADO_RTL_GET_STATUS"]);
});

test("popup status is platform-aware for GitHub Markdown", () => {
  const result = runPopup({
    stored: { azureRtlFixEnabled: false, githubRtlFixEnabled: true },
    platformId: "github-markdown"
  });

  assert.equal(result.elements["#status-title"].textContent, "GitHub Markdown detected");
  assert.equal(result.elements["#status-message"].textContent, "GitHub Markdown RTL is active on this page.");
});

test("unsupported pages still allow both saved preferences to be changed", () => {
  const result = runPopup({
    stored: { azureRtlFixEnabled: false, githubRtlFixEnabled: true },
    hasContentScript: false
  });

  assert.equal(result.elements["#status-title"].textContent, "No supported page detected");
  assert.equal(
    result.elements["#status-message"].textContent,
    "Open a supported Azure DevOps or GitHub Markdown page."
  );
  assert.equal(result.elements["#azure-toggle"].disabled, false);
  assert.equal(result.elements["#github-toggle"].disabled, false);
});

test("reopening the popup restores both independent values", () => {
  const first = runPopup({ stored: { azureRtlFixEnabled: false, githubRtlFixEnabled: false } });
  first.elements["#azure-toggle"].checked = true;
  first.elements["#azure-toggle"].handlers.change();

  const reopened = runPopup({ stored: first.storage });
  assert.equal(reopened.elements["#azure-toggle"].checked, true);
  assert.equal(reopened.elements["#github-toggle"].checked, false);
});

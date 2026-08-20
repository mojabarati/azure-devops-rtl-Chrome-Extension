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

function runPopup({ storedEnabled = false, supported = true, version = "1.0.0" } = {}) {
  const changeHandlers = [];
  const storageWrites = [];
  const tabMessages = [];
  const elements = {
    "#enabled-toggle": {
      checked: false,
      addEventListener(type, handler) {
        if (type === "change") {
          changeHandlers.push(handler);
        }
      }
    },
    "#state-label": { textContent: "Off" },
    "#status": { classList: createClassList(), textContent: "Checking this page…" },
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
        get(_defaults, callback) {
          callback({ rtlFixEnabled: storedEnabled });
        },
        set(value) {
          storageWrites.push(value);
        }
      }
    },
    tabs: {
      query(_query, callback) {
        callback([{ id: 42 }]);
      },
      sendMessage(tabId, message, callback) {
        tabMessages.push({ tabId, message });
        callback?.(message.type === "ADO_RTL_GET_STATUS" ? { supported } : undefined);
      }
    }
  };

  vm.runInNewContext(popupSource, {
    chrome,
    document: {
      querySelector(selector) {
        return elements[selector];
      }
    },
    encodeURIComponent
  });

  return { changeHandlers, elements, storageWrites, tabMessages };
}

test("popup exposes an accessible report action with compact interaction states", () => {
  assert.match(popupHtml, /<a\s+[\s\S]*id="report-issue"[\s\S]*Report an issue[\s\S]*<\/a>/u);
  assert.match(popupHtml, /aria-label="Report an issue with Azure DevOps RTL Fixer"/u);
  assert.match(popupHtml, /href="https:\/\/mail\.google\.com\/mail\/\?view=cm&amp;fs=1/u);
  assert.match(popupHtml, /target="_blank"/u);
  assert.match(popupHtml, /rel="noopener"/u);
  assert.match(popupHtml, /Reporting an issue opens Gmail only when you choose to do so\./u);
  assert.match(popupCss, /body\s*\{[\s\S]*width:\s*330px/u);
  assert.match(popupCss, /\.report-issue:hover/u);
  assert.match(popupCss, /\.report-issue:focus-visible/u);
  assert.doesNotMatch(`${popupHtml}\n${popupSource}`, /mailto:/iu);
});

test("report action builds a versioned mail draft without page information", () => {
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
  assert.match(body, /Extension version: 1\.2\.3\n\nIssue description:/u);
  assert.match(body, /Steps to reproduce:\n1\.\n2\.\n3\./u);
  assert.match(body, /Expected behavior:/u);
  assert.match(body, /Actual behavior:/u);
  assert.doesNotMatch(body, /https?:\/\//u);
  assert.doesNotMatch(body, /organization name|project name|page content/iu);
});

test("existing toggle flow remains unchanged", () => {
  const result = runPopup({ storedEnabled: true, supported: true });
  const toggle = result.elements["#enabled-toggle"];

  assert.equal(toggle.checked, true);
  assert.equal(result.elements["#state-label"].textContent, "On");
  assert.equal(result.elements["#status"].textContent, "RTL Fix is active on this page.");

  toggle.checked = false;
  result.changeHandlers[0]();

  assert.equal(result.storageWrites.length, 1);
  assert.equal(result.storageWrites[0].rtlFixEnabled, false);
  assert.equal(result.tabMessages.at(-1).tabId, 42);
  assert.equal(result.tabMessages.at(-1).message.type, "ADO_RTL_SET_ENABLED");
  assert.equal(result.tabMessages.at(-1).message.enabled, false);
  assert.equal(result.elements["#state-label"].textContent, "Off");
  assert.equal(result.elements["#status"].textContent, "RTL Fix is disabled.");
});

test("popup names both supported environments when the current page is unsupported", () => {
  const result = runPopup({ storedEnabled: false, supported: false });

  assert.equal(
    result.elements["#status"].textContent,
    "Open a supported Azure DevOps or GitHub Markdown page."
  );
});

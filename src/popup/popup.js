"use strict";

const STORAGE_KEY = "rtlFixEnabled";
const REPORT_EMAIL = "mojabarati@gmail.com";
const REPORT_SUBJECT = "Azure DevOps RTL Fixer - Issue Report";
const GMAIL_COMPOSE_URL = "https://mail.google.com/mail/?view=cm&fs=1";
const toggle = document.querySelector("#enabled-toggle");
const stateLabel = document.querySelector("#state-label");
const status = document.querySelector("#status");
const reportIssueLink = document.querySelector("#report-issue");
let activeTabId = null;
let pageSupported = false;

function buildIssueReportUrl(version) {
  const body = [
    "Hi,",
    "",
    "I found an issue with Azure DevOps RTL Fixer.",
    "",
    `Extension version: ${version}`,
    "",
    "Issue description:",
    "",
    "Steps to reproduce:",
    "1.",
    "2.",
    "3.",
    "",
    "Expected behavior:",
    "",
    "Actual behavior:",
    "",
    "Additional information:"
  ].join("\n");

  return `${GMAIL_COMPOSE_URL}&to=${encodeURIComponent(REPORT_EMAIL)}&su=${encodeURIComponent(REPORT_SUBJECT)}&body=${encodeURIComponent(body)}`;
}

reportIssueLink.href = buildIssueReportUrl(chrome.runtime.getManifest().version);

function updateView(enabled) {
  toggle.checked = enabled;
  stateLabel.textContent = enabled ? "On" : "Off";
  status.classList.toggle("active", pageSupported && enabled);
  status.classList.toggle("inactive", pageSupported && !enabled);

  if (!pageSupported) {
    status.textContent = "Open an Azure DevOps page to use RTL Fixer.";
  } else if (enabled) {
    status.textContent = "RTL Fix is active on this Azure DevOps page.";
  } else {
    status.textContent = "RTL Fix is disabled.";
  }
}

function sendToActiveTab(message) {
  if (activeTabId === null) {
    return;
  }

  chrome.tabs.sendMessage(activeTabId, message, () => {
    void chrome.runtime.lastError;
  });
}

toggle.addEventListener("change", () => {
  const enabled = toggle.checked;
  chrome.storage.local.set({ [STORAGE_KEY]: enabled });
  sendToActiveTab({ type: "ADO_RTL_SET_ENABLED", enabled });
  updateView(enabled);
});

chrome.storage.local.get({ [STORAGE_KEY]: false }, (result) => {
  const storedEnabled = result[STORAGE_KEY];

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    activeTabId = tabs[0]?.id ?? null;

    if (activeTabId === null) {
      updateView(storedEnabled);
      return;
    }

    chrome.tabs.sendMessage(activeTabId, { type: "ADO_RTL_GET_STATUS" }, (response) => {
      pageSupported = !chrome.runtime.lastError && Boolean(response?.supported);
      // Storage is the canonical setting. The content script may still be
      // completing its asynchronous initialization when the popup opens.
      updateView(storedEnabled);
    });
  });
});

"use strict";

const REPORT_EMAIL = "mojabarati@gmail.com";
const REPORT_SUBJECT = "Azure DevOps RTL Fixer - Issue Report";
const GMAIL_COMPOSE_URL = "https://mail.google.com/mail/?view=cm&fs=1";
const preferencesApi = globalThis.AdoRtlPreferences;
const statusCard = document.querySelector("#status");
const statusTitle = document.querySelector("#status-title");
const statusMessage = document.querySelector("#status-message");
const reportIssueLink = document.querySelector("#report-issue");
const controls = {
  "azure-devops": {
    key: preferencesApi.AZURE_KEY,
    toggle: document.querySelector("#azure-toggle"),
    stateLabel: document.querySelector("#azure-state")
  },
  "github-markdown": {
    key: preferencesApi.GITHUB_KEY,
    toggle: document.querySelector("#github-toggle"),
    stateLabel: document.querySelector("#github-state")
  }
};
let storedPreferences = {
  [preferencesApi.AZURE_KEY]: false,
  [preferencesApi.GITHUB_KEY]: false
};
let pageContext = null;

function buildIssueReportUrl(version) {
  const body = [
    "Hi,",
    "",
    "I found an issue with Azure DevOps RTL Fixer.",
    "",
    `Extension version: ${version}`,
    "Platform: Azure DevOps / GitHub",
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

function updateControl(platformId, enabled) {
  const control = controls[platformId];
  control.toggle.checked = enabled;
  control.toggle.setAttribute("aria-checked", String(enabled));
  control.stateLabel.textContent = enabled ? "On" : "Off";
}

function updateStatus() {
  statusCard.classList.toggle("active", false);
  statusCard.classList.toggle("inactive", false);

  if (!pageContext?.supported || !controls[pageContext.platformId]) {
    statusTitle.textContent = "No supported page detected";
    statusMessage.textContent = "Open a supported Azure DevOps or GitHub Markdown page.";
    return;
  }

  const platformId = pageContext.platformId;
  const enabled = storedPreferences[controls[platformId].key];
  const platformName = platformId === "azure-devops" ? "Azure DevOps" : "GitHub Markdown";
  statusCard.classList.toggle(enabled ? "active" : "inactive", true);
  statusTitle.textContent = `${platformName} detected`;
  statusMessage.textContent = `${platformName} RTL is ${enabled ? "active on this page" : "disabled"}.`;
}

function applyStoredPreferences(nextPreferences) {
  storedPreferences = nextPreferences;

  for (const [platformId, control] of Object.entries(controls)) {
    updateControl(platformId, nextPreferences[control.key]);
    control.toggle.disabled = false;
  }

  updateStatus();
}

for (const [platformId, control] of Object.entries(controls)) {
  control.toggle.addEventListener("change", () => {
    const enabled = control.toggle.checked;
    storedPreferences = { ...storedPreferences, [control.key]: enabled };
    chrome.storage.local.set({ [control.key]: enabled });
    updateControl(platformId, enabled);
    updateStatus();
  });
}

reportIssueLink.href = buildIssueReportUrl(chrome.runtime.getManifest().version);

preferencesApi.ensureMigrated(chrome.storage.local, (nextPreferences) => {
  applyStoredPreferences(nextPreferences);

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTabId = tabs[0]?.id;
    if (activeTabId === undefined) {
      return;
    }

    chrome.tabs.sendMessage(activeTabId, { type: "ADO_RTL_GET_STATUS" }, (response) => {
      if (!chrome.runtime.lastError && response?.platformId) {
        pageContext = response;
      }
      updateStatus();
    });
  });
});

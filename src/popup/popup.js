"use strict";

const STORAGE_KEY = "rtlFixEnabled";
const toggle = document.querySelector("#enabled-toggle");
const stateLabel = document.querySelector("#state-label");
const status = document.querySelector("#status");
let activeTabId = null;
let pageSupported = false;

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

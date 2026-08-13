"use strict";

const STORAGE_KEY = "rtlFixEnabled";

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(STORAGE_KEY, (result) => {
    if (typeof result[STORAGE_KEY] !== "boolean") {
      chrome.storage.local.set({ [STORAGE_KEY]: false });
    }
  });
});

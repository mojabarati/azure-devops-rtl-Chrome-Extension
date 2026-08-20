"use strict";

importScripts("../shared/preferences.js");

chrome.runtime.onInstalled.addListener(() => {
  globalThis.AdoRtlPreferences.ensureMigrated(chrome.storage.local);
});

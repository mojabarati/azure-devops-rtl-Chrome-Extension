(function exposeRtlPreferences(root, factory) {
  const preferences = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = preferences;
  }

  if (root) {
    root.AdoRtlPreferences = preferences;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createRtlPreferences() {
  "use strict";

  const LEGACY_KEY = "rtlFixEnabled";
  const AZURE_KEY = "azureRtlFixEnabled";
  const GITHUB_KEY = "githubRtlFixEnabled";
  const PLATFORM_KEYS = Object.freeze({
    "azure-devops": AZURE_KEY,
    "github-markdown": GITHUB_KEY
  });
  const PLATFORM_IDS = Object.freeze(Object.keys(PLATFORM_KEYS));

  function isBoolean(value) {
    return typeof value === "boolean";
  }

  function resolveStoredPreferences(stored = {}) {
    const legacyValue = isBoolean(stored[LEGACY_KEY]) ? stored[LEGACY_KEY] : false;
    return {
      [AZURE_KEY]: isBoolean(stored[AZURE_KEY]) ? stored[AZURE_KEY] : legacyValue,
      [GITHUB_KEY]: isBoolean(stored[GITHUB_KEY]) ? stored[GITHUB_KEY] : legacyValue
    };
  }

  function createMigrationPatch(stored = {}) {
    const resolved = resolveStoredPreferences(stored);
    const patch = {};

    for (const key of [AZURE_KEY, GITHUB_KEY]) {
      if (!isBoolean(stored[key])) {
        patch[key] = resolved[key];
      }
    }

    return patch;
  }

  function ensureMigrated(storageArea, callback) {
    storageArea.get([LEGACY_KEY, AZURE_KEY, GITHUB_KEY], (stored) => {
      const resolved = resolveStoredPreferences(stored);
      const patch = createMigrationPatch(stored);
      const finish = () => callback?.(resolved);

      if (Object.keys(patch).length > 0) {
        storageArea.set(patch, finish);
      } else {
        finish();
      }
    });
  }

  function getStorageKey(platformId) {
    return PLATFORM_KEYS[platformId] || null;
  }

  function listenForPlatformChanges(storageApi, platformId, callback) {
    const storageKey = getStorageKey(platformId);
    if (!storageKey) {
      return null;
    }

    const listener = (changes, areaName) => {
      if (areaName === "local" && changes[storageKey]) {
        callback(changes[storageKey].newValue);
      }
    };
    storageApi.onChanged.addListener(listener);
    return listener;
  }

  return Object.freeze({
    LEGACY_KEY,
    AZURE_KEY,
    GITHUB_KEY,
    PLATFORM_IDS,
    PLATFORM_KEYS,
    resolveStoredPreferences,
    createMigrationPatch,
    ensureMigrated,
    getStorageKey,
    listenForPlatformChanges
  });
});

"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const preferences = require("../src/shared/preferences.js");

const {
  LEGACY_KEY,
  AZURE_KEY,
  GITHUB_KEY,
  resolveStoredPreferences,
  createMigrationPatch,
  ensureMigrated,
  listenForPlatformChanges
} = preferences;

test("resolves all four independent platform combinations", () => {
  for (const [azure, github] of [[false, false], [true, false], [false, true], [true, true]]) {
    assert.deepEqual(
      resolveStoredPreferences({ [AZURE_KEY]: azure, [GITHUB_KEY]: github }),
      { [AZURE_KEY]: azure, [GITHUB_KEY]: github }
    );
  }
});

test("migrates a true legacy preference to both platforms", () => {
  assert.deepEqual(createMigrationPatch({ [LEGACY_KEY]: true }), {
    [AZURE_KEY]: true,
    [GITHUB_KEY]: true
  });
});

test("migrates a false or missing legacy preference to the default-off state", () => {
  assert.deepEqual(createMigrationPatch({ [LEGACY_KEY]: false }), {
    [AZURE_KEY]: false,
    [GITHUB_KEY]: false
  });
  assert.deepEqual(createMigrationPatch({}), {
    [AZURE_KEY]: false,
    [GITHUB_KEY]: false
  });
});

test("explicit platform values win over the legacy preference", () => {
  const stored = { [LEGACY_KEY]: true, [AZURE_KEY]: false, [GITHUB_KEY]: true };
  assert.deepEqual(resolveStoredPreferences(stored), {
    [AZURE_KEY]: false,
    [GITHUB_KEY]: true
  });
  assert.deepEqual(createMigrationPatch(stored), {});
});

test("migration persists only missing platform keys", () => {
  const writes = [];
  const storageArea = {
    get(_keys, callback) {
      callback({ [LEGACY_KEY]: true, [AZURE_KEY]: false });
    },
    set(value, callback) {
      writes.push(value);
      callback();
    }
  };

  ensureMigrated(storageArea, (resolved) => {
    assert.deepEqual(resolved, { [AZURE_KEY]: false, [GITHUB_KEY]: true });
  });
  assert.deepEqual(writes, [{ [GITHUB_KEY]: true }]);
});

test("platform listeners react immediately only to their matching key", () => {
  const listeners = [];
  const storageApi = { onChanged: { addListener(listener) { listeners.push(listener); } } };
  const azureEvents = [];
  const githubEvents = [];
  listenForPlatformChanges(storageApi, "azure-devops", (enabled) => azureEvents.push(enabled));
  listenForPlatformChanges(storageApi, "github-markdown", (enabled) => githubEvents.push(enabled));

  for (const listener of listeners) {
    listener({ [AZURE_KEY]: { newValue: true } }, "local");
  }
  assert.deepEqual(azureEvents, [true]);
  assert.deepEqual(githubEvents, []);

  for (const listener of listeners) {
    listener({ [GITHUB_KEY]: { newValue: false } }, "local");
  }
  assert.deepEqual(azureEvents, [true]);
  assert.deepEqual(githubEvents, [false]);

  for (const listener of listeners) {
    listener({ [AZURE_KEY]: { newValue: false } }, "sync");
  }
  assert.deepEqual(azureEvents, [true]);
});

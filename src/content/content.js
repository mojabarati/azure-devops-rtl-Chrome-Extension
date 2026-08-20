(function initializeAdoRtlFixer() {
  "use strict";

  const DEBUG = false;
  const RTL_CLASS = "ado-rtl-text-block";
  const MAX_BLOCKS_PER_SLICE = 100;
  const ROOSTER_INPUT_DELAY_MS = 80;
  const detector = globalThis.AdoRtlDetector;
  const domUtils = globalThis.AdoRtlDomUtils;
  const siteAdapter = globalThis.AdoRtlSiteAdapter;
  const preferences = globalThis.AdoRtlPreferences;
  const selectors = siteAdapter?.selectors;
  const storageKey = preferences?.getStorageKey(siteAdapter?.id);

  if (!detector || !siteAdapter || !selectors || !domUtils || !preferences || !storageKey) {
    return;
  }

  let enabled = false;
  let observer = null;
  let flushScheduled = false;
  const pendingRoots = new Map();
  const modifiedBlocks = new Set();
  const originalClassState = new WeakMap();
  const roosterInputTimers = new Map();

  function isElement(node) {
    return node?.nodeType === Node.ELEMENT_NODE;
  }

  function isRoosterEditor(element) {
    return Boolean(element?.matches?.(selectors.roosterEditor));
  }

  function meaningfulText(element) {
    const text = element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement
      ? element.value
      : element.textContent || "";

    return text.replace(/[\s\u200b-\u200d\u2060\ufeff]/gu, "").length > 0 ? text : "";
  }

  function directionSnapshot(element) {
    const style = getComputedStyle(element);
    return {
      element,
      text: element.textContent?.trim(),
      dirAttribute: element.getAttribute("dir"),
      inlineDirection: element.style?.direction || "",
      computedDirection: style.direction,
      textAlign: style.textAlign,
      unicodeBidi: style.unicodeBidi,
      display: style.display
    };
  }

  function debugDirection(element, force = false) {
    if (element && (DEBUG || force)) {
      console.log("[ADO RTL Fixer]", directionSnapshot(element));
    }
  }

  function debugRoosterContext(block) {
    if (!DEBUG) {
      return;
    }

    const editor = block.closest(selectors.roosterEditor);
    if (editor) {
      debugDirection(editor);
      debugDirection(block);
      const span = block.querySelector("span");
      if (span) {
        debugDirection(span);
      }
    }
  }

  globalThis.AdoRtlFixerDebug = Object.freeze({
    inspect(element) {
      debugDirection(element, true);
    },
    inspectRooster(editor) {
      if (!isRoosterEditor(editor)) {
        return;
      }
      debugDirection(editor, true);
      for (const block of collectBlocks(editor)) {
        debugDirection(block, true);
        const span = block.querySelector?.("span");
        if (span) {
          debugDirection(span, true);
        }
      }
    }
  });

  function applyBlock(block) {
    if (!block.classList.contains(RTL_CLASS)) {
      originalClassState.set(block, {
        hadClassAttribute: block.hasAttribute("class")
      });
      block.classList.add(RTL_CLASS);
      modifiedBlocks.add(block);
    }
  }

  function restoreBlock(block) {
    if (!modifiedBlocks.has(block)) {
      return;
    }
    block.classList.remove(RTL_CLASS);
    if (!originalClassState.get(block)?.hadClassAttribute && block.getAttribute("class") === "") {
      block.removeAttribute("class");
    }
    originalClassState.delete(block);
    modifiedBlocks.delete(block);
  }

  function processTextBlock(block) {
    if (!block?.isConnected) {
      return;
    }

    const text = meaningfulText(block);
    if (text && detector.shouldUseRtlParagraph(text)) {
      applyBlock(block);
      debugRoosterContext(block);
    } else {
      restoreBlock(block);
    }
  }

  function addTextNodeBlock(textNode, blocks, boundary) {
    const existingBlock = textNode.parentElement?.closest?.(`.${RTL_CLASS}`);
    if (
      existingBlock &&
      modifiedBlocks.has(existingBlock) &&
      (!boundary || boundary.contains(existingBlock))
    ) {
      blocks.add(existingBlock);
    }

    if (!detector.containsRtlText(textNode.data)) {
      return;
    }

    const block = domUtils.findLogicalTextBlock(textNode, selectors, boundary);
    if (block) {
      blocks.add(block);
    }
  }

  function collectBlocks(root, boundary = null) {
    const blocks = new Set();

    if (root?.nodeType === Node.TEXT_NODE) {
      addTextNodeBlock(root, blocks, boundary);
      return blocks;
    }

    if (!(root instanceof Element || root instanceof Document || root instanceof DocumentFragment)) {
      return blocks;
    }

    if (isElement(root)) {
      const existingAncestor = root.closest(`.${RTL_CLASS}`);
      if (existingAncestor && modifiedBlocks.has(existingAncestor)) {
        blocks.add(existingAncestor);
      }
    }

    for (const existing of root.querySelectorAll?.(`.${RTL_CLASS}`) || []) {
      if (modifiedBlocks.has(existing)) {
        blocks.add(existing);
      }
    }

    const walker = (root.ownerDocument || document).createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let textNode = walker.nextNode();
    while (textNode) {
      addTextNodeBlock(textNode, blocks, boundary);
      textNode = walker.nextNode();
    }

    const editables = [];
    if (isElement(root) && root.matches(selectors.editable)) {
      editables.push(root);
    }
    editables.push(...(root.querySelectorAll?.(selectors.editable) || []));

    for (const editable of editables) {
      // Rooster contenteditable roots are containers, including in view mode.
      // Their actual child line blocks are discovered through text nodes.
      if (isRoosterEditor(editable)) {
        continue;
      }

      const text = meaningfulText(editable);
      if (detector.containsRtlText(text) || modifiedBlocks.has(editable)) {
        blocks.add(editable);
      }
    }

    return blocks;
  }

  function processRoot(root, boundary = null) {
    const blocks = [...collectBlocks(root, boundary)];
    let index = 0;

    function processSlice(deadline) {
      if (!enabled) {
        return;
      }

      let processed = 0;
      while (
        index < blocks.length &&
        processed < MAX_BLOCKS_PER_SLICE &&
        (!deadline || deadline.timeRemaining() > 1)
      ) {
        processTextBlock(blocks[index]);
        index += 1;
        processed += 1;
      }

      if (index < blocks.length) {
        scheduleIdle(processSlice);
      }
    }

    processSlice();
  }

  function processRoosterEditor(editor) {
    if (!enabled || !editor?.isConnected) {
      return;
    }

    if (DEBUG) {
      debugDirection(editor);
    }

    processRoot(editor);
  }

  function scheduleIdle(callback) {
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(callback, { timeout: 150 });
    } else {
      setTimeout(() => callback(null), 16);
    }
  }

  function enqueue(root) {
    if (!enabled || !root) {
      return;
    }

    for (const scope of siteAdapter.getProcessingScopes(root, document, globalThis.location)) {
      pendingRoots.set(scope.root, scope.boundary);
    }

    if (pendingRoots.size === 0) {
      return;
    }

    if (!flushScheduled) {
      flushScheduled = true;
      scheduleIdle(flushPending);
    }
  }

  function flushPending() {
    flushScheduled = false;
    if (!enabled) {
      pendingRoots.clear();
      return;
    }

    const roots = [...pendingRoots.entries()];
    pendingRoots.clear();

    for (const [root, boundary] of roots) {
      if (!root || (isElement(root) && !root.isConnected)) {
        continue;
      }
      if (roots.some(([other]) => other !== root && other?.contains?.(root))) {
        continue;
      }
      processRoot(root, boundary);
    }
  }

  function restoreOutOfScopeBlocks() {
    for (const block of [...modifiedBlocks]) {
      if (!siteAdapter.containsBlock(block, document, globalThis.location)) {
        restoreBlock(block);
      }
    }
  }

  function restoreRemovedSubtree(node) {
    for (const block of [...modifiedBlocks]) {
      if (node === block || node?.contains?.(block)) {
        restoreBlock(block);
      }
    }
  }

  function onMutations(mutations) {
    restoreOutOfScopeBlocks();

    for (const mutation of mutations) {
      enqueue(mutation.target);
      for (const node of mutation.addedNodes || []) {
        enqueue(node);
      }
      for (const node of mutation.removedNodes || []) {
        restoreRemovedSubtree(node);
      }
    }
  }

  function scheduleRoosterInput(editor) {
    const existingTimer = roosterInputTimers.get(editor);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      roosterInputTimers.delete(editor);
      processRoosterEditor(editor);
    }, ROOSTER_INPUT_DELAY_MS);
    roosterInputTimers.set(editor, timer);
  }

  function onInput(event) {
    if (!enabled || !isElement(event.target)) {
      return;
    }

    const roosterEditor = event.target.closest(selectors.roosterEditor);
    if (roosterEditor) {
      scheduleRoosterInput(roosterEditor);
      return;
    }

    const editable = event.target.closest(selectors.editable);
    if (editable) {
      processTextBlock(editable);
    }
  }

  function start() {
    if (enabled) {
      return;
    }

    enabled = true;
    for (const scope of siteAdapter.getProcessingScopes(document, document, globalThis.location)) {
      processRoot(scope.root, scope.boundary);
    }
    observer = new MutationObserver(onMutations);
    observer.observe(document.documentElement, {
      childList: true,
      characterData: true,
      subtree: true
    });
    document.addEventListener("input", onInput, true);
    document.addEventListener("change", onInput, true);
  }

  function stop() {
    enabled = false;
    observer?.disconnect();
    observer = null;
    document.removeEventListener("input", onInput, true);
    document.removeEventListener("change", onInput, true);
    pendingRoots.clear();
    flushScheduled = false;

    for (const timer of roosterInputTimers.values()) {
      clearTimeout(timer);
    }
    roosterInputTimers.clear();

    for (const block of [...modifiedBlocks]) {
      restoreBlock(block);
    }
  }

  function setEnabled(nextEnabled) {
    if (Boolean(nextEnabled)) {
      start();
    } else {
      stop();
    }
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "ADO_RTL_GET_STATUS") {
      sendResponse({
        enabled,
        platformId: siteAdapter.id,
        supported: siteAdapter.isPageSupported(document, globalThis.location)
      });
    }
  });

  preferences.listenForPlatformChanges(chrome.storage, siteAdapter.id, setEnabled);

  preferences.ensureMigrated(chrome.storage.local, (stored) => {
    setEnabled(stored[storageKey]);
  });
})();

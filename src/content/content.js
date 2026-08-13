(function initializeAdoRtlFixer() {
  "use strict";

  const DEBUG = false;
  const STORAGE_KEY = "rtlFixEnabled";
  const RTL_CLASS = "ado-rtl-block";
  const CONFLICT_CLASS = "ado-rtl-conflict-reset";
  const GENERATED_ATTRIBUTE = "data-ado-rtl-generated";
  const MAX_BLOCKS_PER_SLICE = 100;
  const detector = globalThis.AdoRtlDetector;
  const selectors = globalThis.AdoRtlSelectors;
  const domUtils = globalThis.AdoRtlDomUtils;

  if (!detector || !selectors || !domUtils) {
    return;
  }

  let enabled = false;
  let observer = null;
  let flushScheduled = false;
  const pendingRoots = new Set();
  const modifiedBlocks = new Set();
  const conflictResets = new Set();
  const generatedIsolates = new Set();
  const originalBlockState = new WeakMap();

  function debug(...args) {
    if (DEBUG) {
      console.debug("[ADO RTL Fixer]", ...args);
    }
  }

  function isElement(node) {
    return node?.nodeType === Node.ELEMENT_NODE;
  }

  function isEditable(element) {
    return Boolean(element?.matches?.(selectors.editable));
  }

  function textFor(element) {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      return element.value;
    }
    return element.textContent || "";
  }

  function bidiSnapshot(element) {
    const computed = getComputedStyle(element);
    return {
      tagName: element.tagName,
      className: String(element.className || ""),
      dir: element.getAttribute("dir"),
      direction: computed.direction,
      unicodeBidi: computed.unicodeBidi,
      display: computed.display
    };
  }

  function inspectBidiBlock(element, force = false) {
    if (!force && !DEBUG) {
      return;
    }

    const block = element?.closest?.(`.${RTL_CLASS}`) || element;
    if (!block) {
      return;
    }

    console.groupCollapsed("[ADO RTL Fixer] RTL block detected");
    console.log("text:", block.textContent);
    console.log("block:", bidiSnapshot(block));

    let ancestor = block.parentElement;
    for (let index = 1; ancestor && index <= 3; index += 1) {
      console.log(`ancestor #${index}:`, bidiSnapshot(ancestor));
      ancestor = ancestor.parentElement;
    }

    for (const [index, child] of [...block.children].entries()) {
      console.log(`child #${index + 1}:`, bidiSnapshot(child));
    }
    console.groupEnd();
  }

  globalThis.AdoRtlFixerDebug = Object.freeze({
    inspect(element) {
      inspectBidiBlock(element, true);
    }
  });

  function restoreConflict(element) {
    if (!conflictResets.has(element)) {
      return;
    }
    element.classList.remove(CONFLICT_CLASS);
    conflictResets.delete(element);
  }

  function restoreConflictsWithin(block) {
    for (const element of [...conflictResets]) {
      if (element === block || block.contains(element)) {
        restoreConflict(element);
      }
    }
  }

  function unwrapIsolate(isolate) {
    if (!isolate?.parentNode) {
      generatedIsolates.delete(isolate);
      return;
    }

    const parent = isolate.parentNode;
    while (isolate.firstChild) {
      parent.insertBefore(isolate.firstChild, isolate);
    }
    isolate.remove();
    generatedIsolates.delete(isolate);
  }

  function unwrapIsolatesWithin(block) {
    const isolates = block.querySelectorAll(`bdi[${GENERATED_ATTRIBUTE}='true']`);
    for (const isolate of isolates) {
      unwrapIsolate(isolate);
    }
  }

  function restoreBlock(block) {
    const original = originalBlockState.get(block);
    if (!original) {
      return;
    }

    unwrapIsolatesWithin(block);
    restoreConflictsWithin(block);

    if (original.addedClass) {
      block.classList.remove(RTL_CLASS);
    }

    if (original.hadDir) {
      block.setAttribute("dir", original.dir);
    } else {
      block.removeAttribute("dir");
    }

    originalBlockState.delete(block);
    modifiedBlocks.delete(block);
  }

  function removeNestedContexts(block) {
    for (const modified of [...modifiedBlocks]) {
      if (modified !== block && block.contains(modified)) {
        restoreBlock(modified);
      }
    }

    const ancestor = block.parentElement?.closest?.(`.${RTL_CLASS}`);
    if (ancestor && originalBlockState.has(ancestor)) {
      restoreBlock(ancestor);
    }
  }

  function applyBlockDirection(block) {
    removeNestedContexts(block);

    if (!originalBlockState.has(block)) {
      originalBlockState.set(block, {
        hadDir: block.hasAttribute("dir"),
        dir: block.getAttribute("dir"),
        addedClass: !block.classList.contains(RTL_CLASS)
      });
    }

    block.classList.add(RTL_CLASS);
    block.setAttribute("dir", "rtl");
    modifiedBlocks.add(block);
  }

  function normalizeConflictingDescendants(block) {
    const descendants = block.querySelectorAll("span,a,strong,em,b,i,[dir]");

    for (const descendant of descendants) {
      if (descendant.hasAttribute(GENERATED_ATTRIBUTE)) {
        continue;
      }

      const containsRtl = detector.containsRtlText(descendant.textContent || "");
      if (!containsRtl) {
        restoreConflict(descendant);
        continue;
      }

      if (conflictResets.has(descendant)) {
        continue;
      }

      const computed = getComputedStyle(descendant);
      const explicitLtr = descendant.getAttribute("dir")?.toLowerCase() === "ltr";
      const isolatedLtr = computed.direction === "ltr" && (
        computed.unicodeBidi !== "normal" ||
        computed.display === "inline-block" ||
        computed.display === "inline-flex"
      );

      if (explicitLtr || isolatedLtr) {
        descendant.classList.add(CONFLICT_CLASS);
        conflictResets.add(descendant);
      }
    }
  }

  function wrapLtrRunsInTextNode(textNode) {
    const runs = detector.findLtrRuns(textNode.data);
    if (runs.length === 0) {
      return;
    }

    const document = textNode.ownerDocument;
    const fragment = document.createDocumentFragment();
    let offset = 0;

    for (const run of runs) {
      if (run.start > offset) {
        fragment.append(document.createTextNode(textNode.data.slice(offset, run.start)));
      }

      const isolate = document.createElement("bdi");
      isolate.className = "ado-ltr-isolate";
      isolate.setAttribute("dir", "ltr");
      isolate.setAttribute(GENERATED_ATTRIBUTE, "true");
      isolate.textContent = run.text;
      fragment.append(isolate);
      generatedIsolates.add(isolate);
      offset = run.end;
    }

    if (offset < textNode.data.length) {
      fragment.append(document.createTextNode(textNode.data.slice(offset)));
    }

    textNode.replaceWith(fragment);
  }

  function siblingNodeKind(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (!node.data.trim()) {
        return "space";
      }
    } else if (
      node.nodeType !== Node.ELEMENT_NODE ||
      !node.matches("span,strong,em,b,i,a,small,mark") ||
      node.hasAttribute(GENERATED_ATTRIBUTE)
    ) {
      return "other";
    }

    const text = node.textContent || "";
    if (!text.trim() || detector.containsRtlText(text)) {
      return text.trim() ? "other" : "space";
    }

    const runs = detector.findLtrRuns(text);
    if (runs.length !== 1) {
      return "other";
    }

    return text.slice(0, runs[0].start).trim() === "" && text.slice(runs[0].end).trim() === ""
      ? "ltr"
      : "other";
  }

  function wrapOneSiblingLtrPhrase(container) {
    const children = [...container.childNodes];

    for (let start = 0; start < children.length; start += 1) {
      if (siblingNodeKind(children[start]) !== "ltr") {
        continue;
      }

      let carrierCount = 1;
      let lastCarrier = start;
      let cursor = start + 1;

      while (cursor < children.length) {
        const kind = siblingNodeKind(children[cursor]);
        if (kind === "space") {
          cursor += 1;
          continue;
        }
        if (kind !== "ltr") {
          break;
        }
        carrierCount += 1;
        lastCarrier = cursor;
        cursor += 1;
      }

      if (carrierCount < 2) {
        start = cursor - 1;
        continue;
      }

      const document = container.ownerDocument;
      const isolate = document.createElement("bdi");
      isolate.className = "ado-ltr-isolate";
      isolate.setAttribute("dir", "ltr");
      isolate.setAttribute(GENERATED_ATTRIBUTE, "true");
      container.insertBefore(isolate, children[start]);

      for (const node of children.slice(start, lastCarrier + 1)) {
        isolate.append(node);
      }

      generatedIsolates.add(isolate);
      return true;
    }

    return false;
  }

  function wrapSiblingLtrPhrases(block) {
    const containers = [block, ...block.querySelectorAll("span,strong,em,b,i,a,small,mark")];
    for (const container of containers) {
      if (container.closest(`[${GENERATED_ATTRIBUTE}='true']`)) {
        continue;
      }
      while (wrapOneSiblingLtrPhrase(container)) {
        // Re-read childNodes after each group is moved into its generated BDI.
      }
    }
  }

  function enhanceReadOnlyBlock(block) {
    const beforeText = block.textContent || "";
    wrapSiblingLtrPhrases(block);
    const textNodes = [];
    const walker = block.ownerDocument.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    let textNode = walker.nextNode();

    while (textNode) {
      const parent = textNode.parentElement;
      if (
        parent &&
        !parent.closest(`[${GENERATED_ATTRIBUTE}='true']`) &&
        !parent.closest(selectors.ignored) &&
        !parent.closest(selectors.editable)
      ) {
        textNodes.push(textNode);
      }
      textNode = walker.nextNode();
    }

    for (const node of textNodes) {
      wrapLtrRunsInTextNode(node);
    }

    if ((block.textContent || "") !== beforeText) {
      unwrapIsolatesWithin(block);
      debug("textContent invariant failed; generated isolates were reverted", block);
    }
  }

  function processBlock(block) {
    if (!block?.isConnected) {
      return;
    }

    if (!detector.shouldUseRtlParagraph(textFor(block))) {
      restoreBlock(block);
      return;
    }

    applyBlockDirection(block);

    if (!isEditable(block)) {
      normalizeConflictingDescendants(block);
      enhanceReadOnlyBlock(block);
    }

    inspectBidiBlock(block);
  }

  function addTextNodeBlock(textNode, blocks) {
    const existingBlock = textNode.parentElement?.closest?.(`.${RTL_CLASS}`);
    if (existingBlock && originalBlockState.has(existingBlock)) {
      blocks.add(existingBlock);
    }

    if (!detector.containsRtlText(textNode.data)) {
      return;
    }

    const block = domUtils.findLogicalTextBlock(textNode, selectors);
    if (block) {
      blocks.add(block);
    }
  }

  function collectBlocks(root) {
    const blocks = new Set();

    if (root?.nodeType === Node.TEXT_NODE) {
      addTextNodeBlock(root, blocks);
      return blocks;
    }

    if (!(root instanceof Element || root instanceof Document || root instanceof DocumentFragment)) {
      return blocks;
    }

    if (isElement(root)) {
      const ancestor = root.closest(`.${RTL_CLASS}`);
      if (ancestor && originalBlockState.has(ancestor)) {
        blocks.add(ancestor);
      }
      if (root.matches(`.${RTL_CLASS}`) && originalBlockState.has(root)) {
        blocks.add(root);
      }
    }

    for (const existing of root.querySelectorAll?.(`.${RTL_CLASS}`) || []) {
      if (originalBlockState.has(existing)) {
        blocks.add(existing);
      }
    }

    const walker = (root.ownerDocument || document).createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let textNode = root.nodeType === Node.TEXT_NODE ? root : walker.nextNode();
    while (textNode) {
      addTextNodeBlock(textNode, blocks);
      textNode = walker.nextNode();
    }

    const editables = [];
    if (isElement(root) && root.matches(selectors.editable)) {
      editables.push(root);
    }
    editables.push(...(root.querySelectorAll?.(selectors.editable) || []));
    for (const editable of editables) {
      if (detector.containsRtlText(textFor(editable))) {
        blocks.add(editable);
      }
    }

    return blocks;
  }

  function processRoot(root) {
    const blocks = [...collectBlocks(root)];
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
        processBlock(blocks[index]);
        index += 1;
        processed += 1;
      }

      if (index < blocks.length) {
        scheduleIdle(processSlice);
      }
    }

    processSlice();
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

    pendingRoots.add(root);
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

    const roots = [...pendingRoots];
    pendingRoots.clear();

    for (const root of roots) {
      if (!root || (isElement(root) && !root.isConnected)) {
        continue;
      }

      if (roots.some((other) => other !== root && other?.contains?.(root))) {
        continue;
      }
      processRoot(root);
    }
  }

  function restoreRemovedSubtree(node) {
    for (const block of [...modifiedBlocks]) {
      if (node === block || node?.contains?.(block)) {
        restoreBlock(block);
      }
    }

    for (const isolate of [...generatedIsolates]) {
      if (node === isolate || node?.contains?.(isolate)) {
        generatedIsolates.delete(isolate);
      }
    }
  }

  function onMutations(mutations) {
    for (const mutation of mutations) {
      enqueue(mutation.type === "characterData" ? mutation.target : mutation.target);

      for (const node of mutation.addedNodes || []) {
        enqueue(node);
      }
      for (const node of mutation.removedNodes || []) {
        restoreRemovedSubtree(node);
      }
    }
  }

  function onInput(event) {
    if (!enabled || !isElement(event.target)) {
      return;
    }

    const editable = event.target.closest(selectors.editable);
    if (editable) {
      processBlock(editable);
    }
  }

  function start() {
    if (enabled) {
      return;
    }

    enabled = true;
    processRoot(document);
    observer = new MutationObserver(onMutations);
    observer.observe(document.documentElement, {
      childList: true,
      characterData: true,
      subtree: true
    });
    document.addEventListener("input", onInput, true);
    document.addEventListener("change", onInput, true);
    debug("enabled");
  }

  function stop() {
    enabled = false;
    observer?.disconnect();
    observer = null;
    document.removeEventListener("input", onInput, true);
    document.removeEventListener("change", onInput, true);
    pendingRoots.clear();
    flushScheduled = false;

    for (const block of [...modifiedBlocks]) {
      restoreBlock(block);
    }
    for (const isolate of [...generatedIsolates]) {
      unwrapIsolate(isolate);
    }
    for (const conflict of [...conflictResets]) {
      restoreConflict(conflict);
    }
    debug("disabled");
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
      sendResponse({ enabled, supported: true });
      return;
    }

    if (message?.type === "ADO_RTL_SET_ENABLED") {
      setEnabled(message.enabled);
      sendResponse({ enabled, supported: true });
    }
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes[STORAGE_KEY]) {
      setEnabled(changes[STORAGE_KEY].newValue);
    }
  });

  chrome.storage.local.get({ [STORAGE_KEY]: false }, (result) => {
    setEnabled(result[STORAGE_KEY]);
  });
})();

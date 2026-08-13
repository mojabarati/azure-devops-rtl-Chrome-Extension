(function initializeAdoRtlFixer() {
  "use strict";

  const DEBUG = false;
  const STORAGE_KEY = "rtlFixEnabled";
  const RTL_CLASS = "ado-rtl-fixer";
  const MAX_ELEMENTS_PER_SLICE = 250;
  const detector = globalThis.AdoRtlDetector;
  const selectors = globalThis.AdoRtlSelectors;

  if (!detector || !selectors) {
    return;
  }

  let enabled = false;
  let observer = null;
  let flushScheduled = false;
  const pendingRoots = new Set();
  const modifiedElements = new Set();
  const originalState = new WeakMap();

  function debug(...args) {
    if (DEBUG) {
      console.debug("[ADO RTL Fixer]", ...args);
    }
  }

  function isElement(node) {
    return node && node.nodeType === Node.ELEMENT_NODE;
  }

  function isIgnored(element) {
    return element.matches(selectors.ignored) || Boolean(element.closest(selectors.ignored));
  }

  function isEditable(element) {
    return element.matches(selectors.editable);
  }

  function textFor(element) {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      return element.value;
    }

    // textContent avoids the style/layout calculation that innerText can
    // trigger while scanning a large SPA view.
    return element.textContent || "";
  }

  function hasUnsafeLayoutChildren(element) {
    return Boolean(
      element.querySelector(":scope > button, :scope > [role='button'], :scope > input, :scope > textarea, :scope > select, :scope > nav, :scope > svg, :scope > canvas")
    );
  }

  function isSafeTextContainer(element) {
    if (!isElement(element) || isIgnored(element)) {
      return false;
    }

    if (isEditable(element)) {
      return true;
    }

    if (element.matches(selectors.semanticText)) {
      return !hasUnsafeLayoutChildren(element);
    }

    if (element.matches(selectors.azureText)) {
      return (
        !hasUnsafeLayoutChildren(element) &&
        !element.querySelector("div,p,ul,ol,table,section,article,form")
      );
    }

    if (!element.matches("div,span")) {
      return false;
    }

    // Generic div/span support is limited to leaf-like text containers. This
    // avoids changing direction on toolbar, grid, or application layout nodes.
    return !hasUnsafeLayoutChildren(element) && !element.querySelector("div,p,ul,ol,table,section,article,form");
  }

  function rememberAndApply(element) {
    if (!originalState.has(element)) {
      originalState.set(element, {
        hadDir: element.hasAttribute("dir"),
        dir: element.getAttribute("dir"),
        addedClass: !element.classList.contains(RTL_CLASS)
      });
    }

    element.classList.add(RTL_CLASS);
    element.setAttribute("dir", "rtl");
    modifiedElements.add(element);

    // A paragraph-level BiDi context is preferable to nested contexts on its
    // individual spans. This can occur when an earlier SPA mutation exposed a
    // child before its eventual parent container was rendered.
    for (const modified of [...modifiedElements]) {
      if (modified !== element && element.contains(modified)) {
        restore(modified);
      }
    }
  }

  function restore(element) {
    const original = originalState.get(element);

    if (!original) {
      return;
    }

    if (original.addedClass) {
      element.classList.remove(RTL_CLASS);
    }

    if (original.hadDir) {
      element.setAttribute("dir", original.dir);
    } else {
      element.removeAttribute("dir");
    }

    originalState.delete(element);
    modifiedElements.delete(element);
  }

  function processElement(element) {
    const modifiedAncestor = element?.parentElement?.closest?.(`.${RTL_CLASS}`);
    if (modifiedAncestor && originalState.has(modifiedAncestor)) {
      restore(element);
      processElement(modifiedAncestor);
      return;
    }

    if (!isSafeTextContainer(element)) {
      return;
    }

    if (detector.getTextDirection(textFor(element)) === "rtl") {
      rememberAndApply(element);
    } else {
      restore(element);
    }
  }

  function collectCandidates(root) {
    const candidates = [];

    if (isElement(root)) {
      candidates.push(root);
    }

    if (!(root instanceof Element || root instanceof Document || root instanceof DocumentFragment)) {
      return candidates;
    }

    const query = [selectors.semanticText, selectors.azureText, selectors.editable, "div", "span"].join(",");
    candidates.push(...root.querySelectorAll(query));
    return candidates;
  }

  function processRoot(root) {
    const candidates = collectCandidates(root);
    let index = 0;

    function processSlice(deadline) {
      if (!enabled) {
        return;
      }

      let processed = 0;
      while (
        index < candidates.length &&
        processed < MAX_ELEMENTS_PER_SLICE &&
        (!deadline || deadline.timeRemaining() > 1)
      ) {
        processElement(candidates[index]);
        index += 1;
        processed += 1;
      }

      if (index < candidates.length) {
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

    pendingRoots.add(root.nodeType === Node.TEXT_NODE ? root.parentElement : root);

    if (flushScheduled) {
      return;
    }

    flushScheduled = true;
    scheduleIdle(flushPending);
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

      // If a descendant and its ancestor were both queued, processing the
      // ancestor is sufficient.
      if (roots.some((other) => other !== root && other instanceof Node && other.contains?.(root))) {
        continue;
      }

      processRoot(root);
    }
  }

  function onMutations(mutations) {
    for (const mutation of mutations) {
      if (mutation.type === "characterData") {
        enqueue(mutation.target.parentElement);
        continue;
      }

      for (const node of mutation.addedNodes) {
        enqueue(node);
      }

      for (const node of mutation.removedNodes) {
        for (const modified of [...modifiedElements]) {
          if (node === modified || (node instanceof Node && node.contains?.(modified))) {
            restore(modified);
          }
        }
      }
    }
  }

  function onInput(event) {
    if (enabled && isElement(event.target)) {
      processElement(event.target);
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

    for (const element of [...modifiedElements]) {
      restore(element);
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

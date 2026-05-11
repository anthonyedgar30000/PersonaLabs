(function () {
  "use strict";

  const STORAGE_KEY = "personaLabsChillMode";
  const DEVELOPER_MODE_STORAGE_KEY = "personaLabsDeveloperMode";
  const MODE_CHILL = "chill";
  const MODE_BARE_METAL = "bareMetal";
  const DEFAULT_MODE = MODE_CHILL;
  const CARD_SELECTOR = [
    "ytd-rich-item-renderer",
    "ytd-video-renderer",
    "ytd-grid-video-renderer",
    "ytd-compact-video-renderer",
    "ytd-playlist-renderer",
    "ytd-reel-item-renderer"
  ].join(",");
  const TITLE_SELECTORS = [
    "#video-title",
    "a#video-title",
    "yt-formatted-string#video-title",
    "h3 a",
    "h3",
    "a[title]",
    "[aria-label]"
  ];

  const scoring = window.PersonaLabsChillScoring;
  let currentMode = DEFAULT_MODE;
  let developerMode = false;
  let scanQueued = false;

  init();

  function init() {
    if (!scoring) {
      return;
    }

    loadSettings();
    watchStorage();
    startObserver();
    queueScan();
  }

  function loadSettings() {
    chrome.storage.local.get(
      {
        [STORAGE_KEY]: DEFAULT_MODE,
        [DEVELOPER_MODE_STORAGE_KEY]: false
      },
      (items) => {
        setMode(items[STORAGE_KEY]);
        setDeveloperMode(items[DEVELOPER_MODE_STORAGE_KEY]);
      }
    );
  }

  function watchStorage() {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local") {
        return;
      }

      if (changes[STORAGE_KEY]) {
        setMode(changes[STORAGE_KEY].newValue);
      }

      if (changes[DEVELOPER_MODE_STORAGE_KEY]) {
        setDeveloperMode(changes[DEVELOPER_MODE_STORAGE_KEY].newValue);
      }
    });
  }

  function setMode(mode) {
    currentMode = mode === MODE_BARE_METAL ? MODE_BARE_METAL : MODE_CHILL;
    document.documentElement.classList.toggle(
      "personalabs-bare-metal",
      currentMode === MODE_BARE_METAL
    );
    queueScan();
  }

  function setDeveloperMode(enabled) {
    developerMode = Boolean(enabled);
    document.documentElement.classList.toggle("personalabs-developer-mode", developerMode);
    queueScan();
  }

  function startObserver() {
    const observer = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => mutation.addedNodes.length > 0)) {
        queueScan();
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  function queueScan() {
    if (scanQueued) {
      return;
    }

    scanQueued = true;
    window.requestAnimationFrame(() => {
      scanQueued = false;
      scanCards();
    });
  }

  function scanCards() {
    if (currentMode === MODE_BARE_METAL) {
      return;
    }

    document.querySelectorAll(CARD_SELECTOR).forEach((card) => {
      const title = readTitle(card);
      if (!title) {
        removeOverlay(card);
        return;
      }

      renderOverlay(card, scoring.classifyTitle(title));
    });
  }

  function readTitle(card) {
    for (const selector of TITLE_SELECTORS) {
      const element = card.querySelector(selector);
      const title = titleFromElement(element);
      if (title) {
        return title;
      }
    }

    return "";
  }

  function titleFromElement(element) {
    if (!element) {
      return "";
    }

    const title =
      element.getAttribute("title") ||
      element.getAttribute("aria-label") ||
      element.textContent ||
      "";

    return title.replace(/\s+/g, " ").trim();
  }

  function renderOverlay(card, classification) {
    const presentation = classification.presentation;
    card.classList.add(
      "personalabs-card",
      `personalabs-${classification.status}`,
      `personalabs-band-${presentation.bandClassName}`
    );
    removeOldStatusClasses(card, classification.status);
    removeOldBandClasses(card, presentation.bandClassName);

    let badge = card.querySelector(":scope > .personalabs-badge");
    if (!badge) {
      badge = document.createElement("div");
      badge.className = "personalabs-badge";
      card.append(badge);
    }

    const tooltip = tooltipTextFor(classification);
    const renderKey = JSON.stringify({
      tooltip,
      developerMode,
      status: classification.status,
      labelBand: presentation.labelBand,
      rawExtractedTitle: developerMode ? classification.internalSignals.rawExtractedTitle : ""
    });

    badge.dataset.status = classification.status;
    badge.dataset.band = presentation.labelBand;
    if (badge.dataset.renderKey === renderKey) {
      return;
    }

    badge.dataset.renderKey = renderKey;
    badge.setAttribute("aria-label", tooltip);
    badge.replaceChildren(
      badgeMainFor(presentation.userLabel),
      tooltipElementFor(classification)
    );
  }

  function badgeMainFor(label) {
    const badgeMain = document.createElement("span");
    const dot = document.createElement("span");
    const labelElement = document.createElement("span");

    badgeMain.className = "personalabs-badge-main";
    dot.className = "personalabs-dot";
    dot.setAttribute("aria-hidden", "true");
    labelElement.textContent = label;

    badgeMain.append(dot, labelElement);
    return badgeMain;
  }

  function tooltipElementFor(classification) {
    const tooltip = document.createElement("span");
    const title = document.createElement("span");
    const summary = document.createElement("span");
    const whyLabel = document.createElement("span");
    const reasons = document.createElement("span");
    const confidence = document.createElement("span");

    tooltip.className = "personalabs-tooltip";
    tooltip.setAttribute("role", "tooltip");

    title.className = "personalabs-tooltip-title";
    title.textContent = classification.presentation.userLabel.toUpperCase();

    summary.className = "personalabs-tooltip-summary";
    summary.textContent = classification.presentation.summary;

    whyLabel.className = "personalabs-tooltip-heading";
    whyLabel.textContent = "Why:";

    reasons.className = "personalabs-tooltip-reasons";
    classification.presentation.reasons.forEach((reason) => {
      const item = document.createElement("span");
      item.textContent = reason;
      reasons.append(item);
    });

    confidence.className = "personalabs-tooltip-confidence";
    confidence.textContent = `Confidence: ${classification.presentation.signalConfidence}`;

    tooltip.append(title, summary, whyLabel, reasons, confidence);

    if (developerMode) {
      tooltip.append(developerPanelFor(classification));
    }

    return tooltip;
  }

  function developerPanelFor(classification) {
    const internalSignals = classification.internalSignals;
    const panel = document.createElement("span");
    const heading = document.createElement("span");
    const rows = [
      ["rawExtractedTitle", internalSignals.rawExtractedTitle],
      ["matchedCategory", internalSignals.matchedCategory],
      ["matchedTerms", JSON.stringify(internalSignals.matchedTerms)],
      ["scoreImpact", JSON.stringify(classification.scoreImpact)],
      ["internalCategoryWeights", JSON.stringify(internalSignals.internalCategoryWeights)],
      ["calmAlignment", internalSignals.calmAlignment],
      ["conflictIntensity", internalSignals.conflictIntensity],
      ["cognitiveFriction", internalSignals.cognitiveFriction],
      ["signalConfidence", internalSignals.signalConfidence],
      ["volatilitySignals", scoring.formatTerms(internalSignals.volatilitySignals)],
      ["escalationSignals", scoring.formatTerms(internalSignals.escalationSignals)],
      ["metadataConfidence", internalSignals.metadataConfidence],
      ["positiveScore", internalSignals.positiveScore],
      ["negativeScore", internalSignals.negativeScore],
      ["netScore", internalSignals.netScore]
    ];

    panel.className = "personalabs-developer-panel";
    heading.className = "personalabs-tooltip-heading";
    heading.textContent = "Developer signals:";
    panel.append(heading);

    rows.forEach(([label, value]) => {
      const row = document.createElement("span");
      row.textContent = `${label}: ${value}`;
      panel.append(row);
    });

    return panel;
  }

  function tooltipTextFor(classification) {
    const developerDetails = developerMode
      ? [
          `matchedCategory: ${classification.internalSignals.matchedCategory}`,
          `calmAlignment: ${classification.internalSignals.calmAlignment}`,
          `conflictIntensity: ${classification.internalSignals.conflictIntensity}`,
          `cognitiveFriction: ${classification.internalSignals.cognitiveFriction}`,
          `signalConfidence: ${classification.internalSignals.signalConfidence}`,
          `metadataConfidence: ${classification.internalSignals.metadataConfidence}`
        ].join(". ")
      : "";
    const baseTooltip = [
      classification.presentation.userLabel.toUpperCase(),
      classification.presentation.summary,
      "Why:",
      classification.presentation.reasons.join("; "),
      `Confidence: ${classification.presentation.signalConfidence}`
    ].join(" ");

    return developerDetails ? `${baseTooltip} Developer signals: ${developerDetails}` : baseTooltip;
  }

  function removeOverlay(card) {
    card.classList.remove(
      "personalabs-card",
      ...scoring.STATUS_CLASSES.map((className) => `personalabs-${className}`),
      ...scoring.BAND_CLASSES.map((className) => `personalabs-band-${className}`)
    );

    const badge = card.querySelector(":scope > .personalabs-badge");
    if (badge) {
      badge.remove();
    }
  }

  function removeOldStatusClasses(card, status) {
    scoring.STATUS_CLASSES.forEach((candidate) => {
      card.classList.toggle(`personalabs-${candidate}`, candidate === status);
    });
  }

  function removeOldBandClasses(card, bandClassName) {
    scoring.BAND_CLASSES.forEach((candidate) => {
      card.classList.toggle(`personalabs-band-${candidate}`, candidate === bandClassName);
    });
  }
})();

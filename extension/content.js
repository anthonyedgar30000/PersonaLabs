(function () {
  "use strict";

  const STORAGE_KEY = "personaLabsChillMode";
  const DEVELOPER_MODE_STORAGE_KEY = "personaLabsDeveloperMode";
  const ADAPTIVE_GUIDANCE_STORAGE_KEY = "personaLabsAdaptiveGuidance";
  const USER_GOAL_STORAGE_KEY = "personaLabsUserGoal";
  const MODE_CHILL = "chill";
  const MODE_BARE_METAL = "bareMetal";
  const DEFAULT_MODE = MODE_CHILL;
  const DEFAULT_USER_GOAL = "relaxDecompress";
  const USER_GOAL_LABELS = {
    relaxDecompress: "Relax / Decompress",
    reduceDoomscrolling: "Reduce Doomscrolling",
    focusLearn: "Focus / Learn",
    lowerScreenTime: "Lower Screen Time",
    curiosityGuidedLearning: "Curiosity-Guided Learning"
  };
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
  const queryRewriting = window.PersonaLabsQueryRewriting;
  let currentMode = DEFAULT_MODE;
  let developerMode = false;
  let adaptiveGuidance = false;
  let userGoal = DEFAULT_USER_GOAL;
  let scanQueued = false;

  init();

  function init() {
    if (!scoring || !queryRewriting) {
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
        [DEVELOPER_MODE_STORAGE_KEY]: false,
        [ADAPTIVE_GUIDANCE_STORAGE_KEY]: false,
        [USER_GOAL_STORAGE_KEY]: DEFAULT_USER_GOAL
      },
      (items) => {
        setMode(items[STORAGE_KEY]);
        setDeveloperMode(items[DEVELOPER_MODE_STORAGE_KEY]);
        setAdaptiveGuidance(items[ADAPTIVE_GUIDANCE_STORAGE_KEY]);
        setUserGoal(items[USER_GOAL_STORAGE_KEY]);
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

      if (changes[ADAPTIVE_GUIDANCE_STORAGE_KEY]) {
        setAdaptiveGuidance(changes[ADAPTIVE_GUIDANCE_STORAGE_KEY].newValue);
      }

      if (changes[USER_GOAL_STORAGE_KEY]) {
        setUserGoal(changes[USER_GOAL_STORAGE_KEY].newValue);
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

  function setAdaptiveGuidance(enabled) {
    adaptiveGuidance = Boolean(enabled);
    queueScan();
  }

  function setUserGoal(goal) {
    userGoal = USER_GOAL_LABELS[goal] ? goal : DEFAULT_USER_GOAL;
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
      adaptiveGuidance,
      developerMode,
      status: classification.status,
      userGoal,
      labelBand: presentation.labelBand,
      rawExtractedTitle: classification.internalSignals.rawExtractedTitle
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
    const details = document.createElement("span");
    const whyLabel = document.createElement("span");
    const reasons = document.createElement("span");
    const confidence = document.createElement("span");
    const guidedDiscovery = guidedDiscoveryElementFor(classification);
    const currentLabel = currentLabelFor(classification);

    tooltip.className = "personalabs-tooltip";
    tooltip.setAttribute("role", "tooltip");

    title.className = "personalabs-tooltip-title";
    title.textContent = currentLabel.toUpperCase();

    summary.className = "personalabs-tooltip-summary";
    summary.textContent = classification.presentation.summary;

    details.className = "personalabs-tooltip-details";
    [
      ["Current goal", currentGoalLabel()],
      ["Adaptive guidance", adaptiveGuidance ? "on" : "off"],
      ["Matched positive signals", matchedSignalsFor(classification, "positive")],
      ["Matched negative signals", matchedSignalsFor(classification, "negative")],
      ["Confidence", classification.presentation.signalConfidence],
      ["Current label", currentLabel]
    ].forEach(([label, value]) => {
      const item = document.createElement("span");
      item.textContent = `${label}: ${value}`;
      details.append(item);
    });

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

    tooltip.append(title, summary, details, whyLabel, reasons, confidence, guidedDiscovery);

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
    const currentLabel = currentLabelFor(classification);
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
      currentLabel.toUpperCase(),
      classification.presentation.summary,
      `Current goal: ${currentGoalLabel()}.`,
      `Adaptive guidance: ${adaptiveGuidance ? "on" : "off"}.`,
      `Matched positive signals: ${matchedSignalsFor(classification, "positive")}.`,
      `Matched negative signals: ${matchedSignalsFor(classification, "negative")}.`,
      `Confidence: ${classification.presentation.signalConfidence}.`,
      `Current label: ${currentLabel}.`,
      "Why:",
      classification.presentation.reasons.join("; "),
      "Guided Discovery: Find similar, but:",
      guidedDiscoveryPresets().map((preset) => preset.label).join("; "),
      guidedDiscoveryTextFor(classification)
    ].join(" ");

    return developerDetails ? `${baseTooltip} Developer signals: ${developerDetails}` : baseTooltip;
  }

  function currentGoalLabel() {
    return USER_GOAL_LABELS[userGoal] || USER_GOAL_LABELS[DEFAULT_USER_GOAL];
  }

  function currentLabelFor(classification) {
    return classification.presentation.userLabel;
  }

  function matchedSignalsFor(classification, direction) {
    const terms = classification.scoreImpact
      .filter((impact) => impact.direction === direction)
      .flatMap((impact) => impact.matchedTerms);

    return scoring.formatTerms(Array.from(new Set(terms)));
  }

  function guidedDiscoveryPresets() {
    return [
      queryRewriting.PRESETS.calmer,
      queryRewriting.PRESETS.moreEducational,
      queryRewriting.PRESETS.lessSensational,
      queryRewriting.PRESETS.beginnerFriendly
    ];
  }

  function guidedDiscoveryElementFor(classification) {
    const container = document.createElement("span");
    const heading = document.createElement("span");
    const buttons = document.createElement("span");
    const debug = document.createElement("span");
    const rewrites = guidedDiscoveryPresets().map((preset) => {
      return queryRewriting.searchUrlFor(classification.internalSignals.rawExtractedTitle, preset.id);
    });

    container.className = "personalabs-guided-discovery";
    heading.className = "personalabs-tooltip-heading";
    heading.textContent = "Find similar, but:";
    buttons.className = "personalabs-guided-discovery-actions";
    debug.className = "personalabs-guided-discovery-debug";

    rewrites.forEach((rewrite) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = rewrite.presetLabel;
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        openGuidedDiscovery(rewrite);
      });
      buttons.append(button);
    });

    debug.append(debugRowFor("Original title", rewrites[0].originalTitle || "untitled"));
    rewrites.forEach((rewrite) => {
      debug.append(
        debugRowFor(
          `${rewrite.presetLabel} preset`,
          `${rewrite.transformedQuery} (transformation preset used: ${rewrite.preset})`
        )
      );
    });

    container.append(heading, buttons, debug);
    return container;
  }

  function guidedDiscoveryTextFor(classification) {
    const rewrites = guidedDiscoveryPresets().map((preset) => {
      return queryRewriting.rewriteTitle(classification.internalSignals.rawExtractedTitle, preset.id);
    });

    return [
      `Original title: ${rewrites[0].originalTitle || "untitled"}.`,
      ...rewrites.map((rewrite) => {
        return `Transformation preset used: ${rewrite.preset}; transformed query: ${rewrite.transformedQuery}.`;
      })
    ].join(" ");
  }

  function debugRowFor(label, value) {
    const row = document.createElement("span");
    row.textContent = `${label}: ${value}`;
    return row;
  }

  function openGuidedDiscovery(rewrite) {
    window.open(rewrite.url, "_blank", "noopener,noreferrer");
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

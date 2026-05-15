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
  let selectedAnchor = null;
  let discoveryPanel = null;

  init();

  function init() {
    if (!scoring || !queryRewriting) {
      return;
    }

    loadSettings();
    watchStorage();
    createDiscoveryPanel();
    bindCardSelection();
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
      card.classList.toggle(
        "personalabs-selected-anchor",
        Boolean(selectedAnchor && selectedAnchor.card === card)
      );
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
      ["Matched lexical signals", matchedLexicalSignalsFor(classification)],
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

    tooltip.append(title, summary, details, whyLabel, reasons, confidence);

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
      `Matched lexical signals: ${matchedLexicalSignalsFor(classification)}.`,
      `Matched positive signals: ${matchedSignalsFor(classification, "positive")}.`,
      `Matched negative signals: ${matchedSignalsFor(classification, "negative")}.`,
      `Confidence: ${classification.presentation.signalConfidence}.`,
      `Current label: ${currentLabel}.`,
      "Why:",
      classification.presentation.reasons.join("; ")
    ].join(" ");

    return developerDetails ? `${baseTooltip} Developer signals: ${developerDetails}` : baseTooltip;
  }

  function currentGoalLabel() {
    return USER_GOAL_LABELS[userGoal] || USER_GOAL_LABELS[DEFAULT_USER_GOAL];
  }

  function currentLabelFor(classification) {
    return classification.presentation.userLabel;
  }

  function matchedLexicalSignalsFor(classification) {
    return scoring.formatTerms(classification.matches || []);
  }

  function matchedSignalsFor(classification, direction) {
    const terms = classification.scoreImpact
      .filter((impact) => impact.direction === direction)
      .flatMap((impact) => impact.matchedTerms);

    return scoring.formatTerms(Array.from(new Set(terms)));
  }

  function guidedDiscoveryPresets() {
    return queryRewriting.PRESET_ORDER.map((presetId) => queryRewriting.PRESETS[presetId]);
  }

  function openGuidedDiscovery(rewrite) {
    window.open(rewrite.url, "_blank", "noopener,noreferrer");
  }

  function createDiscoveryPanel() {
    discoveryPanel = document.createElement("aside");
    discoveryPanel.className = "personalabs-discovery-panel";
    discoveryPanel.setAttribute("aria-label", "PersonaLabs guided discovery panel");
    const host = document.body || document.documentElement;
    host.append(discoveryPanel);
    renderDiscoveryPanel();
  }

  function bindCardSelection() {
    document.addEventListener(
      "click",
      (event) => {
        if (discoveryPanel && discoveryPanel.contains(event.target)) {
          return;
        }

        const card = closestCardFor(event.target);
        if (!card) {
          return;
        }

        const title = readTitle(card);
        if (!title) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        selectAnchor(card, title);
      },
      true
    );
  }

  function closestCardFor(target) {
    if (!target || typeof target.closest !== "function") {
      return null;
    }

    return target.closest(CARD_SELECTOR);
  }

  function selectAnchor(card, title) {
    if (selectedAnchor && selectedAnchor.card && selectedAnchor.card !== card) {
      selectedAnchor.card.classList.remove("personalabs-selected-anchor");
    }

    const classification = scoring.classifyTitle(title);
    selectedAnchor = {
      card,
      title,
      classification,
      rewrite: null
    };
    card.classList.add("personalabs-selected-anchor");
    renderDiscoveryPanel();
  }

  function renderDiscoveryPanel() {
    if (!discoveryPanel) {
      return;
    }

    const title = document.createElement("h2");
    const subtitle = document.createElement("p");

    title.textContent = "PersonaLabs Discovery";
    subtitle.className = "personalabs-discovery-panel-subtitle";
    subtitle.textContent = "Observe the media environment, select an anchor, redirect exploration.";

    if (!selectedAnchor) {
      const empty = document.createElement("p");
      empty.className = "personalabs-discovery-empty";
      empty.textContent = "Click a video to use it as your discovery anchor.";
      discoveryPanel.replaceChildren(title, subtitle, empty);
      return;
    }

    const classification = selectedAnchor.classification;
    const details = document.createElement("div");
    const actions = document.createElement("div");
    const transparency = document.createElement("div");

    details.className = "personalabs-discovery-panel-details";
    actions.className = "personalabs-discovery-panel-actions";
    transparency.className = "personalabs-discovery-panel-transparency";

    details.append(
      panelRowFor("Selected video", selectedAnchor.title),
      panelRowFor("Current classification", currentLabelFor(classification)),
      panelRowFor("Detected signals", panelSignalSummaryFor(classification)),
      panelRowFor("Original title/query", selectedAnchor.title)
    );

    guidedDiscoveryPresets().forEach((preset) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = preset.label;
      button.addEventListener("click", () => {
        const rewrite = queryRewriting.searchUrlFor(selectedAnchor.title, preset.id);
        selectedAnchor.rewrite = rewrite;
        renderDiscoveryPanel();
        openGuidedDiscovery(rewrite);
      });
      actions.append(button);
    });

    transparency.append(
      panelRowFor("Original title", selectedAnchor.title),
      panelRowFor(
        "Rewritten query",
        selectedAnchor.rewrite ? selectedAnchor.rewrite.transformedQuery : "Choose a direction above."
      ),
      panelRowFor("Mode selected", selectedAnchor.rewrite ? selectedAnchor.rewrite.presetLabel : "none yet")
    );

    discoveryPanel.replaceChildren(title, subtitle, details, panelActionsLabel(), actions, transparency);
  }

  function panelRowFor(label, value) {
    const row = document.createElement("div");
    const labelElement = document.createElement("span");
    const valueElement = document.createElement("strong");
    labelElement.textContent = label;
    valueElement.textContent = value;
    row.append(labelElement, valueElement);
    return row;
  }

  function panelActionsLabel() {
    const label = document.createElement("p");
    label.className = "personalabs-discovery-panel-action-label";
    label.textContent = "Like this, but...";
    return label;
  }

  function panelSignalSummaryFor(classification) {
    const positive = matchedSignalsFor(classification, "positive");
    const negative = matchedSignalsFor(classification, "negative");
    return `positive: ${positive}; negative: ${negative}; confidence: ${classification.presentation.signalConfidence}`;
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

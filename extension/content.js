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

  const CHILL_TERMS = [
    "ambient",
    "asmr",
    "beautiful",
    "best moments",
    "calm",
    "chill",
    "cozy",
    "cute",
    "funny",
    "gameplay",
    "gaming",
    "highlights",
    "lofi",
    "lo-fi",
    "mix",
    "music",
    "peaceful",
    "playlist",
    "relax",
    "relaxing",
    "sleep",
    "slow",
    "stand up",
    "stream",
    "travel",
    "vlog",
    "walkthrough"
  ];

  const FOCUS_TERMS = [
    "analysis",
    "breaking",
    "course",
    "crash course",
    "debate",
    "deep dive",
    "explained",
    "how to",
    "lecture",
    "lesson",
    "news",
    "podcast",
    "politics",
    "research",
    "study",
    "tutorial",
    "war",
    "workshop"
  ];

  const INTENSE_TERMS = [
    "angry",
    "controversy",
    "disaster",
    "exposed",
    "fight",
    "meltdown",
    "rage",
    "scandal",
    "shocking"
  ];

  const VOLATILITY_TERMS = [
    "breaking",
    "controversy",
    "debate",
    "disaster",
    "news",
    "politics",
    "scandal",
    "shocking",
    "war"
  ];

  const STATUS_CLASSES = ["chill", "focus", "intense", "mixed", "neutral"];
  const BAND_CLASSES = [
    "strong-green",
    "green",
    "yellow-green",
    "yellow",
    "orange",
    "red",
    "dark-red"
  ];

  const LABEL_BANDS = {
    strongGreen: {
      className: "strong-green",
      label: "ultra chill",
      alternateLabel: "vibes immaculate",
      summary: "Strong calm signals with low friction."
    },
    green: {
      className: "green",
      label: "good vibes",
      summary: "Relaxed title signals are leading."
    },
    yellowGreen: {
      className: "yellow-green",
      label: "mostly chill",
      summary: "Chill signals are present with a little focus energy."
    },
    yellow: {
      className: "yellow",
      label: "mixed energy",
      summary: "The title does not clearly resolve into a chill fit."
    },
    orange: {
      className: "orange",
      label: "drama creeping in",
      summary: "Focused or high-friction title signals are present."
    },
    red: {
      className: "red",
      label: "high friction",
      summary: "The title carries strong friction signals for Chill Mode."
    },
    darkRed: {
      className: "dark-red",
      label: "doomscroll fuel",
      rareLabel: "cortisol cannon",
      summary: "Multiple escalation signals are present."
    }
  };

  let currentMode = DEFAULT_MODE;
  let developerMode = false;
  let scanQueued = false;

  init();

  function init() {
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

      renderOverlay(card, classifyTitle(title));
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

    return cleanTitle(title);
  }

  function cleanTitle(title) {
    return title.replace(/\s+/g, " ").trim();
  }

  function classifyTitle(title) {
    const normalizedTitle = title.toLowerCase();
    const chillMatches = matchTerms(normalizedTitle, CHILL_TERMS);
    const focusMatches = matchTerms(normalizedTitle, FOCUS_TERMS);
    const intenseMatches = matchTerms(normalizedTitle, INTENSE_TERMS);
    const baseSignals = {
      rawExtractedTitle: title,
      calmMatches: chillMatches,
      focusMatches,
      intenseMatches
    };

    if (intenseMatches.length > 0) {
      return buildClassification(baseSignals, {
        status: "intense",
        matches: intenseMatches
      });
    }

    if (chillMatches.length > 0 && focusMatches.length === 0) {
      return buildClassification(baseSignals, {
        status: "chill",
        matches: chillMatches
      });
    }

    if (chillMatches.length > 0 && focusMatches.length > 0) {
      return buildClassification(baseSignals, {
        status: "mixed",
        matches: chillMatches.concat(focusMatches)
      });
    }

    if (focusMatches.length > 0) {
      return buildClassification(baseSignals, {
        status: "focus",
        matches: focusMatches
      });
    }

    return buildClassification(baseSignals, {
      status: "neutral",
      matches: []
    });
  }

  function buildClassification(baseSignals, baseClassification) {
    const internalSignals = buildInternalSignals(baseSignals, baseClassification);
    const presentation = buildPresentation(baseClassification, internalSignals);

    return {
      status: baseClassification.status,
      matches: baseClassification.matches,
      internalSignals,
      presentation
    };
  }

  function buildInternalSignals(baseSignals, baseClassification) {
    const matchedTerms = {
      calmSignals: baseSignals.calmMatches,
      focusSignals: baseSignals.focusMatches,
      escalationSignals: baseSignals.intenseMatches
    };
    const volatilitySignals = uniqueTerms(
      baseSignals.focusMatches.concat(baseSignals.intenseMatches).filter((term) => {
        return VOLATILITY_TERMS.includes(term);
      })
    );
    const totalMatches =
      baseSignals.calmMatches.length +
      baseSignals.focusMatches.length +
      baseSignals.intenseMatches.length;
    const internalCategoryWeights = {
      calmAlignment: baseSignals.calmMatches.length,
      conflictIntensity: baseSignals.intenseMatches.length + volatilitySignals.length,
      cognitiveFriction: baseSignals.focusMatches.length + baseSignals.intenseMatches.length,
      volatilitySignals: volatilitySignals.length,
      escalationSignals: baseSignals.intenseMatches.length
    };

    return {
      rawExtractedTitle: baseSignals.rawExtractedTitle,
      matchedTerms,
      internalCategoryWeights,
      calmAlignment: calmAlignmentFor(baseClassification.status, baseSignals.calmMatches.length),
      conflictIntensity: conflictIntensityFor(
        baseClassification.status,
        volatilitySignals.length,
        baseSignals.intenseMatches.length
      ),
      cognitiveFriction: cognitiveFrictionFor(baseClassification.status),
      signalConfidence: confidenceFor(totalMatches),
      volatilitySignals,
      escalationSignals: baseSignals.intenseMatches,
      metadataConfidence: "high"
    };
  }

  function buildPresentation(baseClassification, internalSignals) {
    const labelBand = labelBandFor(baseClassification.status, internalSignals);
    const band = LABEL_BANDS[labelBand];

    return {
      labelBand,
      bandClassName: band.className,
      userLabel: band.label,
      summary: band.summary,
      reasons: reasonsFor(baseClassification.status, internalSignals),
      signalConfidence: internalSignals.signalConfidence
    };
  }

  function labelBandFor(status, internalSignals) {
    if (status === "chill") {
      return internalSignals.matchedTerms.calmSignals.length >= 2 ? "strongGreen" : "green";
    }

    if (status === "mixed") {
      return internalSignals.matchedTerms.calmSignals.length >
        internalSignals.matchedTerms.focusSignals.length
        ? "yellowGreen"
        : "yellow";
    }

    if (status === "focus") {
      return "orange";
    }

    if (status === "intense") {
      return internalSignals.escalationSignals.length >= 2 ? "darkRed" : "red";
    }

    return "yellow";
  }

  function reasonsFor(status, internalSignals) {
    const calmSignals = internalSignals.matchedTerms.calmSignals;
    const focusSignals = internalSignals.matchedTerms.focusSignals;
    const escalationSignals = internalSignals.escalationSignals;
    const volatilitySignals = internalSignals.volatilitySignals;

    if (status === "chill") {
      return [
        `+ calm signals: ${formatTerms(calmSignals)}`,
        "+ low conflict intensity",
        "+ title-only metadata confidence is high"
      ];
    }

    if (status === "mixed") {
      return [
        `+ calm signals: ${formatTerms(calmSignals)}`,
        `- focus signals: ${formatTerms(focusSignals)}`,
        "- mixed cognitive friction"
      ];
    }

    if (status === "focus") {
      return [
        `- focus signals: ${formatTerms(focusSignals)}`,
        "- higher cognitive friction for Chill Mode",
        "+ no escalation signal detected"
      ];
    }

    if (status === "intense") {
      const firstReason = escalationSignals.length > 0
        ? `- escalation signals: ${formatTerms(escalationSignals)}`
        : `- volatility signals: ${formatTerms(volatilitySignals)}`;

      return [
        firstReason,
        "- high cognitive friction",
        "- low calm alignment"
      ];
    }

    return [
      "+ no escalation signal detected",
      "- no clear calm keyword match",
      "- signal confidence remains low"
    ];
  }

  function calmAlignmentFor(status, calmMatchCount) {
    if (status === "chill" && calmMatchCount >= 2) {
      return "high";
    }

    if (status === "chill" || status === "mixed") {
      return "medium";
    }

    return "low";
  }

  function conflictIntensityFor(status, volatilityCount, escalationCount) {
    if (status === "intense" || escalationCount > 0) {
      return "high";
    }

    if (volatilityCount > 0 || status === "focus" || status === "mixed") {
      return "medium";
    }

    return "low";
  }

  function cognitiveFrictionFor(status) {
    if (status === "focus" || status === "intense") {
      return "high";
    }

    if (status === "mixed" || status === "neutral") {
      return "medium";
    }

    return "low";
  }

  function confidenceFor(matchCount) {
    if (matchCount >= 2) {
      return "high";
    }

    if (matchCount === 1) {
      return "medium";
    }

    return "low";
  }

  function uniqueTerms(terms) {
    return Array.from(new Set(terms));
  }

  function formatTerms(terms) {
    return terms.length > 0 ? terms.join(", ") : "none";
  }

  function matchTerms(title, terms) {
    return terms.filter((term) => titleMatchesTerm(title, term));
  }

  function titleMatchesTerm(title, term) {
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`(^|[^a-z0-9])${escapedTerm}([^a-z0-9]|$)`, "i");

    return pattern.test(title);
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
      tooltip.append(developerPanelFor(classification.internalSignals));
    }

    return tooltip;
  }

  function developerPanelFor(internalSignals) {
    const panel = document.createElement("span");
    const heading = document.createElement("span");
    const rows = [
      ["rawExtractedTitle", internalSignals.rawExtractedTitle],
      ["matchedTerms.calmSignals", formatTerms(internalSignals.matchedTerms.calmSignals)],
      ["matchedTerms.focusSignals", formatTerms(internalSignals.matchedTerms.focusSignals)],
      ["matchedTerms.escalationSignals", formatTerms(internalSignals.matchedTerms.escalationSignals)],
      ["internalCategoryWeights", JSON.stringify(internalSignals.internalCategoryWeights)],
      ["calmAlignment", internalSignals.calmAlignment],
      ["conflictIntensity", internalSignals.conflictIntensity],
      ["cognitiveFriction", internalSignals.cognitiveFriction],
      ["signalConfidence", internalSignals.signalConfidence],
      ["volatilitySignals", formatTerms(internalSignals.volatilitySignals)],
      ["escalationSignals", formatTerms(internalSignals.escalationSignals)],
      ["metadataConfidence", internalSignals.metadataConfidence]
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
      "personalabs-chill",
      "personalabs-focus",
      "personalabs-intense",
      "personalabs-mixed",
      "personalabs-neutral",
      ...BAND_CLASSES.map((className) => `personalabs-band-${className}`)
    );

    const badge = card.querySelector(":scope > .personalabs-badge");
    if (badge) {
      badge.remove();
    }
  }

  function removeOldStatusClasses(card, status) {
    STATUS_CLASSES.forEach((candidate) => {
      card.classList.toggle(`personalabs-${candidate}`, candidate === status);
    });
  }

  function removeOldBandClasses(card, bandClassName) {
    BAND_CLASSES.forEach((candidate) => {
      card.classList.toggle(`personalabs-band-${candidate}`, candidate === bandClassName);
    });
  }
})();

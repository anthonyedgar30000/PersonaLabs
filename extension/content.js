(function () {
  "use strict";

  const STORAGE_KEY = "personaLabsChillMode";
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

  let currentMode = DEFAULT_MODE;
  let scanQueued = false;

  init();

  function init() {
    loadMode();
    watchStorage();
    startObserver();
    queueScan();
  }

  function loadMode() {
    chrome.storage.local.get({ [STORAGE_KEY]: DEFAULT_MODE }, (items) => {
      setMode(items[STORAGE_KEY]);
    });
  }

  function watchStorage() {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local" || !changes[STORAGE_KEY]) {
        return;
      }

      setMode(changes[STORAGE_KEY].newValue);
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

    if (intenseMatches.length > 0) {
      return {
        status: "intense",
        label: "Not chill",
        detail: "High-intensity title signals",
        matches: intenseMatches
      };
    }

    if (chillMatches.length > 0 && focusMatches.length === 0) {
      return {
        status: "chill",
        label: "Chill fit",
        detail: "Relaxed title signals",
        matches: chillMatches
      };
    }

    if (chillMatches.length > 0 && focusMatches.length > 0) {
      return {
        status: "mixed",
        label: "Maybe chill",
        detail: "Relaxed and focused title signals",
        matches: chillMatches.concat(focusMatches)
      };
    }

    if (focusMatches.length > 0) {
      return {
        status: "focus",
        label: "Focus content",
        detail: "Learning, news, or analysis title signals",
        matches: focusMatches
      };
    }

    return {
      status: "neutral",
      label: "No clear signal",
      detail: "No Chill Mode title keywords found",
      matches: []
    };
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
    card.classList.add("personalabs-card", `personalabs-${classification.status}`);
    removeOldStatusClasses(card, classification.status);

    let badge = card.querySelector(":scope > .personalabs-badge");
    if (!badge) {
      badge = document.createElement("div");
      badge.className = "personalabs-badge";
      card.append(badge);
    }

    const matchText =
      classification.matches.length > 0
        ? `Matched: ${classification.matches.slice(0, 4).join(", ")}`
        : "Matched: none";
    const tooltip = `${classification.label}. ${classification.detail}. ${matchText}. Classification uses the visible title only.`;

    badge.dataset.status = classification.status;
    if (badge.dataset.tooltip === tooltip) {
      return;
    }

    badge.dataset.tooltip = tooltip;
    badge.setAttribute("aria-label", tooltip);
    badge.innerHTML = `
      <span class="personalabs-badge-main">
        <span class="personalabs-dot" aria-hidden="true"></span>
        <span>${classification.label}</span>
      </span>
      <span class="personalabs-tooltip" role="tooltip">${tooltip}</span>
    `;
  }

  function removeOverlay(card) {
    card.classList.remove(
      "personalabs-card",
      "personalabs-chill",
      "personalabs-focus",
      "personalabs-intense",
      "personalabs-mixed",
      "personalabs-neutral"
    );

    const badge = card.querySelector(":scope > .personalabs-badge");
    if (badge) {
      badge.remove();
    }
  }

  function removeOldStatusClasses(card, status) {
    ["chill", "focus", "intense", "mixed", "neutral"].forEach((candidate) => {
      card.classList.toggle(`personalabs-${candidate}`, candidate === status);
    });
  }
})();

(function personaLabsYouTubeOverlay() {
  const STORAGE_KEY = "personaLabsMode";
  const DEFAULT_MODE = "study";
  const SCAN_INTERVAL_MS = 1500;
  const CARD_SELECTOR = [
    "ytd-rich-item-renderer",
    "ytd-video-renderer",
    "ytd-grid-video-renderer",
    "ytd-compact-video-renderer",
    "ytd-playlist-video-renderer",
    "ytd-reel-item-renderer"
  ].join(",");

  const MODES = {
    study: {
      label: "Study",
      positive: ["lecture", "tutorial", "course", "explained", "learn", "study", "math", "science", "history"],
      negative: ["prank", "drama", "reacts", "fails", "celebrity", "gossip", "challenge"]
    },
    chill: {
      label: "Chill",
      positive: ["music", "lofi", "comedy", "relax", "cozy", "travel", "cooking", "vlog", "game"],
      negative: ["urgent", "breaking", "debate", "lecture", "exam", "productivity"]
    },
    research: {
      label: "Research",
      positive: ["analysis", "documentary", "interview", "paper", "review", "deep dive", "explained", "evidence"],
      negative: ["shorts", "prank", "reaction", "gossip", "compilation"]
    },
    bareMetal: {
      label: "Bare Metal",
      positive: [],
      negative: []
    }
  };

  let activeMode = DEFAULT_MODE;
  let scanTimer = null;

  init();

  function init() {
    readMode().then((mode) => {
      activeMode = normalizeMode(mode);
      applyModeClass();
      scanCards();
      startObservers();
    });

    if (chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== "local" || !changes[STORAGE_KEY]) {
          return;
        }

        activeMode = normalizeMode(changes[STORAGE_KEY].newValue);
        applyModeClass();
        clearDecorations();
        scanCards();
      });
    }
  }

  function readMode() {
    return new Promise((resolve) => {
      if (!chrome.storage || !chrome.storage.local) {
        resolve(DEFAULT_MODE);
        return;
      }

      chrome.storage.local.get({ [STORAGE_KEY]: DEFAULT_MODE }, (items) => {
        resolve(items[STORAGE_KEY]);
      });
    });
  }

  function normalizeMode(mode) {
    return Object.prototype.hasOwnProperty.call(MODES, mode) ? mode : DEFAULT_MODE;
  }

  function startObservers() {
    const observer = new MutationObserver(scheduleScan);
    observer.observe(document.documentElement, { childList: true, subtree: true });

    window.addEventListener("yt-navigate-finish", scheduleScan);
    window.addEventListener("popstate", scheduleScan);
    scheduleScan();
  }

  function scheduleScan() {
    window.clearTimeout(scanTimer);
    scanTimer = window.setTimeout(scanCards, 250);
  }

  function scanCards() {
    document.querySelectorAll(CARD_SELECTOR).forEach(decorateCard);
    window.clearTimeout(scanTimer);
    scanTimer = window.setTimeout(scanCards, SCAN_INTERVAL_MS);
  }

  function decorateCard(card) {
    if (!(card instanceof HTMLElement)) {
      return;
    }

    card.classList.add("persona-labs-card");

    if (activeMode === "bareMetal") {
      removeBadge(card);
      card.removeAttribute("data-persona-labs-score");
      card.style.removeProperty("--persona-labs-border-color");
      card.style.removeProperty("--persona-labs-border-glow");
      return;
    }

    const title = getCardTitle(card);
    const score = scoreTitle(title, activeMode);
    const color = colorForScore(score);

    card.dataset.personaLabsScore = String(score);
    card.style.setProperty("--persona-labs-border-color", color.border);
    card.style.setProperty("--persona-labs-border-glow", color.glow);
    renderBadge(card, score, MODES[activeMode].label);
  }

  function getCardTitle(card) {
    const titleLink = card.querySelector("#video-title");
    const ariaTitle = titleLink && titleLink.getAttribute("aria-label");
    const textTitle = titleLink && titleLink.textContent;
    return String(ariaTitle || textTitle || "").trim();
  }

  function scoreTitle(title, mode) {
    const lowerTitle = title.toLowerCase();
    const rules = MODES[mode];
    let score = 55 + deterministicJitter(lowerTitle);

    rules.positive.forEach((keyword) => {
      if (lowerTitle.includes(keyword)) {
        score += 12;
      }
    });

    rules.negative.forEach((keyword) => {
      if (lowerTitle.includes(keyword)) {
        score -= 16;
      }
    });

    return Math.max(5, Math.min(98, score));
  }

  function deterministicJitter(text) {
    let hash = 0;
    for (let index = 0; index < text.length; index += 1) {
      hash = (hash * 31 + text.charCodeAt(index)) % 997;
    }
    return (hash % 25) - 10;
  }

  function colorForScore(score) {
    if (score >= 80) {
      return { border: "#22c55e", glow: "rgba(34, 197, 94, 0.18)" };
    }

    if (score >= 60) {
      return { border: "#eab308", glow: "rgba(234, 179, 8, 0.2)" };
    }

    if (score >= 40) {
      return { border: "#f97316", glow: "rgba(249, 115, 22, 0.2)" };
    }

    return { border: "#ef4444", glow: "rgba(239, 68, 68, 0.18)" };
  }

  function renderBadge(card, score, modeLabel) {
    let badge = card.querySelector(":scope > .persona-labs-badge");
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "persona-labs-badge";
      badge.innerHTML = '<span class="persona-labs-badge-dot"></span><span class="persona-labs-badge-text"></span>';
      card.prepend(badge);
    }

    const text = badge.querySelector(".persona-labs-badge-text");
    text.textContent = `${modeLabel} ${score}`;
  }

  function removeBadge(card) {
    const badge = card.querySelector(":scope > .persona-labs-badge");
    if (badge) {
      badge.remove();
    }
  }

  function clearDecorations() {
    document.querySelectorAll(".persona-labs-card").forEach((card) => {
      if (!(card instanceof HTMLElement)) {
        return;
      }

      card.removeAttribute("data-persona-labs-score");
      card.style.removeProperty("--persona-labs-border-color");
      card.style.removeProperty("--persona-labs-border-glow");
      removeBadge(card);
    });
  }

  function applyModeClass() {
    document.documentElement.classList.toggle("persona-labs-bare-metal", activeMode === "bareMetal");
  }
})();

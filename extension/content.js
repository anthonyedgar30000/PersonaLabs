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
      label: "Study"
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
      label: "Bare Metal"
    }
  };

  const STUDY_EDUCATIONAL_KEYWORDS = [
    "academic",
    "basics",
    "beginner",
    "class",
    "course",
    "crash course",
    "education",
    "explained",
    "fundamentals",
    "guide",
    "intro",
    "introduction",
    "learn",
    "lecture",
    "lesson",
    "masterclass",
    "seminar",
    "study",
    "training",
    "university",
    "workshop"
  ];

  const STUDY_TUTORIAL_INDICATORS = [
    "build",
    "coding",
    "complete guide",
    "demo",
    "from scratch",
    "full course",
    "hands-on",
    "how to",
    "step by step",
    "tutorial",
    "walkthrough"
  ];

  const STUDY_TECHNICAL_TERMS = [
    "api",
    "architecture",
    "algorithm",
    "aws",
    "backend",
    "compiler",
    "css",
    "database",
    "data structure",
    "devops",
    "docker",
    "frontend",
    "git",
    "html",
    "javascript",
    "kubernetes",
    "linux",
    "machine learning",
    "node",
    "node.js",
    "programming",
    "python",
    "react",
    "rust",
    "security",
    "software",
    "sql",
    "system design",
    "terminal",
    "typescript"
  ];

  const EMOTIONAL_LANGUAGE = [
    "amazing",
    "brutal",
    "crazy",
    "disaster",
    "epic",
    "hate",
    "insane",
    "rage",
    "terrifying",
    "unbelievable",
    "worst"
  ];

  const OUTRAGE_CLICKBAIT_INDICATORS = [
    "cancelled",
    "canceled",
    "destroyed",
    "drama",
    "exposed",
    "gone wrong",
    "meltdown",
    "must watch",
    "scandal",
    "secret",
    "shocking",
    "slammed",
    "they lied",
    "truth about",
    "you won't believe"
  ];

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
      card.removeAttribute("data-persona-labs-alignment");
      card.style.removeProperty("--persona-labs-border-color");
      card.style.removeProperty("--persona-labs-border-glow");
      return;
    }

    const context = getCardContext(card);
    const result = scoreCard(context, activeMode);
    const color = colorForScore(result.score);

    card.dataset.personaLabsScore = String(result.score);
    card.dataset.personaLabsAlignment = color.alignment;
    card.style.setProperty("--persona-labs-border-color", color.border);
    card.style.setProperty("--persona-labs-border-glow", color.glow);
    renderBadge(card, result, MODES[activeMode].label, color.alignment);
  }

  function getCardContext(card) {
    const titleLink = card.querySelector("#video-title");
    const textTitle = titleLink && titleLink.textContent;
    const ariaTitle = titleLink && titleLink.getAttribute("aria-label");
    const href = titleLink && titleLink.getAttribute("href");
    const title = String(textTitle || ariaTitle || "").trim();
    const durationText = getDurationText(card);
    const durationSeconds = parseDuration(durationText) || parseDuration(ariaTitle || "");
    const searchText = [title, ariaTitle, card.getAttribute("aria-label")].filter(Boolean).join(" ").toLowerCase();
    const isShort =
      card.matches("ytd-reel-item-renderer") ||
      String(href || "").includes("/shorts/") ||
      (durationSeconds !== null && durationSeconds <= 60);

    return {
      durationSeconds,
      isShort,
      searchText,
      title
    };
  }

  function getDurationText(card) {
    const selectors = [
      "ytd-thumbnail-overlay-time-status-renderer #text",
      "ytd-thumbnail-overlay-time-status-renderer span",
      "yt-thumbnail-overlay-time-status-renderer #text",
      ".badge-shape-wiz__text"
    ];

    for (const selector of selectors) {
      const node = card.querySelector(selector);
      const text = node && node.textContent ? node.textContent.trim() : "";
      if (/\d{1,2}:\d{2}/.test(text)) {
        return text;
      }
    }

    return card.textContent || "";
  }

  function parseDuration(text) {
    const value = String(text || "");
    const colonMatch = value.match(/\b(\d{1,2}:)?\d{1,2}:\d{2}\b/);
    if (colonMatch) {
      const parts = colonMatch[0].split(":").map((part) => Number(part));
      return parts.reduce((total, part) => total * 60 + part, 0);
    }

    const hourMatch = value.match(/(\d+)\s+hour/);
    const minuteMatch = value.match(/(\d+)\s+minute/);
    const secondMatch = value.match(/(\d+)\s+second/);
    const seconds =
      (hourMatch ? Number(hourMatch[1]) * 3600 : 0) +
      (minuteMatch ? Number(minuteMatch[1]) * 60 : 0) +
      (secondMatch ? Number(secondMatch[1]) : 0);

    return seconds || null;
  }

  function scoreCard(context, mode) {
    if (mode === "study") {
      return scoreStudyMode(context);
    }

    return scoreKeywordMode(context, mode);
  }

  function scoreStudyMode(context) {
    let score = 42;
    const reasons = ["Base study fit: 42"];
    const educationMatches = findMatches(context.searchText, STUDY_EDUCATIONAL_KEYWORDS);
    const tutorialMatches = findMatches(context.searchText, STUDY_TUTORIAL_INDICATORS);
    const technicalMatches = findMatches(context.searchText, STUDY_TECHNICAL_TERMS);
    const emotionalMatches = findMatches(context.searchText, EMOTIONAL_LANGUAGE);
    const clickbaitMatches = findMatches(context.searchText, OUTRAGE_CLICKBAIT_INDICATORS);
    const allCapsSignal = hasAllCapsSignal(context.title);
    const punctuationSignal = /!!|\?\?/.test(context.title);

    if (educationMatches.length) {
      const points = Math.min(22, educationMatches.length * 7);
      score += points;
      reasons.push(`+${points} educational keywords: ${formatMatches(educationMatches)}`);
    }

    if (tutorialMatches.length) {
      const points = Math.min(18, tutorialMatches.length * 9);
      score += points;
      reasons.push(`+${points} tutorial/walkthrough indicators: ${formatMatches(tutorialMatches)}`);
    }

    if (technicalMatches.length) {
      const points = Math.min(24, technicalMatches.length * 6);
      score += points;
      reasons.push(`+${points} technical terminology: ${formatMatches(technicalMatches)}`);
    }

    if (context.durationSeconds >= 1200) {
      score += 14;
      reasons.push("+14 long-form duration: 20+ minutes");
    } else if (context.durationSeconds >= 600) {
      score += 10;
      reasons.push("+10 long-form duration: 10+ minutes");
    } else if (context.durationSeconds >= 300) {
      score += 4;
      reasons.push("+4 medium-form duration: 5+ minutes");
    } else if (context.durationSeconds && context.durationSeconds <= 90) {
      score -= 18;
      reasons.push("-18 short duration: under 90 seconds");
    }

    if (context.isShort) {
      score -= 28;
      reasons.push("-28 Shorts format detected");
    }

    if (!emotionalMatches.length && !clickbaitMatches.length && !allCapsSignal && !punctuationSignal) {
      score += 8;
      reasons.push("+8 low emotional language");
    } else {
      if (emotionalMatches.length) {
        const points = Math.min(18, emotionalMatches.length * 6);
        score -= points;
        reasons.push(`-${points} emotional language: ${formatMatches(emotionalMatches)}`);
      }

      if (clickbaitMatches.length) {
        const points = Math.min(24, clickbaitMatches.length * 8);
        score -= points;
        reasons.push(`-${points} outrage/clickbait indicators: ${formatMatches(clickbaitMatches)}`);
      }

      if (allCapsSignal) {
        score -= 6;
        reasons.push("-6 all-caps emphasis");
      }

      if (punctuationSignal) {
        score -= 4;
        reasons.push("-4 exaggerated punctuation");
      }
    }

    return {
      reasons,
      score: clampScore(score)
    };
  }

  function scoreKeywordMode(context, mode) {
    const rules = MODES[mode];
    let score = 55 + deterministicJitter(context.title.toLowerCase());
    const reasons = ["Mock mode score from title keywords"];
    const positiveMatches = findMatches(context.searchText, rules.positive || []);
    const negativeMatches = findMatches(context.searchText, rules.negative || []);

    positiveMatches.forEach((keyword) => {
      score += 12;
      reasons.push(`+12 matched "${keyword}"`);
    });

    negativeMatches.forEach((keyword) => {
      score -= 16;
      reasons.push(`-16 matched "${keyword}"`);
    });

    return {
      reasons,
      score: clampScore(score)
    };
  }

  function findMatches(text, terms) {
    const lowerText = String(text || "").toLowerCase();
    return terms.filter((term) => lowerText.includes(term));
  }

  function formatMatches(matches) {
    return matches.slice(0, 3).join(", ");
  }

  function hasAllCapsSignal(title) {
    const words = String(title || "").match(/\b[A-Z]{3,}\b/g) || [];
    return words.length >= 2;
  }

  function clampScore(score) {
    return Math.max(5, Math.min(95, Math.round(score)));
  }

  function deterministicJitter(text) {
    let hash = 0;
    for (let index = 0; index < text.length; index += 1) {
      hash = (hash * 31 + text.charCodeAt(index)) % 997;
    }
    return (hash % 25) - 10;
  }

  function colorForScore(score) {
    if (score >= 70) {
      return {
        alignment: "aligned",
        border: "#22c55e",
        glow: "rgba(34, 197, 94, 0.18)"
      };
    }

    if (score >= 45) {
      return {
        alignment: "neutral",
        border: "#eab308",
        glow: "rgba(234, 179, 8, 0.2)"
      };
    }

    return {
      alignment: "misaligned",
      border: "#ef4444",
      glow: "rgba(239, 68, 68, 0.18)"
    };
  }

  function renderBadge(card, result, modeLabel, alignment) {
    let badge = card.querySelector(":scope > .persona-labs-badge");
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "persona-labs-badge";
      badge.innerHTML = [
        '<span class="persona-labs-badge-main">',
        '<span class="persona-labs-badge-dot"></span>',
        '<span class="persona-labs-badge-text"></span>',
        "</span>",
        '<span class="persona-labs-badge-details"></span>'
      ].join("");
      card.prepend(badge);
    }

    const text = badge.querySelector(".persona-labs-badge-text");
    const details = badge.querySelector(".persona-labs-badge-details");
    const shortReasons = result.reasons.slice(1, 3).map(cleanReason);
    text.textContent = `${modeLabel} ${result.score} - ${alignment}`;
    details.textContent = shortReasons.length ? shortReasons.join(" | ") : "Mock local score";
    badge.title = [`${modeLabel} score ${result.score}: ${alignment}`, ...result.reasons].join("\n");
  }

  function cleanReason(reason) {
    return reason.replace(/^[+-]\d+\s*/, "");
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
      card.removeAttribute("data-persona-labs-alignment");
      card.style.removeProperty("--persona-labs-border-color");
      card.style.removeProperty("--persona-labs-border-glow");
      removeBadge(card);
    });
  }

  function applyModeClass() {
    document.documentElement.classList.toggle("persona-labs-bare-metal", activeMode === "bareMetal");
  }
})();

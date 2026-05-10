(function personaLabsYouTubeOverlay() {
  const MODE_STORAGE_KEY = "personaLabsMode";
  const SESSION_STORAGE_KEY = "personaLabsSessionTelemetry";
  const SCHEDULE_STORAGE_KEY = "personaLabsScheduleConfig";
  const DEFAULT_MODE = "study";
  const SCAN_INTERVAL_MS = 1500;
  const DRIFT_SNOOZE_MS = 30 * 60 * 1000;
  const CONTINUE_SNOOZE_MS = 10 * 60 * 1000;
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
      intent: "focused learning"
    },
    chill: {
      label: "Chill",
      intent: "low-conflict recovery"
    },
    research: {
      label: "Research",
      intent: "evidence-seeking exploration"
    },
    project: {
      label: "Project",
      intent: "building and execution"
    },
    bareMetal: {
      label: "Bare Metal",
      intent: "unmediated browsing"
    }
  };

  const DEFAULT_SCHEDULE_CONFIG = {
    version: 1,
    timezone: "local",
    windows: [
      { name: "work hours", suggestedModes: ["project", "research"], days: "weekdays", start: "09:00", end: "17:00" },
      { name: "study/project time", suggestedModes: ["study", "project"], days: "configurable", start: "19:00", end: "21:00" },
      { name: "family time", suggestedModes: ["bareMetal"], days: "configurable", start: "17:30", end: "19:00" },
      { name: "chill time", suggestedModes: ["chill"], days: "configurable", start: "21:00", end: "22:30" },
      { name: "recovery time", suggestedModes: ["chill", "bareMetal"], days: "configurable", start: "22:30", end: "23:30" },
      { name: "intentional news window", suggestedModes: ["research"], days: "configurable", start: "12:00", end: "12:30" }
    ]
  };

  /*
   * Lexical scoring architecture
   *
   * These dictionaries are research-informed heuristic signal categories,
   * not clinical, diagnostic, identity, or truth-judgment models. They are
   * grounded in source concepts from AI governance (NIST AI RMF), human-AI
   * interaction guidance (Microsoft HAI Guidelines), and usability/cognitive
   * load principles (Nielsen Norman Group): make system behavior observable,
   * explain uncertainty, preserve user control, reduce interruption, and keep
   * recovery paths clear.
   *
   * The dictionaries only observe words/phrases that may indicate alignment
   * with the user's current mode. Core categories include:
   * educational/study-positive, technical/cyber/AI, evidence/grounding,
   * calm/low-conflict, clickbait/urgency, outrage/rage-bait,
   * outrage escalation, humiliation framing, tribal conflict language,
   * panic/fear framing, absolutist/emotional wording, doomscroll triggers,
   * speculation/low-evidence, and short-form/novelty-risk terms.
   * Scores are local-first deterministic alignment estimates. Explanations
   * must show observed signals and uncertainty; Bare Metal and user override
   * must remain available.
   */
  const HEURISTIC_SIGNAL_DICTIONARIES = {
    educationalStudyPositive: [
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
    ],
    tutorial: [
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
    ],
    technicalCyberAi: [
      "ai",
      "api",
      "architecture",
      "algorithm",
      "aws",
      "backend",
      "compiler",
      "cyber",
      "cybersecurity",
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
    ],
    evidenceGrounding: [
      "analysis",
      "case study",
      "data",
      "documentary",
      "evidence",
      "expert",
      "interview",
      "paper",
      "report",
      "review",
      "source",
      "study"
    ],
    researchComplexity: [
      "climate",
      "economics",
      "election",
      "geopolitics",
      "history",
      "law",
      "market",
      "policy",
      "science",
      "technology"
    ],
    viewpoints: [
      "conversation",
      "critique",
      "debate",
      "opposing views",
      "panel",
      "response",
      "roundtable"
    ],
    currentEvents: [
      "breaking",
      "current events",
      "news",
      "today",
      "update",
      "weekly"
    ],
    calmLowConflict: [
      "ambient",
      "calm",
      "cozy",
      "cooking",
      "game",
      "gardening",
      "light comedy",
      "lofi",
      "meditation",
      "music",
      "nature",
      "relax",
      "travel",
      "vlog",
      "walk"
    ],
    project: [
      "bug",
      "build",
      "debug",
      "deploy",
      "design",
      "implementation",
      "project",
      "refactor",
      "ship",
      "test",
      "workflow"
    ],
    entertainment: [
      "celebrity",
      "challenge",
      "drama",
      "fails",
      "gossip",
      "prank",
      "reaction",
      "reacts",
      "try not to laugh"
    ],
    emotional: [
      "amazing",
      "brutal",
      "crazy",
      "disaster",
      "epic",
      "hate",
      "insane",
      "rage",
      "terrifying",
      "unhinged",
      "unbelievable",
      "worst"
    ],
    clickbaitUrgency: [
      "before it's deleted",
      "breaking",
      "limited time",
      "must watch",
      "secret",
      "shocking",
      "urgent",
      "watch now",
      "you need to see",
      "you won't believe"
    ],
    outrageRageBait: [
      "cancelled",
      "canceled",
      "destroyed",
      "drama",
      "exposed",
      "gone wrong",
      "meltdown",
      "scandal",
      "slammed",
      "they lied",
      "truth about",
      "woke mob"
    ],
    outrageEscalation: [
      "annihilates",
      "crushed",
      "destroyed",
      "explodes",
      "meltdown",
      "obliterated",
      "panic mode",
      "total disaster"
    ],
    humiliationFraming: [
      "embarrassed",
      "humiliated",
      "humiliates",
      "owned",
      "owns",
      "shuts down",
      "smoked"
    ],
    tribalConflictLanguage: [
      "civil war",
      "culture war",
      "enemy",
      "mob",
      "our side",
      "their side",
      "traitor",
      "us vs them",
      "war on"
    ],
    panicFearFraming: [
      "catastrophe",
      "complete shock",
      "crisis",
      "disaster",
      "freakout",
      "losing their minds",
      "panic",
      "panic mode",
      "terrifying"
    ],
    absolutistEmotionalWording: [
      "always",
      "complete shock",
      "everyone",
      "never",
      "no one",
      "totally",
      "unbelievable",
      "worst"
    ],
    doomscrollTriggerLanguage: [
      "breaking",
      "can't stop watching",
      "doom",
      "end of",
      "everything is collapsing",
      "must watch",
      "urgent",
      "watch before it's gone",
      "you won't believe",
      "you won\u2019t believe"
    ],
    thumbnailHighImpact: [
      "annihilates",
      "destroyed",
      "disaster",
      "exposed",
      "humiliated",
      "it's over",
      "it\u2019s over",
      "its over",
      "lied",
      "meltdown",
      "no way",
      "panic",
      "shocking"
    ],
    speculationLowEvidence: [
      "allegedly",
      "anonymous source",
      "could be",
      "maybe",
      "rumor",
      "theory",
      "unconfirmed",
      "what if"
    ],
    conflict: [
      "attack",
      "civil war",
      "clash",
      "culture war",
      "fight",
      "humiliates",
      "owns",
      "political war",
      "war on"
    ],
    shortFormNoveltyRisk: [
      "compilation",
      "random",
      "shorts",
      "tiktok",
      "top 10",
      "viral"
    ]
  };

  let activeMode = DEFAULT_MODE;
  let scanTimer = null;
  let sessionState = null;
  let telemetryFlushTimer = null;
  let seenCardKeys = new Set();
  let recentNavigationTimes = [];

  init();

  async function init() {
    const items = await getLocal({
      [MODE_STORAGE_KEY]: DEFAULT_MODE,
      [SESSION_STORAGE_KEY]: null,
      [SCHEDULE_STORAGE_KEY]: null
    });

    activeMode = normalizeMode(items[MODE_STORAGE_KEY]);
    sessionState = normalizeSession(items[SESSION_STORAGE_KEY], activeMode);
    await ensureScheduleConfig(items[SCHEDULE_STORAGE_KEY]);
    persistTelemetrySoon();

    applyModeClass();
    scanCards();
    startObservers();

    if (chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== "local" || !changes[MODE_STORAGE_KEY]) {
          return;
        }

        const nextMode = normalizeMode(changes[MODE_STORAGE_KEY].newValue);
        if (nextMode !== activeMode) {
          activeMode = nextMode;
          seenCardKeys = new Set();
          recordModeChange(nextMode);
        }

        applyModeClass();
        hideDriftPrompt();
        clearDecorations();
        scanCards();
      });
    }
  }

  function getLocal(defaults) {
    return new Promise((resolve) => {
      if (!chrome.storage || !chrome.storage.local) {
        resolve(defaults);
        return;
      }

      chrome.storage.local.get(defaults, resolve);
    });
  }

  function setLocal(values) {
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.set(values);
    }
  }

  function normalizeMode(mode) {
    return Object.prototype.hasOwnProperty.call(MODES, mode) ? mode : DEFAULT_MODE;
  }

  async function ensureScheduleConfig(config) {
    if (config && config.version === DEFAULT_SCHEDULE_CONFIG.version) {
      return;
    }

    setLocal({ [SCHEDULE_STORAGE_KEY]: DEFAULT_SCHEDULE_CONFIG });
  }

  function normalizeSession(session, mode) {
    const now = Date.now();
    const base = session && session.version === 1 ? session : createSession(mode, now);
    base.activeMode = mode;
    base.lastUpdated = now;
    base.alignmentCounts = normalizeAlignmentCounts(base.alignmentCounts);
    base.emotionalVolatilityScoreTotal = Number(base.emotionalVolatilityScoreTotal) || 0;
    base.highEmotionalVolatilityItems = Number(base.highEmotionalVolatilityItems) || 0;
    base.byMode = base.byMode || {};

    Object.keys(MODES).forEach((modeKey) => {
      if (modeKey !== "bareMetal") {
        base.byMode[modeKey] = normalizeModeStats(base.byMode[modeKey]);
      }
    });

    return base;
  }

  function createSession(mode, now) {
    return {
      version: 1,
      sessionId: `session-${now}`,
      startTime: now,
      lastUpdated: now,
      activeMode: mode,
      cardsScanned: 0,
      emotionalVolatilityScoreTotal: 0,
      highEmotionalVolatilityItems: 0,
      shortsDetected: 0,
      misalignedItemsVisible: 0,
      misalignedItemsScanned: 0,
      rapidSwitchEstimate: 0,
      modeChanges: 0,
      driftPromptCount: 0,
      driftSnoozedUntil: 0,
      alignmentCounts: createAlignmentCounts(),
      byMode: {}
    };
  }

  function normalizeModeStats(stats) {
    return {
      cardsScanned: Number(stats && stats.cardsScanned) || 0,
      emotionalVolatilityScoreTotal: Number(stats && stats.emotionalVolatilityScoreTotal) || 0,
      highEmotionalVolatilityItems: Number(stats && stats.highEmotionalVolatilityItems) || 0,
      shortsDetected: Number(stats && stats.shortsDetected) || 0,
      misalignedItemsVisible: Number(stats && stats.misalignedItemsVisible) || 0,
      misalignedItemsScanned: Number(stats && stats.misalignedItemsScanned) || 0,
      alignmentCounts: normalizeAlignmentCounts(stats && stats.alignmentCounts)
    };
  }

  function createAlignmentCounts() {
    return {
      aligned: 0,
      neutral: 0,
      misaligned: 0
    };
  }

  function normalizeAlignmentCounts(counts) {
    return {
      aligned: Number(counts && counts.aligned) || 0,
      neutral: Number(counts && counts.neutral) || 0,
      misaligned: Number(counts && counts.misaligned) || 0
    };
  }

  function startObservers() {
    const observer = new MutationObserver(scheduleScan);
    observer.observe(document.documentElement, { childList: true, subtree: true });

    window.addEventListener("yt-navigate-finish", () => {
      recordNavigationEvent();
      scheduleScan();
    });
    window.addEventListener("popstate", scheduleScan);
    scheduleScan();
  }

  function scheduleScan() {
    window.clearTimeout(scanTimer);
    scanTimer = window.setTimeout(scanCards, 250);
  }

  function scanCards() {
    document.querySelectorAll(CARD_SELECTOR).forEach(decorateCard);
    evaluateDrift();
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
    recordCardTelemetry(context, result, color.alignment, isElementVisible(card));
  }

  function getCardContext(card) {
    const titleLink = card.querySelector("#video-title");
    const textTitle = titleLink && titleLink.textContent;
    const ariaTitle = titleLink && titleLink.getAttribute("aria-label");
    const href = titleLink && titleLink.getAttribute("href");
    const title = String(textTitle || ariaTitle || "").trim();
    const durationText = getDurationText(card);
    const durationSeconds = parseDuration(durationText) || parseDuration(ariaTitle || "");
    const titleText = normalizeWhitespace([title, ariaTitle]);
    const thumbnailText = getThumbnailText(card);
    const metadataText = getMetadataText(card, ariaTitle, durationText);
    const searchText = normalizeText([titleText, thumbnailText, metadataText]);
    const isShort =
      card.matches("ytd-reel-item-renderer") ||
      String(href || "").includes("/shorts/") ||
      (durationSeconds !== null && durationSeconds <= 60);

    return {
      durationSeconds,
      href: href || "",
      isShort,
      key: `${href || title}-${durationSeconds || "unknown"}`,
      metadataText,
      searchText,
      thumbnailText,
      title,
      titleText
    };
  }

  function getThumbnailText(card) {
    const selectors = [
      "ytd-thumbnail",
      "a#thumbnail",
      "#thumbnail",
      "yt-thumbnail-view-model",
      "yt-image",
      "ytd-thumbnail img",
      "a#thumbnail img",
      "#thumbnail img",
      "img"
    ];
    const values = [];

    selectors.forEach((selector) => {
      const node = card.querySelector(selector);
      if (node) {
        values.push(collectAccessibleText(node));
      }
    });

    if (typeof card.querySelectorAll === "function") {
      card.querySelectorAll("img").forEach((node) => {
        values.push(collectAccessibleText(node));
      });
    }

    return normalizeWhitespace(values);
  }

  function getMetadataText(card, ariaTitle, durationText) {
    const selectors = [
      "#metadata-line",
      "ytd-video-meta-block",
      "#byline",
      "#channel-name",
      "ytd-badge-supported-renderer",
      "ytd-thumbnail-overlay-time-status-renderer"
    ];
    const values = [ariaTitle, card.getAttribute("aria-label"), durationText];

    selectors.forEach((selector) => {
      const node = card.querySelector(selector);
      if (node) {
        values.push(collectAccessibleText(node));
      }
    });

    return normalizeWhitespace(values);
  }

  function collectAccessibleText(node) {
    if (!node) {
      return "";
    }

    return normalizeWhitespace([
      node.getAttribute && node.getAttribute("alt"),
      node.getAttribute && node.getAttribute("aria-label"),
      node.getAttribute && node.getAttribute("title"),
      node.textContent
    ]);
  }

  function normalizeWhitespace(values) {
    return values
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeText(values) {
    return normalizeWhitespace(values).toLowerCase();
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
    let result;

    if (mode === "study") {
      result = scoreStudyMode(context);
    } else if (mode === "research") {
      result = scoreResearchMode(context);
    } else if (mode === "chill") {
      result = scoreChillMode(context);
    } else if (mode === "project") {
      result = scoreProjectMode(context);
    } else {
      result = buildResult(50, [], [], "No active mode scoring.");
    }

    result.metrics.sourceSignals = buildSourceSignalSummary(context);
    result.metrics.thumbnailTextAvailable = Boolean(context.thumbnailText);
    return result;
  }

  function scoreStudyMode(context) {
    let score = 42;
    const positives = [];
    const negatives = [];
    const volatility = calculateEmotionalVolatility(context);
    const education = findMatches(context.searchText, HEURISTIC_SIGNAL_DICTIONARIES.educationalStudyPositive);
    const tutorial = findMatches(context.searchText, HEURISTIC_SIGNAL_DICTIONARIES.tutorial);
    const technical = findMatches(context.searchText, HEURISTIC_SIGNAL_DICTIONARIES.technicalCyberAi);
    const entertainment = findMatches(context.searchText, HEURISTIC_SIGNAL_DICTIONARIES.entertainment);
    const novelty = findMatches(context.searchText, HEURISTIC_SIGNAL_DICTIONARIES.shortFormNoveltyRisk);
    let continuityBonus = 0;
    const durationBonus = addDurationSignal(context, positives, negatives);

    score += addSignal(positives, education, "educational keywords", 7, 22);
    score += addSignal(positives, tutorial, "tutorial/walkthrough indicators", 9, 18);
    score += addSignal(positives, technical, "technical terminology", 6, 24);
    score += addThumbnailSignal(
      positives,
      findMatches(context.thumbnailText, HEURISTIC_SIGNAL_DICTIONARIES.educationalStudyPositive),
      "educational/study-positive text",
      5,
      12
    );
    score += addThumbnailSignal(
      positives,
      findMatches(context.thumbnailText, HEURISTIC_SIGNAL_DICTIONARIES.tutorial),
      "tutorial/walkthrough text",
      5,
      12
    );
    score += addThumbnailSignal(
      positives,
      findMatches(context.thumbnailText, HEURISTIC_SIGNAL_DICTIONARIES.technicalCyberAi),
      "technical/cyber/AI text",
      4,
      12
    );
    score += durationBonus;

    if ((education.length || tutorial.length) && technical.length && !context.isShort) {
      continuityBonus = 8;
      score += continuityBonus;
      positives.push("coherent topic learning pattern");
    }

    score += addLowVolatilitySignal(volatility, positives, negatives);

    if (context.isShort) {
      score -= 28;
      negatives.push("Shorts or very short format");
    }

    score -= addSignal(negatives, novelty, "rapid novelty content", 8, 16);
    score -= addSignal(negatives, entertainment, "unrelated entertainment", 9, 18);
    score -= addManipulationPenalties(context, negatives);

    if (volatility.thumbnailSignalCount) {
      score -= Math.min(32, volatility.thumbnailSignalCount * 12);
      negatives.push("thumbnail emotional framing carries extra Study Mode penalty");
    }

    if (volatility.score >= 70) {
      score -= 18;
      negatives.push("severe emotional volatility can outweigh study continuity");
    }

    return buildResult(score, positives, negatives, "Study Mode is tuned for calm, long-form learning and technical depth.", {
      continuityBonus,
      durationBonus,
      emotionalVolatilityScore: volatility.score,
      thumbnailVolatilitySignalCount: volatility.thumbnailSignalCount,
      volatilitySignals: volatility.signals
    });
  }

  function scoreResearchMode(context) {
    let score = 50;
    const positives = [];
    const negatives = [];
    const volatility = calculateEmotionalVolatility(context);
    const evidence = findMatches(context.searchText, HEURISTIC_SIGNAL_DICTIONARIES.evidenceGrounding);
    const complexity = findMatches(context.searchText, HEURISTIC_SIGNAL_DICTIONARIES.researchComplexity);
    const viewpoints = findMatches(context.searchText, HEURISTIC_SIGNAL_DICTIONARIES.viewpoints);
    const currentEvents = findMatches(context.searchText, HEURISTIC_SIGNAL_DICTIONARIES.currentEvents);
    const speculation = findMatches(context.searchText, HEURISTIC_SIGNAL_DICTIONARIES.speculationLowEvidence);
    let continuityBonus = 0;
    let durationBonus = 0;

    score += addSignal(positives, evidence, "evidence or source density", 8, 24);
    score += addSignal(positives, complexity, "high-complexity topic", 6, 18);
    score += addSignal(positives, viewpoints, "opposing viewpoints or critique", 6, 14);
    score += addSignal(positives, currentEvents, "current events context", 4, 10);
    score += addThumbnailSignal(
      positives,
      findMatches(context.thumbnailText, HEURISTIC_SIGNAL_DICTIONARIES.evidenceGrounding),
      "evidence/grounding text",
      6,
      14
    );
    score += addThumbnailSignal(
      positives,
      findMatches(context.thumbnailText, HEURISTIC_SIGNAL_DICTIONARIES.technicalCyberAi),
      "technical/cyber/AI text",
      4,
      10
    );

    if ((complexity.length || currentEvents.length) && (evidence.length || viewpoints.length)) {
      continuityBonus = 6;
      score += continuityBonus;
      positives.push("topic continuity with grounding signals");
    }

    if ((currentEvents.length || complexity.length) && !evidence.length) {
      score -= 12;
      negatives.push("low evidence density for a complex/current topic");
    }

    if (speculation.length && !evidence.length) {
      score -= 12;
      negatives.push(`speculation/low-evidence terms without grounding: ${formatMatches(speculation)}`);
    }

    if (context.durationSeconds >= 600) {
      durationBonus = 6;
      score += durationBonus;
      positives.push("enough duration for context");
    }

    if (context.isShort) {
      score -= 18;
      negatives.push("Shorts format limits context");
    }

    score -= addManipulationPenalties(context, negatives);

    return buildResult(score, positives, negatives, "Research Mode allows complexity and opposing views, while flagging rage framing.", {
      continuityBonus,
      durationBonus,
      emotionalVolatilityScore: volatility.score,
      thumbnailVolatilitySignalCount: volatility.thumbnailSignalCount,
      volatilitySignals: volatility.signals
    });
  }

  function scoreChillMode(context) {
    let score = 55;
    const positives = [];
    const negatives = [];
    const volatility = calculateEmotionalVolatility(context);
    const chill = findMatches(context.searchText, HEURISTIC_SIGNAL_DICTIONARIES.calmLowConflict);
    const conflict = findMatches(context.searchText, HEURISTIC_SIGNAL_DICTIONARIES.conflict);
    const outrage = findMatches(context.searchText, HEURISTIC_SIGNAL_DICTIONARIES.outrageRageBait);
    const volatilityPenalty = Math.min(75, Math.round(volatility.score * 0.72));
    const severeVolatility = volatility.score >= 60;
    const elevatedVolatility = volatility.score >= 35;
    let continuityBonus = 0;
    let durationBonus = 0;

    if (volatilityPenalty > 0) {
      score -= volatilityPenalty;
      negatives.push(`emotional volatility estimate: ${volatility.score}/100`);
    }

    score += addSignal(positives, chill, "calming or light content", 8, 18);

    if (chill.length && !elevatedVolatility) {
      continuityBonus = 8;
      score += continuityBonus;
      positives.push("low-conflict topic continuity");
    } else if (chill.length && elevatedVolatility) {
      negatives.push("calming terms are outweighed by emotional volatility");
    }

    if (!conflict.length && !outrage.length && !hasEmotionalVolatility(context)) {
      score += 8;
      positives.push("low-conflict tone");
    }

    if (context.durationSeconds >= 1200 && !elevatedVolatility) {
      durationBonus = 4;
      score += durationBonus;
      positives.push("long-form duration with low conflict signals");
    } else if (context.durationSeconds >= 1200 && elevatedVolatility) {
      negatives.push("long-form duration does not reduce conflict signal");
    }

    if (context.isShort) {
      score -= 6;
      negatives.push("short-form novelty");
    }

    score -= addSignal(negatives, conflict, "conflict-heavy framing", 12, 28);
    score -= addSignal(negatives, outrage, "outrage-heavy language", 15, 38);
    score -= addSignal(negatives, findMatches(context.searchText, HEURISTIC_SIGNAL_DICTIONARIES.currentEvents), "news/current events during chill", 5, 10);

    if (severeVolatility) {
      score = Math.min(score, 34);
      negatives.push("severe emotional volatility overrides duration and continuity bonuses");
    } else if (elevatedVolatility) {
      score = Math.min(score, 49);
      negatives.push("emotional volatility takes priority over long-form duration");
    }

    return buildResult(score, positives, negatives, "Chill Mode is for recovery, low-conflict browsing, and light entertainment.", {
      continuityBonus,
      durationBonus,
      emotionalVolatilityScore: volatility.score,
      thumbnailVolatilitySignalCount: volatility.thumbnailSignalCount,
      volatilitySignals: volatility.signals
    });
  }

  function scoreProjectMode(context) {
    let score = 48;
    const positives = [];
    const negatives = [];
    const volatility = calculateEmotionalVolatility(context);
    const project = findMatches(context.searchText, HEURISTIC_SIGNAL_DICTIONARIES.project);
    const technical = findMatches(context.searchText, HEURISTIC_SIGNAL_DICTIONARIES.technicalCyberAi);
    const tutorial = findMatches(context.searchText, HEURISTIC_SIGNAL_DICTIONARIES.tutorial);
    const entertainment = findMatches(context.searchText, HEURISTIC_SIGNAL_DICTIONARIES.entertainment);
    let continuityBonus = 0;
    let durationBonus = 0;

    score += addSignal(positives, project, "project execution language", 8, 24);
    score += addSignal(positives, technical, "technical implementation terms", 6, 20);
    score += addSignal(positives, tutorial, "how-to or walkthrough support", 5, 12);

    if ((project.length || tutorial.length) && technical.length) {
      continuityBonus = 6;
      score += continuityBonus;
      positives.push("topic continuity for project execution");
    }

    if (context.durationSeconds >= 300) {
      durationBonus = 6;
      score += durationBonus;
      positives.push("enough duration to support execution");
    }

    if (context.isShort) {
      score -= 20;
      negatives.push("Shorts format is usually low project support");
    }

    score -= addSignal(negatives, entertainment, "unrelated entertainment", 10, 22);
    score -= addManipulationPenalties(context, negatives);

    return buildResult(score, positives, negatives, "Project Mode favors practical build, debug, and execution support.", {
      continuityBonus,
      durationBonus,
      emotionalVolatilityScore: volatility.score,
      thumbnailVolatilitySignalCount: volatility.thumbnailSignalCount,
      volatilitySignals: volatility.signals
    });
  }

  function buildSourceSignalSummary(context) {
    return {
      metadata: summarizeTextSignals(context.metadataText),
      thumbnail: summarizeTextSignals(context.thumbnailText),
      title: summarizeTextSignals(context.titleText)
    };
  }

  function summarizeTextSignals(text) {
    if (!text) {
      return [];
    }

    const categories = [
      { key: "educationalStudyPositive", label: "educational/study-positive" },
      { key: "tutorial", label: "tutorial/walkthrough" },
      { key: "technicalCyberAi", label: "technical/cyber/AI" },
      { key: "evidenceGrounding", label: "evidence/grounding" },
      { key: "calmLowConflict", label: "calm/low-conflict" },
      { key: "clickbaitUrgency", label: "clickbait/urgency" },
      { key: "outrageRageBait", label: "outrage/rage-bait" },
      { key: "outrageEscalation", label: "outrage escalation" },
      { key: "humiliationFraming", label: "humiliation framing" },
      { key: "tribalConflictLanguage", label: "tribal conflict" },
      { key: "panicFearFraming", label: "panic/fear" },
      { key: "absolutistEmotionalWording", label: "absolutist/emotional" },
      { key: "doomscrollTriggerLanguage", label: "doomscroll trigger" },
      { key: "shortFormNoveltyRisk", label: "short-form/novelty" }
    ];

    return categories
      .map((category) => {
        const matches = findMatches(text, HEURISTIC_SIGNAL_DICTIONARIES[category.key]);
        return matches.length ? `${category.label}: ${formatMatches(matches)}` : "";
      })
      .filter(Boolean)
      .slice(0, 6);
  }

  function calculateEmotionalVolatility(context) {
    const categories = [
      { key: "outrageEscalation", label: "outrage/escalation signals", weight: 20, cap: 34, thumbnailWeight: 30, thumbnailCap: 48 },
      { key: "humiliationFraming", label: "humiliation framing", weight: 18, cap: 30, thumbnailWeight: 28, thumbnailCap: 44 },
      { key: "tribalConflictLanguage", label: "tribal conflict language", weight: 16, cap: 28, thumbnailWeight: 22, thumbnailCap: 36 },
      { key: "panicFearFraming", label: "panic/fear framing", weight: 18, cap: 32, thumbnailWeight: 28, thumbnailCap: 44 },
      { key: "absolutistEmotionalWording", label: "absolutist/emotional wording", weight: 12, cap: 24, thumbnailWeight: 18, thumbnailCap: 34 },
      { key: "doomscrollTriggerLanguage", label: "doomscroll trigger language", weight: 16, cap: 30, thumbnailWeight: 26, thumbnailCap: 42 },
      { key: "outrageRageBait", label: "outrage/rage-bait terms", weight: 16, cap: 30, thumbnailWeight: 26, thumbnailCap: 42 },
      { key: "clickbaitUrgency", label: "clickbait/urgency terms", weight: 12, cap: 24, thumbnailWeight: 22, thumbnailCap: 36 },
      { key: "emotional", label: "emotional wording", weight: 8, cap: 18, thumbnailWeight: 14, thumbnailCap: 28 },
      { key: "conflict", label: "conflict language", weight: 8, cap: 18, thumbnailWeight: 12, thumbnailCap: 24 }
    ];
    let score = 0;
    const signals = [];
    let thumbnailSignalCount = 0;

    categories.forEach((category) => {
      const matches = findMatches(context.searchText, HEURISTIC_SIGNAL_DICTIONARIES[category.key]);
      const thumbnailMatches = findMatches(context.thumbnailText, HEURISTIC_SIGNAL_DICTIONARIES[category.key]);
      if (!matches.length) {
        if (!thumbnailMatches.length) {
          return;
        }
      }

      if (matches.length) {
        score += Math.min(category.cap, matches.length * category.weight);
        signals.push(`${category.label}: ${formatMatches(matches)}`);
      }

      if (thumbnailMatches.length) {
        thumbnailSignalCount += thumbnailMatches.length;
        score += Math.min(category.thumbnailCap, thumbnailMatches.length * category.thumbnailWeight);
        signals.push(`thumbnail ${category.label}: ${formatMatches(thumbnailMatches)}`);
      }
    });

    const highImpactThumbnail = findMatches(context.thumbnailText, HEURISTIC_SIGNAL_DICTIONARIES.thumbnailHighImpact);
    if (highImpactThumbnail.length) {
      thumbnailSignalCount += highImpactThumbnail.length;
      score += Math.min(54, highImpactThumbnail.length * 28);
      signals.push(`thumbnail high-impact text: ${formatMatches(highImpactThumbnail)}`);
    }

    if (hasAllCapsSignal(context.title)) {
      score += 8;
      signals.push("all-caps emphasis");
    }

    if (hasThumbnailEmphasisSignal(context.thumbnailText)) {
      thumbnailSignalCount += 1;
      score += 18;
      signals.push("thumbnail all-caps/emphasis signal");
    }

    if (/!!|\?\?/.test(context.title)) {
      score += 6;
      signals.push("exaggerated punctuation");
    }

    return {
      score: Math.min(100, score),
      signals,
      thumbnailSignalCount
    };
  }

  function addSignal(target, matches, label, pointsPerMatch, cap) {
    if (!matches.length) {
      return 0;
    }

    const points = Math.min(cap, matches.length * pointsPerMatch);
    target.push(`${label}: ${formatMatches(matches)}`);
    return points;
  }

  function addThumbnailSignal(target, matches, label, pointsPerMatch, cap) {
    if (!matches.length) {
      return 0;
    }

    const points = Math.min(cap, matches.length * pointsPerMatch);
    target.push(`thumbnail ${label}: ${formatMatches(matches)}`);
    return points;
  }

  function addDurationSignal(context, positives, negatives) {
    if (context.durationSeconds >= 1200) {
      positives.push("long-form duration: 20+ minutes");
      return 14;
    }

    if (context.durationSeconds >= 600) {
      positives.push("long-form duration: 10+ minutes");
      return 10;
    }

    if (context.durationSeconds >= 300) {
      positives.push("medium-form duration: 5+ minutes");
      return 4;
    }

    if (context.durationSeconds && context.durationSeconds <= 90) {
      negatives.push("short duration: under 90 seconds");
      return -18;
    }

    return 0;
  }

  function addLowVolatilitySignal(volatility, positives, negatives) {
    if (volatility.score === 0) {
      positives.push("low emotional language");
      return 8;
    }

    negatives.push(`emotional volatility estimate: ${volatility.score}/100`);
    return 0;
  }

  function addManipulationPenalties(context, negatives) {
    let penalty = 0;
    penalty += addEmotionalPenalties(context, negatives);
    penalty += addSignal(negatives, findMatches(context.searchText, HEURISTIC_SIGNAL_DICTIONARIES.clickbaitUrgency), "clickbait/urgency wording", 7, 18);
    penalty += addSignal(negatives, findMatches(context.searchText, HEURISTIC_SIGNAL_DICTIONARIES.outrageRageBait), "rage/outrage wording", 8, 24);

    if (hasAllCapsSignal(context.title)) {
      penalty += 6;
      negatives.push("all-caps emphasis");
    }

    if (/!!|\?\?/.test(context.title)) {
      penalty += 4;
      negatives.push("exaggerated punctuation");
    }

    return penalty;
  }

  function addEmotionalPenalties(context, negatives) {
    return addSignal(negatives, findMatches(context.searchText, HEURISTIC_SIGNAL_DICTIONARIES.emotional), "high emotional language", 6, 18);
  }

  function hasEmotionalVolatility(context) {
    return calculateEmotionalVolatility(context).score > 0;
  }

  function buildResult(rawScore, positiveSignals, negativeSignals, buddyContext, metrics = {}) {
    const score = clampScore(rawScore);
    const classification = classifyScore(score);
    const confidence = confidenceFor(positiveSignals, negativeSignals);
    const buddyExplanation = buddyExplanationFor(classification, buddyContext);
    const normalizedMetrics = {
      continuityBonus: Number(metrics.continuityBonus) || 0,
      durationBonus: Number(metrics.durationBonus) || 0,
      emotionalVolatilityScore: Number(metrics.emotionalVolatilityScore) || 0,
      strongestNegativeContributor: negativeSignals[0] || "no strong negative signals",
      strongestPositiveContributor: positiveSignals[0] || "no strong positive signals",
      thumbnailVolatilitySignalCount: Number(metrics.thumbnailVolatilitySignalCount) || 0,
      volatilitySignals: metrics.volatilitySignals || []
    };

    return {
      buddyExplanation,
      classification,
      confidence,
      metrics: normalizedMetrics,
      negativeSignals,
      positiveSignals,
      score
    };
  }

  function confidenceFor(positiveSignals, negativeSignals) {
    const signalCount = positiveSignals.length + negativeSignals.length;
    if (signalCount >= 5) {
      return "high";
    }

    if (signalCount >= 3) {
      return "medium";
    }

    return "low";
  }

  function buddyExplanationFor(classification, context) {
    if (classification === "aligned") {
      return `Looks aligned with this mode. ${context}`;
    }

    if (classification === "neutral") {
      return `Some signals fit and some do not. ${context}`;
    }

    return `This may be drifting from your current intent. Nothing is blocked; just a gentle flag. ${context}`;
  }

  function classifyScore(score) {
    if (score >= 70) {
      return "aligned";
    }

    if (score >= 45) {
      return "neutral";
    }

    return "misaligned";
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

  function hasThumbnailEmphasisSignal(text) {
    const value = String(text || "");
    const words = value.match(/\b[A-Z]{4,}\b/g) || [];
    return words.length >= 1 || /!!|\?\?/.test(value);
  }

  function clampScore(score) {
    return Math.max(5, Math.min(95, Math.round(score)));
  }

  function colorForScore(score) {
    const classification = classifyScore(score);

    if (classification === "aligned") {
      return {
        alignment: "aligned",
        border: "#22c55e",
        glow: "rgba(34, 197, 94, 0.18)"
      };
    }

    if (classification === "neutral") {
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

  function renderBadge(card, result, modeLabel) {
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
    text.textContent = `${modeLabel} ${result.score} - ${result.classification}`;
    details.textContent = summarizeSignals(result);
    badge.title = tooltipFor(modeLabel, result);
  }

  function summarizeSignals(result) {
    const positive = result.positiveSignals[0] ? `+ ${result.positiveSignals[0]}` : "";
    const negative = result.negativeSignals[0] ? `- ${result.negativeSignals[0]}` : "";
    return [positive, negative].filter(Boolean).join(" | ") || result.buddyExplanation;
  }

  function tooltipFor(modeLabel, result) {
    const positive = result.positiveSignals.length
      ? result.positiveSignals.map((signal) => `+ ${signal}`).join("\n")
      : "+ no strong positive signals";
    const negative = result.negativeSignals.length
      ? result.negativeSignals.map((signal) => `- ${signal}`).join("\n")
      : "- no strong negative signals";
    const volatilitySignals = result.metrics.volatilitySignals.length
      ? result.metrics.volatilitySignals.map((signal) => `- ${signal}`).join("\n")
      : "- no outrage/escalation signals detected";

    return [
      `${modeLabel} ${result.score} - ${result.classification}`,
      `Final alignment score: ${result.score}`,
      `Confidence: ${result.confidence}`,
      `EMOTIONAL_VOLATILITY_SCORE: ${result.metrics.emotionalVolatilityScore}/100`,
      `Long-form bonus: +${result.metrics.durationBonus}`,
      `Continuity bonus: +${result.metrics.continuityBonus}`,
      `Strongest positive contributor: ${result.metrics.strongestPositiveContributor}`,
      `Strongest negative contributor: ${result.metrics.strongestNegativeContributor}`,
      "Title signals:",
      formatSourceSignals(result.metrics.sourceSignals.title, "no title dictionary signals"),
      "Thumbnail signals:",
      result.metrics.thumbnailTextAvailable
        ? formatSourceSignals(result.metrics.sourceSignals.thumbnail, "no thumbnail dictionary signals")
        : "Thumbnail text unavailable; score based on title/metadata only.",
      "Metadata/duration signals:",
      formatSourceSignals(result.metrics.sourceSignals.metadata, "no metadata dictionary signals"),
      "Outrage/escalation signals detected:",
      volatilitySignals,
      "Top positive signals:",
      positive,
      "Top negative signals:",
      negative,
      result.buddyExplanation
    ].join("\n");
  }

  function formatSourceSignals(signals, fallback) {
    return signals && signals.length ? signals.map((signal) => `- ${signal}`).join("\n") : fallback;
  }

  function recordCardTelemetry(context, result, alignment, isVisible) {
    if (!sessionState || activeMode === "bareMetal" || seenCardKeys.has(context.key)) {
      return;
    }

    seenCardKeys.add(context.key);
    const modeStats = sessionState.byMode[activeMode] || normalizeModeStats();
    sessionState.byMode[activeMode] = modeStats;
    sessionState.cardsScanned += 1;
    modeStats.cardsScanned += 1;
    sessionState.alignmentCounts[alignment] += 1;
    modeStats.alignmentCounts[alignment] += 1;
    sessionState.emotionalVolatilityScoreTotal += result.metrics.emotionalVolatilityScore;
    modeStats.emotionalVolatilityScoreTotal += result.metrics.emotionalVolatilityScore;

    if (result.metrics.emotionalVolatilityScore >= 60) {
      sessionState.highEmotionalVolatilityItems += 1;
      modeStats.highEmotionalVolatilityItems += 1;
    }

    if (context.isShort) {
      sessionState.shortsDetected += 1;
      modeStats.shortsDetected += 1;
    }

    if (alignment === "misaligned") {
      sessionState.misalignedItemsScanned += 1;
      modeStats.misalignedItemsScanned += 1;

      if (isVisible) {
        sessionState.misalignedItemsVisible += 1;
        modeStats.misalignedItemsVisible += 1;
      }
    }

    sessionState.lastUpdated = Date.now();
    persistTelemetrySoon();
  }

  function recordModeChange(nextMode) {
    if (!sessionState) {
      sessionState = createSession(nextMode, Date.now());
    }

    sessionState.modeChanges += 1;
    sessionState.activeMode = nextMode;
    sessionState.lastUpdated = Date.now();
    persistTelemetrySoon();
  }

  function recordNavigationEvent() {
    if (!sessionState || activeMode === "bareMetal") {
      return;
    }

    const now = Date.now();
    recentNavigationTimes = recentNavigationTimes.filter((time) => now - time < 120000);
    recentNavigationTimes.push(now);

    if (recentNavigationTimes.length >= 3) {
      sessionState.rapidSwitchEstimate += 1;
      recentNavigationTimes = [];
      sessionState.lastUpdated = now;
      persistTelemetrySoon();
    }
  }

  function persistTelemetrySoon() {
    window.clearTimeout(telemetryFlushTimer);
    telemetryFlushTimer = window.setTimeout(() => {
      if (sessionState) {
        setLocal({ [SESSION_STORAGE_KEY]: sessionState });
      }
    }, 250);
  }

  function evaluateDrift() {
    if (!sessionState || activeMode === "bareMetal") {
      hideDriftPrompt();
      return;
    }

    const now = Date.now();
    if (sessionState.driftSnoozedUntil && now < sessionState.driftSnoozedUntil) {
      hideDriftPrompt();
      return;
    }

    const modeStats = sessionState.byMode[activeMode] || normalizeModeStats();
    const total = modeStats.cardsScanned;
    if (total < 6) {
      return;
    }

    const misaligned = modeStats.alignmentCounts.misaligned;
    const misalignedRatio = misaligned / Math.max(total, 1);
    const highVolatilityRatio = modeStats.highEmotionalVolatilityItems / Math.max(total, 1);
    const shouldPrompt =
      (misaligned >= 3 && misalignedRatio >= 0.35) ||
      (activeMode === "chill" && modeStats.highEmotionalVolatilityItems >= 2 && highVolatilityRatio >= 0.25) ||
      (activeMode === "study" && modeStats.shortsDetected >= 3) ||
      (activeMode === "project" && modeStats.shortsDetected >= 3) ||
      sessionState.rapidSwitchEstimate >= 2;

    if (!shouldPrompt) {
      return;
    }

    showDriftPrompt(driftReason(modeStats, misalignedRatio, highVolatilityRatio));
  }

  function driftReason(modeStats, misalignedRatio, highVolatilityRatio) {
    if (activeMode === "chill" && modeStats.highEmotionalVolatilityItems >= 2 && highVolatilityRatio >= 0.25) {
      return "Repeated high-volatility signals are showing up during Chill Mode.";
    }

    if (activeMode === "study" && modeStats.shortsDetected >= 3) {
      return "A few Shorts showed up during a focus-oriented mode.";
    }

    if (activeMode === "project" && modeStats.shortsDetected >= 3) {
      return "Short-form novelty is showing up during Project Mode.";
    }

    if (sessionState.rapidSwitchEstimate >= 2) {
      return "You seem to be switching around quickly.";
    }

    return `${Math.round(misalignedRatio * 100)}% of recent scanned cards look misaligned.`;
  }

  function showDriftPrompt(reason) {
    if (document.querySelector(".persona-labs-drift-prompt")) {
      return;
    }

    const modeLabel = MODES[activeMode].label;
    const prompt = document.createElement("section");
    prompt.className = "persona-labs-drift-prompt";
    prompt.setAttribute("role", "dialog");
    prompt.setAttribute("aria-live", "polite");
    prompt.innerHTML = [
      '<button class="persona-labs-drift-close" type="button" aria-label="Dismiss">x</button>',
      '<p class="persona-labs-drift-kicker">Persona Labs</p>',
      `<p class="persona-labs-drift-message">Looks like your activity may be drifting away from ${modeLabel} Mode.</p>`,
      `<p class="persona-labs-drift-reason">${escapeHtml(reason)}</p>`,
      '<div class="persona-labs-drift-actions">',
      '<button type="button" data-persona-action="continue">Continue current mode</button>',
      '<button type="button" data-persona-action="chill">Switch to Chill</button>',
      '<button type="button" data-persona-action="research">Switch to Research</button>',
      '<button type="button" data-persona-action="bareMetal">Enter Bare Metal</button>',
      '<button type="button" data-persona-action="snooze">Snooze 30 min</button>',
      "</div>"
    ].join("");

    prompt.addEventListener("click", handlePromptClick);
    document.body.append(prompt);
    sessionState.driftPromptCount += 1;
    sessionState.lastUpdated = Date.now();
    persistTelemetrySoon();
  }

  function handlePromptClick(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.classList.contains("persona-labs-drift-close")) {
      snoozeDrift(CONTINUE_SNOOZE_MS);
      return;
    }

    const action = target.dataset.personaAction;
    if (!action) {
      return;
    }

    if (action === "continue") {
      snoozeDrift(CONTINUE_SNOOZE_MS);
      return;
    }

    if (action === "snooze") {
      snoozeDrift(DRIFT_SNOOZE_MS);
      return;
    }

    if (Object.prototype.hasOwnProperty.call(MODES, action)) {
      setLocal({ [MODE_STORAGE_KEY]: action });
    }

    hideDriftPrompt();
  }

  function snoozeDrift(durationMs) {
    if (!sessionState) {
      return;
    }

    sessionState.driftSnoozedUntil = Date.now() + durationMs;
    sessionState.lastUpdated = Date.now();
    persistTelemetrySoon();
    hideDriftPrompt();
  }

  function hideDriftPrompt() {
    const prompt = document.querySelector(".persona-labs-drift-prompt");
    if (prompt) {
      prompt.remove();
    }
  }

  function isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      };
      return entities[char];
    });
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
    const isBareMetal = activeMode === "bareMetal";
    document.documentElement.classList.toggle("persona-labs-bare-metal", isBareMetal);
    if (isBareMetal) {
      hideDriftPrompt();
    }
  }
})();

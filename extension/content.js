(function personaLabsYouTubeOverlay() {
  const MODE_STORAGE_KEY = "personaLabsMode";
  const SESSION_STORAGE_KEY = "personaLabsSessionTelemetry";
  const SCHEDULE_STORAGE_KEY = "personaLabsScheduleConfig";
  const DEBUG_STORAGE_KEY = "personaLabsDebugMode";
  const PERSONA_PREFS_STORAGE_KEY = "personaLabsPersonaPreferences";
  const DEFAULT_MODE = "studyGeneral";
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
    studyCyber: {
      label: "Cyber",
      fullLabel: "Study - Cybersecurity",
      intent: "cybersecurity study"
    },
    studyAi: {
      label: "AI/ML",
      fullLabel: "Study - AI/ML",
      intent: "AI and machine learning study"
    },
    studyCloud: {
      label: "Cloud",
      fullLabel: "Study - Cloud/DevOps",
      intent: "cloud and DevOps study"
    },
    studyGeneral: {
      label: "General",
      fullLabel: "Study - General",
      intent: "general focused learning"
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
    custom: {
      label: "Custom",
      intent: "user-defined local persona"
    },
    bareMetal: {
      label: "Bare Metal",
      intent: "unmediated browsing"
    }
  };

  const PERSONA_DIMENSION_WEIGHTS = {
    study: {
      educationalDepth: 0.35,
      continuityAlignment: 0.19,
      evidenceQuality: 0.15,
      exploratoryValue: 0.05,
      lowCognitiveLoad: 0.1,
      lowEmotionalVolatility: 0.08,
      lowDisturbingSubjectMatter: 0.05,
      lowTribalDomination: 0.03,
      calmAmbient: 0
    },
    chill: {
      educationalDepth: 0,
      continuityAlignment: 0.08,
      evidenceQuality: 0.01,
      exploratoryValue: 0.01,
      lowCognitiveLoad: 0.17,
      lowEmotionalVolatility: 0.15,
      lowDisturbingSubjectMatter: 0.21,
      lowTribalDomination: 0.2,
      calmAmbient: 0.17
    },
    research: {
      educationalDepth: 0.1,
      continuityAlignment: 0.13,
      evidenceQuality: 0.35,
      exploratoryValue: 0.25,
      lowCognitiveLoad: 0.05,
      lowEmotionalVolatility: 0.08,
      lowDisturbingSubjectMatter: 0.02,
      lowTribalDomination: 0.02,
      calmAmbient: 0
    },
    project: {
      educationalDepth: 0.2,
      continuityAlignment: 0.25,
      evidenceQuality: 0.15,
      exploratoryValue: 0.05,
      lowCognitiveLoad: 0.2,
      lowEmotionalVolatility: 0.08,
      lowDisturbingSubjectMatter: 0.04,
      lowTribalDomination: 0.03,
      calmAmbient: 0
    },
    custom: {
      educationalDepth: 0.2,
      continuityAlignment: 0.18,
      evidenceQuality: 0.2,
      exploratoryValue: 0.15,
      lowCognitiveLoad: 0.15,
      lowEmotionalVolatility: 0.07,
      lowDisturbingSubjectMatter: 0.03,
      lowTribalDomination: 0.02,
      calmAmbient: 0
    }
  };

  const DEFAULT_SCHEDULE_CONFIG = {
    version: 1,
    timezone: "local",
    windows: [
      { name: "work hours", suggestedModes: ["project", "research"], days: "weekdays", start: "09:00", end: "17:00" },
      { name: "study/project time", suggestedModes: ["studyCyber", "studyAi", "studyCloud", "studyGeneral", "project"], days: "configurable", start: "19:00", end: "21:00" },
      { name: "family time", suggestedModes: ["bareMetal"], days: "configurable", start: "17:30", end: "19:00" },
      { name: "chill time", suggestedModes: ["chill"], days: "configurable", start: "21:00", end: "22:30" },
      { name: "recovery time", suggestedModes: ["chill", "bareMetal"], days: "configurable", start: "22:30", end: "23:30" },
      { name: "intentional news window", suggestedModes: ["research"], days: "configurable", start: "12:00", end: "12:30" }
    ]
  };

  const DEFAULT_PERSONA_PREFERENCES = {
    version: 1,
    onboardingComplete: false,
    goals: [],
    preferredLearningDomains: [],
    stressDriftTriggers: [],
    desiredExplorationLevel: "balanced",
    volatilityTolerance: "medium",
    preferredCognitiveMode: "research"
  };

  const EMOTIONAL_TONE_SIGNALS = Object.freeze([
    "insane",
    "destroyed",
    "humiliated",
    "meltdown",
    "panic",
    "shocking",
    "exposed",
    "cringe",
    "evil",
    "lies",
    "outrage",
    "furious",
    "obliterated",
    "disaster",
    "owned"
  ]);

  const VIOLENCE_DISTURBING_SIGNALS = Object.freeze([
    "attacked",
    "attack",
    "murder",
    "murdered",
    "war footage",
    "horrifying footage",
    "horrifying",
    "bombing",
    "slaughter",
    "execution",
    "dead",
    "killed",
    "injured",
    "graphic",
    "blood",
    "hostage",
    "terror",
    "military strike",
    "airstrike",
    "massacre",
    "assault",
    "crisis",
    "raid",
    "gore",
    "burning alive",
    "explosion",
    "brutality",
    "violent",
    "stabbed",
    "chaos",
    "beaten",
    "war crime"
  ]);

  const CALM_AMBIENT_SIGNALS = Object.freeze([
    "relaxing",
    "nature",
    "gentle",
    "soft music",
    "peaceful",
    "ambience",
    "ambient",
    "sleep",
    "calming",
    "calm",
    "meditation",
    "forest",
    "rain",
    "birds",
    "aquarium",
    "bunny",
    "cat tv",
    "dog tv",
    "piano",
    "ocean",
    "waterfall",
    "cozy",
    "lofi",
    "healing",
    "mindful"
  ]);

  const COGNITIVE_LOAD_SIGNALS = Object.freeze([
    "debate",
    "analysis",
    "politics",
    "breaking news",
    "investigation",
    "controversy",
    "drama",
    "reaction",
    "argument",
    "live coverage",
    "multi-topic",
    "rapid updates",
    "complex",
    "technical",
    "economic",
    "policy",
    "deep dive",
    "long form analysis"
  ]);

  const TRIBAL_DOMINATION_FRAMING_SIGNALS = Object.freeze([
    "owned",
    "destroyed",
    "humiliated",
    "humiliates",
    "revenge",
    "meltdown",
    "obliterated",
    "crushed",
    "wrecked",
    "slams",
    "annihilates",
    "exposed",
    "collapse",
    "disastrous",
    "panic",
    "losing minds",
    "losing their minds",
    "unhinged",
    "final note",
    "bombshell",
    "cringe",
    "fails badly",
    "disaster",
    "destroys",
    "embarrassed",
    "caught lying",
    "takedown",
    "epic fail",
    "rage",
    "backfires badly"
  ]);

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
   * calm/low-conflict, calm ambience, clickbait/urgency, outrage/rage-bait,
   * tribal/domination framing, outrage escalation, humiliation framing,
   * tribal conflict language, panic/fear framing, absolutist/emotional
   * wording, disturbing subject matter, novelty intensity, speculation/low-evidence, and
   * short-form/novelty-risk terms.
   * Scores are local-first deterministic alignment estimates. Explanations
   * must show observed signals and uncertainty; Bare Metal and user override
   * must remain available.
   *
   * Multi-axis observability note:
   * Evidence, emotional volatility, novelty pressure, cognitive load,
   * exploratory diversity, and intentional alignment are deliberately
   * separated. Emotional intensity is not treated as low evidence by itself,
   * and high-evidence conflict/current-events content can remain appropriate
   * for Research mode. These axes are heuristic media-environment indicators,
   * not truth verification, ideology classification, or clinical profiling.
   *
   * Layer separation:
   * Topic Layer signals identify subject matter; Framing Layer signals
   * identify presentation style; Cognitive Environment Layer signals estimate
   * load/fragmentation; Evidence Layer signals estimate grounding; and
   * Intentional Alignment Layer signals compare the card to the selected mode.
   * Topic labels must not be treated as framing, evidence, or alignment by
   * themselves.
   *
   * Critical separation: low emotional tone does not imply low emotional
   * impact. Restrained descriptions of violence, crisis, or disturbing events
   * are scored through the Subject Matter layer, not treated as calm content.
   */
  const HEURISTIC_SIGNAL_DICTIONARIES = {
    educationalStudyPositive: [
      "academic",
      "basics",
      "beginner",
      "class",
      "course",
      "crash course",
      "demo",
      "documentation",
      "education",
      "example",
      "explain",
      "explained",
      "fundamentals",
      "guide",
      "intro",
      "introduction",
      "lab",
      "learn",
      "lecture",
      "lesson",
      "masterclass",
      "overview",
      "seminar",
      "study",
      "training",
      "university",
      "workshop"
    ],
    studyGeneralTopic: [
      "course",
      "demo",
      "documentation",
      "example",
      "explain",
      "explained",
      "fundamentals",
      "guide",
      "introduction",
      "lab",
      "lecture",
      "lesson",
      "overview",
      "tutorial",
      "walkthrough"
    ],
    studyCybersecurityTopic: [
      "authentication",
      "authorization",
      "cybersecurity",
      "cve",
      "detection",
      "edr",
      "entra",
      "exploit",
      "firewall",
      "iam",
      "identity",
      "incident response",
      "logging",
      "malware",
      "mitre",
      "network security",
      "nist",
      "oauth",
      "phishing",
      "security",
      "siem",
      "soc",
      "telemetry",
      "threat",
      "vulnerability",
      "xdr",
      "zero trust"
    ],
    studyAiMlTopic: [
      "agents",
      "ai",
      "alignment",
      "claude",
      "embeddings",
      "evaluation",
      "gemini",
      "hallucination",
      "inference",
      "langchain",
      "llm",
      "machine learning",
      "mcp",
      "model",
      "openai",
      "prompt engineering",
      "rag",
      "training",
      "transformer",
      "vector database"
    ],
    studyCloudDevOpsTopic: [
      "aws",
      "azure",
      "ci/cd",
      "cloud",
      "containers",
      "devops",
      "docker",
      "gcp",
      "homelab",
      "infrastructure",
      "kubernetes",
      "linux",
      "load balancer",
      "logs",
      "monitoring",
      "networking",
      "observability",
      "server",
      "terraform",
      "yaml"
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
      "analyst",
      "case study",
      "confirmed",
      "corroborated",
      "data",
      "documentary",
      "evidence",
      "expert",
      "interview",
      "paper",
      "report",
      "reported",
      "reporting",
      "review",
      "source",
      "sources",
      "specifics",
      "study",
      "timeline",
      "verified"
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
    EMOTIONAL_TONE_SIGNALS,
    VIOLENCE_DISTURBING_SIGNALS,
    CALM_AMBIENT_SIGNALS,
    COGNITIVE_LOAD_SIGNALS,
    TRIBAL_DOMINATION_FRAMING_SIGNALS,
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
    noveltyIntensityLanguage: [
      "breaking",
      "can't stop watching",
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
  let debugMode = false;
  let latestDebugPayload = null;

  if (!(typeof globalThis !== "undefined" && globalThis.__PERSONA_LABS_DISABLE_AUTO_INIT__)) {
    init();
  }

  async function init() {
    const items = await getLocal({
      [DEBUG_STORAGE_KEY]: false,
      [MODE_STORAGE_KEY]: DEFAULT_MODE,
      [PERSONA_PREFS_STORAGE_KEY]: null,
      [SESSION_STORAGE_KEY]: null,
      [SCHEDULE_STORAGE_KEY]: null
    });

    activeMode = normalizeMode(items[MODE_STORAGE_KEY]);
    debugMode = Boolean(items[DEBUG_STORAGE_KEY]);
    sessionState = normalizeSession(items[SESSION_STORAGE_KEY], activeMode);
    await ensurePersonaPreferences(items[PERSONA_PREFS_STORAGE_KEY]);
    await ensureScheduleConfig(items[SCHEDULE_STORAGE_KEY]);
    persistTelemetrySoon();

    applyModeClass();
    scanCards();
    startObservers();

    if (chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== "local") {
          return;
        }

        if (changes[DEBUG_STORAGE_KEY]) {
          debugMode = Boolean(changes[DEBUG_STORAGE_KEY].newValue);
          updateDebugPanel();
        }

        if (changes[MODE_STORAGE_KEY]) {
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
        }
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
    if (mode === "study") {
      return "studyGeneral";
    }

    return Object.prototype.hasOwnProperty.call(MODES, mode) ? mode : DEFAULT_MODE;
  }

  function isStudyMode(mode) {
    return mode === "studyCyber" || mode === "studyAi" || mode === "studyCloud" || mode === "studyGeneral";
  }

  function personaProfileForMode(mode) {
    if (isStudyMode(mode)) {
      return "study";
    }

    if (mode === "custom") {
      return "custom";
    }

    return Object.prototype.hasOwnProperty.call(PERSONA_DIMENSION_WEIGHTS, mode) ? mode : "custom";
  }

  async function ensureScheduleConfig(config) {
    if (config && config.version === DEFAULT_SCHEDULE_CONFIG.version) {
      return;
    }

    setLocal({ [SCHEDULE_STORAGE_KEY]: DEFAULT_SCHEDULE_CONFIG });
  }

  async function ensurePersonaPreferences(preferences) {
    if (preferences && preferences.version === DEFAULT_PERSONA_PREFERENCES.version) {
      return;
    }

    setLocal({ [PERSONA_PREFS_STORAGE_KEY]: DEFAULT_PERSONA_PREFERENCES });
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
      mixed: 0,
      neutral: 0,
      misaligned: 0
    };
  }

  function normalizeAlignmentCounts(counts) {
    return {
      aligned: Number(counts && counts.aligned) || 0,
      mixed: Number(counts && counts.mixed) || 0,
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
    const color = colorForResult(result);

    card.dataset.personaLabsScore = String(result.score);
    card.dataset.personaLabsAlignment = color.alignment;
    card.style.setProperty("--persona-labs-border-color", color.border);
    card.style.setProperty("--persona-labs-border-glow", color.glow);
    renderBadge(card, result, MODES[activeMode].label, color.alignment);
    recordCardTelemetry(context, result, color.alignment, isElementVisible(card));
    latestDebugPayload = result.debug;
    updateDebugPanel();
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
    const channelMetadataText = getChannelMetadataText(card);
    const metadataText = getMetadataText(card, ariaTitle, durationText);
    const transcriptText = "";
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
      channelMetadataText,
      durationText,
      metadataText,
      searchText,
      thumbnailText,
      title,
      titleText,
      transcriptText
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

  function getChannelMetadataText(card) {
    const selectors = [
      "#byline",
      "#channel-name",
      "ytd-channel-name",
      "yt-formatted-string#text.ytd-channel-name"
    ];
    const values = [];

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

  function formatDuration(seconds) {
    if (!seconds) {
      return "unknown";
    }

    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `long-form (${minutes}m)`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes ? `long-form (${hours}h ${remainingMinutes}m)` : `long-form (${hours}h)`;
  }

  function scoreCard(context, mode) {
    let result;
    const signalLayers = analyzeSignalLayers(context);

    if (isStudyMode(mode)) {
      result = scoreStudyMode(context, mode, signalLayers);
    } else if (mode === "research") {
      result = scoreResearchMode(context, signalLayers);
    } else if (mode === "chill") {
      result = scoreChillMode(context, signalLayers);
    } else if (mode === "project") {
      result = scoreProjectMode(context, signalLayers);
    } else if (mode === "custom") {
      result = scoreCustomMode(context, signalLayers);
    } else {
      result = buildResult(50, [], [], "No active mode scoring.");
    }

    result.metrics.activeMode = mode;
    result.metrics.personaProfile = personaProfileForMode(mode);
    result.metrics.personaWeights = PERSONA_DIMENSION_WEIGHTS[result.metrics.personaProfile];
    result.dimensions = calculateDimensions(result.score, result.positiveSignals, result.negativeSignals, result.metrics);
    result.classification = classifyDimensions(result.dimensions);
    result.calmExplanation = calmExplanationFor(result.classification, result.explanationContext);
    result.metrics.sourceSignals = buildSourceSignalSummary(context);
    result.metrics.signalProvenance = buildSignalProvenance(context);
    result.metrics.thumbnailTextAvailable = Boolean(context.thumbnailText);
    result.debug = buildDebugPayload(context, mode, result);
    return result;
  }

  function scoreStudyMode(context, mode, signalLayers) {
    let score = 30;
    const positives = [];
    const negatives = [];
    const volatility = calculateEmotionalVolatility(context);
    const education = findMatches(context.searchText, HEURISTIC_SIGNAL_DICTIONARIES.educationalStudyPositive);
    const tutorial = findMatches(context.searchText, HEURISTIC_SIGNAL_DICTIONARIES.tutorial);
    const technical = findMatches(context.searchText, HEURISTIC_SIGNAL_DICTIONARIES.technicalCyberAi);
    const entertainment = findMatches(context.searchText, HEURISTIC_SIGNAL_DICTIONARIES.entertainment);
    const novelty = findMatches(context.searchText, HEURISTIC_SIGNAL_DICTIONARIES.shortFormNoveltyRisk);
    const studyProfile = getStudyProfile(mode);
    const topicMatches = findMatches(context.searchText, HEURISTIC_SIGNAL_DICTIONARIES[studyProfile.dictionaryKey]);
    const thumbnailTopicMatches = findMatches(context.thumbnailText, HEURISTIC_SIGNAL_DICTIONARIES[studyProfile.dictionaryKey]);
    const educationalFormatMatches = uniqueMatches(education.concat(tutorial));
    const thumbnailFormatMatches = uniqueMatches(
      findMatches(context.thumbnailText, HEURISTIC_SIGNAL_DICTIONARIES.educationalStudyPositive).concat(
        findMatches(context.thumbnailText, HEURISTIC_SIGNAL_DICTIONARIES.tutorial)
      )
    );
    let continuityBonus = 0;
    const durationBonus = addDurationSignal(context, positives, negatives);

    score += addSignal(positives, education, "educational format keywords", 6, 18);
    score += addSignal(positives, tutorial, "tutorial/walkthrough indicators", 8, 18);
    score += addSignal(positives, topicMatches, `${studyProfile.persona} topic keywords`, 8, 30);
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
      thumbnailTopicMatches,
      `${studyProfile.persona} topic text`,
      7,
      18
    );
    score += durationBonus;

    if (educationalFormatMatches.length && topicMatches.length && !context.isShort) {
      continuityBonus = 18;
      score += continuityBonus;
      positives.push(`selected study persona matches educational format and ${studyProfile.persona} topic`);
    } else if (educationalFormatMatches.length && !topicMatches.length) {
      score -= 14;
      negatives.push(`educational format but weak ${studyProfile.persona} topic match`);
    } else if (!educationalFormatMatches.length && topicMatches.length) {
      score -= 8;
      negatives.push(`${studyProfile.persona} topic appears without strong study format`);
    } else {
      score -= 18;
      negatives.push(`weak educational format and weak ${studyProfile.persona} topic match`);
    }

    if (thumbnailFormatMatches.length && thumbnailTopicMatches.length) {
      score += 8;
      positives.push(`thumbnail supports ${studyProfile.persona} study intent`);
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
      educationalFormatSignals: educationalFormatMatches,
      matchedTopicKeywords: uniqueMatches(topicMatches.concat(thumbnailTopicMatches)),
      selectedStudyPersona: studyProfile.fullLabel,
      signalLayers,
      thumbnailVolatilitySignalCount: volatility.thumbnailSignalCount,
      volatilitySignals: volatility.signals
    });
  }

  function getStudyProfile(mode) {
    const profiles = {
      studyCyber: {
        dictionaryKey: "studyCybersecurityTopic",
        fullLabel: "Study - Cybersecurity",
        persona: "Cybersecurity"
      },
      studyAi: {
        dictionaryKey: "studyAiMlTopic",
        fullLabel: "Study - AI/ML",
        persona: "AI/ML"
      },
      studyCloud: {
        dictionaryKey: "studyCloudDevOpsTopic",
        fullLabel: "Study - Cloud/DevOps",
        persona: "Cloud/DevOps"
      },
      studyGeneral: {
        dictionaryKey: "studyGeneralTopic",
        fullLabel: "Study - General",
        persona: "General"
      }
    };

    return profiles[mode] || profiles.studyGeneral;
  }

  function scoreResearchMode(context, signalLayers) {
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
      evidenceSignalCount: uniqueMatches(evidence.concat(viewpoints, currentEvents)).length,
      emotionalVolatilityScore: volatility.score,
      signalLayers,
      thumbnailVolatilitySignalCount: volatility.thumbnailSignalCount,
      volatilitySignals: volatility.signals
    });
  }

  function scoreChillMode(context, signalLayers) {
    let score = 55;
    const positives = [];
    const negatives = [];
    const volatility = calculateEmotionalVolatility(context);
    const chill = uniqueMatches(
      findMatches(context.searchText, HEURISTIC_SIGNAL_DICTIONARIES.calmLowConflict).concat(signalLayers.calmAmbient.matches)
    );
    const conflict = findMatches(context.searchText, HEURISTIC_SIGNAL_DICTIONARIES.conflict);
    const outrage = findMatches(context.searchText, HEURISTIC_SIGNAL_DICTIONARIES.outrageRageBait);
    const emotionalTonePenalty = Math.min(75, Math.round(signalLayers.emotionalTone.score * 0.78));
    const subjectMatterPenalty = Math.min(82, Math.round(signalLayers.subjectMatter.score * 0.88));
    const tribalDominationPenalty = Math.min(84, Math.round(signalLayers.tribalDomination.score * 0.92));
    const cognitiveLoadPenalty = Math.min(52, Math.round(signalLayers.cognitiveLoad.score * 0.5));
    const severeEmotionalTone = signalLayers.emotionalTone.score >= 60;
    const elevatedEmotionalTone = signalLayers.emotionalTone.score >= 35;
    const disturbingSubjectMatter = signalLayers.subjectMatter.score >= 25;
    const heavySubjectMatter = signalLayers.subjectMatter.score >= 55;
    const elevatedTribalDomination = signalLayers.tribalDomination.score >= 25;
    const severeTribalDomination = signalLayers.tribalDomination.score >= 55;
    const highCognitiveLoad = signalLayers.cognitiveLoad.score >= 55;
    let continuityBonus = 0;
    let durationBonus = 0;

    if (emotionalTonePenalty > 0) {
      score -= emotionalTonePenalty;
      negatives.push(`rage/escalation framing estimate: ${signalLayers.emotionalTone.score}/100`);
    }

    if (subjectMatterPenalty > 0) {
      score -= subjectMatterPenalty;
      negatives.push(`disturbing subject matter estimate: ${signalLayers.subjectMatter.score}/100`);
    }

    if (tribalDominationPenalty > 0) {
      score -= tribalDominationPenalty;
      negatives.push(`tribal/conflict framing detected: ${formatMatches(signalLayers.tribalDomination.matches)}`);
    }

    if (cognitiveLoadPenalty > 0) {
      score -= cognitiveLoadPenalty;
      negatives.push(`cognitive load / fragmentation estimate: ${signalLayers.cognitiveLoad.score}/100`);
    }

    score += addSignal(positives, chill, "calm ambient or light content", 9, 30);

    if (chill.length && !elevatedEmotionalTone && !disturbingSubjectMatter && !elevatedTribalDomination && !highCognitiveLoad) {
      continuityBonus = 12;
      score += continuityBonus;
      positives.push("Chill Mode topic continuity with low-friction ambience");
    } else if (chill.length && elevatedTribalDomination) {
      negatives.push("calming terms are outweighed by tribal/conflict domination framing");
    } else if (chill.length && elevatedEmotionalTone) {
      negatives.push("calming terms are outweighed by rage/escalation framing");
    } else if (chill.length && disturbingSubjectMatter) {
      negatives.push("calming terms are outweighed by disturbing subject matter");
    } else if (chill.length && highCognitiveLoad) {
      negatives.push("calming terms are moderated by higher cognitive load");
    }

    if (
      signalLayers.emotionalTone.score === 0 &&
      signalLayers.subjectMatter.score === 0 &&
      signalLayers.tribalDomination.score === 0 &&
      signalLayers.cognitiveLoad.score < 35 &&
      !conflict.length &&
      !outrage.length &&
      !hasEmotionalVolatility(context)
    ) {
      score += 8;
      positives.push("low domination framing, low rage framing, and low disturbing subject matter");
    } else if (signalLayers.emotionalTone.score === 0 && signalLayers.subjectMatter.score > 0) {
      negatives.push("low rage framing detected, but disturbing subject matter reduced Chill alignment");
    }

    if (
      context.durationSeconds >= 1200 &&
      !elevatedEmotionalTone &&
      !disturbingSubjectMatter &&
      !elevatedTribalDomination &&
      signalLayers.cognitiveLoad.score < 35
    ) {
      durationBonus = 8;
      score += durationBonus;
      positives.push("stable long-form duration with low-friction signals");
    } else if (context.durationSeconds >= 1200 && (elevatedEmotionalTone || disturbingSubjectMatter || elevatedTribalDomination || highCognitiveLoad)) {
      negatives.push("long-form duration does not erase tone, subject matter, or cognitive-load friction");
    }

    if (context.isShort) {
      score -= 12;
      negatives.push("short-form novelty increases Chill cognitive load");
    }

    score -= addSignal(negatives, conflict, "conflict-heavy framing", 12, 28);
    score -= addSignal(negatives, outrage, "outrage-heavy language", 15, 38);
    score -= addSignal(negatives, findMatches(context.searchText, HEURISTIC_SIGNAL_DICTIONARIES.currentEvents), "news/current events during chill", 5, 10);

    if (severeTribalDomination) {
      score = Math.min(score, 34);
      negatives.push("tribal/domination framing overrides duration and calm tone bonuses in Chill Mode");
    } else if (heavySubjectMatter) {
      score = Math.min(score, 34);
      negatives.push("disturbing subject matter overrides duration and calm tone bonuses in Chill Mode");
    } else if (severeEmotionalTone) {
      score = Math.min(score, 34);
      negatives.push("severe rage/escalation framing overrides duration and continuity bonuses");
    } else if (disturbingSubjectMatter || elevatedEmotionalTone || elevatedTribalDomination || highCognitiveLoad) {
      score = Math.min(score, 49);
      negatives.push("Chill Mode prioritizes low-disturbance, low-domination, low-fragmentation media");
    }

    return buildResult(score, positives, negatives, "Chill Mode is for recovery, low-conflict browsing, and light entertainment.", {
      continuityBonus,
      durationBonus,
      emotionalVolatilityScore: volatility.score,
      signalLayers,
      thumbnailVolatilitySignalCount: volatility.thumbnailSignalCount,
      volatilitySignals: volatility.signals
    });
  }

  function scoreProjectMode(context, signalLayers) {
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
      signalLayers,
      thumbnailVolatilitySignalCount: volatility.thumbnailSignalCount,
      volatilitySignals: volatility.signals
    });
  }

  function scoreCustomMode(context, signalLayers) {
    let score = 50;
    const positives = [];
    const negatives = [];
    const volatility = calculateEmotionalVolatility(context);
    const education = findMatches(context.searchText, HEURISTIC_SIGNAL_DICTIONARIES.educationalStudyPositive);
    const evidence = findMatches(context.searchText, HEURISTIC_SIGNAL_DICTIONARIES.evidenceGrounding);
    const calm = findMatches(context.searchText, HEURISTIC_SIGNAL_DICTIONARIES.calmLowConflict);
    let continuityBonus = 0;
    const durationBonus = addDurationSignal(context, positives, negatives);

    score += addSignal(positives, education, "educational formatting", 4, 12);
    score += addSignal(positives, evidence, "evidence-oriented language", 5, 15);
    score += addSignal(positives, calm, "low-conflict media signals", 4, 12);
    score += durationBonus;

    if (education.length || evidence.length || calm.length) {
      continuityBonus = 6;
      score += continuityBonus;
      positives.push("content contains signals relevant to custom persona calibration");
    }

    if (context.isShort) {
      score -= 10;
      negatives.push("short-form format increases cognitive load for many personas");
    }

    score -= addManipulationPenalties(context, negatives);

    return buildResult(score, positives, negatives, "Custom Mode uses locally stored persona preferences as future weighting inputs.", {
      continuityBonus,
      durationBonus,
      emotionalVolatilityScore: volatility.score,
      personaProfile: "custom",
      personaWeights: PERSONA_DIMENSION_WEIGHTS.custom,
      signalLayers,
      thumbnailVolatilitySignalCount: volatility.thumbnailSignalCount,
      volatilitySignals: volatility.signals
    });
  }

  function analyzeSignalLayers(context) {
    const primaryText = normalizeText([context.titleText, context.metadataText]);
    const thumbnailText = context.thumbnailText || "";
    const sourceTexts = {
      metadata: context.metadataText || "",
      thumbnail: thumbnailText,
      title: context.titleText || "",
      transcript: context.transcriptText || ""
    };
    const emotionalTone = buildSignalLayer({
      label: "rage/escalation framing",
      text: primaryText,
      thumbnailText,
      sourceTexts,
      dictionary: HEURISTIC_SIGNAL_DICTIONARIES.EMOTIONAL_TONE_SIGNALS,
      textWeight: 20,
      thumbnailWeight: 28,
      textCap: 60,
      thumbnailCap: 70
    });
    const subjectMatter = buildSignalLayer({
      label: "disturbing subject matter",
      text: primaryText,
      thumbnailText,
      sourceTexts,
      dictionary: HEURISTIC_SIGNAL_DICTIONARIES.VIOLENCE_DISTURBING_SIGNALS,
      textWeight: 26,
      thumbnailWeight: 30,
      textCap: 78,
      thumbnailCap: 86
    });
    const calmAmbient = buildSignalLayer({
      label: "calm ambient content",
      text: primaryText,
      thumbnailText,
      sourceTexts,
      dictionary: HEURISTIC_SIGNAL_DICTIONARIES.CALM_AMBIENT_SIGNALS,
      textWeight: 16,
      thumbnailWeight: 18,
      textCap: 75,
      thumbnailCap: 75
    });
    const cognitiveLoad = buildSignalLayer({
      label: "cognitive load / fragmentation",
      text: primaryText,
      thumbnailText,
      sourceTexts,
      dictionary: HEURISTIC_SIGNAL_DICTIONARIES.COGNITIVE_LOAD_SIGNALS,
      textWeight: 16,
      thumbnailWeight: 18,
      textCap: 68,
      thumbnailCap: 72
    });
    const tribalDomination = buildSignalLayer({
      label: "tribal/conflict framing detected",
      text: primaryText,
      thumbnailText,
      sourceTexts,
      dictionary: HEURISTIC_SIGNAL_DICTIONARIES.TRIBAL_DOMINATION_FRAMING_SIGNALS,
      textWeight: 24,
      thumbnailWeight: 34,
      textCap: 76,
      thumbnailCap: 88
    });

    if (context.isShort) {
      cognitiveLoad.score = clampDimension(cognitiveLoad.score + 24);
      cognitiveLoad.signals.push("short-form format");
      cognitiveLoad.matches = uniqueMatches(cognitiveLoad.matches.concat(["short-form format"]));
    }

    if (context.durationSeconds && context.durationSeconds <= 90) {
      cognitiveLoad.score = clampDimension(cognitiveLoad.score + 18);
      cognitiveLoad.signals.push("very short duration");
      cognitiveLoad.matches = uniqueMatches(cognitiveLoad.matches.concat(["very short duration"]));
    }

    if (hasAllCapsSignal(context.title) || hasThumbnailEmphasisSignal(context.thumbnailText)) {
      emotionalTone.score = clampDimension(emotionalTone.score + 10);
      emotionalTone.signals.push("visual/text emphasis cue");
    }

    return {
      calmAmbient,
      cognitiveLoad,
      emotionalTone,
      subjectMatter,
      tribalDomination
    };
  }

  function buildSignalLayer(config) {
    const textMatches = findMatches(config.text, config.dictionary);
    const thumbnailMatches = findMatches(config.thumbnailText, config.dictionary);
    const sourceMatches = buildLayerSourceMatches(config.sourceTexts, config.dictionary);
    const matches = uniqueMatches(
      textMatches.concat(thumbnailMatches, sourceMatches.title, sourceMatches.thumbnail, sourceMatches.transcript, sourceMatches.metadata)
    );
    const signals = [];
    let score = 0;

    const primaryMatches = uniqueMatches(
      (sourceMatches.title || []).concat(sourceMatches.metadata || [], sourceMatches.transcript || [])
    );
    const primaryCount = primaryMatches.length || textMatches.length;

    if (primaryCount) {
      score += Math.min(config.textCap, primaryCount * config.textWeight);
    }

    if (thumbnailMatches.length) {
      score += Math.min(config.thumbnailCap, thumbnailMatches.length * config.thumbnailWeight);
    }

    Object.keys(sourceMatches).forEach((source) => {
      if (sourceMatches[source].length) {
        signals.push(`${source} ${config.label}: ${formatMatches(sourceMatches[source])}`);
      }
    });

    return {
      matches,
      sourceMatches,
      score: clampDimension(score),
      signals,
      thumbnailMatches,
      textMatches
    };
  }

  function buildLayerSourceMatches(sourceTexts, dictionary) {
    const sources = sourceTexts || {};
    return {
      title: findMatches(sources.title, dictionary),
      thumbnail: findMatches(sources.thumbnail, dictionary),
      transcript: findMatches(sources.transcript, dictionary),
      metadata: findMatches(sources.metadata, dictionary)
    };
  }

  function buildSourceSignalSummary(context) {
    return {
      channel: summarizeTextSignals(context.channelMetadataText),
      duration: context.durationSeconds ? [`duration: ${formatDuration(context.durationSeconds)}`] : [],
      metadata: summarizeTextSignals(context.metadataText),
      thumbnail: summarizeTextSignals(context.thumbnailText),
      title: summarizeTextSignals(context.titleText),
      transcript: []
    };
  }

  function buildSignalProvenance(context) {
    return {
      "browsing continuity/session": ["session-level signals tracked separately"],
      "channel metadata": summarizeTextSignalDetails(context.channelMetadataText),
      duration: context.durationSeconds ? [{ category: "duration", terms: [formatDuration(context.durationSeconds)] }] : [],
      "thumbnail OCR": summarizeTextSignalDetails(context.thumbnailText),
      title: summarizeTextSignalDetails(context.titleText),
      transcript: []
    };
  }

  function buildDebugPayload(context, mode, result) {
    return {
      activeMode: mode,
      cardKey: context.key,
      dimensions: result.dimensions,
      finalClassification: result.classification,
      finalScore: result.score,
      matchedDictionaries: result.metrics.signalProvenance,
      signalLayers: result.metrics.signalLayers,
      personaWeightingPath: {
        profile: result.metrics.personaProfile,
        weights: result.metrics.personaWeights
      },
      rawExtractedSignals: {
        channelMetadata: context.channelMetadataText || "",
        duration: context.durationText || "",
        metadata: context.metadataText || "",
        thumbnailOCR: context.thumbnailText || "",
        title: context.titleText || "",
        transcript: "unavailable"
      },
      strongestContributors: {
        friction: result.metrics.strongestNegativeContributor,
        supporting: result.metrics.strongestPositiveContributor
      }
    };
  }

  function summarizeTextSignalDetails(text) {
    if (!text) {
      return [];
    }

    return getSignalCategories()
      .map((category) => {
        const matches = findMatches(text, HEURISTIC_SIGNAL_DICTIONARIES[category.key]);
        return matches.length
          ? {
              category: category.label,
              terms: matches
            }
          : null;
      })
      .filter(Boolean);
  }

  function summarizeTextSignals(text) {
    if (!text) {
      return [];
    }

    const categories = getSignalCategories();

    return categories
      .map((category) => {
        const matches = findMatches(text, HEURISTIC_SIGNAL_DICTIONARIES[category.key]);
        return matches.length ? `${category.label}: ${formatMatches(matches)}` : "";
      })
      .filter(Boolean)
      .slice(0, 6);
  }

  function getSignalCategories() {
    return [
      { key: "educationalStudyPositive", label: "educational/study-positive" },
      { key: "studyCybersecurityTopic", label: "cybersecurity topic" },
      { key: "studyAiMlTopic", label: "AI/ML topic" },
      { key: "studyCloudDevOpsTopic", label: "Cloud/DevOps topic" },
      { key: "studyGeneralTopic", label: "general study topic" },
      { key: "tutorial", label: "tutorial/walkthrough" },
      { key: "technicalCyberAi", label: "technical/cyber/AI" },
      { key: "evidenceGrounding", label: "evidence/grounding" },
      { key: "researchComplexity", label: "geopolitical/current-events discussion" },
      { key: "currentEvents", label: "current-events metadata" },
      { key: "calmLowConflict", label: "calm/low-conflict" },
      { key: "CALM_AMBIENT_SIGNALS", label: "calm ambient" },
      { key: "EMOTIONAL_TONE_SIGNALS", label: "emotional tone/rage framing" },
      { key: "VIOLENCE_DISTURBING_SIGNALS", label: "disturbing subject matter" },
      { key: "COGNITIVE_LOAD_SIGNALS", label: "cognitive load" },
      { key: "TRIBAL_DOMINATION_FRAMING_SIGNALS", label: "tribal/domination framing" },
      { key: "clickbaitUrgency", label: "clickbait/urgency" },
      { key: "outrageRageBait", label: "outrage/rage-bait" },
      { key: "outrageEscalation", label: "outrage escalation" },
      { key: "humiliationFraming", label: "humiliation framing" },
      { key: "tribalConflictLanguage", label: "tribal conflict" },
      { key: "panicFearFraming", label: "panic/fear" },
      { key: "absolutistEmotionalWording", label: "absolutist/emotional" },
      { key: "noveltyIntensityLanguage", label: "novelty intensity" },
      { key: "shortFormNoveltyRisk", label: "short-form/novelty" }
    ];
  }

  function calculateEmotionalVolatility(context) {
    const categories = [
      { key: "TRIBAL_DOMINATION_FRAMING_SIGNALS", label: "tribal/domination framing", weight: 24, cap: 46, thumbnailWeight: 34, thumbnailCap: 58 },
      { key: "EMOTIONAL_TONE_SIGNALS", label: "emotional tone/rage framing", weight: 20, cap: 38, thumbnailWeight: 30, thumbnailCap: 50 },
      { key: "outrageEscalation", label: "outrage/escalation signals", weight: 20, cap: 34, thumbnailWeight: 30, thumbnailCap: 48 },
      { key: "humiliationFraming", label: "humiliation framing", weight: 18, cap: 30, thumbnailWeight: 28, thumbnailCap: 44 },
      { key: "tribalConflictLanguage", label: "tribal conflict language", weight: 16, cap: 28, thumbnailWeight: 22, thumbnailCap: 36 },
      { key: "panicFearFraming", label: "panic/fear framing", weight: 18, cap: 32, thumbnailWeight: 28, thumbnailCap: 44 },
      { key: "absolutistEmotionalWording", label: "absolutist/emotional wording", weight: 12, cap: 24, thumbnailWeight: 18, thumbnailCap: 34 },
      { key: "noveltyIntensityLanguage", label: "novelty intensity language", weight: 16, cap: 30, thumbnailWeight: 26, thumbnailCap: 42 },
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
    return (
      addSignal(negatives, findMatches(context.searchText, HEURISTIC_SIGNAL_DICTIONARIES.emotional), "high emotional language", 6, 18) +
      addSignal(
        negatives,
        findMatches(context.searchText, HEURISTIC_SIGNAL_DICTIONARIES.EMOTIONAL_TONE_SIGNALS),
        "rage/escalation tone",
        8,
        24
      ) +
      addSignal(
        negatives,
        findMatches(context.searchText, HEURISTIC_SIGNAL_DICTIONARIES.TRIBAL_DOMINATION_FRAMING_SIGNALS),
        "tribal/domination framing",
        9,
        28
      )
    );
  }

  function hasEmotionalVolatility(context) {
    return calculateEmotionalVolatility(context).score > 0;
  }

  function buildResult(rawScore, positiveSignals, negativeSignals, explanationContext, metrics = {}) {
    const score = clampScore(rawScore);
    const confidence = confidenceFor(positiveSignals, negativeSignals);
    const signalLayers = normalizeSignalLayers(metrics.signalLayers);
    const normalizedMetrics = {
      activeMode: metrics.activeMode || "",
      calmAmbientScore: signalLayers.calmAmbient.score,
      continuityBonus: Number(metrics.continuityBonus) || 0,
      cognitiveLoadScore: signalLayers.cognitiveLoad.score,
      durationBonus: Number(metrics.durationBonus) || 0,
      educationalFormatSignals: metrics.educationalFormatSignals || [],
      evidenceSignalCount: Number(metrics.evidenceSignalCount) || 0,
      emotionalToneScore: signalLayers.emotionalTone.score,
      emotionalVolatilityScore: Number(metrics.emotionalVolatilityScore) || 0,
      matchedTopicKeywords: metrics.matchedTopicKeywords || [],
      personaProfile: metrics.personaProfile || "custom",
      personaWeights: metrics.personaWeights || PERSONA_DIMENSION_WEIGHTS.custom,
      selectedStudyPersona: metrics.selectedStudyPersona || "",
      signalLayers,
      strongestNegativeContributor: negativeSignals[0] || "no strong friction signals",
      strongestPositiveContributor: positiveSignals[0] || "no strong supporting signals",
      subjectMatterImpactScore: signalLayers.subjectMatter.score,
      thumbnailVolatilitySignalCount: Number(metrics.thumbnailVolatilitySignalCount) || 0,
      tribalDominationScore: signalLayers.tribalDomination.score,
      volatilitySignals: metrics.volatilitySignals || []
    };
    const dimensions = calculateDimensions(score, positiveSignals, negativeSignals, normalizedMetrics);
    const classification = classifyDimensions(dimensions);
    const calmExplanation = calmExplanationFor(classification, explanationContext);

    return {
      calmExplanation,
      classification,
      confidence,
      dimensions,
      explanationContext,
      metrics: normalizedMetrics,
      negativeSignals,
      positiveSignals,
      score
    };
  }

  function normalizeSignalLayers(signalLayers) {
    const emptyLayer = {
      matches: [],
      score: 0,
      sourceMatches: {
        metadata: [],
        thumbnail: [],
        title: [],
        transcript: []
      },
      signals: [],
      textMatches: [],
      thumbnailMatches: []
    };

    return {
      calmAmbient: normalizeSignalLayer(signalLayers && signalLayers.calmAmbient, emptyLayer),
      cognitiveLoad: normalizeSignalLayer(signalLayers && signalLayers.cognitiveLoad, emptyLayer),
      emotionalTone: normalizeSignalLayer(signalLayers && signalLayers.emotionalTone, emptyLayer),
      subjectMatter: normalizeSignalLayer(signalLayers && signalLayers.subjectMatter, emptyLayer),
      tribalDomination: normalizeSignalLayer(signalLayers && signalLayers.tribalDomination, emptyLayer)
    };
  }

  function normalizeSignalLayer(layer, fallback) {
    return {
      matches: layer && layer.matches ? layer.matches : fallback.matches,
      score: clampDimension(layer && layer.score ? layer.score : fallback.score),
      sourceMatches: layer && layer.sourceMatches ? layer.sourceMatches : fallback.sourceMatches,
      signals: layer && layer.signals ? layer.signals : fallback.signals,
      textMatches: layer && layer.textMatches ? layer.textMatches : fallback.textMatches,
      thumbnailMatches: layer && layer.thumbnailMatches ? layer.thumbnailMatches : fallback.thumbnailMatches
    };
  }

  function calculateDimensions(score, positiveSignals, negativeSignals, metrics) {
    const evidenceSignals = Math.max(
      Number(metrics.evidenceSignalCount) || 0,
      positiveSignals.filter((signal) =>
        /evidence|source|report|analysis|analytical|opposing|critique|viewpoint|interview|data|technical/i.test(signal)
      ).length
    );
    const lowEvidenceSignals = negativeSignals.filter((signal) =>
      /low evidence|speculation|without grounding/i.test(signal)
    ).length;
    const noveltySignals = negativeSignals.filter((signal) =>
      /novelty|clickbait|urgency|urgent|breaking|short-form|Shorts/i.test(signal)
    ).length + metrics.thumbnailVolatilitySignalCount;
    const cognitiveLoadSignals = negativeSignals.filter((signal) =>
      /Shorts|short duration|short-form|switching|fragment|cognitive load|rapid updates|multi-topic|live coverage/i.test(signal)
    ).length;
    const diversitySignals = positiveSignals.filter((signal) =>
      /opposing|critique|viewpoint|debate|panel|roundtable|conversation/i.test(signal)
    ).length;
    const educationalSignals =
      (metrics.educationalFormatSignals && metrics.educationalFormatSignals.length) ||
      positiveSignals.filter((signal) => /educational|tutorial|walkthrough|lesson|course|lecture|lab|demo|technical/i.test(signal)).length;
    const weights = metrics.personaWeights || PERSONA_DIMENSION_WEIGHTS.custom;
    const subjectMatterImpact = clampDimension(metrics.subjectMatterImpactScore);
    const calmAmbient = clampDimension(metrics.calmAmbientScore);
    const tribalDomination = clampDimension(metrics.tribalDominationScore);
    const emotionalTone = clampDimension(Math.max(metrics.emotionalVolatilityScore, metrics.emotionalToneScore, tribalDomination));

    const evidenceQuality = clampDimension(
      35 + evidenceSignals * 14 + metrics.durationBonus + metrics.continuityBonus - lowEvidenceSignals * 18
    );
    const emotionalVolatility = emotionalTone;
    const noveltyPressure = clampDimension(10 + noveltySignals * 18 + (metrics.thumbnailVolatilitySignalCount ? 20 : 0));
    const cognitiveLoad = clampDimension(
      Math.max(
        metrics.cognitiveLoadScore,
        Math.round(tribalDomination * 0.65),
        15 + cognitiveLoadSignals * 22 + (noveltyPressure >= 70 ? 12 : 0)
      )
    );
    const driftRisk = clampDimension(
      Math.max(emotionalTone, subjectMatterImpact, cognitiveLoad, noveltyPressure, Math.round(tribalDomination * 1.1))
    );
    const exploratoryValue = clampDimension(20 + diversitySignals * 22 + Math.max(0, evidenceSignals - 1) * 8);
    const continuityAlignment = clampDimension(25 + metrics.continuityBonus * 4);
    const educationalDepth = clampDimension(20 + educationalSignals * 16 + metrics.durationBonus * 2);
    const intentAlignment = clampDimension(
      educationalDepth * (weights.educationalDepth || 0) +
        continuityAlignment * (weights.continuityAlignment || 0) +
        evidenceQuality * (weights.evidenceQuality || 0) +
        exploratoryValue * (weights.exploratoryValue || 0) +
        (100 - cognitiveLoad) * (weights.lowCognitiveLoad || 0) +
        (100 - emotionalVolatility) * (weights.lowEmotionalVolatility || 0) +
        (100 - subjectMatterImpact) * (weights.lowDisturbingSubjectMatter || 0) +
        (100 - tribalDomination) * (weights.lowTribalDomination || 0) +
        calmAmbient * (weights.calmAmbient || 0) -
        Math.max(0, noveltyPressure - 75) * 0.15
    );

    return {
      alignmentScore: score,
      calmAmbient,
      cognitiveLoad,
      cognitivePressure: cognitiveLoad,
      continuity: continuityAlignment,
      continuityAlignment,
      educationalDepth,
      emotionalVolatility,
      emotionalTone,
      evidence: evidenceQuality,
      evidenceQuality,
      exploratoryDiversity: exploratoryValue,
      exploratoryValue,
      intentAlignment,
      intentionalAlignment: intentAlignment,
      noveltyPressure,
      subjectMatterImpact,
      tribalDomination,
      driftRisk
    };
  }

  function classifyDimensions(dimensions) {
    const strongNegativeCount = [
      dimensions.emotionalVolatility >= 75,
      dimensions.subjectMatterImpact >= 75,
      dimensions.tribalDomination >= 75,
      dimensions.noveltyPressure >= 70,
      dimensions.cognitiveLoad >= 75,
      dimensions.evidenceQuality <= 30
    ].filter(Boolean).length;
    const hasResearchLikeValue = dimensions.evidenceQuality >= 65 || dimensions.exploratoryValue >= 60;

    if (dimensions.intentAlignment >= 70 && strongNegativeCount === 0) {
      return "aligned";
    }

    if (
      dimensions.alignmentScore <= 34 &&
      (dimensions.tribalDomination >= 35 || dimensions.subjectMatterImpact >= 55 || dimensions.emotionalVolatility >= 55)
    ) {
      return "misaligned";
    }

    if (dimensions.emotionalVolatility >= 75 && dimensions.intentAlignment < 60 && !hasResearchLikeValue) {
      return "misaligned";
    }

    if (dimensions.tribalDomination >= 75 && dimensions.intentAlignment < 60 && !hasResearchLikeValue) {
      return "misaligned";
    }

    if (dimensions.subjectMatterImpact >= 75 && dimensions.intentAlignment < 55 && !hasResearchLikeValue) {
      return "misaligned";
    }

    if (strongNegativeCount >= 2 && dimensions.intentAlignment < 60 && !hasResearchLikeValue) {
      return "misaligned";
    }

    if (dimensions.intentAlignment >= 55 || hasResearchLikeValue) {
      return "mixed";
    }

    return "neutral";
  }

  function clampDimension(value) {
    return Math.max(0, Math.min(100, Math.round(value)));
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

  function calmExplanationFor(classification, context) {
    if (classification === "aligned") {
      return `Looks aligned with this mode. ${context}`;
    }

    if (classification === "mixed") {
      return `This is a mixed-signal media item: some observability dimensions support the declared mode while others add friction. ${context}`;
    }

    if (classification === "neutral") {
      return `Signals are limited or ambiguous relative to this mode. ${context}`;
    }

    return `This media environment appears less aligned with your declared intent. Nothing is blocked; this is an observability signal. ${context}`;
  }

  function findMatches(text, terms) {
    const lowerText = String(text || "").toLowerCase();
    return terms.filter((term) => termMatches(lowerText, term));
  }

  function termMatches(lowerText, term) {
    const normalizedTerm = String(term || "").toLowerCase();
    if (!normalizedTerm) {
      return false;
    }

    const escapedTerm = escapeRegExp(normalizedTerm);
    const startsWithWord = /^[a-z0-9]/.test(normalizedTerm);
    const endsWithWord = /[a-z0-9]$/.test(normalizedTerm);
    const prefix = startsWithWord ? "(^|[^a-z0-9])" : "";
    const suffix = endsWithWord ? "([^a-z0-9]|$)" : "";
    return new RegExp(`${prefix}${escapedTerm}${suffix}`, "i").test(lowerText);
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function formatMatches(matches) {
    return matches.slice(0, 3).join(", ");
  }

  function uniqueMatches(matches) {
    return Array.from(new Set(matches.filter(Boolean)));
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

  function colorForResult(result) {
    const classification = result.classification;

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

    if (classification === "mixed") {
      return {
        alignment: "mixed",
        border: "#f97316",
        glow: "rgba(249, 115, 22, 0.2)"
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
    return [positive, negative].filter(Boolean).join(" | ") || result.calmExplanation;
  }

  function tooltipFor(modeLabel, result) {
    const positive = result.positiveSignals.length
      ? result.positiveSignals.map((signal) => `+ ${signal}`).join("\n")
      : "+ no strong supporting signals";
    const negative = result.negativeSignals.length
      ? result.negativeSignals.map((signal) => `- ${signal}`).join("\n")
      : "- no strong friction signals";
    const volatilitySignals = result.metrics.volatilitySignals.length
      ? result.metrics.volatilitySignals.map((signal) => `- ${signal}`).join("\n")
      : "- no outrage/escalation signals detected";
    const continuityLevel = levelFromBonus(result.metrics.continuityBonus, 12, 6);
    const volatilityLevel = levelFromScore(result.dimensions.emotionalVolatility, 60, 35);
    const subjectMatterLevel = levelFromScore(result.dimensions.subjectMatterImpact, 60, 35);
    const evidenceLevel = levelFromScore(result.dimensions.evidenceQuality, 65, 45);
    const educationalDepthLevel = levelFromScore(result.dimensions.educationalDepth, 65, 45);
    const noveltyLevel = levelFromScore(result.dimensions.noveltyPressure, 65, 35);
    const cognitiveLoadLevel = levelFromScore(result.dimensions.cognitiveLoad, 65, 35);
    const calmAmbientLevel = levelFromScore(result.dimensions.calmAmbient, 65, 35);
    const tribalDominationLevel = levelFromScore(result.dimensions.tribalDomination, 60, 35);
    const driftRiskLevel = levelFromScore(result.dimensions.driftRisk, 70, 40);
    const diversityLevel = levelFromScore(result.dimensions.exploratoryValue, 65, 35);

    return [
      `${modeLabel} ${result.score} - ${result.classification}`,
      "Media Observability Panel",
      `intentAlignment: ${result.classification} (${result.dimensions.intentAlignment}/100)`,
      `Final Alignment Score: ${result.score}`,
      result.metrics.selectedStudyPersona ? `Selected study persona: ${result.metrics.selectedStudyPersona}` : "",
      result.metrics.matchedTopicKeywords.length
        ? `Matched topic keywords: ${formatMatches(result.metrics.matchedTopicKeywords)}`
        : result.metrics.selectedStudyPersona
          ? "Matched topic keywords: none"
          : "",
      result.metrics.educationalFormatSignals.length
        ? `Educational format signals: ${formatMatches(result.metrics.educationalFormatSignals)}`
        : result.metrics.selectedStudyPersona
          ? "Educational format signals: none"
          : "",
      "Calm / Ambient Signals:",
      `Calm ambient support: ${calmAmbientLevel} (${result.dimensions.calmAmbient}/100)`,
      formatLayerSignals(result.metrics.signalLayers.calmAmbient, "no calm ambient signals detected"),
      "Violence / Disturbing Subject Matter:",
      `Disturbing/heavy subject matter: ${subjectMatterLevel} (${result.dimensions.subjectMatterImpact}/100)`,
      formatLayerSignals(result.metrics.signalLayers.subjectMatter, "no disturbing subject-matter signals detected"),
      "Tribal Domination Framing:",
      `Tribal/conflict framing: ${tribalDominationLevel} (${result.dimensions.tribalDomination}/100)`,
      formatLayerSignals(result.metrics.signalLayers.tribalDomination, "no tribal/conflict framing detected"),
      "Cognitive Load:",
      `Cognitive pressure / fragmentation: ${cognitiveLoadLevel} (${result.dimensions.cognitiveLoad}/100)`,
      formatLayerSignals(result.metrics.signalLayers.cognitiveLoad, "low cognitive-fragmentation signals detected"),
      "Persona Alignment:",
      `Intent alignment: ${result.classification} (${result.dimensions.intentAlignment}/100)`,
      `Drift risk: ${driftRiskLevel} (${result.dimensions.driftRisk}/100)`,
      formatPersonaAlignmentNote(result),
      "Signals:",
      positive,
      negative,
      `evidenceQuality: ${evidenceLevel} (${result.dimensions.evidenceQuality}/100)`,
      `educationalDepth: ${educationalDepthLevel} (${result.dimensions.educationalDepth}/100)`,
      `emotionalVolatility: ${volatilityLevel} (${result.dimensions.emotionalVolatility}/100)`,
      `subjectMatterImpact: ${subjectMatterLevel} (${result.dimensions.subjectMatterImpact}/100)`,
      `tribalDomination: ${tribalDominationLevel} (${result.dimensions.tribalDomination}/100)`,
      `calmAmbient: ${calmAmbientLevel} (${result.dimensions.calmAmbient}/100)`,
      `driftRisk: ${driftRiskLevel} (${result.dimensions.driftRisk}/100)`,
      `noveltyPressure: ${noveltyLevel} (${result.dimensions.noveltyPressure}/100)`,
      `cognitiveLoad: ${cognitiveLoadLevel} (${result.dimensions.cognitiveLoad}/100)`,
      `continuityAlignment: ${continuityLevel} (${result.dimensions.continuityAlignment}/100)`,
      `exploratoryValue: ${diversityLevel} (${result.dimensions.exploratoryValue}/100)`,
      `Confidence: ${capitalize(result.confidence)}`,
      `Persona weighting path: ${formatPersonaWeights(result.metrics.personaProfile, result.metrics.personaWeights)}`,
      `Long-form Analysis Signal: +${result.metrics.durationBonus}`,
      `Primary supporting signal: ${result.metrics.strongestPositiveContributor}`,
      `Primary friction signal: ${result.metrics.strongestNegativeContributor}`,
      "Evidence Signals:",
      "Title signals:",
      formatSourceSignals(result.metrics.sourceSignals.title, "no title dictionary signals"),
      "Thumbnail signals:",
      result.metrics.thumbnailTextAvailable
        ? formatSourceSignals(result.metrics.sourceSignals.thumbnail, "no thumbnail dictionary signals")
        : "Thumbnail text unavailable; score based on title/metadata only.",
      "Metadata/duration signals:",
      formatSourceSignals(result.metrics.sourceSignals.metadata, "no metadata dictionary signals"),
      "Signal Provenance:",
      formatSignalProvenance(result.metrics.signalProvenance),
      "Emotional Volatility Signals:",
      volatilitySignals,
      result.calmExplanation
    ].filter(Boolean).join("\n");
  }

  function formatLayerSignals(layer, fallback) {
    if (!layer || !layer.signals || !layer.signals.length) {
      return `- ${fallback}`;
    }

    return layer.signals.map((signal) => `- ${signal}`).join("\n");
  }

  function formatPersonaAlignmentNote(result) {
    if (result.metrics.activeMode === "chill" && result.dimensions.tribalDomination >= 25) {
      return `- Chill alignment reduced due to conflict/dominance framing signals: ${formatMatches(result.metrics.signalLayers.tribalDomination.matches)}.`;
    }

    if (
      result.metrics.activeMode === "chill" &&
      result.dimensions.emotionalTone < 20 &&
      result.dimensions.subjectMatterImpact >= 25
    ) {
      return "- Low rage framing detected, but disturbing subject matter reduced Chill alignment.";
    }

    if (result.metrics.activeMode === "chill" && result.dimensions.calmAmbient >= 45 && result.dimensions.subjectMatterImpact < 25) {
      return "- Calm ambient content increased Chill alignment.";
    }

    if (result.dimensions.cognitiveLoad >= 55) {
      return "- Higher cognitive load reduced alignment for low-friction personas.";
    }

    return "- Persona alignment is a local fit estimate, not a truth or morality claim.";
  }

  function levelFromBonus(value, highThreshold, mediumThreshold) {
    if (value >= highThreshold) {
      return "High";
    }

    if (value >= mediumThreshold) {
      return "Moderate";
    }

    return "Low";
  }

  function levelFromScore(value, highThreshold, mediumThreshold) {
    if (value >= highThreshold) {
      return "High";
    }

    if (value >= mediumThreshold) {
      return "Moderate";
    }

    return "Low";
  }

  function capitalize(value) {
    const text = String(value || "");
    return text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}` : text;
  }

  function formatSourceSignals(signals, fallback) {
    return signals && signals.length ? signals.map((signal) => `- ${signal}`).join("\n") : fallback;
  }

  function formatSignalProvenance(provenance) {
    const sourceOrder = [
      "title",
      "thumbnail OCR",
      "duration",
      "channel metadata",
      "transcript",
      "browsing continuity/session"
    ];

    return sourceOrder
      .map((source) => {
        const entries = provenance && provenance[source] ? provenance[source] : [];
        if (!entries.length) {
          return `- ${source}: ${source === "transcript" ? "unavailable" : "none"}`;
        }

        if (typeof entries[0] === "string") {
          return `- ${source}: ${entries.join(", ")}`;
        }

        const terms = entries.flatMap((entry) => entry.terms || []);
        return `- ${source}: ${terms.length ? uniqueMatches(terms).map((term) => `"${term}"`).join(", ") : "none"}`;
      })
      .join("\n");
  }

  function formatPersonaWeights(profile, weights) {
    if (!weights) {
      return `${profile || "custom"} weights unavailable`;
    }

    return [
      `${profile || "custom"}`,
      `educationalDepth ${weights.educationalDepth}`,
      `continuityAlignment ${weights.continuityAlignment}`,
      `evidenceQuality ${weights.evidenceQuality}`,
      `exploratoryValue ${weights.exploratoryValue}`,
      `lowCognitiveLoad ${weights.lowCognitiveLoad}`,
      `lowEmotionalVolatility ${weights.lowEmotionalVolatility}`,
      `lowDisturbingSubjectMatter ${weights.lowDisturbingSubjectMatter || 0}`,
      `lowTribalDomination ${weights.lowTribalDomination || 0}`,
      `calmAmbient ${weights.calmAmbient || 0}`
    ].join(" | ");
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
    const driftRiskScore =
      result.dimensions && Number.isFinite(result.dimensions.driftRisk)
        ? result.dimensions.driftRisk
        : result.metrics.emotionalVolatilityScore;
    sessionState.emotionalVolatilityScoreTotal += driftRiskScore;
    modeStats.emotionalVolatilityScoreTotal += driftRiskScore;

    if (driftRiskScore >= 60) {
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
      (isStudyMode(activeMode) && modeStats.shortsDetected >= 3) ||
      (activeMode === "project" && modeStats.shortsDetected >= 3) ||
      sessionState.rapidSwitchEstimate >= 2;

    if (!shouldPrompt) {
      return;
    }

    showDriftPrompt(driftReason(modeStats, misalignedRatio, highVolatilityRatio));
  }

  function driftReason(modeStats, misalignedRatio, highVolatilityRatio) {
    if (activeMode === "chill" && modeStats.highEmotionalVolatilityItems >= 2 && highVolatilityRatio >= 0.25) {
      return "Recent media environment signals show elevated drift risk during Chill Mode.";
    }

    if (isStudyMode(activeMode) && modeStats.shortsDetected >= 3) {
      return "Short-form novelty signals are appearing during a focus-oriented mode.";
    }

    if (activeMode === "project" && modeStats.shortsDetected >= 3) {
      return "Short-form novelty signals are appearing during Project Mode.";
    }

    if (sessionState.rapidSwitchEstimate >= 2) {
      return "Recent navigation patterns suggest higher switching intensity.";
    }

    return `${Math.round(misalignedRatio * 100)}% of recent scanned cards show lower alignment with this mode.`;
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
      `<p class="persona-labs-drift-message">Your recent browsing trajectory appears less aligned with your declared ${modeLabel} mode.</p>`,
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

  function updateDebugPanel() {
    const existingPanel = document.querySelector(".persona-labs-debug-panel");
    if (!debugMode || activeMode === "bareMetal") {
      if (existingPanel) {
        existingPanel.remove();
      }
      return;
    }

    const panel = existingPanel || document.createElement("pre");
    panel.className = "persona-labs-debug-panel";
    panel.textContent = latestDebugPayload
      ? JSON.stringify(latestDebugPayload, null, 2)
      : "Persona Labs debug mode enabled. No card analyzed yet.";

    if (!existingPanel) {
      document.body.append(panel);
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
      updateDebugPanel();
    }
  }

  if (typeof globalThis !== "undefined" && globalThis.__PERSONA_LABS_ENABLE_TEST_API__) {
    globalThis.__PersonaLabsScoring = {
      analyzeSignalLayers,
      normalizeText,
      scoreCard
    };
  }
})();

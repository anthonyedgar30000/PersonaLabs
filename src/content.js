(function initializePersonaLabs() {
  "use strict";

  const semantic = window.PersonaLabsSemantic;
  const retrieval = window.PersonaLabsRetrieval;
  const LOG_PREFIX = "[PersonaLabs rendering]";
  const DEBUG_RENDERING = true;

  if (typeof window.PERSONALABS_DEBUG === "undefined") {
    window.PERSONALABS_DEBUG = false;
  }

  if (!semantic) {
    console.warn(LOG_PREFIX, "content.js executed, but semantic core is unavailable");
    return;
  }

  if (!retrieval) {
    console.warn(LOG_PREFIX, "content.js executed, but retrieval pipeline is unavailable");
    return;
  }

  if (window.__personaLabsSemanticNavigationLoaded) {
    console.debug(LOG_PREFIX, "content.js skipped because it is already loaded");
    return;
  }

  window.__personaLabsSemanticNavigationLoaded = true;
  console.info(LOG_PREFIX, "content.js executing", {
    href: location.href,
    readyState: document.readyState
  });

  const STORAGE_KEY = "personaLabsSemanticNavigation";
  const CARD_SELECTOR = [
    "ytd-rich-item-renderer",
    "ytd-rich-grid-media",
    "ytd-video-renderer",
    "ytd-grid-video-renderer",
    "ytd-compact-video-renderer",
    "ytd-compact-radio-renderer",
    "ytd-compact-playlist-renderer",
    "ytd-reel-item-renderer",
    "ytd-reel-video-renderer",
    "ytd-playlist-video-renderer",
    "ytd-playlist-panel-video-renderer",
    "ytd-radio-renderer",
    "yt-lockup-view-model",
    "ytm-video-with-context-renderer"
  ].join(",");
  const TITLE_SELECTOR = [
    "#video-title",
    "#video-title-link",
    "a#video-title",
    "yt-formatted-string#video-title",
    "h3 a[href*='watch']",
    "a[href*='watch']",
    "a[href*='/shorts/']",
    "a.yt-lockup-metadata-view-model-wiz__title",
    ".yt-lockup-metadata-view-model-wiz__title"
  ].join(",");
  const THUMBNAIL_HOST_SELECTOR = [
    "ytd-thumbnail",
    "a#thumbnail",
    "#thumbnail",
    "yt-thumbnail-view-model",
    ".yt-thumbnail-view-model",
    "yt-image",
    "a[href*='watch'] yt-image",
    "a[href*='/shorts/'] yt-image"
  ].join(",");
  const YOUTUBE_SPA_EVENTS = [
    "yt-navigate-start",
    "yt-navigate-finish",
    "yt-page-data-updated",
    "yt-rendererstamper-finished"
  ];

  const state = {
    anchor: null,
    paths: [],
    activePathId: null,
    suggestions: [],
    scoredResultCount: 0,
    retrievalPipeline: null,
    lastRetrievalSource: "",
    lastPipelineStages: [],
    lastUrl: location.href,
    panel: null,
    observer: null,
    annotationTimer: null,
    scanTimer: null,
    renderTimer: null,
    traces: [],
    mutationCount: 0
  };

  function debugLog(message, payload) {
    if (!DEBUG_RENDERING) {
      return;
    }

    if (payload === undefined) {
      console.debug(LOG_PREFIX, message);
    } else {
      console.debug(LOG_PREFIX, message, payload);
    }
  }

  function warnLog(message, payload) {
    if (payload === undefined) {
      console.warn(LOG_PREFIX, message);
    } else {
      console.warn(LOG_PREFIX, message, payload);
    }
  }

  function personaLabsDebugEnabled() {
    return window.PERSONALABS_DEBUG === true;
  }

  function traceLog(stage, trace) {
    if (personaLabsDebugEnabled()) {
      console.debug("[PersonaLabs trace]", stage, trace);
    }
  }

  function storageAvailable() {
    return Boolean(window.chrome && chrome.storage && chrome.storage.local);
  }

  function persistState() {
    const payload = {
      anchor: state.anchor,
      paths: state.paths,
      activePathId: state.activePathId,
      savedAt: new Date().toISOString()
    };

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      // Local storage can be unavailable in restricted contexts; the panel still works in memory.
    }

    if (storageAvailable()) {
      chrome.storage.local.set({ [STORAGE_KEY]: payload });
    }
  }

  function loadState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        applyStoredState(JSON.parse(raw));
      }
    } catch (error) {
      // Ignore malformed local state and rebuild from the next anchor.
    }

    if (storageAvailable()) {
      chrome.storage.local.get(STORAGE_KEY, (result) => {
        if (result && result[STORAGE_KEY]) {
          applyStoredState(result[STORAGE_KEY]);
          scheduleRender();
          scheduleScan();
        }
      });
    }
  }

  function applyStoredState(payload) {
    if (!payload || !payload.anchor) {
      return;
    }

    state.anchor = payload.anchor;
    state.paths = semantic.buildExplorationPaths(payload.anchor);
    state.activePathId = payload.activePathId || (state.paths[0] && state.paths[0].id);
  }

  function scheduleRender() {
    window.clearTimeout(state.renderTimer);
    state.renderTimer = window.setTimeout(renderPanel, 50);
  }

  function scheduleScan() {
    window.clearTimeout(state.scanTimer);
    state.scanTimer = window.setTimeout(scanVisibleResults, 250);
  }

  function scheduleAnnotateVisibleCards(reason) {
    window.clearTimeout(state.annotationTimer);
    state.annotationTimer = window.setTimeout(() => {
      annotateVisibleCards(reason || "scheduled");
    }, 100);
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function firstText(root, selectors) {
    for (const selector of selectors) {
      const element = root.querySelector(selector);
      const value = element && normalizeText(element.textContent || element.getAttribute("aria-label"));
      if (value) {
        return value;
      }
    }

    return "";
  }

  function absoluteUrl(value) {
    if (!value) {
      return "";
    }

    try {
      return new URL(value, location.origin).href;
    } catch (error) {
      return value;
    }
  }

  function videoIdFromUrl(url) {
    try {
      const parsed = new URL(url || "", location.origin);
      if (parsed.searchParams.get("v")) {
        return parsed.searchParams.get("v");
      }

      const shortsMatch = parsed.pathname.match(/\/shorts\/([^/?#]+)/);
      if (shortsMatch) {
        return shortsMatch[1];
      }
    } catch (error) {
      return "";
    }

    return "";
  }

  function generateTraceId(candidate) {
    const source = [
      (candidate && candidate.videoId) || videoIdFromUrl(candidate && candidate.url),
      candidate && candidate.title,
      candidate && candidate.channel,
      Date.now(),
      Math.random().toString(36).slice(2, 8)
    ].filter(Boolean).join(":");

    let hash = 0;
    for (let index = 0; index < source.length; index += 1) {
      hash = ((hash << 5) - hash + source.charCodeAt(index)) | 0;
    }

    return `pl-${Math.abs(hash).toString(36)}-${Date.now().toString(36)}`;
  }

  function selectedLensLabel(lens) {
    const selected = lens || activePath();
    if (!selected) {
      return "none";
    }

    return selected.id || selected.lensLabel || selected.label || "unknown";
  }

  function uniqueStrings(values) {
    const seen = new Set();
    return (values || []).reduce((output, value) => {
      const normalized = String(value || "").trim();
      if (normalized && !seen.has(normalized)) {
        seen.add(normalized);
        output.push(normalized);
      }
      return output;
    }, []);
  }

  function termFromSignal(signal) {
    if (!signal) {
      return "";
    }

    if (typeof signal === "string") {
      return signal;
    }

    return signal.term || signal.normalizedTerm || signal.category || "";
  }

  function signalTerms(signals) {
    return uniqueStrings((signals || []).map(termFromSignal));
  }

  function detectDomainForTrace(scoring, headline) {
    if (headline && headline.governance && headline.governance.safeDomain && headline.governance.safeDomain.isSafeAnimalDomain) {
      return "animal-pet-nature";
    }

    if (scoring && scoring.breakdown) {
      if (scoring.breakdown.calmAnimalScore > 0) {
        return "animal-pet-nature";
      }
      if (scoring.breakdown.educationalFraming > 0) {
        return "educational/explanatory";
      }
      if (scoring.breakdown.sourceFormat > 0 || scoring.breakdown.informationalTone > 0) {
        return "low-friction-source";
      }
    }

    return "general";
  }

  function matchedPositiveSignalsForTrace(scoring, headline) {
    const observability = (scoring && scoring.observabilitySignals) || {};
    const terms = [
      ...signalTerms(observability.educational),
      ...signalTerms(observability.lowFriction),
      ...signalTerms(observability.calmPositive),
      ...signalTerms(observability.calmNatureAnimal),
      ...signalTerms(observability.neutralReporting),
      ...signalTerms(observability.interviewDiscussion),
      ...signalTerms(observability.lowerFrictionSource),
      ...signalTerms(observability.longForm),
      ...signalTerms(observability.beginner),
      ...signalTerms(headline && headline.matchedTerms && headline.matchedTerms.green)
    ];

    return uniqueStrings(terms);
  }

  function matchedFrictionSignalsForTrace(scoring, headline) {
    const observability = (scoring && scoring.observabilitySignals) || {};
    const source = (headline && headline.sourceAdjustment) || {};
    const terms = [
      ...signalTerms(observability.friction),
      ...signalTerms(observability.animalDistress),
      ...signalTerms(observability.mixedSource),
      ...signalTerms(scoring && scoring.detectedStyleTerms),
      ...signalTerms(headline && headline.matchedTerms && headline.matchedTerms.yellow),
      ...signalTerms(headline && headline.matchedTerms && headline.matchedTerms.red),
      ...signalTerms(source.riskMatches)
    ];

    return uniqueStrings(terms);
  }

  function suppressedSignalsForTrace(headline, anchor) {
    const suppressed = [
      ...((headline && headline.governance && headline.governance.suppressedWeakTerms) || []),
      ...(((anchor && anchor.removedEscalationTerms) || []).map(termFromSignal))
    ];

    return uniqueStrings(suppressed);
  }

  function downgradeReasonsForTrace(scoring, headline, visibleOverlay) {
    if (scoring && scoring.reasoning && scoring.reasoning.downgradeReasons) {
      return scoring.reasoning.downgradeReasons;
    }

    const reasons = [
      ...((scoring && scoring.reasons) || []).filter((reason) => /downgrade|ranked lower|neutral default|chaotic|friction|escalation|suppression|cap/i.test(reason)),
      ...((headline && headline.reasons) || []).filter((reason) => /yellow|red|suppressed|uncertain|risk/i.test(reason)),
      visibleOverlay && visibleOverlay.code && visibleOverlay.reason ? visibleOverlay.reason : ""
    ];

    return uniqueStrings(reasons);
  }

  function scoreComponentsForTrace(scoring, headline) {
    if (scoring && scoring.scores) {
      return scoring.scores;
    }

    return {
      semanticScore: scoring ? scoring.score : null,
      semanticBreakdown: scoring && scoring.breakdown ? scoring.breakdown : {},
      headlineScores: headline && headline.scores ? headline.scores : {},
      confidence: scoring ? scoring.confidence : null,
      domainConfidence: scoring ? scoring.domainConfidence : null,
      frictionConfidence: scoring ? scoring.frictionConfidence : null,
      positiveSignalConfidence: scoring ? scoring.positiveSignalConfidence : null
    };
  }

  function createTrace(candidate, renderingTarget, lens) {
    if (!personaLabsDebugEnabled()) {
      return null;
    }

    const trace = {
      traceId: generateTraceId(candidate),
      videoId: (candidate && candidate.videoId) || videoIdFromUrl(candidate && candidate.url),
      title: (candidate && candidate.title) || "",
      channel: (candidate && candidate.channel) || "",
      lens: selectedLensLabel(lens),
      domain: "unknown",
      label: "",
      confidence: null,
      scores: {},
      matchedTerms: {
        positive: [],
        friction: []
      },
      matchedSignals: {
        positive: [],
        friction: []
      },
      suppressedTerms: [],
      suppressedSignals: [],
      downgradeReasons: [],
      semanticSignals: {},
      observabilitySignals: {},
      reasoning: {},
      pipelineVersion: "",
      scoringPath: "",
      contradictions: [],
      domainContext: {},
      traceEvents: [],
      explanation: "",
      timestamp: new Date().toISOString(),
      renderingTarget: renderingTarget || "unknown",
      stages: []
    };

    state.traces.unshift(trace);
    state.traces = state.traces.slice(0, 50);
    window.PersonaLabsDebugTraces = state.traces;
    return trace;
  }

  function updateTraceFromScoring(trace, scoring, headline, visibleOverlay, renderingTarget) {
    if (!trace) {
      return null;
    }

    if (scoring && scoring.traceId) {
      trace.traceId = scoring.traceId;
    }
    trace.domain = (scoring && scoring.domain) || detectDomainForTrace(scoring, headline);
    trace.matchedTerms = scoring && scoring.matchedTerms
      ? {
          positive: scoring.matchedTerms.positive || [],
          friction: scoring.matchedTerms.friction || []
        }
      : {
          positive: matchedPositiveSignalsForTrace(scoring, headline),
          friction: matchedFrictionSignalsForTrace(scoring, headline)
        };
    trace.matchedSignals = trace.matchedTerms;
    trace.suppressedTerms = scoring && scoring.suppressedTerms ? scoring.suppressedTerms : suppressedSignalsForTrace(headline, state.anchor);
    trace.suppressedSignals = trace.suppressedTerms;
    trace.scores = scoreComponentsForTrace(scoring, headline);
    trace.label = (scoring && scoring.label) || (visibleOverlay && visibleOverlay.label) || (scoring && scoring.classification && scoring.classification.color) || (headline && headline.label) || "";
    trace.confidence = scoring ? scoring.confidence : confidenceNumber(visibleOverlay && visibleOverlay.confidence);
    trace.downgradeReasons = downgradeReasonsForTrace(scoring, headline, visibleOverlay);
    trace.explanation = (scoring && scoring.explanation) || (scoring && scoring.finalReason) || (visibleOverlay && visibleOverlay.reason) || (headline && headline.explanation) || "";
    trace.contradictions = scoring && scoring.contradictions ? scoring.contradictions : [];
    trace.pipelineVersion = scoring && scoring.pipelineVersion;
    trace.scoringPath = scoring && scoring.scoringPath;
    trace.semanticSignals = scoring && scoring.semanticSignals ? scoring.semanticSignals : {};
    trace.observabilitySignals = scoring && scoring.observabilitySignals ? scoring.observabilitySignals : {};
    trace.reasoning = scoring && scoring.reasoning ? scoring.reasoning : {};
    trace.domainContext = scoring && scoring.domainContext ? scoring.domainContext : {};
    trace.traceEvents = scoring && scoring.traceEvents ? scoring.traceEvents : [];
    trace.renderingTarget = renderingTarget || trace.renderingTarget;
    trace.timestamp = new Date().toISOString();
    return trace;
  }

  function recordTraceStage(trace, stage, details, options) {
    if (!trace || !personaLabsDebugEnabled()) {
      return;
    }

    if (options && options.once && trace.stages.some((entry) => entry.stage === stage)) {
      return;
    }

    const entry = {
      stage,
      timestamp: new Date().toISOString(),
      details: details || {}
    };
    trace.stages.push(entry);
    trace.timestamp = entry.timestamp;
    traceLog(stage, trace);
  }

  function attemptDatabaseTraceSave(trace) {
    if (!trace || trace.databaseSaveAttempted) {
      return;
    }

    trace.databaseSaveAttempted = true;
    recordTraceStage(trace, "database save attempted", { traceId: trace.traceId }, { once: true });

    const adapter = window.PersonaLabsTraceDatabase;
    if (!adapter || typeof adapter.saveTrace !== "function") {
      recordTraceStage(trace, "database save failed", { reason: "trace database adapter unavailable" }, { once: true });
      return;
    }

    try {
      Promise.resolve(adapter.saveTrace(trace))
        .then(() => {
          recordTraceStage(trace, "database save succeeded", { traceId: trace.traceId }, { once: true });
        })
        .catch((error) => {
          recordTraceStage(trace, "database save failed", { message: error && error.message }, { once: true });
        });
    } catch (error) {
      recordTraceStage(trace, "database save failed", { message: error && error.message }, { once: true });
    }
  }

  function uniqueElements(elements) {
    const seen = new Set();
    const output = [];

    elements.forEach((element) => {
      if (element && !seen.has(element)) {
        seen.add(element);
        output.push(element);
      }
    });

    return output;
  }

  function getCandidateCards() {
    const cards = uniqueElements([
      ...document.querySelectorAll(CARD_SELECTOR),
      ...Array.from(document.querySelectorAll("a[href*='watch'], a[href*='/shorts/']")).map((link) => link.closest(CARD_SELECTOR) || link)
    ]).filter((element) => !element.closest("#personalabs-panel"));

    debugLog("detected candidate card elements", {
      count: cards.length,
      selectors: CARD_SELECTOR
    });

    return cards;
  }

  function findTitleElement(card) {
    if (!card || !(card instanceof Element)) {
      return null;
    }

    if (card.matches(TITLE_SELECTOR)) {
      return card;
    }

    return card.querySelector(TITLE_SELECTOR);
  }

  function describeCard(card, candidate) {
    return {
      tag: card && card.tagName ? card.tagName.toLowerCase() : "unknown",
      title: candidate && candidate.title,
      channel: candidate && candidate.channel,
      url: candidate && candidate.url,
      hasThumbnailHost: Boolean(card && findThumbnailHost(card)),
      hasExistingOverlay: Boolean(card && card.querySelector(".personalabs-classification-overlay")),
      hasExistingBadge: Boolean(card && card.querySelector(".personalabs-observability-badge"))
    };
  }

  function extractCandidateFromCard(card) {
    if (!card) {
      return null;
    }

    const titleElement = findTitleElement(card);
    const title =
      normalizeText(
        (titleElement && (titleElement.getAttribute("title") || titleElement.textContent || titleElement.getAttribute("aria-label"))) ||
          firstText(card, [
            "#video-title",
            "#video-title-link",
            "yt-formatted-string#video-title",
            "h3",
            "a[href*='watch']",
            "a[href*='/shorts/']",
            ".yt-lockup-metadata-view-model-wiz__title"
          ])
      ) || "";

    if (!title || title.toLowerCase() === "home") {
      return null;
    }

    const channel = firstText(card, [
      "#channel-name a",
      "ytd-channel-name a",
      ".ytd-channel-name",
      "#text.ytd-channel-name",
      "a[href^='/@']",
      "a[href^='/channel/']"
    ]);
    const duration = firstText(card, [
      "ytd-thumbnail-overlay-time-status-renderer",
      ".ytd-thumbnail-overlay-time-status-renderer",
      "span.ytd-thumbnail-overlay-time-status-renderer"
    ]);
    const link =
      (titleElement && titleElement.getAttribute("href")) ||
      (card.matches("a[href]") ? card.getAttribute("href") : "") ||
      (card.querySelector("a[href*='watch'], a[href*='/shorts/']") &&
        card.querySelector("a[href*='watch'], a[href*='/shorts/']").getAttribute("href"));

    return {
      videoId: videoIdFromUrl(absoluteUrl(link)),
      title,
      channel,
      duration,
      url: absoluteUrl(link),
      element: card
    };
  }

  function extractCurrentWatchVideo() {
    const title = firstText(document, [
      "ytd-watch-metadata h1 yt-formatted-string",
      "h1.ytd-watch-metadata",
      "h1.title",
      "h1"
    ]);

    if (!title) {
      return null;
    }

    const channel = firstText(document, [
      "ytd-watch-metadata ytd-channel-name a",
      "#owner ytd-channel-name a",
      "#channel-name a"
    ]);

    return {
      videoId: videoIdFromUrl(location.href),
      title,
      channel,
      url: location.href,
      source: "watch-page"
    };
  }

  function getVisibleResultMetadata() {
    return getCandidateCards()
      .map(extractCandidateFromCard)
      .filter(Boolean)
      .filter((candidate) => candidate.url || location.pathname === "/results")
      .map((candidate) => ({
        videoId: candidate.videoId || videoIdFromUrl(candidate.url),
        title: candidate.title,
        channel: candidate.channel,
        duration: candidate.duration,
        url: candidate.url,
        source: "visible-page-structured-metadata"
      }));
  }

  function getRetrievalPipeline() {
    if (state.retrievalPipeline) {
      return state.retrievalPipeline;
    }

    state.retrievalPipeline = retrieval.createExplorationPipeline({
      semantic,
      retrievalProvider: retrieval.createVisiblePageRetrievalProvider({
        getVisibleMetadata: getVisibleResultMetadata,
        logger: debugLog
      }),
      logger: debugLog,
      limit: 5
    });

    debugLog("structured retrieval pipeline initialized", {
      stages: retrieval.PIPELINE_STAGES,
      retrievalSource: state.retrievalPipeline.layers.retrieval.source
    });

    return state.retrievalPipeline;
  }

  function setAnchor(video, source) {
    if (!video || !video.title) {
      warnLog("anchor assignment skipped; missing video title", { source, video });
      return;
    }

    const anchor = semantic.analyzeAnchor(video.title, {
      channel: video.channel || "",
      url: video.url || "",
      source: source || video.source || "card-click",
      capturedAt: new Date().toISOString()
    });

    state.anchor = anchor;
    state.paths = semantic.buildExplorationPaths(anchor);
    state.activePathId = state.paths[0] && state.paths[0].id;
    state.suggestions = [];
    state.scoredResultCount = 0;

    debugLog("contextual anchor assigned", {
      source,
      title: anchor.originalTitle,
      subjectAnchor: anchor.subjectAnchor,
      entities: anchor.namedEntities,
      activePathId: state.activePathId
    });

    persistState();
    scheduleRender();
    scheduleAnnotateVisibleCards("anchor assigned");
  }

  function activePath() {
    return state.paths.find((path) => path.id === state.activePathId) || state.paths[0] || null;
  }

  function handleDocumentClick(event) {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    if (target.closest("#personalabs-panel")) {
      return;
    }

    const card = target.closest(CARD_SELECTOR) || target.closest("a[href*='watch'], a[href*='/shorts/']");
    const candidate = extractCandidateFromCard(card);
    if (candidate) {
      debugLog("youtube click captured as contextual anchor", describeCard(card, candidate));
      setAnchor(candidate, "youtube-click");
    } else if (card) {
      warnLog("youtube click matched a possible card but no candidate could be extracted", {
        tag: card.tagName,
        text: normalizeText(card.textContent).slice(0, 120)
      });
    }
  }

  function handleExplore(pathId) {
    const path = state.paths.find((item) => item.id === pathId);
    if (!path) {
      return;
    }

    state.activePathId = path.id;
    state.suggestions = [];
    state.scoredResultCount = 0;
    persistState();
    scheduleRender();
    window.location.assign(path.url);
  }

  async function scanVisibleResults() {
    if (!state.anchor) {
      return;
    }

    annotateVisibleCards("scan visible results");

    const path = activePath();
    const pipeline = getRetrievalPipeline();
    let explorationSet;

    try {
      explorationSet = await pipeline.run({
        anchor: state.anchor,
        lensId: path && path.id,
        limit: 5
      });
    } catch (error) {
      warnLog("structured retrieval pipeline failed", {
        message: error && error.message,
        stack: error && error.stack
      });
      state.suggestions = [];
      state.scoredResultCount = 0;
      scheduleRender();
      return;
    }

    state.lastRetrievalSource = explorationSet.retrieval.source;
    state.lastPipelineStages = explorationSet.pipeline;

    debugLog("structured retrieval pipeline result", {
      source: explorationSet.retrieval.source,
      mode: explorationSet.retrieval.mode,
      query: explorationSet.transformedQuery.query,
      retrieved: explorationSet.retrieval.items.length,
      activeLens: explorationSet.lens && (explorationSet.lens.lensLabel || explorationSet.lens.label),
      location: location.href
    });

    if (explorationSet.retrieval.items.length === 0) {
      state.suggestions = [];
      state.scoredResultCount = 0;
      warnLog("retrieval pipeline found no structured metadata candidates", {
        source: explorationSet.retrieval.source,
        mode: explorationSet.retrieval.mode,
        path: location.pathname
      });
      scheduleRender();
      return;
    }

    explorationSet.scored.forEach((item) => {
      const trace = createTrace(item, "panel", explorationSet.lens);
      item.personaLabsTrace = trace;
      recordTraceStage(trace, "video/card detected", {
        source: explorationSet.retrieval.source,
        mode: explorationSet.retrieval.mode
      }, { once: true });
      recordTraceStage(trace, "metadata extracted", {
        videoId: item.videoId || videoIdFromUrl(item.url),
        title: item.title,
        channel: item.channel,
        duration: item.duration,
        url: item.url,
        source: item.source || explorationSet.retrieval.source
      }, { once: true });
      recordTraceStage(trace, "semantic scoring started", {
        lens: selectedLensLabel(explorationSet.lens),
        pipeline: explorationSet.pipeline
      }, { once: true });
      updateTraceFromScoring(trace, item.scoring, null, null, "panel");
      recordTraceStage(trace, "domain/tone/friction signals matched", {
        domain: trace && trace.domain,
        matchedSignals: trace && trace.matchedSignals
      }, { once: true });
      recordTraceStage(trace, "suppression/override rules applied", {
        suppressedSignals: trace && trace.suppressedSignals,
        finalReason: item.scoring && item.scoring.finalReason
      }, { once: true });
      recordTraceStage(trace, "final classification selected", {
        label: trace && trace.label,
        confidence: trace && trace.confidence,
        explanation: trace && trace.explanation
      }, { once: true });
    });

    state.suggestions = explorationSet.suggestions;
    state.scoredResultCount = explorationSet.scored.length;
    debugLog("score-first/filter-second pipeline completed", {
      scored: explorationSet.scored.map((item) => ({
        title: item.title,
        score: item.scoring.score,
        color: item.scoring.label,
        allowed: explorationSet.suggestions.includes(item)
      })),
      suggestions: explorationSet.suggestions.length
    });
    scheduleRender();
  }

  function annotateVisibleCards(reason) {
    const cards = getCandidateCards();
    let renderedCount = 0;
    let skippedCount = 0;

    debugLog("annotating visible cards", {
      reason,
      cardCount: cards.length,
      href: location.href
    });

    cards.forEach((card, index) => {
      const candidate = extractCandidateFromCard(card);
      if (!candidate) {
        skippedCount += 1;
        warnLog("card skipped; candidate extraction failed", {
          index,
          tag: card && card.tagName,
          text: normalizeText(card && card.textContent).slice(0, 120)
        });
        return;
      }

      const titleKey = `${candidate.title}:${candidate.channel || "no-channel"}:${state.anchor ? state.anchor.subjectAnchor : "no-anchor"}:${state.activePathId || "no-lens"}`;
      const existingOverlay = card.querySelector(".personalabs-classification-overlay");
      const existingBadge = card.querySelector(".personalabs-observability-badge");
      if (card.dataset.personaLabsTitle === titleKey && existingOverlay && existingBadge) {
        renderedCount += 1;
        return;
      }

      const trace = createTrace(candidate, "overlay", activePath());
      recordTraceStage(trace, "video/card detected", describeCard(card, candidate), { once: true });
      recordTraceStage(trace, "metadata extracted", {
        videoId: candidate.videoId || videoIdFromUrl(candidate.url),
        title: candidate.title,
        channel: candidate.channel,
        duration: candidate.duration,
        url: candidate.url
      }, { once: true });

      card.dataset.personaLabsTitle = titleKey;
      recordTraceStage(trace, "semantic scoring started", {
        lens: selectedLensLabel(activePath()),
        hasAnchor: Boolean(state.anchor)
      }, { once: true });
      const scoring = semantic.scoreContent({
        candidate,
        anchor: state.anchor || candidate.title,
        lens: activePath(),
        scoringPath: "overlay"
      });
      const styleSignals = semantic.classifyStyleTerms(candidate.title);
      updateTraceFromScoring(trace, scoring, null, null, "overlay");
      recordTraceStage(trace, "domain/tone/friction signals matched", {
        domain: trace && trace.domain,
        matchedSignals: trace && trace.matchedSignals,
        styleSignals
      }, { once: true });
      recordTraceStage(trace, "suppression/override rules applied", {
        suppressedSignals: trace && trace.suppressedSignals,
        semanticOverrides: scoring.semanticSignals && scoring.semanticSignals.semanticOverrides,
        contradictions: scoring.contradictions
      }, { once: true });
      recordTraceStage(trace, "final classification selected", {
        label: trace && trace.label,
        confidence: trace && trace.confidence,
        explanation: trace && trace.explanation
      }, { once: true });
      const label = `PL ${scoring.label}`;
      const category = scoring.label.toLowerCase();
      const details = {
        ...describeCard(card, candidate),
        traceId: trace && trace.traceId,
        canonicalScore: scoring.score,
        canonicalLabel: scoring.label,
        matchedTerms: scoring.matchedTerms,
        contradictions: scoring.contradictions,
        category,
        label
      };

      debugLog("assigned deterministic classification", details);

      const titleBadgeCreated = upsertTitleBadge(card, label, category, scoring);
      const overlayCreated = upsertThumbnailOverlay(card, label, category, scoring);

      if (titleBadgeCreated || overlayCreated) {
        renderedCount += 1;
        debugLog("overlay/badge render result", {
          traceId: trace && trace.traceId,
          title: candidate.title,
          titleBadgeCreated,
          overlayCreated,
          category
        });
        recordTraceStage(trace, "overlay rendered", {
          titleBadgeCreated,
          overlayCreated,
          category
        }, { once: true });
        attemptDatabaseTraceSave(trace);
      } else {
        skippedCount += 1;
        warnLog("overlay creation failed for detected card", details);
      }
    });

    debugLog("annotation pass complete", {
      reason,
      cardCount: cards.length,
      renderedCount,
      skippedCount
    });

    if (personaLabsDebugEnabled() && renderedCount > 0) {
      scheduleRender();
    }
  }

  function confidenceNumber(value) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return Math.max(0, Math.min(100, Math.round(numeric)));
    }

    const label = String(value || "").toLowerCase();
    if (label === "high") {
      return 85;
    }
    if (label === "medium") {
      return 60;
    }
    if (label === "low") {
      return 30;
    }
    if (label === "uncertain") {
      return 40;
    }
    return 0;
  }

  function formatConfidence(value) {
    return `${confidenceNumber(value)}/100`;
  }

  function classificationConfidence(scoring, visibleOverlay) {
    return {
      confidence: scoring ? scoring.confidence : confidenceNumber(visibleOverlay && visibleOverlay.confidence),
      domainConfidence: scoring ? scoring.domainConfidence : "",
      frictionConfidence: scoring ? scoring.frictionConfidence : "",
      positiveSignalConfidence: scoring ? scoring.positiveSignalConfidence : "",
      finalReason: scoring && scoring.finalReason ? scoring.finalReason : (visibleOverlay && visibleOverlay.reason) || ""
    };
  }

  function formatCanonicalTooltip(scoring) {
    const confidence = classificationConfidence(scoring);
    const matched = [
      scoring.matchedTerms && scoring.matchedTerms.positive.length ? `positive: ${scoring.matchedTerms.positive.join(", ")}` : "",
      scoring.matchedTerms && scoring.matchedTerms.friction.length ? `friction: ${scoring.matchedTerms.friction.join(", ")}` : ""
    ].filter(Boolean).join(" | ");

    return [
      `Visible overlay: ${scoring.label} (${formatConfidence(confidence.confidence)}).`,
      `Confidence: ${formatConfidence(confidence.confidence)}.`,
      `Domain confidence: ${formatConfidence(confidence.domainConfidence)}.`,
      `Friction confidence: ${formatConfidence(confidence.frictionConfidence)}.`,
      `Positive-signal confidence: ${formatConfidence(confidence.positiveSignalConfidence)}.`,
      confidence.finalReason ? `Final reason: ${confidence.finalReason}.` : "",
      `Canonical score: ${scoring.score}.`,
      matched ? `Matched terms: ${matched}.` : "Matched terms: none.",
      scoring.suppressedTerms && scoring.suppressedTerms.length ? `Suppressed terms: ${scoring.suppressedTerms.join(", ")}.` : "",
      scoring.contradictions && scoring.contradictions.length ? `Contradictions: ${scoring.contradictions.join(" | ")}.` : ""
    ]
      .filter(Boolean)
      .join("\n");
  }

  function renderCanonicalOverlay(label, scoring) {
    const confidence = classificationConfidence(scoring);
    const matched = [
      ...((scoring.matchedTerms && scoring.matchedTerms.positive) || []),
      ...((scoring.matchedTerms && scoring.matchedTerms.friction) || [])
    ].slice(0, 4).join(", ") || "no matched terms";
    const confidenceDetails = `Domain ${formatConfidence(confidence.domainConfidence)} / Friction ${formatConfidence(confidence.frictionConfidence)} / Positive ${formatConfidence(confidence.positiveSignalConfidence)}`;

    return [
      `<span class="personalabs-overlay-label">${escapeHtml(label)}</span>`,
      `<span class="personalabs-overlay-confidence">Confidence ${escapeHtml(formatConfidence(confidence.confidence))}</span>`,
      `<span class="personalabs-overlay-confidence">${escapeHtml(confidenceDetails)}</span>`,
      `<span class="personalabs-overlay-breakdown">Score ${scoring.score} / ${escapeHtml(scoring.domain)}</span>`,
      `<span class="personalabs-overlay-reason">${escapeHtml(scoring.explanation || scoring.finalReason)}</span>`,
      `<span class="personalabs-overlay-terms">${escapeHtml(matched)}</span>`
    ].filter(Boolean).join("");
  }

  function upsertTitleBadge(card, label, category, scoring) {
    const titleElement = findTitleElement(card);
    if (!titleElement) {
      warnLog("title badge skipped; no title element found", { tag: card && card.tagName });
      return false;
    }

    let badge = card.querySelector(".personalabs-observability-badge");
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "personalabs-observability-badge";
      titleElement.insertAdjacentElement("afterend", badge);
    }

    badge.textContent = label;
    badge.dataset.signal = category;
    badge.title = formatCanonicalTooltip(scoring);

    return badge.isConnected;
  }

  function findThumbnailHost(card) {
    if (!card || !(card instanceof Element)) {
      return null;
    }

    if (card.matches(THUMBNAIL_HOST_SELECTOR)) {
      return card;
    }

    return (
      card.querySelector(THUMBNAIL_HOST_SELECTOR) ||
      card.querySelector("a[href*='watch'], a[href*='/shorts/']") ||
      card
    );
  }

  function upsertThumbnailOverlay(card, label, category, scoring) {
    const host = findThumbnailHost(card);
    if (!host) {
      warnLog("thumbnail overlay skipped; no host found", { tag: card && card.tagName });
      return false;
    }

    host.classList.add("personalabs-overlay-host");

    let overlay = card.querySelector(".personalabs-classification-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "personalabs-classification-overlay";
      host.appendChild(overlay);
    } else if (overlay.parentElement !== host) {
      host.appendChild(overlay);
    }

    overlay.innerHTML = renderCanonicalOverlay(label, scoring);
    overlay.dataset.signal = category;
    overlay.title = formatCanonicalTooltip(scoring);

    return overlay.isConnected;
  }

  function createPanel() {
    if (state.panel && state.panel.isConnected) {
      return state.panel;
    }

    const panel = state.panel || document.createElement("aside");
    const mount = document.body || document.documentElement;
    panel.id = "personalabs-panel";
    panel.setAttribute("aria-label", "PersonaLabs semantic navigation panel");
    mount.appendChild(panel);
    state.panel = panel;
    debugLog("control panel mounted", {
      mountTag: mount.tagName,
      connected: panel.isConnected
    });
    return panel;
  }

  function renderPanel() {
    const panel = createPanel();
    const anchor = state.anchor;
    const path = activePath();

    panel.innerHTML = "";
    panel.appendChild(renderHeader());

    if (!anchor) {
      panel.appendChild(renderEmptyState());
      if (personaLabsDebugEnabled()) {
        panel.appendChild(renderDebugTraces());
      }
      return;
    }

    panel.appendChild(renderAnchor(anchor));
    panel.appendChild(renderPaths(path));
    panel.appendChild(renderSuggestions());
    panel.appendChild(renderPrinciples());
    if (personaLabsDebugEnabled()) {
      panel.appendChild(renderDebugTraces());
    }
  }

  function renderHeader() {
    const header = document.createElement("section");
    header.className = "personalabs-section personalabs-header";
    header.innerHTML = [
      "<div>",
      "<p class='personalabs-eyebrow'>PersonaLabs</p>",
      "<h2>Observability-driven semantic navigation</h2>",
      "</div>",
      "<p class='personalabs-muted'>Structured retrieval. Deterministic scoring. Lens-aware navigation.</p>"
    ].join("");
    return header;
  }

  function renderEmptyState() {
    const section = document.createElement("section");
    section.className = "personalabs-section personalabs-empty";
    section.innerHTML = [
      "<h3>No contextual anchor yet</h3>",
      "<p>Click a YouTube video or card to anchor exploration. PersonaLabs will extract entities, detect observability signals, remove escalation wording, and offer subject-preserving paths.</p>"
    ].join("");
    return section;
  }

  function renderAnchor(anchor) {
    const section = document.createElement("section");
    section.className = "personalabs-section";

    const removedTerms = anchor.removedEscalationTerms || [];
    const removedHtml = removedTerms.length
      ? removedTerms
          .map((item) => `<li><span>${escapeHtml(item.term)}</span><em>${escapeHtml(item.category)}</em></li>`)
          .join("")
      : "<li><span>None detected</span><em>calm</em></li>";

    const entityHtml = (anchor.namedEntities || []).length
      ? anchor.namedEntities.map((entity) => `<span class='personalabs-chip'>${escapeHtml(entity)}</span>`).join("")
      : "<span class='personalabs-chip'>Subject terms only</span>";

    section.innerHTML = [
      "<p class='personalabs-eyebrow'>Selected contextual anchor</p>",
      `<h3>${escapeHtml(anchor.originalTitle)}</h3>`,
      "<div class='personalabs-field'>",
      "<span>Extracted subject anchor</span>",
      `<strong>${escapeHtml(anchor.subjectAnchor)}</strong>`,
      "</div>",
      "<div class='personalabs-chip-row'>",
      entityHtml,
      "</div>",
      "<div class='personalabs-field'>",
      "<span>Removed escalation terms</span>",
      `<ul class='personalabs-term-list'>${removedHtml}</ul>`,
      "</div>",
      "<div class='personalabs-field'>",
      "<span>Detected observability signals</span>",
      `<strong>${escapeHtml(renderSignalSummary(anchor))}</strong>`,
      "</div>"
    ].join("");

    return section;
  }

  function renderPaths(path) {
    const section = document.createElement("section");
    section.className = "personalabs-section";

    const title = document.createElement("div");
    title.innerHTML = [
      "<p class='personalabs-eyebrow'>Transformed exploration paths</p>",
      "<h3>Keep the subject. Change the route.</h3>"
    ].join("");
    section.appendChild(title);

    const controls = document.createElement("div");
    controls.className = "personalabs-controls";

    state.paths.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "personalabs-path-button";
      button.dataset.active = path && path.id === item.id ? "true" : "false";
      button.textContent = item.buttonLabel;
      button.addEventListener("click", () => handleExplore(item.id));
      controls.appendChild(button);
    });

    section.appendChild(controls);

    if (path) {
      const query = document.createElement("div");
      query.className = "personalabs-query";
      query.innerHTML = [
        `<span>${escapeHtml(path.description)}</span>`,
        `<code>${escapeHtml(path.query)}</code>`,
        `<small>Selected exploration lens: ${escapeHtml(path.lensLabel || path.label)} | Filter: ${escapeHtml(describeFilterPolicy(path.filterPolicy))}</small>`
      ].join("");
      section.appendChild(query);
    }

    return section;
  }

  function renderSuggestions() {
    const section = document.createElement("section");
    section.className = "personalabs-section";

    const intro = document.createElement("div");
    intro.innerHTML = [
      "<p class='personalabs-eyebrow'>Exploration Result Filtering</p>",
      "<h3>Suggested Exploration Paths</h3>",
      `<p class='personalabs-muted'>${escapeHtml(renderFilteringSummary())}</p>`
    ].join("");
    section.appendChild(intro);

    if (!state.suggestions.length) {
      const empty = document.createElement("p");
      empty.className = "personalabs-muted";
      empty.textContent = "Open a transformed search to retrieve structured metadata, score every result first, then apply the selected exploration lens filter.";
      section.appendChild(empty);
      return section;
    }

    const list = document.createElement("ol");
    list.className = "personalabs-suggestion-list";

    state.suggestions.forEach((suggestion) => {
      const item = document.createElement("li");
      const link = suggestion.url ? `<a href='${escapeAttribute(suggestion.url)}'>${escapeHtml(suggestion.title)}</a>` : escapeHtml(suggestion.title);
      const confidence = classificationConfidence(suggestion.scoring);
      const trace = suggestion.personaLabsTrace;
      const reasons = suggestion.scoring.reasons
        .slice(0, 3)
        .map((reason) => `<span>${escapeHtml(reason)}</span>`)
        .join("");
      const color = suggestion.scoring.label.toLowerCase();

      item.dataset.classification = color;
      item.innerHTML = [
        `<div class='personalabs-score' data-classification='${color}'>${suggestion.scoring.score}</div>`,
        "<div>",
        `<div class='personalabs-classification' data-classification='${color}'>${escapeHtml(suggestion.scoring.label)} | ${escapeHtml(suggestion.scoring.classification.label)} | Confidence ${escapeHtml(formatConfidence(confidence.confidence))}</div>`,
        `<h4>${link}</h4>`,
        `<p>${escapeHtml(suggestion.channel || "Visible YouTube result")}</p>`,
        `<div class='personalabs-confidence-details'>Domain ${escapeHtml(formatConfidence(confidence.domainConfidence))} | Friction ${escapeHtml(formatConfidence(confidence.frictionConfidence))} | Positive ${escapeHtml(formatConfidence(confidence.positiveSignalConfidence))}</div>`,
        `<p class='personalabs-final-reason'>Final reason: ${escapeHtml(suggestion.scoring.explanation || confidence.finalReason || suggestion.scoring.classification.reason || "classification reason unavailable")}</p>`,
        `<div class='personalabs-reasons'>${reasons}</div>`,
        "</div>"
      ].join("");
      list.appendChild(item);
      recordTraceStage(trace, "panel recommendation rendered", {
        title: suggestion.title,
        color: suggestion.scoring.label,
        confidence: suggestion.scoring.confidence
      }, { once: true });
      attemptDatabaseTraceSave(trace);
    });

    section.appendChild(list);
    return section;
  }

  function renderPrinciples() {
    const section = document.createElement("section");
    section.className = "personalabs-section personalabs-principles";
    section.innerHTML = [
      "<p class='personalabs-eyebrow'>Operating principles</p>",
      "<ul>",
      "<li>Deterministic-first and local-first.</li>",
      "<li>No truth, ideology ranking, censorship, or YouTube replacement judgments.</li>",
      "<li>Score first; filter second by the selected exploration lens.</li>",
      "<li>GREEN is allowed for calmer/lower-friction exploration.</li>",
      "<li>YELLOW is mixed but can support educational or deeper exploration.</li>",
      "<li>RED is high-friction/escalatory and excluded from suggestions.</li>",
      "<li>Contextual observability badges support guided exploration.</li>",
      "</ul>"
    ].join("");
    return section;
  }

  function renderDebugTraces() {
    const section = document.createElement("section");
    section.className = "personalabs-section personalabs-debug-traces";
    const json = JSON.stringify(state.traces, null, 2);
    const latest = state.traces[0];
    const summary = latest
      ? `${state.traces.length} traces captured. Latest: ${latest.label || "pending"} ${latest.title || "untitled"}`
      : "No traces captured yet.";

    section.innerHTML = [
      "<p class='personalabs-eyebrow'>Debug Traces</p>",
      "<h3>Classification trace log</h3>",
      `<p class='personalabs-muted'>${escapeHtml(summary)}</p>`,
      "<div class='personalabs-debug-actions'>",
      "<button type='button' data-action='copy-traces'>Copy JSON</button>",
      "<button type='button' data-action='export-traces'>Export JSON</button>",
      "</div>",
      `<pre>${escapeHtml(json || "[]")}</pre>`
    ].join("");

    const copyButton = section.querySelector("[data-action='copy-traces']");
    const exportButton = section.querySelector("[data-action='export-traces']");

    copyButton.addEventListener("click", () => {
      const payload = JSON.stringify(state.traces, null, 2);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(payload);
      }
    });

    exportButton.addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(state.traces, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "personalabs-debug-traces.json";
      link.click();
      URL.revokeObjectURL(url);
    });

    return section;
  }

  function renderSignalSummary(anchor) {
    const signals = semantic.detectObservabilitySignals(anchor.originalTitle || "");
    const parts = [];
    if (signals.friction.length) {
      parts.push(`${signals.friction.length} friction`);
    }
    if (signals.educational.length) {
      parts.push(`${signals.educational.length} educational`);
    }
    if (signals.lowFriction.length) {
      parts.push(`${signals.lowFriction.length} low-friction`);
    }

    return parts.length ? parts.join(", ") : "calm/low-friction baseline";
  }

  function describeFilterPolicy(policy) {
    if (policy === "green-only") {
      return "GREEN only";
    }
    if (policy === "green-or-explanatory-yellow") {
      return "GREEN plus strong explanatory YELLOW";
    }
    if (policy === "green-or-deep-yellow") {
      return "GREEN plus high-quality relevant YELLOW";
    }
    if (policy === "green-or-simple-yellow") {
      return "GREEN plus simple explanatory YELLOW";
    }
    if (policy === "green-or-longform-yellow") {
      return "GREEN plus relevant long-form YELLOW";
    }
    return "GREEN only";
  }

  function renderFilteringSummary() {
    const path = activePath();
    if (!path) {
      return "No exploration lens selected.";
    }

    if (!state.scoredResultCount) {
      return `Lens: ${path.lensLabel || path.label}. Retrieve structured metadata, score first, then filter.`;
    }

    return `Lens: ${path.lensLabel || path.label}. ${state.lastRetrievalSource || "retrieval"} scored ${state.scoredResultCount} results; showing ${state.suggestions.length} allowed by ${describeFilterPolicy(path.filterPolicy)}.`;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }

  function observePageChanges() {
    if (state.observer) {
      state.observer.disconnect();
      debugLog("existing MutationObserver disconnected before reattach");
    }

    const observer = new MutationObserver(() => {
      state.mutationCount += 1;
      if (state.mutationCount <= 10 || state.mutationCount % 25 === 0) {
        debugLog("MutationObserver callback", {
          mutationCount: state.mutationCount,
          href: location.href
        });
      }

      if (state.lastUrl !== location.href) {
        debugLog("YouTube SPA URL change detected by MutationObserver", {
          from: state.lastUrl,
          to: location.href
        });
        state.lastUrl = location.href;
        createPanel();
        scheduleRender();
        maybeAnchorCurrentWatchPage();
      }
      scheduleAnnotateVisibleCards("mutation observer");
      if (location.pathname === "/results") {
        scheduleScan();
      }
    });

    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });
    state.observer = observer;
    debugLog("MutationObserver attached", {
      target: (document.body || document.documentElement).tagName,
      href: location.href
    });

    window.addEventListener("popstate", () => {
      debugLog("popstate navigation event", { href: location.href });
      state.lastUrl = location.href;
      createPanel();
      scheduleRender();
      maybeAnchorCurrentWatchPage();
      scheduleAnnotateVisibleCards("popstate");
      scheduleScan();
    });

    YOUTUBE_SPA_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, () => {
        debugLog(`YouTube SPA event: ${eventName}`, { href: location.href });
        state.lastUrl = location.href;
        createPanel();
        scheduleRender();
        maybeAnchorCurrentWatchPage();
        scheduleAnnotateVisibleCards(eventName);
        scheduleScan();
      });
    });
  }

  function maybeAnchorCurrentWatchPage() {
    if (location.pathname !== "/watch") {
      return;
    }

    window.setTimeout(() => {
      const video = extractCurrentWatchVideo();
      if (!video) {
        warnLog("watch page anchor extraction found no video title", { href: location.href });
        return;
      }

      if (!state.anchor || state.anchor.originalTitle !== video.title) {
        debugLog("watch page video detected as contextual anchor", video);
        setAnchor(video, "watch-page");
      }
    }, 400);
  }

  function init() {
    debugLog("initializing content runtime", {
      href: location.href,
      readyState: document.readyState,
      hasBody: Boolean(document.body)
    });
    loadState();
    createPanel();
    renderPanel();
    document.addEventListener("click", handleDocumentClick, true);
    observePageChanges();
    maybeAnchorCurrentWatchPage();
    scheduleAnnotateVisibleCards("init");
    scheduleScan();
  }

  init();
})();

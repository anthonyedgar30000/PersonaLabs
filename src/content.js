(function initializePersonaLabs() {
  "use strict";

  const semantic = window.PersonaLabsSemantic;
  if (!semantic || window.__personaLabsSemanticNavigationLoaded) {
    return;
  }

  window.__personaLabsSemanticNavigationLoaded = true;

  const STORAGE_KEY = "personaLabsSemanticNavigation";
  const CARD_SELECTOR = [
    "ytd-rich-item-renderer",
    "ytd-video-renderer",
    "ytd-grid-video-renderer",
    "ytd-compact-video-renderer",
    "ytd-reel-item-renderer",
    "ytd-playlist-video-renderer",
    "ytd-radio-renderer"
  ].join(",");
  const TITLE_SELECTOR = [
    "#video-title",
    "a#video-title",
    "yt-formatted-string#video-title",
    "h3 a[href*='watch']",
    "a[href*='watch']"
  ].join(",");

  const state = {
    anchor: null,
    paths: [],
    activePathId: null,
    suggestions: [],
    scoredResultCount: 0,
    lastUrl: location.href,
    panel: null,
    scanTimer: null,
    renderTimer: null
  };

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
    state.paths = Array.isArray(payload.paths) ? payload.paths : semantic.buildExplorationPaths(payload.anchor);
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

  function extractCandidateFromCard(card) {
    if (!card) {
      return null;
    }

    const titleElement = card.matches(TITLE_SELECTOR) ? card : card.querySelector(TITLE_SELECTOR);
    const title =
      normalizeText(
        (titleElement && (titleElement.getAttribute("title") || titleElement.textContent || titleElement.getAttribute("aria-label"))) ||
          firstText(card, ["#video-title", "yt-formatted-string#video-title", "h3", "a[href*='watch']"])
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
    const link = titleElement && titleElement.getAttribute("href");

    return {
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
      title,
      channel,
      url: location.href,
      source: "watch-page"
    };
  }

  function setAnchor(video, source) {
    if (!video || !video.title) {
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

    persistState();
    scheduleRender();
    annotateVisibleCards();
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

    const card = target.closest(CARD_SELECTOR) || target.closest("a[href*='watch']");
    const candidate = extractCandidateFromCard(card);
    if (candidate) {
      setAnchor(candidate, "youtube-click");
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

  function scanVisibleResults() {
    if (!state.anchor) {
      return;
    }

    annotateVisibleCards();

    const path = activePath();
    const cards = Array.from(document.querySelectorAll(CARD_SELECTOR));
    const candidates = cards
      .map(extractCandidateFromCard)
      .filter(Boolean)
      .filter((candidate) => candidate.url || location.pathname === "/results");

    if (candidates.length === 0) {
      state.suggestions = [];
      scheduleRender();
      return;
    }

    const explorationSet = semantic.buildIntentionalExplorationSet(candidates, state.anchor, path, 5);
    state.suggestions = explorationSet.suggestions;
    state.scoredResultCount = explorationSet.scored.length;
    scheduleRender();
  }

  function annotateVisibleCards() {
    const cards = Array.from(document.querySelectorAll(CARD_SELECTOR));
    cards.forEach((card) => {
      const candidate = extractCandidateFromCard(card);
      if (!candidate) {
        return;
      }

      const titleKey = `${candidate.title}:${state.anchor ? state.anchor.subjectAnchor : "no-anchor"}:${state.activePathId || "no-lens"}`;
      if (card.dataset.personaLabsTitle === titleKey) {
        return;
      }

      card.dataset.personaLabsTitle = titleKey;
      const titleElement = card.querySelector(TITLE_SELECTOR);
      if (!titleElement) {
        return;
      }

      let badge = card.querySelector(".personalabs-observability-badge");
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "personalabs-observability-badge";
        titleElement.insertAdjacentElement("afterend", badge);
      }

      const scoring = state.anchor ? semantic.scoreCandidate(candidate, state.anchor, activePath()) : null;
      const styleSignals = semantic.classifyStyleTerms(candidate.title);
      const label = scoring === null ? (styleSignals.length ? "PL style signal" : "PL calm signal") : `PL ${scoring.classification.color} ${scoring.score}`;
      const category = scoring === null ? (styleSignals.length ? "yellow" : "green") : scoring.classification.color.toLowerCase();

      badge.textContent = label;
      badge.dataset.signal = category;
      badge.title =
        scoring === null
          ? "PersonaLabs contextual observability signal"
          : scoring.classification.meaning;
    });
  }

  function createPanel() {
    if (state.panel) {
      return state.panel;
    }

    const panel = document.createElement("aside");
    panel.id = "personalabs-panel";
    panel.setAttribute("aria-label", "PersonaLabs semantic navigation panel");
    document.documentElement.appendChild(panel);
    state.panel = panel;
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
      return;
    }

    panel.appendChild(renderAnchor(anchor));
    panel.appendChild(renderPaths(path));
    panel.appendChild(renderSuggestions());
    panel.appendChild(renderPrinciples());
  }

  function renderHeader() {
    const header = document.createElement("section");
    header.className = "personalabs-section personalabs-header";
    header.innerHTML = [
      "<div>",
      "<p class='personalabs-eyebrow'>PersonaLabs</p>",
      "<h2>Observability-driven semantic navigation</h2>",
      "</div>",
      "<p class='personalabs-muted'>Score first. Filter second. Topic, event, and entities stay anchored.</p>"
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
      empty.textContent = "Open a transformed search to scan visible YouTube results, score every result first, then apply the selected exploration lens filter.";
      section.appendChild(empty);
      return section;
    }

    const list = document.createElement("ol");
    list.className = "personalabs-suggestion-list";

    state.suggestions.forEach((suggestion) => {
      const item = document.createElement("li");
      const link = suggestion.url ? `<a href='${escapeAttribute(suggestion.url)}'>${escapeHtml(suggestion.title)}</a>` : escapeHtml(suggestion.title);
      const reasons = suggestion.scoring.reasons
        .slice(0, 3)
        .map((reason) => `<span>${escapeHtml(reason)}</span>`)
        .join("");
      const color = suggestion.scoring.classification.color.toLowerCase();

      item.dataset.classification = color;
      item.innerHTML = [
        `<div class='personalabs-score' data-classification='${color}'>${suggestion.scoring.score}</div>`,
        "<div>",
        `<div class='personalabs-classification' data-classification='${color}'>${escapeHtml(suggestion.scoring.classification.color)} | ${escapeHtml(suggestion.scoring.classification.label)}</div>`,
        `<h4>${link}</h4>`,
        `<p>${escapeHtml(suggestion.channel || "Visible YouTube result")}</p>`,
        `<div class='personalabs-reasons'>${reasons}</div>`,
        "</div>"
      ].join("");
      list.appendChild(item);
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
      return `Lens: ${path.lensLabel || path.label}. Score first, then filter visible results.`;
    }

    return `Lens: ${path.lensLabel || path.label}. Scored ${state.scoredResultCount} visible results; showing ${state.suggestions.length} allowed by ${describeFilterPolicy(path.filterPolicy)}.`;
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
    const observer = new MutationObserver(() => {
      if (state.lastUrl !== location.href) {
        state.lastUrl = location.href;
        maybeAnchorCurrentWatchPage();
      }
      annotateVisibleCards();
      if (location.pathname === "/results") {
        scheduleScan();
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    window.addEventListener("popstate", () => {
      state.lastUrl = location.href;
      maybeAnchorCurrentWatchPage();
      scheduleScan();
    });
  }

  function maybeAnchorCurrentWatchPage() {
    if (location.pathname !== "/watch") {
      return;
    }

    window.setTimeout(() => {
      const video = extractCurrentWatchVideo();
      if (!video) {
        return;
      }

      if (!state.anchor || state.anchor.originalTitle !== video.title) {
        setAnchor(video, "watch-page");
      }
    }, 400);
  }

  function init() {
    loadState();
    createPanel();
    renderPanel();
    document.addEventListener("click", handleDocumentClick, true);
    observePageChanges();
    maybeAnchorCurrentWatchPage();
    annotateVisibleCards();
    scheduleScan();
  }

  init();
})();

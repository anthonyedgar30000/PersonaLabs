(function (root) {
  "use strict";

  const HIGH_FRICTION_REWRITES = [
    ["exposed", "analysis"],
    ["destroyed", "discussion"],
    ["panic", "overview"],
    ["shocking", "explained"],
    ["meltdown", "analysis"],
    ["humiliation", "interview"],
    ["breaking", "update"],
    ["disaster", "context"],
    ["destroys", "discussion"],
    ["destroy", "discussion"],
    ["obliterated", "overview"],
    ["annihilated", "overview"],
    ["insane", "overview"],
    ["crazy", "overview"],
    ["scandal", "analysis"],
    ["urgent", "update"],
    ["must watch", "explanation"]
  ];

  const PRESETS = {
    calmer: {
      id: "calmer",
      label: "Calmer",
      suffix: "calm discussion",
      removeTerms: ["urgent", "shocking"]
    },
    moreEducational: {
      id: "moreEducational",
      label: "More educational",
      suffix: "educational explanation overview",
      prefix: "learn"
    },
    lessSensational: {
      id: "lessSensational",
      label: "Less sensational",
      suffix: "balanced analysis context",
      removeTerms: ["must watch", "insane", "crazy"]
    },
    beginnerFriendly: {
      id: "beginnerFriendly",
      label: "More beginner-friendly",
      suffix: "beginner friendly explanation basics",
      prefix: "intro to"
    }
  };

  function rewriteTitle(title, presetId) {
    const preset = PRESETS[presetId] || PRESETS.calmer;
    const originalTitle = normalizeTitle(title);
    const baseQuery = applyPreset(originalTitle, preset);
    const transformedQuery = appendUniqueTerms(baseQuery, preset.suffix);

    return {
      originalTitle,
      transformedQuery,
      preset: preset.id,
      presetLabel: preset.label
    };
  }

  function searchUrlFor(title, presetId) {
    const result = rewriteTitle(title, presetId);
    return {
      ...result,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(
        result.transformedQuery
      )}`
    };
  }

  function applyPreset(title, preset) {
    const rewrittenTitle = rewriteHighFrictionTerms(title);
    const trimmedTitle = removePresetTerms(rewrittenTitle, preset.removeTerms || []);
    return [preset.prefix || "", trimmedTitle].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  }

  function rewriteHighFrictionTerms(title) {
    return HIGH_FRICTION_REWRITES.reduce((query, [term, replacement]) => {
      return query.replace(new RegExp(`\\b${escapeRegExp(term)}\\b`, "gi"), replacement);
    }, title);
  }

  function removePresetTerms(title, terms) {
    return terms
      .reduce((query, term) => {
        return query.replace(new RegExp(`\\b${escapeRegExp(term)}\\b`, "gi"), " ");
      }, title)
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeTitle(title) {
    return String(title || "")
      .replace(/[!?]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function appendUniqueTerms(query, suffix) {
    const queryWords = new Set(query.toLowerCase().split(/\s+/).filter(Boolean));
    const suffixWords = suffix.split(/\s+/).filter((word) => !queryWords.has(word.toLowerCase()));
    return [query, suffixWords.join(" ")].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  const api = {
    HIGH_FRICTION_REWRITES,
    PRESETS,
    rewriteTitle,
    searchUrlFor
  };

  root.PersonaLabsQueryRewriting = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);

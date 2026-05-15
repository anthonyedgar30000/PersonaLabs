(function (root) {
  "use strict";

  const HIGH_FRICTION_REWRITES = [
    ["exposed", "analysis"],
    ["destroyed", "discussion"],
    ["destroys", "discussion"],
    ["destroy", "discussion"],
    ["panic", "overview"],
    ["shocking", "explained"],
    ["meltdown", "analysis"],
    ["humiliation", "interview"],
    ["breaking", "context"],
    ["disaster", "context"],
    ["scandal", "long-form interview"],
    ["obliterated", "overview"],
    ["annihilated", "overview"],
    ["insane", "overview"],
    ["crazy", "overview"],
    ["urgent", "context"],
    ["must watch", "explanation"]
  ];

  const PRESETS = {
    calmer: {
      id: "calmer",
      label: "calmer",
      suffix: "calm overview discussion",
      removeTerms: ["urgent", "shocking"]
    },
    moreEducational: {
      id: "moreEducational",
      label: "more educational",
      suffix: "educational explanation overview",
      prefix: "learn"
    },
    lowerFriction: {
      id: "lowerFriction",
      label: "lower friction",
      suffix: "discussion long-form context",
      removeTerms: ["must watch", "insane", "crazy", "urgent"]
    },
    deeperDive: {
      id: "deeperDive",
      label: "deeper dive",
      suffix: "deep dive analysis documentary context",
      extraRewrites: [["debate", "documentary"]]
    },
    beginnerFriendly: {
      id: "beginnerFriendly",
      label: "beginner friendly",
      suffix: "beginner friendly explanation basics",
      prefix: "intro to"
    },
    longerForm: {
      id: "longerForm",
      label: "longer-form",
      suffix: "long-form interview documentary discussion",
      extraRewrites: [["debate", "documentary"]]
    }
  };

  const PRESET_ORDER = [
    "calmer",
    "moreEducational",
    "lowerFriction",
    "deeperDive",
    "beginnerFriendly",
    "longerForm"
  ];

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
    const rewrittenTitle = rewriteHighFrictionTerms(title, preset.extraRewrites || []);
    const trimmedTitle = removePresetTerms(rewrittenTitle, preset.removeTerms || []);
    return [preset.prefix || "", trimmedTitle].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  }

  function rewriteHighFrictionTerms(title, extraRewrites) {
    return HIGH_FRICTION_REWRITES.concat(extraRewrites).reduce((query, [term, replacement]) => {
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
    PRESET_ORDER,
    PRESETS,
    rewriteTitle,
    searchUrlFor
  };

  root.PersonaLabsQueryRewriting = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);

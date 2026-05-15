(function attachHeadlineAnalyzer(root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.PersonaLabsHeadlineAnalyzer = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function createHeadlineAnalyzer() {
  "use strict";

  const GREEN_CHILL_TERMS = {
    animals: 4,
    animal: 4,
    pets: 4,
    pet: 4,
    dog: 4,
    cat: 4,
    puppy: 5,
    kitten: 5,
    rescue: 3,
    wholesome: 5,
    funny: 2,
    relaxing: 5,
    calm: 5,
    cozy: 4,
    nature: 4,
    music: 3,
    cooking: 3,
    gardening: 4,
    restoration: 4,
    art: 3,
    painting: 3,
    meditation: 5,
    sleep: 4,
    comedy: 2,
    peaceful: 5
  };

  const YELLOW_CHILL_TERMS = {
    debate: 3,
    controversy: 4,
    politics: 3,
    election: 3,
    breaking: 3,
    investigation: 3,
    lawsuit: 3,
    argument: 3,
    criticism: 2,
    responds: 2,
    denies: 2,
    allegation: 3,
    allegations: 3,
    drama: 4,
    conflict: 3,
    warning: 3
  };

  const RED_CHILL_TERMS = {
    graphic: 6,
    violence: 6,
    murder: 7,
    death: 6,
    disaster: 5,
    attack: 6,
    war: 5,
    abuse: 7,
    shocking: 5,
    exposed: 5,
    scandal: 5,
    meltdown: 5,
    rage: 5,
    terrifying: 7,
    disturbing: 7
  };

  const PUBLIC_SOURCE_TERMS = {
    "public radio": -2,
    pbs: -2,
    bbc: -2,
    npr: -2,
    educational: -2,
    university: -2,
    documentary: -2,
    lecture: -1,
    institute: -1
  };

  const RISK_SOURCE_TERMS = {
    "the hill": 1,
    gossip: 3,
    drama: 3,
    outrage: 4,
    commentary: 2,
    reaction: 2,
    clips: 1,
    rant: 3
  };

  function normalizeText(value) {
    const normalized = String(value || "")
      .toLowerCase()
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return {
      text: normalized,
      tokens: normalized ? normalized.split(" ") : []
    };
  }

  function hasPhrase(normalizedText, phrase) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|\\s)${escaped}(?=\\s|$)`).test(normalizedText);
  }

  function scoreDictionary(normalizedText, dictionary) {
    const matches = [];
    let score = 0;

    Object.entries(dictionary).forEach(([term, weight]) => {
      if (hasPhrase(normalizedText, term)) {
        matches.push({ term, weight });
        score += weight;
      }
    });

    return { score, matches };
  }

  function sourceAdjustment(source) {
    const normalized = normalizeText(source).text;
    const publicMedia = scoreDictionary(normalized, PUBLIC_SOURCE_TERMS);
    const risk = scoreDictionary(normalized, RISK_SOURCE_TERMS);
    const adjustment = publicMedia.score + risk.score;

    return {
      adjustment,
      publicMediaMatches: publicMedia.matches,
      riskMatches: risk.matches
    };
  }

  function termsList(matches) {
    return matches.map((match) => match.term);
  }

  function buildReasons(label, scores, matchedTerms, source) {
    const reasons = [];

    if (label === "GREEN") {
      const greenTerms = termsList(matchedTerms.green);
      if (greenTerms.some((term) => ["animal", "animals", "pet", "pets", "dog", "cat", "puppy", "kitten"].includes(term))) {
        reasons.push("Marked green because title contains pet/animal and wholesome terms.");
      } else {
        reasons.push(`Marked green because low-friction terms were strongest: ${greenTerms.join(", ") || "none"}.`);
      }
    }

    if (label === "YELLOW") {
      reasons.push(`Marked yellow because title contains controversy terms: ${termsList(matchedTerms.yellow).join(", ") || "moderate risk"}.`);
    }

    if (label === "RED") {
      reasons.push(`Marked red because title contains high-intensity distress terms: ${termsList(matchedTerms.red).join(", ") || "high red score"}.`);
    }

    if (source.publicMediaMatches.length > 0) {
      reasons.push(`Source reduced risk: ${termsList(source.publicMediaMatches).join(", ")}.`);
    }

    if (source.riskMatches.length > 0) {
      reasons.push(`Source increased risk: ${termsList(source.riskMatches).join(", ")}.`);
    }

    reasons.push(`Score breakdown: green ${scores.green_score}, yellow ${scores.yellow_score}, red ${scores.red_score}.`);

    return reasons;
  }

  function classify(scores) {
    if (scores.red_score >= 7 || (scores.red_score >= 5 && scores.red_score >= scores.green_score)) {
      return "RED";
    }

    if (scores.yellow_score >= 5 || (scores.yellow_score >= 3 && scores.yellow_score >= scores.green_score)) {
      return "YELLOW";
    }

    if (scores.green_score >= scores.yellow_score && scores.green_score > scores.red_score) {
      return "GREEN";
    }

    return "YELLOW";
  }

  function analyzeHeadline(title, source, mode) {
    const activeMode = mode || "chill";
    const normalizedTitle = normalizeText(title);
    const green = scoreDictionary(normalizedTitle.text, GREEN_CHILL_TERMS);
    const yellow = scoreDictionary(normalizedTitle.text, YELLOW_CHILL_TERMS);
    const red = scoreDictionary(normalizedTitle.text, RED_CHILL_TERMS);
    const sourceRisk = sourceAdjustment(source);

    const riskAdjustment = sourceRisk.adjustment;
    const yellowSourceRisk = Math.max(0, riskAdjustment);
    const sourceRiskReduction = Math.max(0, Math.abs(Math.min(0, riskAdjustment)));
    const green_score = Math.max(0, green.score + sourceRiskReduction);
    const yellow_score = Math.max(0, yellow.score + yellowSourceRisk - Math.min(2, sourceRiskReduction));
    const red_score = Math.max(0, red.score + Math.max(0, yellowSourceRisk - 1) - sourceRiskReduction);
    const scores = { green_score, yellow_score, red_score };
    const label = classify(scores);
    const matchedTerms = {
      green: green.matches,
      yellow: yellow.matches,
      red: red.matches
    };
    const reasons = buildReasons(label, scores, matchedTerms, sourceRisk);

    return {
      mode: activeMode,
      label,
      color: label.toLowerCase(),
      normalizedTitle: normalizedTitle.text,
      tokens: normalizedTitle.tokens,
      scores,
      matchedTerms,
      sourceAdjustment: sourceRisk,
      reasons,
      explanation: reasons[0]
    };
  }

  return {
    GREEN_CHILL_TERMS,
    YELLOW_CHILL_TERMS,
    RED_CHILL_TERMS,
    PUBLIC_SOURCE_TERMS,
    RISK_SOURCE_TERMS,
    analyzeHeadline,
    normalizeText
  };
});

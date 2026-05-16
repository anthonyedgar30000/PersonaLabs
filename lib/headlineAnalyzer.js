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
    wildlife: 4,
    dog: 4,
    cat: 4,
    bunny: 5,
    bunnies: 5,
    rabbit: 5,
    rabbits: 5,
    hamster: 5,
    hamsters: 5,
    bird: 4,
    birds: 4,
    parrot: 4,
    parrots: 4,
    fish: 4,
    aquarium: 5,
    "guinea pig": 5,
    "mini lop": 5,
    puppy: 5,
    kitten: 5,
    rescue: 3,
    wholesome: 5,
    cute: 4,
    adorable: 4,
    playing: 3,
    zoomies: 3,
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

  const SAFE_ANIMAL_DOMAIN_TERMS = [
    "animals",
    "animal",
    "pets",
    "pet",
    "wildlife",
    "dog",
    "cat",
    "bunny",
    "bunnies",
    "rabbit",
    "rabbits",
    "hamster",
    "hamsters",
    "bird",
    "birds",
    "parrot",
    "parrots",
    "fish",
    "aquarium",
    "guinea pig",
    "mini lop",
    "puppy",
    "kitten"
  ];

  const HARMLESS_ANIMAL_CONTEXT_TERMS = [
    "cute",
    "adorable",
    "wholesome",
    "funny",
    "playing",
    "zoomies",
    "relaxing",
    "calm",
    "peaceful",
    "cozy"
  ];

  const WEAK_SAFE_DOMAIN_YELLOW_TERMS = [
    "argument",
    "criticism",
    "responds",
    "denies",
    "drama",
    "conflict",
    "warning"
  ];

  const CALIBRATION_THRESHOLDS = Object.freeze({
    redAbsolute: 7,
    redDominant: 5,
    yellowAbsolute: 5,
    yellowDominant: 3,
    safeDomainGreenBaseline: 4,
    safeDomainYellowStrong: 6,
    safeDomainYellowMargin: 2
  });

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

  function buildReasons(label, scores, matchedTerms, source, governance) {
    const reasons = [];

    if (label === "GREEN") {
      const greenTerms = termsList(matchedTerms.green);
      if (governance.safeDomain.isSafeAnimalDomain) {
        reasons.push("Marked green because animal/pet/nature safe-domain signals met the calibrated GREEN baseline.");
      } else {
        reasons.push(`Marked green because low-friction terms were strongest: ${greenTerms.join(", ") || "none"}.`);
      }
    }

    if (label === "YELLOW") {
      if (governance.safeDomain.isSafeAnimalDomain) {
        reasons.push(`Marked yellow as uncertain because safe-domain animal content also contains unresolved friction terms: ${termsList(matchedTerms.yellow).join(", ") || "moderate risk"}.`);
      } else {
        reasons.push(`Marked yellow because title contains controversy terms: ${termsList(matchedTerms.yellow).join(", ") || "moderate risk"}.`);
      }
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

    if (governance.suppressedWeakTerms.length > 0) {
      reasons.push(`Suppressed weak harmless-context terms for safe domain: ${governance.suppressedWeakTerms.join(", ")}.`);
    }

    reasons.push(`Confidence: ${governance.confidence}.`);
    reasons.push(`Score breakdown: green ${scores.green_score}, yellow ${scores.yellow_score}, red ${scores.red_score}.`);

    return reasons;
  }

  function classify(scores, governance) {
    if (scores.red_score >= CALIBRATION_THRESHOLDS.redAbsolute || (scores.red_score >= CALIBRATION_THRESHOLDS.redDominant && scores.red_score >= scores.green_score)) {
      return "RED";
    }

    if (governance.safeDomain.isSafeAnimalDomain) {
      if (
        governance.unresolvedYellowScore >= CALIBRATION_THRESHOLDS.safeDomainYellowStrong &&
        governance.unresolvedYellowScore >= scores.green_score + CALIBRATION_THRESHOLDS.safeDomainYellowMargin
      ) {
        return "YELLOW";
      }

      if (scores.green_score >= CALIBRATION_THRESHOLDS.safeDomainGreenBaseline && scores.red_score === 0) {
        return "GREEN";
      }
    }

    if (scores.yellow_score >= CALIBRATION_THRESHOLDS.yellowAbsolute || (scores.yellow_score >= CALIBRATION_THRESHOLDS.yellowDominant && scores.yellow_score >= scores.green_score)) {
      return "YELLOW";
    }

    if (scores.green_score >= scores.yellow_score && scores.green_score > scores.red_score) {
      return "GREEN";
    }

    return "YELLOW";
  }

  function buildGovernance(normalizedTitle, green, yellow, red, scores, sourceRisk) {
    const safeAnimalMatches = scoreDictionary(normalizedTitle, toDictionary(SAFE_ANIMAL_DOMAIN_TERMS, 1)).matches;
    const harmlessContextMatches = scoreDictionary(normalizedTitle, toDictionary(HARMLESS_ANIMAL_CONTEXT_TERMS, 1)).matches;
    const weakYellowTerms = yellow.matches
      .filter((match) => WEAK_SAFE_DOMAIN_YELLOW_TERMS.includes(match.term))
      .map((match) => match.term);
    const suppressedWeakTerms = safeAnimalMatches.length > 0 && red.matches.length === 0
      ? weakYellowTerms
      : [];
    const unresolvedYellowScore = Math.max(
      0,
      yellow.score - yellow.matches
        .filter((match) => suppressedWeakTerms.includes(match.term))
        .reduce((total, match) => total + match.weight, 0)
    );
    const isSafeAnimalDomain = safeAnimalMatches.length > 0;
    const confidence = confidenceFor({
      scores,
      isSafeAnimalDomain,
      harmlessContextMatches,
      suppressedWeakTerms,
      unresolvedYellowScore,
      redMatches: red.matches,
      sourceRisk
    });

    return {
      thresholds: CALIBRATION_THRESHOLDS,
      rawSignals: {
        green: green.matches,
        yellow: yellow.matches,
        red: red.matches,
        source: sourceRisk
      },
      taxonomyMatches: {
        safeAnimalDomain: safeAnimalMatches,
        harmlessAnimalContext: harmlessContextMatches
      },
      weightedBoosts: [
        ...green.matches,
        ...safeAnimalMatches.map((match) => ({ term: match.term, weight: match.weight, taxonomy: "ANIMAL_PET_NATURE" }))
      ],
      weightedPenalties: [
        ...yellow.matches,
        ...red.matches,
        ...sourceRisk.riskMatches
      ],
      suppressedWeakTerms,
      unresolvedYellowScore,
      safeDomain: {
        isSafeAnimalDomain,
        baselineMet: isSafeAnimalDomain && scores.green_score >= CALIBRATION_THRESHOLDS.safeDomainGreenBaseline,
        matches: termsList(safeAnimalMatches)
      },
      confidence,
      thresholdDecisions: []
    };
  }

  function finalizeGovernance(governance, label, scores) {
    return {
      ...governance,
      thresholdDecisions: [
        {
          rule: "red_score >= redAbsolute or dominant red_score",
          matched: label === "RED",
          result: label === "RED" ? "RED" : "continue"
        },
        {
          rule: "safe animal domain with no strong unresolved friction defaults GREEN",
          matched: governance.safeDomain.isSafeAnimalDomain && label === "GREEN",
          result: governance.safeDomain.isSafeAnimalDomain && label === "GREEN" ? "GREEN" : "continue"
        },
        {
          rule: "safe animal YELLOW only when unresolved yellow score strongly exceeds GREEN",
          matched: governance.safeDomain.isSafeAnimalDomain && label === "YELLOW",
          result: governance.safeDomain.isSafeAnimalDomain && label === "YELLOW" ? "YELLOW_UNCERTAIN" : "continue"
        },
        {
          rule: "standard yellow thresholds for non-safe domains",
          matched: !governance.safeDomain.isSafeAnimalDomain && label === "YELLOW",
          result: !governance.safeDomain.isSafeAnimalDomain && label === "YELLOW" ? "YELLOW" : "continue"
        }
      ],
      visibleOverlay: {
        label,
        color: label.toLowerCase(),
        confidence: governance.confidence,
        reason: `Visible overlay ${label} after calibrated thresholds: G ${scores.green_score}, Y ${scores.yellow_score}, R ${scores.red_score}.`
      }
    };
  }

  function confidenceFor({ scores, isSafeAnimalDomain, harmlessContextMatches, suppressedWeakTerms, unresolvedYellowScore, redMatches, sourceRisk }) {
    if (redMatches.length > 0 || scores.red_score >= CALIBRATION_THRESHOLDS.redDominant) {
      return "high";
    }

    if (isSafeAnimalDomain && unresolvedYellowScore === 0 && sourceRisk.riskMatches.length === 0) {
      return harmlessContextMatches.length > 0 || scores.green_score >= 5 ? "high" : "medium";
    }

    if (isSafeAnimalDomain && suppressedWeakTerms.length > 0 && unresolvedYellowScore < CALIBRATION_THRESHOLDS.safeDomainYellowStrong) {
      return "medium";
    }

    if (isSafeAnimalDomain && unresolvedYellowScore >= CALIBRATION_THRESHOLDS.safeDomainYellowStrong) {
      return "uncertain";
    }

    if (scores.green_score === 0 && scores.yellow_score === 0 && scores.red_score === 0) {
      return "uncertain";
    }

    if (Math.abs(scores.green_score - scores.yellow_score) <= 1) {
      return "uncertain";
    }

    return "medium";
  }

  function toDictionary(terms, weight) {
    return terms.reduce((dictionary, term) => {
      dictionary[term] = weight;
      return dictionary;
    }, {});
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
    const matchedTerms = {
      green: green.matches,
      yellow: yellow.matches,
      red: red.matches
    };
    const governance = buildGovernance(normalizedTitle.text, green, yellow, red, scores, sourceRisk);
    const label = classify(scores, governance);
    const finalizedGovernance = finalizeGovernance(governance, label, scores);
    const reasons = buildReasons(label, scores, matchedTerms, sourceRisk, finalizedGovernance);

    return {
      mode: activeMode,
      label,
      color: label.toLowerCase(),
      normalizedTitle: normalizedTitle.text,
      tokens: normalizedTitle.tokens,
      scores,
      matchedTerms,
      sourceAdjustment: sourceRisk,
      confidence: finalizedGovernance.confidence,
      governance: finalizedGovernance,
      visibleOverlay: finalizedGovernance.visibleOverlay,
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
    SAFE_ANIMAL_DOMAIN_TERMS,
    HARMLESS_ANIMAL_CONTEXT_TERMS,
    WEAK_SAFE_DOMAIN_YELLOW_TERMS,
    CALIBRATION_THRESHOLDS,
    analyzeHeadline,
    normalizeText
  };
});

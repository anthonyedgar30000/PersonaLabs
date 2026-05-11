(function (root) {
  "use strict";

  const dictionaries = root.PersonaLabsChillDictionaries ||
    (typeof require === "function" ? require("./dictionaries") : null);

  const LABEL_BANDS = {
    strongGreen: {
      className: "strong-green",
      label: "ultra chill",
      alternateLabel: "vibes immaculate",
      summary: "Strong calm signals with low friction."
    },
    green: {
      className: "green",
      label: "good vibes",
      summary: "Relaxed title signals are leading."
    },
    yellowGreen: {
      className: "yellow-green",
      label: "mostly chill",
      summary: "Chill or low-friction learning signals are present."
    },
    yellow: {
      className: "yellow",
      label: "mixed energy",
      summary: "The title does not clearly resolve into a chill fit."
    },
    orange: {
      className: "orange",
      label: "drama creeping in",
      summary: "Friction or urgency signals are starting to lead."
    },
    red: {
      className: "red",
      label: "high friction",
      summary: "Strong friction signals outweigh chill signals."
    },
    darkRed: {
      className: "dark-red",
      label: "doomscroll fuel",
      rareLabel: "cortisol cannon",
      summary: "Multiple escalation or disturbing signals are present."
    }
  };

  const CATEGORY_LABELS = {
    calm_positive: "calm signals",
    educational_low_friction: "low-friction learning",
    high_friction: "high-friction signals",
    violence_disturbing: "disturbing/violence signals",
    tribal_domination: "domination framing",
    urgency_novelty: "urgency/novelty signals"
  };

  const SCORE_WEIGHTS = {
    calmPositive: 1,
    educationalPositive: 0.55,
    highFrictionNegative: 1,
    violenceNegative: 1.25,
    tribalNegative: 1.15,
    urgencyNegative: 0.75
  };

  const STATUS_CLASSES = ["chill", "focus", "intense", "mixed", "neutral"];
  const BAND_CLASSES = Object.values(LABEL_BANDS).map((band) => band.className);

  function classifyTitle(rawTitle) {
    const title = cleanTitle(rawTitle || "");
    const hasTitle = title.length > 0;
    const categoryMatches = scoreCategories(title);
    const scoreImpact = buildScoreImpact(categoryMatches);
    const totals = buildTotals(scoreImpact);
    const labelBand = labelBandFor(totals, hasTitle);
    const band = LABEL_BANDS[labelBand];
    const status = statusForBand(labelBand, totals);
    const internalSignals = buildInternalSignals(title, categoryMatches, scoreImpact, totals, hasTitle);

    return {
      status,
      matches: flattenMatches(categoryMatches),
      categoryMatches,
      scoreImpact,
      internalSignals,
      presentation: {
        labelBand,
        bandClassName: band.className,
        userLabel: band.label,
        summary: band.summary,
        reasons: reasonsFor(scoreImpact, totals, hasTitle),
        signalConfidence: internalSignals.signalConfidence
      }
    };
  }

  function cleanTitle(title) {
    return String(title).replace(/\s+/g, " ").trim();
  }

  function scoreCategories(title) {
    const normalizedTitle = title.toLowerCase();
    const matches = {};

    Object.entries(dictionaries.categories).forEach(([categoryName, category]) => {
      matches[categoryName] = category.terms
        .map((term) => matchTerm(normalizedTitle, term, category))
        .filter(Boolean);
    });

    return matches;
  }

  function matchTerm(title, term, category) {
    const normalizedTerm = term.toLowerCase();
    const pattern = new RegExp(
      `(^|[^a-z0-9])${escapeRegExp(normalizedTerm)}([^a-z0-9]|$)`,
      "i"
    );

    if (!pattern.test(title)) {
      return null;
    }

    const isPhrase = /[^a-z0-9]/i.test(normalizedTerm);
    const weight = isPhrase ? category.phraseWeight : category.singleWordWeight;

    return {
      term,
      weight,
      scoreDirection: category.scoreDirection,
      scoreImpact: category.scoreDirection === "negative" ? -weight : weight
    };
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function buildScoreImpact(categoryMatches) {
    return Object.entries(categoryMatches).map(([categoryName, matches]) => {
      const score = roundScore(matches.reduce((sum, match) => sum + match.weight, 0));
      const direction = dictionaries.categories[categoryName].scoreDirection;

      return {
        categoryName,
        label: CATEGORY_LABELS[categoryName],
        direction,
        score,
        signedScore: direction === "negative" ? -score : score,
        matchedTerms: matches.map((match) => match.term)
      };
    });
  }

  function buildTotals(scoreImpact) {
    const categoryScore = scoreFor(scoreImpact);
    const calmPositive = categoryScore.calm_positive * SCORE_WEIGHTS.calmPositive;
    const educationalPositive =
      categoryScore.educational_low_friction * SCORE_WEIGHTS.educationalPositive;
    const highFrictionNegative = categoryScore.high_friction * SCORE_WEIGHTS.highFrictionNegative;
    const violenceNegative = categoryScore.violence_disturbing * SCORE_WEIGHTS.violenceNegative;
    const tribalNegative = categoryScore.tribal_domination * SCORE_WEIGHTS.tribalNegative;
    const urgencyNegative = categoryScore.urgency_novelty * SCORE_WEIGHTS.urgencyNegative;
    const positiveScore = roundScore(calmPositive + educationalPositive);
    const negativeScore = roundScore(
      highFrictionNegative + violenceNegative + tribalNegative + urgencyNegative
    );
    const violenceOverride = categoryScore.violence_disturbing >=
      dictionaries.categories.violence_disturbing.hardOverrideScore;
    const tribalOverride = categoryScore.tribal_domination >=
      dictionaries.categories.tribal_domination.hardOverrideScore;

    return {
      categoryScore,
      positiveScore,
      negativeScore,
      netScore: roundScore(positiveScore - negativeScore),
      violenceOverride,
      tribalOverride,
      hardNegativeOverride: violenceOverride || tribalOverride
    };
  }

  function scoreFor(scoreImpact) {
    return scoreImpact.reduce((scores, impact) => {
      scores[impact.categoryName] = impact.score;
      return scores;
    }, {});
  }

  function labelBandFor(totals, hasTitle) {
    if (!hasTitle) {
      return "yellow";
    }

    if (totals.hardNegativeOverride && totals.negativeScore >= 8) {
      return "darkRed";
    }

    if (totals.hardNegativeOverride || totals.negativeScore >= 6) {
      return "red";
    }

    if (totals.negativeScore >= 3) {
      return "orange";
    }

    if (totals.categoryScore.calm_positive >= 4 && totals.negativeScore < 2) {
      return "strongGreen";
    }

    if (totals.categoryScore.calm_positive > 0 && totals.negativeScore < 2) {
      return "green";
    }

    if (totals.categoryScore.educational_low_friction > 0 && totals.negativeScore < 2) {
      return "yellowGreen";
    }

    return "yellow";
  }

  function statusForBand(labelBand, totals) {
    if (labelBand === "strongGreen" || labelBand === "green") {
      return "chill";
    }

    if (labelBand === "orange") {
      return "focus";
    }

    if (labelBand === "red" || labelBand === "darkRed" || totals.hardNegativeOverride) {
      return "intense";
    }

    if (labelBand === "yellowGreen") {
      return "mixed";
    }

    return "neutral";
  }

  function buildInternalSignals(title, categoryMatches, scoreImpact, totals, hasTitle) {
    const calmTerms = categoryMatches.calm_positive.map((match) => match.term);
    const learningTerms = categoryMatches.educational_low_friction.map((match) => match.term);
    const escalationTerms = uniqueTerms(
      categoryMatches.high_friction
        .concat(categoryMatches.violence_disturbing, categoryMatches.tribal_domination)
        .map((match) => match.term)
    );
    const volatilityTerms = categoryMatches.urgency_novelty.map((match) => match.term);
    const matchCount = Object.values(categoryMatches).reduce(
      (sum, matches) => sum + matches.length,
      0
    );

    return {
      rawExtractedTitle: title,
      matchedCategory: dominantCategory(scoreImpact),
      matchedTerms: Object.fromEntries(
        Object.entries(categoryMatches).map(([categoryName, matches]) => [
          categoryName,
          matches.map((match) => match.term)
        ])
      ),
      internalCategoryWeights: Object.fromEntries(
        scoreImpact.map((impact) => [impact.categoryName, impact.signedScore])
      ),
      calmAlignment: levelFor(totals.categoryScore.calm_positive, 4, 1),
      conflictIntensity: levelFor(totals.negativeScore, 6, 3),
      cognitiveFriction: levelFor(
        totals.categoryScore.high_friction +
          totals.categoryScore.violence_disturbing +
          totals.categoryScore.tribal_domination +
          totals.categoryScore.urgency_novelty,
        6,
        2
      ),
      signalConfidence: confidenceFor(matchCount, hasTitle),
      volatilitySignals: volatilityTerms,
      escalationSignals: escalationTerms,
      metadataConfidence: hasTitle ? "high" : "low",
      calmSignals: calmTerms,
      educationalSignals: learningTerms,
      positiveScore: totals.positiveScore,
      negativeScore: totals.negativeScore,
      netScore: totals.netScore,
      hardNegativeOverride: totals.hardNegativeOverride
    };
  }

  function dominantCategory(scoreImpact) {
    const matchedImpacts = scoreImpact.filter((impact) => impact.matchedTerms.length > 0);

    if (matchedImpacts.length === 0) {
      return "none";
    }

    return matchedImpacts.sort((a, b) => Math.abs(b.signedScore) - Math.abs(a.signedScore))[0]
      .categoryName;
  }

  function levelFor(score, highThreshold, mediumThreshold) {
    if (score >= highThreshold) {
      return "high";
    }

    if (score >= mediumThreshold) {
      return "medium";
    }

    return "low";
  }

  function confidenceFor(matchCount, hasTitle) {
    if (!hasTitle) {
      return "low";
    }

    if (matchCount >= 3) {
      return "high";
    }

    if (matchCount > 0) {
      return "medium";
    }

    return "low";
  }

  function reasonsFor(scoreImpact, totals, hasTitle) {
    if (!hasTitle) {
      return [
        "matched category: none",
        "- missing title metadata",
        "- confidence capped at low",
        "+ no content is blocked"
      ];
    }

    const matchedImpacts = scoreImpact.filter((impact) => impact.matchedTerms.length > 0);
    if (matchedImpacts.length === 0) {
      return [
        "matched category: none",
        "+ no escalation signal detected",
        "- no deterministic title keyword match",
        "- signal confidence remains low"
      ];
    }

    const rows = matchedImpacts
      .sort((a, b) => Math.abs(b.signedScore) - Math.abs(a.signedScore))
      .slice(0, 4)
      .map((impact) => {
        const sign = impact.direction === "negative" ? "-" : "+";
        return `${sign} ${impact.label}: ${formatTerms(impact.matchedTerms)} (${formatImpact(
          impact.signedScore
        )})`;
      });

    rows.unshift(`matched category: ${dominantCategory(scoreImpact)}`);

    if (totals.hardNegativeOverride) {
      rows.push("- strong negative category override prevents a green label");
    }

    rows.push(`net score impact: ${formatImpact(totals.netScore)}`);

    return rows;
  }

  function flattenMatches(categoryMatches) {
    return uniqueTerms(
      Object.values(categoryMatches)
        .flat()
        .map((match) => match.term)
    );
  }

  function uniqueTerms(terms) {
    return Array.from(new Set(terms));
  }

  function formatTerms(terms) {
    return terms.length > 0 ? terms.join(", ") : "none";
  }

  function formatImpact(score) {
    return `${score >= 0 ? "+" : ""}${roundScore(score)}`;
  }

  function roundScore(score) {
    return Math.round(score * 10) / 10;
  }

  const api = {
    BAND_CLASSES,
    LABEL_BANDS,
    STATUS_CLASSES,
    classifyTitle,
    formatImpact,
    formatTerms
  };

  root.PersonaLabsChillScoring = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);

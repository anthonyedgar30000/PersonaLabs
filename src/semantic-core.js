import {
  DOMAIN_TAXONOMIES,
  DOMAINS,
  FRICTION_TAXONOMIES,
  LENS_BEHAVIORS,
  POSITIVE_REINFORCEMENT_TAXONOMIES,
  TONE_TAXONOMIES,
} from "./semantic-dictionaries.js";
import { findSemanticRelationships } from "./semantic-relations.js";

export const LABELS = Object.freeze({
  GREEN: "GREEN",
  YELLOW: "YELLOW",
  RED: "RED",
});

export { DOMAINS };

const ANIMAL_PET_NATURE_TERMS = DOMAIN_TAXONOMIES[DOMAINS.ANIMAL_PET_NATURE].terms;
const LOW_SEVERITY_ANIMAL_TERMS = TONE_TAXONOMIES.PLAYFUL_ENERGY.terms;
const YELLOW_ESCALATION_TERMS = FRICTION_TAXONOMIES.ESCALATION.terms;
const RED_ESCALATION_TERMS = FRICTION_TAXONOMIES.DISTRESS.terms;

const CONTEXTUAL_ANIMAL_YELLOW_TERMS = [
  "chaotic",
  "screaming",
  "loud",
  "fails",
  "fail",
];

const HARMLESS_ANIMAL_CONTEXT_TERMS = [
  "playing",
  "funny",
  "zoomies",
  "cute",
  "compilation",
  "shorts",
];

export function classifySemanticContent(content = {}) {
  const text = joinText(content.title, content.channel, content.description);
  const lens = normalizeLens(content.lens);
  const domainDetails = detectDomainDetails(text);
  const domain = domainDetails.domain;
  const domainMatches = domainDetails.matches;
  const matchedTaxonomies = matchSemanticTaxonomies(text, domain);
  const redSignals = findTerms(text, RED_ESCALATION_TERMS);
  const rawYellowSignals = findTerms(text, YELLOW_ESCALATION_TERMS);
  const baseSuppressedSignals = domain === DOMAINS.ANIMAL_PET_NATURE
    ? findTerms(text, LOW_SEVERITY_ANIMAL_TERMS)
    : [];
  const contextualYellowSignals = domain === DOMAINS.ANIMAL_PET_NATURE
    ? findContextualAnimalYellowSignals(text, rawYellowSignals)
    : [];
  const suppressedSignals = [
    ...baseSuppressedSignals,
    ...contextualYellowSignals,
  ];
  const yellowSignals = domain === DOMAINS.ANIMAL_PET_NATURE
    ? rawYellowSignals.filter((term) => !suppressedSignals.includes(term))
    : rawYellowSignals;
  const baselineSafe = Boolean(DOMAIN_TAXONOMIES[domain]?.baselineSafe);
  const semanticRelationships = findSemanticRelationships([
    domain,
    ...matchedTaxonomies.map((taxonomy) => taxonomy.name),
    ...domainMatches,
    ...matchedTaxonomies.flatMap((taxonomy) => taxonomy.matches),
    ...baseSuppressedSignals,
    ...yellowSignals,
    ...redSignals,
  ]);
  const semanticWeights = calculateSemanticWeights({
    lens,
    domain,
    matchedTaxonomies,
    redSignals,
    yellowSignals,
    suppressedSignals,
  });
  const score = calculateDebugScore({ baselineSafe, redSignals, yellowSignals });
  const label = chooseLabel({
    baselineSafe,
    redSignals,
    yellowSignals,
  });
  const explanation = explain({
    label,
    baselineSafe,
    redSignals,
    yellowSignals,
    domain,
    matchedTaxonomies,
  });
  const debug = createSemanticDebugLog({
    content,
    domain,
    domainMatches,
    baselineSafe,
    rawYellowSignals,
    yellowSignals,
    redSignals,
    suppressedSignals,
    score,
    semanticWeights,
    matchedTaxonomies,
    semanticRelationships,
    label,
    explanation,
  });

  return {
    label,
    domain,
    baselineSafe,
    suppressedSignals,
    escalationSignals: {
      yellow: yellowSignals,
      red: redSignals,
    },
    finalScore: score.finalWeightedScore,
    explanation,
    debug,
    debugJson: exportClassificationDebugJson(debug),
  };
}

function chooseLabel({ baselineSafe, redSignals, yellowSignals }) {
  if (redSignals.length > 0) {
    return LABELS.RED;
  }

  if (yellowSignals.length > 0) {
    return LABELS.YELLOW;
  }

  if (baselineSafe) {
    return LABELS.GREEN;
  }

  return LABELS.GREEN;
}

function detectDomain(text) {
  return detectDomainDetails(text).domain;
}

function detectDomainDetails(text) {
  const candidates = Object.entries(DOMAIN_TAXONOMIES)
    .map(([domain, taxonomy]) => ({
      domain,
      matches: findTerms(text, taxonomy.terms),
      weight: taxonomy.weight,
    }))
    .filter((candidate) => candidate.matches.length > 0)
    .sort((a, b) => b.matches.length - a.matches.length);

  return candidates[0] ?? {
    domain: DOMAINS.GENERAL,
    matches: [],
    weight: 0,
  };
}

function detectDomainFromMatches(domainMatches) {
  return domainMatches.length > 0
    ? DOMAINS.ANIMAL_PET_NATURE
    : DOMAINS.GENERAL;
}

function findContextualAnimalYellowSignals(text, rawYellowSignals) {
  const hasHarmlessContext = findTerms(text, HARMLESS_ANIMAL_CONTEXT_TERMS).length > 0;

  if (!hasHarmlessContext) {
    return [];
  }

  return rawYellowSignals.filter((term) => CONTEXTUAL_ANIMAL_YELLOW_TERMS.includes(term));
}

export function exportClassificationDebugJson(debugLog) {
  return JSON.stringify(debugLog, null, 2);
}

function createSemanticDebugLog({
  content,
  domain,
  domainMatches,
  baselineSafe,
  rawYellowSignals,
  yellowSignals,
  redSignals,
  suppressedSignals,
  score,
  semanticWeights,
  matchedTaxonomies,
  semanticRelationships,
  label,
  explanation,
}) {
  const matchedPositiveTerms = [...domainMatches, ...suppressedSignals];
  const matchedFrictionTerms = [...yellowSignals, ...redSignals];
  const thresholdDecisions = [
    {
      rule: "redSignals.length > 0",
      matched: redSignals.length > 0,
      result: redSignals.length > 0 ? LABELS.RED : "continue",
    },
    {
      rule: "yellowSignals.length > 0",
      matched: yellowSignals.length > 0,
      result: yellowSignals.length > 0 ? LABELS.YELLOW : "continue",
    },
    {
      rule: "baselineSafe === true",
      matched: baselineSafe,
      result: baselineSafe ? LABELS.GREEN : "continue",
    },
  ];

  return {
    pipelineVersion: "semantic-core-debug-v1",
    input: {
      title: content.title ?? null,
      channel: content.channel ?? null,
      hasDescription: Boolean(content.description),
    },
    domain: {
      detected: domain,
      matches: domainMatches,
      baselineSafe,
    },
    sourceChannelSignals: {
      channelDomainMatches: findAllDomainTerms(content.channel),
      titleDomainMatches: findAllDomainTerms(content.title),
    },
    signals: {
      matchedPositiveTerms,
      matchedFrictionTerms,
      rawYellowTerms: rawYellowSignals,
      activeYellowTerms: yellowSignals,
      redTerms: redSignals,
    },
    semanticTaxonomies: matchedTaxonomies,
    semanticRelationships,
    semanticWeights,
    contextualSuppressions: suppressedSignals.map((term) => ({
      term,
      reason: "Suppressed by animal/pet/nature safe baseline or harmless context.",
    })),
    score,
    thresholdDecisions,
    falsePositiveMarkers: buildFalsePositiveMarkers({
      label,
      baselineSafe,
      rawYellowSignals,
      yellowSignals,
      suppressedSignals,
      redSignals,
    }),
    finalClassification: {
      color: label,
      explanation,
    },
  };
}

function calculateDebugScore({ baselineSafe, redSignals, yellowSignals }) {
  const baselineWeight = baselineSafe ? -1 : 0;
  const yellowWeight = yellowSignals.length;
  const redWeight = redSignals.length * 2;
  const finalWeightedScore = baselineWeight + yellowWeight + redWeight;

  return {
    baselineWeight,
    yellowWeight,
    redWeight,
    finalWeightedScore,
  };
}

function calculateSemanticWeights({
  lens,
  domain,
  matchedTaxonomies,
  redSignals,
  yellowSignals,
  suppressedSignals,
}) {
  const lensBehavior = LENS_BEHAVIORS[lens] ?? LENS_BEHAVIORS.CALMER;
  const weightedBoosts = [];
  const weightedPenalties = [];

  for (const taxonomy of matchedTaxonomies) {
    const entry = {
      taxonomy: taxonomy.name,
      terms: taxonomy.matches,
      weight: taxonomy.weight,
    };

    if (taxonomy.weight < 0 || lensBehavior.boosts.includes(taxonomy.name)) {
      weightedBoosts.push(entry);
    }

    if (taxonomy.weight > 0 || lensBehavior.penalizes.includes(taxonomy.name)) {
      weightedPenalties.push(entry);
    }
  }

  if (DOMAIN_TAXONOMIES[domain]?.baselineSafe) {
    weightedBoosts.push({
      taxonomy: domain,
      terms: [],
      weight: DOMAIN_TAXONOMIES[domain].weight,
    });
  }

  if (redSignals.length > 0) {
    weightedPenalties.push({
      taxonomy: "DISTRESS",
      terms: redSignals,
      weight: FRICTION_TAXONOMIES.DISTRESS.weight,
    });
  }

  if (yellowSignals.length > 0) {
    weightedPenalties.push({
      taxonomy: "ESCALATION",
      terms: yellowSignals,
      weight: FRICTION_TAXONOMIES.ESCALATION.weight,
    });
  }

  const suppressedPenalty = suppressedSignals.length > 0 ? -suppressedSignals.length : 0;
  const boostTotal = weightedBoosts.reduce((sum, entry) => sum + entry.weight, 0) + suppressedPenalty;
  const penaltyTotal = weightedPenalties.reduce((sum, entry) => sum + entry.weight, 0);

  return {
    weightedBoosts,
    weightedPenalties,
    suppressionAdjustment: suppressedPenalty,
    finalSemanticScore: boostTotal + penaltyTotal,
  };
}

function buildFalsePositiveMarkers({
  label,
  baselineSafe,
  rawYellowSignals,
  yellowSignals,
  suppressedSignals,
  redSignals,
}) {
  const markers = [];

  if (label === LABELS.YELLOW && baselineSafe) {
    markers.push({
      type: "animal_safe_baseline_yellow",
      message: "Animal safe-baseline content became YELLOW; review active friction terms.",
      activeTerms: yellowSignals,
    });
  }

  if (rawYellowSignals.length > yellowSignals.length) {
    markers.push({
      type: "suppressed_yellow_terms",
      message: "Some YELLOW terms were contextually suppressed.",
      suppressedTerms: suppressedSignals,
    });
  }

  if (label === LABELS.RED && redSignals.length === 0) {
    markers.push({
      type: "red_without_red_terms",
      message: "RED classification lacks explicit RED terms.",
    });
  }

  return markers;
}

function explain({ label, baselineSafe, redSignals, yellowSignals, domain, matchedTaxonomies }) {
  if (label === LABELS.RED) {
    return "Marked RED because explicit distress or escalation signals overrode the safe baseline.";
  }

  if (label === LABELS.YELLOW) {
    return "Marked YELLOW because meaningful animal escalation signals were detected.";
  }

  if (baselineSafe && redSignals.length === 0 && yellowSignals.length === 0) {
    const taxonomyNames = matchedTaxonomies.map((taxonomy) => taxonomy.name);

    if (domain === DOMAINS.ANIMAL_PET_NATURE && taxonomyNames.includes("CALM_REGULATION")) {
      return "Marked GREEN because ANIMAL_PET_NATURE domain activated CALM_REGULATION and no escalation overrides were detected.";
    }

    if (domain === DOMAINS.ANIMAL_PET_NATURE) {
      return "Marked GREEN because safe animal baseline applies and low-severity stimulation signals were suppressed.";
    }

    return `Marked GREEN because ${domain} safe semantic baseline applied and no escalation overrides were detected.`;
  }

  return "Marked GREEN because no meaningful escalation signals were detected.";
}

function matchSemanticTaxonomies(text, domain) {
  return [
    ...matchTaxonomyGroup("domain", DOMAIN_TAXONOMIES, text),
    ...matchTaxonomyGroup("tone", TONE_TAXONOMIES, text),
    ...matchTaxonomyGroup("friction", FRICTION_TAXONOMIES, text),
    ...matchTaxonomyGroup("positive_reinforcement", POSITIVE_REINFORCEMENT_TAXONOMIES, text),
  ].filter((taxonomy) => taxonomy.name !== DOMAINS.GENERAL && (
    taxonomy.matches.length > 0 || taxonomy.name === domain
  ));
}

function matchTaxonomyGroup(family, taxonomies, text) {
  return Object.entries(taxonomies).map(([name, taxonomy]) => ({
    family,
    name,
    matches: findTerms(text, taxonomy.terms),
    weight: taxonomy.weight,
    contextSensitive: Boolean(taxonomy.contextSensitive),
  })).filter((taxonomy) => taxonomy.matches.length > 0);
}


function findAllDomainTerms(text) {
  return Object.values(DOMAIN_TAXONOMIES).flatMap((taxonomy) => findTerms(text, taxonomy.terms));
}

function findTerms(text, terms) {
  const source = normalizeText(text);

  return terms.filter((term) => termPattern(term).test(source));
}

function termPattern(term) {
  const escapedWords = term
    .trim()
    .split(/\s+/)
    .map(escapeRegExp)
    .join("\s+");

  return new RegExp(`(^|[^a-z0-9])${escapedWords}(?=$|[^a-z0-9])`, "i");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function joinText(...values) {
  return values.map((value) => value == null ? "" : String(value)).filter(Boolean).join(" ");
}

function normalizeLens(lens) {
  return String(lens ?? "CALMER").toUpperCase();
}

function normalizeText(value) {
  return String(value ?? "")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"');
}

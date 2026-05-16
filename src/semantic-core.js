export const LABELS = Object.freeze({
  GREEN: "GREEN",
  YELLOW: "YELLOW",
  RED: "RED",
});

export const DOMAINS = Object.freeze({
  ANIMAL_PET_NATURE: "ANIMAL_PET_NATURE",
  GENERAL: "GENERAL",
});

const ANIMAL_PET_NATURE_TERMS = [
  "animal",
  "aquarium",
  "bird",
  "birds",
  "bunny",
  "cat",
  "dog",
  "fish",
  "hamster",
  "hamsters",
  "kitten",
  "mini lop",
  "parrot",
  "parrots",
  "pet",
  "pets",
  "puppy",
  "rabbit",
  "rabbits",
];

const LOW_SEVERITY_ANIMAL_TERMS = [
  "funny",
  "zoomies",
  "silly",
  "playful",
  "playing",
  "energetic",
  "compilation",
  "hyper",
  "shorts",
  "viral",
  "relaxing",
];

const YELLOW_ESCALATION_TERMS = [
  "chaotic",
  "screaming",
  "prank",
  "loud",
  "fails",
  "fail",
  "mild drama",
  "hyper",
];

const RED_ESCALATION_TERMS = [
  "abuse",
  "injury",
  "injured",
  "blood",
  "death",
  "emergency",
  "terrifying",
  "disturbing",
  "brutal",
  "crisis",
  "attack",
];

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
  const domainMatches = findTerms(text, ANIMAL_PET_NATURE_TERMS);
  const domain = detectDomainFromMatches(domainMatches);
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
  const baselineSafe = domain === DOMAINS.ANIMAL_PET_NATURE;
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
  return detectDomainFromMatches(findTerms(text, ANIMAL_PET_NATURE_TERMS));
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
      channelDomainMatches: findTerms(content.channel, ANIMAL_PET_NATURE_TERMS),
      titleDomainMatches: findTerms(content.title, ANIMAL_PET_NATURE_TERMS),
    },
    signals: {
      matchedPositiveTerms,
      matchedFrictionTerms,
      rawYellowTerms: rawYellowSignals,
      activeYellowTerms: yellowSignals,
      redTerms: redSignals,
    },
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

function explain({ label, baselineSafe, redSignals, yellowSignals }) {
  if (label === LABELS.RED) {
    return "Marked RED because explicit distress or escalation signals overrode the safe baseline.";
  }

  if (label === LABELS.YELLOW) {
    return "Marked YELLOW because meaningful animal escalation signals were detected.";
  }

  if (baselineSafe && redSignals.length === 0 && yellowSignals.length === 0) {
    return "Marked GREEN because safe animal baseline applies and low-severity stimulation signals were suppressed.";
  }

  return "Marked GREEN because no meaningful escalation signals were detected.";
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
    .join("\\s+");

  return new RegExp(`(^|[^a-z0-9])${escapedWords}(?=$|[^a-z0-9])`, "i");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function joinText(...values) {
  return values.map((value) => value == null ? "" : String(value)).filter(Boolean).join(" ");
}

function normalizeText(value) {
  return String(value ?? "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"');
}

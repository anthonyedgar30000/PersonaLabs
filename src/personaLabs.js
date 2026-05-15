export const LABELS = Object.freeze({
  GREEN: "GREEN",
  YELLOW: "YELLOW",
  RED: "RED",
});

export const LENSES = Object.freeze({
  CALMER: "CALMER",
  DEFAULT: "DEFAULT",
});

export const DOMAINS = Object.freeze({
  ANIMAL_PET_NATURE: "ANIMAL_PET_NATURE",
  NATURE_AMBIENCE: "NATURE_AMBIENCE",
  EDUCATIONAL_LONGFORM: "EDUCATIONAL_LONGFORM",
  POLITICS_NEWS: "POLITICS_NEWS",
  OUTRAGE_DRAMA: "OUTRAGE_DRAMA",
  GENERAL: "GENERAL",
});

export const DOMAIN_BASELINE_WEIGHTINGS = Object.freeze({
  [DOMAINS.ANIMAL_PET_NATURE]: Object.freeze({
    score: -5,
    label: "strongly GREEN",
    rationale: "Animal, pet, and nature contexts are usually low-friction unless explicit distress or escalation framing appears.",
  }),
  [DOMAINS.NATURE_AMBIENCE]: Object.freeze({
    score: -5,
    label: "strongly GREEN",
    rationale: "Nature ambience is expected to support calm attention and emotional regulation.",
  }),
  [DOMAINS.EDUCATIONAL_LONGFORM]: Object.freeze({
    score: -2,
    label: "moderately GREEN",
    rationale: "Explanatory long-form content tends to be steadier and more intentional.",
  }),
  [DOMAINS.POLITICS_NEWS]: Object.freeze({
    score: 0,
    label: "neutral",
    rationale: "Politics and news are context-dependent and need tone-sensitive handling.",
  }),
  [DOMAINS.OUTRAGE_DRAMA]: Object.freeze({
    score: 2,
    label: "elevated scrutiny",
    rationale: "Drama and outrage framing often carry higher emotional friction.",
  }),
  [DOMAINS.GENERAL]: Object.freeze({
    score: 0,
    label: "neutral",
    rationale: "General content starts neutral until tone and pacing provide context.",
  }),
});

export const TONE_SIGNAL_CATEGORIES = Object.freeze({
  CALM_TONE_SIGNALS: Object.freeze([
    "relaxing",
    "peaceful",
    "soothing",
    "cozy",
    "wholesome",
    "calm",
    "gentle",
    "quiet",
    "ambient",
    "ambience",
    "nature sounds",
    "soft spoken",
    "bonding",
    "care",
    "routine",
    "study",
    "explained",
    "walkthrough",
    "evening",
    "room setup",
  ]),
  ESCALATION_TONE_SIGNALS: Object.freeze([
    "you won't believe",
    "insane",
    "shocking",
    "exposed",
    "meltdown",
    "destroyed",
    "disaster",
    "freakout",
    "panic",
    "outrage",
    "brutal",
    "terrifying",
    "unbelievable",
    "urgent",
    "massive problem",
    "emergency",
    "breakdown",
  ]),
  HIGH_ENERGY_HARMLESS_SIGNALS: Object.freeze([
    "funny",
    "zoomies",
    "playful",
    "chaotic",
    "silly",
    "compilation",
    "memes",
    "excited",
    "goofy",
    "energetic",
    "hyper",
    "loud",
    "fail",
  ]),
});

const ANIMAL_PET_NATURE_TERMS = [
  "rabbit",
  "bunny",
  "cat",
  "kitten",
  "dog",
  "puppy",
  "bird",
  "parrot",
  "hamster",
  "guinea pig",
  "fish",
  "aquarium",
  "animal",
  "pet",
  "wildlife",
  "nature",
  "forest",
  "cute",
  "adorable",
  "relaxing",
  "cozy",
  "peaceful",
  "soothing",
];

const NATURE_AMBIENCE_TERMS = [
  "ambient",
  "ambience",
  "nature sounds",
  "rain sounds",
  "ocean sounds",
  "forest sounds",
  "waterfall",
  "rainforest",
  "white noise",
  "sleep sounds",
];

const EDUCATIONAL_LONGFORM_TERMS = [
  "explained",
  "walkthrough",
  "tutorial",
  "lecture",
  "lesson",
  "course",
  "documentary",
  "study",
  "deep dive",
  "guide",
];

const POLITICS_NEWS_TERMS = [
  "political",
  "politics",
  "election",
  "debate",
  "congress",
  "government",
  "news",
  "breaking news",
  "president",
  "senate",
  "campaign",
];

const OUTRAGE_DRAMA_TERMS = [
  "drama",
  "meltdown",
  "exposed",
  "outrage",
  "destroyed",
  "disaster",
  "freakout",
  "scandal",
  "cancelled",
  "canceled",
];

const DISTRESS_DANGER_TERMS = [
  "attack",
  "injury",
  "injured",
  "died",
  "death",
  "abuse",
  "terrifying",
  "disturbing",
  "brutal",
  "emergency",
  "rescue crisis",
];

const ANIMAL_CHAOTIC_HARMLESS_TERMS = [
  "hyper",
  "loud",
  "chaotic",
  "prank",
  "fail",
  "screaming",
  "zoomies",
];

const URGENCY_PHRASES = [
  "urgent",
  "emergency",
  "right now",
  "must see",
  "breaking",
  "breaking news",
  "panic",
  "massive problem",
  "you won't believe",
];

const LOWER_FRICTION_LENS_NAMES = new Set([
  "calmer",
  "calm",
  "lower-friction",
  "lower_friction",
  "low-friction",
  "low_friction",
]);

export function labelContent(content = {}) {
  const title = asText(content.title);
  const channel = asText(content.channel);
  const lens = normalizeLens(content.lens);
  const domainDetails = detectDomain({ title, channel });
  const domain = domainDetails.domain;
  const tone = analyzeTone(content, domain);
  const decision = decideLabel({ domain, lens, tone });
  const reasons = buildReasons({
    lens,
    domain,
    domainMatches: domainDetails.matches,
    tone,
    decision,
  });

  return result({
    label: decision.label,
    domain,
    lens,
    tone,
    reasons,
    finalReason: decision.finalReason,
  });
}

export function detectDomain(content = {}) {
  const domainText = joinText(content.title, content.channel);
  const domainCandidates = [
    {
      domain: DOMAINS.ANIMAL_PET_NATURE,
      matches: findTerms(domainText, ANIMAL_PET_NATURE_TERMS),
    },
    {
      domain: DOMAINS.NATURE_AMBIENCE,
      matches: findTerms(domainText, NATURE_AMBIENCE_TERMS),
    },
    {
      domain: DOMAINS.OUTRAGE_DRAMA,
      matches: findTerms(domainText, OUTRAGE_DRAMA_TERMS),
    },
    {
      domain: DOMAINS.POLITICS_NEWS,
      matches: findTerms(domainText, POLITICS_NEWS_TERMS),
    },
    {
      domain: DOMAINS.EDUCATIONAL_LONGFORM,
      matches: findTerms(domainText, EDUCATIONAL_LONGFORM_TERMS),
    },
  ];
  const selected = domainCandidates.find((candidate) => candidate.matches.length > 0);

  return selected ?? {
    domain: DOMAINS.GENERAL,
    matches: [],
  };
}

export function analyzeTone(content = {}, detectedDomain = detectDomain(content).domain) {
  const title = asText(content.title);
  const fullText = joinText(title, content.channel, content.description);
  const calmMatches = findTerms(fullText, TONE_SIGNAL_CATEGORIES.CALM_TONE_SIGNALS);
  const escalationMatches = findTerms(
    fullText,
    TONE_SIGNAL_CATEGORIES.ESCALATION_TONE_SIGNALS,
  );
  const harmlessEnergyMatches = findTerms(
    fullText,
    TONE_SIGNAL_CATEGORIES.HIGH_ENERGY_HARMLESS_SIGNALS,
  );
  const distressDangerMatches = findTerms(fullText, DISTRESS_DANGER_TERMS);
  const animalChaosMatches = findTerms(fullText, ANIMAL_CHAOTIC_HARMLESS_TERMS);
  const urgencyMatches = findTerms(fullText, URGENCY_PHRASES);
  const heuristics = analyzeToneHeuristics({
    title,
    fullText,
    escalationMatchCount: escalationMatches.length,
    urgencyMatchCount: urgencyMatches.length,
  });

  return {
    calmToneScore: scoreSignalMatches(calmMatches),
    escalationToneScore: scoreSignalMatches(escalationMatches, { phraseBonus: 2 }),
    harmlessEnergyScore: scoreSignalMatches(harmlessEnergyMatches),
    baselineWeighting: DOMAIN_BASELINE_WEIGHTINGS[detectedDomain],
    matchedSignals: {
      calm: calmMatches,
      escalation: escalationMatches,
      harmlessEnergy: harmlessEnergyMatches,
      distressDanger: distressDangerMatches,
      animalChaoticHarmless: animalChaosMatches,
      urgency: urgencyMatches,
    },
    heuristics,
  };
}

export function isLowerFrictionLens(lens) {
  return LOWER_FRICTION_LENS_NAMES.has(asText(lens).toLowerCase());
}

function decideLabel({ domain, lens, tone }) {
  const lowerFrictionLens = isLowerFrictionLens(lens);
  const isStrongGreenDomain = domain === DOMAINS.ANIMAL_PET_NATURE
    || domain === DOMAINS.NATURE_AMBIENCE;
  const distressDangerCount = tone.matchedSignals.distressDanger.length;
  const animalChaosCount = tone.matchedSignals.animalChaoticHarmless.length;
  const finalFrictionScore = calculateFinalFrictionScore({ domain, lens, tone });

  if (distressDangerCount > 0) {
    return {
      label: LABELS.RED,
      code: "red.distress_danger",
      finalFrictionScore,
      finalReason: isStrongGreenDomain
        ? "Animal/pet/nature domain detected, but explicit distress or danger framing overrides the strong GREEN baseline."
        : "Explicit distress or danger framing is present.",
    };
  }

  if (lowerFrictionLens && isStrongGreenDomain) {
    if (tone.escalationToneScore >= 5 || tone.heuristics.heuristicEscalationScore >= 5) {
      return {
        label: LABELS.YELLOW,
        code: "yellow.nature_escalation_framing",
        finalFrictionScore,
        finalReason: "Animal/pet/nature domain detected with strong GREEN baseline, but explicit escalation framing raises the calmer-lens pacing to YELLOW.",
      };
    }

    if (animalChaosCount > 0) {
      return {
        label: LABELS.YELLOW,
        code: "yellow.animal_high_energy_harmless",
        finalFrictionScore,
        finalReason: "Animal/pet domain detected with harmless high-energy framing; CALMER marks it YELLOW for pacing, not danger.",
      };
    }

    return {
      label: LABELS.GREEN,
      code: "green.animal_nature_baseline",
      finalFrictionScore,
      finalReason: tone.calmToneScore > 0
        ? "Animal/pet domain detected with calm or bonding language and no escalation framing."
        : "Animal/pet/nature domain detected with strong GREEN baseline and no escalation framing.",
    };
  }

  if (lowerFrictionLens) {
    if (finalFrictionScore >= 8) {
      return {
        label: LABELS.RED,
        code: "red.high_escalation_tone",
        finalFrictionScore,
        finalReason: "Escalation language, urgency, and pacing cues are high-friction for the CALMER lens.",
      };
    }

    if (finalFrictionScore >= 3) {
      return {
        label: LABELS.YELLOW,
        code: "yellow.calmer_tone_friction",
        finalFrictionScore,
        finalReason: "Tone analysis found higher-friction wording or pacing for the CALMER lens.",
      };
    }
  }

  if (finalFrictionScore >= 10) {
    return {
      label: LABELS.RED,
      code: "red.high_escalation_tone",
      finalFrictionScore,
      finalReason: "Escalation language and pacing cues are strongly elevated.",
    };
  }

  if (finalFrictionScore >= 5) {
    return {
      label: LABELS.YELLOW,
      code: "yellow.tone_friction",
      finalFrictionScore,
      finalReason: "Tone analysis found moderate emotional friction.",
    };
  }

  return {
    label: LABELS.GREEN,
    code: "green.regulated_tone",
    finalFrictionScore,
    finalReason: tone.calmToneScore > 0
      ? "Calm, steady, or explanatory tone signals outweigh escalation cues."
      : "No meaningful escalation framing was detected.",
  };
}

function calculateFinalFrictionScore({ domain, lens, tone }) {
  const lowerFrictionLens = isLowerFrictionLens(lens);
  const highScrutinyDomain = domain === DOMAINS.POLITICS_NEWS
    || domain === DOMAINS.OUTRAGE_DRAMA;
  const escalationMultiplier = highScrutinyDomain ? 1.35 : 1;
  const harmlessEnergyWeight = domain === DOMAINS.ANIMAL_PET_NATURE ? 0.25 : 0.6;
  const calmWeight = lowerFrictionLens ? 0.85 : 0.6;

  return roundScore(
    tone.baselineWeighting.score
      + (tone.escalationToneScore * escalationMultiplier)
      + tone.heuristics.heuristicEscalationScore
      + (tone.harmlessEnergyScore * harmlessEnergyWeight)
      - (tone.calmToneScore * calmWeight),
  );
}

function buildReasons({ lens, domain, domainMatches, tone, decision }) {
  return [
    {
      code: "lens.selected",
      message: `Using ${lens} lens.`,
      terms: [lens],
    },
    {
      code: "domain.detected",
      message: `${domain} domain detected.`,
      terms: domainMatches,
    },
    {
      code: "tone.calm_score",
      message: `Calm tone score: ${tone.calmToneScore}.`,
      terms: tone.matchedSignals.calm,
    },
    {
      code: "tone.escalation_score",
      message: `Escalation tone score: ${tone.escalationToneScore}.`,
      terms: tone.matchedSignals.escalation,
    },
    {
      code: "tone.harmless_energy_score",
      message: `Harmless energy score: ${tone.harmlessEnergyScore}.`,
      terms: tone.matchedSignals.harmlessEnergy,
    },
    {
      code: "tone.heuristics",
      message: `Punctuation, pacing, repetition, and urgency heuristic score: ${tone.heuristics.heuristicEscalationScore}.`,
      terms: tone.matchedSignals.urgency,
    },
    {
      code: "baseline.weighting",
      message: `Baseline weighting: ${tone.baselineWeighting.label} (${tone.baselineWeighting.score}).`,
      terms: [tone.baselineWeighting.rationale],
    },
    {
      code: decision.code,
      message: decision.finalReason,
      terms: tone.matchedSignals.distressDanger,
    },
  ];
}

function result({ label, domain, lens, tone, reasons, finalReason }) {
  return {
    label,
    domain,
    lens,
    tone,
    reasons,
    finalReason,
    explanation: reasons.map((reason) => reason.message).join(" "),
  };
}

function normalizeLens(lens) {
  if (isLowerFrictionLens(lens)) {
    return LENSES.CALMER;
  }

  return asText(lens) || LENSES.DEFAULT;
}

function analyzeToneHeuristics({
  title,
  fullText,
  escalationMatchCount,
  urgencyMatchCount,
}) {
  const punctuationCount = countMatches(fullText, /[!?]/g);
  const exclamationCount = countMatches(fullText, /!/g);
  const punctuationDensity = punctuationCount / Math.max(fullText.length, 1);
  const words = fullText.match(/[A-Za-z][A-Za-z']*/g) ?? [];
  const allCapsWordCount = words.filter((word) => (
    word.length > 2
      && word === word.toUpperCase()
      && /[A-Z]/.test(word)
  )).length;
  const allCapsRatio = words.length === 0 ? 0 : allCapsWordCount / words.length;
  const sentenceCount = Math.max(
    fullText.split(/[.!?]+/).filter((sentence) => sentence.trim()).length,
    1,
  );
  const emotionalPhraseDensity = (escalationMatchCount + urgencyMatchCount) / sentenceCount;
  const separatorCount = countMatches(title, /[|:;-]/g);
  const repetitionPatternCount = countMatches(fullText, /([!?])\1{1,}/g)
    + countMatches(fullText, /\b([A-Za-z]{3,})\s+\1\b/gi);
  const scores = {
    exclamationScore: exclamationCount >= 3 ? 2 : exclamationCount > 0 ? 1 : 0,
    allCapsScore: allCapsRatio >= 0.45 && allCapsWordCount >= 3 ? 2 : allCapsWordCount >= 2 ? 1 : 0,
    punctuationDensityScore: punctuationDensity >= 0.08 ? 2 : punctuationDensity >= 0.04 ? 1 : 0,
    emotionalPhraseDensityScore: emotionalPhraseDensity >= 3 ? 2 : emotionalPhraseDensity >= 1 ? 1 : 0,
    urgencyPhraseScore: urgencyMatchCount >= 2 ? 2 : urgencyMatchCount,
    titlePacingScore: separatorCount >= 2 ? 1 : 0,
    repetitionScore: repetitionPatternCount > 0 ? 1 : 0,
  };

  return {
    punctuationDensity: roundScore(punctuationDensity),
    allCapsRatio: roundScore(allCapsRatio),
    allCapsWordCount,
    exclamationCount,
    emotionalPhraseDensity: roundScore(emotionalPhraseDensity),
    urgencyPhraseCount: urgencyMatchCount,
    titlePacingSeparatorCount: separatorCount,
    repetitionPatternCount,
    ...scores,
    heuristicEscalationScore: Object.values(scores).reduce((sum, score) => sum + score, 0),
  };
}

function scoreSignalMatches(matches, options = {}) {
  const phraseBonus = options.phraseBonus ?? 0.5;

  return roundScore(matches.reduce((score, term) => (
    score + 1 + (term.includes(" ") ? phraseBonus : 0)
  ), 0));
}

function findTerms(text, terms) {
  const source = asText(text);

  return terms.filter((term) => termPattern(term).test(source));
}

function termPattern(term) {
  const escapedWords = asText(term)
    .trim()
    .split(/\s+/)
    .map(escapeRegExp)
    .join("\\s+");

  return new RegExp(`(^|[^a-z0-9])${escapedWords}(?=$|[^a-z0-9])`, "i");
}

function countMatches(text, pattern) {
  return (asText(text).match(pattern) ?? []).length;
}

function roundScore(value) {
  return Math.round(value * 100) / 100;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function joinText(...values) {
  return values.map(asText).filter(Boolean).join(" ");
}

function asText(value) {
  return value == null
    ? ""
    : String(value)
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"');
}

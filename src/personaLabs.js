export const LABELS = Object.freeze({
  GREEN: "GREEN",
  YELLOW: "YELLOW",
  RED: "RED",
});

export const LENSES = Object.freeze({
  CALMER: "CALMER",
  EDUCATIONAL: "EDUCATIONAL",
  BARE_METAL: "BARE_METAL",
  DEFAULT: "DEFAULT",
});

export const DOMAINS = Object.freeze({
  ANIMAL_PET_NATURE: "ANIMAL_PET_NATURE",
  EDUCATIONAL: "EDUCATIONAL",
  POLITICS_NEWS: "POLITICS_NEWS",
  DRAMA_REACTION: "DRAMA_REACTION",
  MUSIC_AMBIENT: "MUSIC_AMBIENT",
  COMEDY: "COMEDY",
  DOCUMENTARY: "DOCUMENTARY",
  GAMING: "GAMING",
  TUTORIAL: "TUTORIAL",
  GENERAL: "GENERAL",
  EDUCATIONAL_TUTORIAL: "EDUCATIONAL",
  NATURE_AMBIENCE: "MUSIC_AMBIENT",
  OUTRAGE_DRAMA: "DRAMA_REACTION",
  ENTERTAINMENT: "COMEDY",
});

export const EMOTION_CATEGORIES = Object.freeze({
  CALM_REGULATION: "calmRegulation",
  ANGER_OUTRAGE: "angerOutrage",
  FEAR_PANIC: "fearPanic",
  JOY_PLAYFULNESS: "joyPlayfulness",
  TRUST_INFORMATIONAL: "trustInformational",
  DISGUST_SHOCK: "disgustShock",
  SADNESS_DISTRESS: "sadnessDistress",
});

export const DOMAIN_BASELINES = Object.freeze({
  [DOMAINS.ANIMAL_PET_NATURE]: Object.freeze({
    score: -6,
    label: "strongly GREEN",
    reason: "Animal, pet, and nature content starts from a strong harmlessness baseline.",
  }),
  [DOMAINS.EDUCATIONAL]: Object.freeze({
    score: -3,
    label: "moderately GREEN",
    reason: "Educational content tends to support intentional learning.",
  }),
  [DOMAINS.TUTORIAL]: Object.freeze({
    score: -4,
    label: "strongly educational",
    reason: "Tutorial formats are usually explanatory and action-oriented.",
  }),
  [DOMAINS.DOCUMENTARY]: Object.freeze({
    score: -2,
    label: "contextual GREEN",
    reason: "Documentary formats often provide context for difficult subjects.",
  }),
  [DOMAINS.POLITICS_NEWS]: Object.freeze({
    score: 0,
    label: "neutral",
    reason: "Politics and news require context-sensitive interpretation.",
  }),
  [DOMAINS.DRAMA_REACTION]: Object.freeze({
    score: 4,
    label: "elevated scrutiny",
    reason: "Drama and reaction framing often optimizes for emotional escalation.",
  }),
  [DOMAINS.MUSIC_AMBIENT]: Object.freeze({
    score: -5,
    label: "strongly GREEN",
    reason: "Music and ambient formats often support low-friction regulation.",
  }),
  [DOMAINS.COMEDY]: Object.freeze({
    score: -1,
    label: "playful baseline",
    reason: "Comedy can contain chaos that is intended as play rather than escalation.",
  }),
  [DOMAINS.GAMING]: Object.freeze({
    score: 0,
    label: "neutral",
    reason: "Gaming energy depends heavily on format and tone.",
  }),
  [DOMAINS.GENERAL]: Object.freeze({
    score: 0,
    label: "neutral",
    reason: "General content starts neutral until contextual signals are interpreted.",
  }),
});

const DOMAIN_DEFINITIONS = [
  {
    domain: DOMAINS.ANIMAL_PET_NATURE,
    priority: 100,
    terms: [
      "rabbit",
      "rabbits",
      "bunny",
      "bunnies",
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
    ],
  },
  {
    domain: DOMAINS.TUTORIAL,
    priority: 90,
    terms: [
      "tutorial",
      "walkthrough",
      "how to",
      "step by step",
      "guide",
      "setup",
      "lesson",
    ],
  },
  {
    domain: DOMAINS.DOCUMENTARY,
    priority: 86,
    terms: [
      "documentary",
      "docuseries",
      "investigation",
      "history of",
      "inside story",
      "field report",
    ],
  },
  {
    domain: DOMAINS.EDUCATIONAL,
    priority: 84,
    terms: [
      "educational",
      "explained",
      "explainer",
      "lecture",
      "course",
      "analysis",
      "context",
      "study",
      "deep dive",
      "university",
      "research",
    ],
  },
  {
    domain: DOMAINS.MUSIC_AMBIENT,
    priority: 80,
    terms: [
      "ambient",
      "ambience",
      "music",
      "lofi",
      "lo-fi",
      "soundscape",
      "nature sounds",
      "bird sounds",
      "rain sounds",
      "ocean sounds",
      "forest sounds",
      "gentle sounds",
      "sleep sounds",
      "study music",
      "white noise",
    ],
  },
  {
    domain: DOMAINS.DRAMA_REACTION,
    priority: 70,
    terms: [
      "drama",
      "reaction",
      "reaction clip",
      "meltdown",
      "rant",
      "exposed",
      "outrage",
      "destroyed",
      "freakout",
      "scandal",
      "debate fight",
      "drama compilation",
      "breaking outrage",
      "humiliated",
    ],
  },
  {
    domain: DOMAINS.POLITICS_NEWS,
    priority: 65,
    terms: [
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
      "policy",
      "market",
      "markets",
    ],
  },
  {
    domain: DOMAINS.GAMING,
    priority: 60,
    terms: [
      "gaming",
      "gameplay",
      "minecraft",
      "fortnite",
      "speedrun",
      "boss fight",
      "stream highlights",
      "walkthrough game",
    ],
  },
  {
    domain: DOMAINS.COMEDY,
    priority: 55,
    terms: [
      "comedy",
      "funny",
      "sketch",
      "standup",
      "stand-up",
      "jokes",
      "memes",
      "silly",
      "goofy",
      "parody",
      "chaos compilation",
    ],
  },
];

const GLOBAL_SIGNAL_TERMS = Object.freeze({
  outrage: Object.freeze([
    "outrage",
    "outraged",
    "rage",
    "furious",
    "angry",
    "rant",
    "meltdown",
    "denies",
  ]),
  urgency: Object.freeze([
    "breaking",
    "urgent",
    "right now",
    "must see",
    "emergency",
    "crisis",
    "you won't believe",
  ]),
  fear: Object.freeze([
    "fear",
    "panic",
    "terrifying",
    "scary",
    "horror",
    "crisis",
    "disaster",
  ]),
  anger: Object.freeze([
    "anger",
    "angry",
    "furious",
    "rage",
    "fight",
    "heated",
    "destroyed",
    "humiliated",
  ]),
  intensity: Object.freeze([
    "insane",
    "wild",
    "crazy",
    "dramatic",
    "massive",
    "huge",
    "unbelievable",
    "shocking",
    "extreme",
  ]),
  chaos: Object.freeze([
    "chaos",
    "chaotic",
    "loud",
    "screaming",
    "zoomies",
    "wild",
    "crazy",
    "dramatic",
    "hyper",
  ]),
  calm: Object.freeze([
    "calm",
    "quiet",
    "gentle",
    "peaceful",
    "relaxing",
    "soothing",
    "cozy",
    "ambient",
    "soft spoken",
    "routine",
  ]),
  trust: Object.freeze([
    "public radio",
    "pbs",
    "npr",
    "university",
    "interview",
    "lecture",
    "documentary",
    "analysis",
    "context",
    "explained",
  ]),
  educationalFraming: Object.freeze([
    "educational",
    "tutorial",
    "explained",
    "analysis",
    "context",
    "lecture",
    "documentary",
    "interview",
    "walkthrough",
    "deep dive",
    "how to",
  ]),
  playfulFunny: Object.freeze([
    "funny",
    "cute",
    "silly",
    "playful",
    "goofy",
    "zoomies",
    "compilation",
    "while playing",
    "playing",
    "comedy",
  ]),
});

const EMOTION_LEXICON = Object.freeze({
  [EMOTION_CATEGORIES.CALM_REGULATION]: Object.freeze(GLOBAL_SIGNAL_TERMS.calm),
  [EMOTION_CATEGORIES.ANGER_OUTRAGE]: Object.freeze([
    ...GLOBAL_SIGNAL_TERMS.anger,
    ...GLOBAL_SIGNAL_TERMS.outrage,
  ]),
  [EMOTION_CATEGORIES.FEAR_PANIC]: Object.freeze(GLOBAL_SIGNAL_TERMS.fear),
  [EMOTION_CATEGORIES.JOY_PLAYFULNESS]: Object.freeze(GLOBAL_SIGNAL_TERMS.playfulFunny),
  [EMOTION_CATEGORIES.TRUST_INFORMATIONAL]: Object.freeze([
    ...GLOBAL_SIGNAL_TERMS.trust,
    ...GLOBAL_SIGNAL_TERMS.educationalFraming,
  ]),
  [EMOTION_CATEGORIES.DISGUST_SHOCK]: Object.freeze([
    "disgusting",
    "disturbing",
    "shocking",
    "exposed",
    "brutal",
    "unbelievable",
  ]),
  [EMOTION_CATEGORIES.SADNESS_DISTRESS]: Object.freeze([
    "sad",
    "distress",
    "injury",
    "injured",
    "blood",
    "died",
    "death",
    "abuse",
    "starving",
    "crying",
    "breakdown",
  ]),
});

const SEVERE_DISTRESS_TERMS = Object.freeze([
  "abuse",
  "injury",
  "injured",
  "blood",
  "death",
  "died",
  "rescue crisis",
  "starving",
  "emergency",
]);

const FORMAT_TERMS = Object.freeze({
  lowerFriction: Object.freeze([
    "documentary",
    "interview",
    "lecture",
    "tutorial",
    "public radio",
    "pbs",
    "npr",
    "long-form discussion",
    "long form discussion",
    "educational analysis",
    "analysis",
    "context",
    "explained",
  ]),
  higherFriction: Object.freeze([
    "reaction clip",
    "reaction",
    "ragebait",
    "drama thumbnail",
    "meltdown",
    "destroyed",
    "humiliated",
    "breaking outrage",
    "debate fight",
    "drama compilation",
    "exposed",
    "rant",
  ]),
});

const LOWER_FRICTION_LENS_NAMES = new Set([
  "calmer",
  "calm",
  "lower-friction",
  "lower_friction",
  "low-friction",
  "low_friction",
]);

const EDUCATIONAL_LENS_NAMES = new Set([
  "educational",
  "education",
  "learning",
  "research",
  "study",
]);

const BARE_METAL_LENS_NAMES = new Set([
  "bare metal",
  "bare-metal",
  "bare_metal",
  "baremetal",
]);

export function labelContent(content = {}) {
  const lens = normalizeLens(content.lens);
  const textParts = extractTextParts(content);
  const detectedDomain = detectDomain(content);
  const globalSignals = detectGlobalSignals(textParts.fullText);
  const tone = analyzeTone(textParts.fullText, globalSignals);
  const emotions = analyzeEmotions(textParts.fullText);
  const format = analyzeFormat(textParts.fullText);
  const sourceFormat = format;
  const escalation = analyzeEscalation({
    text: textParts.fullText,
    globalSignals,
    tone,
    emotions,
    format,
  });
  const suppressionModifiers = calculateSuppressionModifiers({
    domain: detectedDomain.domain,
    globalSignals,
    escalation,
    format,
  });
  const lensModifiers = calculateLensModifiers({
    lens,
    domain: detectedDomain.domain,
    globalSignals,
    format,
    escalation,
  });
  const scores = calculateScores({
    domain: detectedDomain.domain,
    globalSignals,
    tone,
    emotions,
    format,
    escalation,
    suppressionModifiers,
    lensModifiers,
  });
  const decision = decideColor({
    domain: detectedDomain.domain,
    lens,
    escalation,
    scores,
    format,
  });
  const explanation = buildHumanExplanation({
    domain: detectedDomain.domain,
    lens,
    decision,
    suppressionModifiers,
    lensModifiers,
    format,
    escalation,
  });
  const reasons = buildReasons({
    detectedDomain,
    globalSignals,
    tone,
    emotions,
    format,
    escalation,
    suppressionModifiers,
    lensModifiers,
    scores,
    decision,
    explanation,
  });

  return {
    label: decision.color,
    finalColor: decision.color,
    color: decision.color,
    domain: detectedDomain.domain,
    detectedDomain,
    lens,
    tone,
    toneSignals: globalSignals.signals,
    globalSignals,
    emotion: emotions,
    emotions,
    format,
    sourceFormat,
    sourceFormatSignals: format.signals,
    escalation,
    escalationSignals: escalation.signals,
    suppressionModifiers,
    lensModifiers,
    scores,
    finalScore: scores.finalScore,
    finalColorReason: decision.reason,
    reason: explanation,
    finalReason: explanation,
    explanation,
    reasons,
  };
}

export const classifyContent = labelContent;

export function detectDomain(content = {}) {
  const textParts = extractTextParts(content);
  const candidates = DOMAIN_DEFINITIONS
    .map((definition) => {
      const matches = findTerms(textParts.domainText, definition.terms);
      const metadataMatches = findTerms(textParts.metadataText, definition.terms);
      const domainWeight = definition.domain === DOMAINS.DOCUMENTARY ? 2 : 1;
      const score = scoreTerms(matches, domainWeight)
        + scoreTerms(metadataMatches, domainWeight + 0.25)
        + (matches.length > 0 || metadataMatches.length > 0 ? definition.priority / 100 : 0);

      return {
        domain: definition.domain,
        matches: unique([...matches, ...metadataMatches]),
        score: roundScore(score),
        priority: definition.priority,
      };
    })
    .filter((candidate) => candidate.matches.length > 0)
    .sort((a, b) => b.score - a.score || b.priority - a.priority);
  const selected = candidates[0] ?? {
    domain: DOMAINS.GENERAL,
    matches: [],
    score: 0,
    priority: 0,
  };

  return {
    domain: selected.domain,
    matches: selected.matches,
    candidates,
    baseline: DOMAIN_BASELINES[selected.domain],
  };
}

export function detectGlobalSignals(input = "") {
  const text = normalizeText(input);
  const signals = Object.fromEntries(
    Object.entries(GLOBAL_SIGNAL_TERMS).map(([name, terms]) => [
      name,
      findTerms(text, terms),
    ]),
  );
  const scores = Object.fromEntries(
    Object.entries(signals).map(([name, matches]) => [name, scoreTerms(matches)]),
  );

  return {
    signals,
    scores,
  };
}

export function analyzeTone(input = "", globalSignals = detectGlobalSignals(input)) {
  const text = normalizeText(input);
  const words = text.match(/[A-Za-z][A-Za-z']*/g) ?? [];
  const exclamationCount = countMatches(text, /!/g);
  const punctuationCount = countMatches(text, /[!?]/g);
  const punctuationDensity = punctuationCount / Math.max(text.length, 1);
  const allCapsWords = words.filter((word) => (
    word.length > 2
      && word === word.toUpperCase()
      && /[A-Z]/.test(word)
  ));
  const allCapsIntensity = words.length === 0 ? 0 : allCapsWords.length / words.length;
  const escalationScore = roundScore(
    globalSignals.scores.urgency * 1.5
      + globalSignals.scores.outrage * 1.35
      + globalSignals.scores.fear * 1.25
      + globalSignals.scores.anger * 1.2
      + globalSignals.scores.intensity
      + globalSignals.scores.chaos * 0.8
      + (exclamationCount >= 3 ? 2 : exclamationCount > 0 ? 0.75 : 0)
      + (punctuationDensity >= 0.08 ? 1.5 : punctuationDensity >= 0.04 ? 0.75 : 0)
      + (allCapsIntensity >= 0.45 && allCapsWords.length >= 2 ? 2 : allCapsWords.length >= 2 ? 1 : 0),
  );
  const regulationScore = roundScore(
    globalSignals.scores.calm * 1.25
      + globalSignals.scores.trust
      + globalSignals.scores.educationalFraming * 0.8
      + globalSignals.scores.playfulFunny * 0.35,
  );

  return {
    score: roundScore(escalationScore - regulationScore),
    escalationScore,
    regulationScore,
    allCapsIntensity: roundScore(allCapsIntensity),
    allCapsWords,
    allCapsWordCount: allCapsWords.length,
    exclamationCount,
    punctuationDensity: roundScore(punctuationDensity),
    signals: globalSignals.signals,
  };
}

export function analyzeEmotions(input = "") {
  const text = normalizeText(input);
  const categories = Object.fromEntries(
    Object.entries(EMOTION_LEXICON).map(([category, terms]) => {
      const matches = findTerms(text, terms);

      return [category, {
        matches,
        score: scoreTerms(matches),
      }];
    }),
  );
  const regulatingScore = roundScore(
    categories[EMOTION_CATEGORIES.CALM_REGULATION].score
      + categories[EMOTION_CATEGORIES.TRUST_INFORMATIONAL].score,
  );
  const escalatingScore = roundScore(
    categories[EMOTION_CATEGORIES.ANGER_OUTRAGE].score
      + categories[EMOTION_CATEGORIES.FEAR_PANIC].score
      + categories[EMOTION_CATEGORIES.DISGUST_SHOCK].score
      + categories[EMOTION_CATEGORIES.SADNESS_DISTRESS].score,
  );

  return {
    categories,
    regulatingScore,
    escalatingScore,
    joyPlayfulnessScore: categories[EMOTION_CATEGORIES.JOY_PLAYFULNESS].score,
  };
}

export function analyzeFormat(input = "") {
  const text = normalizeText(input);
  const lowerFriction = findTerms(text, FORMAT_TERMS.lowerFriction);
  const higherFriction = findTerms(text, FORMAT_TERMS.higherFriction);

  return {
    lowerFrictionScore: scoreTerms(lowerFriction, 1.5),
    higherFrictionScore: scoreTerms(higherFriction, 1.75),
    signals: {
      lowerFriction,
      higherFriction,
    },
  };
}

export const analyzeSourceFormat = analyzeFormat;

export function analyzeEscalation({
  text = "",
  globalSignals = detectGlobalSignals(text),
  tone = analyzeTone(text, globalSignals),
  emotions = analyzeEmotions(text),
  format = analyzeFormat(text),
} = {}) {
  const severeDistressTerms = findTerms(text, SEVERE_DISTRESS_TERMS);
  const signals = {
    severeDistressTerms,
    outrage: globalSignals.signals.outrage,
    urgency: globalSignals.signals.urgency,
    fear: globalSignals.signals.fear,
    anger: globalSignals.signals.anger,
    intensity: globalSignals.signals.intensity,
    chaos: globalSignals.signals.chaos,
    higherFrictionFormat: format.signals.higherFriction,
  };
  const score = roundScore(
    scoreTerms(severeDistressTerms, 3.5)
      + tone.escalationScore
      + emotions.escalatingScore * 1.2
      + format.higherFrictionScore * 1.25,
  );

  return {
    score,
    hasSevereDistress: severeDistressTerms.length > 0,
    hasExplicitDistress: severeDistressTerms.length > 0,
    signals,
  };
}

export function calculateSuppressionModifiers({
  domain,
  globalSignals,
  escalation,
  format,
}) {
  const modifiers = [];

  if (domain === DOMAINS.ANIMAL_PET_NATURE && !escalation.hasSevereDistress) {
    const harmlessChaosMatches = unique([
      ...globalSignals.signals.chaos,
      ...globalSignals.signals.intensity.filter((term) => [
        "wild",
        "crazy",
        "dramatic",
      ].includes(term)),
      ...globalSignals.signals.playfulFunny,
    ]);

    if (harmlessChaosMatches.length > 0) {
      modifiers.push({
        code: "suppress.animal_harmless_chaos",
        score: -5,
        signals: harmlessChaosMatches,
        reason: "Animal/pet/nature context suppresses harmless chaos, loudness, screaming, zoomies, funny, dramatic, wild, and crazy signals.",
      });
    }

    modifiers.push({
      code: "suppress.animal_green_baseline",
      score: -3,
      signals: [],
      reason: "Animal/pet/nature content defaults GREEN for CALMER unless severe distress appears.",
    });
  }

  if (domain === DOMAINS.COMEDY && !escalation.hasSevereDistress) {
    modifiers.push({
      code: "suppress.comedy_playful_chaos",
      score: -2.5,
      signals: unique([
        ...globalSignals.signals.chaos,
        ...globalSignals.signals.playfulFunny,
      ]),
      reason: "Comedy context treats some chaos as playful format rather than escalation.",
    });
  }

  if (format.lowerFrictionScore > 0) {
    modifiers.push({
      code: "suppress.lower_friction_format",
      score: roundScore(-format.lowerFrictionScore),
      signals: format.signals.lowerFriction,
      reason: "Documentary, interview, lecture, tutorial, public-radio, long-form, or educational-analysis format reduces escalation.",
    });
  }

  return modifiers;
}

export function calculateLensModifiers({
  lens,
  domain,
  globalSignals,
  format,
  escalation,
}) {
  const modifiers = [];

  if (lens === LENSES.CALMER) {
    modifiers.push({
      code: "lens.calmer_regulation",
      score: -1.5,
      signals: unique([
        ...globalSignals.signals.calm,
        ...globalSignals.signals.playfulFunny,
      ]),
      reason: "CALMER prioritizes emotional regulation and allows low-friction calm or playful signals.",
    });

    if (domain === DOMAINS.ANIMAL_PET_NATURE && !escalation.hasSevereDistress) {
      modifiers.push({
        code: "lens.calmer_animal_suppression",
        score: -4,
        signals: unique([
          ...globalSignals.signals.chaos,
          ...globalSignals.signals.playfulFunny,
        ]),
        reason: "CALMER suppresses harmless animal chaos.",
      });
    }

    if (format.higherFrictionScore > 0) {
      modifiers.push({
        code: "lens.calmer_outrage_penalty",
        score: roundScore(format.higherFrictionScore * 1.75),
        signals: format.signals.higherFriction,
        reason: "CALMER heavily penalizes outrage-optimized formats.",
      });
    }
  }

  if (lens === LENSES.EDUCATIONAL) {
    modifiers.push({
      code: "lens.educational_context",
      score: roundScore(-(globalSignals.scores.educationalFraming + format.lowerFrictionScore)),
      signals: unique([
        ...globalSignals.signals.educationalFraming,
        ...format.signals.lowerFriction,
      ]),
      reason: "EDUCATIONAL preserves difficult subjects when they are contextual, explanatory, or lecture-like.",
    });
  }

  if (lens === LENSES.BARE_METAL) {
    modifiers.push({
      code: "lens.bare_metal_metadata_only",
      score: 0,
      signals: [],
      reason: "BARE_METAL minimizes interpretation and reports mostly metadata-derived context.",
    });
  }

  return modifiers;
}

export function calculateScores({
  domain,
  globalSignals,
  tone,
  emotions,
  format,
  escalation,
  suppressionModifiers,
  lensModifiers,
}) {
  const baseline = DOMAIN_BASELINES[domain] ?? DOMAIN_BASELINES[DOMAINS.GENERAL];
  const suppressionScore = sumScores(suppressionModifiers);
  const lensScore = sumScores(lensModifiers);
  const rawSignalScore = roundScore(
    globalSignals.scores.outrage * 1.5
      + globalSignals.scores.urgency * 1.4
      + globalSignals.scores.fear * 1.35
      + globalSignals.scores.anger * 1.25
      + globalSignals.scores.intensity
      + globalSignals.scores.chaos * 0.9
      + format.higherFrictionScore * 1.3
      + escalation.signals.severeDistressTerms.length * 4
      - globalSignals.scores.calm * 1.25
      - globalSignals.scores.trust
      - globalSignals.scores.educationalFraming * 0.9
      - format.lowerFrictionScore
  );
  const finalScore = roundScore(
    baseline.score
      + rawSignalScore
      + tone.score
      + emotions.escalatingScore
      - emotions.regulatingScore
      + suppressionScore
      + lensScore,
  );

  return {
    baseline,
    rawSignalScore,
    toneScore: tone.score,
    emotionEscalation: emotions.escalatingScore,
    emotionRegulation: emotions.regulatingScore,
    formatFriction: format.higherFrictionScore,
    formatRegulation: format.lowerFrictionScore,
    suppressionScore,
    lensScore,
    finalScore,
    finalFrictionScore: finalScore,
  };
}

export const scoreContent = calculateScores;

function decideColor({ domain, lens, escalation, scores, format }) {
  if (lens === LENSES.BARE_METAL) {
    return {
      color: escalation.hasSevereDistress ? LABELS.YELLOW : LABELS.GREEN,
      code: "bare_metal.metadata_only",
      reason: "BARE_METAL uses minimal interpretation and only surfaces explicit metadata-level escalation.",
    };
  }

  if (lens === LENSES.CALMER && domain === DOMAINS.ANIMAL_PET_NATURE) {
    if (escalation.hasSevereDistress) {
      return {
        color: LABELS.RED,
        code: "red.animal_severe_distress",
        reason: "Severe animal distress terms override contextual harmlessness suppression.",
      };
    }

    return {
      color: LABELS.GREEN,
      code: "green.animal_contextual_suppression",
      reason: "Harmless animal domain suppressed chaos and intensity signals.",
    };
  }

  if (lens === LENSES.EDUCATIONAL && format.lowerFrictionScore > 0) {
    if (scores.finalScore >= 7 || escalation.hasSevereDistress || escalation.score >= 5) {
      return {
        color: LABELS.YELLOW,
        code: "yellow.educational_difficult_context",
        reason: "Difficult topic is preserved because the format is explanatory or contextual.",
      };
    }

    return {
      color: LABELS.GREEN,
      code: "green.educational_context",
      reason: "Educational lens prioritized depth, context, and explanation.",
    };
  }

  if (scores.finalScore >= 10 || (escalation.hasSevereDistress && scores.finalScore >= 5)) {
    return {
      color: LABELS.RED,
      code: "red.contextual_escalation",
      reason: "Domain, context, format, and lens combine into high escalation.",
    };
  }

  if (scores.finalScore >= (lens === LENSES.CALMER ? 3 : 5)) {
    return {
      color: LABELS.YELLOW,
      code: "yellow.contextual_friction",
      reason: "Contextual interpretation found elevated but not severe friction.",
    };
  }

  return {
    color: LABELS.GREEN,
    code: "green.contextual_low_friction",
    reason: "Contextual interpretation found low friction or regulating intent.",
  };
}

function buildHumanExplanation({
  domain,
  lens,
  decision,
  suppressionModifiers,
  lensModifiers,
  format,
  escalation,
}) {
  const suppression = suppressionModifiers.find((modifier) => modifier.score < 0);
  const lensModifier = lensModifiers.find((modifier) => modifier.score !== 0);

  if (decision.code === "green.animal_contextual_suppression") {
    return "Marked GREEN because harmless animal domain suppressed chaos signals.";
  }

  if (decision.code === "red.animal_severe_distress") {
    return "Marked RED because animal/pet/nature content contains explicit danger or distress terms.";
  }

  if (decision.code === "yellow.educational_difficult_context") {
    return "Marked YELLOW because a difficult topic is presented through explanatory or documentary context.";
  }

  if (decision.code === "green.educational_context") {
    return "Marked GREEN because Educational lens prioritized depth, context, and explanation.";
  }

  if (format.signals.higherFriction.length > 0 && lens === LENSES.CALMER) {
    return "Marked RED/YELLOW because CALMER heavily penalized outrage-optimized format signals.";
  }

  if (suppression) {
    return `Marked ${decision.color} because ${suppression.reason}`;
  }

  if (lensModifier) {
    return `Marked ${decision.color} because ${lensModifier.reason}`;
  }

  if (escalation.hasSevereDistress) {
    return `Marked ${decision.color} because explicit danger or distress terms were detected.`;
  }

  return `Marked ${decision.color} after interpreting signals through ${domain} domain and ${lens} lens context.`;
}

function buildReasons({
  detectedDomain,
  globalSignals,
  tone,
  emotions,
  format,
  escalation,
  suppressionModifiers,
  lensModifiers,
  scores,
  decision,
  explanation,
}) {
  return [
    {
      code: "domain.detected",
      message: `Detected domain: ${detectedDomain.domain}.`,
      terms: detectedDomain.matches,
    },
    {
      code: "tone.signals",
      message: `Detected tone signals across outrage, urgency, fear, anger, intensity, chaos, calm, trust, educational framing, and playful/funny tone.`,
      terms: flattenSignalObject(globalSignals.signals),
      detail: globalSignals.scores,
    },
    {
      code: "tone.heuristics",
      message: `Tone heuristics: all-caps ${tone.allCapsIntensity}, exclamations ${tone.exclamationCount}, punctuation density ${tone.punctuationDensity}.`,
      terms: tone.allCapsWords,
    },
    {
      code: "emotion.categories",
      message: "Emotion categories scored for calm/regulation, anger/outrage, fear/panic, joy/playfulness, trust/informational, disgust/shock, and sadness/distress.",
      terms: flattenEmotionMatches(emotions),
      detail: Object.fromEntries(
        Object.entries(emotions.categories).map(([category, value]) => [category, value.score]),
      ),
    },
    {
      code: "format.signals",
      message: `Format signals: lower-friction ${format.signals.lowerFriction.length}, higher-friction ${format.signals.higherFriction.length}.`,
      terms: flattenSignalObject(format.signals),
    },
    {
      code: "escalation.signals",
      message: `Escalation signals score ${escalation.score}; severe distress ${escalation.hasSevereDistress}.`,
      terms: flattenSignalObject(escalation.signals),
    },
    {
      code: "suppression.modifiers",
      message: `Suppression modifiers total ${scores.suppressionScore}.`,
      terms: suppressionModifiers.flatMap((modifier) => modifier.signals),
      detail: suppressionModifiers,
    },
    {
      code: "lens.modifiers",
      message: `Lens modifiers total ${scores.lensScore}.`,
      terms: lensModifiers.flatMap((modifier) => modifier.signals),
      detail: lensModifiers,
    },
    {
      code: "score.final",
      message: `Final score ${scores.finalScore}; final color ${decision.color}.`,
      terms: [scores.baseline.reason],
      detail: scores,
    },
    {
      code: decision.code,
      message: explanation,
      terms: [],
    },
  ];
}

export function isLowerFrictionLens(lens) {
  return LOWER_FRICTION_LENS_NAMES.has(asText(lens).toLowerCase());
}

export function isEducationalLens(lens) {
  return EDUCATIONAL_LENS_NAMES.has(asText(lens).toLowerCase());
}

export function isBareMetalLens(lens) {
  return BARE_METAL_LENS_NAMES.has(asText(lens).toLowerCase());
}

function normalizeLens(lens) {
  if (isLowerFrictionLens(lens)) {
    return LENSES.CALMER;
  }

  if (isEducationalLens(lens)) {
    return LENSES.EDUCATIONAL;
  }

  if (isBareMetalLens(lens)) {
    return LENSES.BARE_METAL;
  }

  return asText(lens) || LENSES.DEFAULT;
}

function extractTextParts(content = {}) {
  const metadataText = flattenMetadata([
    content.metadata,
    content.playlist,
    content.category,
    content.categories,
    content.tags,
  ]);
  const title = asText(content.title);
  const channel = asText(content.channel);
  const description = asText(content.description);
  const domainText = joinText(title, channel, metadataText);

  return {
    title,
    channel,
    description,
    metadataText,
    domainText,
    fullText: joinText(title, channel, description, metadataText),
  };
}

function flattenMetadata(values) {
  return values.flatMap((value) => {
    if (value == null) {
      return [];
    }

    if (Array.isArray(value)) {
      return value.map(asText);
    }

    if (typeof value === "object") {
      return Object.values(value).flatMap((nested) => (
        Array.isArray(nested) ? nested.map(asText) : asText(nested)
      ));
    }

    return asText(value);
  }).filter(Boolean).join(" ");
}

function flattenEmotionMatches(emotions) {
  return Object.values(emotions.categories).flatMap((category) => category.matches);
}

function flattenSignalObject(signals) {
  return Object.values(signals).flatMap((terms) => terms);
}

function scoreTerms(matches, weight = 1) {
  return roundScore(matches.reduce((score, term) => (
    score + weight + (term.includes(" ") ? weight * 0.5 : 0)
  ), 0));
}

function sumScores(modifiers) {
  return roundScore(modifiers.reduce((sum, modifier) => sum + modifier.score, 0));
}

function findTerms(text, terms) {
  const source = normalizeText(text);

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

function unique(values) {
  return [...new Set(values.filter(Boolean))];
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

function normalizeText(value) {
  return asText(value)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"');
}

function asText(value) {
  return value == null ? "" : String(value);
}

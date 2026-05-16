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
  RELAXING_AMBIENT: "RELAXING_AMBIENT",
  EDUCATIONAL_TUTORIAL: "EDUCATIONAL_TUTORIAL",
  DOCUMENTARY_LONGFORM: "DOCUMENTARY_LONGFORM",
  HOBBY_CRAFTING: "HOBBY_CRAFTING",
  POLITICS_NEWS: "POLITICS_NEWS",
  DRAMA_REACTION: "DRAMA_REACTION",
  MUSIC_AMBIENT: "RELAXING_AMBIENT",
  COMEDY: "COMEDY",
  GAMING: "GAMING",
  GENERAL: "GENERAL",
  EDUCATIONAL: "EDUCATIONAL_TUTORIAL",
  TUTORIAL: "EDUCATIONAL_TUTORIAL",
  DOCUMENTARY: "DOCUMENTARY_LONGFORM",
  NATURE_AMBIENCE: "RELAXING_AMBIENT",
  OUTRAGE_DRAMA: "DRAMA_REACTION",
  ENTERTAINMENT: "COMEDY",
});

export const SAFE_BASELINE_DOMAINS = Object.freeze([
  DOMAINS.ANIMAL_PET_NATURE,
  DOMAINS.RELAXING_AMBIENT,
  DOMAINS.EDUCATIONAL_TUTORIAL,
  DOMAINS.DOCUMENTARY_LONGFORM,
  DOMAINS.HOBBY_CRAFTING,
]);

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
    status: "SAFE_BASELINE",
    score: -7,
    label: "inherited GREEN",
    reason: "Animal, pet, and nature content inherits harmlessness unless explicit friction overrides it.",
  }),
  [DOMAINS.RELAXING_AMBIENT]: Object.freeze({
    status: "SAFE_BASELINE",
    score: -7,
    label: "inherited GREEN",
    reason: "Relaxing ambient content inherits calmness by default.",
  }),
  [DOMAINS.EDUCATIONAL_TUTORIAL]: Object.freeze({
    status: "SAFE_BASELINE",
    score: -5,
    label: "inherited GREEN",
    reason: "Educational/tutorial content inherits an intentional learning baseline.",
  }),
  [DOMAINS.DOCUMENTARY_LONGFORM]: Object.freeze({
    status: "SAFE_BASELINE",
    score: -4,
    label: "contextual GREEN",
    reason: "Documentary/longform content often contextualizes difficult topics.",
  }),
  [DOMAINS.HOBBY_CRAFTING]: Object.freeze({
    status: "SAFE_BASELINE",
    score: -5,
    label: "inherited GREEN",
    reason: "Hobby and crafting content usually supports low-friction intentional activity.",
  }),
  [DOMAINS.POLITICS_NEWS]: Object.freeze({
    status: "NEUTRAL_BASELINE",
    score: 0,
    label: "neutral",
    reason: "Politics and news require contextual interpretation before color selection.",
  }),
  [DOMAINS.DRAMA_REACTION]: Object.freeze({
    status: "SCRUTINY_BASELINE",
    score: 4,
    label: "elevated scrutiny",
    reason: "Drama and reaction formats are often optimized for escalation.",
  }),
  [DOMAINS.COMEDY]: Object.freeze({
    status: "PLAYFUL_BASELINE",
    score: -1,
    label: "playful baseline",
    reason: "Comedy may use chaos as play rather than conflict.",
  }),
  [DOMAINS.GAMING]: Object.freeze({
    status: "NEUTRAL_BASELINE",
    score: 0,
    label: "neutral",
    reason: "Gaming tone varies by format and intensity.",
  }),
  [DOMAINS.GENERAL]: Object.freeze({
    status: "NEUTRAL_BASELINE",
    score: 0,
    label: "neutral",
    reason: "General content starts neutral until context is detected.",
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
      "mini lop",
    ],
  },
  {
    domain: DOMAINS.RELAXING_AMBIENT,
    priority: 95,
    terms: [
      "ambient",
      "ambience",
      "rainforest ambience",
      "rain sounds",
      "nature sounds",
      "ocean sounds",
      "forest sounds",
      "lofi",
      "lo-fi",
      "sleep sounds",
      "white noise",
      "relaxing",
      "peaceful",
      "soothing",
      "calm music",
      "study music",
    ],
  },
  {
    domain: DOMAINS.EDUCATIONAL_TUTORIAL,
    priority: 90,
    terms: [
      "tutorial",
      "beginner",
      "explained",
      "explainer",
      "lecture",
      "course",
      "lesson",
      "walkthrough",
      "how to",
      "step by step",
      "guide",
      "analysis",
      "context",
      "university",
    ],
  },
  {
    domain: DOMAINS.DOCUMENTARY_LONGFORM,
    priority: 86,
    terms: [
      "documentary",
      "docuseries",
      "longform",
      "long-form",
      "long-form discussion",
      "long form discussion",
      "field report",
      "investigation",
      "coverage",
      "interview",
    ],
  },
  {
    domain: DOMAINS.HOBBY_CRAFTING,
    priority: 82,
    terms: [
      "craft",
      "crafting",
      "knitting",
      "crochet",
      "woodworking",
      "gardening",
      "painting",
      "drawing",
      "hobby",
      "diy",
    ],
  },
  {
    domain: DOMAINS.DRAMA_REACTION,
    priority: 70,
    terms: [
      "drama",
      "reaction",
      "reaction stream",
      "reaction clip",
      "meltdown",
      "rant",
      "exposed",
      "outrage",
      "destroyed",
      "freakout",
      "debate fight",
      "drama compilation",
      "ragebait",
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
      "policy",
      "market",
      "markets",
      "coverage",
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
    ],
  },
];

const SIGNAL_TERMS = Object.freeze({
  severeDistress: Object.freeze([
    "abuse",
    "injury",
    "injured",
    "blood",
    "death",
    "died",
    "crisis",
    "rescue crisis",
    "starvation",
    "starving",
    "emergency",
    "danger",
    "violent",
    "violence",
  ]),
  redEscalation: Object.freeze([
    "ragebait",
    "outrage optimization",
    "outrage",
    "terrifying",
    "fear escalation",
    "violent",
    "brutal",
    "panic emergency",
  ]),
  mildFriction: Object.freeze([
    "controversy",
    "controversial",
    "chaotic",
    "excessive stimulation",
    "drama",
    "loud",
    "frenetic",
    "clickbait",
    "crazy",
    "wild",
    "fails",
    "fail",
    "meltdown",
    "fight",
    "panic",
    "shocking",
    "debate",
  ]),
  animalSuppressed: Object.freeze([
    "funny",
    "zoomies",
    "silly",
    "playful",
    "playing",
    "energetic",
    "energy",
    "loud",
    "screaming",
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
    "routine",
  ]),
  educational: Object.freeze([
    "tutorial",
    "explained",
    "lecture",
    "lesson",
    "analysis",
    "context",
    "documentary",
    "interview",
    "guide",
  ]),
  metadataPositive: Object.freeze([
    "public radio",
    "pbs",
    "npr",
    "university",
    "long-form",
    "longform",
    "tutorial",
    "documentary",
    "hobby",
  ]),
  metadataNegative: Object.freeze([
    "reaction",
    "ragebait",
    "drama thumbnail",
    "meltdown",
    "destroyed",
    "humiliated",
    "outrage",
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
  const domain = detectedDomain.domain;
  const baselineStatus = determineBaselineStatus(detectedDomain);
  const globalSignals = detectGlobalSignals(textParts.fullText);
  const tone = analyzeTone(textParts.fullText, globalSignals);
  const emotions = analyzeEmotions(textParts.fullText, globalSignals);
  const format = analyzeFormat(textParts.fullText);
  const escalationOverrides = detectEscalationOverrides({
    domain,
    globalSignals,
    tone,
    format,
  });
  const suppressionModifiers = calculateSuppressionModifiers({
    domain,
    globalSignals,
    escalationOverrides,
  });
  const lensModifiers = calculateLensModifiers({
    lens,
    domain,
    baselineStatus,
    globalSignals,
    format,
    escalationOverrides,
  });
  const frictionTerms = calculateFrictionTerms({
    domain,
    globalSignals,
    escalationOverrides,
    suppressionModifiers,
  });
  const scores = calculateScores({
    baselineStatus,
    tone,
    emotions,
    format,
    escalationOverrides,
    suppressionModifiers,
    lensModifiers,
    frictionTerms,
  });
  const decision = decideColor({
    lens,
    domain,
    baselineStatus,
    escalationOverrides,
    frictionTerms,
    scores,
  });
  const explanation = buildHumanExplanation({
    decision,
    domain,
    baselineStatus,
    escalationOverrides,
    frictionTerms,
  });
  const reasons = buildReasons({
    detectedDomain,
    baselineStatus,
    globalSignals,
    tone,
    format,
    escalationOverrides,
    suppressionModifiers,
    lensModifiers,
    frictionTerms,
    scores,
    decision,
    explanation,
  });

  return {
    label: decision.color,
    color: decision.color,
    finalColor: decision.color,
    domain,
    detectedDomain,
    baselineStatus,
    lens,
    globalSignals,
    tone,
    toneSignals: globalSignals.signals,
    emotions,
    emotion: emotions,
    format,
    sourceFormat: format,
    sourceFormatSignals: format.signals,
    escalationOverrides,
    escalation: escalationOverrides,
    escalationSignals: escalationOverrides.signals,
    suppressionModifiers,
    lensModifiers,
    frictionTerms,
    scores,
    finalScore: scores.finalScore,
    finalFrictionScore: scores.finalScore,
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
      const domainMatches = findTerms(textParts.domainText, definition.terms);
      const metadataMatches = findTerms(textParts.metadataText, definition.terms);
      const domainWeight = definition.domain === DOMAINS.EDUCATIONAL_TUTORIAL ? 1.25 : 1;
      const score = scoreTerms(domainMatches, domainWeight)
        + scoreTerms(metadataMatches, domainWeight + 0.25)
        + (domainMatches.length > 0 || metadataMatches.length > 0 ? definition.priority / 100 : 0);

      return {
        domain: definition.domain,
        matches: unique([...domainMatches, ...metadataMatches]),
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
    score: selected.score,
    priority: selected.priority,
    candidates,
    baseline: DOMAIN_BASELINES[selected.domain],
  };
}

export function detectGlobalSignals(input = "") {
  const text = normalizeText(input);
  const signals = {
    severeDistress: findTerms(text, SIGNAL_TERMS.severeDistress),
    redEscalation: findTerms(text, SIGNAL_TERMS.redEscalation),
    mildFriction: findTerms(text, SIGNAL_TERMS.mildFriction),
    animalSuppressed: findTerms(text, SIGNAL_TERMS.animalSuppressed),
    calm: findTerms(text, SIGNAL_TERMS.calm),
    educational: findTerms(text, SIGNAL_TERMS.educational),
  };
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
  const excessiveStimulationScore = roundScore(
    (exclamationCount >= 3 ? 2 : exclamationCount > 0 ? 0.5 : 0)
      + (punctuationDensity >= 0.08 ? 1.5 : punctuationDensity >= 0.04 ? 0.75 : 0)
      + (allCapsIntensity >= 0.45 && allCapsWords.length >= 2 ? 2 : allCapsWords.length >= 2 ? 1 : 0),
  );
  const escalationScore = roundScore(
    globalSignals.scores.mildFriction
      + globalSignals.scores.redEscalation * 1.5
      + globalSignals.scores.severeDistress * 2
      + excessiveStimulationScore,
  );
  const regulationScore = roundScore(
    globalSignals.scores.calm * 1.25
      + globalSignals.scores.educational,
  );

  return {
    score: roundScore(escalationScore - regulationScore),
    escalationScore,
    regulationScore,
    excessiveStimulationScore,
    allCapsIntensity: roundScore(allCapsIntensity),
    allCapsWords,
    allCapsWordCount: allCapsWords.length,
    exclamationCount,
    punctuationDensity: roundScore(punctuationDensity),
    signals: globalSignals.signals,
  };
}

export function analyzeEmotions(input = "", globalSignals = detectGlobalSignals(input)) {
  const calmRegulation = globalSignals.scores.calm;
  const trustInformational = globalSignals.scores.educational;
  const joyPlayfulness = globalSignals.scores.animalSuppressed;
  const fearPanic = scoreTerms(intersection(globalSignals.signals.mildFriction, [
    "panic",
    "shocking",
  ]));
  const angerOutrage = scoreTerms(intersection(globalSignals.signals.redEscalation, [
    "outrage",
    "ragebait",
  ]));
  const sadnessDistress = globalSignals.scores.severeDistress;
  const disgustShock = scoreTerms(intersection(globalSignals.signals.mildFriction, [
    "shocking",
  ]));
  const categories = {
    [EMOTION_CATEGORIES.CALM_REGULATION]: {
      matches: globalSignals.signals.calm,
      score: calmRegulation,
    },
    [EMOTION_CATEGORIES.ANGER_OUTRAGE]: {
      matches: intersection(globalSignals.signals.redEscalation, ["outrage", "ragebait"]),
      score: angerOutrage,
    },
    [EMOTION_CATEGORIES.FEAR_PANIC]: {
      matches: intersection(globalSignals.signals.mildFriction, ["panic", "shocking"]),
      score: fearPanic,
    },
    [EMOTION_CATEGORIES.JOY_PLAYFULNESS]: {
      matches: globalSignals.signals.animalSuppressed,
      score: joyPlayfulness,
    },
    [EMOTION_CATEGORIES.TRUST_INFORMATIONAL]: {
      matches: globalSignals.signals.educational,
      score: trustInformational,
    },
    [EMOTION_CATEGORIES.DISGUST_SHOCK]: {
      matches: intersection(globalSignals.signals.mildFriction, ["shocking"]),
      score: disgustShock,
    },
    [EMOTION_CATEGORIES.SADNESS_DISTRESS]: {
      matches: globalSignals.signals.severeDistress,
      score: sadnessDistress,
    },
  };

  return {
    categories,
    regulatingScore: roundScore(calmRegulation + trustInformational),
    escalatingScore: roundScore(fearPanic + angerOutrage + sadnessDistress + disgustShock),
    joyPlayfulnessScore: joyPlayfulness,
  };
}

export function analyzeFormat(input = "") {
  const text = normalizeText(input);
  const lowerFriction = findTerms(text, SIGNAL_TERMS.metadataPositive);
  const higherFriction = findTerms(text, SIGNAL_TERMS.metadataNegative);

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

export function detectEscalationOverrides({
  domain,
  globalSignals,
  tone,
  format,
}) {
  const severeDistressTerms = globalSignals.signals.severeDistress;
  const redTerms = unique([
    ...globalSignals.signals.redEscalation,
    ...format.signals.higherFriction.filter((term) => [
      "ragebait",
      "outrage",
    ].includes(term)),
  ]);
  const mildTerms = unique([
    ...globalSignals.signals.mildFriction,
    ...format.signals.higherFriction,
  ]);
  const excessiveStimulation = tone.excessiveStimulationScore >= 2;
  const hasRedOverride = severeDistressTerms.length > 0
    || redTerms.length > 0
    || (domain !== DOMAINS.ANIMAL_PET_NATURE && mildTerms.includes("panic") && excessiveStimulation);
  const hasYellowOverride = !hasRedOverride && (
    mildTerms.length > 0
      || excessiveStimulation
  );

  return {
    hasRedOverride,
    hasYellowOverride,
    hasSevereDistress: severeDistressTerms.length > 0,
    hasExplicitDistress: severeDistressTerms.length > 0,
    severeDistressTerms,
    redTerms,
    mildTerms,
    excessiveStimulation,
    score: roundScore(
      scoreTerms(severeDistressTerms, 4)
        + scoreTerms(redTerms, 3)
        + scoreTerms(mildTerms, 1.25)
        + tone.excessiveStimulationScore,
    ),
    signals: {
      severeDistressTerms,
      redTerms,
      mildTerms,
      excessiveStimulation: excessiveStimulation ? ["excessive stimulation"] : [],
    },
  };
}

export function calculateSuppressionModifiers({
  domain,
  globalSignals,
  escalationOverrides,
}) {
  const modifiers = [];

  if (domain === DOMAINS.ANIMAL_PET_NATURE && !escalationOverrides.hasRedOverride) {
    const playContext = globalSignals.signals.animalSuppressed.some((term) => [
      "funny",
      "zoomies",
      "silly",
      "playful",
      "playing",
    ].includes(term));
    const conditionallyHarmless = playContext
      ? escalationOverrides.mildTerms.filter((term) => [
        "chaotic",
        "crazy",
        "wild",
        "fails",
        "fail",
      ].includes(term))
      : [];
    const suppressible = unique([
      ...globalSignals.signals.animalSuppressed,
      ...escalationOverrides.mildTerms.filter((term) => [
        "loud",
      ].includes(term)),
      ...conditionallyHarmless,
    ]);

    if (suppressible.length > 0) {
      modifiers.push({
        code: "suppress.animal_harmless_energy",
        score: -6,
        signals: suppressible,
        reason: "Animal/pet/nature context suppresses funny, zoomies, silly, playful, energetic, loud, and harmless chaos signals.",
      });
    }
  }

  if (domain === DOMAINS.COMEDY && !escalationOverrides.hasRedOverride) {
    modifiers.push({
      code: "suppress.comedy_harmless_chaos",
      score: -2,
      signals: unique([
        ...globalSignals.signals.animalSuppressed,
        ...escalationOverrides.mildTerms,
      ]),
      reason: "Comedy context treats some chaos as playful rather than escalatory.",
    });
  }

  return modifiers;
}

export function calculateLensModifiers({
  lens,
  domain,
  baselineStatus,
  globalSignals,
  format,
  escalationOverrides,
}) {
  const modifiers = [];

  if (lens === LENSES.CALMER) {
    modifiers.push({
      code: "lens.calmer_safe_baseline",
      score: baselineStatus.isSafeBaseline ? -2 : 0,
      signals: [],
      reason: "CALMER honors safe baselines before applying friction overrides.",
    });

    if (escalationOverrides.redTerms.some((term) => [
      "ragebait",
      "outrage",
    ].includes(term)) || format.higherFrictionScore >= 4) {
      modifiers.push({
        code: "lens.calmer_outrage_penalty",
        score: 4,
        signals: unique([
          ...escalationOverrides.redTerms,
          ...format.signals.higherFriction,
        ]),
        reason: "CALMER heavily penalizes ragebait and outrage optimization.",
      });
    }

    if (domain === DOMAINS.ANIMAL_PET_NATURE && !escalationOverrides.hasRedOverride) {
      modifiers.push({
        code: "lens.calmer_animal_green_default",
        score: -3,
        signals: globalSignals.signals.animalSuppressed,
        reason: "CALMER keeps harmless animal behavior GREEN unless explicit distress overrides it.",
      });
    }
  }

  if (lens === LENSES.EDUCATIONAL) {
    modifiers.push({
      code: "lens.educational_context",
      score: roundScore(-(globalSignals.scores.educational + format.lowerFrictionScore)),
      signals: unique([
        ...globalSignals.signals.educational,
        ...format.signals.lowerFriction,
      ]),
      reason: "EDUCATIONAL prioritizes depth, context, and explanation.",
    });
  }

  if (lens === LENSES.BARE_METAL) {
    modifiers.push({
      code: "lens.bare_metal_metadata_only",
      score: 0,
      signals: [],
      reason: "BARE_METAL minimizes interpretation and surfaces metadata-level context only.",
    });
  }

  return modifiers;
}

export function calculateFrictionTerms({
  domain,
  globalSignals,
  escalationOverrides,
  suppressionModifiers,
}) {
  const suppressed = new Set(suppressionModifiers.flatMap((modifier) => modifier.signals));
  const mild = escalationOverrides.mildTerms.filter((term) => !suppressed.has(term));
  const red = unique([
    ...escalationOverrides.severeDistressTerms,
    ...escalationOverrides.redTerms,
  ]);

  return {
    mild,
    red,
    suppressed: [...suppressed],
    significant: domain === DOMAINS.ANIMAL_PET_NATURE
      ? unique([...red, ...mild.filter((term) => [
        "meltdown",
        "fight",
        "panic",
        "shocking",
        "drama",
        "clickbait",
        "crazy",
        "wild",
        "fails",
        "fail",
      ].includes(term))])
      : unique([...red, ...mild]),
  };
}

export function calculateScores({
  baselineStatus,
  tone,
  emotions,
  format,
  escalationOverrides,
  suppressionModifiers,
  lensModifiers,
  frictionTerms,
}) {
  const suppressionScore = sumScores(suppressionModifiers);
  const lensScore = sumScores(lensModifiers);
  const finalScore = roundScore(
    baselineStatus.score
      + tone.score
      + emotions.escalatingScore
      - emotions.regulatingScore
      + format.higherFrictionScore
      - format.lowerFrictionScore
      + escalationOverrides.score
      + suppressionScore
      + lensScore
      + frictionTerms.significant.length,
  );

  return {
    baselineScore: baselineStatus.score,
    toneScore: tone.score,
    emotionEscalation: emotions.escalatingScore,
    emotionRegulation: emotions.regulatingScore,
    formatFriction: format.higherFrictionScore,
    formatRegulation: format.lowerFrictionScore,
    escalationScore: escalationOverrides.score,
    suppressionScore,
    lensScore,
    significantFrictionCount: frictionTerms.significant.length,
    finalScore,
  };
}

export const scoreContent = calculateScores;

function decideColor({
  lens,
  domain,
  baselineStatus,
  escalationOverrides,
  frictionTerms,
  scores,
}) {
  if (lens === LENSES.BARE_METAL) {
    return {
      color: escalationOverrides.hasRedOverride ? LABELS.YELLOW : LABELS.GREEN,
      reason: "BARE_METAL uses minimal interpretation and only surfaces explicit metadata-level friction.",
      code: "bare_metal.metadata_only",
    };
  }

  if (escalationOverrides.hasRedOverride) {
    return {
      color: LABELS.RED,
      reason: "Severe distress or outrage optimization overrode the domain baseline.",
      code: "red.severe_distress_override",
    };
  }

  if (baselineStatus.isSafeBaseline) {
    if (frictionTerms.significant.length === 0) {
      return {
        color: LABELS.GREEN,
        reason: "Safe baseline domain detected and no significant friction terms remained after contextual interpretation.",
        code: "green.safe_baseline_default",
      };
    }

    return {
      color: LABELS.YELLOW,
      reason: "Safe baseline domain contained mild drama, clickbait, chaotic formatting, or frenetic wording.",
      code: "yellow.safe_baseline_mild_override",
    };
  }

  if (domain === DOMAINS.DRAMA_REACTION || scores.finalScore >= 5 || escalationOverrides.hasYellowOverride) {
    return {
      color: scores.finalScore >= 10 ? LABELS.RED : LABELS.YELLOW,
      reason: "Non-safe domain contained elevated friction signals.",
      code: scores.finalScore >= 10 ? "red.high_friction_domain" : "yellow.non_safe_friction",
    };
  }

  return {
    color: LABELS.GREEN,
    reason: "No meaningful friction override was detected.",
    code: "green.low_friction",
  };
}

function determineBaselineStatus(detectedDomain) {
  const baseline = DOMAIN_BASELINES[detectedDomain.domain] ?? DOMAIN_BASELINES[DOMAINS.GENERAL];
  const isSafeBaseline = SAFE_BASELINE_DOMAINS.includes(detectedDomain.domain)
    && detectedDomain.score >= 1.5;

  return {
    domain: detectedDomain.domain,
    isSafeBaseline,
    status: isSafeBaseline ? "SAFE_BASELINE" : baseline.status,
    score: isSafeBaseline ? baseline.score : Math.min(baseline.score, 0),
    label: baseline.label,
    reason: baseline.reason,
    strength: detectedDomain.score,
  };
}

function buildHumanExplanation({
  decision,
  domain,
  baselineStatus,
  escalationOverrides,
  frictionTerms,
}) {
  if (decision.code === "red.severe_distress_override") {
    return "Marked RED because severe distress terms overrode safe domain baseline.";
  }

  if (decision.code === "yellow.safe_baseline_mild_override") {
    return `Marked YELLOW because harmless ${humanDomain(domain)} domain contained mild drama/clickbait wording.`;
  }

  if (decision.code === "green.safe_baseline_default") {
    if (domain === DOMAINS.ANIMAL_PET_NATURE && frictionTerms.suppressed.length > 0) {
      return "Marked GREEN because harmless animal domain detected and contextual suppression removed harmless energy signals.";
    }

    return "Marked GREEN because safe baseline domain detected and no escalation signals found.";
  }

  if (baselineStatus.isSafeBaseline) {
    return `Marked ${decision.color} after applying safe baseline interpretation.`;
  }

  return `Marked ${decision.color} after contextual friction analysis.`;
}

function buildReasons({
  detectedDomain,
  baselineStatus,
  globalSignals,
  tone,
  format,
  escalationOverrides,
  suppressionModifiers,
  lensModifiers,
  frictionTerms,
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
      code: "baseline.status",
      message: `Baseline status: ${baselineStatus.status}; ${baselineStatus.reason}`,
      terms: [baselineStatus.label],
      detail: baselineStatus,
    },
    {
      code: "escalation.overrides",
      message: `Escalation overrides: red=${escalationOverrides.hasRedOverride}, yellow=${escalationOverrides.hasYellowOverride}.`,
      terms: flattenSignalObject(escalationOverrides.signals),
      detail: escalationOverrides,
    },
    {
      code: "suppression.modifiers",
      message: `Suppression modifiers total ${scores.suppressionScore}.`,
      terms: suppressionModifiers.flatMap((modifier) => modifier.signals),
      detail: suppressionModifiers,
    },
    {
      code: "friction.terms",
      message: `Friction terms after contextual suppression: ${frictionTerms.significant.length}.`,
      terms: frictionTerms.significant,
      detail: frictionTerms,
    },
    {
      code: "tone.analysis",
      message: `Tone score ${tone.score}; exclamations ${tone.exclamationCount}; all-caps intensity ${tone.allCapsIntensity}.`,
      terms: flattenSignalObject(globalSignals.signals),
      detail: tone,
    },
    {
      code: "metadata.modifiers",
      message: `Metadata/format modifiers lower=${format.lowerFrictionScore}, higher=${format.higherFrictionScore}.`,
      terms: flattenSignalObject(format.signals),
      detail: format,
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
      terms: [],
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

function humanDomain(domain) {
  return domain === DOMAINS.ANIMAL_PET_NATURE ? "animal" : domain.toLowerCase().replaceAll("_", " ");
}

function flattenSignalObject(signals) {
  return Object.values(signals).flatMap((terms) => (
    Array.isArray(terms) ? terms : []
  ));
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

function intersection(values, terms) {
  return values.filter((value) => terms.includes(value));
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

export const LABELS = Object.freeze({
  GREEN: "GREEN",
  YELLOW: "YELLOW",
  RED: "RED",
});

export const LENSES = Object.freeze({
  CALMER: "CALMER",
  EDUCATIONAL: "EDUCATIONAL",
  DEFAULT: "DEFAULT",
});

export const DOMAINS = Object.freeze({
  ANIMAL_PET_NATURE: "ANIMAL_PET_NATURE",
  EDUCATIONAL_TUTORIAL: "EDUCATIONAL_TUTORIAL",
  POLITICS_NEWS: "POLITICS_NEWS",
  DRAMA_REACTION: "DRAMA_REACTION",
  ENTERTAINMENT: "ENTERTAINMENT",
  MUSIC_AMBIENT: "MUSIC_AMBIENT",
  GENERAL: "GENERAL",
  NATURE_AMBIENCE: "MUSIC_AMBIENT",
  EDUCATIONAL_LONGFORM: "EDUCATIONAL_TUTORIAL",
  OUTRAGE_DRAMA: "DRAMA_REACTION",
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
    reason: "Animal, pet, and nature content starts with a strong regulation baseline.",
  }),
  [DOMAINS.EDUCATIONAL_TUTORIAL]: Object.freeze({
    score: -3,
    label: "moderately GREEN",
    reason: "Tutorial and explanatory formats tend to support intentional learning.",
  }),
  [DOMAINS.POLITICS_NEWS]: Object.freeze({
    score: 0,
    label: "neutral",
    reason: "Politics and news need tone and source-format context before coloring.",
  }),
  [DOMAINS.DRAMA_REACTION]: Object.freeze({
    score: 3,
    label: "elevated scrutiny",
    reason: "Drama and reaction framing often increases emotional friction.",
  }),
  [DOMAINS.ENTERTAINMENT]: Object.freeze({
    score: 0,
    label: "neutral",
    reason: "Entertainment content is context-dependent.",
  }),
  [DOMAINS.MUSIC_AMBIENT]: Object.freeze({
    score: -5,
    label: "strongly GREEN",
    reason: "Music, ambience, and soundscape formats often support low-friction attention.",
  }),
  [DOMAINS.GENERAL]: Object.freeze({
    score: 0,
    label: "neutral",
    reason: "General content starts neutral until deterministic signals provide context.",
  }),
});

const DOMAIN_DEFINITIONS = [
  {
    domain: DOMAINS.ANIMAL_PET_NATURE,
    terms: [
      "rabbit",
      "rabbits",
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
    ],
  },
  {
    domain: DOMAINS.MUSIC_AMBIENT,
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
    ],
  },
  {
    domain: DOMAINS.POLITICS_NEWS,
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
    ],
  },
  {
    domain: DOMAINS.EDUCATIONAL_TUTORIAL,
    terms: [
      "tutorial",
      "explained",
      "explainer",
      "walkthrough",
      "lecture",
      "lesson",
      "course",
      "documentary",
      "analysis",
      "context",
      "study",
      "deep dive",
      "guide",
      "how to",
    ],
  },
  {
    domain: DOMAINS.ENTERTAINMENT,
    terms: [
      "funny",
      "compilation",
      "shorts",
      "memes",
      "challenge",
      "gaming",
      "music video",
      "standup",
      "comedy",
      "trailer",
      "highlights",
    ],
  },
];

const TONE_HEURISTIC_TERMS = Object.freeze({
  urgencyPhrases: Object.freeze([
    "urgent",
    "emergency",
    "right now",
    "must see",
    "breaking",
    "breaking news",
    "panic",
    "massive problem",
    "you won't believe",
  ]),
  intensifiers: Object.freeze([
    "very",
    "so",
    "totally",
    "absolutely",
    "extremely",
    "massive",
    "huge",
    "insane",
    "unbelievable",
    "shocking",
  ]),
  emotionallyLoadedWords: Object.freeze([
    "attack",
    "brutal",
    "destroyed",
    "disaster",
    "disturbing",
    "emergency",
    "exposed",
    "freakout",
    "meltdown",
    "outrage",
    "panic",
    "shocking",
    "terrifying",
  ]),
  calmRegulatingWords: Object.freeze([
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
  ]),
});

const EMOTION_LEXICON = Object.freeze({
  [EMOTION_CATEGORIES.CALM_REGULATION]: Object.freeze([
    "relaxing",
    "peaceful",
    "soothing",
    "cozy",
    "wholesome",
    "calm",
    "gentle",
    "quiet",
    "ambient",
    "bonding",
    "care",
    "routine",
    "soft spoken",
  ]),
  [EMOTION_CATEGORIES.ANGER_OUTRAGE]: Object.freeze([
    "angry",
    "anger",
    "outrage",
    "furious",
    "rage",
    "rant",
    "heated",
    "fight",
    "destroyed",
  ]),
  [EMOTION_CATEGORIES.FEAR_PANIC]: Object.freeze([
    "fear",
    "panic",
    "terrifying",
    "scary",
    "urgent",
    "emergency",
    "crisis",
    "attack",
  ]),
  [EMOTION_CATEGORIES.JOY_PLAYFULNESS]: Object.freeze([
    "funny",
    "cute",
    "silly",
    "playful",
    "goofy",
    "excited",
    "joy",
    "zoomies",
    "compilation",
    "hyper",
    "chaotic",
  ]),
  [EMOTION_CATEGORIES.TRUST_INFORMATIONAL]: Object.freeze([
    "explained",
    "analysis",
    "context",
    "lecture",
    "documentary",
    "interview",
    "tutorial",
    "walkthrough",
    "university",
    "public radio",
    "pbs",
    "npr",
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
    "died",
    "death",
    "abuse",
    "crying",
    "breakdown",
  ]),
});

const SOURCE_FORMAT_TERMS = Object.freeze({
  lowerFriction: Object.freeze([
    "public radio",
    "pbs",
    "npr",
    "university",
    "lecture",
    "documentary",
    "interview",
    "long-form discussion",
    "long form discussion",
    "tutorial",
    "explained",
    "analysis",
    "context",
  ]),
  higherFriction: Object.freeze([
    "reaction clip",
    "reaction",
    "rant",
    "exposed",
    "meltdown",
    "breaking outrage",
    "debate fight",
    "drama compilation",
    "freakout",
  ]),
});

const ESCALATION_TERMS = Object.freeze([
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
]);

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

export function labelContent(content = {}) {
  const lens = normalizeLens(content.lens);
  const detectedDomain = detectDomain(content);
  const text = getText(content);
  const tone = analyzeTone(text);
  const emotions = analyzeEmotions(text);
  const sourceFormat = analyzeSourceFormat(text);
  const escalation = analyzeEscalation({ text, tone, emotions, sourceFormat });
  const scores = scoreContent({
    domain: detectedDomain.domain,
    tone,
    emotions,
    sourceFormat,
    escalation,
    lens,
  });
  const decision = decideColor({
    domain: detectedDomain.domain,
    lens,
    scores,
    escalation,
    sourceFormat,
    emotions,
  });
  const reasons = buildReasons({
    lens,
    detectedDomain,
    tone,
    emotions,
    sourceFormat,
    escalation,
    scores,
    decision,
  });

  return {
    label: decision.color,
    finalColor: decision.color,
    domain: detectedDomain.domain,
    detectedDomain,
    lens,
    tone,
    emotion: emotions,
    emotions,
    sourceFormat,
    escalation,
    scores,
    toneSignals: tone.signals,
    sourceFormatSignals: sourceFormat.signals,
    escalationSignals: escalation.signals,
    reasons,
    reason: decision.reason,
    finalReason: decision.reason,
    explanation: reasons.map((entry) => entry.message).join(" "),
  };
}

export const classifyContent = labelContent;

export function detectDomain(content = {}) {
  const domainText = joinText(content.title, content.channel);
  const candidates = DOMAIN_DEFINITIONS
    .map((definition) => ({
      domain: definition.domain,
      matches: findTerms(domainText, definition.terms),
    }))
    .filter((candidate) => candidate.matches.length > 0);
  const selected = candidates[0] ?? {
    domain: DOMAINS.GENERAL,
    matches: [],
  };

  return {
    domain: selected.domain,
    matches: selected.matches,
    candidates,
    baseline: DOMAIN_BASELINES[selected.domain],
  };
}

export function analyzeTone(input = "") {
  const text = normalizeText(input);
  const words = text.match(/[A-Za-z][A-Za-z']*/g) ?? [];
  const punctuationCount = countMatches(text, /[!?]/g);
  const exclamationCount = countMatches(text, /!/g);
  const punctuationDensity = punctuationCount / Math.max(text.length, 1);
  const allCapsWords = words.filter((word) => (
    word.length > 2
      && word === word.toUpperCase()
      && /[A-Z]/.test(word)
  ));
  const allCapsRatio = words.length === 0 ? 0 : allCapsWords.length / words.length;
  const signals = {
    allCapsWords,
    urgencyPhrases: findTerms(text, TONE_HEURISTIC_TERMS.urgencyPhrases),
    intensifiers: findTerms(text, TONE_HEURISTIC_TERMS.intensifiers),
    emotionallyLoadedWords: findTerms(text, TONE_HEURISTIC_TERMS.emotionallyLoadedWords),
    calmRegulatingWords: findTerms(text, TONE_HEURISTIC_TERMS.calmRegulatingWords),
  };
  const escalationScore = roundScore(
    scoreTerms(signals.urgencyPhrases, 2)
      + scoreTerms(signals.intensifiers, 0.75)
      + scoreTerms(signals.emotionallyLoadedWords, 1.5)
      + (exclamationCount >= 3 ? 2 : exclamationCount > 0 ? 0.75 : 0)
      + (punctuationDensity >= 0.08 ? 1.5 : punctuationDensity >= 0.04 ? 0.75 : 0)
      + (allCapsRatio >= 0.45 && allCapsWords.length >= 2 ? 2 : allCapsWords.length >= 2 ? 1 : 0),
  );
  const regulationScore = roundScore(scoreTerms(signals.calmRegulatingWords, 1.25));

  return {
    score: roundScore(escalationScore - regulationScore),
    escalationScore,
    regulationScore,
    punctuationDensity: roundScore(punctuationDensity),
    exclamationCount,
    allCapsIntensity: roundScore(allCapsRatio),
    allCapsWordCount: allCapsWords.length,
    signals,
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

export function analyzeSourceFormat(input = "") {
  const text = normalizeText(input);
  const lowerFriction = findTerms(text, SOURCE_FORMAT_TERMS.lowerFriction);
  const higherFriction = findTerms(text, SOURCE_FORMAT_TERMS.higherFriction);

  return {
    lowerFrictionScore: scoreTerms(lowerFriction, 1.5),
    higherFrictionScore: scoreTerms(higherFriction, 1.75),
    signals: {
      lowerFriction,
      higherFriction,
    },
  };
}

export function analyzeEscalation({ text = "", tone, emotions, sourceFormat } = {}) {
  const normalized = normalizeText(text);
  const distressTerms = findTerms(normalized, ESCALATION_TERMS);
  const signals = {
    distressTerms,
    urgencyPhrases: tone?.signals?.urgencyPhrases ?? [],
    emotionallyLoadedWords: tone?.signals?.emotionallyLoadedWords ?? [],
    highFrictionFormats: sourceFormat?.signals?.higherFriction ?? [],
    angerOutrage: emotions?.categories?.[EMOTION_CATEGORIES.ANGER_OUTRAGE]?.matches ?? [],
    fearPanic: emotions?.categories?.[EMOTION_CATEGORIES.FEAR_PANIC]?.matches ?? [],
    disgustShock: emotions?.categories?.[EMOTION_CATEGORIES.DISGUST_SHOCK]?.matches ?? [],
    sadnessDistress: emotions?.categories?.[EMOTION_CATEGORIES.SADNESS_DISTRESS]?.matches ?? [],
  };
  const explicitDistressScore = scoreTerms(distressTerms, 3);
  const score = roundScore(
    explicitDistressScore
      + (tone?.escalationScore ?? 0)
      + ((emotions?.escalatingScore ?? 0) * 1.25)
      + ((sourceFormat?.higherFrictionScore ?? 0) * 1.25),
  );

  return {
    score,
    explicitDistressScore,
    hasExplicitDistress: distressTerms.length > 0,
    signals,
  };
}

export function scoreContent({
  domain,
  tone,
  emotions,
  sourceFormat,
  escalation,
  lens,
}) {
  const baseline = DOMAIN_BASELINES[domain] ?? DOMAIN_BASELINES[DOMAINS.GENERAL];
  const lowerFrictionLens = isLowerFrictionLens(lens);
  const educationalLens = isEducationalLens(lens);
  const domainEscalationMultiplier = domain === DOMAINS.DRAMA_REACTION
    ? 1.25
    : domain === DOMAINS.POLITICS_NEWS
      ? 1.1
      : 1;
  const regulationBoost = lowerFrictionLens ? 1.1 : 0.9;
  const educationalBoost = educationalLens ? 1.25 : 1;
  const sourceRegulation = sourceFormat.lowerFrictionScore * educationalBoost;
  const sourceFriction = sourceFormat.higherFrictionScore * (lowerFrictionLens ? 1.15 : 1);
  const emotionRegulation = emotions.regulatingScore * regulationBoost;
  const emotionFriction = emotions.escalatingScore * domainEscalationMultiplier;
  const toneFriction = tone.escalationScore * domainEscalationMultiplier;
  const playfulEnergy = domain === DOMAINS.ANIMAL_PET_NATURE
    ? emotions.joyPlayfulnessScore * 0.15
    : emotions.joyPlayfulnessScore * 0.5;
  const finalFrictionScore = roundScore(
    baseline.score
      + toneFriction
      + emotionFriction
      + sourceFriction
      + playfulEnergy
      + escalation.explicitDistressScore
      - tone.regulationScore
      - emotionRegulation
      - sourceRegulation,
  );

  return {
    baseline,
    toneFriction: roundScore(toneFriction),
    emotionFriction: roundScore(emotionFriction),
    sourceFriction: roundScore(sourceFriction),
    playfulEnergy: roundScore(playfulEnergy),
    explicitDistress: escalation.explicitDistressScore,
    toneRegulation: tone.regulationScore,
    emotionRegulation: roundScore(emotionRegulation),
    sourceRegulation: roundScore(sourceRegulation),
    finalFrictionScore,
  };
}

function decideColor({
  domain,
  lens,
  scores,
  escalation,
  sourceFormat,
  emotions,
}) {
  const lowerFrictionLens = isLowerFrictionLens(lens);
  const educationalLens = isEducationalLens(lens);
  const explicitDistress = escalation.hasExplicitDistress;
  const informationalAnchor = sourceFormat.lowerFrictionScore > 0
    || emotions.categories[EMOTION_CATEGORIES.TRUST_INFORMATIONAL].score > 0;

  if (lowerFrictionLens && domain === DOMAINS.ANIMAL_PET_NATURE) {
    if (explicitDistress) {
      return {
        color: LABELS.RED,
        code: "red.animal_explicit_distress",
        reason: "Animal/pet/nature domain detected, but explicit distress or emergency framing overrides the strong GREEN baseline.",
      };
    }

    return {
      color: LABELS.GREEN,
      code: "green.calmer_animal_default",
      reason: "Animal/pet/nature domain detected; CALMER keeps harmless animal content GREEN unless explicit distress terms exist.",
    };
  }

  if (educationalLens && informationalAnchor) {
    if (explicitDistress || scores.finalFrictionScore >= 8) {
      return {
        color: LABELS.YELLOW,
        code: "yellow.educational_explanatory_intense",
        reason: "Educational lens preserves the subject anchor and keeps explanatory high-intensity content as strong YELLOW instead of suppressing it outright.",
      };
    }

    return {
      color: LABELS.GREEN,
      code: "green.educational_informational",
      reason: "Educational lens found explanatory, contextual, or lecture-style framing with low deterministic friction.",
    };
  }

  if (scores.finalFrictionScore >= 10 || (explicitDistress && scores.finalFrictionScore >= 6)) {
    return {
      color: LABELS.RED,
      code: "red.high_escalation",
      reason: "Escalation, emotion, and source/format signals combine into high deterministic friction.",
    };
  }

  if (scores.finalFrictionScore >= (lowerFrictionLens ? 3 : 5)) {
    return {
      color: LABELS.YELLOW,
      code: "yellow.elevated_friction",
      reason: "Deterministic heuristics found elevated tone, emotion, or source/format friction.",
    };
  }

  return {
    color: LABELS.GREEN,
    code: "green.low_friction",
    reason: "Regulating, informational, or low-intensity signals outweigh escalation signals.",
  };
}

function buildReasons({
  lens,
  detectedDomain,
  tone,
  emotions,
  sourceFormat,
  escalation,
  scores,
  decision,
}) {
  return [
    {
      code: "domain.detected",
      message: `Detected domain: ${detectedDomain.domain}.`,
      terms: detectedDomain.matches,
    },
    {
      code: "lens.selected",
      message: `Selected lens: ${lens}.`,
      terms: [lens],
    },
    {
      code: "tone.signals",
      message: `Tone signals: all-caps intensity ${tone.allCapsIntensity}, exclamation count ${tone.exclamationCount}, urgency ${tone.signals.urgencyPhrases.length}, intensifiers ${tone.signals.intensifiers.length}, loaded words ${tone.signals.emotionallyLoadedWords.length}, regulating words ${tone.signals.calmRegulatingWords.length}.`,
      terms: flattenSignalObject(tone.signals),
    },
    {
      code: "emotion.signals",
      message: `Emotion scores: calm/regulation ${emotionScore(emotions, EMOTION_CATEGORIES.CALM_REGULATION)}, anger/outrage ${emotionScore(emotions, EMOTION_CATEGORIES.ANGER_OUTRAGE)}, fear/panic ${emotionScore(emotions, EMOTION_CATEGORIES.FEAR_PANIC)}, joy/playfulness ${emotionScore(emotions, EMOTION_CATEGORIES.JOY_PLAYFULNESS)}, trust/informational ${emotionScore(emotions, EMOTION_CATEGORIES.TRUST_INFORMATIONAL)}, disgust/shock ${emotionScore(emotions, EMOTION_CATEGORIES.DISGUST_SHOCK)}, sadness/distress ${emotionScore(emotions, EMOTION_CATEGORIES.SADNESS_DISTRESS)}.`,
      terms: flattenEmotionMatches(emotions),
    },
    {
      code: "source_format.signals",
      message: `Source/format signals: lower-friction ${sourceFormat.signals.lowerFriction.length}, higher-friction ${sourceFormat.signals.higherFriction.length}.`,
      terms: flattenSignalObject(sourceFormat.signals),
    },
    {
      code: "escalation.signals",
      message: `Escalation score: ${escalation.score}; explicit distress terms ${escalation.signals.distressTerms.length}.`,
      terms: flattenSignalObject(escalation.signals),
    },
    {
      code: "score.final",
      message: `Final color ${decision.color} from friction score ${scores.finalFrictionScore} with ${scores.baseline.label} baseline.`,
      terms: [scores.baseline.reason],
    },
    {
      code: decision.code,
      message: decision.reason,
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

function normalizeLens(lens) {
  if (isLowerFrictionLens(lens)) {
    return LENSES.CALMER;
  }

  if (isEducationalLens(lens)) {
    return LENSES.EDUCATIONAL;
  }

  return asText(lens) || LENSES.DEFAULT;
}

function getText(content) {
  return joinText(content.title, content.channel, content.description);
}

function emotionScore(emotions, category) {
  return emotions.categories[category].score;
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

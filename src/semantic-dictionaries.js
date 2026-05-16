export const DOMAINS = Object.freeze({
  ANIMAL_PET_NATURE: "ANIMAL_PET_NATURE",
  EDUCATIONAL: "EDUCATIONAL",
  POLITICS_NEWS: "POLITICS_NEWS",
  DRAMA_REACTION: "DRAMA_REACTION",
  MUSIC_AMBIENT: "MUSIC_AMBIENT",
  COMEDY: "COMEDY",
  DOCUMENTARY: "DOCUMENTARY",
  TUTORIAL: "TUTORIAL",
  GENERAL: "GENERAL",
});

export const DOMAIN_TAXONOMIES = Object.freeze({
  [DOMAINS.ANIMAL_PET_NATURE]: Object.freeze({
    terms: [
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
    ],
    baselineSafe: true,
    weight: -1,
  }),
  [DOMAINS.EDUCATIONAL]: Object.freeze({
    terms: ["educational", "explained", "lecture", "course", "analysis", "context"],
    baselineSafe: true,
    weight: -1,
  }),
  [DOMAINS.POLITICS_NEWS]: Object.freeze({
    terms: ["political", "politics", "election", "debate", "news", "policy"],
    baselineSafe: false,
    weight: 0,
  }),
  [DOMAINS.DRAMA_REACTION]: Object.freeze({
    terms: ["drama", "reaction", "meltdown", "rant", "exposed"],
    baselineSafe: false,
    weight: 1,
  }),
  [DOMAINS.MUSIC_AMBIENT]: Object.freeze({
    terms: ["ambient", "ambience", "music", "lofi", "rain sounds", "nature sounds"],
    baselineSafe: true,
    weight: -1,
  }),
  [DOMAINS.COMEDY]: Object.freeze({
    terms: ["comedy", "funny", "sketch", "jokes", "memes"],
    baselineSafe: false,
    weight: -0.5,
  }),
  [DOMAINS.DOCUMENTARY]: Object.freeze({
    terms: ["documentary", "docuseries", "interview", "long-form", "longform"],
    baselineSafe: true,
    weight: -1,
  }),
  [DOMAINS.TUTORIAL]: Object.freeze({
    terms: ["tutorial", "walkthrough", "how to", "guide", "step by step"],
    baselineSafe: true,
    weight: -1,
  }),
});

export const TONE_TAXONOMIES = Object.freeze({
  CALM_REGULATION: Object.freeze({
    terms: ["peaceful", "calm", "relaxing", "gentle", "quiet", "soothing"],
    weight: -2,
  }),
  PLAYFUL_ENERGY: Object.freeze({
    terms: [
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
    ],
    weight: -1,
    contextSensitive: true,
  }),
  EDUCATIONAL_TONE: Object.freeze({
    terms: ["explained", "lecture", "tutorial", "analysis", "context"],
    weight: -1,
  }),
  OUTRAGE_TONE: Object.freeze({
    terms: ["outrage", "rage", "rant", "exposed"],
    weight: 2,
  }),
  FEAR_TONE: Object.freeze({
    terms: ["terrifying", "panic", "crisis", "emergency"],
    weight: 3,
  }),
  DRAMA_TONE: Object.freeze({
    terms: ["drama", "meltdown", "screaming", "loud"],
    weight: 1,
  }),
});

export const FRICTION_TAXONOMIES = Object.freeze({
  ESCALATION: Object.freeze({
    terms: [
      "chaotic",
      "screaming",
      "prank",
      "loud",
      "fails",
      "fail",
      "mild drama",
      "hyper",
      "meltdown",
      "exposed",
    ],
    weight: 1,
  }),
  PANIC: Object.freeze({
    terms: ["panic", "emergency", "crisis"],
    weight: 3,
  }),
  CLICKBAIT: Object.freeze({
    terms: ["exposed", "shocking", "you won't believe"],
    weight: 2,
  }),
  DISTRESS: Object.freeze({
    terms: [
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
    ],
    weight: 3,
    critical: true,
  }),
  DOMINATION_LANGUAGE: Object.freeze({
    terms: ["destroyed", "humiliated", "owned"],
    weight: 2,
  }),
});

export const POSITIVE_REINFORCEMENT_TAXONOMIES = Object.freeze({
  NURTURING: Object.freeze({
    terms: ["care", "senior", "rescue", "room makeover"],
    weight: -1,
  }),
  WHOLESOME: Object.freeze({
    terms: ["cute", "bunny", "puppy", "rabbit"],
    weight: -1,
  }),
  EDUCATIONAL: Object.freeze({
    terms: ["lecture", "tutorial", "explained", "analysis"],
    weight: -1,
  }),
  RELAXING: Object.freeze({
    terms: ["peaceful", "relaxing", "ambient", "soothing"],
    weight: -2,
  }),
  GENTLE: Object.freeze({
    terms: ["gentle", "quiet", "soft"],
    weight: -1,
  }),
  CONSTRUCTIVE: Object.freeze({
    terms: ["makeover", "guide", "how to", "care", "public radio", "npr"],
    weight: -1,
  }),
});

export const LENS_BEHAVIORS = Object.freeze({
  CALMER: Object.freeze({
    boosts: ["ANIMAL_PET_NATURE", "CALM_REGULATION", "RELAXING", "GENTLE"],
    penalizes: ["ESCALATION", "PANIC", "CLICKBAIT", "DISTRESS", "OUTRAGE_TONE"],
  }),
  EDUCATIONAL: Object.freeze({
    boosts: ["EDUCATIONAL", "EDUCATIONAL_TONE", "TUTORIAL", "DOCUMENTARY"],
    penalizes: ["CLICKBAIT", "OUTRAGE_TONE"],
  }),
});

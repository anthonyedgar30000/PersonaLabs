(function attachPersonaLabsSemantic(root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.PersonaLabsSemantic = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function createPersonaLabsSemantic() {
  "use strict";

  const PIPELINE_VERSION = "canonical-semantic-v1";

  const SCENARIO_CATEGORIES = [
    "benign",
    "educational",
    "political",
    "inflammatory",
    "ambiguous",
    "contradictory",
    "manipulation",
    "edge-case",
    "low-context",
    "adversarial-title",
    "semantic-drift"
  ];

  const STYLE_TAXONOMY = {
    escalation: [
      "breaking",
      "urgent",
      "alert",
      "crisis",
      "panic",
      "panics",
      "meltdown",
      "emergency",
      "explosive",
      "apocalypse",
      "doomed",
      "disaster",
      "catastrophe",
      "disturbing",
      "attacked",
      "attack",
      "died",
      "terrifying",
      "emotional breakdown",
      "brutal",
      "war room",
      "just happened"
    ],
    domination: [
      "destroys",
      "destroyed",
      "owns",
      "owned",
      "obliterates",
      "obliterated",
      "humiliates",
      "humiliated",
      "crushes",
      "crushed",
      "roast",
      "roasts",
      "cooked",
      "cooks",
      "cooking him",
      "slams",
      "eviscerates",
      "wrecks",
      "takes down",
      "shuts down"
    ],
    clickbait: [
      "you won't believe",
      "must watch",
      "shocking",
      "insane",
      "crazy",
      "secret",
      "exposed",
      "exposes",
      "bombshell",
      "cover-up",
      "cover up",
      "lies",
      "wild",
      "badly",
      "truth about",
      "what happens next",
      "this changes everything"
    ],
    outrage: [
      "outrage",
      "outraged",
      "furious",
      "rage",
      "ragebait",
      "traitor",
      "terrorist",
      "shameful",
      "unhinged",
      "freakout",
      "loses it",
      "freaks out",
      "goes off",
      "backlash"
    ]
  };

  const EXPLANATORY_TERMS = [
    "analysis",
    "analyzes",
    "context",
    "explained",
    "explainer",
    "educational",
    "history",
    "background",
    "discussion",
    "interview",
    "lecture",
    "seminar",
    "debate",
    "policy",
    "timeline",
    "overview",
    "deep dive",
    "long form",
    "long-form",
    "documentary",
    "primer",
    "guide",
    "explanation",
    "study",
    "research",
    "checklist"
  ];

  const CONTEXTUAL_DOWNWEIGHT_TERMS = [
    "study",
    "research",
    "researchers",
    "published",
    "guide",
    "checklist",
    "preparedness",
    "safety",
    "planning",
    "tutorial",
    "explained",
    "explanation",
    "analysis"
  ];

  const DOMAIN_SOFTENING_TERMS = [
    "satire",
    "parody",
    "comedy",
    "sketch",
    "roast battle",
    "fake debate",
    "boss",
    "final boss",
    "speedrun",
    "gameplay",
    "gaming",
    "match",
    "tournament",
    "goal",
    "knockout",
    "highlights"
  ];

  const PET_PLAY_CONTEXT_TERMS = [
    "playtime",
    "playing",
    "play",
    "funny",
    "cute",
    "zoomies"
  ];

  const CAUTIONARY_CLAIM_TERMS = [
    "hypnosis",
    "reprogram",
    "reprogram your brain",
    "brainwash",
    "manipulation",
    "propaganda",
    "control your mind",
    "guaranteed",
    "secret cure",
    "natural trick",
    "simple trick",
    "savings trick",
    "fixed my",
    "cured",
    "cured my",
    "don't want you to know",
    "banks don't want",
    "is a lie",
    "lied to you",
    "everyone is wrong"
  ];

  const SENSITIVE_GUIDANCE_TERMS = [
    "hurricane",
    "evacuation",
    "shelter",
    "war",
    "court case"
  ];

  const NEUTRAL_REPORTING_TERMS = [
    "denies",
    "says",
    "responds",
    "discusses",
    "explains",
    "addresses",
    "comments",
    "testifies",
    "asks",
    "answers",
    "confirms",
    "states",
    "reports"
  ];

  const LONG_FORM_TERMS = [
    "long form",
    "long-form",
    "full interview",
    "full episode",
    "full discussion",
    "documentary",
    "lecture",
    "seminar",
    "panel",
    "podcast"
  ];

  const INTERVIEW_DISCUSSION_TERMS = [
    "interview",
    "conversation",
    "public radio",
    "podcast",
    "discussion",
    "forum",
    "panel",
    "long-form",
    "long form",
    "full interview"
  ];

  const LOWER_FRICTION_SOURCE_TERMS = [
    "public radio",
    "pbs",
    "npr",
    "university",
    "lecture",
    "institute",
    "library",
    "archive",
    "documentary",
    "official hearing",
    "committee hearing"
  ];

  const MIXED_SOURCE_TERMS = [
    "new media show",
    "opinion show",
    "reaction",
    "clips",
    "live rant",
    "breaking update",
    "debate show"
  ];

  const CALM_LOW_FRICTION_TERMS = [
    "calm",
    "context",
    "explained",
    "overview",
    "discussion",
    "balanced",
    "measured",
    "nuanced",
    "background",
    "primer",
    "guide",
    "civil"
  ];

  const CALM_NATURE_ANIMAL_SIGNALS = [
    "cute",
    "adorable",
    "bunny",
    "rabbit",
    "kitten",
    "cat",
    "puppy",
    "dog",
    "hamster",
    "guinea pig",
    "bird",
    "parrot",
    "aquarium",
    "fish",
    "relaxing",
    "calm",
    "ambient",
    "nature",
    "forest",
    "rain",
    "animal",
    "animals",
    "pet",
    "pets",
    "wildlife",
    "soothing",
    "sleep",
    "peaceful",
    "cozy",
    "chill",
    "meditation",
    "wholesome"
  ];

  const CALM_POSITIVE_TERMS = CALM_NATURE_ANIMAL_SIGNALS;

  const ANIMAL_SUBJECT_TERMS = [
    "animal",
    "animals",
    "pet",
    "pets",
    "cat",
    "cats",
    "kitten",
    "kittens",
    "dog",
    "dogs",
    "puppy",
    "puppies",
    "bunny",
    "bunnies",
    "rabbit",
    "rabbits",
    "bird",
    "birds",
    "wildlife"
  ];

  const HARMLESS_ENERGETIC_TERMS = [
    "hyper",
    "loud",
    "prank",
    "chase",
    "chaos",
    "fail",
    "messy",
    "crazy",
    "zoomies",
    "screaming",
    "fast-cut",
    "fast cut"
  ];

  const ANIMAL_DISTRESS_TERMS = [
    "shocking",
    "panic",
    "attack",
    "attacks",
    "attacked",
    "injury",
    "injured",
    "died",
    "death",
    "emergency",
    "terrifying",
    "disturbing",
    "brutal",
    "abuse",
    "rescue crisis",
    "exposed"
  ];

  const BEGINNER_TERMS = [
    "beginner",
    "intro",
    "introduction",
    "basics",
    "simple",
    "overview",
    "primer",
    "guide",
    "explained"
  ];

  const STOP_WORDS = new Set([
    "a",
    "about",
    "above",
    "after",
    "again",
    "against",
    "all",
    "am",
    "an",
    "and",
    "any",
    "are",
    "as",
    "at",
    "be",
    "because",
    "been",
    "before",
    "being",
    "below",
    "between",
    "both",
    "but",
    "by",
    "can",
    "did",
    "do",
    "does",
    "doing",
    "down",
    "during",
    "each",
    "few",
    "for",
    "from",
    "further",
    "had",
    "has",
    "have",
    "having",
    "he",
    "her",
    "here",
    "hers",
    "herself",
    "him",
    "himself",
    "his",
    "how",
    "i",
    "if",
    "in",
    "into",
    "is",
    "it",
    "its",
    "itself",
    "just",
    "me",
    "more",
    "most",
    "my",
    "myself",
    "new",
    "no",
    "nor",
    "not",
    "now",
    "of",
    "off",
    "on",
    "once",
    "only",
    "or",
    "other",
    "our",
    "ours",
    "ourselves",
    "out",
    "over",
    "own",
    "same",
    "she",
    "should",
    "so",
    "some",
    "such",
    "than",
    "that",
    "the",
    "their",
    "theirs",
    "them",
    "themselves",
    "then",
    "there",
    "these",
    "they",
    "this",
    "those",
    "through",
    "to",
    "too",
    "under",
    "until",
    "up",
    "very",
    "was",
    "we",
    "were",
    "what",
    "when",
    "where",
    "which",
    "while",
    "who",
    "whom",
    "why",
    "will",
    "with",
    "you",
    "your",
    "yours",
    "yourself",
    "yourselves"
  ]);

  const EXPLORATION_STYLES = [
    {
      id: "calmer",
      label: "Calmer",
      buttonLabel: "calmer",
      lensLabel: "CALMER",
      description: "Like this, but calmer",
      suffix: "calm context analysis",
      preferredTerms: ["context", "analysis", "discussion"],
      filterPolicy: "green-only",
      explanation: "Lower-friction framing with the same subject anchor"
    },
    {
      id: "educational",
      label: "Educational",
      buttonLabel: "educational",
      lensLabel: "EDUCATIONAL",
      description: "Like this, but educational",
      suffix: "explained educational analysis",
      preferredTerms: ["explained", "educational", "overview"],
      filterPolicy: "green-or-explanatory-yellow",
      explanation: "Educational framing while preserving topic continuity"
    },
    {
      id: "deeper",
      label: "Deeper dive",
      buttonLabel: "deeper dive",
      lensLabel: "DEEPER DIVE",
      description: "Like this, but deeper",
      suffix: "deep dive background analysis",
      preferredTerms: ["deep dive", "background", "analysis"],
      filterPolicy: "green-or-deep-yellow",
      explanation: "More background and explanatory depth"
    },
    {
      id: "beginner",
      label: "Beginner friendly",
      buttonLabel: "beginner friendly",
      lensLabel: "BEGINNER FRIENDLY",
      description: "Like this, but beginner-friendly",
      suffix: "beginner friendly explained overview",
      preferredTerms: ["beginner", "explained", "overview"],
      filterPolicy: "green-or-simple-yellow",
      explanation: "Beginner-friendly entry point for the same topic"
    },
    {
      id: "longform",
      label: "Longer-form",
      buttonLabel: "longer-form",
      lensLabel: "LONGER-FORM",
      description: "Like this, but longer-form",
      suffix: "long-form discussion analysis",
      preferredTerms: ["long-form", "discussion", "interview"],
      filterPolicy: "green-or-longform-yellow",
      explanation: "Long-form structure with topic continuity preserved"
    },
    {
      id: "demo-neutral-explainer",
      label: "Neutral explainer",
      buttonLabel: "neutral explainer",
      lensLabel: "NEUTRAL EXPLAINER",
      description: "Demo: neutral explainer framing",
      suffix: "explained cybersecurity overview",
      preferredTerms: ["explained", "overview", "educational"],
      filterPolicy: "demo-neutral-explainer",
      explanation: "Demo lens for calm or explanatory title framing"
    },
    {
      id: "demo-urgency-risk",
      label: "Urgency + risk",
      buttonLabel: "urgency + risk",
      lensLabel: "URGENCY + RISK",
      description: "Demo: urgency and risk framing",
      suffix: "warning scam risk watch this",
      preferredTerms: ["warning", "scam", "risk"],
      filterPolicy: "demo-urgency-risk",
      explanation: "Demo lens for urgency, warning, scam, or risk wording"
    },
    {
      id: "demo-conflict-investigation",
      label: "Conflict / investigation",
      buttonLabel: "conflict / investigation",
      lensLabel: "CONFLICT / INVESTIGATION",
      description: "Demo: conflict or investigation framing",
      suffix: "infiltrating exposing caught investigation",
      preferredTerms: ["infiltrating", "exposing", "caught"],
      filterPolicy: "demo-conflict-investigation",
      explanation: "Demo lens for investigation, conflict, exposing, or caught wording"
    },
    {
      id: "demo-curiosity-gap",
      label: "Curiosity gap",
      buttonLabel: "curiosity gap",
      lensLabel: "CURIOSITY GAP",
      description: "Demo: curiosity-gap framing",
      suffix: "hidden secret watch this",
      preferredTerms: ["hidden", "secret", "watch this"],
      filterPolicy: "demo-curiosity-gap",
      explanation: "Demo lens for withheld-information or curiosity-gap wording"
    },
    {
      id: "demo-future-risk",
      label: "Future-risk framing",
      buttonLabel: "future-risk framing",
      lensLabel: "FUTURE-RISK FRAMING",
      description: "Demo: future-risk framing",
      suffix: "AI job apocalypse replace shocking",
      preferredTerms: ["apocalypse", "replace", "shocking"],
      filterPolicy: "demo-future-risk",
      explanation: "Demo lens for future-risk, AI replacement, or high-intensity warning wording"
    }
  ];

  const ENTITY_CONNECTORS = new Set(["of", "the", "and", "for", "in", "on", "to", "vs", "v"]);
  const KNOWN_STANDALONE_ENTITIES = new Set([
    "iran",
    "iraq",
    "israel",
    "gaza",
    "hamas",
    "ukraine",
    "russia",
    "china",
    "taiwan",
    "congress",
    "senate",
    "house",
    "nato",
    "un",
    "eu",
    "fbi",
    "cia",
    "doj",
    "who",
    "cdc"
  ]);

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function normalizeWhitespace(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalizeForSearch(value) {
    return normalizeWhitespace(
      String(value || "")
        .replace(/[|()[\]{}"“”‘’]/g, " ")
        .replace(/[!?*_~`]/g, " ")
        .replace(/\s+[-:;]\s+/g, " ")
    );
  }

  function allStyleTerms() {
    return Object.values(STYLE_TAXONOMY).flat();
  }

  function classifyStyleTerms(text) {
    const normalizedText = String(text || "");
    const matches = [];

    Object.entries(STYLE_TAXONOMY).forEach(([category, terms]) => {
      terms.forEach((term) => {
        const pattern = new RegExp(`(^|[^a-z0-9])(${escapeRegExp(term)})(?=$|[^a-z0-9])`, "gi");
        let match;
        while ((match = pattern.exec(normalizedText)) !== null) {
          matches.push({
            term: match[2],
            normalizedTerm: term,
            category,
            index: match.index + match[1].length
          });
        }
      });
    });

    return matches.sort((a, b) => a.index - b.index);
  }

  function detectTerms(text, terms, category) {
    const normalizedText = String(text || "");
    const matches = [];

    terms.forEach((term) => {
      const pattern = new RegExp(`(^|[^a-z0-9])(${escapeRegExp(term)})(?=$|[^a-z0-9])`, "gi");
      let match;
      while ((match = pattern.exec(normalizedText)) !== null) {
        matches.push({
          term: match[2],
          normalizedTerm: term,
          category,
          index: match.index + match[1].length
        });
      }
    });

    return matches.sort((a, b) => a.index - b.index);
  }

  function detectObservabilitySignals(text) {
    return {
      friction: classifyStyleTerms(text),
      neutralReporting: detectTerms(text, NEUTRAL_REPORTING_TERMS, "neutral-reporting"),
      educational: detectTerms(text, EXPLANATORY_TERMS, "educational"),
      lowFriction: detectTerms(text, CALM_LOW_FRICTION_TERMS, "low-friction"),
      calmPositive: detectTerms(text, CALM_POSITIVE_TERMS, "calm-positive"),
      calmNatureAnimal: detectTerms(text, CALM_NATURE_ANIMAL_SIGNALS, "calm-nature-animal"),
      harmlessEnergetic: detectTerms(text, HARMLESS_ENERGETIC_TERMS, "harmless-energetic"),
      animalDistress: detectTerms(text, ANIMAL_DISTRESS_TERMS, "animal-distress"),
      interviewDiscussion: detectTerms(text, INTERVIEW_DISCUSSION_TERMS, "interview-discussion"),
      lowerFrictionSource: detectTerms(text, LOWER_FRICTION_SOURCE_TERMS, "lower-friction-source"),
      mixedSource: detectTerms(text, MIXED_SOURCE_TERMS, "mixed-source"),
      longForm: detectTerms(text, LONG_FORM_TERMS, "long-form"),
      beginner: detectTerms(text, BEGINNER_TERMS, "beginner-friendly")
    };
  }

  function removeSensationalTerms(text) {
    let cleaned = String(text || "");
    const removed = classifyStyleTerms(cleaned);

    allStyleTerms()
      .sort((a, b) => b.length - a.length)
      .forEach((term) => {
        const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(term)}(?=$|[^a-z0-9])`, "gi");
        cleaned = cleaned.replace(pattern, "$1 ");
      });

    cleaned = normalizeForSearch(cleaned);

    const uniqueRemoved = [];
    const seen = new Set();
    removed.forEach((item) => {
      const key = `${item.category}:${item.normalizedTerm}`;
      if (!seen.has(key)) {
        uniqueRemoved.push(item);
        seen.add(key);
      }
    });

    return {
      cleaned,
      removed: uniqueRemoved
    };
  }

  function tokenize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, " ")
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean);
  }

  function isSubstantiveToken(token) {
    return token.length > 2 && !STOP_WORDS.has(token);
  }

  function unique(values) {
    const seen = new Set();
    const output = [];

    values.forEach((value) => {
      const normalized = String(value || "").toLowerCase();
      if (normalized && !seen.has(normalized)) {
        seen.add(normalized);
        output.push(value);
      }
    });

    return output;
  }

  function isEntityWord(word) {
    const cleaned = String(word || "").replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, "");
    if (!cleaned) {
      return false;
    }

    if (/^[A-Z]{2,}$/.test(cleaned)) {
      return true;
    }

    if (/^[A-Z][a-z0-9]+$/.test(cleaned)) {
      return true;
    }

    if (/^[A-Z][a-z]+-[A-Z][a-z]+$/.test(cleaned)) {
      return true;
    }

    return false;
  }

  function isStyleWord(word) {
    const normalized = String(word || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (!normalized) {
      return false;
    }

    return allStyleTerms().some((term) => term === normalized);
  }

  function extractNamedEntities(text) {
    const words = String(text || "").match(/[A-Za-z0-9][A-Za-z0-9.'-]*/g) || [];
    const entities = [];
    let current = [];

    words.forEach((rawWord) => {
      const word = rawWord.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, "");
      const lower = word.toLowerCase().replace(/\.$/, "");
      const connectorAllowed = current.length > 0 && ENTITY_CONNECTORS.has(lower);

      if (isEntityWord(word) && !isStyleWord(word)) {
        current.push(word);
      } else if (connectorAllowed) {
        current.push(lower);
      } else {
        flushEntity();
      }
    });

    flushEntity();

    return unique(
      entities
        .flatMap(splitOverGroupedEntity)
        .map((entity) => normalizeWhitespace(entity.replace(/\s+(of|the|and|for|in|on|to|vs|v)$/i, "")))
        .filter((entity) => {
          const lowered = entity.toLowerCase();
          if (entity.length < 3) {
            return false;
          }
          if (STOP_WORDS.has(lowered)) {
            return false;
          }
          return !allStyleTerms().includes(lowered);
        })
    ).slice(0, 8);

    function flushEntity() {
      if (current.length > 0) {
        entities.push(current.join(" "));
        current = [];
      }
    }
  }

  function splitOverGroupedEntity(entity) {
    const words = normalizeWhitespace(entity).split(" ");
    if (words.length <= 2) {
      return [entity];
    }

    const last = words[words.length - 1].toLowerCase();
    if (KNOWN_STANDALONE_ENTITIES.has(last)) {
      return [words.slice(0, -1).join(" "), words[words.length - 1]];
    }

    return [entity];
  }

  function titleCaseShortEntity(token) {
    if (/^[a-z]{2,4}$/.test(token) && token !== "iran" && token !== "iraq") {
      return token.toUpperCase();
    }

    return token.charAt(0).toUpperCase() + token.slice(1);
  }

  function extractSubjectAnchor(title) {
    const removal = removeSensationalTerms(title);
    const cleaned = removal.cleaned;
    const namedEntities = extractNamedEntities(cleaned);
    const cleanedTokens = tokenize(cleaned).filter(isSubstantiveToken);
    const entityTokens = tokenize(namedEntities.join(" "));
    const subjectTerms = unique(
      cleanedTokens.filter((token) => !allStyleTerms().includes(token) && !EXPLANATORY_TERMS.includes(token))
    );

    const subjectNouns = unique(
      subjectTerms.filter((token) => {
        if (entityTokens.includes(token)) {
          return true;
        }
        return token.length > 3 || /\d{4}/.test(token);
      })
    ).slice(0, 12);

    const anchorParts = [];
    namedEntities.forEach((entity) => anchorParts.push(entity));
    subjectNouns.forEach((term) => {
      if (!tokenize(anchorParts.join(" ")).includes(term)) {
        anchorParts.push(/\d/.test(term) ? term : term);
      }
    });

    let subjectAnchor = normalizeWhitespace(anchorParts.join(" "));
    if (!subjectAnchor) {
      subjectAnchor = normalizeWhitespace(cleaned || title);
    }

    if (!subjectAnchor) {
      subjectAnchor = "selected YouTube topic";
    }

    return {
      originalTitle: normalizeWhitespace(title),
      cleanedTitle: cleaned,
      subjectAnchor,
      namedEntities,
      subjectNouns,
      keyTerms: unique([...entityTokens, ...subjectNouns, ...subjectTerms]).slice(0, 16),
      removedEscalationTerms: removal.removed
    };
  }

  function analyzeAnchor(title, metadata) {
    const anchor = extractSubjectAnchor(title);
    const styleSignals = classifyStyleTerms(title);
    const categories = unique(styleSignals.map((signal) => signal.category));

    return {
      ...anchor,
      metadata: metadata || {},
      styleSignals,
      detectedFraming: categories,
      sensationalSignalCount: styleSignals.length,
      hasSensationalFraming: styleSignals.length > 0,
      continuityPrinciple: "Original topic, event, people, and organizations are preserved; only exploration style changes."
    };
  }

  function buildSearchQuery(subjectAnchor, suffix) {
    const base = normalizeForSearch(subjectAnchor);
    const suffixTokens = tokenize(suffix);
    const baseTokens = tokenize(base);
    const dedupedSuffix = suffix
      .split(/\s+/)
      .filter((word) => !baseTokens.includes(word.toLowerCase().replace(/[^a-z0-9]+/g, "")))
      .join(" ");

    return normalizeWhitespace(`${base} ${dedupedSuffix || suffixTokens.join(" ")}`);
  }

  function buildExplorationPaths(anchorOrTitle) {
    const anchor =
      typeof anchorOrTitle === "string" ? analyzeAnchor(anchorOrTitle) : { ...anchorOrTitle };
    const subjectAnchor = anchor.subjectAnchor || extractSubjectAnchor(anchor.originalTitle || "").subjectAnchor;

    return EXPLORATION_STYLES.map((style) => {
      const query = buildSearchQuery(subjectAnchor, style.suffix);
      return {
        id: style.id,
        label: style.label,
        buttonLabel: style.buttonLabel,
        lensLabel: style.lensLabel,
        description: style.description,
        query,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
        preferredTerms: style.preferredTerms,
        filterPolicy: style.filterPolicy,
        explanation: style.explanation,
        continuity: {
          subjectAnchor,
          namedEntities: anchor.namedEntities || [],
          preservedTerms: anchor.keyTerms || []
        }
      };
    });
  }

  function countMatches(tokens, wantedTerms) {
    const tokenSet = new Set(tokens);
    return wantedTerms.reduce((count, term) => {
      const termTokens = tokenize(term);
      if (termTokens.length === 0) {
        return count;
      }
      if (termTokens.every((token) => tokenSet.has(token))) {
        return count + 1;
      }
      return count;
    }, 0);
  }

  function capitalizationRatio(text) {
    const letters = String(text || "").replace(/[^A-Za-z]/g, "");
    if (!letters) {
      return 0;
    }

    const capitals = letters.replace(/[^A-Z]/g, "");
    return capitals.length / letters.length;
  }

  function parseDurationSeconds(durationText) {
    const parts = String(durationText || "")
      .trim()
      .split(":")
      .map((part) => Number.parseInt(part, 10))
      .filter((part) => Number.isFinite(part));

    if (parts.length === 0) {
      return 0;
    }

    return parts.reduce((total, part) => total * 60 + part, 0);
  }

  function clampScore(value) {
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  function classifyScoredCandidate(metrics) {
    const contextSoftensFriction =
      (metrics.contextualDownweight >= 1 || metrics.domainSoftening >= 1) &&
      metrics.styleTermCount <= 2 &&
      metrics.animalDistressScore === 0;
    const severeFriction =
      !contextSoftensFriction && (
        metrics.styleTermCount >= 2 ||
        (metrics.styleTermCount >= 1 && metrics.capitalizationRatio > 0.5) ||
        (metrics.styleTermCount >= 1 && metrics.penalty >= 16)
      );
    const hasContinuity = metrics.topicRelevance >= 14 || metrics.continuity >= 4;
    const strongExplanatory = metrics.educationalFraming >= 8;
    const hasFormatTrust = metrics.informationalTone >= 6 || metrics.sourceFormat >= 5;
    const strongCalmPositive = metrics.calmPositive >= 2;
    const clearCalmAnimalSubject = metrics.calmAnimalScore >= 1;
    const noAnimalDistress = metrics.animalDistressScore === 0;
    const noEscalation = metrics.escalationScore === 0 && noAnimalDistress;
    const harmlessEnergyWithoutCompression = metrics.harmlessEnergy >= 1 && noAnimalDistress;
    const lowFriction =
      metrics.calmLanguage >= 16 &&
      metrics.styleTermCount === 0 &&
      metrics.capitalizationRatio <= 0.36;

    if (metrics.animalSubjectScore > 0 && metrics.animalDistressScore > 0 && metrics.petPlayContext > 0) {
      return {
        color: "YELLOW",
        label: "mixed or unclear framing",
        meaning: "Pet/play context includes aggression wording, so the title remains mixed rather than high-intensity.",
        reason: "pet/play context softened aggression wording"
      };
    }

    if (metrics.animalSubjectScore > 0 && metrics.animalDistressScore > 0) {
      return {
        color: "RED",
        label: "intense/attention-grabbing framing",
        meaning: "Animal/pet/nature title with explicit distress or danger wording.",
        reason: "explicit animal distress or danger framing detected"
      };
    }

    if (clearCalmAnimalSubject && harmlessEnergyWithoutCompression) {
      return {
        color: "YELLOW",
        label: "mixed or unclear framing",
        meaning: "Chaotic but non-dangerous animal/pet energy without true distress.",
        reason: "chaotic animal/pet pacing without distress"
      };
    }

    if (clearCalmAnimalSubject && noAnimalDistress && (metrics.styleTermCount > 0 || metrics.cautionaryClaim > 0)) {
      return {
        color: "YELLOW",
        label: "mixed or unclear framing",
        meaning: "Calm subject contains attention-grabbing or cautionary wording.",
        reason: "calm subject with attention-grabbing framing"
      };
    }

    if (clearCalmAnimalSubject && noAnimalDistress) {
      return {
        color: "GREEN",
        label: "calm/straightforward framing",
        meaning: "Calm/pet content detected; no distress or escalation signals found.",
        reason: "Calm/pet content detected; no distress or escalation signals found."
      };
    }

    if (severeFriction || (metrics.styleTermCount >= 1 && metrics.score < 34)) {
      return {
        color: "RED",
        label: "intense/attention-grabbing framing",
        meaning: "Intense or attention-grabbing title wording pattern.",
        reason: "explicit escalation or distress framing detected"
      };
    }

    if (metrics.styleTermCount >= 1 && contextSoftensFriction) {
      return {
        color: "YELLOW",
        label: "mixed or unclear framing",
        meaning: "Escalatory title wording was detected, but contextual framing softened the intensity.",
        reason: "escalation signals detected but softened by context"
      };
    }

    if (metrics.styleTermCount >= 1) {
      return {
        color: "YELLOW",
        label: "mixed or unclear framing",
        meaning: "Escalatory title wording was detected but did not cross the high-intensity threshold.",
        reason: "escalation signals detected; ranked lower"
      };
    }

    if (metrics.cautionaryClaim > 0 || metrics.sensitiveGuidance > 0) {
      return {
        color: "YELLOW",
        label: "mixed or unclear framing",
        meaning: "Cautionary, sensitive, or strong-claim wording needs context beyond the title.",
        reason: "cautionary or sensitive framing needs context"
      };
    }

    if (metrics.score >= 50 && hasContinuity && lowFriction && strongCalmPositive) {
      return {
        color: "GREEN",
        label: "calm/straightforward framing",
        meaning: "Calm, relaxing, or low-friction subject presentation.",
        reason: "strong calm/relaxing positive signals"
      };
    }

    if (metrics.score >= 62 && hasContinuity && lowFriction && (hasFormatTrust || strongExplanatory || metrics.topicRelevance >= 24)) {
      return {
        color: "GREEN",
        label: "calm/straightforward framing",
        meaning: "Calm or explanatory title wording with topic continuity.",
        reason: "low-friction candidate with continuity and trusted explanatory/format signals"
      };
    }

    if (metrics.score >= 56 && hasContinuity && (strongExplanatory || hasFormatTrust) && metrics.styleTermCount === 0) {
      return {
        color: "GREEN",
        label: "calm/straightforward framing",
        meaning: "Relevant explanatory title wording without intense framing.",
        reason: "explanatory or trusted source format with no escalation"
      };
    }

    return {
      color: "YELLOW",
      label: "mixed or unclear framing",
      meaning: "Neutral, mixed, or unclear title wording pattern.",
      reason: "neutral default: no explicit escalation, but not enough GREEN evidence"
    };
  }

  function termsForEvidence(signals, categories) {
    const allowed = new Set(categories || []);
    return (signals || [])
      .filter((signal) => allowed.has(signal.category))
      .map((signal) => signal.normalizedTerm || signal.term)
      .filter(Boolean);
  }

  function evidenceSummaryForCanonical({ titleTokens, anchorTerms, matchedTerms, styleTerms, reasons, classification, metrics }) {
    const positive = (matchedTerms && matchedTerms.positive) || [];
    const friction = (matchedTerms && matchedTerms.friction) || [];
    const hasCompetingSignals = positive.length > 0 && friction.length > 0;
    const softened = (reasons || []).some((reason) => /softened|reduced single-signal intensity/i.test(reason));
    const needsContext = (reasons || []).some((reason) => /needs context/i.test(reason));
    const topicOverlap = titleTokens.filter((token) => (anchorTerms || []).includes(token));
    const amplificationTerms = termsForEvidence(styleTerms, ["clickbait"]);
    const conflictTerms = termsForEvidence(styleTerms, ["domination", "outrage"]);
    const escalationTerms = termsForEvidence(styleTerms, ["escalation"]);
    const intensityLevel = classification.color === "RED" || friction.length >= 2
      ? "high"
      : friction.length === 1
        ? "medium"
        : "low";
    const uncertaintyLevel = classification.color === "YELLOW"
      ? (hasCompetingSignals || softened || needsContext ? "high" : "medium")
      : "low";

    return {
      topicDetection: {
        summary: topicOverlap.length ? "Topic terms were detected from the title text." : "No stable topic terms were inferred beyond the title text.",
        terms: unique(topicOverlap)
      },
      framingDetection: {
        summary: classification.meaning,
        label: classification.color,
        labelMeaning: classification.label
      },
      emotionalIntensity: {
        level: intensityLevel,
        summary: intensityLevel === "low" ? "No strong intense wording pattern was detected." : "Intense wording pattern detected from title terms.",
        terms: unique([...friction, ...escalationTerms])
      },
      amplificationLanguage: {
        detected: amplificationTerms.length > 0,
        summary: amplificationTerms.length ? "Certainty-style or attention-grabbing phrasing detected; this does not assess whether the claim is true." : "No strong amplification wording detected.",
        terms: unique(amplificationTerms)
      },
      conflictLanguage: {
        detected: conflictTerms.length > 0,
        summary: conflictTerms.length ? "Conflict-oriented wording detected." : "No conflict-oriented wording detected.",
        terms: unique(conflictTerms)
      },
      uncertainty: {
        level: uncertaintyLevel,
        summary: uncertaintyLevel === "low"
          ? "Few competing matched wording patterns under this fixed rule set."
          : hasCompetingSignals
            ? "Multiple competing framing signals detected."
            : needsContext
              ? "The title needs context beyond wording alone."
              : "Mixed or unclear framing patterns detected.",
        competingSignals: hasCompetingSignals
      },
      boundedClaim: "This summarizes observable title wording patterns only; it does not assess truth, intent, or content quality."
    };
  }

  function confidenceForScoredCandidate(metrics, classification) {
    const domainConfidence = clampScore(Math.max(
      metrics.topicRelevance * 2.5,
      metrics.continuity * 8,
      metrics.calmAnimalScore > 0 ? 70 + metrics.calmAnimalScore * 10 : 0
    ));
    const frictionConfidence = clampScore(Math.max(
      metrics.styleTermCount * 30 + metrics.penalty * 2,
      metrics.animalDistressScore * 45,
      metrics.harmlessEnergy * 25,
      metrics.capitalizationRatio > 0.5 ? 35 : 0
    ));
    const positiveSignalConfidence = clampScore(Math.max(
      metrics.calmPositive * 25 + metrics.calmAnimalScore * 20,
      metrics.educationalFraming * 4,
      metrics.informationalTone * 7 + metrics.sourceFormat * 7,
      metrics.format * 6,
      Math.max(0, metrics.calmLanguage - 10) * 4
    ));
    const confidence = clampScore(
      classification.color === "RED"
        ? Math.max(frictionConfidence, 45)
        : classification.color === "GREEN"
          ? Math.max(domainConfidence, positiveSignalConfidence)
          : Math.max(45, Math.round((domainConfidence + frictionConfidence + positiveSignalConfidence) / 3))
    );

    return {
      confidence,
      domainConfidence,
      frictionConfidence,
      positiveSignalConfidence,
      finalReason: classification.reason
    };
  }

  function videoIdFromCandidate(candidate) {
    const explicit = candidate && candidate.videoId;
    if (explicit) {
      return explicit;
    }

    try {
      const parsed = new URL((candidate && candidate.url) || "", "https://www.youtube.com");
      const videoId = parsed.searchParams.get("v");
      if (videoId) {
        return videoId;
      }

      const shortsMatch = parsed.pathname.match(/\/shorts\/([^/?#]+)/);
      return shortsMatch ? shortsMatch[1] : "";
    } catch (error) {
      return "";
    }
  }

  function traceIdForCandidate(candidate, scoringPath) {
    const source = [
      videoIdFromCandidate(candidate),
      candidate && candidate.title,
      candidate && candidate.channel,
      scoringPath,
      Date.now(),
      Math.random().toString(36).slice(2, 8)
    ].filter(Boolean).join(":");
    let hash = 0;

    for (let index = 0; index < source.length; index += 1) {
      hash = ((hash << 5) - hash + source.charCodeAt(index)) | 0;
    }

    return `pl-${Math.abs(hash).toString(36)}-${Date.now().toString(36)}`;
  }

  function termsFromSignals(signals) {
    return unique((signals || []).map((signal) => signal && (signal.normalizedTerm || signal.term || signal.category)).filter(Boolean));
  }

  function matchedTermsForCanonical(signals) {
    return {
      positive: unique([
        ...termsFromSignals(signals.educational),
        ...termsFromSignals(signals.lowFriction),
        ...termsFromSignals(signals.calmPositive),
        ...termsFromSignals(signals.calmNatureAnimal),
        ...termsFromSignals(signals.neutralReporting),
        ...termsFromSignals(signals.interviewDiscussion),
        ...termsFromSignals(signals.lowerFrictionSource),
        ...termsFromSignals(signals.longForm),
        ...termsFromSignals(signals.beginner)
      ]),
      friction: unique([
        ...termsFromSignals(signals.friction),
        ...termsFromSignals(signals.harmlessEnergetic),
        ...termsFromSignals(signals.animalDistress),
        ...termsFromSignals(signals.mixedSource)
      ])
    };
  }

  function suppressedTermsForCanonical(anchor) {
    return unique(((anchor && anchor.removedEscalationTerms) || [])
      .map((signal) => signal && (signal.normalizedTerm || signal.term || signal.category))
      .filter(Boolean));
  }

  function domainContextForCanonical(metrics) {
    if (metrics.calmAnimalScore > 0) {
      return {
        domain: "animal-pet-nature",
        boosts: ["calm animal/nature signals"],
        confidenceSource: "calmAnimalScore"
      };
    }

    if (metrics.educationalFraming > 0) {
      return {
        domain: "educational/explanatory",
        boosts: ["educational framing"],
        confidenceSource: "educationalFraming"
      };
    }

    if (metrics.sourceFormat > 0 || metrics.informationalTone > 0) {
      return {
        domain: "low-friction-source",
        boosts: ["source format", "informational tone"].filter((label, index) => index === 0 ? metrics.sourceFormat > 0 : metrics.informationalTone > 0),
        confidenceSource: "sourceFormat"
      };
    }

    return {
      domain: "general",
      boosts: [],
      confidenceSource: "default"
    };
  }

  function downgradeReasonsForCanonical(reasons, classification) {
    return unique([
      ...(reasons || []).filter((reason) => /ranked lower|neutral default|chaotic|friction|escalation|distress|mixed/i.test(reason)),
      classification && /yellow|red|mixed|friction|escalation|distress/i.test(`${classification.color} ${classification.reason}`) ? classification.reason : ""
    ].filter(Boolean));
  }

  function normalizeScoreContentInput(input, anchorOrTitle, explorationPath) {
    if (input && input.candidate) {
      return {
        candidate: input.candidate,
        anchor: input.anchor,
        lens: input.lens || input.explorationPath,
        scoringPath: input.scoringPath || "canonical-semantic",
        expectedLabel: input.expectedLabel || ""
      };
    }

    return {
      candidate: input || {},
      anchor: anchorOrTitle,
      lens: explorationPath,
      scoringPath: "legacy-scoreCandidate",
      expectedLabel: ""
    };
  }

  function resolveLensForReplay(anchor, lensId) {
    const paths = buildExplorationPaths(anchor);
    return paths.find((path) => [path.id, path.label, path.lensLabel].includes(lensId)) || paths[0] || null;
  }

  function detectContradictions(result) {
    const contradictions = [];
    const explanation = `${result.explanation || ""} ${((result.reasoning && result.reasoning.reasons) || []).join(" ")}`.toLowerCase();
    const matchedTerms = [
      ...((result.matchedTerms && result.matchedTerms.positive) || []),
      ...((result.matchedTerms && result.matchedTerms.friction) || [])
    ];

    if (matchedTerms.length === 0 && /(matched terms|title contains|contains .*terms|detected .*terms)/i.test(explanation)) {
      contradictions.push("explanation claims matched terms while matchedTerms is empty");
    }

    if (result.label === "GREEN" && /(marked yellow|marked red|explicit escalation|high-friction|mixed\/context title terms)/i.test(explanation)) {
      contradictions.push("GREEN label conflicts with escalation/yellow/red explanation language");
    }

    if (result.classification && result.classification.color !== result.label) {
      contradictions.push(`canonical label ${result.label} disagrees with classification color ${result.classification.color}`);
    }

    if (result.expectedLabel && result.expectedLabel !== result.label) {
      contradictions.push(`expected label ${result.expectedLabel} disagrees with canonical label ${result.label}`);
    }

    return contradictions;
  }

  function validateConfidenceConsistency(result) {
    const checks = [];
    const failures = [];
    const confidenceFields = [
      ["confidence", result.confidence],
      ["scores.confidence", result.scores && result.scores.confidence],
      ["domainConfidence", result.domainConfidence],
      ["scores.domainConfidence", result.scores && result.scores.domainConfidence],
      ["semanticSignals.confidenceDeltas.domain", result.semanticSignals && result.semanticSignals.confidenceDeltas && result.semanticSignals.confidenceDeltas.domain],
      ["frictionConfidence", result.frictionConfidence],
      ["scores.frictionConfidence", result.scores && result.scores.frictionConfidence],
      ["semanticSignals.confidenceDeltas.friction", result.semanticSignals && result.semanticSignals.confidenceDeltas && result.semanticSignals.confidenceDeltas.friction],
      ["positiveSignalConfidence", result.positiveSignalConfidence],
      ["scores.positiveSignalConfidence", result.scores && result.scores.positiveSignalConfidence],
      ["semanticSignals.confidenceDeltas.positiveSignal", result.semanticSignals && result.semanticSignals.confidenceDeltas && result.semanticSignals.confidenceDeltas.positiveSignal]
    ];

    confidenceFields.forEach(([field, value]) => {
      const valid = Number.isInteger(value) && value >= 0 && value <= 100;
      checks.push({ field, valid, value });
      if (!valid) {
        failures.push(`${field} must be an integer from 0 to 100`);
      }
    });

    [
      ["confidence", result.confidence, result.scores && result.scores.confidence],
      ["domainConfidence", result.domainConfidence, result.scores && result.scores.domainConfidence],
      ["frictionConfidence", result.frictionConfidence, result.scores && result.scores.frictionConfidence],
      ["positiveSignalConfidence", result.positiveSignalConfidence, result.scores && result.scores.positiveSignalConfidence],
      ["domainConfidence delta", result.domainConfidence, result.semanticSignals && result.semanticSignals.confidenceDeltas && result.semanticSignals.confidenceDeltas.domain],
      ["frictionConfidence delta", result.frictionConfidence, result.semanticSignals && result.semanticSignals.confidenceDeltas && result.semanticSignals.confidenceDeltas.friction],
      ["positiveSignalConfidence delta", result.positiveSignalConfidence, result.semanticSignals && result.semanticSignals.confidenceDeltas && result.semanticSignals.confidenceDeltas.positiveSignal]
    ].forEach(([field, left, right]) => {
      const valid = left === right;
      checks.push({ field, valid, value: left, expected: right });
      if (!valid) {
        failures.push(`${field} is inconsistent across canonical confidence fields`);
      }
    });

    return {
      valid: failures.length === 0,
      checks,
      failures
    };
  }

  function semanticTraceEvent(result, order, stage, derivedState) {
    return {
      traceId: result.traceId,
      order,
      stage,
      timestamp: result.timestamp,
      input: {
        title: result.title,
        channel: result.channel,
        videoId: result.videoId,
        duration: result.duration,
        url: result.url,
        lens: result.lens
      },
      derivedState,
      confidence: {
        final: result.confidence,
        domain: result.domainConfidence,
        friction: result.frictionConfidence,
        positiveSignal: result.positiveSignalConfidence
      },
      canonicalLabel: result.label,
      contradictions: result.contradictions,
      metadata: {
        order,
        pipelineVersion: result.pipelineVersion,
        scoringPath: result.scoringPath
      },
      details: derivedState
    };
  }

  function semanticTraceEventsForResult(result) {
    return [
      semanticTraceEvent(result, 1, "metadata normalization", {
        title: result.title,
        channel: result.channel,
        videoId: result.videoId,
        lens: result.lens,
        scoringPath: result.scoringPath
      }),
      semanticTraceEvent(result, 2, "domain detection", {
        domain: result.domain,
        domainContext: result.domainContext
      }),
      semanticTraceEvent(result, 3, "signal matching", {
        matchedTerms: result.matchedTerms,
        observabilitySignals: result.observabilitySignals
      }),
      semanticTraceEvent(result, 4, "semantic scoring", {
        scores: result.scores,
        confidenceDeltas: result.semanticSignals.confidenceDeltas,
        escalationDebug: result.semanticSignals.escalationDebug
      }),
      semanticTraceEvent(result, 5, "confidence consistency validation", {
        confidenceValidation: result.confidenceValidation
      }),
      semanticTraceEvent(result, 6, "suppression/override evaluation", {
        suppressedTerms: result.suppressedTerms,
        overrides: result.semanticSignals.semanticOverrides,
        downgradeReasons: result.reasoning.downgradeReasons
      }),
      semanticTraceEvent(result, 7, "contradiction detection", {
        contradictions: result.contradictions
      }),
      semanticTraceEvent(result, 8, "final label selection", {
        label: result.label,
        confidence: result.confidence,
        explanation: result.explanation,
        finalDecisionSource: result.semanticSignals.finalDecisionSource,
        evidenceSummary: result.evidenceSummary
      })
    ];
  }

  function scoreContent(input, anchorOrTitle, explorationPath) {
    const normalizedInput = normalizeScoreContentInput(input, anchorOrTitle, explorationPath);
    const candidate = normalizedInput.candidate || {};
    const anchorInput = normalizedInput.anchor || candidate.title || "";
    const anchor = typeof anchorInput === "string" ? analyzeAnchor(anchorInput) : anchorInput;
    const activeLens = normalizedInput.lens || null;
    const scoringPath = normalizedInput.scoringPath || "canonical-semantic";
    const title = candidate.title || "";
    const channel = candidate.channel || "";
    const text = normalizeWhitespace(`${title} ${channel}`);
    const sourceText = normalizeWhitespace(channel);
    const tokens = tokenize(text);
    const titleTokens = tokenize(title);
    const anchorTerms = unique(anchor.keyTerms || tokenize(anchor.subjectAnchor || anchor.originalTitle || ""));
    const namedEntityTokens = tokenize((anchor.namedEntities || []).join(" "));
    const signals = detectObservabilitySignals(text);
    const sourceSignals = detectObservabilitySignals(sourceText);
    const styleTerms = signals.friction;
    const educationalMatches = countMatches(tokens, EXPLANATORY_TERMS);
    const lowFrictionMatches = countMatches(tokens, CALM_LOW_FRICTION_TERMS);
    const calmPositiveMatches = countMatches(tokens, CALM_POSITIVE_TERMS);
    const calmNatureAnimalMatches = countMatches(tokens, CALM_NATURE_ANIMAL_SIGNALS);
    const animalSubjectMatches = countMatches(titleTokens, ANIMAL_SUBJECT_TERMS);
    const harmlessEnergeticMatches = countMatches(titleTokens, HARMLESS_ENERGETIC_TERMS);
    const animalDistressMatches = countMatches(titleTokens, ANIMAL_DISTRESS_TERMS);
    const beginnerMatches = countMatches(tokens, BEGINNER_TERMS);
    const neutralReportingMatches = countMatches(tokens, NEUTRAL_REPORTING_TERMS);
    const domainSofteningMatches = countMatches(tokens, DOMAIN_SOFTENING_TERMS);
    const petPlayContextMatches = countMatches(tokens, PET_PLAY_CONTEXT_TERMS);
    const cautionaryClaimMatches = countMatches(tokens, CAUTIONARY_CLAIM_TERMS);
    const sensitiveGuidanceMatches = countMatches(tokens, SENSITIVE_GUIDANCE_TERMS);
    const contextualDownweightMatches =
      countMatches(tokens, CONTEXTUAL_DOWNWEIGHT_TERMS) +
      (titleTokens.includes("how") && titleTokens.includes("works") ? 2 : 0);
    const interviewDiscussionMatches = countMatches(tokens, INTERVIEW_DISCUSSION_TERMS);
    const lowerFrictionSourceMatches = countMatches(tokens, LOWER_FRICTION_SOURCE_TERMS);
    const mixedSourceMatches = countMatches(tokens, MIXED_SOURCE_TERMS);
    const preferredMatches = countMatches(tokens, (activeLens && activeLens.preferredTerms) || []);
    const continuityMatches = countMatches(titleTokens, namedEntityTokens);
    const topicMatches = countMatches(titleTokens, anchorTerms);
    const durationSeconds = parseDurationSeconds(candidate.duration);
    const capRatio = capitalizationRatio(title);

    const topicRelevance = Math.min(40, topicMatches * 7 + continuityMatches * 4);
    const educationalFraming = Math.min(20, educationalMatches * 4 + preferredMatches * 4);
    const informationalTone = Math.min(12, neutralReportingMatches * 3 + interviewDiscussionMatches * 3 + calmPositiveMatches * 2);
    const sourceFormat = Math.max(
      0,
      Math.min(10, lowerFrictionSourceMatches * 4 + sourceSignals.lowerFrictionSource.length * 2 + interviewDiscussionMatches * 2 - mixedSourceMatches * 2)
    );
    const calmLanguage = Math.max(
      0,
      20 +
        Math.min(8, lowFrictionMatches * 2 + neutralReportingMatches * 2 + interviewDiscussionMatches * 2 + lowerFrictionSourceMatches * 2) -
        styleTerms.length * 5 +
        Math.min(8, calmPositiveMatches * 2) -
        (capRatio > 0.36 ? 6 : 0)
    );
    const continuity = Math.min(12, continuityMatches * 4 + (topicMatches >= 2 ? 4 : 0));
    const format =
      Math.min(10, countMatches(tokens, LONG_FORM_TERMS) * 3 + interviewDiscussionMatches * 2 + (durationSeconds >= 20 * 60 ? 5 : durationSeconds >= 8 * 60 ? 2 : 0));
    const neutralOffset = styleTerms.length > 0 ? 0 : Math.min(8, neutralReportingMatches * 2 + interviewDiscussionMatches * 2 + lowerFrictionSourceMatches * 2);
    const styleTermPenalty = styleTerms.length * 6;
    const mixedSourcePenalty = mixedSourceMatches * 2;
    const capitalizationPenalty = capRatio > 0.5 ? 8 : 0;
    const rawEscalationPenalty = styleTermPenalty + mixedSourcePenalty + capitalizationPenalty;
    const penalty = Math.max(0, Math.min(28, rawEscalationPenalty - neutralOffset));
    const score = clampScore(topicRelevance + educationalFraming + calmLanguage + continuity + format + informationalTone + sourceFormat - penalty);
    const matchedEscalationKeywords = termsFromSignals(styleTerms);
    const contextSoftensFriction =
      (contextualDownweightMatches >= 1 || domainSofteningMatches >= 1) &&
      styleTerms.length <= 2 &&
      animalDistressMatches === 0;
    const escalationDebug = {
      matchedEscalationKeywords,
      escalationScoreContribution: {
        styleTermCount: styleTerms.length,
        styleTermPenalty,
        mixedSourcePenalty,
        capitalizationPenalty,
        rawPenalty: rawEscalationPenalty,
        appliedPenalty: penalty
      },
      softeningDeductions: {
        neutralOffset,
        contextualDownweightMatches,
        domainSofteningMatches,
        classificationSoftened: contextSoftensFriction
      },
      finalScoreBeforeLabelMapping: score
    };
    const classificationMetrics = {
      score,
      topicRelevance,
      educationalFraming,
      calmLanguage,
      continuity,
      format,
      informationalTone,
      sourceFormat,
      calmPositive: calmPositiveMatches,
      calmAnimalScore: calmNatureAnimalMatches,
      animalSubjectScore: animalSubjectMatches,
      escalationScore: styleTerms.length,
      harmlessEnergy: harmlessEnergeticMatches,
      animalDistressScore: animalDistressMatches,
      penalty,
      styleTermCount: styleTerms.length,
      contextualDownweight: contextualDownweightMatches,
      domainSoftening: domainSofteningMatches,
      petPlayContext: petPlayContextMatches,
      cautionaryClaim: cautionaryClaimMatches,
      sensitiveGuidance: sensitiveGuidanceMatches,
      capitalizationRatio: capRatio
    };
    const classification = classifyScoredCandidate(classificationMetrics);
    const confidence = confidenceForScoredCandidate(classificationMetrics, classification);
    const domainContext = domainContextForCanonical(classificationMetrics);
    const matchedTerms = matchedTermsForCanonical(signals);
    const suppressedTerms = suppressedTermsForCanonical(anchor);

    const reasons = [];
    if (topicMatches > 0 || continuityMatches > 0) {
      reasons.push("topic continuity preserved");
    }
    if (educationalMatches > 0 || preferredMatches > 0) {
      reasons.push("explanatory framing");
    }
    if (format > 3) {
      reasons.push("long-form discussion");
    }
    if (informationalTone > 0) {
      reasons.push("neutral reporting language");
    }
    if (calmPositiveMatches > 0) {
      reasons.push("calm/relaxing positive signals");
    }
    if (calmNatureAnimalMatches > 0) {
      reasons.push("calm animal/nature signals");
    }
    if (classification.reason === "Calm/pet content detected; no distress or escalation signals found.") {
      reasons.push("Calm/pet content detected; no distress or escalation signals found.");
    }
    if (harmlessEnergeticMatches > 0) {
      reasons.push("chaotic but non-dangerous animal/pet energy");
    }
    if (sourceFormat > 0) {
      reasons.push("lower-friction source format");
    }
    if (styleTerms.length === 0 && capRatio <= 0.36) {
      reasons.push("lower-friction language");
    }
    if (educationalMatches > 0) {
      reasons.push("educational terminology detected");
    }
    if (beginnerMatches > 0) {
      reasons.push("beginner-friendly terminology detected");
    }
    if (styleTerms.length > 0) {
      reasons.push("escalation signals detected; ranked lower");
    }
    if (styleTerms.length > 0 && contextualDownweightMatches >= 1) {
      reasons.push("educational or guidance framing reduced single-signal intensity");
    }
    if (styleTerms.length > 0 && domainSofteningMatches > 0) {
      reasons.push("domain context softened creator-style intense wording");
    }
    if (petPlayContextMatches > 0 && animalDistressMatches > 0) {
      reasons.push("pet/play context softened aggression wording");
    }
    if (cautionaryClaimMatches > 0) {
      reasons.push("cautionary claim wording needs context");
    }
    if (sensitiveGuidanceMatches > 0) {
      reasons.push("sensitive guidance topic needs context");
    }
    if (reasons.length === 0) {
      reasons.push("visible result with partial subject overlap");
    }
    const evidenceSummary = evidenceSummaryForCanonical({
      titleTokens,
      anchorTerms,
      matchedTerms,
      styleTerms,
      reasons,
      classification,
      metrics: classificationMetrics
    });

    const result = {
      traceId: traceIdForCandidate(candidate, scoringPath),
      pipelineVersion: PIPELINE_VERSION,
      scoringPath,
      videoId: videoIdFromCandidate(candidate),
      title,
      channel,
      duration: candidate.duration || "",
      url: candidate.url || "",
      lens: activeLens && (activeLens.id || activeLens.lensLabel || activeLens.label) || "none",
      domain: domainContext.domain,
      label: classification.color,
      score,
      scores: {
        final: score,
        breakdown: {
          topicRelevance,
          educationalFraming,
          calmLanguage,
          continuity,
          format,
          informationalTone,
          sourceFormat,
          calmAnimalScore: calmNatureAnimalMatches,
          harmlessEnergy: harmlessEnergeticMatches,
          animalDistressScore: animalDistressMatches,
          penalty
        },
        confidence: confidence.confidence,
        domainConfidence: confidence.domainConfidence,
        frictionConfidence: confidence.frictionConfidence,
        positiveSignalConfidence: confidence.positiveSignalConfidence
      },
      matchedTerms,
      suppressedTerms,
      semanticSignals: {
        domainBoosts: domainContext.boosts,
        confidenceDeltas: {
          domain: confidence.domainConfidence,
          friction: confidence.frictionConfidence,
          positiveSignal: confidence.positiveSignalConfidence
        },
        escalationDebug,
        semanticOverrides: classification.reason,
        finalDecisionSource: "canonical.semantic.classifyScoredCandidate"
      },
      evidenceSummary,
      reasoning: {
        reasons,
        finalReason: confidence.finalReason,
        downgradeReasons: downgradeReasonsForCanonical(reasons, classification)
      },
      domainContext,
      contradictions: [],
      expectedLabel: normalizedInput.expectedLabel || "",
      confidenceValidation: null,
      traceEvents: [],
      pipelineStages: [
        "metadata normalization",
        "domain detection",
        "signal matching",
        "semantic scoring",
        "confidence consistency validation",
        "suppression/override evaluation",
        "final label selection"
      ],
      classification,
      confidence: confidence.confidence,
      domainConfidence: confidence.domainConfidence,
      frictionConfidence: confidence.frictionConfidence,
      positiveSignalConfidence: confidence.positiveSignalConfidence,
      finalReason: confidence.finalReason,
      debug: {
        calm_animal_score: calmNatureAnimalMatches,
        escalation_score: animalDistressMatches || styleTerms.length,
        matched_escalation_keywords: matchedEscalationKeywords,
        escalation_score_contribution: escalationDebug.escalationScoreContribution,
        softening_deductions: escalationDebug.softeningDeductions,
        final_score_before_label_mapping: score,
        final_classification_reason: classification.reason,
        evidence_summary: evidenceSummary,
        confidence: confidence.confidence,
        domain_confidence: confidence.domainConfidence,
        friction_confidence: confidence.frictionConfidence,
        positive_signal_confidence: confidence.positiveSignalConfidence
      },
      breakdown: {
        topicRelevance,
        educationalFraming,
        calmLanguage,
        continuity,
        format,
        informationalTone,
        sourceFormat,
        calmAnimalScore: calmNatureAnimalMatches,
        harmlessEnergy: harmlessEnergeticMatches,
        animalDistressScore: animalDistressMatches,
        penalty
      },
      reasons,
      observabilitySignals: {
        ...signals,
        source: sourceSignals
      },
      detectedStyleTerms: styleTerms,
      capitalizationRatio: capRatio,
      explanation: confidence.finalReason,
      timestamp: new Date().toISOString()
    };

    result.confidenceValidation = validateConfidenceConsistency(result);
    result.contradictions = [
      ...detectContradictions(result),
      ...result.confidenceValidation.failures.map((failure) => `confidence inconsistency: ${failure}`)
    ];
    result.traceEvents = semanticTraceEventsForResult(result);
    return result;
  }

  function changedList(left, right) {
    const leftValues = unique(left || []);
    const rightValues = unique(right || []);
    return [
      ...leftValues.filter((value) => !rightValues.includes(value)).map((value) => `removed: ${value}`),
      ...rightValues.filter((value) => !leftValues.includes(value)).map((value) => `added: ${value}`)
    ];
  }

  function driftClassificationForReplay({ labelDrift, confidenceDelta, contradictionDrift, governanceDecisionChanges }) {
    if (labelDrift) {
      return "high";
    }
    if (contradictionDrift || governanceDecisionChanges.length > 0 || Math.abs(confidenceDelta) >= 10) {
      return "medium";
    }
    if (confidenceDelta !== 0) {
      return "low";
    }
    return "none";
  }

  function replayTrace(trace) {
    const source = trace || {};
    const candidate = {
      videoId: source.videoId || (source.input && source.input.videoId) || "",
      title: source.title || (source.input && source.input.title) || "",
      channel: source.channel || (source.input && source.input.channel) || "",
      duration: source.duration || (source.input && source.input.duration) || "",
      url: source.url || (source.input && source.input.url) || ""
    };
    const anchor = analyzeAnchor(candidate.title);
    const lens = resolveLensForReplay(anchor, source.lens || (source.input && source.input.lens));
    const current = scoreContent({
      candidate,
      anchor,
      lens,
      scoringPath: "replay",
      expectedLabel: source.label || source.canonicalLabel || ""
    });
    const originalLabel = source.label || source.canonicalLabel || "";
    const originalConfidence = Number.isFinite(Number(source.confidence))
      ? Number(source.confidence)
      : Number(source.confidence && source.confidence.final) || 0;
    const confidenceDelta = current.confidence - originalConfidence;
    const originalContradictions = source.contradictions || [];
    const contradictionDrift = JSON.stringify(originalContradictions) !== JSON.stringify(current.contradictions);
    const originalGovernance = (source.reasoning && source.reasoning.downgradeReasons) || source.downgradeReasons || [];
    const currentGovernance = (current.reasoning && current.reasoning.downgradeReasons) || [];
    const governanceDecisionChanges = changedList(originalGovernance, currentGovernance);
    const labelDrift = Boolean(originalLabel && originalLabel !== current.label);
    const driftClassification = driftClassificationForReplay({
      labelDrift,
      confidenceDelta,
      contradictionDrift,
      governanceDecisionChanges
    });

    return {
      replayId: traceIdForCandidate(candidate, "replay-analysis"),
      sourceTraceId: source.traceId || "",
      replayPipelineVersion: PIPELINE_VERSION,
      driftClassification,
      replayAgreementState: driftClassification === "none" ? "agreement" : "drift",
      replayTimestamp: new Date().toISOString(),
      originalLabel,
      currentLabel: current.label,
      confidenceDelta,
      labelDrift,
      confidenceDrift: confidenceDelta !== 0,
      contradictionDrift,
      retrievalAgreementChanged: /^retrieval/.test(source.scoringPath || "") && labelDrift,
      governanceDecisionChanges,
      pipelineVersionComparison: {
        original: source.pipelineVersion || "unknown",
        current: PIPELINE_VERSION,
        changed: Boolean(source.pipelineVersion && source.pipelineVersion !== PIPELINE_VERSION)
      },
      current,
      sourceTrace: source
    };
  }

  function replayTraces(traces) {
    const items = Array.isArray(traces) ? traces : [traces];
    return items.filter(Boolean).map(replayTrace);
  }

  function defaultScenarioPack() {
    return {
      name: "PersonaLabs canonical smoke scenarios",
      scenarios: [
        {
          id: "benign-calm-bunny",
          name: "Calm bunny content",
          category: "benign",
          description: "Calm animal content should remain GREEN.",
          expectedLabel: "GREEN",
          expectedConfidenceRange: [70, 100],
          expectedGovernanceOutcomes: ["Calm/pet content detected"],
          expectedContradictionState: false,
          input: {
            title: "Cute Baby Bunny Compilation",
            channel: "Wholesome Pets",
            duration: "12:00"
          }
        },
        {
          id: "educational-public-radio",
          name: "Public radio context",
          category: "educational",
          description: "Lower-friction public radio interview should not be RED.",
          expectedLabel: ["GREEN", "YELLOW"],
          expectedConfidenceRange: [40, 100],
          expectedGovernanceOutcomes: ["lower-friction source format"],
          expectedContradictionState: false,
          input: {
            title: "Thomas Massie discusses Iran vote on public radio",
            channel: "Public Radio Forum",
            duration: "24:00"
          }
        },
        {
          id: "adversarial-outrage",
          name: "Political outrage title",
          category: "adversarial-title",
          description: "Overt outrage framing should be RED.",
          expectedLabel: "RED",
          expectedConfidenceRange: [45, 100],
          expectedGovernanceOutcomes: ["explicit escalation or distress framing detected"],
          expectedContradictionState: false,
          input: {
            title: "OUTRAGE: Thomas Massie meltdown after Iran vote",
            channel: "Outrage Daily",
            duration: "4:10"
          }
        }
      ]
    };
  }

  function goldenScenario(scenario) {
    return {
      pipelineVersion: PIPELINE_VERSION,
      expectedMatchedSignalCategories: { positive: [], friction: [] },
      expectedSuppressedSignalCategories: [],
      ...scenario
    };
  }

  function defaultGoldenRegressionPack() {
    return {
      name: "PersonaLabs Golden Regression Pack",
      category: "golden-regression",
      description: "Frozen deterministic semantic governance scenarios.",
      pipelineVersion: PIPELINE_VERSION,
      scenarios: [
        goldenScenario({
          id: "golden-calm-animal",
          scenarioId: "golden-calm-animal",
          name: "Calm animal content",
          category: "benign",
          description: "Calm bunny content remains GREEN.",
          expectedLabel: "GREEN",
          expectedConfidenceRange: [70, 100],
          expectedGovernanceOutcomes: ["Calm/pet content detected"],
          expectedContradictionState: false,
          expectedMatchedSignalCategories: { positive: ["cute", "bunny"], friction: [] },
          input: { title: "Cute Baby Bunny Compilation", channel: "Wholesome Pets", duration: "12:00" }
        }),
        goldenScenario({
          id: "golden-harmless-pet-friction",
          scenarioId: "golden-harmless-pet-friction",
          name: "Harmless pet friction",
          category: "benign",
          description: "Harmless pet wording does not become YELLOW.",
          expectedLabel: "GREEN",
          expectedConfidenceRange: [70, 100],
          expectedGovernanceOutcomes: ["Calm/pet content detected"],
          expectedContradictionState: false,
          expectedMatchedSignalCategories: { positive: ["bunny"], friction: [] },
          input: { title: "Funny Baby Bunny Compilation", channel: "Pet Videos", duration: "0:45" }
        }),
        goldenScenario({
          id: "golden-animal-distress",
          scenarioId: "golden-animal-distress",
          name: "Animal distress",
          category: "inflammatory",
          description: "Explicit animal distress remains RED.",
          expectedLabel: "RED",
          expectedConfidenceRange: [70, 100],
          expectedGovernanceOutcomes: ["explicit animal distress or danger framing detected"],
          expectedContradictionState: false,
          expectedMatchedSignalCategories: { positive: ["pet"], friction: ["terrifying", "emergency"] },
          expectedSuppressedSignalCategories: ["terrifying", "emergency"],
          input: { title: "Terrifying Pet Emergency Breakdown", channel: "Breaking Clips", duration: "8:00" }
        }),
        goldenScenario({
          id: "golden-educational-tutorial",
          scenarioId: "golden-educational-tutorial",
          name: "Educational tutorial",
          category: "educational",
          description: "Explanatory tutorial remains GREEN.",
          expectedLabel: "GREEN",
          expectedConfidenceRange: [70, 100],
          expectedGovernanceOutcomes: ["low-friction candidate"],
          expectedContradictionState: false,
          expectedMatchedSignalCategories: { positive: ["explained"], friction: [] },
          input: { title: "Kubernetes YAML tutorial explained", channel: "Cloud Academy", duration: "18:24" }
        }),
        goldenScenario({
          id: "golden-documentary",
          scenarioId: "golden-documentary",
          name: "Documentary",
          category: "educational",
          description: "Documentary/source-format signals remain GREEN.",
          expectedLabel: "GREEN",
          expectedConfidenceRange: [70, 100],
          expectedGovernanceOutcomes: ["lower-friction source format"],
          expectedContradictionState: false,
          expectedMatchedSignalCategories: { positive: ["documentary", "pbs"], friction: [] },
          input: { title: "Long-form wildlife documentary", channel: "PBS Documentary", duration: "42:00" }
        }),
        goldenScenario({
          id: "golden-public-radio-interview",
          scenarioId: "golden-public-radio-interview",
          name: "Public radio interview",
          category: "political",
          description: "Public radio interview stays low-friction.",
          expectedLabel: "GREEN",
          expectedConfidenceRange: [70, 100],
          expectedGovernanceOutcomes: ["lower-friction source format"],
          expectedContradictionState: false,
          expectedMatchedSignalCategories: { positive: ["public radio"], friction: [] },
          input: { title: "Thomas Massie discusses Iran vote on public radio", channel: "Public Radio Forum", duration: "24:00" }
        }),
        goldenScenario({
          id: "golden-political-outrage",
          scenarioId: "golden-political-outrage",
          name: "Political outrage",
          category: "political",
          description: "Outrage framing remains RED.",
          expectedLabel: "RED",
          expectedConfidenceRange: [70, 100],
          expectedGovernanceOutcomes: ["explicit escalation or distress framing detected"],
          expectedContradictionState: false,
          expectedMatchedSignalCategories: { positive: [], friction: ["outrage", "meltdown"] },
          expectedSuppressedSignalCategories: ["outrage", "meltdown"],
          input: { title: "OUTRAGE: Thomas Massie meltdown after Iran vote", channel: "Outrage Daily", duration: "4:10" }
        }),
        goldenScenario({
          id: "golden-clickbait-manipulation",
          scenarioId: "golden-clickbait-manipulation",
          name: "Clickbait manipulation",
          category: "manipulation",
          description: "Clickbait manipulation terms remain RED.",
          expectedLabel: "RED",
          expectedConfidenceRange: [70, 100],
          expectedGovernanceOutcomes: ["explicit escalation or distress framing detected"],
          expectedContradictionState: false,
          expectedMatchedSignalCategories: { positive: [], friction: ["you won't believe", "secret"] },
          expectedSuppressedSignalCategories: ["you won't believe", "secret"],
          input: { title: "You won't believe this secret trick", channel: "Viral Clips", duration: "4:00" }
        }),
        goldenScenario({
          id: "golden-ambiguous-low-context",
          scenarioId: "golden-ambiguous-low-context",
          name: "Ambiguous low-context title",
          category: "low-context",
          description: "Low-context title stays deterministic YELLOW.",
          expectedLabel: "YELLOW",
          expectedConfidenceRange: [40, 60],
          expectedGovernanceOutcomes: ["neutral default"],
          expectedContradictionState: false,
          expectedMatchedSignalCategories: { positive: [], friction: [] },
          input: { title: "Obscure Segment 17", channel: "Channel 42", duration: "9:00" }
        }),
        goldenScenario({
          id: "golden-adversarial-title",
          scenarioId: "golden-adversarial-title",
          name: "Adversarial title",
          category: "adversarial-title",
          description: "Adversarial domination framing remains RED.",
          expectedLabel: "RED",
          expectedConfidenceRange: [70, 100],
          expectedGovernanceOutcomes: ["explicit escalation or distress framing detected"],
          expectedContradictionState: false,
          expectedMatchedSignalCategories: { positive: [], friction: ["obliterates", "insane", "meltdown"] },
          expectedSuppressedSignalCategories: ["obliterates", "insane", "meltdown"],
          input: { title: "MASSIE OBLITERATES opponents in insane Iran vote meltdown", channel: "Outrage Daily", duration: "4:10" }
        }),
        goldenScenario({
          id: "golden-contradictory-explanation",
          scenarioId: "golden-contradictory-explanation",
          name: "Contradictory explanation guard",
          category: "contradictory",
          description: "Empty matched-term case must not claim matched terms.",
          expectedLabel: "YELLOW",
          expectedConfidenceRange: [40, 60],
          expectedGovernanceOutcomes: ["neutral default"],
          expectedContradictionState: false,
          expectedMatchedSignalCategories: { positive: [], friction: [] },
          input: { title: "Obscure Segment 17", channel: "Channel 42", duration: "9:00" }
        }),
        goldenScenario({
          id: "golden-semantic-drift",
          scenarioId: "golden-semantic-drift",
          name: "Semantic drift sentinel",
          category: "semantic-drift",
          description: "Stable calm animal sentinel for drift detection.",
          expectedLabel: "GREEN",
          expectedConfidenceRange: [70, 100],
          expectedGovernanceOutcomes: ["Calm/pet content detected"],
          expectedContradictionState: false,
          expectedMatchedSignalCategories: { positive: ["cute", "bunny"], friction: [] },
          input: { title: "Cute Baby Bunny Compilation", channel: "Wholesome Pets", duration: "12:00" }
        })
      ]
    };
  }

  function scenarioExpectedLabels(expectedLabel) {
    return Array.isArray(expectedLabel) ? expectedLabel : [expectedLabel];
  }

  function scenarioSeverity({ labelAgreement, confidenceAgreement, governanceAgreement, contradictionAgreement }) {
    if (!labelAgreement) {
      return "high";
    }
    if (!governanceAgreement || !contradictionAgreement) {
      return "medium";
    }
    if (!confidenceAgreement) {
      return "low";
    }
    return "none";
  }

  function scenarioSignalAgreement(expected, actual) {
    const expectedValues = expected || [];
    const actualValues = actual || [];
    return expectedValues.every((value) => actualValues.includes(value));
  }

  function runScenario(scenario) {
    const item = scenario || {};
    const input = item.input || item.inputMetadata || {};
    const anchor = analyzeAnchor(input.title || "");
    const lens = resolveLensForReplay(anchor, item.lens || item.selectedLens);
    const score = scoreContent({
      candidate: input,
      anchor,
      lens,
      scoringPath: `scenario:${item.id || item.name || "unnamed"}`,
      expectedLabel: scenarioExpectedLabels(item.expectedLabel)[0] || ""
    });
    const labels = scenarioExpectedLabels(item.expectedLabel);
    const labelAgreement = labels.includes(score.label);
    const range = item.expectedConfidenceRange || [0, 100];
    const confidenceAgreement = score.confidence >= range[0] && score.confidence <= range[1];
    const midpoint = Math.round((range[0] + range[1]) / 2);
    const confidenceDelta = score.confidence - midpoint;
    const expectedGovernance = item.expectedGovernanceOutcomes || [];
    const governanceText = [
      ...((score.reasoning && score.reasoning.reasons) || []),
      ...((score.reasoning && score.reasoning.downgradeReasons) || []),
      score.explanation || ""
    ].join(" | ");
    const governanceAgreement = expectedGovernance.every((expected) => governanceText.includes(expected));
    const expectedContradiction = Boolean(item.expectedContradictionState);
    const contradictionAgreement = expectedContradiction === (score.contradictions.length > 0);
    const expectedMatched = item.expectedMatchedSignalCategories || {};
    const matchedSignalAgreement =
      scenarioSignalAgreement(expectedMatched.positive, score.matchedTerms && score.matchedTerms.positive) &&
      scenarioSignalAgreement(expectedMatched.friction, score.matchedTerms && score.matchedTerms.friction);
    const expectedSuppressed = item.expectedSuppressedSignalCategories || [];
    const suppressedSignalAgreement = scenarioSignalAgreement(expectedSuppressed, score.suppressedTerms);
    const replayResults = item.replayTraces ? replayTraces(item.replayTraces) : [];
    const driftDetected = !labelAgreement || !confidenceAgreement || !governanceAgreement || !contradictionAgreement || !matchedSignalAgreement || !suppressedSignalAgreement || replayResults.some((replay) => replay.replayAgreementState === "drift");
    const severity = scenarioSeverity({ labelAgreement, confidenceAgreement, governanceAgreement, contradictionAgreement });

    return {
      scenarioId: item.scenarioId || item.id || item.name || "unnamed-scenario",
      name: item.name || item.id || "Unnamed scenario",
      category: SCENARIO_CATEGORIES.includes(item.category) ? item.category : "edge-case",
      description: item.description || "",
      expectedLabel: item.expectedLabel,
      actualLabel: score.label,
      confidenceDelta,
      governanceAgreement,
      contradictionAgreement,
      matchedSignalAgreement,
      suppressedSignalAgreement,
      driftDetected,
      severity,
      pipelineVersion: PIPELINE_VERSION,
      pass: !driftDetected,
      labelAgreement,
      confidenceAgreement,
      replayResults,
      score
    };
  }

  function runScenarioPack(pack) {
    const scenarioPack = pack || defaultScenarioPack();
    const scenarios = scenarioPack.scenarios || [];
    const results = scenarios.map(runScenario);
    const failed = results.filter((result) => !result.pass);

    return {
      name: scenarioPack.name || "Unnamed scenario pack",
      category: scenarioPack.category || "mixed",
      description: scenarioPack.description || "",
      pipelineVersion: PIPELINE_VERSION,
      generatedAt: new Date().toISOString(),
      total: results.length,
      passed: results.length - failed.length,
      failed: failed.length,
      driftDetected: failed.length > 0,
      severity: failed.some((result) => result.severity === "high")
        ? "high"
        : failed.some((result) => result.severity === "medium")
          ? "medium"
          : failed.some((result) => result.severity === "low")
            ? "low"
            : "none",
      results
    };
  }

  function getPipelineHealth() {
    return {
      pipelineVersion: PIPELINE_VERSION,
      canonicalScoringFunction: "scoreContent",
      canonicalScenarioRunner: "runScenario",
      canonicalScenarioPackRunner: "runScenarioPack",
      activeScoringEntrypoints: ["scoreContent"],
      governanceBypassAllowed: false,
      scoringRuleMutationAllowed: false,
      dictionaryMutationAllowed: false,
      directLabelMutationAllowed: false,
      runtimeStateMutationAllowed: ["test results", "test traces"],
      evidenceExportsIncludeDomDump: false,
      evidenceExportsIncludeCookiesTokensOrAccountData: false
    };
  }

  function runGoldenRegressionPack(pack) {
    const report = runScenarioPack(pack || defaultGoldenRegressionPack());
    const failedResults = report.results.filter((result) => !result.pass);
    return {
      ...report,
      golden: true,
      driftCount: failedResults.length,
      failedScenarioIds: failedResults.map((result) => result.scenarioId),
      confidenceDeltas: report.results.map((result) => ({
        scenarioId: result.scenarioId,
        confidenceDelta: result.confidenceDelta
      })),
      governanceMismatches: report.results
        .filter((result) => !result.governanceAgreement)
        .map((result) => result.scenarioId),
      contradictionMismatches: report.results
        .filter((result) => !result.contradictionAgreement)
        .map((result) => result.scenarioId),
      matchedSignalMismatches: report.results
        .filter((result) => !result.matchedSignalAgreement || !result.suppressedSignalAgreement)
        .map((result) => result.scenarioId)
    };
  }

  function scoreCandidate(candidate, anchorOrTitle, explorationPath) {
    return scoreContent(candidate, anchorOrTitle, explorationPath);
  }

  function hasStrongExplanatoryValue(scoring) {
    return scoring.breakdown.educationalFraming >= 8 && scoring.breakdown.topicRelevance >= 14;
  }

  function hasHighQualityRelevantValue(scoring) {
    return scoring.breakdown.topicRelevance >= 18 && (scoring.breakdown.format >= 3 || scoring.breakdown.educationalFraming >= 8);
  }

  function hasSimpleExplanatoryValue(scoring) {
    return scoring.breakdown.topicRelevance >= 14 && scoring.observabilitySignals.beginner.length > 0;
  }

  function hasLongFormValue(scoring) {
    return scoring.breakdown.topicRelevance >= 14 && scoring.breakdown.format >= 3;
  }

  function scoringText(scoring) {
    return [
      scoring && scoring.title,
      scoring && scoring.channel,
      scoring && scoring.finalReason,
      scoring && scoring.explanation,
      ...(((scoring && scoring.matchedTerms && scoring.matchedTerms.friction) || [])),
      ...(((scoring && scoring.matchedTerms && scoring.matchedTerms.positive) || [])),
      ...(((scoring && scoring.detectedStyleTerms) || []).map((item) => `${item.category} ${item.normalizedTerm || item.term}`))
    ].filter(Boolean).join(" ").toLowerCase();
  }

  function hasAnyCue(scoring, cues) {
    const text = scoringText(scoring);
    return cues.some((cue) => cue.test(text));
  }

  function isAllowedByDemoStyle(scoring, policy, color) {
    if (policy === "demo-neutral-explainer") {
      return color === "GREEN" || (color === "YELLOW" && hasStrongExplanatoryValue(scoring));
    }

    if (policy === "demo-urgency-risk") {
      return (color === "YELLOW" || color === "RED") && hasAnyCue(scoring, [
        /urgent|urgency|warning|warn|alert|before|risk|danger|scam|scammer|phishing|hack|hacked|threat/
      ]);
    }

    if (policy === "demo-conflict-investigation") {
      return (color === "YELLOW" || color === "RED") && hasAnyCue(scoring, [
        /infiltrat|expos|caught|investigat|disrupt|confront|scammer|scammers|bank scammers|domination|outrage|takes down|shuts down/
      ]);
    }

    if (policy === "demo-curiosity-gap") {
      return (color === "YELLOW" || color === "RED") && hasAnyCue(scoring, [
        /hidden|secret|watch this|you won't believe|what happens next|truth about|don't want you to know|nobody tells|clickbait|this changes everything/
      ]);
    }

    if (policy === "demo-future-risk") {
      return (color === "YELLOW" || color === "RED") && hasAnyCue(scoring, [
        /ai|artificial intelligence|future|job|jobs|replace|replacement|apocalypse|disruption|unemployment|shocking|coming|crisis/
      ]);
    }

    return null;
  }

  function isAllowedByLens(scoring, explorationPath) {
    const color = scoring.label || (scoring.classification && scoring.classification.color);
    const policy = (explorationPath && explorationPath.filterPolicy) || "green-or-explanatory-yellow";
    const demoStyleDecision = isAllowedByDemoStyle(scoring, policy, color);

    if (demoStyleDecision !== null) {
      return demoStyleDecision;
    }

    if (color === "RED") {
      return false;
    }

    if (policy === "green-only") {
      return color === "GREEN";
    }

    if (color === "GREEN") {
      return true;
    }

    if (policy === "green-or-explanatory-yellow") {
      return color === "YELLOW" && hasStrongExplanatoryValue(scoring);
    }

    if (policy === "green-or-deep-yellow") {
      return color === "YELLOW" && hasHighQualityRelevantValue(scoring);
    }

    if (policy === "green-or-simple-yellow") {
      return color === "YELLOW" && hasSimpleExplanatoryValue(scoring);
    }

    if (policy === "green-or-longform-yellow") {
      return color === "YELLOW" && hasLongFormValue(scoring);
    }

    return color === "GREEN";
  }

  function rankCandidates(candidates, anchorOrTitle, explorationPath, limit) {
    return (candidates || [])
      .map((candidate) => ({
        ...candidate,
        scoring: scoreContent({
          candidate,
          anchor: anchorOrTitle,
          lens: explorationPath,
          scoringPath: "retrieval-ranking"
        })
      }))
      .filter((candidate) => candidate.title)
      .sort((a, b) => {
        if (b.scoring.score !== a.scoring.score) {
          return b.scoring.score - a.scoring.score;
        }
        return String(a.title).localeCompare(String(b.title));
      })
      .slice(0, limit || 6);
  }

  function scoreCandidates(candidates, anchorOrTitle, explorationPath) {
    return (candidates || [])
      .map((candidate) => ({
        ...candidate,
        scoring: scoreContent({
          candidate,
          anchor: anchorOrTitle,
          lens: explorationPath,
          scoringPath: "retrieval-panel"
        })
      }))
      .filter((candidate) => candidate.title);
  }

  function sortScoredCandidates(scoredCandidates) {
    return [...(scoredCandidates || [])].sort((a, b) => {
      if (b.scoring.score !== a.scoring.score) {
        return b.scoring.score - a.scoring.score;
      }
      return String(a.title).localeCompare(String(b.title));
    });
  }

  function filterCandidatesByLens(scoredCandidates, explorationPath, limit) {
    return sortScoredCandidates(scoredCandidates)
      .filter((candidate) => isAllowedByLens(candidate.scoring, explorationPath))
      .slice(0, limit || 6);
  }

  function buildIntentionalExplorationSet(candidates, anchorOrTitle, explorationPath, limit) {
    const scored = scoreCandidates(candidates, anchorOrTitle, explorationPath);
    const filtered = filterCandidatesByLens(scored, explorationPath, limit);

    return {
      pipeline: ["generate transformed search", "scan visible results", "score results", "apply exploration lens filtering", "display intentional exploration set"],
      lens: explorationPath || null,
      scored: sortScoredCandidates(scored),
      suggestions: filtered
    };
  }

  return {
    BEGINNER_TERMS,
    CALM_LOW_FRICTION_TERMS,
    CALM_NATURE_ANIMAL_SIGNALS,
    CALM_POSITIVE_TERMS,
    HARMLESS_ENERGETIC_TERMS,
    PIPELINE_VERSION,
    SCENARIO_CATEGORIES,
    STYLE_TAXONOMY,
    EXPLORATION_STYLES,
    analyzeAnchor,
    buildIntentionalExplorationSet,
    buildExplorationPaths,
    classifyStyleTerms,
    detectObservabilitySignals,
    defaultScenarioPack,
    defaultGoldenRegressionPack,
    extractNamedEntities,
    extractSubjectAnchor,
    filterCandidatesByLens,
    getPipelineHealth,
    isAllowedByLens,
    rankCandidates,
    removeSensationalTerms,
    replayTrace,
    replayTraces,
    runScenario,
    runScenarioPack,
    runGoldenRegressionPack,
    scoreContent,
    scoreCandidate,
    scoreCandidates,
    tokenize
  };
});

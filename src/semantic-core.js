(function attachPersonaLabsSemantic(root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.PersonaLabsSemantic = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function createPersonaLabsSemantic() {
  "use strict";

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
    "guide"
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
    "soothing",
    "sleep",
    "peaceful",
    "cozy",
    "chill",
    "meditation",
    "wholesome"
  ];

  const CALM_POSITIVE_TERMS = CALM_NATURE_ANIMAL_SIGNALS;

  const HARMLESS_ENERGETIC_TERMS = [
    "funny",
    "hyper",
    "loud",
    "meme",
    "memes",
    "shorts",
    "reaction",
    "reactions",
    "fast-cut",
    "fast cut"
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
    const severeFriction =
      metrics.styleTermCount >= 2 ||
      (metrics.styleTermCount >= 1 && metrics.capitalizationRatio > 0.5) ||
      (metrics.styleTermCount >= 1 && metrics.penalty >= 16);
    const hasContinuity = metrics.topicRelevance >= 14 || metrics.continuity >= 4;
    const strongExplanatory = metrics.educationalFraming >= 8;
    const hasFormatTrust = metrics.informationalTone >= 6 || metrics.sourceFormat >= 5;
    const strongCalmPositive = metrics.calmPositive >= 2;
    const clearCalmAnimalSubject = metrics.calmAnimalScore >= 1;
    const noEscalation = metrics.escalationScore === 0;
    const harmlessEnergyWithoutCompression = metrics.harmlessEnergy >= 2 && noEscalation;
    const lowFriction =
      metrics.calmLanguage >= 16 &&
      metrics.styleTermCount === 0 &&
      metrics.capitalizationRatio <= 0.36;

    if (severeFriction || (metrics.styleTermCount >= 1 && metrics.score < 34)) {
      return {
        color: "RED",
        label: "high-friction/escalatory",
        meaning: "High-friction or escalatory framing; filtered out of guided exploration.",
        reason: "explicit escalation or distress framing detected"
      };
    }

    if (harmlessEnergyWithoutCompression) {
      return {
        color: "YELLOW",
        label: "mixed but useful",
        meaning: "Energetic or meme-paced content without true escalation.",
        reason: "harmless energetic pacing without escalation"
      };
    }

    if (clearCalmAnimalSubject && noEscalation) {
      return {
        color: "GREEN",
        label: "safe candidate",
        meaning: "Calm animal, pet, nature, or ambient relaxation presentation.",
        reason: "calm nature/animal override: animal/pet/nature subject with no escalation"
      };
    }

    if (metrics.score >= 50 && hasContinuity && lowFriction && strongCalmPositive) {
      return {
        color: "GREEN",
        label: "safe candidate",
        meaning: "Calm, relaxing, or low-friction subject presentation.",
        reason: "strong calm/relaxing positive signals"
      };
    }

    if (metrics.score >= 62 && hasContinuity && lowFriction && (hasFormatTrust || strongExplanatory || metrics.topicRelevance >= 24)) {
      return {
        color: "GREEN",
        label: "safe candidate",
        meaning: "Safe candidate for calmer and lower-friction exploration.",
        reason: "low-friction candidate with continuity and trusted explanatory/format signals"
      };
    }

    if (metrics.score >= 56 && hasContinuity && (strongExplanatory || hasFormatTrust) && metrics.styleTermCount === 0) {
      return {
        color: "GREEN",
        label: "safe candidate",
        meaning: "Relevant explanatory result with low-friction wording.",
        reason: "explanatory or trusted source format with no escalation"
      };
    }

    return {
      color: "YELLOW",
      label: "mixed but useful",
      meaning: "Neutral or mixed result that can be useful for educational, deeper, or structured exploration lenses.",
      reason: "neutral default: no explicit escalation, but not enough GREEN evidence"
    };
  }

  function scoreCandidate(candidate, anchorOrTitle, explorationPath) {
    const anchor = typeof anchorOrTitle === "string" ? analyzeAnchor(anchorOrTitle) : anchorOrTitle;
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
    const calmPositiveMatches = countMatches(titleTokens, CALM_POSITIVE_TERMS);
    const calmNatureAnimalMatches = countMatches(titleTokens, CALM_NATURE_ANIMAL_SIGNALS);
    const harmlessEnergeticMatches = countMatches(titleTokens, HARMLESS_ENERGETIC_TERMS);
    const beginnerMatches = countMatches(tokens, BEGINNER_TERMS);
    const neutralReportingMatches = countMatches(tokens, NEUTRAL_REPORTING_TERMS);
    const interviewDiscussionMatches = countMatches(tokens, INTERVIEW_DISCUSSION_TERMS);
    const lowerFrictionSourceMatches = countMatches(tokens, LOWER_FRICTION_SOURCE_TERMS);
    const mixedSourceMatches = countMatches(tokens, MIXED_SOURCE_TERMS);
    const preferredMatches = countMatches(tokens, (explorationPath && explorationPath.preferredTerms) || []);
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
    const penalty = Math.max(0, Math.min(28, styleTerms.length * 6 + mixedSourceMatches * 2 + (capRatio > 0.5 ? 8 : 0) - neutralOffset));
    const score = clampScore(topicRelevance + educationalFraming + calmLanguage + continuity + format + informationalTone + sourceFormat - penalty);
    const classification = classifyScoredCandidate({
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
      escalationScore: styleTerms.length,
      harmlessEnergy: harmlessEnergeticMatches,
      penalty,
      styleTermCount: styleTerms.length,
      capitalizationRatio: capRatio
    });

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
    if (harmlessEnergeticMatches > 0) {
      reasons.push("harmless energetic pacing");
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
    if (reasons.length === 0) {
      reasons.push("visible result with partial subject overlap");
    }

    return {
      score,
      classification,
      debug: {
        calm_animal_score: calmNatureAnimalMatches,
        escalation_score: styleTerms.length,
        final_classification_reason: classification.reason
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
        penalty
      },
      reasons,
      observabilitySignals: {
        ...signals,
        source: sourceSignals
      },
      detectedStyleTerms: styleTerms,
      capitalizationRatio: capRatio
    };
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

  function isAllowedByLens(scoring, explorationPath) {
    const color = scoring.classification.color;
    const policy = (explorationPath && explorationPath.filterPolicy) || "green-or-explanatory-yellow";

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
        scoring: scoreCandidate(candidate, anchorOrTitle, explorationPath)
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
        scoring: scoreCandidate(candidate, anchorOrTitle, explorationPath)
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
    STYLE_TAXONOMY,
    EXPLORATION_STYLES,
    analyzeAnchor,
    buildIntentionalExplorationSet,
    buildExplorationPaths,
    classifyStyleTerms,
    detectObservabilitySignals,
    extractNamedEntities,
    extractSubjectAnchor,
    filterCandidatesByLens,
    isAllowedByLens,
    rankCandidates,
    removeSensationalTerms,
    scoreCandidate,
    scoreCandidates,
    tokenize
  };
});

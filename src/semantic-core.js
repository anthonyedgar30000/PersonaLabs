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
      "meltdown",
      "emergency",
      "explosive",
      "apocalypse",
      "doomed",
      "disaster",
      "catastrophe",
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
      "bombshell",
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
      "unhinged",
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
      description: "Like this, but calmer",
      suffix: "calm context analysis",
      preferredTerms: ["context", "analysis", "discussion"],
      explanation: "Lower-friction framing with the same subject anchor"
    },
    {
      id: "educational",
      label: "Educational",
      buttonLabel: "educational",
      description: "Like this, but educational",
      suffix: "explained educational analysis",
      preferredTerms: ["explained", "educational", "overview"],
      explanation: "Educational framing while preserving topic continuity"
    },
    {
      id: "deeper",
      label: "Deeper dive",
      buttonLabel: "deeper dive",
      description: "Like this, but deeper",
      suffix: "deep dive background analysis",
      preferredTerms: ["deep dive", "background", "analysis"],
      explanation: "More background and explanatory depth"
    },
    {
      id: "beginner",
      label: "Beginner friendly",
      buttonLabel: "beginner friendly",
      description: "Like this, but beginner-friendly",
      suffix: "beginner friendly explained overview",
      preferredTerms: ["beginner", "explained", "overview"],
      explanation: "Beginner-friendly entry point for the same topic"
    },
    {
      id: "longform",
      label: "Longer-form",
      buttonLabel: "longer-form",
      description: "Like this, but longer-form",
      suffix: "long-form discussion analysis",
      preferredTerms: ["long-form", "discussion", "interview"],
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
        description: style.description,
        query,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
        preferredTerms: style.preferredTerms,
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

  function scoreCandidate(candidate, anchorOrTitle, explorationPath) {
    const anchor = typeof anchorOrTitle === "string" ? analyzeAnchor(anchorOrTitle) : anchorOrTitle;
    const title = candidate.title || "";
    const channel = candidate.channel || "";
    const text = normalizeWhitespace(`${title} ${channel}`);
    const tokens = tokenize(text);
    const titleTokens = tokenize(title);
    const anchorTerms = unique(anchor.keyTerms || tokenize(anchor.subjectAnchor || anchor.originalTitle || ""));
    const namedEntityTokens = tokenize((anchor.namedEntities || []).join(" "));
    const styleTerms = classifyStyleTerms(title);
    const educationalMatches = countMatches(tokens, EXPLANATORY_TERMS);
    const preferredMatches = countMatches(tokens, (explorationPath && explorationPath.preferredTerms) || []);
    const continuityMatches = countMatches(titleTokens, namedEntityTokens);
    const topicMatches = countMatches(titleTokens, anchorTerms);
    const durationSeconds = parseDurationSeconds(candidate.duration);
    const capRatio = capitalizationRatio(title);

    const topicRelevance = Math.min(40, topicMatches * 7 + continuityMatches * 4);
    const educationalFraming = Math.min(20, educationalMatches * 4 + preferredMatches * 4);
    const calmLanguage = Math.max(0, 20 - styleTerms.length * 5 - (capRatio > 0.36 ? 6 : 0));
    const continuity = Math.min(12, continuityMatches * 4 + (topicMatches >= 2 ? 4 : 0));
    const format =
      Math.min(8, countMatches(tokens, LONG_FORM_TERMS) * 3 + (durationSeconds >= 20 * 60 ? 5 : durationSeconds >= 8 * 60 ? 2 : 0));
    const penalty = Math.min(24, styleTerms.length * 4 + (capRatio > 0.5 ? 8 : 0));
    const score = clampScore(topicRelevance + educationalFraming + calmLanguage + continuity + format - penalty);

    const reasons = [];
    if (topicMatches > 0 || continuityMatches > 0) {
      reasons.push("Topic continuity preserved");
    }
    if (educationalMatches > 0 || preferredMatches > 0) {
      reasons.push("Lower-friction educational framing");
    }
    if (format > 3) {
      reasons.push("Long-form discussion format");
    }
    if (styleTerms.length === 0 && capRatio <= 0.36) {
      reasons.push("Lower sensational wording");
    }
    if (styleTerms.length > 0) {
      reasons.push("Contains escalation signals; ranked lower");
    }
    if (reasons.length === 0) {
      reasons.push("Visible result with partial subject overlap");
    }

    return {
      score,
      breakdown: {
        topicRelevance,
        educationalFraming,
        calmLanguage,
        continuity,
        format,
        penalty
      },
      reasons,
      detectedStyleTerms: styleTerms,
      capitalizationRatio: capRatio
    };
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

  return {
    STYLE_TAXONOMY,
    EXPLORATION_STYLES,
    analyzeAnchor,
    buildExplorationPaths,
    classifyStyleTerms,
    extractNamedEntities,
    extractSubjectAnchor,
    rankCandidates,
    removeSensationalTerms,
    scoreCandidate,
    tokenize
  };
});

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
  "bunny",
  "cat",
  "dog",
  "fish",
  "kitten",
  "mini lop",
  "pet",
  "puppy",
  "rabbit",
  "rabbits",
];

const LOW_SEVERITY_ANIMAL_TERMS = [
  "compilation",
  "cute",
  "energetic",
  "funny",
  "playful",
  "playing",
  "relaxing",
  "shorts",
  "silly",
  "viral",
  "zoomies",
];

const YELLOW_ESCALATION_TERMS = [
  "chaotic",
  "fails",
  "hyper",
  "loud",
  "mild drama",
  "prank",
  "screaming",
];

const RED_ESCALATION_TERMS = [
  "abuse",
  "attack",
  "blood",
  "brutal",
  "crisis",
  "death",
  "disturbing",
  "emergency",
  "injured",
  "injury",
  "terrifying",
];

export function classifySemanticContent(content = {}) {
  const text = joinText(content.title, content.channel, content.description);
  const domain = detectDomain(text);
  const redSignals = findTerms(text, RED_ESCALATION_TERMS);
  const yellowSignals = findTerms(text, YELLOW_ESCALATION_TERMS);
  const suppressedSignals = domain === DOMAINS.ANIMAL_PET_NATURE
    ? findTerms(text, LOW_SEVERITY_ANIMAL_TERMS)
    : [];
  const baselineSafe = domain === DOMAINS.ANIMAL_PET_NATURE;
  const label = chooseLabel({
    baselineSafe,
    redSignals,
    yellowSignals,
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
    explanation: explain({
      label,
      baselineSafe,
      redSignals,
      yellowSignals,
    }),
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
  return findTerms(text, ANIMAL_PET_NATURE_TERMS).length > 0
    ? DOMAINS.ANIMAL_PET_NATURE
    : DOMAINS.GENERAL;
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

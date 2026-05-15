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
  GENERAL: "GENERAL",
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

const HARMLESS_ANIMAL_ENGAGEMENT_TERMS = [
  "funny",
  "cute",
  "compilation",
  "eating",
  "playing",
  "baby",
  "shorts",
  "viral",
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

const GENERAL_CALMER_FRICTION_TERMS = [
  "argument",
  "debate",
  "drama",
  "fight",
  "heated",
  "meltdown",
  "outrage",
  "political",
  "prank",
  "rant",
  "shocking",
  "screaming",
  "viral",
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
  const domainText = joinText(title, channel);
  const fullText = joinText(title, channel, content.description);
  const lens = normalizeLens(content.lens);
  const animalDomainMatches = findTerms(domainText, ANIMAL_PET_NATURE_TERMS);
  const domain = animalDomainMatches.length > 0
    ? DOMAINS.ANIMAL_PET_NATURE
    : DOMAINS.GENERAL;

  const distressMatches = findTerms(fullText, DISTRESS_DANGER_TERMS);
  const animalChaosMatches = findTerms(fullText, ANIMAL_CHAOTIC_HARMLESS_TERMS);
  const harmlessAnimalEngagementMatches = findTerms(
    fullText,
    HARMLESS_ANIMAL_ENGAGEMENT_TERMS,
  );
  const reasons = [
    {
      code: "lens.selected",
      message: `Using ${lens} lens.`,
      terms: [lens],
    },
  ];

  if (domain === DOMAINS.ANIMAL_PET_NATURE) {
    reasons.push({
      code: "domain.detected",
      message: "Animal/pet/nature domain detected from title or channel.",
      terms: animalDomainMatches,
    });
  } else {
    reasons.push({
      code: "domain.general",
      message: "No animal/pet/nature domain terms were found in title or channel.",
      terms: [],
    });
  }

  if (distressMatches.length > 0) {
    reasons.push({
      code: "red.distress_danger",
      message: "Explicit distress or danger terms override domain defaults.",
      terms: distressMatches,
    });

    return result(LABELS.RED, domain, lens, reasons);
  }

  if (isLowerFrictionLens(lens) && domain === DOMAINS.ANIMAL_PET_NATURE) {
    if (animalChaosMatches.length > 0) {
      reasons.push({
        code: "yellow.animal_chaotic_harmless",
        message: "Animal/pet/nature content has explicit chaotic-but-harmless terms.",
        terms: animalChaosMatches,
      });

      return result(LABELS.YELLOW, domain, lens, reasons);
    }

    if (harmlessAnimalEngagementMatches.length > 0) {
      reasons.push({
        code: "green.animal_engagement_neutralized",
        message: "Harmless animal/pet/nature engagement terms are treated as benign for this lens.",
        terms: harmlessAnimalEngagementMatches,
      });
    }

    reasons.push({
      code: "green.animal_default",
      message: "Calmer/lower-friction lens defaults harmless animal/pet/nature content to GREEN.",
      terms: [],
    });

    return result(LABELS.GREEN, domain, lens, reasons);
  }

  if (animalChaosMatches.length > 0) {
    reasons.push({
      code: "yellow.chaotic_terms",
      message: "Chaotic engagement terms increase friction for the selected lens.",
      terms: animalChaosMatches,
    });

    return result(LABELS.YELLOW, domain, lens, reasons);
  }

  const generalCalmerFrictionMatches = isLowerFrictionLens(lens)
    ? findTerms(fullText, GENERAL_CALMER_FRICTION_TERMS)
    : [];

  if (generalCalmerFrictionMatches.length > 0) {
    reasons.push({
      code: "yellow.general_calmer_friction",
      message: "Non-animal content contains terms that are higher-friction for the calmer lens.",
      terms: generalCalmerFrictionMatches,
    });

    return result(LABELS.YELLOW, domain, lens, reasons);
  }

  reasons.push({
    code: "green.default",
    message: "No distress, danger, or friction terms were found for the selected lens.",
    terms: [],
  });

  return result(LABELS.GREEN, domain, lens, reasons);
}

export function detectDomain(content = {}) {
  const domainText = joinText(content.title, content.channel);
  const matches = findTerms(domainText, ANIMAL_PET_NATURE_TERMS);

  return {
    domain: matches.length > 0 ? DOMAINS.ANIMAL_PET_NATURE : DOMAINS.GENERAL,
    matches,
  };
}

export function isLowerFrictionLens(lens) {
  return LOWER_FRICTION_LENS_NAMES.has(asText(lens).toLowerCase());
}

function result(label, domain, lens, reasons) {
  return {
    label,
    domain,
    lens,
    reasons,
    explanation: reasons.map((reason) => reason.message).join(" "),
  };
}

function normalizeLens(lens) {
  if (isLowerFrictionLens(lens)) {
    return LENSES.CALMER;
  }

  return asText(lens) || LENSES.DEFAULT;
}

function findTerms(text, terms) {
  const source = asText(text);

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
  return values.map(asText).filter(Boolean).join(" ");
}

function asText(value) {
  return value == null ? "" : String(value);
}

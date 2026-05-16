export const RELATION_TYPES = Object.freeze({
  BELONGS_TO: "belongs_to",
  BOOSTS_LENS: "boosts_lens",
  PENALIZED_BY_LENS: "penalized_by_lens",
  CONTEXT_SENSITIVE: "context_sensitive",
  SUPPRESSES_IN_DOMAIN: "suppresses_in_domain",
});

export const SEMANTIC_RELATIONSHIPS = Object.freeze([
  relation("rabbit", RELATION_TYPES.BELONGS_TO, "ANIMAL_PET_NATURE"),
  relation("bunny", RELATION_TYPES.BELONGS_TO, "ANIMAL_PET_NATURE"),
  relation("pet", RELATION_TYPES.BELONGS_TO, "ANIMAL_PET_NATURE"),
  relation("hamster", RELATION_TYPES.BELONGS_TO, "ANIMAL_PET_NATURE"),
  relation("lecture", RELATION_TYPES.BELONGS_TO, "EDUCATIONAL"),
  relation("tutorial", RELATION_TYPES.BELONGS_TO, "TUTORIAL"),
  relation("documentary", RELATION_TYPES.BELONGS_TO, "DOCUMENTARY"),
  relation("meltdown", RELATION_TYPES.BELONGS_TO, "ESCALATION"),
  relation("emergency", RELATION_TYPES.BELONGS_TO, "DISTRESS"),
  relation("funny", RELATION_TYPES.BELONGS_TO, "PLAYFUL_ENERGY"),
  relation("zoomies", RELATION_TYPES.BELONGS_TO, "PLAYFUL_ENERGY"),
  relation("ANIMAL_PET_NATURE", RELATION_TYPES.BOOSTS_LENS, "CALMER"),
  relation("CALM_REGULATION", RELATION_TYPES.BOOSTS_LENS, "CALMER"),
  relation("EDUCATIONAL", RELATION_TYPES.BOOSTS_LENS, "EDUCATIONAL"),
  relation("TUTORIAL", RELATION_TYPES.BOOSTS_LENS, "EDUCATIONAL"),
  relation("ESCALATION", RELATION_TYPES.PENALIZED_BY_LENS, "CALMER"),
  relation("DISTRESS", RELATION_TYPES.PENALIZED_BY_LENS, "CALMER"),
  relation("PLAYFUL_ENERGY", RELATION_TYPES.CONTEXT_SENSITIVE, "ANIMAL_PET_NATURE"),
  relation("PLAYFUL_ENERGY", RELATION_TYPES.SUPPRESSES_IN_DOMAIN, "ANIMAL_PET_NATURE"),
]);

export function findSemanticRelationships(values) {
  const terms = new Set(values);

  return SEMANTIC_RELATIONSHIPS.filter((relationship) => (
    terms.has(relationship.source) || terms.has(relationship.target)
  ));
}

function relation(source, type, target) {
  return Object.freeze({
    source,
    type,
    target,
  });
}

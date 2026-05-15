const assert = require("node:assert/strict");
const test = require("node:test");

const semantic = require("../src/semantic-core");

test("extracts subject-preserving anchors while removing escalation style terms", () => {
  const anchor = semantic.analyzeAnchor("BREAKING: Thomas Massie DESTROYS Iran vote - SHOCKING analysis");

  assert.equal(anchor.subjectAnchor, "Thomas Massie Iran vote");
  assert.deepEqual(anchor.namedEntities, ["Thomas Massie", "Iran"]);
  assert(anchor.removedEscalationTerms.some((item) => item.normalizedTerm === "breaking"));
  assert(anchor.removedEscalationTerms.some((item) => item.normalizedTerm === "destroys"));
  assert(anchor.removedEscalationTerms.some((item) => item.normalizedTerm === "shocking"));
});

test("builds transformed exploration paths that preserve the contextual subject", () => {
  const anchor = semantic.analyzeAnchor("Thomas Massie DESTROYS Iran vote");
  const paths = semantic.buildExplorationPaths(anchor);

  assert.equal(paths.length, 5);
  assert(paths.every((path) => path.query.includes("Thomas Massie Iran vote")));
  assert(paths.find((path) => path.id === "educational").query.includes("explained educational analysis"));
  assert(paths.find((path) => path.id === "longform").query.includes("long-form discussion analysis"));
});

test("ranks explanatory, lower-sensational candidates above ragebait with same topic", () => {
  const anchor = semantic.analyzeAnchor("Thomas Massie DESTROYS Iran vote");
  const path = semantic.buildExplorationPaths(anchor).find((item) => item.id === "educational");
  const ranked = semantic.rankCandidates(
    [
      {
        title: "Thomas Massie Iran vote explained: context and analysis",
        channel: "Policy Classroom",
        duration: "18:24"
      },
      {
        title: "MASSIE OBLITERATES opponents in insane Iran vote meltdown",
        channel: "Outrage Daily",
        duration: "4:10"
      }
    ],
    anchor,
    path
  );

  assert.equal(ranked[0].channel, "Policy Classroom");
  assert(ranked[0].scoring.score > ranked[1].scoring.score);
  assert(ranked[0].scoring.reasons.includes("topic continuity preserved"));
});

test("classifies scored candidates into operational observability colors", () => {
  const anchor = semantic.analyzeAnchor("Thomas Massie Iran vote");
  const path = semantic.buildExplorationPaths(anchor).find((item) => item.id === "educational");
  const green = semantic.scoreCandidate(
    {
      title: "Thomas Massie Iran vote explained: calm context and analysis",
      channel: "Policy Classroom",
      duration: "18:24"
    },
    anchor,
    path
  );
  const yellow = semantic.scoreCandidate(
    {
      title: "Thomas Massie Iran vote debate explained after backlash",
      channel: "Civic Roundtable",
      duration: "24:00"
    },
    anchor,
    path
  );
  const red = semantic.scoreCandidate(
    {
      title: "MASSIE OBLITERATES opponents in insane Iran vote meltdown",
      channel: "Outrage Daily",
      duration: "4:10"
    },
    anchor,
    path
  );

  assert.equal(green.classification.color, "GREEN");
  assert.equal(yellow.classification.color, "YELLOW");
  assert.equal(red.classification.color, "RED");
});

test("scores first, then filters according to the selected exploration lens", () => {
  const anchor = semantic.analyzeAnchor("Thomas Massie Iran vote");
  const paths = semantic.buildExplorationPaths(anchor);
  const calmer = paths.find((item) => item.id === "calmer");
  const educational = paths.find((item) => item.id === "educational");
  const candidates = [
    {
      title: "Thomas Massie Iran vote explained: calm context and analysis",
      channel: "Policy Classroom",
      duration: "18:24"
    },
    {
      title: "Thomas Massie Iran vote debate explained after backlash",
      channel: "Civic Roundtable",
      duration: "24:00"
    },
    {
      title: "MASSIE OBLITERATES opponents in insane Iran vote meltdown",
      channel: "Outrage Daily",
      duration: "4:10"
    }
  ];

  const calmerSet = semantic.buildIntentionalExplorationSet(candidates, anchor, calmer);
  const educationalSet = semantic.buildIntentionalExplorationSet(candidates, anchor, educational);

  assert.equal(calmerSet.scored.length, 3);
  assert.deepEqual(calmerSet.suggestions.map((item) => item.scoring.classification.color), ["GREEN"]);
  assert.deepEqual(
    educationalSet.suggestions.map((item) => item.scoring.classification.color),
    ["GREEN", "YELLOW"]
  );
  assert(calmerSet.pipeline.includes("score results"));
  assert(calmerSet.pipeline.indexOf("score results") < calmerSet.pipeline.indexOf("apply exploration lens filtering"));
});

test("does not require cloud, embeddings, or opaque recommendation inputs", () => {
  const candidate = { title: "Gaza ceasefire talks explained", channel: "Civic Context", duration: "22:00" };
  const anchor = semantic.analyzeAnchor("Gaza ceasefire talks BREAKING update");
  const score = semantic.scoreCandidate(candidate, anchor, semantic.buildExplorationPaths(anchor)[0]);

  assert.equal(typeof score.score, "number");
  assert.deepEqual(Object.keys(score.breakdown), [
    "topicRelevance",
    "educationalFraming",
    "calmLanguage",
    "continuity",
    "format",
    "penalty"
  ]);
  assert.equal(score.classification.color, "GREEN");
});

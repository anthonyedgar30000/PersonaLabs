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
    "informationalTone",
    "sourceFormat",
    "calmAnimalScore",
    "harmlessEnergy",
    "animalDistressScore",
    "penalty"
  ]);
  assert.equal(score.classification.color, "GREEN");
});

test("treats interview and public radio format as lower-friction despite controversial topic terms", () => {
  const anchor = semantic.analyzeAnchor("Thomas Massie Trump Big Beautiful Bill Epstein Files");
  const path = semantic.buildExplorationPaths(anchor).find((item) => item.id === "calmer");
  const score = semantic.scoreCandidate(
    {
      title: "Rep. Thomas Massie on Trump, the Big Beautiful Bill, and the Epstein Files",
      channel: "Cincinnati Public Radio",
      duration: "32:10"
    },
    anchor,
    path
  );

  assert.notEqual(score.classification.color, "RED");
  assert(["GREEN", "YELLOW"].includes(score.classification.color));
  assert(score.reasons.includes("lower-friction source format"));
});

test("does not treat neutral claim-response verbs as high-friction by default", () => {
  const anchor = semantic.analyzeAnchor("Thomas Massie hush money allegations");
  const path = semantic.buildExplorationPaths(anchor).find((item) => item.id === "educational");
  const score = semantic.scoreCandidate(
    {
      title: "Thomas Massie denies allegations he offered hush money",
      channel: "Local News",
      duration: "6:30"
    },
    anchor,
    path
  );

  assert.notEqual(score.classification.color, "RED");
  assert(score.reasons.includes("neutral reporting language"));
});

test("boosts discussion of sensitive topics on lower-friction source formats", () => {
  const anchor = semantic.analyzeAnchor("Thomas Massie Iran vote");
  const path = semantic.buildExplorationPaths(anchor).find((item) => item.id === "educational");
  const score = semantic.scoreCandidate(
    {
      title: "Thomas Massie discusses Iran vote on public radio",
      channel: "Public Radio Forum",
      duration: "24:00"
    },
    anchor,
    path
  );

  assert.notEqual(score.classification.color, "RED");
  assert(["GREEN", "YELLOW"].includes(score.classification.color));
  assert(score.reasons.includes("neutral reporting language"));
  assert(score.reasons.includes("lower-friction source format"));
});

test("requires actual escalation framing for RED classifications", () => {
  const cases = [
    {
      anchor: "Thomas Massie Epstein",
      title: "Thomas Massie EXPOSED in Epstein BOMBSHELL",
      channel: "Breaking Update"
    },
    {
      anchor: "Trump Admin Iran",
      title: "Trump Admin HUMILIATED After Iran Backfires BADLY",
      channel: "Reaction Clips"
    },
    {
      anchor: "Kash Patel reporter behavior",
      title: "Kash Patel PANICS as Reporter EXPOSES Behavior",
      channel: "Live Rant"
    }
  ];

  cases.forEach((item) => {
    const anchor = semantic.analyzeAnchor(item.anchor);
    const path = semantic.buildExplorationPaths(anchor).find((lens) => lens.id === "educational");
    const score = semantic.scoreCandidate(
      {
        title: item.title,
        channel: item.channel,
        duration: "8:00"
      },
      anchor,
      path
    );

    assert.equal(score.classification.color, "RED", item.title);
  });
});

test("classifies calm animal and relaxing content as GREEN", () => {
  const cases = [
    "Cute Baby Bunny Compilation",
    "Relaxing Rabbit Videos",
    "Calm Animal Sounds",
    "Relaxing Bird Sounds",
    "Cozy Cat Videos",
    "Calm Aquarium Ambient Video",
    "Peaceful Forest Animal Sounds",
    "Cute Puppy Sleep Compilation",
    "Pet Videos",
    "Dog Videos",
    "Cat Videos",
    "Pet Compilation",
    "Cute Rabbit Eating Carrot",
    "Funny Baby Bunny Compilation",
    "Cute Bird Singing",
    "Baby Rabbits Doing Funny Things",
    "Relaxing Aquarium Fish Video"
  ];

  cases.forEach((title) => {
    const anchor = semantic.analyzeAnchor(title);
    const path = semantic.buildExplorationPaths(anchor).find((lens) => lens.id === "calmer");
    const score = semantic.scoreCandidate(
      {
        title,
        channel: "Wholesome Pets",
        duration: "12:00"
      },
      anchor,
      path
    );

    assert.equal(score.classification.color, "GREEN", title);
    assert(score.reasons.includes("calm/relaxing positive signals"));
    assert(score.reasons.includes("calm animal/nature signals"));
    assert(score.reasons.includes("Calm/pet content detected; no distress or escalation signals found."));
    assert(score.debug.calm_animal_score >= 1);
    assert.equal(score.debug.escalation_score, 0);
    assert.match(score.debug.final_classification_reason, /Calm\/pet content detected/i);
  });
});

test("classifies energetic harmless pet pacing as YELLOW without escalation", () => {
  const cases = [
    "Funny Hyper Puppy Shorts Compilation",
    "Loud Meme Cat Reactions",
    "Hyper Dog Zoomies Compilation",
    "Loud Cat Screaming Meme"
  ];

  cases.forEach((title) => {
    const anchor = semantic.analyzeAnchor(title);
    const path = semantic.buildExplorationPaths(anchor).find((lens) => lens.id === "calmer");
    const score = semantic.scoreCandidate(
      {
        title,
        channel: "Pet Shorts",
        duration: "0:58"
      },
      anchor,
      path
    );

    assert.equal(score.classification.color, "YELLOW", title);
    assert(score.reasons.includes("chaotic but non-dangerous animal/pet energy"));
    assert.equal(score.debug.escalation_score, 0);
  });
});

test("does not downgrade harmless animal pacing terms to YELLOW by themselves", () => {
  const cases = [
    "Funny Baby Bunny Compilation",
    "Cute Cat Reaction",
    "Viral Puppy Shorts",
    "Baby Rabbit Eating"
  ];

  cases.forEach((title) => {
    const anchor = semantic.analyzeAnchor(title);
    const path = semantic.buildExplorationPaths(anchor).find((lens) => lens.id === "calmer");
    const score = semantic.scoreCandidate(
      {
        title,
        channel: "Pet Videos",
        duration: "0:45"
      },
      anchor,
      path
    );

    assert.equal(score.classification.color, "GREEN", title);
    assert.equal(score.debug.escalation_score, 0);
  });
});

test("classifies animal distress and escalation framing as RED", () => {
  const cases = [
    "SHOCKING Animal Attack Compilation",
    "Terrifying Pet Emergency Breakdown",
    "Shocking Animal Attack",
    "Injured Dog Emergency Rescue"
  ];

  cases.forEach((title) => {
    const anchor = semantic.analyzeAnchor(title);
    const path = semantic.buildExplorationPaths(anchor).find((lens) => lens.id === "calmer");
    const score = semantic.scoreCandidate(
      {
        title,
        channel: "Breaking Clips",
        duration: "8:00"
      },
      anchor,
      path
    );

    assert.equal(score.classification.color, "RED", title);
    assert(score.debug.escalation_score > 0);
    assert.match(score.debug.final_classification_reason, /escalation|distress/i);
  });
});

test("unknown low-friction content defaults to YELLOW-neutral, not RED", () => {
  const anchor = semantic.analyzeAnchor("Thomas Massie Iran vote");
  const path = semantic.buildExplorationPaths(anchor).find((lens) => lens.id === "educational");
  const score = semantic.scoreCandidate(
    {
      title: "Community Garden Walkthrough",
      channel: "Neighborhood Archive",
      duration: "9:00"
    },
    anchor,
    path
  );

  assert.equal(score.classification.color, "YELLOW");
  assert.equal(score.detectedStyleTerms.length, 0);
});

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

  assert.equal(green.label, "GREEN");
  assert.equal(yellow.label, "YELLOW");
  assert.equal(red.label, "RED");
});

test("exposes numeric confidence fields with final classification reason", () => {
  const anchor = semantic.analyzeAnchor("Thomas Massie Iran vote");
  const path = semantic.buildExplorationPaths(anchor).find((item) => item.id === "educational");
  const score = semantic.scoreCandidate(
    {
      title: "Thomas Massie Iran vote explained: calm context and analysis",
      channel: "Policy Classroom",
      duration: "18:24"
    },
    anchor,
    path
  );

  [
    score.confidence,
    score.domainConfidence,
    score.frictionConfidence,
    score.positiveSignalConfidence
  ].forEach((value) => {
    assert.equal(Number.isInteger(value), true);
    assert(value >= 0 && value <= 100);
  });
  assert.equal(score.finalReason, score.classification.reason);
  assert.equal(score.debug.confidence, score.confidence);
  assert.equal(score.debug.domain_confidence, score.domainConfidence);
  assert.equal(score.debug.friction_confidence, score.frictionConfidence);
  assert.equal(score.debug.positive_signal_confidence, score.positiveSignalConfidence);
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
  assert.deepEqual(calmerSet.suggestions.map((item) => item.scoring.label), ["GREEN"]);
  assert.deepEqual(
    educationalSet.suggestions.map((item) => item.scoring.label),
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
  assert.equal(score.label, "GREEN");
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

  assert.notEqual(score.label, "RED");
  assert(["GREEN", "YELLOW"].includes(score.label));
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

  assert.notEqual(score.label, "RED");
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

  assert.notEqual(score.label, "RED");
  assert(["GREEN", "YELLOW"].includes(score.label));
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

    assert.equal(score.label, "RED", item.title);
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

    assert.equal(score.label, "GREEN", title);
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

    assert.equal(score.label, "YELLOW", title);
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

    assert.equal(score.label, "GREEN", title);
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

    assert.equal(score.label, "RED", title);
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

  assert.equal(score.label, "YELLOW");
  assert.equal(score.detectedStyleTerms.length, 0);
});

test("governance regressions keep mature scoring expectations stable", () => {
  const animalAnchor = semantic.analyzeAnchor("Cute Baby Bunny Compilation");
  const calmer = semantic.buildExplorationPaths(animalAnchor).find((lens) => lens.id === "calmer");
  const calmAnimal = semantic.scoreCandidate(
    {
      title: "Cute Baby Bunny Compilation",
      channel: "Wholesome Pets",
      duration: "12:00"
    },
    animalAnchor,
    calmer
  );
  const harmlessAnimal = semantic.scoreCandidate(
    {
      title: "Funny Baby Bunny Compilation",
      channel: "Pet Videos",
      duration: "0:45"
    },
    animalAnchor,
    calmer
  );
  const animalDistress = semantic.scoreCandidate(
    {
      title: "Terrifying Pet Emergency Breakdown",
      channel: "Breaking Clips",
      duration: "8:00"
    },
    animalAnchor,
    calmer
  );

  assert.equal(calmAnimal.label, "GREEN");
  assert.equal(harmlessAnimal.label, "GREEN");
  assert.notEqual(harmlessAnimal.label, "YELLOW");
  assert.equal(animalDistress.label, "RED");

  const civicAnchor = semantic.analyzeAnchor("Thomas Massie Iran vote");
  const educational = semantic.buildExplorationPaths(civicAnchor).find((lens) => lens.id === "educational");
  const publicRadioInterview = semantic.scoreCandidate(
    {
      title: "Thomas Massie discusses Iran vote on public radio",
      channel: "Public Radio Forum",
      duration: "24:00"
    },
    civicAnchor,
    educational
  );
  const outrageTitle = semantic.scoreCandidate(
    {
      title: "OUTRAGE: Thomas Massie meltdown after Iran vote",
      channel: "Outrage Daily",
      duration: "4:10"
    },
    civicAnchor,
    educational
  );

  assert(["GREEN", "YELLOW"].includes(publicRadioInterview.label));
  assert.equal(outrageTitle.label, "RED");
});

test("overlay and panel paths use the same canonical label", () => {
  const candidate = {
    title: "Cute Baby Bunny Compilation",
    channel: "Wholesome Pets",
    duration: "12:00"
  };
  const anchor = semantic.analyzeAnchor(candidate.title);
  const path = semantic.buildExplorationPaths(anchor).find((lens) => lens.id === "calmer");
  const panelScore = semantic.scoreContent({ candidate, anchor, lens: path, scoringPath: "retrieval-panel" });
  const overlayScore = semantic.scoreContent({ candidate, anchor, lens: path, scoringPath: "overlay" });

  assert.equal(panelScore.label, "GREEN");
  assert.equal(overlayScore.label, panelScore.label);
});

test("canonical score detects duplicate path disagreement and empty matched-term consistency", () => {
  const anchor = semantic.analyzeAnchor("Obscure Segment 17");
  const path = semantic.buildExplorationPaths(anchor).find((lens) => lens.id === "educational");
  const neutral = semantic.scoreContent({
    candidate: {
      title: "Obscure Segment 17",
      channel: "Channel 42",
      duration: "9:00"
    },
    anchor,
    lens: path,
    scoringPath: "test-canonical"
  });
  const disagreement = semantic.scoreContent({
    candidate: {
      title: "Cute Baby Bunny Compilation",
      channel: "Wholesome Pets",
      duration: "12:00"
    },
    anchor: semantic.analyzeAnchor("Cute Baby Bunny Compilation"),
    lens: path,
    scoringPath: "test-duplicate",
    expectedLabel: "RED"
  });

  assert.equal(neutral.matchedTerms.positive.length, 0);
  assert.equal(neutral.matchedTerms.friction.length, 0);
  assert(!/title contains|matched terms/i.test(neutral.explanation));
  assert.deepEqual(neutral.contradictions, []);
  assert(disagreement.contradictions.some((item) => /expected label RED disagrees/.test(item)));
});

test("canonical score exposes structured semantic trace events", () => {
  const candidate = {
    title: "Cute Baby Bunny Compilation",
    channel: "Wholesome Pets",
    duration: "12:00"
  };
  const anchor = semantic.analyzeAnchor(candidate.title);
  const lens = semantic.buildExplorationPaths(anchor).find((item) => item.id === "calmer");
  const score = semantic.scoreContent({
    candidate,
    anchor,
    lens,
    scoringPath: "test-telemetry"
  });

  assert.deepEqual(
    score.traceEvents.map((event) => event.stage),
    [
      "metadata normalization",
      "domain detection",
      "signal matching",
      "semantic scoring",
      "confidence consistency validation",
      "suppression/override evaluation",
      "contradiction detection",
      "final label selection"
    ]
  );
  assert.deepEqual(score.traceEvents.map((event) => event.order), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.equal(score.traceEvents[0].details.title, candidate.title);
  assert.equal(score.traceEvents[1].details.domain, score.domain);
  assert.deepEqual(score.traceEvents[2].details.matchedTerms, score.matchedTerms);
  assert.deepEqual(score.traceEvents[3].details.confidenceDeltas, score.semanticSignals.confidenceDeltas);
  assert.equal(score.traceEvents[4].details.confidenceValidation.valid, true);
  assert.deepEqual(score.traceEvents[5].details.suppressedTerms, score.suppressedTerms);
  assert.deepEqual(score.traceEvents[6].details.contradictions, score.contradictions);
  assert.equal(score.traceEvents[7].details.label, score.label);
});

test("canonical score validates confidence consistency", () => {
  const candidate = {
    title: "Thomas Massie Iran vote explained: calm context and analysis",
    channel: "Policy Classroom",
    duration: "18:24"
  };
  const anchor = semantic.analyzeAnchor("Thomas Massie Iran vote");
  const lens = semantic.buildExplorationPaths(anchor).find((item) => item.id === "educational");
  const score = semantic.scoreContent({
    candidate,
    anchor,
    lens,
    scoringPath: "test-confidence"
  });

  assert.equal(score.confidenceValidation.valid, true);
  assert.deepEqual(score.confidenceValidation.failures, []);
  assert.equal(score.scores.confidence, score.confidence);
  assert.equal(score.scores.domainConfidence, score.domainConfidence);
  assert.equal(score.scores.frictionConfidence, score.frictionConfidence);
  assert.equal(score.scores.positiveSignalConfidence, score.positiveSignalConfidence);
  assert.equal(score.semanticSignals.confidenceDeltas.domain, score.domainConfidence);
  assert.equal(score.semanticSignals.confidenceDeltas.friction, score.frictionConfidence);
  assert.equal(score.semanticSignals.confidenceDeltas.positiveSignal, score.positiveSignalConfidence);
});

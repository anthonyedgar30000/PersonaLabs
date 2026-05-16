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

test("educational and guidance framing soften single intense title terms", () => {
  const cases = [
    {
      title: "Shocking New Study Reveals How Sleep Affects Memory",
      channel: "Science Classroom"
    },
    {
      title: "Emergency Preparedness Checklist for Families",
      channel: "Safety Guide"
    }
  ];

  cases.forEach((item) => {
    const anchor = semantic.analyzeAnchor(item.title);
    const path = semantic.buildExplorationPaths(anchor).find((lens) => lens.id === "educational");
    const score = semantic.scoreCandidate(
      {
        title: item.title,
        channel: item.channel,
        duration: "10:00"
      },
      anchor,
      path
    );

    assert.notEqual(score.label, "RED", item.title);
    assert(score.reasons.includes("educational or guidance framing reduced single-signal intensity"), item.title);
  });
});

test("science sleep titles do not trigger animal distress handling", () => {
  const title = "Shocking New Study Reveals How Sleep Affects Memory";
  const score = semantic.scoreContent({
    candidate: { title, channel: "Science Classroom", duration: "9:00" },
    anchor: title,
    scoringPath: "test-contextual-framing"
  });

  assert.notEqual(score.explanation, "explicit animal distress or danger framing detected");
  assert.equal(score.debug.calm_animal_score >= 1, true);
  assert.equal(score.debug.final_classification_reason.includes("animal distress"), false);
});

test("trust-stress title pack stays calibrated around ambiguous framing", () => {
  const cases = [
    ["BREAKING: NASA Confirms New Evidence of Water on Mars", ["YELLOW"]],
    ["Shocking Study Finds Walking 20 Minutes a Day Improves Memory", ["YELLOW"]],
    ["How Propaganda Works: Emotional Manipulation Explained", ["YELLOW"]],
    ["Emergency Preparedness Checklist for Families", ["YELLOW"]],
    ["This Simple Trick Fixed My Back Pain", ["YELLOW"]],
    ["The Truth About Seed Oils", ["YELLOW"]],
    ["Everything You Know About Nutrition Is a Lie", ["YELLOW"]],
    ["Cute Kitten ATTACKS Owner During Playtime", ["YELLOW"]],
    ["He DESTROYED the Final Boss in 10 Seconds", ["YELLOW"]],
    ["Satire: Senator DESTROYS Himself in Fake Debate", ["YELLOW"]],
    ["Calm Explanation of the Most Disturbing Court Case", ["YELLOW"]],
    ["Relaxing Rain Sounds — Black Screen — No Ads", ["GREEN"]],
    ["Peaceful Focus Hypnosis to Reprogram Your Brain", ["YELLOW"]],
    ["Banks Don't Want You to Know This Savings Trick", ["YELLOW"]],
    ["Beginner Python Tutorial: Avoid These 5 Common Mistakes", ["GREEN"]],
    ["I Tried Waking Up at 5AM for 30 Days", ["GREEN", "YELLOW"]],
    ["Why Everyone Is Wrong About AI", ["YELLOW"]],
    ["Public Radio Explains the Immigration Court Backlog", ["GREEN", "YELLOW"]],
    ["LIVE: Hurricane Evacuation Updates and Shelter Locations", ["YELLOW"]],
    ["They Lied to You About Retirement", ["YELLOW"]],
    ["¿Por qué todos hablan de esta película?", ["GREEN", "YELLOW"]],
    ["Cette vidéo va changer ta vie", ["GREEN", "YELLOW"]],
    ["Ukraine War Explained: Timeline, Context, and Maps", ["YELLOW"]],
    ["The Dark Side of Minimalism", ["GREEN", "YELLOW"]],
    ["You Won't Believe How Calm This Aquarium Is", ["YELLOW"]],
    ["Calm Explanation of Why Everything You Know Is a Lie", ["YELLOW"]],
    ["Funny Puppy ATTACKS Toy During Playtime", ["YELLOW"]],
    ["How Outrage Media Works: A Calm Analysis", ["YELLOW"]],
    ["Emergency Safety Guide: What to Do During a Hurricane", ["YELLOW"]],
    ["He DESTROYED the World Record in Mario Kart", ["YELLOW"]],
    ["Satire: Fake Senator Meltdown Sketch", ["YELLOW"]],
    ["This Natural Trick Cured My Anxiety", ["YELLOW"]],
    ["Official Study: Shocking Results Explained", ["YELLOW"]]
  ];

  cases.forEach(([title, expectedLabels]) => {
    const score = semantic.scoreContent({
      candidate: { title, channel: "Trust QA", duration: "10:00" },
      anchor: title,
      scoringPath: "trust-stress-pack"
    });

    assert(expectedLabels.includes(score.label), `${title} classified ${score.label}`);
  });
});

test("ambiguous title evidence separates topic framing intensity conflict and uncertainty", () => {
  const cases = [
    "How Outrage Media Works: A Calm Analysis",
    "You Won't Believe How Calm This Aquarium Is",
    "Cute Kitten ATTACKS Owner During Playtime",
    "Everything You Know About Nutrition Is a Lie",
    "Satire: Senator DESTROYS Himself in Fake Debate",
    "Emergency Safety Guide: What to Do During a Hurricane",
    "Calm Explanation of Why Everything You Know Is a Lie",
    "He DESTROYED the World Record in Mario Kart",
    "This Natural Trick Cured My Anxiety",
    "Official Study: Shocking Results Explained",
    "The Truth About Seed Oils",
    "Why Everyone Is Wrong About AI",
    "LIVE: Hurricane Evacuation Updates and Shelter Locations",
    "Shocking Study Finds Walking 20 Minutes a Day Improves Memory",
    "Banks Don't Want You to Know This Savings Trick"
  ];

  cases.forEach((title) => {
    const score = semantic.scoreContent({
      candidate: { title, channel: "Evidence QA", duration: "10:00" },
      anchor: title,
      scoringPath: "ambiguous-evidence-pack"
    });

    assert.equal(score.label, "YELLOW", title);
    assert.equal(typeof score.evidenceSummary.topicDetection.summary, "string", title);
    assert.equal(typeof score.evidenceSummary.framingDetection.summary, "string", title);
    assert(["low", "medium", "high"].includes(score.evidenceSummary.emotionalIntensity.level), title);
    assert(["medium", "high"].includes(score.evidenceSummary.uncertainty.level), title);
    assert.match(score.evidenceSummary.boundedClaim, /title wording patterns only/i);
  });
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
  score.traceEvents.forEach((event) => {
    assert.equal(event.traceId, score.traceId);
    assert.equal(typeof event.stage, "string");
    assert.equal(typeof event.timestamp, "string");
    assert.equal(event.input.title, candidate.title);
    assert.equal(event.canonicalLabel, score.label);
    assert.deepEqual(event.contradictions, score.contradictions);
    assert.equal(event.metadata.scoringPath, score.scoringPath);
  });
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

test("replay detects no drift for exported canonical traces", () => {
  const candidate = {
    title: "Cute Baby Bunny Compilation",
    channel: "Wholesome Pets",
    duration: "12:00"
  };
  const anchor = semantic.analyzeAnchor(candidate.title);
  const lens = semantic.buildExplorationPaths(anchor).find((item) => item.id === "calmer");
  const score = semantic.scoreContent({ candidate, anchor, lens, scoringPath: "test-export" });
  const exported = JSON.parse(JSON.stringify([score]));
  const [replay] = semantic.replayTraces(exported);

  assert.equal(replay.sourceTraceId, score.traceId);
  assert.equal(replay.originalLabel, score.label);
  assert.equal(replay.currentLabel, score.label);
  assert.equal(replay.confidenceDelta, 0);
  assert.equal(replay.driftClassification, "none");
  assert.equal(replay.replayAgreementState, "agreement");
  assert.equal(replay.pipelineVersionComparison.changed, false);
});

test("replay detects confidence drift", () => {
  const trace = semantic.scoreContent({
    candidate: {
      title: "Thomas Massie Iran vote explained: calm context and analysis",
      channel: "Policy Classroom",
      duration: "18:24"
    },
    anchor: semantic.analyzeAnchor("Thomas Massie Iran vote"),
    lens: semantic.buildExplorationPaths(semantic.analyzeAnchor("Thomas Massie Iran vote")).find((item) => item.id === "educational"),
    scoringPath: "test-confidence-export"
  });
  const historical = { ...trace, confidence: Math.max(0, trace.confidence - 12) };
  const replay = semantic.replayTrace(historical);

  assert.equal(replay.confidenceDrift, true);
  assert.equal(replay.confidenceDelta, trace.confidence - historical.confidence);
  assert.equal(replay.driftClassification, "medium");
});

test("replay detects label and governance drift", () => {
  const trace = semantic.scoreContent({
    candidate: {
      title: "Cute Baby Bunny Compilation",
      channel: "Wholesome Pets",
      duration: "12:00"
    },
    anchor: semantic.analyzeAnchor("Cute Baby Bunny Compilation"),
    lens: semantic.buildExplorationPaths(semantic.analyzeAnchor("Cute Baby Bunny Compilation")).find((item) => item.id === "calmer"),
    scoringPath: "test-label-export"
  });
  const historical = {
    ...trace,
    label: "RED",
    reasoning: {
      ...trace.reasoning,
      downgradeReasons: ["historical governance reason"]
    }
  };
  const replay = semantic.replayTrace(historical);

  assert.equal(replay.labelDrift, true);
  assert.equal(replay.driftClassification, "high");
  assert(replay.governanceDecisionChanges.length > 0);
  assert.equal(replay.replayAgreementState, "drift");
});

test("replay detects contradiction drift", () => {
  const trace = semantic.scoreContent({
    candidate: {
      title: "Obscure Segment 17",
      channel: "Channel 42",
      duration: "9:00"
    },
    anchor: semantic.analyzeAnchor("Obscure Segment 17"),
    lens: semantic.buildExplorationPaths(semantic.analyzeAnchor("Obscure Segment 17")).find((item) => item.id === "educational"),
    scoringPath: "test-contradiction-export"
  });
  const historical = {
    ...trace,
    contradictions: ["historical contradiction"]
  };
  const replay = semantic.replayTrace(historical);

  assert.equal(replay.contradictionDrift, true);
  assert(["medium", "high"].includes(replay.driftClassification));
});

test("scenario runner reports passing canonical scenarios", () => {
  const report = semantic.runScenarioPack(semantic.defaultScenarioPack());

  assert.equal(report.total >= 3, true);
  assert.equal(report.failed, 0);
  assert.equal(report.driftDetected, false);
  assert.equal(report.severity, "none");
  report.results.forEach((result) => {
    assert.equal(result.pass, true);
    assert.equal(result.labelAgreement, true);
    assert.equal(result.confidenceAgreement, true);
    assert.equal(result.governanceAgreement, true);
    assert.equal(result.contradictionAgreement, true);
    assert.equal(result.pipelineVersion, report.pipelineVersion);
  });
});

test("scenario runner detects governance and contradiction mismatches", () => {
  const report = semantic.runScenarioPack({
    name: "Mismatch scenario pack",
    scenarios: [
      {
        id: "governance-mismatch",
        category: "semantic-drift",
        description: "Expected governance text is intentionally absent.",
        expectedLabel: "GREEN",
        expectedConfidenceRange: [0, 100],
        expectedGovernanceOutcomes: ["missing governance marker"],
        expectedContradictionState: false,
        input: {
          title: "Cute Baby Bunny Compilation",
          channel: "Wholesome Pets",
          duration: "12:00"
        }
      },
      {
        id: "contradiction-mismatch",
        category: "contradictory",
        description: "Expected contradiction state is intentionally wrong.",
        expectedLabel: "GREEN",
        expectedConfidenceRange: [0, 100],
        expectedGovernanceOutcomes: ["Calm/pet content detected"],
        expectedContradictionState: true,
        input: {
          title: "Cute Baby Bunny Compilation",
          channel: "Wholesome Pets",
          duration: "12:00"
        }
      }
    ]
  });

  assert.equal(report.failed, 2);
  assert.equal(report.driftDetected, true);
  assert(report.results.some((result) => !result.governanceAgreement));
  assert(report.results.some((result) => !result.contradictionAgreement));
});

test("scenario runner covers edge-case and adversarial-title stability", () => {
  const report = semantic.runScenarioPack({
    name: "Edge and adversarial stability",
    scenarios: [
      {
        id: "low-context-edge",
        category: "edge-case",
        description: "Low context content remains deterministic.",
        expectedLabel: "YELLOW",
        expectedConfidenceRange: [0, 100],
        expectedGovernanceOutcomes: ["neutral default"],
        expectedContradictionState: false,
        input: {
          title: "Obscure Segment 17",
          channel: "Channel 42",
          duration: "9:00"
        }
      },
      {
        id: "adversarial-title",
        category: "adversarial-title",
        description: "Outrage title remains high-friction.",
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
  });

  assert.equal(report.failed, 0);
  assert.equal(report.severity, "none");
});

test("scenario runner reports semantic drift from replay traces", () => {
  const trace = semantic.scoreContent({
    candidate: {
      title: "Cute Baby Bunny Compilation",
      channel: "Wholesome Pets",
      duration: "12:00"
    },
    anchor: semantic.analyzeAnchor("Cute Baby Bunny Compilation"),
    lens: semantic.buildExplorationPaths(semantic.analyzeAnchor("Cute Baby Bunny Compilation")).find((item) => item.id === "calmer"),
    scoringPath: "scenario-replay-source"
  });
  const report = semantic.runScenarioPack({
    name: "Replay drift scenario",
    scenarios: [
      {
        id: "semantic-drift-replay",
        category: "semantic-drift",
        description: "Historical trace has a mismatched label.",
        expectedLabel: "GREEN",
        expectedConfidenceRange: [0, 100],
        expectedGovernanceOutcomes: ["Calm/pet content detected"],
        expectedContradictionState: false,
        input: {
          title: "Cute Baby Bunny Compilation",
          channel: "Wholesome Pets",
          duration: "12:00"
        },
        replayTraces: [{ ...trace, label: "RED" }]
      }
    ]
  });

  assert.equal(report.failed, 1);
  assert.equal(report.results[0].driftDetected, true);
  assert.equal(report.results[0].replayResults[0].replayAgreementState, "drift");
});

test("golden regression pack validates frozen canonical scenarios", () => {
  const pack = semantic.defaultGoldenRegressionPack();
  const report = semantic.runGoldenRegressionPack(pack);

  assert.equal(pack.scenarios.length, 12);
  pack.scenarios.forEach((scenario) => {
    assert(scenario.scenarioId);
    assert(scenario.input);
    assert(scenario.expectedLabel);
    assert(Array.isArray(scenario.expectedConfidenceRange));
    assert.equal(typeof scenario.expectedContradictionState, "boolean");
    assert(Array.isArray(scenario.expectedGovernanceOutcomes));
    assert(scenario.expectedMatchedSignalCategories);
    assert.equal(scenario.pipelineVersion, report.pipelineVersion);
  });
  assert.equal(report.failed, 0);
  assert.equal(report.driftCount, 0);
  assert.deepEqual(report.failedScenarioIds, []);
  assert.equal(report.results.every((result) => result.matchedSignalAgreement), true);
  assert.equal(report.results.every((result) => result.suppressedSignalAgreement), true);
});

test("golden runner detects confidence range drift", () => {
  const report = semantic.runGoldenRegressionPack({
    name: "Golden confidence mismatch",
    scenarios: [
      {
        scenarioId: "golden-confidence-mismatch",
        category: "semantic-drift",
        description: "Confidence range intentionally excludes actual value.",
        expectedLabel: "GREEN",
        expectedConfidenceRange: [0, 10],
        expectedGovernanceOutcomes: ["Calm/pet content detected"],
        expectedContradictionState: false,
        expectedMatchedSignalCategories: { positive: ["cute"], friction: [] },
        input: { title: "Cute Baby Bunny Compilation", channel: "Wholesome Pets", duration: "12:00" }
      }
    ]
  });

  assert.equal(report.failed, 1);
  assert.equal(report.results[0].confidenceAgreement, false);
  assert.equal(report.driftCount, 1);
});

test("golden runner detects label governance and contradiction mismatches", () => {
  const report = semantic.runGoldenRegressionPack({
    name: "Golden mismatch pack",
    scenarios: [
      {
        scenarioId: "golden-label-mismatch",
        category: "semantic-drift",
        description: "Label intentionally mismatches.",
        expectedLabel: "RED",
        expectedConfidenceRange: [0, 100],
        expectedGovernanceOutcomes: ["Calm/pet content detected"],
        expectedContradictionState: false,
        expectedMatchedSignalCategories: { positive: ["cute"], friction: [] },
        input: { title: "Cute Baby Bunny Compilation", channel: "Wholesome Pets", duration: "12:00" }
      },
      {
        scenarioId: "golden-governance-mismatch",
        category: "semantic-drift",
        description: "Governance intentionally mismatches.",
        expectedLabel: "GREEN",
        expectedConfidenceRange: [0, 100],
        expectedGovernanceOutcomes: ["not-present-governance-marker"],
        expectedContradictionState: false,
        expectedMatchedSignalCategories: { positive: ["cute"], friction: [] },
        input: { title: "Cute Baby Bunny Compilation", channel: "Wholesome Pets", duration: "12:00" }
      },
      {
        scenarioId: "golden-contradiction-mismatch",
        category: "contradictory",
        description: "Contradiction expectation intentionally mismatches.",
        expectedLabel: "GREEN",
        expectedConfidenceRange: [0, 100],
        expectedGovernanceOutcomes: ["Calm/pet content detected"],
        expectedContradictionState: true,
        expectedMatchedSignalCategories: { positive: ["cute"], friction: [] },
        input: { title: "Cute Baby Bunny Compilation", channel: "Wholesome Pets", duration: "12:00" }
      }
    ]
  });

  assert.equal(report.failed, 3);
  assert(report.failedScenarioIds.includes("golden-label-mismatch"));
  assert(report.governanceMismatches.includes("golden-governance-mismatch"));
  assert(report.contradictionMismatches.includes("golden-contradiction-mismatch"));
});

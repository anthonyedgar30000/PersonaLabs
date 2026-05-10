#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const contentScriptPath = path.join(__dirname, "content.js");
const source = fs.readFileSync(contentScriptPath, "utf8");
const sandbox = {
  console,
  globalThis: {
    __PERSONA_LABS_DISABLE_AUTO_INIT__: true,
    __PERSONA_LABS_ENABLE_TEST_API__: true
  }
};

sandbox.globalThis.globalThis = sandbox.globalThis;
vm.runInNewContext(source, sandbox.globalThis, { filename: contentScriptPath });

const api = sandbox.globalThis.__PersonaLabsScoring;
if (!api) {
  throw new Error("PersonaLabs scoring test API was not exposed.");
}

function makeContext(title, options = {}) {
  const durationSeconds = options.durationSeconds === undefined ? 1800 : options.durationSeconds;
  const thumbnailText = options.thumbnailText || "";
  const metadataText = options.metadataText || "";
  const transcriptText = options.transcriptText || "";
  const titleText = title;
  const searchText = api.normalizeText([titleText, thumbnailText, metadataText]);

  return {
    channelMetadataText: "",
    durationSeconds,
    durationText: "",
    href: "",
    isShort: Boolean(options.isShort) || durationSeconds <= 60,
    key: title,
    metadataText,
    searchText,
    thumbnailText,
    title,
    titleText,
    transcriptText
  };
}

const cases = [
  {
    name: "bunny nature sleep ambience aligns with Chill",
    context: makeContext("Bunny nature sleep ambience with gentle rain and birds", { durationSeconds: 3600 }),
    mode: "chill",
    assert(result) {
      return result.score >= 70 && result.classification === "aligned" && result.dimensions.calmAmbient >= 65;
    }
  },
  {
    name: "aquarium relaxing soft music aligns with Chill",
    context: makeContext("Aquarium video for cats relaxing soft music", { durationSeconds: 2400 }),
    mode: "chill",
    assert(result) {
      return result.score >= 70 && result.classification === "aligned" && result.dimensions.subjectMatterImpact === 0;
    }
  },
  {
    name: "relaxing piano sleep ambience aligns with Chill",
    context: makeContext("Relaxing piano sleep music peaceful forest rain ambience", { durationSeconds: 7200 }),
    mode: "chill",
    assert(result) {
      return result.score >= 70 && result.dimensions.calmAmbient >= 65;
    }
  },
  {
    name: "calm educational content aligns with Chill",
    context: makeContext("Calm beginner lecture on watercolor basics", { durationSeconds: 1800 }),
    mode: "chill",
    assert(result) {
      return result.score >= 70 && result.classification === "aligned" && result.dimensions.tribalDomination === 0;
    }
  },
  {
    name: "restrained violent subject matter is not treated as calm",
    context: makeContext("Military strike hits convoy in Lebanon", { durationSeconds: 300 }),
    mode: "chill",
    assert(result) {
      return (
        result.score <= 49 &&
        result.dimensions.emotionalTone < 20 &&
        result.dimensions.subjectMatterImpact >= 25 &&
        result.negativeSignals.some((signal) => signal.includes("low rage framing detected"))
      );
    }
  },
  {
    name: "war footage and casualties score low in Chill",
    context: makeContext("War footage shows bombing aftermath with dead and injured", { durationSeconds: 600 }),
    mode: "chill",
    assert(result) {
      return result.score <= 34 && result.dimensions.subjectMatterImpact >= 75;
    }
  },
  {
    name: "ragebait commentary scores low in Chill",
    context: makeContext("Furious outrage commentary destroyed in shocking meltdown lies", { durationSeconds: 1200 }),
    mode: "chill",
    assert(result) {
      return result.score <= 34 && result.dimensions.emotionalTone >= 75;
    }
  },
  {
    name: "revenge framing reduces Chill alignment without viewpoint penalty",
    context: makeContext("Trump REVENGE", { durationSeconds: 1800 }),
    mode: "chill",
    assert(result) {
      return (
        result.score <= 49 &&
        result.dimensions.tribalDomination >= 20 &&
        result.metrics.signalLayers.tribalDomination.sourceMatches.title.includes("revenge")
      );
    }
  },
  {
    name: "humiliation framing reduces Chill alignment",
    context: makeContext("HUMILIATES HIMSELF after debate", { durationSeconds: 1800 }),
    mode: "chill",
    assert(result) {
      return result.score <= 49 && result.dimensions.tribalDomination >= 20;
    }
  },
  {
    name: "collapse and disaster framing reduces Chill alignment",
    context: makeContext("DISASTROUS job market collapse", { durationSeconds: 1800 }),
    mode: "chill",
    assert(result) {
      return result.score <= 49 && result.dimensions.tribalDomination >= 35;
    }
  },
  {
    name: "outrage thumbnail domination framing scores low in Chill",
    context: makeContext("Policy discussion", { durationSeconds: 1800, thumbnailText: "OWNED MELTDOWN DESTROYS" }),
    mode: "chill",
    assert(result) {
      return (
        result.score <= 34 &&
        result.dimensions.tribalDomination >= 75 &&
        result.metrics.signalLayers.tribalDomination.sourceMatches.thumbnail.includes("owned")
      );
    }
  },
  {
    name: "transcript domination framing is source-attributed",
    context: makeContext("Calm interview segment", {
      durationSeconds: 1800,
      transcriptText: "the final note backfires badly in a revenge takedown"
    }),
    mode: "chill",
    assert(result) {
      return (
        result.score <= 34 &&
        result.metrics.signalLayers.tribalDomination.sourceMatches.transcript.includes("final note") &&
        result.metrics.signalLayers.tribalDomination.sourceMatches.transcript.includes("revenge")
      );
    }
  },
  {
    name: "technical analytical long-form stays mixed or neutral in Chill",
    context: makeContext("Technical discussion and analysis of Kubernetes networking debate", { durationSeconds: 2400 }),
    mode: "chill",
    assert(result) {
      return result.score >= 40 && result.score <= 69 && ["mixed", "neutral"].includes(result.classification);
    }
  },
  {
    name: "analytical conflict coverage can retain Research value",
    context: makeContext("Military strike analysis with sources and expert interview", { durationSeconds: 1800 }),
    mode: "research",
    assert(result) {
      return result.score >= 60 && ["aligned", "mixed"].includes(result.classification);
    }
  }
];

const failures = [];
cases.forEach((testCase) => {
  const result = api.scoreCard(testCase.context, testCase.mode);
  const passed = testCase.assert(result);
  const summary = `${testCase.name}: ${testCase.mode} score=${result.score} classification=${result.classification} tone=${result.dimensions.emotionalTone} subject=${result.dimensions.subjectMatterImpact} tribal=${result.dimensions.tribalDomination} load=${result.dimensions.cognitiveLoad} drift=${result.dimensions.driftRisk} calm=${result.dimensions.calmAmbient}`;
  console.log(`${passed ? "PASS" : "FAIL"} ${summary}`);
  if (!passed) {
    failures.push(summary);
  }
});

if (failures.length) {
  console.error("\nScoring validation failures:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

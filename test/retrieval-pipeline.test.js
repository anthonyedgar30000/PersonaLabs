const assert = require("node:assert/strict");
const test = require("node:test");

const semantic = require("../src/semantic-core");
const retrieval = require("../src/retrieval-pipeline");

test("generates subject-preserving transformed queries through the transformation layer", () => {
  const anchor = semantic.analyzeAnchor("BREAKING: Senator Lane DESTROYS budget vote");
  const queryGenerator = retrieval.createQueryGenerator({ semantic });
  const transformed = queryGenerator.generate(anchor, "educational");

  assert.equal(queryGenerator.layer, "Transformation Layer");
  assert.equal(transformed.lens.id, "educational");
  assert(transformed.query.includes("Senator Lane budget vote"));
  assert(transformed.query.includes("explained educational analysis"));
});

test("normalizes structured YouTube metadata without relying on DOM nodes", () => {
  const normalized = retrieval.normalizeVideoMetadata(
    {
      id: { videoId: "abc123" },
      snippet: {
        title: "Senator Lane budget vote explained",
        channelTitle: "Policy Classroom",
        description: "Context and analysis",
        publishedAt: "2026-05-15T00:00:00Z"
      }
    },
    "youtube-data-api"
  );

  assert.equal(normalized.videoId, "abc123");
  assert.equal(normalized.title, "Senator Lane budget vote explained");
  assert.equal(normalized.channel, "Policy Classroom");
  assert.equal(normalized.url, "https://www.youtube.com/watch?v=abc123");
  assert.equal(normalized.source, "youtube-data-api");
});

test("runs retrieval to deterministic scoring to lens-aware reranking", async () => {
  const anchor = semantic.analyzeAnchor("Senator Lane budget vote");
  const pipeline = retrieval.createExplorationPipeline({
    semantic,
    retrievalProvider: retrieval.createMockRetrievalProvider([
      {
        title: "Senator Lane budget vote explained: calm context and analysis",
        channel: "Policy Classroom",
        duration: "18:24"
      },
      {
        title: "Senator Lane budget vote debate explained after backlash",
        channel: "Civic Roundtable",
        duration: "24:00"
      },
      {
        title: "SENATOR OBLITERATES opponents in insane budget vote meltdown",
        channel: "Outrage Daily",
        duration: "4:10"
      }
    ])
  });

  const calmer = await pipeline.run({ anchor, lensId: "calmer", limit: 5 });
  const educational = await pipeline.run({ anchor, lensId: "educational", limit: 5 });

  assert.deepEqual(calmer.pipeline, retrieval.PIPELINE_STAGES);
  assert.equal(calmer.retrieval.source, "mock-structured-metadata");
  assert.equal(calmer.scored.length, 3);
  assert.deepEqual(calmer.suggestions.map((item) => item.scoring.label), ["GREEN"]);
  assert.deepEqual(
    educational.suggestions.map((item) => item.scoring.label),
    ["GREEN", "YELLOW"]
  );
});

test("exposes YouTube Data API retrieval interface without requiring cloud configuration", async () => {
  const anchor = semantic.analyzeAnchor("Gaza ceasefire talks");
  const provider = retrieval.createYouTubeDataApiRetrievalProvider();
  const pipeline = retrieval.createExplorationPipeline({ semantic, retrievalProvider: provider });
  const result = await pipeline.run({ anchor, lensId: "deeper" });

  assert.equal(result.retrieval.source, "youtube-data-api");
  assert.equal(result.retrieval.mode, "not-configured");
  assert.equal(result.retrieval.items.length, 0);
  assert(result.retrieval.diagnostics.searchUrl.includes("youtube/v3/search"));
  assert(result.retrieval.diagnostics.searchUrl.includes("Gaza+ceasefire+talks"));
});

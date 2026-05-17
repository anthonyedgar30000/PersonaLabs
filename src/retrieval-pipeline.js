(function attachPersonaLabsRetrieval(root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.PersonaLabsRetrieval = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function createPersonaLabsRetrieval() {
  "use strict";

  const PIPELINE_STAGES = [
    "contextual anchor",
    "transformation query generation",
    "structured metadata retrieval",
    "deterministic observability scoring",
    "lens-constrained presentation",
    "intentional exploration presentation"
  ];

  const DEFAULT_LIMIT = 6;

  function normalizeWhitespace(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function absoluteYouTubeUrl(videoId) {
    return videoId ? `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}` : "";
  }

  function normalizeVideoMetadata(raw, source) {
    const metadata = raw || {};
    const videoId =
      metadata.videoId ||
      (metadata.id && typeof metadata.id === "object" ? metadata.id.videoId : metadata.id) ||
      "";
    const snippet = metadata.snippet || {};
    const contentDetails = metadata.contentDetails || {};

    return {
      videoId,
      title: normalizeWhitespace(metadata.title || snippet.title),
      channel: normalizeWhitespace(metadata.channel || metadata.channelTitle || snippet.channelTitle),
      description: normalizeWhitespace(metadata.description || snippet.description),
      duration: normalizeWhitespace(metadata.duration || contentDetails.duration),
      url: metadata.url || absoluteYouTubeUrl(videoId),
      publishedAt: metadata.publishedAt || snippet.publishedAt || "",
      source: metadata.source || source || "structured-metadata"
    };
  }

  function normalizeRetrievedItems(items, source) {
    return (items || [])
      .map((item) => normalizeVideoMetadata(item, source))
      .filter((item) => item.title);
  }

  function requireSemantic(semantic) {
    if (!semantic) {
      throw new Error("PersonaLabs retrieval pipeline requires the semantic core.");
    }

    return semantic;
  }

  function resolveLens(semantic, anchor, lensId) {
    const paths = semantic.buildExplorationPaths(anchor);
    return paths.find((path) => path.id === lensId) || paths[0] || null;
  }

  function createQueryGenerator(options) {
    const semantic = requireSemantic(options && options.semantic);

    return {
      layer: "Transformation Layer",
      generate(anchor, lensId) {
        const lens = resolveLens(semantic, anchor, lensId);
        return {
          lens,
          query: lens ? lens.query : "",
          url: lens ? lens.url : "",
          explanation: lens ? lens.explanation : "",
          continuity: lens ? lens.continuity : null
        };
      }
    };
  }

  function createVisiblePageRetrievalProvider(options) {
    const getVisibleMetadata = options && options.getVisibleMetadata;
    const logger = (options && options.logger) || function noop() {};

    return {
      layer: "Retrieval Layer",
      source: "visible-page-structured-metadata",
      async retrieve(request) {
        const items = typeof getVisibleMetadata === "function" ? getVisibleMetadata(request) : [];
        const normalizedItems = normalizeRetrievedItems(items, "visible-page-structured-metadata");
        logger("visible-page retrieval provider returned metadata", {
          query: request.query,
          count: normalizedItems.length
        });

        return {
          source: "visible-page-structured-metadata",
          mode: "temporary-dom-adapter",
          query: request.query,
          items: normalizedItems,
          diagnostics: {
            note: "Temporary browser-surface adapter. Retrieval pipeline is structured so this can be replaced by YouTube Data API retrieval."
          }
        };
      }
    };
  }

  function createMockRetrievalProvider(items) {
    const normalizedItems = normalizeRetrievedItems(items, "mock-structured-metadata");

    return {
      layer: "Retrieval Layer",
      source: "mock-structured-metadata",
      async retrieve(request) {
        return {
          source: "mock-structured-metadata",
          mode: "mock",
          query: request.query,
          items: normalizedItems,
          diagnostics: {
            note: "Deterministic test/mock retrieval provider."
          }
        };
      }
    };
  }

  function buildYouTubeDataApiSearchUrl(request, options) {
    const params = new URLSearchParams({
      part: "snippet",
      type: "video",
      q: request.query || "",
      maxResults: String((options && options.maxResults) || DEFAULT_LIMIT),
      safeSearch: "none"
    });

    if (options && options.apiKey) {
      params.set("key", options.apiKey);
    }

    return `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;
  }

  function createYouTubeDataApiRetrievalProvider(options) {
    const providerOptions = options || {};
    const fetchImpl = providerOptions.fetchImpl;

    return {
      layer: "Retrieval Layer",
      source: "youtube-data-api",
      buildSearchUrl(request) {
        return buildYouTubeDataApiSearchUrl(request, providerOptions);
      },
      async retrieve(request) {
        if (!providerOptions.apiKey || typeof fetchImpl !== "function") {
          return {
            source: "youtube-data-api",
            mode: "not-configured",
            query: request.query,
            items: [],
            diagnostics: {
              searchUrl: buildYouTubeDataApiSearchUrl(request, providerOptions),
              note: "YouTube Data API provider interface is present but not configured with an API key/fetch implementation."
            }
          };
        }

        const response = await fetchImpl(buildYouTubeDataApiSearchUrl(request, providerOptions));
        const payload = await response.json();

        return {
          source: "youtube-data-api",
          mode: "api",
          query: request.query,
          items: normalizeRetrievedItems(payload.items || [], "youtube-data-api"),
          diagnostics: {
            resultCount: payload.items ? payload.items.length : 0
          }
        };
      }
    };
  }

  function createObservabilityScorer(options) {
    const semantic = requireSemantic(options && options.semantic);

    return {
      layer: "Observability Layer",
      score(anchor, lens, metadataItems) {
        return semantic.scoreCandidates(metadataItems, anchor, lens);
      }
    };
  }

  function createLensRanker(options) {
    const semantic = requireSemantic(options && options.semantic);

    return {
      layer: "Ranking Layer",
      rerank(scoredItems, lens, limit) {
        return semantic.filterCandidatesByLens(scoredItems, lens, limit || DEFAULT_LIMIT);
      }
    };
  }

  function createExplorationPipeline(options) {
    const semantic = requireSemantic(options && options.semantic);
    const queryGenerator = (options && options.queryGenerator) || createQueryGenerator({ semantic });
    const retrievalProvider =
      (options && options.retrievalProvider) || createMockRetrievalProvider([]);
    const observabilityScorer =
      (options && options.observabilityScorer) || createObservabilityScorer({ semantic });
    const lensRanker = (options && options.lensRanker) || createLensRanker({ semantic });
    const logger = (options && options.logger) || function noop() {};
    const defaultLimit = (options && options.limit) || DEFAULT_LIMIT;

    return {
      layers: {
        retrieval: retrievalProvider,
        observability: observabilityScorer,
        transformation: queryGenerator,
        ranking: lensRanker,
        presentation: "browser-extension-ui"
      },
      async run(request) {
        const anchor = request.anchor;
        const limit = request.limit || defaultLimit;
        const transformed = queryGenerator.generate(anchor, request.lensId);
        const retrievalRequest = {
          anchor,
          lens: transformed.lens,
          lensId: transformed.lens && transformed.lens.id,
          query: transformed.query,
          url: transformed.url,
          limit
        };
        const retrievalResult = await retrievalProvider.retrieve(retrievalRequest);
        const scored = observabilityScorer.score(anchor, transformed.lens, retrievalResult.items);
        const suggestions = lensRanker.rerank(scored, transformed.lens, limit);

        logger("structured retrieval pipeline completed", {
          source: retrievalResult.source,
          mode: retrievalResult.mode,
          query: transformed.query,
          retrieved: retrievalResult.items.length,
          scored: scored.length,
          suggestions: suggestions.length
        });

        return {
          pipeline: PIPELINE_STAGES,
          anchor,
          lens: transformed.lens,
          transformedQuery: {
            query: transformed.query,
            url: transformed.url,
            explanation: transformed.explanation,
            continuity: transformed.continuity
          },
          retrieval: retrievalResult,
          scored,
          suggestions,
          diagnostics: {
            source: retrievalResult.source,
            mode: retrievalResult.mode,
            retrieval: retrievalResult.diagnostics || {}
          }
        };
      }
    };
  }

  return {
    PIPELINE_STAGES,
    buildYouTubeDataApiSearchUrl,
    createExplorationPipeline,
    createLensRanker,
    createMockRetrievalProvider,
    createObservabilityScorer,
    createQueryGenerator,
    createVisiblePageRetrievalProvider,
    createYouTubeDataApiRetrievalProvider,
    normalizeRetrievedItems,
    normalizeVideoMetadata
  };
});

import { classifySemanticContent } from "./semantic-core.js";

export const DEFAULT_CLASSIFIER_VERSION = "semantic-core";

export function analyzeAndPersistVideo({
  database,
  video,
  lens = "CALMER",
  classifier = classifySemanticContent,
  classifierVersion = DEFAULT_CLASSIFIER_VERSION,
  heuristicConfigHash,
}) {
  const savedVideo = database.saveVideo({
    ...video,
    platform: video.platform ?? "youtube",
  });
  const classification = classifier({
    title: savedVideo.title,
    channel: savedVideo.channel_name,
    description: video.description,
    lens,
  });
  const event = database.createClassificationEvent({
    videoId: savedVideo.id,
    lens,
    domain: classification.domain,
    finalColor: classification.label,
    finalScore: classification.finalScore,
    explanation: classification.explanation,
    classifierVersion,
    heuristicConfigHash,
    rawResult: classification,
  });

  for (const signal of toDetectedSignals(classification)) {
    database.createDetectedSignal({
      classificationEventId: event.id,
      ...signal,
    });
  }

  return {
    video: savedVideo,
    classification,
    event,
    signals: database.listDetectedSignals(event.id),
  };
}

function toDetectedSignals(classification) {
  const signals = [
    {
      signalType: "domain",
      signalValue: classification.domain,
      severity: "context",
      weight: classification.baselineSafe ? -1 : 0,
      suppressed: false,
      reason: "Detected classification domain.",
    },
  ];

  for (const signalValue of classification.suppressedSignals ?? []) {
    signals.push({
      signalType: "suppressed_low_severity",
      signalValue,
      severity: "low",
      weight: 0,
      suppressed: true,
      reason: "Suppressed by safe baseline/contextual classification.",
    });
  }

  for (const signalValue of classification.escalationSignals?.yellow ?? []) {
    signals.push({
      signalType: "yellow_escalation",
      signalValue,
      severity: "medium",
      weight: 1,
      suppressed: false,
      reason: "Meaningful YELLOW escalation signal.",
    });
  }

  for (const signalValue of classification.escalationSignals?.red ?? []) {
    signals.push({
      signalType: "red_escalation",
      signalValue,
      severity: "high",
      weight: 2,
      suppressed: false,
      reason: "RED distress/escalation signal.",
    });
  }

  return signals;
}

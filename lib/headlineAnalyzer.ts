export type HeadlineMode = "chill" | "study" | "research" | string;
export type HeadlineLabel = "GREEN" | "YELLOW" | "RED";

export interface WeightedTermMatch {
  term: string;
  weight: number;
}

export interface HeadlineAnalysis {
  mode: HeadlineMode;
  label: HeadlineLabel;
  color: "green" | "yellow" | "red";
  normalizedTitle: string;
  tokens: string[];
  scores: {
    green_score: number;
    yellow_score: number;
    red_score: number;
  };
  matchedTerms: {
    green: WeightedTermMatch[];
    yellow: WeightedTermMatch[];
    red: WeightedTermMatch[];
  };
  sourceAdjustment: {
    adjustment: number;
    publicMediaMatches: WeightedTermMatch[];
    riskMatches: WeightedTermMatch[];
  };
  confidence: "high" | "medium" | "uncertain";
  governance: {
    thresholds: Record<string, number>;
    rawSignals: {
      green: WeightedTermMatch[];
      yellow: WeightedTermMatch[];
      red: WeightedTermMatch[];
      source: HeadlineAnalysis["sourceAdjustment"];
    };
    taxonomyMatches: {
      safeAnimalDomain: WeightedTermMatch[];
      harmlessAnimalContext: WeightedTermMatch[];
    };
    weightedBoosts: Array<WeightedTermMatch & { taxonomy?: string }>;
    weightedPenalties: WeightedTermMatch[];
    suppressedWeakTerms: string[];
    unresolvedYellowScore: number;
    safeDomain: {
      isSafeAnimalDomain: boolean;
      baselineMet: boolean;
      matches: string[];
    };
    confidence: "high" | "medium" | "uncertain";
    thresholdDecisions: Array<{
      rule: string;
      matched: boolean;
      result: string;
    }>;
    visibleOverlay: {
      label: HeadlineLabel;
      color: "green" | "yellow" | "red";
      confidence: "high" | "medium" | "uncertain";
      reason: string;
    };
  };
  visibleOverlay: HeadlineAnalysis["governance"]["visibleOverlay"];
  reasons: string[];
  explanation: string;
}

export {
  GREEN_CHILL_TERMS,
  YELLOW_CHILL_TERMS,
  RED_CHILL_TERMS,
  PUBLIC_SOURCE_TERMS,
  RISK_SOURCE_TERMS,
  SAFE_ANIMAL_DOMAIN_TERMS,
  HARMLESS_ANIMAL_CONTEXT_TERMS,
  WEAK_SAFE_DOMAIN_YELLOW_TERMS,
  CALIBRATION_THRESHOLDS,
  analyzeHeadline,
  normalizeText
} from "./headlineAnalyzer.js";

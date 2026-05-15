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
  reasons: string[];
  explanation: string;
}

export {
  GREEN_CHILL_TERMS,
  YELLOW_CHILL_TERMS,
  RED_CHILL_TERMS,
  PUBLIC_SOURCE_TERMS,
  RISK_SOURCE_TERMS,
  analyzeHeadline,
  normalizeText
} from "./headlineAnalyzer.js";

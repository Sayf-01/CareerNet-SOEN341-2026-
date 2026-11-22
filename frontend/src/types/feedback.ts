// Shape of the AI resume feedback (LA-11 contract)

export interface Improvement {
  title: string;
  suggestion: string;
}

export interface ResumeFeedback {
  summary: string;
  strengths: string[];
  improvements: Improvement[];
  missing_sections: string[];
  keywords: string[];
  // "fake" = the AI service isn't connected
  mode: "ai" | "fake";
}

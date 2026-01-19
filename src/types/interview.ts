export type RoleType =
  | "director-pharmacy-analytics"
  | "software-engineer"
  | "product-manager"
  | "data-analyst"
  | "general";

export interface RoleOption {
  id: RoleType;
  label: string;
  description: string;
}

export const ROLE_OPTIONS: RoleOption[] = [
  {
    id: "director-pharmacy-analytics",
    label: "Director of Pharmacy Analytics",
    description: "Healthcare analytics leadership role focusing on pharmacy operations and data-driven decisions",
  },
  {
    id: "software-engineer",
    label: "Software Engineer",
    description: "Technical role focusing on coding, system design, and problem-solving",
  },
  {
    id: "product-manager",
    label: "Product Manager",
    description: "Product strategy, user research, and cross-functional leadership",
  },
  {
    id: "data-analyst",
    label: "Data Analyst",
    description: "Data analysis, visualization, and business intelligence",
  },
  {
    id: "general",
    label: "General Interview",
    description: "Broad interview covering common behavioral and situational questions",
  },
];

export interface InterviewConfig {
  roleType: RoleType;
  jobDescription?: string;
}

export interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: Date;
}

export interface InterviewSession {
  id: string;
  config: InterviewConfig;
  messages: Message[];
  startedAt: Date;
  endedAt?: Date;
  status: "active" | "completed";
}

export interface InterviewFeedback {
  overallScore: number;
  strengths: string[];
  areasToImprove: string[];
  questionFeedback: QuestionFeedback[];
  summary: string;
}

export interface QuestionFeedback {
  question: string;
  userAnswer: string;
  feedback: string;
  betterAnswer?: string;
  score: number;
}

export type Difficulty = "easy" | "med";

export type GameMode = "quiz" | "count";

export type QuizQuestionType = "identify" | "before" | "after";

export interface QuizQuestion {
  type: QuizQuestionType;
  targetNumber: number;
  question: string;
  correctAnswer: number;
  options: number[];
}

export interface CountQuestion {
  objectCount: number;
  correctAnswer: number;
  options: number[];
}

export interface GameEvent {
  eventType: "game_start" | "question_answer" | "game_end";
  timestamp: number;
  skill: string;
  difficulty: Difficulty;
  data: {
    mode?: GameMode;
    questionIndex?: number;
    userAnswer?: number;
    correctAnswer?: number;
    isCorrect?: boolean;
    timeSpent?: number;
    score?: number;
    totalQuestions?: number;
  };
}

export interface GameStats {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  startTime: number;
  endTime?: number;
}

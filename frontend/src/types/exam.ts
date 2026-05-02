export type SubjectExamCategory = "all" | "illustration" | "specialized" | "self-study";
export type SubjectExamDifficulty = "Trung bình" | "Khó" | "Rất khó";

export type TopicAnalysisItem = {
  label: string;
  percent: number;
  tone: "primary" | "orange" | "emerald";
};

export type ExamQuestion = {
  id: number;
  topicLabel?: string;
  questionCode?: string;
  prompt: string;
  imageUrl?: string;
  hint: string;
  options: string[];
  correctIndex: number;
  explanationTitle: string;
  explanationSteps: string[];
  explanationConclusion: string;
  formula?: string;
};

export type EssayExamContent = {
  readingPassage: string;
  readingQuestion: string;
  essayPrompt: string;
  checklist: string[];
  statusNote: string;
};

export type PracticeExamSummary = {
  examId: string;
  subject: string;
  subjectSlug: string;
  examType: "multiple_choice" | "essay";
  title: string;
  durationMinutes: number;
  questionCount: number;
  difficulty: SubjectExamDifficulty;
  category: Exclude<SubjectExamCategory, "all">;
  imageUrl: string;
  badge?: string;
  attemptCount: number;
  attemptsLabel: string;
};

export type PracticeExamDetail = PracticeExamSummary & {
  questions: ExamQuestion[];
  essayContent?: EssayExamContent;
};

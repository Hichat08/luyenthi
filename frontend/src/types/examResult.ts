import type { ExamQuestion, TopicAnalysisItem } from "@/types/exam";

export type ExamResultState = {
  examId: string;
  examTitle: string;
  subjectSlug: string;
  subjectName: string;
  launchSource?: "practice" | "community";
  correctCount: number;
  wrongCount: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  rankingRank: number | null;
  topicAnalysis: TopicAnalysisItem[];
  selectedAnswers: Record<number, number>;
  questions: ExamQuestion[];
};

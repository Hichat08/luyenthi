import type { ExamQuestion, TopicAnalysisItem } from "@/types/exam";

export const calculateTopicAnalysis = (
  questions: ExamQuestion[],
  selectedAnswers: Record<number, number>
): TopicAnalysisItem[] => {
  const grouped = new Map<string, ExamQuestion[]>();

  questions.forEach((question) => {
    const label = question.topicLabel?.trim() || "Tổng hợp";
    const items = grouped.get(label) ?? [];
    items.push(question);
    grouped.set(label, items);
  });

  return Array.from(grouped.entries())
    .slice(0, 3)
    .map(([label, items], index) => ({
      label,
      percent: items.length
        ? Math.round(
            (items.filter((question) => selectedAnswers[question.id] === question.correctIndex)
              .length /
              items.length) *
              100
          )
        : 0,
      tone: index === 1 ? "orange" : index === 2 ? "emerald" : "primary",
    }));
};

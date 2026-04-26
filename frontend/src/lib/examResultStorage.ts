import type { ExamResultState } from "@/types/examResult";

const LAST_EXAM_RESULT_KEY = "last-exam-result";

export const saveLastExamResult = (result: ExamResultState) => {
  sessionStorage.setItem(LAST_EXAM_RESULT_KEY, JSON.stringify(result));
};

export const readLastExamResult = (examId?: string) => {
  const raw = sessionStorage.getItem(LAST_EXAM_RESULT_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as ExamResultState;

    if (examId && parsed.examId !== examId) {
      return null;
    }

    return parsed;
  } catch {
    sessionStorage.removeItem(LAST_EXAM_RESULT_KEY);
    return null;
  }
};

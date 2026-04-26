import api from "@/lib/axios";
import type { PracticeExamDetail, PracticeExamSummary } from "@/types/exam";

export const examService = {
  getExams: async (params: { subjectSlug?: string; subject?: string }) => {
    const res = await api.get("/exams", {
      params,
      withCredentials: true,
    });

    return res.data.exams as PracticeExamSummary[];
  },
  getExamDetail: async (examId: string) => {
    const res = await api.get(`/exams/${examId}`, {
      withCredentials: true,
    });

    return res.data.exam as PracticeExamDetail;
  },
};

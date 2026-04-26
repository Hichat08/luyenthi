import type { SubjectExamCategory } from "@/types/exam";
import { normalizeSubjectKey } from "./subjectMeta";

export const subjectExamFilterLabels: Record<SubjectExamCategory, string> = {
  all: "Tất cả",
  illustration: "Đề minh họa",
  specialized: "Trường chuyên",
  "self-study": "Tự luyện",
};

export const createSubjectSlug = (subject: string) =>
  normalizeSubjectKey(subject)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const isLiteratureSubject = (subject: string) => {
  const normalized = normalizeSubjectKey(subject);
  return normalized === "văn" || normalized === "ngữ văn";
};

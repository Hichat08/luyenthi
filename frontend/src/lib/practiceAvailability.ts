import { createSubjectSlug } from "@/lib/subjectPractice";

export const AVAILABLE_PRACTICE_SUBJECT_SLUGS = new Set(["tin-hoc"]);

export const isPracticeSubjectAvailable = (subject: string) =>
  AVAILABLE_PRACTICE_SUBJECT_SLUGS.has(createSubjectSlug(subject));

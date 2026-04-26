import { createSubjectSlug } from "@/lib/subjectPractice";

export const AVAILABLE_PRACTICE_SUBJECT_SLUGS = new Set<string>();

export const isPracticeSubjectAvailable = (subject: string) =>
  AVAILABLE_PRACTICE_SUBJECT_SLUGS.size > 0
    ? AVAILABLE_PRACTICE_SUBJECT_SLUGS.has(createSubjectSlug(subject))
    : Boolean(createSubjectSlug(subject));

export const normalizeSubjectKey = (value = "") =>
  `${value}`.trim().replace(/\s+/g, " ").toLowerCase();

export const createSubjectSlug = (subject = "") =>
  normalizeSubjectKey(subject)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const isLiteratureSubject = (subject = "") => {
  const normalized = normalizeSubjectKey(subject);
  return normalized === "văn" || normalized === "ngữ văn";
};

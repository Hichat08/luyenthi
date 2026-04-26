export const COMMUNITY_EXAM_MESSAGE_PREFIX = "__COMMUNITY_EXAM__";

export type CommunityExamMessagePayload = {
  subjectSlug: string;
  subjectName: string;
  questionLimit: number;
  durationMinutes: number;
  selectedTopicLabels: string[];
};

export type CommunityExamResultMessagePayload = {
  displayName: string;
  examTitle: string;
  correctCount: number;
  totalQuestions: number;
  score: string;
  durationLabel: string;
};

export const buildCommunityExamMessage = (
  payload: CommunityExamMessagePayload
) => `${COMMUNITY_EXAM_MESSAGE_PREFIX}${JSON.stringify(payload)}`;

export const parseCommunityExamMessage = (
  content?: string | null
): CommunityExamMessagePayload | null => {
  if (!content?.startsWith(COMMUNITY_EXAM_MESSAGE_PREFIX)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      content.slice(COMMUNITY_EXAM_MESSAGE_PREFIX.length)
    ) as CommunityExamMessagePayload;

    if (
      !parsed ||
      typeof parsed.subjectSlug !== "string" ||
      typeof parsed.subjectName !== "string" ||
      typeof parsed.questionLimit !== "number" ||
      typeof parsed.durationMinutes !== "number" ||
      !Array.isArray(parsed.selectedTopicLabels)
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

export const buildCommunityExamResultMessage = ({
  displayName,
  examTitle,
  correctCount,
  totalQuestions,
  score,
  timeSpentSeconds,
}: {
  displayName: string;
  examTitle: string;
  correctCount: number;
  totalQuestions: number;
  score: number;
  timeSpentSeconds: number;
}) => {
  const roundedScore = Math.round(score * 10) / 10;
  const formattedScore = Number.isInteger(roundedScore)
    ? roundedScore.toFixed(1)
    : roundedScore.toFixed(1);
  const safeSeconds = Math.max(Math.round(timeSpentSeconds), 0);
  const minutes = `${Math.floor(safeSeconds / 60)}`.padStart(2, "0");
  const seconds = `${safeSeconds % 60}`.padStart(2, "0");

  return `🏆 ${displayName} vừa hoàn thành ${examTitle} với ${correctCount}/${totalQuestions} câu đúng, đạt ${formattedScore}/10 trong ${minutes}:${seconds}.`;
};

const COMMUNITY_EXAM_RESULT_PATTERN =
  /^🏆\s+(.+?)\s+vừa hoàn thành\s+(.+?)\s+với\s+(\d+)\/(\d+)\s+câu đúng,\s+đạt\s+(\d+(?:\.\d+)?)\/10\s+trong\s+(\d{2}:\d{2})\.$/u;

export const parseCommunityExamResultMessage = (
  content?: string | null
): CommunityExamResultMessagePayload | null => {
  if (!content) {
    return null;
  }

  const matched = content.match(COMMUNITY_EXAM_RESULT_PATTERN);

  if (!matched) {
    return null;
  }

  const [, displayName, examTitle, correctCount, totalQuestions, score, durationLabel] = matched;

  return {
    displayName,
    examTitle,
    correctCount: Number(correctCount),
    totalQuestions: Number(totalQuestions),
    score,
    durationLabel,
  };
};

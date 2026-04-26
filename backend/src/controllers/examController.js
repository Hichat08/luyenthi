import Exam from "../models/Exam.js";
import PracticeAttempt from "../models/PracticeAttempt.js";
import { defaultExamDocuments } from "../data/examCatalog.js";
import { createSubjectSlug, normalizeSubjectKey } from "../utils/subjectKey.js";

let seedPromise = null;

const ensureDefaultExams = async () => {
  if (!seedPromise) {
    seedPromise = Exam.bulkWrite(
      defaultExamDocuments.map((exam) => ({
        updateOne: {
          filter: { examId: exam.examId },
          update: { $set: exam },
          upsert: true,
        },
      })),
      { ordered: false }
    ).catch((error) => {
      seedPromise = null;
      throw error;
    });
  }

  await seedPromise;
};

const formatAttemptLabel = (attemptCount) => {
  if (attemptCount >= 1000) {
    return `+${(attemptCount / 1000).toFixed(1)}k học sinh đã thi`;
  }

  if (attemptCount > 0) {
    return `${attemptCount} lượt thi`;
  }

  return "Chưa có lượt thi";
};

const getDefaultExamsBySubjectSlug = (subjectSlug) =>
  defaultExamDocuments.filter((exam) => exam.subjectSlug === subjectSlug);

export const getExams = async (req, res) => {
  try {
    try {
      await ensureDefaultExams();
    } catch (seedError) {
      console.error("Không thể seed bộ đề mặc định, dùng fallback in-memory.", seedError);
    }

    const subjectSlug = `${req.query?.subjectSlug ?? ""}`.trim();
    const subject = `${req.query?.subject ?? ""}`.trim();
    const normalizedSubject = normalizeSubjectKey(subject);

    const query = {};

    if (subjectSlug) {
      query.subjectSlug = subjectSlug;
    } else if (normalizedSubject) {
      query.subjectSlug = createSubjectSlug(normalizedSubject);
    } else {
      return res.status(400).json({
        message: "subjectSlug hoặc subject là bắt buộc.",
      });
    }

    const persistedExams = await Exam.find(query)
      .sort({ examId: 1 })
      .select("-questions -essayContent")
      .lean();

    const exams =
      persistedExams.length > 0
        ? persistedExams
        : getDefaultExamsBySubjectSlug(query.subjectSlug).map(
            ({ questions, essayContent, ...exam }) => exam
          );

    const attemptRows = await PracticeAttempt.aggregate([
      {
        $match: {
          examId: { $in: exams.map((exam) => exam.examId) },
        },
      },
      {
        $group: {
          _id: "$examId",
          attemptCount: { $sum: 1 },
        },
      },
    ]);

    const attemptCountByExamId = new Map(
      attemptRows.map((row) => [row._id, row.attemptCount])
    );

    return res.status(200).json({
      exams: exams.map((exam) => {
        const attemptCount = attemptCountByExamId.get(exam.examId) ?? 0;
        return {
          ...exam,
          attemptCount,
          attemptsLabel: formatAttemptLabel(attemptCount),
        };
      }),
    });
  } catch (error) {
    console.error("Lỗi khi getExams", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getExamDetail = async (req, res) => {
  try {
    try {
      await ensureDefaultExams();
    } catch (seedError) {
      console.error("Không thể seed bộ đề mặc định, dùng fallback in-memory.", seedError);
    }

    const examId = `${req.params?.examId ?? ""}`.trim();

    if (!examId) {
      return res.status(400).json({ message: "examId là bắt buộc." });
    }

    const exam =
      (await Exam.findOne({ examId }).lean()) ??
      defaultExamDocuments.find((item) => item.examId === examId) ??
      null;

    if (!exam) {
      return res.status(404).json({ message: "Không tìm thấy đề thi." });
    }

    return res.status(200).json({ exam });
  } catch (error) {
    console.error("Lỗi khi getExamDetail", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

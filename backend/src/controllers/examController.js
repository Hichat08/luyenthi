import Exam from "../models/Exam.js";
import PracticeAttempt from "../models/PracticeAttempt.js";
import Subject from "../models/Subject.js";
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

const normalizeText = (value = "") => `${value}`.trim().replace(/\s+/g, " ");

const normalizeStringList = (items) =>
  Array.isArray(items)
    ? items.map((item) => normalizeText(item)).filter(Boolean)
    : [];

const toSlugFragment = (value = "") =>
  normalizeText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

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

export const createAdminExam = async (req, res) => {
  try {
    const subject = normalizeText(req.body?.subject);
    const examType = `${req.body?.examType ?? ""}`.trim();
    const title = normalizeText(req.body?.title);
    const difficulty = `${req.body?.difficulty ?? ""}`.trim();
    const category = `${req.body?.category ?? ""}`.trim();
    const durationMinutes = Number(req.body?.durationMinutes ?? 0);
    const badge = normalizeText(req.body?.badge);
    const imageUrl = normalizeText(req.body?.imageUrl);

    if (!subject || !title) {
      return res.status(400).json({ message: "Môn học và tiêu đề đề thi là bắt buộc." });
    }

    if (!["multiple_choice", "essay"].includes(examType)) {
      return res.status(400).json({ message: "Loại đề thi không hợp lệ." });
    }

    if (!["Trung bình", "Khó", "Rất khó"].includes(difficulty)) {
      return res.status(400).json({ message: "Mức độ khó không hợp lệ." });
    }

    if (!["illustration", "specialized", "self-study"].includes(category)) {
      return res.status(400).json({ message: "Nhóm đề thi không hợp lệ." });
    }

    if (!Number.isFinite(durationMinutes) || durationMinutes < 1) {
      return res.status(400).json({ message: "Thời lượng làm bài phải lớn hơn 0." });
    }

    const subjectSlug = createSubjectSlug(subject);

    if (!subjectSlug) {
      return res.status(400).json({ message: "Không thể tạo mã môn học hợp lệ." });
    }

    let questionCount = 0;
    let questions = [];
    let essayContent = {};

    if (examType === "multiple_choice") {
      const rawQuestions = Array.isArray(req.body?.questions) ? req.body.questions : [];

      if (rawQuestions.length === 0) {
        return res.status(400).json({ message: "Đề trắc nghiệm phải có ít nhất 1 câu hỏi." });
      }

      questions = rawQuestions.map((question, index) => {
        const prompt = normalizeText(question?.prompt);
        const options = normalizeStringList(question?.options);
        const correctIndex = Number(question?.correctIndex ?? 0);

        if (!prompt) {
          throw new Error(`Câu ${index + 1} chưa có nội dung.`);
        }

        if (options.length < 2) {
          throw new Error(`Câu ${index + 1} phải có ít nhất 2 đáp án.`);
        }

        if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
          throw new Error(`Câu ${index + 1} có đáp án đúng không hợp lệ.`);
        }

        return {
          id: index + 1,
          topicLabel: normalizeText(question?.topicLabel),
          prompt,
          imageUrl: normalizeText(question?.imageUrl),
          hint: normalizeText(question?.hint),
          options,
          correctIndex,
          explanationTitle: normalizeText(question?.explanationTitle),
          explanationSteps: normalizeStringList(question?.explanationSteps),
          explanationConclusion: normalizeText(question?.explanationConclusion),
          formula: normalizeText(question?.formula),
        };
      });

      questionCount = questions.length;
    } else {
      const rawEssayContent = req.body?.essayContent ?? {};
      essayContent = {
        readingPassage: normalizeText(rawEssayContent.readingPassage),
        readingQuestion: normalizeText(rawEssayContent.readingQuestion),
        essayPrompt: normalizeText(rawEssayContent.essayPrompt),
        checklist: normalizeStringList(rawEssayContent.checklist),
        statusNote: normalizeText(rawEssayContent.statusNote),
      };

      if (!essayContent.readingPassage || !essayContent.readingQuestion || !essayContent.essayPrompt) {
        return res.status(400).json({
          message: "Đề tự luận cần đủ đoạn đọc hiểu, câu hỏi đọc hiểu và câu nghị luận.",
        });
      }

      questionCount = 2;
    }

    const titleSlug = toSlugFragment(title) || "de-moi";
    const examId = `${subjectSlug}-${examType === "essay" ? "essay" : "exam"}-${titleSlug}-${Date.now().toString(36)}`;

    const exam = await Exam.create({
      examId,
      subject,
      subjectSlug,
      examType,
      title,
      durationMinutes,
      questionCount,
      difficulty,
      category,
      imageUrl,
      badge,
      questions,
      essayContent,
    });

    const normalizedSubjectName = normalizeSubjectKey(subject);

    await Subject.updateOne(
      { normalizedName: normalizedSubjectName },
      {
        $setOnInsert: {
          name: subject,
          normalizedName: normalizedSubjectName,
          createdBy: req.user?._id ?? null,
        },
      },
      { upsert: true }
    );

    return res.status(201).json({
      message: "Đã tạo đề thi mới.",
      exam: {
        examId: exam.examId,
        subject: exam.subject,
        subjectSlug: exam.subjectSlug,
        examType: exam.examType,
        title: exam.title,
        durationMinutes: exam.durationMinutes,
        questionCount: exam.questionCount,
        difficulty: exam.difficulty,
        category: exam.category,
        imageUrl: exam.imageUrl,
        badge: exam.badge,
      },
    });
  } catch (error) {
    console.error("Lỗi khi admin tạo đề thi", error);
    return res.status(400).json({
      message: error instanceof Error && error.message ? error.message : "Không thể tạo đề thi.",
    });
  }
};

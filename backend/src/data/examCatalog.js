import { createSubjectSlug, isLiteratureSubject } from "../utils/subjectKey.js";
import { informaticsQuestionBank } from "./informaticsQuestionBank.js";

const defaultImageSet = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAi4BDGATTN6U0eYNw3yhrrEzIYj5grZWwwkJ1ljU6Yrwz_oxEu-fK-9hlm27DnF9djjWemMWeSyZfLCqXvyNJ_1RxRPGM-j4BmEd3R4ix4w1LKi4zOJp-tOKaaun9-Wz_NzHsDoREomw6PMwMJ3FZRlDRsDjzz5ltaPWoZXb7nCtTg6xXkzDil9UMXmoPx1ure0AGEeIaCf2UA0zSNp64MmtgQ8VLfPhNtspQClnGoXxN08Wk0CGuHJ61m_wiF_b2OuosyfL9cSIQ",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD7kiQO87b-vu_Zn4rvVJE-bgS0NdzH8HvqTr3JHeMzZN-zDVHqBOpnx8kNN3EMIXXH99N2F9bNz43ZIe-wIRUX-NRl0OeCVCD2BVzyIqRfitBkFXSNZndEua5_NQCogX2nQEOfVcHSEoM5ddSKwWF-rkksW84ZGQrbmZ1o2pde-aWK5ARdFVb_osn7dNQFWl-oTWMqZbVqgMalRyJGX6AnoQYZ9zurpyFJFzku44U80rb4O928K2zxRIAylSvhfwWwIhVm4GrbewQ",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC6LtpZTDE_Hm4yic9eaLWDMbqmKuudWJrgNpHkFeLJ5-4zxCEgpcbVLdkV3io-G1XIV0Xi3-owbp0VxGYHuY79bDdZRnn8h7KodL-J1aeO5oJVKu4dZzkzc7NuMyJqN1DOqh-CHCB-AB19vCcAZUNha8SydmBIe3lF7PAD0GTeIfxxwc5E7NPxpKS5PvPT1o0GkKKrtDICBhNKgCpE4H0L2pGbVupi9T58tsOmET5OBG8Rco7RaHeDw8TzNKQ_G57jRIaP7h5Ckks",
];

const normalizeImportedText = (value) =>
  `${value ?? ""}`
    .normalize("NFC")
    .replace(/\u00A0/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([A-Za-zÀ-ỹ0-9)])-([A-Za-zÀ-ỹ(])/g, "$1 - $2")
    .replace(/\s+/g, " ")
    .trim();

const subjectConfigs = {
  "tin học": {
    titles: [
      "Thi thử Tin học - Thuật toán và dữ liệu",
      "Thi thử cuối kì 2 - Tin học",
      "Đề minh họa tốt nghiệp - Môn Tin học",
      "Đề chuyên Tin - Cấu trúc dữ liệu nâng cao",
    ],
    topics: ["Lập trình", "Thuật toán", "Dữ liệu"],
    promptStem: "Tin học",
  },
  toán: {
    titles: [
      "Đề thi thử Toán THPTQG - Tư duy hàm số",
      "Đề minh họa Bộ GD&ĐT - Môn Toán",
      "Đề chuyên Toán - Xác suất và hình học",
    ],
    topics: ["Hàm số", "Tích phân", "Hình học"],
    promptStem: "Toán",
  },
  anh: {
    titles: [
      "Đề thi thử Tiếng Anh - Grammar Sprint",
      "Đề minh họa Bộ GD&ĐT - Môn Anh",
      "Đề chuyên Anh - Reading & Vocabulary",
    ],
    topics: ["Ngữ pháp", "Đọc hiểu", "Từ vựng"],
    promptStem: "Tiếng Anh",
  },
  lý: {
    titles: [
      "Đề thi thử Vật lý - Dao động và sóng",
      "Đề minh họa Bộ GD&ĐT - Môn Vật lý",
      "Đề chuyên Lý - Điện xoay chiều",
    ],
    topics: ["Dao động", "Điện học", "Quang học"],
    promptStem: "Vật lý",
  },
  hóa: {
    titles: [
      "Đề thi thử Hóa học - Hữu cơ trọng tâm",
      "Đề minh họa Bộ GD&ĐT - Môn Hóa",
      "Đề chuyên Hóa - Phản ứng nâng cao",
    ],
    topics: ["Hữu cơ", "Vô cơ", "Phản ứng"],
    promptStem: "Hóa học",
  },
  sinh: {
    titles: [
      "Đề thi thử Sinh học - Di truyền cơ bản",
      "Đề minh họa Bộ GD&ĐT - Môn Sinh",
      "Đề chuyên Sinh - Tiến hóa và sinh thái",
    ],
    topics: ["Di truyền", "Tiến hóa", "Sinh thái"],
    promptStem: "Sinh học",
  },
  sử: {
    titles: [
      "Đề thi thử Lịch sử - Việt Nam hiện đại",
      "Đề minh họa Bộ GD&ĐT - Môn Lịch sử",
      "Đề chuyên Sử - Phân tích chuyên đề",
    ],
    topics: ["Việt Nam", "Thế giới", "Nhận định"],
    promptStem: "Lịch sử",
  },
  văn: {
    titles: [
      "Đề thi thử Ngữ văn - Nghị luận xã hội",
      "Đề minh họa Bộ GD&ĐT - Môn Ngữ văn",
      "Đề chuyên Văn - Phân tích tác phẩm",
    ],
    topics: ["Đọc hiểu", "Nghị luận", "Phân tích"],
    promptStem: "Ngữ văn",
  },
  "ngữ văn": {
    titles: [
      "Đề thi thử Ngữ văn - Nghị luận xã hội",
      "Đề minh họa Bộ GD&ĐT - Môn Ngữ văn",
      "Đề chuyên Văn - Phân tích tác phẩm",
    ],
    topics: ["Đọc hiểu", "Nghị luận", "Phân tích"],
    promptStem: "Ngữ văn",
  },
};

const createGeneratedQuestion = (subject, topic, index) => {
  const questionNumber = index + 1;
  const correctIndex = questionNumber % 4;
  const correctLabel = String.fromCharCode(65 + correctIndex);

  return {
    id: questionNumber,
    topicLabel: topic,
    prompt: `Câu ${questionNumber} - ${subject}: hãy chọn phương án đúng nhất cho chuyên đề ${topic.toLowerCase()}.`,
    imageUrl:
      questionNumber === 1
        ? "https://lh3.googleusercontent.com/aida-public/AB6AXuAHQAn2a2HUJvhO-eFRMbTCey238trV7YU5qPhTFOLUNpF68EjsBsKhbiSarrDVEC8F2UjpXCxmlzbRMbQIgHq9zYYQ0sWvK27JPLDhY07blKeNVTjOeiC0PcAwx222r0LCoaFqYKp9mM4sNgmVRpfbxfr69N5UPA2ssVtbXolTPxN7V7dec-BXMRbbC5QJiftOyIGdhYbWaazujlEgOj11SlahEITSBZsmfPT86XHJeY5cGovnWmBBBzPsmRLFvMaf_UH9EQiJz48"
        : "",
    hint: `Xác định đúng ý chính của chuyên đề ${topic.toLowerCase()} trước khi loại trừ đáp án nhiễu.`,
    options: [
      `Phương án A cho câu ${questionNumber}`,
      `Phương án B cho câu ${questionNumber}`,
      `Phương án C cho câu ${questionNumber}`,
      `Phương án D cho câu ${questionNumber}`,
    ],
    correctIndex,
    explanationTitle: "Giải thích chi tiết",
    explanationSteps: [
      "Bước 1: Đọc kỹ dữ kiện và xác định mảng kiến thức cần dùng.",
      "Bước 2: So sánh lần lượt các phương án với yêu cầu của câu hỏi.",
      "Bước 3: Loại trừ phương án sai và giữ lại đáp án phù hợp nhất.",
    ],
    explanationConclusion: `Vậy đáp án đúng là ${correctLabel}.`,
    formula:
      subject === "Toán" && questionNumber % 5 === 0
        ? `Công thức trọng tâm câu ${questionNumber}`
        : "",
  };
};

const buildMultipleChoiceQuestions = (subject, topics) =>
  Array.from({ length: 20 }, (_, index) =>
    createGeneratedQuestion(subject, topics[index % topics.length], index),
  );

const buildInformaticsQuestionBank = () =>
  informaticsQuestionBank.map((question, index) => ({
    id: index + 1,
    topicLabel:
      normalizeImportedText(question.title) || `Bài ${question.lesson}`,
    prompt: normalizeImportedText(question.q),
    imageUrl: "",
    hint: `Tập trung vào từ khóa của chuyên đề ${(
      normalizeImportedText(question.title) || `bài ${question.lesson}`
    ).toLowerCase()} để loại trừ đáp án nhiễu.`,
    options: [question.A, question.B, question.C, question.D].map(
      normalizeImportedText,
    ),
    correctIndex: 0,
    explanationTitle: "Đáp án và phân tích",
    explanationSteps: [
      "Xác định đúng khái niệm hoặc quy tắc mà câu hỏi đang kiểm tra.",
      "Đối chiếu lần lượt từng phương án với kiến thức trọng tâm của chuyên đề.",
      "Loại trừ các phương án nhiễu trước khi chốt đáp án đúng.",
    ],
    explanationConclusion: `Đáp án đúng là nội dung: ${normalizeImportedText(question.A)}.`,
    formula: "",
  }));

const buildEssayContent = (subject) => ({
  readingPassage:
    "Mỗi chặng đường học tập đều đòi hỏi sự bền bỉ, tinh thần tự học và khả năng lắng nghe chính mình. Khi biết tự đặt câu hỏi và tự tìm câu trả lời, người học sẽ tiến bộ vững vàng hơn.",
  readingQuestion: `Theo đoạn trích, vì sao tinh thần tự học giúp người học tiến bộ bền vững trong môn ${subject}?`,
  essayPrompt: `Viết một bài văn nghị luận khoảng 600 chữ trình bày suy nghĩ của bạn về vai trò của sự chủ động trong học tập đối với học sinh cuối cấp khi ôn môn ${subject}.`,
  checklist: [
    "Mở bài nêu đúng vấn đề nghị luận.",
    "Thân bài có luận điểm và dẫn chứng rõ.",
    "Kết bài chốt được thông điệp cá nhân.",
  ],
  statusNote: "Bài làm được lưu trong phiên hiện tại trước khi nộp bài.",
});

const buildExamDocumentsForSubject = (subjectName) => {
  const config = subjectConfigs[subjectName] ?? {
    titles: [
      `Đề thi thử ${subjectName} - Bộ đề trọng tâm`,
      `Đề minh họa cập nhật - Môn ${subjectName}`,
      `Đề nâng cao - Môn ${subjectName}`,
    ],
    topics: ["Nền tảng", "Vận dụng", "Tổng hợp"],
    promptStem: subjectName,
  };

  const subjectSlug = createSubjectSlug(subjectName);
  const examType = isLiteratureSubject(subjectName)
    ? "essay"
    : "multiple_choice";
  const isInformaticsSubject = createSubjectSlug(subjectName) === "tin-hoc";
  const questions =
    examType === "multiple_choice"
      ? isInformaticsSubject
        ? buildInformaticsQuestionBank()
        : buildMultipleChoiceQuestions(config.promptStem, config.topics)
      : [];

  return config.titles.map((title, index) => {
    const isFinalTerm2Exam =
      title.toLowerCase().includes("thi thử cuối kì 2") ||
      title.toLowerCase().includes("thi thử cuối kỳ 2");
    const durationMinutes =
      examType === "essay"
        ? 120
        : isInformaticsSubject
          ? isFinalTerm2Exam
            ? 50
            : 45
          : 90;

    return {
      examId: `${subjectSlug}-exam-${index + 1}`,
      subject: subjectName,
      subjectSlug,
      examType,
      title,
      durationMinutes,
      questionCount: examType === "essay" ? 2 : questions.length,
      difficulty:
        index === 0
          ? "Khó"
          : index === 1
            ? "Trung bình"
            : index === 2
              ? "Rất khó"
              : "Trung bình",
      category:
        index === 0
          ? "self-study"
          : index === 1
            ? "illustration"
            : index === 2
              ? "specialized"
              : "self-study",
      imageUrl: defaultImageSet[index] ?? defaultImageSet[0],
      badge: index === 0 ? "Hot" : index === 1 ? "Mới" : "",
      questions,
      essayContent:
        examType === "essay" ? buildEssayContent(config.promptStem) : {},
    };
  });
};

export const defaultExamDocuments = [
  "Toán",
  "Văn",
  "Anh",
  "Lý",
  "Hóa",
  "Sinh",
  "Sử",
  "Tin học",
].flatMap(buildExamDocumentsForSubject);

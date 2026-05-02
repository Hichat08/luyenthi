import AdminShell from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  adminService,
  type AdminCreateExamPayload,
} from "@/services/adminService";
import { subjectService } from "@/services/subjectService";
import type { SubjectExamDifficulty } from "@/types/exam";
import {
  BookOpenText,
  ClipboardList,
  FilePlus2,
  GraduationCap,
  ListChecks,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type ExamCategory = "illustration" | "specialized" | "self-study";
type ExamType = "multiple_choice" | "essay";

type QuestionKind = "multiple_choice" | "true_false";

type QuestionForm = {
  topicLabel: string;
  questionCode: string;
  prompt: string;
  kind: QuestionKind;
  options: string[];
  correctIndex: number;
  hint: string;
  formula: string;
  explanationTitle: string;
  explanationSteps: string;
  explanationConclusion: string;
};

type EssayForm = {
  readingPassage: string;
  readingQuestion: string;
  essayPrompt: string;
  checklist: string;
  statusNote: string;
};

const difficultyOptions: SubjectExamDifficulty[] = ["Trung bình", "Khó", "Rất khó"];

const categoryOptions: Array<{ value: ExamCategory; label: string; description: string }> = [
  {
    value: "illustration",
    label: "Minh họa",
    description: "Dùng cho đề nền tảng, bám chuẩn và dễ triển khai.",
  },
  {
    value: "specialized",
    label: "Chuyên sâu",
    description: "Đề khó hơn, phù hợp luyện nâng cao và phân loại.",
  },
  {
    value: "self-study",
    label: "Tự luyện",
    description: "Đề luyện tập hằng ngày, giao bài cho học sinh.",
  },
];

const createEmptyQuestion = (kind: QuestionKind = "multiple_choice"): QuestionForm => ({
  topicLabel: "",
  questionCode: "",
  prompt: "",
  kind,
  options: kind === "true_false" ? ["Đúng", "Sai"] : ["", "", "", ""],
  correctIndex: 0,
  hint: "",
  formula: "",
  explanationTitle: "",
  explanationSteps: "",
  explanationConclusion: "",
});

const createEmptyEssay = (): EssayForm => ({
  readingPassage: "",
  readingQuestion: "",
  essayPrompt: "",
  checklist: "Đọc kỹ đề\nLập dàn ý trước khi viết\nSoát lỗi chính tả và diễn đạt",
  statusNote: "Khuyến khích học sinh trình bày rõ ràng, có luận điểm và dẫn chứng.",
});

const normalizeText = (value: string) => value.trim().replace(/\s+/g, " ");

export default function AdminExamBuilderPage() {
  const [subject, setSubject] = useState("");
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [examType, setExamType] = useState<ExamType>("multiple_choice");
  const [durationMinutes, setDurationMinutes] = useState("45");
  const [difficulty, setDifficulty] = useState<SubjectExamDifficulty>("Trung bình");
  const [category, setCategory] = useState<ExamCategory>("self-study");
  const [badge, setBadge] = useState("Mới");
  const [imageUrl, setImageUrl] = useState("");
  const [questions, setQuestions] = useState<QuestionForm[]>([
    createEmptyQuestion(),
    createEmptyQuestion(),
  ]);
  const [essayForm, setEssayForm] = useState<EssayForm>(createEmptyEssay());
  const [submitting, setSubmitting] = useState(false);
  const [lastCreatedExam, setLastCreatedExam] = useState<{
    examId: string;
    title: string;
    subject: string;
    examType: ExamType;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadSubjects = async () => {
      try {
        const items = await subjectService.getSubjects();
        if (!cancelled) {
          setSubjectOptions(items.map((item) => item.name));
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Không thể tải danh mục môn học", error);
        }
      }
    };

    void loadSubjects();

    return () => {
      cancelled = true;
    };
  }, []);

  const trimmedSubject = normalizeText(subject);
  const trimmedTitle = normalizeText(title);
  const suggestedSubjects = useMemo(() => subjectOptions.slice(0, 12), [subjectOptions]);
  const totalFilledPrompts = useMemo(
    () => questions.filter((question) => question.prompt.trim()).length,
    [questions]
  );

  const updateQuestion = (index: number, patch: Partial<QuestionForm>) => {
    setQuestions((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index ? { ...question, ...patch } : question
      )
    );
  };

  const updateQuestionOption = (questionIndex: number, optionIndex: number, value: string) => {
    setQuestions((current) =>
      current.map((question, index) => {
        if (index !== questionIndex) {
          return question;
        }

        const nextOptions = [...question.options];
        nextOptions[optionIndex] = value;

        return {
          ...question,
          options: nextOptions,
        };
      })
    );
  };

  const handleAddQuestion = () => {
    setQuestions((current) => [...current, createEmptyQuestion()]);
  };

  const handleChangeQuestionKind = (index: number, kind: QuestionKind) => {
    setQuestions((current) =>
      current.map((question, questionIndex) => {
        if (questionIndex !== index) {
          return question;
        }

        if (kind === "true_false") {
          return {
            ...question,
            kind,
            options: ["Đúng", "Sai"],
            correctIndex: question.correctIndex > 1 ? 0 : question.correctIndex,
          };
        }

        return {
          ...question,
          kind,
          options:
            question.options.length >= 4
              ? question.options.slice(0, 4)
              : [...question.options, ...Array.from({ length: 4 - question.options.length }, () => "")],
          correctIndex: Math.min(question.correctIndex, 3),
        };
      })
    );
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter((_, questionIndex) => questionIndex !== index);
    });
  };

  const resetFormByType = (nextExamType: ExamType) => {
    if (nextExamType === "multiple_choice") {
      setQuestions([createEmptyQuestion(), createEmptyQuestion()]);
      setDurationMinutes("45");
      return;
    }

    setEssayForm(createEmptyEssay());
    setDurationMinutes("120");
  };

  const handleChangeExamType = (nextExamType: ExamType) => {
    setExamType(nextExamType);
    resetFormByType(nextExamType);
  };

  const handleSubmit = async () => {
    if (!trimmedSubject || !trimmedTitle) {
      toast.error("Cần nhập môn học và tiêu đề đề thi.");
      return;
    }

    const parsedDuration = Number(durationMinutes);

    if (!Number.isFinite(parsedDuration) || parsedDuration < 1) {
      toast.error("Thời lượng làm bài không hợp lệ.");
      return;
    }

    const payload: AdminCreateExamPayload = {
      subject: trimmedSubject,
      examType,
      title: trimmedTitle,
      durationMinutes: parsedDuration,
      difficulty,
      category,
      badge: normalizeText(badge),
      imageUrl: normalizeText(imageUrl),
    };

    if (examType === "multiple_choice") {
      payload.questions = questions.map((question) => ({
        topicLabel: normalizeText(question.topicLabel),
        questionCode: normalizeText(question.questionCode).toUpperCase().replace(/\s+/g, ""),
        prompt: question.prompt.trim(),
        options: (question.kind === "true_false" ? ["Đúng", "Sai"] : question.options)
          .map((option) => option.trim())
          .filter(Boolean),
        correctIndex: question.correctIndex,
        hint: question.hint.trim(),
        formula: question.formula.trim(),
        explanationTitle: question.explanationTitle.trim(),
        explanationSteps: question.explanationSteps
          .split("\n")
          .map((step) => step.trim())
          .filter(Boolean),
        explanationConclusion: question.explanationConclusion.trim(),
      }));
    } else {
      payload.essayContent = {
        readingPassage: essayForm.readingPassage.trim(),
        readingQuestion: essayForm.readingQuestion.trim(),
        essayPrompt: essayForm.essayPrompt.trim(),
        checklist: essayForm.checklist
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        statusNote: essayForm.statusNote.trim(),
      };
    }

    try {
      setSubmitting(true);
      const response = await adminService.createExam(payload);
      setLastCreatedExam({
        examId: response.exam.examId,
        title: response.exam.title,
        subject: response.exam.subject,
        examType,
      });
      toast.success("Đã tạo đề mới cho học sinh.");
      setTitle("");
      setImageUrl("");
      setBadge("Mới");
      resetFormByType(examType);
      if (!subjectOptions.includes(trimmedSubject)) {
        setSubjectOptions((current) => [...current, trimmedSubject].sort((a, b) => a.localeCompare(b)));
      }
    } catch (error) {
      console.error("Không thể tạo đề thi", error);
      toast.error("Tạo đề thất bại. Hãy kiểm tra lại nội dung.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminShell
      title="Tạo đề thi cho học sinh"
      description="Admin có thể thêm đề mới theo từng môn, chọn kiểu trắc nghiệm hoặc tự luận và nhập đầy đủ nội dung bài để học sinh vào luyện tập ngay."
      headerAside={
        <div className="rounded-[1rem] border border-primary/12 bg-[linear-gradient(135deg,hsl(var(--primary)/0.12)_0%,hsl(var(--background))_100%)] px-3 py-2.5 text-foreground">
          <p className="text-[10px] uppercase tracking-[0.18em] text-primary/68">Mẫu triển khai</p>
          <p className="mt-1 text-[13px] font-bold">
            {examType === "multiple_choice" ? "Đề trắc nghiệm" : "Đề tự luận"}
          </p>
        </div>
      }
    >
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(300px,0.88fr)]">
        <article className="rounded-[1.45rem] border border-border/75 bg-card/92 p-4 shadow-[0_20px_42px_-34px_hsl(var(--primary)/0.18)]">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-[0.85rem] bg-primary/10 text-primary">
              <FilePlus2 className="size-4" />
            </span>
            <div>
              <h2 className="text-[1rem] font-black tracking-[-0.04em] text-foreground">
                Thông tin đề thi
              </h2>
              <p className="text-[12px] text-muted-foreground">
                Môn mới nhập vào sẽ tự được thêm vào danh mục môn học.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Môn học
              </p>
              <Input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Ví dụ: Toán, Tin học, Địa lý..."
                list="admin-subject-options"
                className="h-10 rounded-[0.95rem] border-border/75 bg-background text-[13px]"
              />
              <datalist id="admin-subject-options">
                {subjectOptions.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
              <div className="flex flex-wrap gap-2 pt-1">
                {suggestedSubjects.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="rounded-full border border-primary/16 bg-primary/6 px-3 py-1.5 text-[11px] font-bold text-primary transition hover:bg-primary/10"
                    onClick={() => setSubject(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Tiêu đề đề thi
              </p>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ví dụ: Đề luyện tập chương Hàm số số 1"
                className="h-10 rounded-[0.95rem] border-border/75 bg-background text-[13px]"
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Loại đề
              </p>
              <div className="flex gap-2">
                {[
                  { value: "multiple_choice", label: "Trắc nghiệm" },
                  { value: "essay", label: "Tự luận" },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={`flex-1 rounded-[0.95rem] border px-3 py-2 text-[12px] font-bold transition ${
                      examType === item.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/16 hover:text-primary"
                    }`}
                    onClick={() => handleChangeExamType(item.value as ExamType)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Thời lượng (phút)
              </p>
              <Input
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(event.target.value)}
                inputMode="numeric"
                className="h-10 rounded-[0.95rem] border-border/75 bg-background text-[13px]"
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Độ khó
              </p>
              <div className="flex flex-wrap gap-2">
                {difficultyOptions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`rounded-[0.95rem] border px-3 py-2 text-[12px] font-bold transition ${
                      difficulty === item
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/16 hover:text-primary"
                    }`}
                    onClick={() => setDifficulty(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Nhóm đề
              </p>
              <div className="grid gap-2">
                {categoryOptions.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={`rounded-[0.95rem] border px-3 py-2 text-left transition ${
                      category === item.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/16 hover:text-primary"
                    }`}
                    onClick={() => setCategory(item.value)}
                  >
                    <p className="text-[12px] font-bold">{item.label}</p>
                    <p className="text-[11px]">{item.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Badge
              </p>
              <Input
                value={badge}
                onChange={(event) => setBadge(event.target.value)}
                placeholder="Ví dụ: Mới, HOT, Thi thử"
                className="h-10 rounded-[0.95rem] border-border/75 bg-background text-[13px]"
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Ảnh bìa URL
              </p>
              <Input
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="https://..."
                className="h-10 rounded-[0.95rem] border-border/75 bg-background text-[13px]"
              />
            </div>
          </div>

          {examType === "multiple_choice" ? (
            <div className="mt-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-[0.98rem] font-black tracking-[-0.04em] text-foreground">
                    Ngân hàng câu hỏi
                  </h3>
                  <p className="text-[12px] text-muted-foreground">
                    Mỗi câu nên đủ đáp án, đáp án đúng và phần giải thích.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-[0.95rem] border-primary/16 px-3 text-[12px] font-bold text-primary"
                  onClick={handleAddQuestion}
                >
                  <Plus className="size-4" />
                  Thêm câu
                </Button>
              </div>

              <div className="mt-4 space-y-4">
                {questions.map((question, index) => (
                  <article
                    key={`question-${index}`}
                    className="rounded-[1.2rem] border border-border/75 bg-background/72 p-3.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-primary/80">
                          Câu {index + 1}
                        </p>
                        <p className="text-[12px] text-muted-foreground">
                          Chủ đề, đáp án và lời giải cho học sinh.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="rounded-[0.9rem] border border-destructive/18 bg-destructive/6 p-2 text-destructive transition hover:bg-destructive/10"
                        onClick={() => handleRemoveQuestion(index)}
                        disabled={questions.length === 1}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    <div className="mt-3 grid gap-3">
                      <Input
                        value={question.topicLabel}
                        onChange={(event) =>
                          updateQuestion(index, { topicLabel: event.target.value })
                        }
                        placeholder="Chủ đề, ví dụ: Hàm số, OOP, Sóng cơ..."
                        className="h-10 rounded-[0.95rem] border-border/75 bg-card text-[13px]"
                      />
                      <Input
                        value={question.questionCode}
                        onChange={(event) => updateQuestion(index, { questionCode: event.target.value })}
                        placeholder={question.kind === "true_false" ? "Mã gợi ý: TH-DS-01A" : "Mã gợi ý: TH-MC-001"}
                        className="h-10 rounded-[0.95rem] border-border/75 bg-card text-[13px]"
                      />
                      <p className="text-[11px] text-muted-foreground">Gợi ý mã: Trắc nghiệm dùng TH-MC-001, TH-MC-002... | Đúng/Sai dùng TH-DS-01A, TH-DS-01B...</p>
                      <Textarea
                        value={question.prompt}
                        onChange={(event) =>
                          updateQuestion(index, { prompt: event.target.value })
                        }
                        placeholder="Nội dung câu hỏi"
                        className="min-h-24 rounded-[1rem] border-border/75 bg-card px-3 py-2.5 text-[13px]"
                      />

                      <div className="space-y-1.5">
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                          Dạng câu hỏi
                        </p>
                        <div className="flex gap-2">
                          {[
                            { value: "multiple_choice", label: "Trắc nghiệm" },
                            { value: "true_false", label: "Đúng / Sai" },
                          ].map((item) => (
                            <button
                              key={`kind-${index}-${item.value}`}
                              type="button"
                              className={`rounded-[0.9rem] border px-3 py-2 text-[12px] font-bold transition ${
                                question.kind === item.value
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border bg-card text-muted-foreground hover:border-primary/16 hover:text-primary"
                              }`}
                              onClick={() => handleChangeQuestionKind(index, item.value as QuestionKind)}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-2 md:grid-cols-2">
                        {question.options.map((option, optionIndex) => (
                          <div key={`question-${index}-option-${optionIndex}`} className="space-y-1.5">
                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                              Đáp án {String.fromCharCode(65 + optionIndex)}
                            </p>
                            <Input
                              value={option}
                              onChange={(event) =>
                                updateQuestionOption(index, optionIndex, event.target.value)
                              }
                              placeholder={`Nhập đáp án ${String.fromCharCode(65 + optionIndex)}`}
                              className="h-10 rounded-[0.95rem] border-border/75 bg-card text-[13px]"
                              disabled={question.kind === "true_false"}
                            />
                          </div>
                        ))}
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                          Đáp án đúng
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {question.options.map((_, optionIndex) => (
                            <button
                              key={`correct-${index}-${optionIndex}`}
                              type="button"
                              className={`rounded-[0.9rem] border px-3 py-2 text-[12px] font-bold transition ${
                                question.correctIndex === optionIndex
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border bg-card text-muted-foreground hover:border-primary/16 hover:text-primary"
                              }`}
                              onClick={() => updateQuestion(index, { correctIndex: optionIndex })}
                            >
                              {String.fromCharCode(65 + optionIndex)}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <Input
                          value={question.hint}
                          onChange={(event) => updateQuestion(index, { hint: event.target.value })}
                          placeholder="Gợi ý ngắn cho học sinh"
                          className="h-10 rounded-[0.95rem] border-border/75 bg-card text-[13px]"
                        />
                        <Input
                          value={question.formula}
                          onChange={(event) =>
                            updateQuestion(index, { formula: event.target.value })
                          }
                          placeholder="Công thức trọng tâm (nếu có)"
                          className="h-10 rounded-[0.95rem] border-border/75 bg-card text-[13px]"
                        />
                      </div>

                      <Input
                        value={question.explanationTitle}
                        onChange={(event) =>
                          updateQuestion(index, { explanationTitle: event.target.value })
                        }
                        placeholder="Tiêu đề phần giải thích"
                        className="h-10 rounded-[0.95rem] border-border/75 bg-card text-[13px]"
                      />
                      <Textarea
                        value={question.explanationSteps}
                        onChange={(event) =>
                          updateQuestion(index, { explanationSteps: event.target.value })
                        }
                        placeholder="Các bước giải, mỗi dòng một ý"
                        className="min-h-24 rounded-[1rem] border-border/75 bg-card px-3 py-2.5 text-[13px]"
                      />
                      <Textarea
                        value={question.explanationConclusion}
                        onChange={(event) =>
                          updateQuestion(index, {
                            explanationConclusion: event.target.value,
                          })
                        }
                        placeholder="Kết luận cuối cùng của lời giải"
                        className="min-h-20 rounded-[1rem] border-border/75 bg-card px-3 py-2.5 text-[13px]"
                      />
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-[1.2rem] border border-border/75 bg-background/72 p-3.5">
              <div>
                <h3 className="text-[0.98rem] font-black tracking-[-0.04em] text-foreground">
                  Nội dung đề tự luận
                </h3>
                <p className="text-[12px] text-muted-foreground">
                  Phù hợp cho Văn hoặc các đề cần phần đọc hiểu và bài viết dài.
                </p>
              </div>

              <div className="mt-4 grid gap-3">
                <Textarea
                  value={essayForm.readingPassage}
                  onChange={(event) =>
                    setEssayForm((current) => ({
                      ...current,
                      readingPassage: event.target.value,
                    }))
                  }
                  placeholder="Đoạn văn / ngữ liệu đọc hiểu"
                  className="min-h-32 rounded-[1rem] border-border/75 bg-card px-3 py-2.5 text-[13px]"
                />
                <Input
                  value={essayForm.readingQuestion}
                  onChange={(event) =>
                    setEssayForm((current) => ({
                      ...current,
                      readingQuestion: event.target.value,
                    }))
                  }
                  placeholder="Câu hỏi đọc hiểu"
                  className="h-10 rounded-[0.95rem] border-border/75 bg-card text-[13px]"
                />
                <Textarea
                  value={essayForm.essayPrompt}
                  onChange={(event) =>
                    setEssayForm((current) => ({
                      ...current,
                      essayPrompt: event.target.value,
                    }))
                  }
                  placeholder="Đề bài nghị luận / bài viết"
                  className="min-h-24 rounded-[1rem] border-border/75 bg-card px-3 py-2.5 text-[13px]"
                />
                <Textarea
                  value={essayForm.checklist}
                  onChange={(event) =>
                    setEssayForm((current) => ({
                      ...current,
                      checklist: event.target.value,
                    }))
                  }
                  placeholder="Checklist chấm nhanh, mỗi dòng một ý"
                  className="min-h-24 rounded-[1rem] border-border/75 bg-card px-3 py-2.5 text-[13px]"
                />
                <Textarea
                  value={essayForm.statusNote}
                  onChange={(event) =>
                    setEssayForm((current) => ({
                      ...current,
                      statusNote: event.target.value,
                    }))
                  }
                  placeholder="Ghi chú hiển thị cho học sinh"
                  className="min-h-20 rounded-[1rem] border-border/75 bg-card px-3 py-2.5 text-[13px]"
                />
              </div>
            </div>
          )}

          <div className="mt-5 flex justify-end">
            <Button
              type="button"
              className="h-11 rounded-[1rem] px-5 text-[13px] font-black"
              onClick={() => void handleSubmit()}
              disabled={submitting}
            >
              <Save className="size-4" />
              {submitting ? "Đang lưu đề..." : "Lưu đề thi"}
            </Button>
          </div>
        </article>

        <div className="space-y-4">
          <article className="rounded-[1.45rem] border border-border/75 bg-card/92 p-4 shadow-[0_20px_42px_-34px_hsl(var(--primary)/0.18)]">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-[0.85rem] bg-primary/10 text-primary">
                <ClipboardList className="size-4" />
              </span>
              <div>
                <h2 className="text-[1rem] font-black tracking-[-0.04em] text-foreground">
                  Tóm tắt nhanh
                </h2>
                <p className="text-[12px] text-muted-foreground">
                  Kiểm tra cấu hình đề trước khi lưu.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="rounded-[1rem] border border-border/70 bg-background/72 px-3 py-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  Môn học
                </p>
                <p className="mt-1 text-[13px] font-bold text-foreground">
                  {trimmedSubject || "Chưa nhập"}
                </p>
              </div>
              <div className="rounded-[1rem] border border-border/70 bg-background/72 px-3 py-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  Tiêu đề
                </p>
                <p className="mt-1 text-[13px] font-bold text-foreground">
                  {trimmedTitle || "Chưa đặt tiêu đề"}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1rem] border border-border/70 bg-background/72 px-3 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    Kiểu đề
                  </p>
                  <p className="mt-1 text-[13px] font-bold text-foreground">
                    {examType === "multiple_choice" ? "Trắc nghiệm" : "Tự luận"}
                  </p>
                </div>
                <div className="rounded-[1rem] border border-border/70 bg-background/72 px-3 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    Thời lượng
                  </p>
                  <p className="mt-1 text-[13px] font-bold text-foreground">
                    {durationMinutes || "0"} phút
                  </p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1rem] border border-border/70 bg-background/72 px-3 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    Độ khó
                  </p>
                  <p className="mt-1 text-[13px] font-bold text-foreground">{difficulty}</p>
                </div>
                <div className="rounded-[1rem] border border-border/70 bg-background/72 px-3 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    Nội dung
                  </p>
                  <p className="mt-1 text-[13px] font-bold text-foreground">
                    {examType === "multiple_choice"
                      ? `${questions.length} câu, ${totalFilledPrompts} câu đã nhập`
                      : "2 phần: đọc hiểu + làm văn"}
                  </p>
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-[1.45rem] border border-border/75 bg-card/92 p-4 shadow-[0_20px_42px_-34px_hsl(var(--primary)/0.18)]">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-[0.85rem] bg-primary/10 text-primary">
                <Sparkles className="size-4" />
              </span>
              <div>
                <h2 className="text-[1rem] font-black tracking-[-0.04em] text-foreground">
                  Gợi ý thiết kế
                </h2>
                <p className="text-[12px] text-muted-foreground">
                  Để đề dễ dùng ngay cho học sinh.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-[12px] text-muted-foreground">
              <div className="rounded-[1rem] border border-border/70 bg-background/72 px-3 py-3">
                <div className="flex items-center gap-2 text-foreground">
                  <GraduationCap className="size-4 text-primary" />
                  <p className="font-bold">Môn phổ biến nên ưu tiên</p>
                </div>
                <p className="mt-2 leading-5">
                  Toán, Ngữ văn, Tiếng Anh, Vật lý, Hóa học, Sinh học, Lịch sử, Địa lý và Tin học.
                </p>
              </div>
              <div className="rounded-[1rem] border border-border/70 bg-background/72 px-3 py-3">
                <div className="flex items-center gap-2 text-foreground">
                  <BookOpenText className="size-4 text-primary" />
                  <p className="font-bold">Đề trắc nghiệm</p>
                </div>
                <p className="mt-2 leading-5">
                  Nên có chủ đề, gợi ý và lời giải ngắn để học sinh xem lại sau khi làm bài.
                </p>
              </div>
              <div className="rounded-[1rem] border border-border/70 bg-background/72 px-3 py-3">
                <div className="flex items-center gap-2 text-foreground">
                  <ListChecks className="size-4 text-primary" />
                  <p className="font-bold">Đề tự luận</p>
                </div>
                <p className="mt-2 leading-5">
                  Nên có checklist chấm nhanh để giáo viên và học sinh tự đối chiếu cấu trúc bài.
                </p>
              </div>
            </div>
          </article>

          {lastCreatedExam ? (
            <article className="rounded-[1.45rem] border border-primary/18 bg-primary/6 p-4 shadow-[0_20px_42px_-34px_hsl(var(--primary)/0.18)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary/72">
                Đề vừa tạo
              </p>
              <p className="mt-2 text-[14px] font-black text-foreground">
                {lastCreatedExam.title}
              </p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                {lastCreatedExam.subject} •{" "}
                {lastCreatedExam.examType === "multiple_choice" ? "Trắc nghiệm" : "Tự luận"}
              </p>
              <p className="mt-2 rounded-[0.9rem] bg-background/72 px-3 py-2 font-mono text-[11px] text-primary">
                {lastCreatedExam.examId}
              </p>
            </article>
          ) : null}
        </div>
      </section>
    </AdminShell>
  );
}

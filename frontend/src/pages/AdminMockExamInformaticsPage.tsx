import AdminShell from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  adminService,
  type AdminCreateExamPayload,
} from "@/services/adminService";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type McqQuestion = {
  questionCode: string;
  prompt: string;
  options: string[];
  correctIndex: number;
};

type TfStatement = {
  code: string;
  text: string;
  isTrue: boolean;
};

type TfGroup = {
  prompt: string;
  statements: TfStatement[];
};

const sanitizeCode = (value: string) =>
  value.trim().toUpperCase().replace(/\s+/g, "").replace(/[^A-Z0-9._-]/g, "");

const createMcq = (): McqQuestion => ({
  questionCode: "",
  prompt: "",
  options: ["", "", "", ""],
  correctIndex: 0,
});

const createTfGroup = (): TfGroup => ({
  prompt: "",
  statements: Array.from({ length: 4 }, () => ({ code: "", text: "", isTrue: true })),
});

export default function AdminMockExamInformaticsPage() {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("50");
  const [mcq, setMcq] = useState<McqQuestion[]>(Array.from({ length: 24 }, createMcq));
  const [tfGroups, setTfGroups] = useState<TfGroup[]>(Array.from({ length: 4 }, createTfGroup));
  const [submitting, setSubmitting] = useState(false);

  const totalFilled = useMemo(() => {
    const mcqFilled = mcq.filter((q) => q.prompt.trim()).length;
    const tfFilled = tfGroups.filter((g) => g.prompt.trim()).length;
    return mcqFilled + tfFilled;
  }, [mcq, tfGroups]);

  const handleSubmit = async () => {
    const examTitle = title.trim();
    const durationMinutes = Number(duration);

    if (!examTitle) return toast.error("Nhập tiêu đề đề thi.");
    if (!Number.isFinite(durationMinutes) || durationMinutes < 1) {
      return toast.error("Thời lượng không hợp lệ.");
    }

    const flattenedTrueFalse = tfGroups.flatMap((group, groupIndex) =>
      group.statements.map((item, statementIndex) => ({
        topicLabel: "Đúng/Sai",
        questionCode:
          sanitizeCode(item.code) ||
          `TH-DS-${groupIndex + 1}${String.fromCharCode(65 + statementIndex)}`,
        prompt: `${group.prompt.trim()}\nÝ ${String.fromCharCode(97 + statementIndex)}: ${
          item.text
        }`,
        options: ["Đúng", "Sai"],
        correctIndex: item.isTrue ? 0 : 1,
        hint: "",
        formula: "",
        explanationTitle: `Câu Đ/S ${groupIndex + 1}${String.fromCharCode(97 + statementIndex)}`,
        explanationSteps: [],
        explanationConclusion: "",
      })),
    );

    const payload: AdminCreateExamPayload = {
      subject: "Tin học",
      examType: "multiple_choice",
      title: examTitle,
      durationMinutes,
      difficulty: "Khó",
      category: "specialized",
      badge: "Thi thử mới",
      imageUrl: "",
      questions: [
        ...mcq.map((question, index) => ({
          topicLabel: "Trắc nghiệm 4 lựa chọn",
          questionCode:
            sanitizeCode(question.questionCode) ||
            `TH-MC-${String(index + 1).padStart(3, "0")}`,
          prompt: question.prompt.trim() || `Câu ${index + 1}`,
          options: question.options.map((o) => o.trim()).filter(Boolean),
          correctIndex: question.correctIndex,
          hint: "",
          formula: "",
          explanationTitle: "",
          explanationSteps: [],
          explanationConclusion: "",
        })),
        ...flattenedTrueFalse,
      ],
    };

    try {
      setSubmitting(true);
      await adminService.createExam(payload);
      toast.success("Đã đẩy đề lên Thi thử môn Tin học.");
    } catch (error) {
      console.error(error);
      toast.error("Tạo đề thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminShell
      title="Tạo đề Thi thử Tin học"
      description="Mặc định 24 câu trắc nghiệm 4 lựa chọn + 4 câu Đúng/Sai (mỗi câu 4 ý). Khi lưu sẽ tự hiển thị cho user trong môn Tin học."
    >
      <section className="space-y-4 rounded-2xl border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tiêu đề đề thi thử"
          />
          <Input
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            inputMode="numeric"
            placeholder="Thời gian (phút)"
          />
        </div>
        <p className="text-xs text-muted-foreground">Đã điền: {totalFilled}/28 cụm câu.</p>

        <h3 className="font-bold">Phần I - 24 câu trắc nghiệm</h3>
        <div className="space-y-3">
          {mcq.map((q, i) => (
            <div key={i} className="space-y-2 rounded-xl border p-3">
              <Input
                value={q.questionCode}
                onChange={(e) =>
                  setMcq((cur) =>
                    cur.map((x, idx) => (idx === i ? { ...x, questionCode: e.target.value } : x)),
                  )
                }
                placeholder={`Mã câu gợi ý TH-MC-${String(i + 1).padStart(3, "0")}`}
              />
              <Textarea
                value={q.prompt}
                onChange={(e) =>
                  setMcq((cur) => cur.map((x, idx) => (idx === i ? { ...x, prompt: e.target.value } : x)))
                }
                placeholder={`Câu ${i + 1}`}
              />
              <div className="grid grid-cols-2 gap-2">
                {q.options.map((op, oi) => (
                  <Input
                    key={oi}
                    value={op}
                    onChange={(e) =>
                      setMcq((cur) =>
                        cur.map((x, idx) =>
                          idx === i
                            ? {
                                ...x,
                                options: x.options.map((v, vi) =>
                                  vi === oi ? e.target.value : v,
                                ),
                              }
                            : x,
                        ),
                      )
                    }
                    placeholder={`Đáp án ${String.fromCharCode(65 + oi)}`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                {[0, 1, 2, 3].map((n) => (
                  <Button
                    key={n}
                    type="button"
                    variant={q.correctIndex === n ? "default" : "outline"}
                    onClick={() =>
                      setMcq((cur) =>
                        cur.map((x, idx) => (idx === i ? { ...x, correctIndex: n } : x)),
                      )
                    }
                  >
                    {String.fromCharCode(65 + n)}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <h3 className="font-bold">Phần II - 4 câu Đúng/Sai (mỗi câu 4 ý)</h3>
        <div className="space-y-3">
          {tfGroups.map((g, gi) => (
            <div key={gi} className="space-y-2 rounded-xl border p-3">
              <Textarea
                value={g.prompt}
                onChange={(e) =>
                  setTfGroups((cur) =>
                    cur.map((x, idx) => (idx === gi ? { ...x, prompt: e.target.value } : x)),
                  )
                }
                placeholder={`Câu Đ/S ${gi + 1} - đoạn dẫn`}
              />
              {g.statements.map((s, si) => (
                <div key={si} className="grid items-center gap-2 md:grid-cols-[190px_1fr_auto]">
                  <Input
                    value={s.code}
                    onChange={(e) =>
                      setTfGroups((cur) =>
                        cur.map((x, idx) =>
                          idx === gi
                            ? {
                                ...x,
                                statements: x.statements.map((st, sti) =>
                                  sti === si ? { ...st, code: e.target.value } : st,
                                ),
                              }
                            : x,
                        ),
                      )
                    }
                    placeholder={`Mã ý gợi ý TH-DS-${gi + 1}${String.fromCharCode(65 + si)}`}
                  />
                  <Input
                    value={s.text}
                    onChange={(e) =>
                      setTfGroups((cur) =>
                        cur.map((x, idx) =>
                          idx === gi
                            ? {
                                ...x,
                                statements: x.statements.map((st, sti) =>
                                  sti === si ? { ...st, text: e.target.value } : st,
                                ),
                              }
                            : x,
                        ),
                      )
                    }
                    placeholder={`Ý ${String.fromCharCode(97 + si)}`}
                  />
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant={s.isTrue ? "default" : "outline"}
                      onClick={() =>
                        setTfGroups((cur) =>
                          cur.map((x, idx) =>
                            idx === gi
                              ? {
                                  ...x,
                                  statements: x.statements.map((st, sti) =>
                                    sti === si ? { ...st, isTrue: true } : st,
                                  ),
                                }
                              : x,
                          ),
                        )
                      }
                    >
                      Đúng
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={!s.isTrue ? "default" : "outline"}
                      onClick={() =>
                        setTfGroups((cur) =>
                          cur.map((x, idx) =>
                            idx === gi
                              ? {
                                  ...x,
                                  statements: x.statements.map((st, sti) =>
                                    sti === si ? { ...st, isTrue: false } : st,
                                  ),
                                }
                              : x,
                          ),
                        )
                      }
                    >
                      Sai
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button type="button" onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting ? "Đang lưu..." : "Đăng đề Thi thử Tin học"}
          </Button>
        </div>
      </section>
    </AdminShell>
  );
}

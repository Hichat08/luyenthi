import AdminShell from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { adminService, type AdminCreateExamPayload } from "@/services/adminService";
import { useMemo, useState } from "react";
import { toast } from "sonner";

// ===== TYPES =====
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

// ===== HELPERS =====
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
  statements: Array.from({ length: 4 }, () => ({
    code: "",
    text: "",
    isTrue: true,
  })),
});

// ===== COMPONENT =====
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
    if (!Number.isFinite(durationMinutes) || durationMinutes < 1)
      return toast.error("Thời lượng không hợp lệ.");

    // Validate MCQ
    const missingMcq = mcq.findIndex(
      (q) =>
        !q.prompt.trim() ||
        q.options.map((o) => o.trim()).filter(Boolean).length < 4
    );
    if (missingMcq >= 0)
      return toast.error(`Câu ${missingMcq + 1} chưa đủ 4 đáp án.`);

    // Validate TF
    const missingTf = tfGroups.findIndex(
      (g) =>
        !g.prompt.trim() ||
        g.statements.some((s) => !s.text.trim())
    );
    if (missingTf >= 0)
      return toast.error(`Câu Đ/S ${missingTf + 1} chưa đủ dữ liệu.`);

    // Flatten TF
    const flattenedTF = tfGroups.flatMap((group, gi) =>
      group.statements.map((item, si) => ({
        topicLabel: "Đúng/Sai",
        questionCode:
          sanitizeCode(item.code) ||
          `TH-DS-${gi + 1}${String.fromCharCode(65 + si)}`,
        prompt: `${group.prompt}\nÝ ${String.fromCharCode(97 + si)}: ${item.text}`,
        options: ["Đúng", "Sai"],
        correctIndex: item.isTrue ? 0 : 1,
        hint: "",
        formula: "",
        explanationTitle: `Câu Đ/S ${gi + 1}${String.fromCharCode(97 + si)}`,
        explanationSteps: [],
        explanationConclusion: "",
      }))
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
        ...mcq.map((q, i) => ({
          topicLabel: "Trắc nghiệm",
          questionCode:
            sanitizeCode(q.questionCode) ||
            `TH-MC-${String(i + 1).padStart(3, "0")}`,
          prompt: q.prompt,
          options: q.options,
          correctIndex: q.correctIndex,
          hint: "",
          formula: "",
          explanationTitle: "",
          explanationSteps: [],
          explanationConclusion: "",
        })),
        ...flattenedTF,
      ],
    };

    try {
      setSubmitting(true);
      await adminService.createExam(payload);
      toast.success("Tạo đề thành công!");
    } catch (err) {
      console.error(err);
      toast.error("Tạo đề thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminShell title="Tạo đề Thi thử Tin học" description="24 TN + 4 Đ/S">
      <section className="space-y-4 p-4 border rounded-2xl">

        {/* INFO */}
        <div className="grid md:grid-cols-2 gap-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề" />
          <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Thời gian" />
        </div>

        <p>Đã điền: {totalFilled}/28</p>

        {/* MCQ */}
        <h3 className="font-bold">24 câu trắc nghiệm</h3>
        {mcq.map((q, i) => (
          <div key={i} className="border p-3 rounded space-y-2">
            <Input
              value={q.questionCode}
              onChange={(e) =>
                setMcq((cur) =>
                  cur.map((x, idx) =>
                    idx === i ? { ...x, questionCode: e.target.value } : x
                  )
                )
              }
              placeholder={`TH-MC-${i + 1}`}
            />

            <Textarea
              value={q.prompt}
              onChange={(e) =>
                setMcq((cur) =>
                  cur.map((x, idx) =>
                    idx === i ? { ...x, prompt: e.target.value } : x
                  )
                )
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
                                vi === oi ? e.target.value : v
                              ),
                            }
                          : x
                      )
                    )
                  }
                  placeholder={`Đáp án ${String.fromCharCode(65 + oi)}`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {[0,1,2,3].map((n) => (
                <Button
                  key={n}
                  type="button"
                  variant={q.correctIndex === n ? "default" : "outline"}
                  onClick={() =>
                    setMcq((cur) =>
                      cur.map((x, idx) =>
                        idx === i ? { ...x, correctIndex: n } : x
                      )
                    )
                  }
                >
                  {String.fromCharCode(65 + n)}
                </Button>
              ))}
            </div>
          </div>
        ))}

        {/* TRUE FALSE */}
        <h3 className="font-bold">4 câu Đúng/Sai</h3>
        {tfGroups.map((g, gi) => (
          <div key={gi} className="border p-3 rounded space-y-2">
            <Textarea
              value={g.prompt}
              onChange={(e) =>
                setTfGroups((cur) =>
                  cur.map((x, idx) =>
                    idx === gi ? { ...x, prompt: e.target.value } : x
                  )
                )
              }
              placeholder={`Câu Đ/S ${gi + 1}`}
            />

            {g.statements.map((s, si) => (
              <div key={si} className="flex gap-2">
                <Input
                  value={s.text}
                  onChange={(e) =>
                    setTfGroups((cur) =>
                      cur.map((x, idx) =>
                        idx === gi
                          ? {
                              ...x,
                              statements: x.statements.map((st, sti) =>
                                sti === si ? { ...st, text: e.target.value } : st
                              ),
                            }
                          : x
                      )
                    )
                  }
                  placeholder={`Ý ${String.fromCharCode(97 + si)}`}
                />

                <Button
                  variant={s.isTrue ? "default" : "outline"}
                  onClick={() =>
                    setTfGroups((cur) =>
                      cur.map((x, idx) =>
                        idx === gi
                          ? {
                              ...x,
                              statements: x.statements.map((st, sti) =>
                                sti === si ? { ...st, isTrue: true } : st
                              ),
                            }
                          : x
                      )
                    )
                  }
                >
                  Đúng
                </Button>

                <Button
                  variant={!s.isTrue ? "default" : "outline"}
                  onClick={() =>
                    setTfGroups((cur) =>
                      cur.map((x, idx) =>
                        idx === gi
                          ? {
                              ...x,
                              statements: x.statements.map((st, sti) =>
                                sti === si ? { ...st, isTrue: false } : st
                              ),
                            }
                          : x
                      )
                    )
                  }
                >
                  Sai
                </Button>
              </div>
            ))}
          </div>
        ))}

        {/* SUBMIT */}
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Đang lưu..." : "Đăng đề"}
          </Button>
        </div>

      </section>
    </AdminShell>
  );
}

import { useEffect, useState } from "react";
import { getSubjectIcon } from "@/lib/subjectMeta";
import {
  BookOpen,
  BrainCircuit,
  ChevronRight,
  Clock3,
  Plus,
  Rocket,
  Sun,
  Sunset,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useUserStore } from "@/stores/useUserStore";
import { subjectService } from "@/services/subjectService";
import { toast } from "sonner";

type SessionForm = {
  start: string;
  end: string;
};

type SubjectGoalForm = {
  subject: string;
  currentScore: string;
  targetScore: string;
};

type SchoolScheduleSetupDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "full" | "subjects-only";
  initialValue?: {
    morning?: SessionForm;
    afternoon?: SessionForm;
    selectedSubjects?: string[];
    subjects?: Array<{
      subject: string;
      currentScore: number;
      targetScore: number;
    }>;
  };
};

type SubjectOption = {
  id: string;
  label: string;
  icon: LucideIcon;
};

const defaultSchedule = {
  morning: {
    start: "07:30",
    end: "11:30",
  },
  afternoon: {
    start: "13:30",
    end: "17:00",
  },
};

const subjectOptions: SubjectOption[] = [
  "Toán",
  "Văn",
  "Anh",
  "Lý",
  "Hóa",
  "Sinh",
  "Sử",
  "Công nghệ",
  "Tin học",
].map((subject) => ({
  id: subject,
  label: subject,
  icon: getSubjectIcon(subject),
}));

const defaultSelectedSubjects: string[] = [];

const createDefaultGoal = (subject: string): SubjectGoalForm => ({
  subject,
  currentScore: "0",
  targetScore: "10",
});

const formatTimeInput = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
};

const isCompleteTime = (value: string) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);

function TimeField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Input
      type="text"
      inputMode="numeric"
      placeholder="07:30"
      value={value}
      onChange={(event) => onChange(formatTimeInput(event.target.value))}
      className="h-11 rounded-xl border-primary/15 bg-white pl-10 font-medium tracking-[0.08em] sm:h-12"
    />
  );
}

export default function SchoolScheduleSetupDialog({
  open,
  onOpenChange,
  mode = "full",
  initialValue,
}: SchoolScheduleSetupDialogProps) {
  const { completeOnboarding, updateStudyGoals } = useUserStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [morning, setMorning] = useState<SessionForm>(defaultSchedule.morning);
  const [afternoon, setAfternoon] = useState<SessionForm>(defaultSchedule.afternoon);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    defaultSelectedSubjects
  );
  const [subjectGoals, setSubjectGoals] = useState<SubjectGoalForm[]>(
    defaultSelectedSubjects.map(createDefaultGoal)
  );
  const [availableSubjects, setAvailableSubjects] =
    useState<SubjectOption[]>(subjectOptions);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setStep(mode === "subjects-only" ? 2 : 1);
    setMorning(initialValue?.morning ?? defaultSchedule.morning);
    setAfternoon(initialValue?.afternoon ?? defaultSchedule.afternoon);

    const restoredSubjects =
      initialValue?.selectedSubjects && initialValue.selectedSubjects.length > 0
        ? initialValue.selectedSubjects
        : defaultSelectedSubjects;

    setSelectedSubjects(restoredSubjects);

    const restoredGoals =
      initialValue?.subjects && initialValue.subjects.length > 0
        ? initialValue.subjects.map((item) => ({
            subject: item.subject,
            currentScore: `${item.currentScore}`,
            targetScore: `${item.targetScore}`,
          }))
        : restoredSubjects.map(createDefaultGoal);

    setSubjectGoals(restoredGoals);
    setNewSubjectName("");
    setError("");
    setIsSaving(false);
  }, [mode, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const fetchSubjects = async () => {
      try {
        const subjects = await subjectService.getSubjects();
        const normalized = subjects.map((subject) => ({
          id: subject.name,
          label: subject.name,
          icon: getSubjectIcon(subject.name) ?? BookOpen,
        }));

        setAvailableSubjects(normalized);
      } catch (fetchError) {
        console.error("Lỗi khi tải danh sách môn học", fetchError);
        setAvailableSubjects(subjectOptions);
      }
    };

    fetchSubjects();
  }, [open]);

  const validateRange = (session: SessionForm) =>
    Boolean(
      session.start &&
        session.end &&
        isCompleteTime(session.start) &&
        isCompleteTime(session.end) &&
        session.start < session.end
    );

  const syncGoalsWithSelection = (subjects: string[]) => {
    setSubjectGoals((prev) =>
      subjects.map((subject) => prev.find((item) => item.subject === subject) ?? createDefaultGoal(subject))
    );
  };

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) => {
      const next = prev.includes(subject)
        ? prev.filter((item) => item !== subject)
        : [...prev, subject];

      syncGoalsWithSelection(next);
      return next;
    });
  };

  const handleNextStep = () => {
    if (!validateRange(morning) || !validateRange(afternoon)) {
      setError("Vui lòng nhập giờ bắt đầu nhỏ hơn giờ kết thúc cho cả hai buổi.");
      return;
    }

    setError("");
    setStep(2);
  };

  const handleSubmit = async () => {
    if (selectedSubjects.length === 0) {
      setError("Hãy chọn ít nhất một môn học trước khi hoàn tất.");
      return;
    }

    const normalizedGoals = subjectGoals.map((item) => ({
      subject: item.subject,
      currentScore: Number(item.currentScore),
      targetScore: Number(item.targetScore),
    }));

    setError("");
    setIsSaving(true);

    const success =
      mode === "subjects-only"
        ? await updateStudyGoals({
            studyGoals: {
              selectedSubjects,
              subjects: normalizedGoals,
            },
          })
        : await completeOnboarding({
            schoolSchedule: {
              morning,
              afternoon,
            },
            studyGoals: {
              selectedSubjects,
              subjects: normalizedGoals,
            },
          });

    setIsSaving(false);

    if (success) {
      onOpenChange(false);
    }
  };

  const handleAddSubject = async () => {
    const trimmedName = newSubjectName.trim().replace(/\s+/g, " ");

    if (!trimmedName) {
      setError("Nhập tên môn học trước khi thêm.");
      return;
    }

    setError("");
    setIsAddingSubject(true);

    try {
      const subject = await subjectService.createSubject(trimmedName);
      const nextOption = {
        id: subject.name,
        label: subject.name,
        icon: getSubjectIcon(subject.name) ?? BookOpen,
      };

      setAvailableSubjects((prev) => {
        if (prev.some((item) => item.id === nextOption.id)) {
          return prev;
        }

        return [...prev, nextOption].sort((a, b) => a.label.localeCompare(b.label, "vi"));
      });

      setSelectedSubjects((prev) =>
        prev.includes(subject.name) ? prev : [...prev, subject.name]
      );
      setSubjectGoals((prev) =>
        prev.some((item) => item.subject === subject.name)
          ? prev
          : [...prev, createDefaultGoal(subject.name)]
      );
      setNewSubjectName("");
      toast.success(`Đã thêm môn ${subject.name} vào hệ thống.`);
    } catch (createError) {
      console.error("Lỗi khi thêm môn học", createError);
      setError("Không thể thêm môn học mới. Hãy thử lại.");
    } finally {
      setIsAddingSubject(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent
        showCloseButton={false}
        className="max-h-[96dvh] max-w-[calc(100%-0.5rem)] overflow-hidden rounded-[1.1rem] border border-primary/10 p-0 shadow-[0_24px_56px_-28px_hsl(var(--primary)/0.28)] sm:max-h-[92vh] sm:max-w-[38rem] sm:rounded-[1.75rem] sm:shadow-[0_30px_70px_-32px_hsl(var(--primary)/0.35)]"
      >
        <div className="relative max-h-[96dvh] overflow-y-auto overflow-x-hidden bg-gradient-to-br from-white via-white to-primary/5 p-3 sm:max-h-[92vh] sm:p-6">
          <div className="pointer-events-none absolute -left-12 top-10 hidden h-48 w-48 rounded-full border border-primary/10 sm:block" />
          <div className="pointer-events-none absolute right-[-4.5rem] top-[-3rem] hidden h-40 w-40 bg-primary/8 blur-3xl sm:block" />

          {step === 1 ? (
            <>
              <DialogHeader className="relative text-left">
                <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-primary">
                  <BookOpen className="size-3.5" />
                  Bước 1 / 2
                </div>
                <DialogTitle className="font-auth-heading text-[1.6rem] font-black tracking-[-0.05em] text-foreground sm:text-[2.15rem]">
                  Thời gian biểu tại trường
                </DialogTitle>
                <DialogDescription className="max-w-[34rem] font-auth-body text-[0.95rem] leading-6 text-muted-foreground sm:text-base">
                  Thêm khung giờ học cố định để hệ thống loại trừ khỏi lịch học cá nhân của bạn.
                </DialogDescription>
              </DialogHeader>

              <div className="relative mt-3 grid gap-3 sm:mt-5 sm:gap-4">
                <section className="rounded-[1rem] border border-border/70 bg-white p-3 shadow-sm sm:rounded-[1.5rem] sm:p-5">
                  <div className="mb-3 flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-[1rem] bg-primary/10 text-primary sm:size-12 sm:rounded-2xl">
                      <Sun className="size-5 sm:size-6" />
                    </span>
                    <div>
                      <h3 className="font-auth-heading text-[1.15rem] font-bold tracking-[-0.04em] text-foreground sm:text-[1.35rem]">
                        Buổi sáng
                      </h3>
                      <p className="text-[0.82rem] text-muted-foreground sm:text-sm">
                        Khung giờ học cố định buổi sáng tại trường.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:text-sm">
                        Bắt đầu
                      </span>
                      <div className="relative">
                        <Clock3 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" />
                        <TimeField
                          value={morning.start}
                          onChange={(value) =>
                            setMorning((prev) => ({ ...prev, start: value }))
                          }
                        />
                      </div>
                    </label>

                    <label className="grid gap-2">
                      <span className="text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:text-sm">
                        Kết thúc
                      </span>
                      <div className="relative">
                        <Clock3 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" />
                        <TimeField
                          value={morning.end}
                          onChange={(value) =>
                            setMorning((prev) => ({ ...prev, end: value }))
                          }
                        />
                      </div>
                    </label>
                  </div>
                </section>

                <section className="rounded-[1rem] border border-border/70 bg-white p-3 shadow-sm sm:rounded-[1.5rem] sm:p-5">
                  <div className="mb-3 flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-[1rem] bg-orange-100 text-orange-600 sm:size-12 sm:rounded-2xl">
                      <Sunset className="size-5 sm:size-6" />
                    </span>
                    <div>
                      <h3 className="font-auth-heading text-[1.15rem] font-bold tracking-[-0.04em] text-foreground sm:text-[1.35rem]">
                        Buổi chiều
                      </h3>
                      <p className="text-[0.82rem] text-muted-foreground sm:text-sm">
                        Khung giờ học cố định buổi chiều tại trường.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:text-sm">
                        Bắt đầu
                      </span>
                      <div className="relative">
                        <Clock3 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" />
                        <TimeField
                          value={afternoon.start}
                          onChange={(value) =>
                            setAfternoon((prev) => ({ ...prev, start: value }))
                          }
                        />
                      </div>
                    </label>

                    <label className="grid gap-2">
                      <span className="text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:text-sm">
                        Kết thúc
                      </span>
                      <div className="relative">
                        <Clock3 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" />
                        <TimeField
                          value={afternoon.end}
                          onChange={(value) =>
                            setAfternoon((prev) => ({ ...prev, end: value }))
                          }
                        />
                      </div>
                    </label>
                  </div>
                </section>

                <div className="rounded-[0.95rem] border border-primary/15 bg-primary/5 px-3 py-2 text-[0.8rem] leading-5 text-primary/90 sm:rounded-[1.25rem] sm:px-4 sm:py-3 sm:text-sm sm:leading-6">
                  Hệ thống sẽ tự động trừ các khoảng thời gian này khỏi lịch học tập cá nhân của bạn.
                </div>
              </div>
            </>
          ) : (
            <>
              <DialogHeader className="relative text-left">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-primary">
                    {mode === "subjects-only" ? "Thiết lập môn học" : "Bước 2 / 2"}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {mode === "subjects-only" ? "Trang chủ" : "Giai đoạn thiết lập"}
                  </span>
                </div>
                {mode === "full" ? (
                  <div className="mb-5 h-2 overflow-hidden rounded-full bg-border/70">
                    <div className="h-full w-full rounded-full bg-gradient-primary" />
                  </div>
                ) : null}
                <DialogTitle className="font-auth-heading text-[1.55rem] font-black tracking-[-0.05em] text-foreground sm:text-[2rem]">
                  {mode === "subjects-only" ? "Chọn môn ôn thi của bạn" : "Mục tiêu học tập"}
                </DialogTitle>
                <DialogDescription className="max-w-[34rem] font-auth-body text-[0.95rem] leading-6 text-muted-foreground sm:text-base">
                  {mode === "subjects-only"
                    ? "Nếu chưa có môn trong danh sách, bạn có thể nhập thêm. Môn mới sẽ được lưu để những tài khoản khác chọn lại ngay."
                    : "Chọn môn thi và điểm số hiện tại để tối ưu lộ trình học cho bạn."}
                </DialogDescription>
              </DialogHeader>

              <div className="relative mt-3 grid gap-3 sm:mt-4 sm:gap-4">
                <section className="rounded-[1rem] border border-border/70 bg-white p-3 shadow-sm sm:rounded-[1.25rem] sm:p-5">
                  <p className="mb-3 text-[0.82rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Chọn môn thi của bạn
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {availableSubjects.map(({ id, label }) => {
                      const active = selectedSubjects.includes(id);

                      return (
                        <button
                          key={id}
                          type="button"
                          className={`rounded-full border px-3 py-1.5 text-[0.82rem] font-semibold transition-colors sm:px-4 sm:py-2 sm:text-sm ${
                            active
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-foreground hover:border-primary/40"
                          }`}
                          onClick={() => toggleSubject(id)}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <Input
                      type="text"
                      placeholder="Thêm môn chưa có trong danh sách"
                      value={newSubjectName}
                      onChange={(event) => setNewSubjectName(event.target.value)}
                      className="h-11 rounded-xl border-primary/15 bg-white sm:h-12"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 rounded-xl border-primary/20 text-primary sm:h-12"
                      onClick={handleAddSubject}
                      disabled={isAddingSubject}
                    >
                      <Plus className="size-4" />
                      {isAddingSubject ? "Đang thêm..." : "Thêm môn"}
                    </Button>
                  </div>
                </section>

                <div className="grid gap-2.5 sm:gap-3">
                  {selectedSubjects.map((subject) => {
                    const option = availableSubjects.find((item) => item.id === subject);
                    const Icon = option?.icon ?? BookOpen;

                    return (
                      <section
                        key={subject}
                        className="rounded-[1rem] border border-border/70 bg-white p-3 shadow-sm sm:rounded-[1.25rem] sm:p-4"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex size-11 items-center justify-center rounded-[1rem] bg-primary/8 text-primary">
                            <Icon className="size-5" />
                          </span>
                          <div>
                            <h3 className="font-auth-heading text-[1.2rem] font-bold tracking-[-0.03em] text-foreground">
                              {subject}
                            </h3>
                            <p className="text-[0.8rem] font-medium text-muted-foreground">
                              Đã thêm vào lộ trình học của bạn.
                            </p>
                          </div>
                        </div>
                      </section>
                    );
                  })}
                </div>

                <div className="rounded-[1rem] border border-dashed border-primary/35 bg-primary/5 px-3 py-3 sm:rounded-[1.15rem] sm:px-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-auth-heading text-[1.1rem] font-bold text-primary">
                        Cá nhân hóa lộ trình
                      </p>
                      <p className="mt-1 text-sm leading-6 text-foreground/75">
                        Hệ thống AI sẽ dựa trên các môn bạn chọn để gợi ý lộ trình và tài liệu phù hợp nhất.
                      </p>
                    </div>
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                      <BrainCircuit className="size-6" />
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {error ? (
            <p className="mt-4 text-sm font-medium text-destructive">{error}</p>
          ) : null}

          <div className="sticky bottom-0 -mx-3 mt-3 flex flex-col-reverse gap-2 border-t border-primary/10 bg-white/95 px-3 pb-1 pt-3 backdrop-blur sm:-mx-6 sm:mt-4 sm:flex-row sm:justify-between sm:px-6">
            <div className="flex gap-2">
              {step === 2 && mode === "full" ? (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setStep(1)}
                  disabled={isSaving}
                >
                  Quay lại
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Để sau
              </Button>
            </div>

            {step === 1 ? (
              <Button
                type="button"
                className="rounded-xl px-5"
                onClick={handleNextStep}
              >
                Tiếp theo
                <ChevronRight className="size-4" />
              </Button>
            ) : (
              <Button
                type="button"
                className="rounded-xl px-5"
                onClick={handleSubmit}
                disabled={isSaving}
              >
                {isSaving
                  ? mode === "subjects-only"
                    ? "Đang lưu môn thi..."
                    : "Đang tạo lộ trình..."
                  : mode === "subjects-only"
                    ? "Lưu môn ôn thi"
                    : "Hoàn tất & tạo lộ trình"}
                <Rocket className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

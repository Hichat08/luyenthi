import ExamSubmitConfirmDialog from "@/components/exam/ExamSubmitConfirmDialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { saveTodayProgressCache } from "@/lib/todayProgressStorage";
import { examService } from "@/services/examService";
import { rankingService } from "@/services/rankingService";
import type { PracticeExamDetail } from "@/types/exam";
import {
  ArrowLeft,
  BookOpenText,
  CheckCheck,
  Clock3,
  FileText,
  Save,
  SendHorizontal,
} from "lucide-react";
import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

const LiteratureExamPage = () => {
  const navigate = useNavigate();
  const { subjectSlug, examId } = useParams();
  const [exam, setExam] = useState<PracticeExamDetail | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [readingAnswer, setReadingAnswer] = useState("");
  const [essayAnswer, setEssayAnswer] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setExitAttemptCount] = useState(0);
  const exitAttemptCountRef = useRef(0);
  const exitEventsRef = useRef<string[]>([]);
  const autoSubmittedRef = useRef(false);

  useEffect(() => {
    if (!examId) {
      navigate("/practice", { replace: true });
      return;
    }

    let cancelled = false;

    const fetchExam = async () => {
      try {
        const examDetail = await examService.getExamDetail(examId);

        if (cancelled) {
          return;
        }

        if (examDetail.examType !== "essay" || (subjectSlug && examDetail.subjectSlug !== subjectSlug)) {
          navigate("/practice", { replace: true });
          return;
        }

        setExam(examDetail);
        setTimeLeft(examDetail.durationMinutes * 60);
        setExitAttemptCount(0);
        exitAttemptCountRef.current = 0;
        exitEventsRef.current = [];
        autoSubmittedRef.current = false;
      } catch (error) {
        if (!cancelled) {
          console.error("Lỗi khi lấy đề tự luận", error);
          toast.error("Không thể tải đề thi.");
          navigate("/practice", { replace: true });
        }
      }
    };

    void fetchExam();

    return () => {
      cancelled = true;
    };
  }, [examId, navigate, subjectSlug]);

  useEffect(() => {
    if (!exam || timeLeft === null) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((current) => (current !== null && current > 0 ? current - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [exam, timeLeft]);

  if (!exam || timeLeft === null || !exam.essayContent) {
    return null;
  }

  const minutes = `${Math.floor(timeLeft / 60)}`.padStart(2, "0");
  const seconds = `${timeLeft % 60}`.padStart(2, "0");
  const completedSections =
    Number(readingAnswer.trim().length > 0) + Number(essayAnswer.trim().length > 0);
  const progress = Math.round((completedSections / 2) * 100);

  const handleSubmitExam = async (
    antiCheatOverride?: {
      suspiciousExitCount: number;
      autoSubmittedForCheating: boolean;
      flaggedForReview: boolean;
      events: string[];
    }
  ) => {
    try {
      setIsSubmitting(true);
      const timeSpentSeconds = exam.durationMinutes * 60 - timeLeft;

      const submission = await rankingService.submitAttempt({
        examId: exam.examId,
        examTitle: exam.title,
        subject: exam.subject,
        correctCount: 0,
        wrongCount: 0,
        timeSpentSeconds,
        antiCheat:
          antiCheatOverride ?? {
            suspiciousExitCount: exitAttemptCountRef.current,
            autoSubmittedForCheating: false,
            flaggedForReview: exitAttemptCountRef.current >= 3,
            events: exitEventsRef.current,
          },
      });

      if (submission.todayProgress) {
        saveTodayProgressCache(submission.todayProgress);
      }

      toast.success("Đã nộp bài tự luận thành công.");
      navigate(`/practice/${exam.subjectSlug}`);
    } catch (error) {
      console.error("Lỗi khi nộp bài tự luận", error);
      toast.error("Không thể nộp bài. Hãy thử lại.");
    } finally {
      setIsSubmitting(false);
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <div className="min-h-svh bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted)/0.45)_100%)] text-foreground">
        <div className="mx-auto max-w-4xl pb-10">
          <header className="sticky top-0 z-30 border-b border-border/70 bg-background/92 px-4 py-4 backdrop-blur-xl">
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (
                      !window.confirm(
                        "Bạn có chắc muốn rời khỏi bài thi? Tiến trình hiện tại có thể bị mất."
                      )
                    ) {
                      return;
                    }

                    navigate(`/practice/${exam.subjectSlug}`);
                  }}
                  className="grid size-10 place-items-center rounded-xl text-primary transition hover:bg-primary/10"
                  aria-label="Quay lại danh sách đề"
                >
                  <ArrowLeft className="size-5" />
                </button>
                <div className="min-w-0">
                  <h1 className="truncate text-sm font-semibold text-foreground">
                    {exam.title}
                  </h1>
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-primary/70">
                    Phòng thi môn Văn
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden rounded-xl border border-primary/10 bg-primary/5 px-4 py-2 md:flex md:items-center md:gap-2">
                  <Clock3 className="size-4 text-primary" />
                  <span className="font-mono text-lg font-black text-primary">
                    {minutes}:{seconds}
                  </span>
                </div>
                <Button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  className="h-11 rounded-xl px-5 font-black"
                >
                  <SendHorizontal className="size-4" />
                  Nộp bài
                </Button>
              </div>
            </div>
          </header>

          <main className="mx-auto flex max-w-3xl flex-col gap-5 px-4 pt-6">
            <section className="rounded-[1.5rem] border border-primary/10 bg-card p-5 shadow-[0_22px_40px_-32px_hsl(var(--primary)/0.28)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">
                    Tiến độ hoàn thành
                  </p>
                  <p className="mt-1 text-lg font-black text-primary">
                    {completedSections}/2 phần
                  </p>
                </div>
                <div className="rounded-[0.9rem] border border-primary/10 bg-primary/5 px-3 py-1.5 md:hidden">
                  <span className="font-mono text-[1.05rem] font-black text-primary">
                    {minutes}:{seconds}
                  </span>
                </div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-primary/10">
                <div
                  className="h-full rounded-full bg-gradient-primary"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </section>

            <section className="rounded-[1.7rem] border border-primary/10 bg-card p-5 shadow-[0_24px_48px_-34px_hsl(var(--foreground)/0.14)]">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-[1rem] bg-primary/10 text-primary">
                  <BookOpenText className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-primary/70">
                    Phần I
                  </p>
                  <h2 className="font-auth-heading text-[1.35rem] font-black tracking-[-0.04em] text-foreground">
                    Đọc hiểu
                  </h2>
                </div>
              </div>

              <div className="mt-5 rounded-[1.2rem] border border-border/70 bg-muted/25 p-4 text-[0.98rem] leading-7 text-foreground/85">
                {exam.essayContent.readingPassage}
              </div>

              <div className="mt-5">
                <p className="mb-3 text-sm font-semibold text-foreground">
                  Câu hỏi: {exam.essayContent.readingQuestion}
                </p>
                <Textarea
                  value={readingAnswer}
                  onChange={(event) => setReadingAnswer(event.target.value)}
                  placeholder="Viết đoạn trả lời ngắn gọn của bạn..."
                  className="min-h-32 rounded-[1.2rem] border-border/70 bg-background px-4 py-3 text-base leading-7"
                />
              </div>
            </section>

            <section className="rounded-[1.7rem] border border-primary/10 bg-card p-5 shadow-[0_24px_48px_-34px_hsl(var(--foreground)/0.14)]">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-[1rem] bg-primary/10 text-primary">
                  <FileText className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-primary/70">
                    Phần II
                  </p>
                  <h2 className="font-auth-heading text-[1.35rem] font-black tracking-[-0.04em] text-foreground">
                    Làm văn
                  </h2>
                </div>
              </div>

              <div className="mt-5 rounded-[1.2rem] border border-dashed border-primary/25 bg-primary/5 p-4">
                <p className="text-sm font-semibold leading-7 text-foreground">
                  {exam.essayContent.essayPrompt}
                </p>
              </div>

              <Textarea
                value={essayAnswer}
                onChange={(event) => setEssayAnswer(event.target.value)}
                placeholder="Nhập bài làm của bạn tại đây..."
                className="mt-5 min-h-72 rounded-[1.2rem] border-border/70 bg-background px-4 py-3 text-base leading-7"
              />

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.1rem] border border-border/70 bg-muted/25 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <CheckCheck className="size-4 text-primary" />
                    <p className="text-sm font-bold text-foreground">Checklist nhanh</p>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {exam.essayContent.checklist.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-[1.1rem] border border-border/70 bg-muted/25 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Save className="size-4 text-primary" />
                    <p className="text-sm font-bold text-foreground">Trạng thái bài làm</p>
                  </div>
                  <p className="text-sm leading-7 text-muted-foreground">
                    {exam.essayContent.statusNote}
                  </p>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
      {exam ? (
        <AntiCheatGuard
          enabled={Boolean(exam && !isSubmitting)}
          onViolation={(nextCount, nextEvents) => {
            setExitAttemptCount(nextCount);

            if (nextCount >= 3) {
              if (autoSubmittedRef.current) {
                return;
              }

              autoSubmittedRef.current = true;
              toast.error("Bạn đã rời app 3 lần. Hệ thống tự động nộp bài và báo admin.");
              void handleSubmitExam({
                suspiciousExitCount: nextCount,
                autoSubmittedForCheating: true,
                flaggedForReview: true,
                events: nextEvents,
              });
              return;
            }

            toast.warning(`Cảnh báo gian lận: bạn đã rời app ${nextCount}/3 lần.`);
          }}
          exitAttemptCountRef={exitAttemptCountRef}
          exitEventsRef={exitEventsRef}
          autoSubmittedRef={autoSubmittedRef}
        />
      ) : null}
      <ExamSubmitConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        completedCount={completedSections}
        totalCount={2}
        unitLabel="phần"
        remainingLabel="phần chưa hoàn thành"
        isSubmitting={isSubmitting}
        onConfirm={() => void handleSubmitExam()}
      />
    </>
  );
};

export default LiteratureExamPage;

function AntiCheatGuard({
  enabled,
  onViolation,
  exitAttemptCountRef,
  exitEventsRef,
  autoSubmittedRef,
}: {
  enabled: boolean;
  onViolation: (nextCount: number, nextEvents: string[]) => void;
  exitAttemptCountRef: MutableRefObject<number>;
  exitEventsRef: MutableRefObject<string[]>;
  autoSubmittedRef: MutableRefObject<boolean>;
}) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const registerExitAttempt = (source: string) => {
      if (document.visibilityState !== "hidden" || autoSubmittedRef.current) {
        return;
      }

      const nextCount = exitAttemptCountRef.current + 1;
      const nextEvents = [...exitEventsRef.current, source];

      exitAttemptCountRef.current = nextCount;
      exitEventsRef.current = nextEvents;
      onViolation(nextCount, nextEvents);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        registerExitAttempt("visibility-hidden");
      }
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [autoSubmittedRef, enabled, exitAttemptCountRef, exitEventsRef, onViolation]);

  return null;
}

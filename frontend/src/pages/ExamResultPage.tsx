import { Button } from "@/components/ui/button";
import { readLastExamResult } from "@/lib/examResultStorage";
import { getSubjectIcon } from "@/lib/subjectMeta";
import { cn, calculateExamScore } from "@/lib/utils";
import type { TopicAnalysisItem } from "@/types/exam";
import type { ExamResultState } from "@/types/examResult";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Eye,
  RefreshCcw,
  Share2,
  Timer,
  Trophy,
} from "lucide-react";
import { useEffect, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router";

const toneClassName: Record<TopicAnalysisItem["tone"], string> = {
  primary: "bg-gradient-primary text-primary",
  orange: "bg-orange-500 text-orange-500",
  emerald: "bg-emerald-500 text-emerald-500",
};

const formatTime = (timeSpentSeconds: number) => {
  const safeSeconds = Math.max(timeSpentSeconds, 0);
  const minutes = `${Math.floor(safeSeconds / 60)}`.padStart(2, "0");
  const seconds = `${safeSeconds % 60}`.padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const formatScore = (score: number) => {
  const rounded = Math.round(score * 10) / 10;
  return Number.isInteger(rounded)
    ? `${rounded.toFixed(0)}.0`
    : rounded.toFixed(1);
};

const getResultMessage = (accuracy: number) => {
  if (accuracy >= 85) {
    return {
      title: "Làm tốt lắm!",
      description:
        "Bạn đã nắm vững phần lớn kiến thức trong đề thi này. Hãy tiếp tục duy trì phong độ để đạt kết quả cao nhất!",
    };
  }

  if (accuracy >= 65) {
    return {
      title: "Kết quả khá ổn",
      description:
        "Bạn đã có nền tảng tốt ở đề này. Rà lại các phần còn thiếu để kéo độ chính xác lên cao hơn ở lượt sau.",
    };
  }

  return {
    title: "Cần luyện thêm",
    description:
      "Bạn đã hoàn thành bài thi, nhưng vẫn còn một số phần kiến thức chưa chắc. Ôn lại từng chuyên đề rồi thử lại ngay khi còn nhớ lỗi.",
  };
};

const ExamResultPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { examId } = useParams();
  const result =
    (location.state as ExamResultState | null) ?? readLastExamResult(examId);

  useEffect(() => {
    if (!result) {
      navigate("/practice", { replace: true });
    }
  }, [navigate, result]);

  const accuracy = useMemo(() => {
    if (!result || result.totalQuestions <= 0) {
      return 0;
    }

    return Math.round((result.correctCount / result.totalQuestions) * 100);
  }, [result]);

  const score = useMemo(() => {
    if (!result || result.totalQuestions <= 0) {
      return 0;
    }

    return calculateExamScore(
      result.correctCount,
      result.totalQuestions,
      result.examTitle,
    );
  }, [result]);

  const resultMessage = useMemo(() => getResultMessage(accuracy), [accuracy]);

  if (!result) {
    return null;
  }

  const SubjectIcon = getSubjectIcon(result.subjectName);

  const handleShare = async () => {
    const shareText = `Mình vừa hoàn thành ${result.examTitle} với ${result.correctCount}/${result.totalQuestions} câu đúng, đạt ${formatScore(score)}/10.`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Kết quả bài thi",
          text: shareText,
        });
        return;
      }

      await navigator.clipboard.writeText(shareText);
      toast.success("Đã sao chép kết quả để chia sẻ.");
    } catch (error) {
      console.error("Lỗi khi chia sẻ kết quả", error);
      toast.error("Không thể chia sẻ kết quả lúc này.");
    }
  };

  const backToSource = () => {
    if (result.launchSource === "community") {
      navigate("/chat");
      return;
    }

    navigate(`/practice/${result.subjectSlug}`, {
      state: { subjectName: result.subjectName },
    });
  };

  return (
    <div className="min-h-svh bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted)/0.34)_100%)] text-foreground">
      <div className="mx-auto flex min-h-svh max-w-md flex-col pb-7">
        <header className="sticky top-0 z-30 border-b border-border/50 bg-background/88 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              type="button"
              onClick={backToSource}
              className="grid size-9 place-items-center rounded-full text-foreground transition hover:bg-muted"
              aria-label="Quay lại danh sách đề"
            >
              <ArrowLeft className="size-5" />
            </button>
            <h1 className="font-auth-heading text-[1.15rem] font-black tracking-[-0.04em] text-foreground">
              Kết quả bài thi
            </h1>
            <button
              type="button"
              onClick={() => void handleShare()}
              className="grid size-9 place-items-center rounded-full text-foreground transition hover:bg-muted"
              aria-label="Chia sẻ kết quả"
            >
              <Share2 className="size-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 space-y-4 px-4 pt-4">
          <section className="relative overflow-hidden rounded-[1.25rem] border border-white/12 bg-gradient-primary px-4 py-4 text-white shadow-[0_28px_56px_-30px_hsl(var(--primary)/0.7)]">
            <div className="absolute right-0 top-0 size-24 translate-x-1/3 -translate-y-1/3 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute bottom-0 left-0 size-20 -translate-x-1/3 translate-y-1/3 rounded-full bg-white/8 blur-xl" />

            <div className="relative text-center">
              <p className="text-[0.64rem] font-black uppercase tracking-[0.16em] text-white/78">
                Điểm số cuối cùng
              </p>
              <div className="mt-2.5 flex items-end justify-center gap-1">
                <span className="font-auth-heading text-[3rem] font-black leading-none tracking-[-0.07em]">
                  {formatScore(score)}
                </span>
                <span className="pb-1 text-[1.25rem] font-semibold text-white/62">
                  /10
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 border-t border-white/18 pt-3">
                <div className="border-r border-white/18 px-3">
                  <p className="text-[0.72rem] font-medium text-white/68">
                    Thời gian làm bài
                  </p>
                  <div className="mt-1 flex items-center justify-center gap-1.5 text-[0.84rem] font-black">
                    <Timer className="size-3.5" />
                    <span>{formatTime(result.timeSpentSeconds)}</span>
                  </div>
                </div>
                <div className="px-3">
                  <p className="text-[0.72rem] font-medium text-white/68">
                    Số câu đúng
                  </p>
                  <div className="mt-1 flex items-center justify-center gap-1.5 text-[0.84rem] font-black">
                    <CheckCircle2 className="size-3.5" />
                    <span>
                      {result.correctCount}/{result.totalQuestions}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-2.5">
            <article className="rounded-[1rem] border border-border/70 bg-card px-3 py-3.5 text-center shadow-[0_16px_32px_-28px_hsl(var(--foreground)/0.22)]">
              <div className="relative mx-auto size-16">
                <svg viewBox="0 0 100 100" className="size-full">
                  <circle
                    cx="50"
                    cy="50"
                    r="39"
                    fill="none"
                    className="stroke-slate-200 dark:stroke-slate-800"
                    strokeWidth="10"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="39"
                    fill="none"
                    className="stroke-[hsl(var(--primary))]"
                    strokeWidth="10"
                    strokeLinecap="round"
                    pathLength="100"
                    strokeDasharray={`${accuracy} 100`}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[0.98rem] font-black text-foreground">
                  {accuracy}%
                </div>
              </div>
              <p className="mt-2 text-[0.76rem] font-bold text-muted-foreground">
                Độ chính xác
              </p>
            </article>

            <article className="rounded-[1rem] border border-border/70 bg-card px-3 py-3.5 text-center shadow-[0_16px_32px_-28px_hsl(var(--foreground)/0.22)]">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-yellow-100 text-yellow-700">
                <Trophy className="size-6" />
              </div>
              <p className="mt-2 text-[0.68rem] font-black uppercase tracking-[0.02em] text-foreground">
                {result.rankingRank
                  ? `Hạng #${result.rankingRank}`
                  : "Mới tham gia"}
              </p>
              <p className="mt-1 text-[0.66rem] font-bold uppercase tracking-[0.06em] text-slate-500">
                Xếp hạng
              </p>
            </article>
          </section>

          <section className="flex gap-2.5 rounded-[1.05rem] border border-emerald-200/70 bg-emerald-50/80 px-3.5 py-3.5 shadow-[0_16px_32px_-28px_rgba(16,185,129,0.35)]">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
              <Check className="size-4.5" strokeWidth={3} />
            </div>
            <div>
              <h2 className="text-[0.88rem] font-black text-emerald-950">
                {resultMessage.title}
              </h2>
              <p className="mt-1 text-[0.78rem] leading-5 text-emerald-900/92">
                {resultMessage.description}
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-auth-heading text-[1.25rem] font-black tracking-[-0.04em] text-foreground">
              Phân tích chuyên đề
            </h2>
            <div className="rounded-[1.1rem] border border-border/70 bg-card px-3.5 py-3.5 shadow-[0_18px_36px_-28px_hsl(var(--foreground)/0.18)]">
              <div className="mb-3 flex items-center gap-2">
                <div className="grid size-9 place-items-center rounded-[0.8rem] bg-primary/10 text-primary">
                  <SubjectIcon className="size-4" />
                </div>
                <div>
                  <p className="text-[0.82rem] font-bold text-foreground">
                    {result.subjectName}
                  </p>
                  <p className="text-[0.68rem] font-semibold text-muted-foreground">
                    {result.examTitle}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {result.topicAnalysis.map((topic) => (
                  <article key={topic.label} className="space-y-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[0.82rem] font-semibold text-foreground">
                        {topic.label}
                      </span>
                      <span
                        className={cn(
                          "text-[0.82rem] font-black",
                          topic.tone === "primary" && "text-primary",
                          topic.tone === "orange" && "text-orange-500",
                          topic.tone === "emerald" && "text-emerald-500",
                        )}
                      >
                        {topic.percent}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          toneClassName[topic.tone],
                        )}
                        style={{ width: `${topic.percent}%` }}
                      />
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </main>

        <footer className="mt-auto space-y-2.5 px-4 pt-4">
          <Button
            type="button"
            onClick={() =>
              navigate(
                `/practice/${result.subjectSlug}/exam/${result.examId}/solutions`,
                {
                  state: result,
                },
              )
            }
            className="h-11.5 w-full rounded-[1rem] text-[0.84rem] font-black shadow-[0_20px_36px_-24px_hsl(var(--primary)/0.68)]"
          >
            <Eye className="size-4" />
            Xem lời giải chi tiết
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={backToSource}
            className="h-11.5 w-full rounded-[1rem] border-none bg-primary/10 text-[0.84rem] font-black text-primary shadow-none hover:bg-primary/14 hover:text-primary"
          >
            <RefreshCcw className="size-4" />
            Luyện tập lại
          </Button>
        </footer>
      </div>
    </div>
  );
};

export default ExamResultPage;

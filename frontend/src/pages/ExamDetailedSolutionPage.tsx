import RichQuestionContent from "@/components/exam/RichQuestionContent";
import { Button } from "@/components/ui/button";
import { readLastExamResult } from "@/lib/examResultStorage";
import { cn, calculateExamScore } from "@/lib/utils";
import type { ExamResultState } from "@/types/examResult";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Home,
  RefreshCcw,
  Share2,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router";

const formatScore = (score: number) => {
  const rounded = Math.round(score * 100) / 100;
  return Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(2);
};

const optionLabel = (index: number) => String.fromCharCode(65 + index);

const ExamDetailedSolutionPage = () => {
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

  const visibleQuestions = useMemo(() => {
    if (!result) {
      return [];
    }

    return result.questions.map((question) => {
      const selectedAnswer = result.selectedAnswers[question.id];
      const isCorrect = selectedAnswer === question.correctIndex;

      return {
        ...question,
        selectedAnswer,
        isCorrect,
      };
    });
  }, [result]);

  if (!result) {
    return null;
  }

  const handleShare = async () => {
    const shareText = `Mình vừa xem lời giải chi tiết của ${result.examTitle} và đạt ${formatScore(score)}/10.`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Lời giải chi tiết",
          text: shareText,
        });
        return;
      }

      await navigator.clipboard.writeText(shareText);
      toast.success("Đã sao chép nội dung để chia sẻ.");
    } catch (error) {
      console.error("Lỗi khi chia sẻ lời giải", error);
      toast.error("Không thể chia sẻ lúc này.");
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
    <div className="min-h-svh bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted)/0.3)_100%)] text-foreground">
      <div className="mx-auto flex min-h-svh max-w-md flex-col pb-28">
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/92 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-4">
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/practice/${result.subjectSlug}/exam/${result.examId}/result`,
                  {
                    state: result,
                  },
                )
              }
              className="grid size-10 place-items-center rounded-full text-primary transition hover:bg-primary/10"
              aria-label="Quay lại kết quả bài thi"
            >
              <ArrowLeft className="size-5" />
            </button>
            <h1 className="font-auth-heading text-[1.3rem] font-black tracking-[-0.05em] text-foreground">
              Lời giải chi tiết
            </h1>
            <button
              type="button"
              onClick={() => void handleShare()}
              className="grid size-10 place-items-center rounded-full text-primary transition hover:bg-primary/10"
              aria-label="Chia sẻ lời giải"
            >
              <Share2 className="size-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 pt-5">
          <section className="grid grid-cols-3 gap-3">
            <article className="rounded-[1.15rem] border border-emerald-100 bg-emerald-50/80 px-4 py-4">
              <p className="text-[0.72rem] font-black uppercase tracking-[0.14em] text-emerald-700">
                Số câu đúng
              </p>
              <p className="mt-2 text-[1.05rem] font-black text-emerald-600">
                {result.correctCount}/{result.totalQuestions}
              </p>
            </article>
            <article className="rounded-[1.15rem] border border-red-100 bg-red-50/80 px-4 py-4">
              <p className="text-[0.72rem] font-black uppercase tracking-[0.14em] text-red-600">
                Số câu sai
              </p>
              <p className="mt-2 text-[1.05rem] font-black text-red-600">
                {result.wrongCount}/{result.totalQuestions}
              </p>
            </article>
            <article className="rounded-[1.15rem] border border-primary/20 bg-primary/8 px-4 py-4">
              <p className="text-[0.72rem] font-black uppercase tracking-[0.14em] text-primary">
                Điểm số
              </p>
              <p className="mt-2 text-[1.05rem] font-black text-primary">
                {formatScore(score)}
              </p>
            </article>
          </section>

          <section className="mt-7">
            <h2 className="font-auth-heading text-[1.55rem] font-black tracking-[-0.05em] text-foreground">
              Danh sách câu hỏi
            </h2>

            <div className="mt-4 space-y-4">
              {visibleQuestions.map((question) => {
                const selectedLabel =
                  question.selectedAnswer !== undefined
                    ? optionLabel(question.selectedAnswer)
                    : null;
                const correctLabel = optionLabel(question.correctIndex);

                return (
                  <article
                    key={question.id}
                    className={cn(
                      "overflow-hidden rounded-[1.2rem] border bg-card shadow-[0_16px_34px_-28px_hsl(var(--foreground)/0.18)]",
                      question.isCorrect
                        ? "border-border/70"
                        : "border-r border-y border-border/70 border-l-4 border-l-red-500",
                    )}
                  >
                    <div className="flex items-start gap-4 px-4 py-4">
                      <div
                        className={cn(
                          "flex size-11 shrink-0 items-center justify-center rounded-full",
                          question.isCorrect
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-red-100 text-red-600",
                        )}
                      >
                        {question.isCorrect ? (
                          <CheckCircle2 className="size-5" />
                        ) : (
                          <XCircle className="size-5" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="space-y-2">
                          <p className="text-[0.98rem] font-black leading-7 text-foreground">
                            Câu {question.id}:
                          </p>
                          <RichQuestionContent
                            content={question.prompt}
                            className="space-y-3 text-[0.98rem] font-black leading-7 text-foreground"
                          />
                        </div>

                        {question.isCorrect ? (
                          <p className="mt-1.5 text-[0.88rem] font-bold text-emerald-600">
                            Đúng - Đáp án: {correctLabel}
                          </p>
                        ) : (
                          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                            <p className="text-[0.88rem] font-bold text-red-600">
                              Bạn chọn: {selectedLabel ?? "--"}
                            </p>
                            <p className="text-[0.88rem] font-bold text-emerald-600">
                              Đáp án đúng: {correctLabel}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {!question.isCorrect ? (
                      <div className="border-t border-border/70 bg-muted/20 px-4 py-4">
                        <div className="mb-3 flex items-center gap-2 text-primary">
                          <span className="text-sm">💡</span>
                          <span className="text-[0.92rem] font-black uppercase tracking-[0.06em]">
                            {question.explanationTitle}
                          </span>
                        </div>

                        <div className="space-y-3 text-[0.95rem] leading-8 text-foreground/88">
                          {question.explanationSteps.map((step) => (
                            <p key={step}>{step}</p>
                          ))}

                          {question.formula ? (
                            <div className="rounded-[0.95rem] border border-border/70 bg-background px-4 py-3 text-center text-[1rem] font-bold italic text-primary">
                              {question.formula}
                            </div>
                          ) : null}

                          <p className="font-semibold text-foreground">
                            {question.explanationConclusion}
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        </main>

        <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/92 px-4 py-4 backdrop-blur-xl">
          <div className="mx-auto flex max-w-md gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={backToSource}
              className="h-12 flex-1 rounded-[1rem] border-2 border-primary bg-transparent text-[0.95rem] font-black text-primary hover:bg-primary/5 hover:text-primary"
            >
              <Home className="size-4.5" />
              {result.launchSource === "community" ? "Về chat" : "Về trang chủ"}
            </Button>
            <Button
              type="button"
              onClick={backToSource}
              className="h-12 flex-1 rounded-[1rem] text-[0.95rem] font-black shadow-[0_18px_34px_-24px_hsl(var(--primary)/0.55)]"
            >
              <RefreshCcw className="size-4.5" />
              Luyện tập lại
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ExamDetailedSolutionPage;

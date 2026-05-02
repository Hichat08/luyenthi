import ExamSubmitConfirmDialog from "@/components/exam/ExamSubmitConfirmDialog";
import { buildCommunityExamResultMessage } from "@/components/chat/community-exam-message";
import RichQuestionContent from "@/components/exam/RichQuestionContent";
import { saveLastExamResult } from "@/lib/examResultStorage";
import {
  incrementTodayProgressCache,
  saveTodayProgressCache,
} from "@/lib/todayProgressStorage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calculateTopicAnalysis } from "@/lib/examAnalysis";
import { cn } from "@/lib/utils";
import { examService } from "@/services/examService";
import { rankingService } from "@/services/rankingService";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import type { ExamResultState } from "@/types/examResult";
import type { ExamQuestion, PracticeExamDetail } from "@/types/exam";
import {
  ArrowLeft,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Grid2x2,
  ListOrdered,
  Play,
  Shuffle,
  Square,
  Tag,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";

type TopicExamLaunchState = {
  selectedTopicLabels?: string[];
  questionLimit?: number;
  durationMinutes?: number;
  autoStart?: boolean;
  initialExamDetail?: PracticeExamDetail;
  launchSource?: "practice" | "community";
};

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const shuffleArray = <T,>(items: T[]) => {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
};

const buildInformaticsAttemptExamId = ({
  baseExamId,
  selectedTopicLabels,
  questionLimit,
  durationMinutes,
}: {
  baseExamId: string;
  selectedTopicLabels: string[];
  questionLimit: number;
  durationMinutes: number;
}) => {
  const normalizedTopics = [...selectedTopicLabels]
    .map((label) => label.trim())
    .filter(Boolean)
    .sort()
    .join("|");

  return [
    baseExamId,
    "attempt",
    questionLimit,
    durationMinutes,
    normalizedTopics || "all-topics",
    Date.now(),
  ].join("__");
};

const calculateInformaticsMockScore = (
  questions: ExamQuestion[],
  answers: Record<number, number>,
) => {
  const scoreByTfCorrectCount = [0, 0.1, 0.25, 0.5, 1];
  let totalScore = 0;
  let trueFalseBucket: boolean[] = [];

  questions.forEach((question, index) => {
    const picked = answers[question.id];
    const isCorrect = picked === question.correctIndex;
    const isTrueFalse = question.topicLabel?.trim() === "Đúng/Sai";

    if (!isTrueFalse && index < 24) {
      totalScore += isCorrect ? 0.25 : 0;
      return;
    }

    if (isTrueFalse) {
      trueFalseBucket.push(isCorrect);
      if (trueFalseBucket.length === 4) {
        const correctInGroup = trueFalseBucket.filter(Boolean).length;
        totalScore += scoreByTfCorrectCount[correctInGroup] ?? 0;
        trueFalseBucket = [];
      }
    }
  });

  return Math.round(totalScore * 100) / 100;
};

const MultipleChoiceExamPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { subjectSlug, examId } = useParams();
  const user = useAuthStore((state) => state.user);
  const launchState = (location.state ?? null) as TopicExamLaunchState | null;
  const [exam, setExam] = useState<PracticeExamDetail | null>(null);
  const [preparedQuestions, setPreparedQuestions] = useState<ExamQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingExam, setIsLoadingExam] = useState(
    !launchState?.initialExamDetail || launchState.initialExamDetail.examId !== examId
  );
  const [selectedTopicLabels, setSelectedTopicLabels] = useState<string[]>([]);
  const [questionLimit, setQuestionLimit] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [attemptExamId, setAttemptExamId] = useState<string | null>(null);
  const [, setExitAttemptCount] = useState(0);
  const [, setExitEvents] = useState<string[]>([]);
  const exitAttemptCountRef = useRef(0);
  const exitEventsRef = useRef<string[]>([]);
  const autoSubmittedRef = useRef(false);

  useEffect(() => {
    if (!examId) {
      navigate("/practice", { replace: true });
      return;
    }

    let cancelled = false;

    const applyExamDetail = (examDetail: PracticeExamDetail) => {
      const topicLabels = Array.from(
        new Set(
          examDetail.questions
            .map((question) => question.topicLabel?.trim())
            .filter((label): label is string => Boolean(label))
        )
      );

      setExam(examDetail);
      setPreparedQuestions([]);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setTimeLeft(null);
      setConfirmOpen(false);
      setHasStarted(false);
      setAttemptExamId(null);
      setExitAttemptCount(0);
      setExitEvents([]);
      exitAttemptCountRef.current = 0;
      exitEventsRef.current = [];
      autoSubmittedRef.current = false;
      setSelectedTopicLabels(
        launchState?.selectedTopicLabels?.length ? launchState.selectedTopicLabels : topicLabels
      );
      setQuestionLimit(
        launchState?.questionLimit
          ? launchState.questionLimit
          : examDetail.subjectSlug === "tin-hoc"
            ? Math.min(40, examDetail.questions.length)
            : Math.min(examDetail.questionCount, examDetail.questions.length)
      );
      setDurationMinutes(launchState?.durationMinutes ?? examDetail.durationMinutes);
      setIsLoadingExam(false);
    };

    if (
      launchState?.initialExamDetail &&
      launchState.initialExamDetail.examId === examId &&
      (!subjectSlug || launchState.initialExamDetail.subjectSlug === subjectSlug)
    ) {
      applyExamDetail(launchState.initialExamDetail);
      return;
    }

    const fetchExam = async () => {
      try {
        setIsLoadingExam(true);
        const examDetail = await examService.getExamDetail(examId);

        if (cancelled) {
          return;
        }

        if (
          examDetail.examType !== "multiple_choice" ||
          (subjectSlug && examDetail.subjectSlug !== subjectSlug)
        ) {
          navigate("/practice", { replace: true });
          return;
        }

        applyExamDetail(examDetail);
      } catch (error) {
        if (!cancelled) {
          console.error("Lỗi khi lấy chi tiết đề thi", error);
          toast.error("Không thể tải đề thi.");
          navigate("/practice", { replace: true });
        }
      } finally {
        if (!cancelled) {
          setIsLoadingExam(false);
        }
      }
    };

    void fetchExam();

    return () => {
      cancelled = true;
    };
  }, [examId, launchState?.durationMinutes, launchState?.questionLimit, launchState?.selectedTopicLabels, navigate, subjectSlug]);

  const topicOptions = useMemo(() => {
    if (!exam) {
      return [];
    }

    return Array.from(
      new Set(
        exam.questions
          .map((question) => question.topicLabel?.trim())
          .filter((label): label is string => Boolean(label))
      )
    );
  }, [exam]);

  const availableQuestions = useMemo(() => {
    if (!exam) {
      return [];
    }

    if (topicOptions.length === 0 || selectedTopicLabels.length === 0) {
      return selectedTopicLabels.length === 0 && topicOptions.length > 0 ? [] : exam.questions;
    }

    const selectedSet = new Set(selectedTopicLabels);
    return exam.questions.filter((question) => selectedSet.has(question.topicLabel?.trim() || ""));
  }, [exam, selectedTopicLabels, topicOptions]);

  useEffect(() => {
    if (!hasStarted || !preparedQuestions.length || timeLeft === null) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current === null) {
          return current;
        }

        return current > 0 ? current - 1 : 0;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [hasStarted, preparedQuestions.length, timeLeft]);

  const handleSubmitExam = async (
    autoSubmit = false,
    antiCheatOverride?: {
      suspiciousExitCount: number;
      autoSubmittedForCheating: boolean;
      flaggedForReview: boolean;
      events: string[];
    }
  ) => {
    if (!exam || !preparedQuestions.length || timeLeft === null || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);

      const selectedEntries = Object.entries(selectedAnswers);
      const correctCount = selectedEntries.reduce((count, [questionId, answerIndex]) => {
        const question = preparedQuestions.find((item) => item.id === Number(questionId));
        return count + Number(question?.correctIndex === answerIndex);
      }, 0);
      const wrongCount = selectedEntries.length - correctCount;
      const customScore =
        exam.subjectSlug === "tin-hoc" && preparedQuestions.length >= 40
          ? calculateInformaticsMockScore(preparedQuestions, selectedAnswers)
          : undefined;
      const timeSpentSeconds = durationMinutes * 60 - timeLeft;
      const rankingExamId =
        exam.subjectSlug === "tin-hoc"
          ? attemptExamId ?? buildInformaticsAttemptExamId({
              baseExamId: exam.examId,
              selectedTopicLabels,
              questionLimit: preparedQuestions.length,
              durationMinutes,
            })
          : exam.examId;

      const submission = await rankingService.submitAttempt({
        examId: rankingExamId,
        examTitle: exam.title,
        subject: exam.subject,
        correctCount,
        wrongCount,
        timeSpentSeconds,
        antiCheat:
          antiCheatOverride ?? {
            suspiciousExitCount: exitAttemptCountRef.current,
            autoSubmittedForCheating: false,
            flaggedForReview: exitAttemptCountRef.current >= 3,
            events: exitEventsRef.current,
          },
      });

      const resultState: ExamResultState = {
        examId: exam.examId,
        examTitle: exam.title,
        subjectSlug: exam.subjectSlug,
        subjectName: exam.subject,
        launchSource: launchState?.launchSource ?? "practice",
        correctCount,
        wrongCount,
        totalQuestions: preparedQuestions.length,
        timeSpentSeconds,
        rankingRank: submission.rankingStats.rank,
        topicAnalysis: calculateTopicAnalysis(preparedQuestions, selectedAnswers),
        selectedAnswers,
        questions: preparedQuestions,
        score: customScore,
      };

      saveLastExamResult(resultState);
      if (submission.todayProgress) {
        saveTodayProgressCache(submission.todayProgress);
      } else {
        incrementTodayProgressCache();
      }

      if (launchState?.launchSource === "community") {
        try {
          await useChatStore.getState().sendCommunityMessage(
            buildCommunityExamResultMessage({
              displayName:
                user?.displayName?.trim() || user?.username || "Một thành viên",
              examTitle: exam.title,
              correctCount,
              totalQuestions: preparedQuestions.length,
              score:
                customScore ??
                (preparedQuestions.length > 0
                  ? (correctCount / preparedQuestions.length) * 10
                  : 0),
              timeSpentSeconds,
            })
          );
        } catch (communityError) {
          console.error("Lỗi khi gửi kết quả vào Community", communityError);
        }
      }

      toast.success(autoSubmit ? "Hết giờ, bài thi đã được nộp." : "Đã nộp bài thành công.");
      navigate(`/practice/${exam.subjectSlug}/exam/${exam.examId}/result`, {
        state: resultState,
      });
    } catch (error) {
      console.error("Lỗi khi nộp bài trắc nghiệm", error);
      toast.error("Không thể nộp bài. Hãy thử lại.");
    } finally {
      setIsSubmitting(false);
      setConfirmOpen(false);
    }
  };

  useEffect(() => {
    if (!hasStarted || timeLeft !== 0) {
      return;
    }

    void handleSubmitExam(true);
  }, [hasStarted, timeLeft]);

  useEffect(() => {
    if (!hasStarted) {
      return;
    }

    const registerExitAttempt = (source: string) => {
      if (document.visibilityState !== "hidden" || autoSubmittedRef.current || isSubmitting) {
        return;
      }

      const nextCount = exitAttemptCountRef.current + 1;
      const nextEvents = [...exitEventsRef.current, source];

      exitAttemptCountRef.current = nextCount;
      exitEventsRef.current = nextEvents;
      setExitAttemptCount(nextCount);
      setExitEvents(nextEvents);

      if (nextCount >= 3) {
        autoSubmittedRef.current = true;
        toast.error("Bạn đã rời app 3 lần. Hệ thống tự động nộp bài và báo admin.");
        void handleSubmitExam(true, {
          suspiciousExitCount: nextCount,
          autoSubmittedForCheating: true,
          flaggedForReview: true,
          events: nextEvents,
        });
        return;
      }

      toast.warning(`Cảnh báo gian lận: bạn đã rời app ${nextCount}/3 lần.`);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        registerExitAttempt("visibility-hidden");
      }
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasStarted || isSubmitting) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasStarted, isSubmitting]);

  const handleToggleTopic = (topicLabel: string) => {
    setSelectedTopicLabels((current) =>
      current.includes(topicLabel)
        ? current.filter((item) => item !== topicLabel)
        : [...current, topicLabel]
    );
  };

  const handleToggleAllTopics = () => {
    setSelectedTopicLabels((current) =>
      current.length === topicOptions.length ? [] : [...topicOptions]
    );
  };

  const handleStartExam = () => {
    if (!exam) {
      return;
    }

    if (availableQuestions.length === 0) {
      toast.error("Hãy chọn ít nhất một chuyên đề có câu hỏi.");
      return;
    }

    const normalizedQuestionLimit = clampNumber(
      Number(questionLimit) || exam.questionCount,
      1,
      availableQuestions.length
    );
    const normalizedDuration = clampNumber(Number(durationMinutes) || exam.durationMinutes, 1, 180);

    const randomizedQuestions = shuffleArray(availableQuestions)
      .slice(0, normalizedQuestionLimit)
      .map((question, index) => {
        const shuffledOptions = shuffleArray(
          question.options.map((option, optionIndex) => ({
            option,
            isCorrect: optionIndex === question.correctIndex,
          }))
        );

        return {
          ...question,
          id: index + 1,
          options: shuffledOptions.map((item) => item.option),
          correctIndex: shuffledOptions.findIndex((item) => item.isCorrect),
        };
      });

    setQuestionLimit(normalizedQuestionLimit);
    setDurationMinutes(normalizedDuration);
    setPreparedQuestions(randomizedQuestions);
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setTimeLeft(normalizedDuration * 60);
    setHasStarted(true);
    setAttemptExamId(
      exam.subjectSlug === "tin-hoc"
        ? buildInformaticsAttemptExamId({
            baseExamId: exam.examId,
            selectedTopicLabels,
            questionLimit: normalizedQuestionLimit,
            durationMinutes: normalizedDuration,
          })
        : exam.examId
    );
  };

  useEffect(() => {
    if (!exam || !launchState?.autoStart || hasStarted || selectedTopicLabels.length === 0) {
      return;
    }

    handleStartExam();
  }, [exam, hasStarted, launchState?.autoStart, selectedTopicLabels]);

  if (isLoadingExam) {
    return (
      <div className="min-h-svh bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted)/0.35)_100%)] text-foreground">
        <div className="mx-auto flex min-h-svh max-w-4xl items-center justify-center px-4">
          <div className="w-full max-w-md rounded-[1.5rem] border border-primary/10 bg-card/92 px-6 py-8 text-center shadow-[0_24px_54px_-34px_hsl(var(--primary)/0.24)]">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Clock3 className="size-6 animate-pulse" />
            </div>
            <h1 className="mt-4 font-auth-heading text-[1.4rem] font-black tracking-[-0.04em] text-foreground">
              Đang chuẩn bị bài thi
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Hệ thống đang nạp câu hỏi và cấu hình đề. Màn hình thi sẽ mở ngay sau khi sẵn sàng.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!exam || exam.questions.length === 0) {
    return null;
  }

  const activeQuestions = hasStarted ? preparedQuestions : [];
  const currentQuestion = activeQuestions[currentQuestionIndex] ?? null;
  const answeredCount = Object.keys(selectedAnswers).length;
  const progress = activeQuestions.length
    ? Math.round((answeredCount / activeQuestions.length) * 100)
    : 0;
  const minutes = `${Math.floor((timeLeft ?? 0) / 60)}`.padStart(2, "0");
  const seconds = `${(timeLeft ?? 0) % 60}`.padStart(2, "0");
  const allTopicsSelected = topicOptions.length > 0 && selectedTopicLabels.length === topicOptions.length;

  const handleSelectAnswer = (questionId: number, optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));

    setCurrentQuestionIndex((current) =>
      current < activeQuestions.length - 1 ? current + 1 : current
    );
  };

  const handleNavigateBack = () => {
    if (
      hasStarted &&
      !window.confirm("Bạn có chắc muốn rời khỏi bài thi? Tiến trình hiện tại có thể bị mất.")
    ) {
      return;
    }

    if (launchState?.launchSource === "community") {
      navigate("/chat");
      return;
    }

    navigate(`/practice/${exam.subjectSlug}`);
  };

  return (
    <>
      <div className="min-h-svh bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted)/0.35)_100%)] text-foreground">
        <div className="mx-auto flex min-h-svh max-w-5xl flex-col shadow-sm">
          <header className="sticky top-0 z-40 flex items-center justify-between border-b border-primary/10 bg-background/92 px-4 py-3 backdrop-blur-md">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={handleNavigateBack}
                className="grid size-10 place-items-center rounded-xl text-primary transition hover:bg-primary/10"
                aria-label="Quay lại danh sách đề"
              >
                <ArrowLeft className="size-5" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-sm font-semibold text-foreground">{exam.title}</h1>
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-primary/70">
                  Luyện thi sốp cộp
                </span>
              </div>
            </div>

            {hasStarted ? (
              <div className="flex items-center gap-4">
                <div className="hidden items-end text-right md:flex md:flex-col">
                  <span className="text-[10px] font-medium uppercase text-muted-foreground">
                    Thời gian còn lại
                  </span>
                  <span className="font-mono text-lg font-black text-primary">
                    {minutes}:{seconds}
                  </span>
                </div>
                <Button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  className="h-11 rounded-xl px-5 font-black shadow-[0_18px_30px_-18px_hsl(var(--primary)/0.45)]"
                >
                  Nộp bài
                </Button>
              </div>
            ) : (
              <div className="hidden rounded-xl border border-primary/10 bg-primary/5 px-4 py-2 text-right md:block">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-primary/70">
                  Ngân hàng câu hỏi
                </p>
                <p className="text-sm font-black text-primary">{exam.questions.length} câu</p>
              </div>
            )}
          </header>

          {hasStarted ? (
            <>
              <div className="border-b border-primary/5 bg-background px-4 py-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    Tiến độ làm bài:{" "}
                    <span className="font-bold text-primary">
                      {answeredCount}/{activeQuestions.length} câu
                    </span>
                  </p>
                  <p className="text-xs font-black text-primary/80">{progress}%</p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-primary/10">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <main className="flex flex-1 flex-col overflow-hidden md:flex-row">
                <section className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                  <div className="md:hidden">
                    <div className="mb-6 flex items-center justify-center">
                      <div className="flex items-center gap-2.5 rounded-[1rem] border border-primary/10 bg-primary/5 px-4 py-2.5">
                        <Clock3 className="size-4.5 text-primary" />
                        <span className="font-mono text-[1.7rem] font-black text-primary">
                          {minutes}:{seconds}
                        </span>
                      </div>
                    </div>
                  </div>

                  {currentQuestion ? (
                    <div className="space-y-6">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-primary px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-primary-foreground">
                          Câu {currentQuestion.id}
                        </span>
                        <div className="h-[2px] flex-1 bg-primary/5" />
                      </div>

                      {currentQuestion.topicLabel ? (
                        <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary">
                          <Tag className="size-3.5" />
                          <span>{currentQuestion.topicLabel}</span>
                        </div>
                      ) : null}

                      <RichQuestionContent
                        content={currentQuestion.prompt}
                        className="space-y-3 text-lg font-semibold leading-relaxed text-foreground md:text-[1.65rem] md:leading-[1.5]"
                      />

                      {currentQuestion.imageUrl ? (
                        <div className="mx-auto w-full max-w-2xl">
                          <img
                            src={currentQuestion.imageUrl}
                            alt={`Minh họa câu ${currentQuestion.id}`}
                            className="w-full object-contain"
                          />
                        </div>
                      ) : null}

                      <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2">
                        {currentQuestion.options.map((option, optionIndex) => {
                          const selected = selectedAnswers[currentQuestion.id] === optionIndex;

                          return (
                            <button
                              key={`${currentQuestion.id}-${optionIndex}`}
                              type="button"
                              onClick={() => handleSelectAnswer(currentQuestion.id, optionIndex)}
                              className={cn(
                                "flex items-center rounded-[1.2rem] border-2 bg-card p-4 text-left transition-all",
                                selected
                                  ? "border-primary bg-primary/5"
                                  : "border-primary/10 hover:border-primary"
                              )}
                            >
                              <span
                                className={cn(
                                  "mr-4 flex size-10 shrink-0 items-center justify-center rounded-xl font-black",
                                  selected
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-primary/10 text-primary"
                                )}
                              >
                                {String.fromCharCode(65 + optionIndex)}
                              </span>
                              <span
                                className={cn(
                                  "min-w-0 flex-1 text-sm md:text-base",
                                  selected
                                    ? "font-bold text-primary"
                                    : "font-medium text-foreground"
                                )}
                              >
                                <RichQuestionContent
                                  content={option}
                                  className="space-y-2 text-sm md:text-base"
                                />
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between border-t border-primary/5 pt-10">
                        <button
                          type="button"
                          onClick={() =>
                            setCurrentQuestionIndex((current) => Math.max(0, current - 1))
                          }
                          disabled={currentQuestionIndex === 0}
                          className="flex items-center gap-2 rounded-lg px-4 py-2 font-semibold text-primary transition hover:bg-primary/10 disabled:pointer-events-none disabled:opacity-30"
                        >
                          <ChevronLeft className="size-4" />
                          Câu trước
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setCurrentQuestionIndex((current) =>
                              Math.min(activeQuestions.length - 1, current + 1)
                            )
                          }
                          className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:opacity-90 dark:bg-white dark:text-slate-900"
                        >
                          Câu tiếp theo
                          <ChevronRight className="size-4" />
                        </button>
                      </div>
                    </div>
                  ) : null}
                </section>

                <aside className="w-full border-t border-primary/5 bg-background p-4 md:w-80 md:overflow-y-auto md:border-l md:border-t-0 lg:w-96">
                  <div className="sticky top-0 bg-background pb-4">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-foreground">
                      <Grid2x2 className="size-4 text-primary" />
                      Danh sách câu hỏi
                    </h3>
                    <div className="mb-4 flex gap-4 text-[10px] font-bold uppercase">
                      <div className="flex items-center gap-1.5">
                        <div className="size-3 rounded bg-primary" />
                        Đã làm
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="size-3 rounded border-2 border-primary/30" />
                        Chưa làm
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="size-3 rounded bg-amber-400" />
                        Đang xem
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    {activeQuestions.map((question, index) => {
                      const active = index === currentQuestionIndex;
                      const answered = selectedAnswers[question.id] !== undefined;

                      return (
                        <button
                          key={question.id}
                          type="button"
                          onClick={() => setCurrentQuestionIndex(index)}
                          className={cn(
                            "aspect-square rounded-lg text-sm font-black transition",
                            active
                              ? "bg-amber-400 text-white ring-2 ring-amber-400 ring-offset-2 ring-offset-background"
                              : answered
                                ? "bg-primary text-primary-foreground"
                                : "border-2 border-primary/10 text-muted-foreground hover:border-primary/50"
                          )}
                        >
                          {question.id}
                        </button>
                      );
                    })}

                    <div className="col-span-5 flex justify-center py-4">
                      <div className="flex flex-col items-center opacity-40">
                        <ListOrdered className="size-4" />
                        <span className="text-xs">... tới câu {activeQuestions.length}</span>
                      </div>
                    </div>
                  </div>
                </aside>
              </main>
            </>
          ) : (
            <main className="mx-auto flex w-full max-w-4xl flex-1 items-start justify-center px-4 py-6 md:px-6 md:py-8">
              <section className="w-full rounded-[1.6rem] border border-primary/10 bg-card p-5 shadow-[0_24px_54px_-34px_hsl(var(--primary)/0.28)] md:p-7">
                <div className="flex flex-col gap-3 border-b border-primary/10 pb-5 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-[0.72rem] font-black uppercase tracking-[0.16em] text-primary/70">
                      Cấu hình đề luyện
                    </p>
                    <h2 className="mt-2 text-[1.4rem] font-black tracking-[-0.04em] text-foreground md:text-[1.8rem]">
                      Chọn chuyên đề, số câu và thời gian làm bài
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Ngân hàng hiện có {exam.questions.length} câu hỏi. Hệ thống sẽ lấy toàn bộ
                      dữ liệu đã nạp, lọc theo chuyên đề bạn chọn và đảo ngẫu nhiên câu hỏi cùng
                      đáp án trước khi bắt đầu.
                    </p>
                  </div>

                  <div className="rounded-[1.1rem] border border-primary/10 bg-primary/5 px-4 py-3 text-sm font-bold text-primary">
                    {availableQuestions.length} câu khả dụng
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <article className="rounded-[1.25rem] border border-border/70 bg-background px-4 py-4 shadow-[0_14px_28px_-24px_hsl(var(--foreground)/0.18)]">
                    <label
                      htmlFor="question-limit"
                      className="mb-2 flex items-center gap-2 text-sm font-black text-foreground"
                    >
                      <ListOrdered className="size-4 text-primary" />
                      Số lượng câu hỏi
                    </label>
                    <Input
                      id="question-limit"
                      type="number"
                      min={1}
                      max={Math.max(1, availableQuestions.length)}
                      value={questionLimit}
                      onChange={(event) => setQuestionLimit(Number(event.target.value))}
                      className="h-12 rounded-[1rem] border-primary/15 bg-card"
                    />
                    <p className="mt-2 text-xs font-semibold text-muted-foreground">
                      Tối đa {availableQuestions.length} câu theo chuyên đề đang chọn.
                    </p>
                  </article>

                  <article className="rounded-[1.25rem] border border-border/70 bg-background px-4 py-4 shadow-[0_14px_28px_-24px_hsl(var(--foreground)/0.18)]">
                    <label
                      htmlFor="duration-minutes"
                      className="mb-2 flex items-center gap-2 text-sm font-black text-foreground"
                    >
                      <Clock3 className="size-4 text-primary" />
                      Thời gian làm bài (phút)
                    </label>
                    <Input
                      id="duration-minutes"
                      type="number"
                      min={1}
                      max={180}
                      value={durationMinutes}
                      onChange={(event) => setDurationMinutes(Number(event.target.value))}
                      className="h-12 rounded-[1rem] border-primary/15 bg-card"
                    />
                    <p className="mt-2 text-xs font-semibold text-muted-foreground">
                      Thời gian sẽ bắt đầu đếm ngay sau khi tạo đề.
                    </p>
                  </article>
                </div>

                <article className="mt-5 rounded-[1.3rem] border border-border/70 bg-background p-4 shadow-[0_14px_32px_-26px_hsl(var(--foreground)/0.18)]">
                  <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-[0.14em] text-foreground">
                        Chọn chuyên đề
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Đã chọn {selectedTopicLabels.length}/{topicOptions.length} chuyên đề.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleAllTopics}
                      className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3.5 py-2 text-sm font-bold text-primary transition hover:bg-primary/10"
                    >
                      {allTopicsSelected ? (
                        <CheckSquare className="size-4" />
                      ) : (
                        <Square className="size-4" />
                      )}
                      {allTopicsSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                    </button>
                  </div>

                  <div className="beautiful-scrollbar max-h-[22rem] space-y-2 overflow-y-auto pr-1">
                    {topicOptions.map((topicLabel) => {
                      const checked = selectedTopicLabels.includes(topicLabel);

                      return (
                        <label
                          key={topicLabel}
                          className={cn(
                            "flex cursor-pointer items-start gap-3 rounded-[1rem] border px-3.5 py-3 text-sm transition",
                            checked
                              ? "border-primary/30 bg-primary/5"
                              : "border-border/70 bg-card hover:border-primary/20"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleTopic(topicLabel)}
                            className="mt-1 size-4 accent-[hsl(var(--primary))]"
                          />
                          <span className="font-medium leading-6 text-foreground">{topicLabel}</span>
                        </label>
                      );
                    })}
                  </div>
                </article>

                <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="rounded-[1.1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium leading-6 text-amber-900">
                    Hệ thống sẽ đảo thứ tự câu hỏi và đảo đáp án từng câu theo bộ đề mới.
                  </div>

                  <Button
                    type="button"
                    onClick={handleStartExam}
                    className="h-12 rounded-[1rem] px-5 text-sm font-black shadow-[0_20px_38px_-24px_hsl(var(--primary)/0.55)]"
                  >
                    <Shuffle className="size-4" />
                    Đảo câu hỏi và bắt đầu
                    <Play className="size-4" />
                  </Button>
                </div>
              </section>
            </main>
          )}
        </div>
      </div>

      <ExamSubmitConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={() => void handleSubmitExam(false)}
        completedCount={answeredCount}
        totalCount={activeQuestions.length}
        unitLabel="câu"
        remainingLabel="câu chưa trả lời"
        isSubmitting={isSubmitting}
      />
    </>
  );
};

export default MultipleChoiceExamPage;

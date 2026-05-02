import MobileBottomNav, {
  type MobileBottomNavItem,
} from "@/components/navigation/MobileBottomNav";
import DashboardGreetingHeader from "@/components/navigation/DashboardGreetingHeader";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { useNotificationStore } from "@/stores/useNotificationStore";
import {
  BarChart3,
  BookOpen,
  Home,
  MessageCircle,
  UserRound,
} from "lucide-react";
import {
  midFinalExamMultipleChoiceAnswers,
  midFinalExamMultipleChoiceQuestions,
  midFinalExamTrueFalseAnswers,
  midFinalExamTrueFalseQuestions,
} from "@/lib/midFinalExamQuestions";

const MidFinalExamPracticePage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const {
    chatUnreadCount,
    conversations,
    fetchCommunityConversation,
    fetchConversations,
  } = useChatStore();
  const { unreadCount, syncNotifications } = useNotificationStore();
  const [multipleChoiceQuestions, setMultipleChoiceQuestions] = useState(
    midFinalExamMultipleChoiceQuestions,
  );
  const [trueFalseQuestions, setTrueFalseQuestions] = useState(
    midFinalExamTrueFalseQuestions,
  );
  const [selectedMcAnswers, setSelectedMcAnswers] = useState<
    Record<number, string>
  >({});
  const [selectedTfAnswers, setSelectedTfAnswers] = useState<
    Record<string, boolean>
  >({});
  const [submissionResult, setSubmissionResult] = useState<string>("");

  const quizCount = multipleChoiceQuestions.length;
  const trueFalseCount = trueFalseQuestions.length;

  const mobileBottomNavItems: MobileBottomNavItem[] = [
    {
      key: "home",
      label: "Trang chủ",
      icon: Home,
      onClick: () => navigate("/home"),
    },
    {
      key: "roadmap",
      label: "Luyện thi",
      icon: BookOpen,
      onClick: () => navigate("/practice"),
    },
    {
      key: "stats",
      label: "Kết quả",
      icon: BarChart3,
      onClick: () => navigate("/ranking"),
    },
    {
      key: "chat",
      label: "Chat",
      icon: MessageCircle,
      badgeCount: chatUnreadCount,
      onClick: async () => {
        await fetchCommunityConversation();
        navigate("/chat");
      },
    },
    {
      key: "profile",
      label: "Cá nhân",
      icon: UserRound,
      onClick: () => navigate("/profile"),
    },
  ];

  useEffect(() => {
    void fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    syncNotifications(user, conversations);
  }, [conversations, syncNotifications, user]);

  const handleSubmit = () => {
    const part1Max = 5;
    const part1Count = midFinalExamMultipleChoiceQuestions.length;
    const part1Point = part1Max / part1Count;
    let score1 = 0;

    midFinalExamMultipleChoiceQuestions.forEach((question) => {
      const selected = selectedMcAnswers[question.id];
      if (
        selected &&
        selected === midFinalExamMultipleChoiceAnswers[question.id]
      ) {
        score1 += part1Point;
      }
    });

    let score2 = 0;
    trueFalseQuestions.forEach((question) => {
      const correctMap = midFinalExamTrueFalseAnswers[question.id];
      let correctCount = 0;

      question.statements.forEach((_, index) => {
        const option = String.fromCharCode(65 + index);
        const key = `${question.id}_${option}`;
        const selectedValue = selectedTfAnswers[key];
        if (selectedValue === correctMap[option]) {
          correctCount += 1;
        }
      });

      if (correctCount === 1) score2 += 0.1;
      else if (correctCount === 2) score2 += 0.25;
      else if (correctCount === 3) score2 += 0.5;
      else if (correctCount === 4) score2 += 1;
    });

    const total = score1 + score2;
    setSubmissionResult(`Tổng điểm: ${total.toFixed(2)} điểm`);
  };

  const handleShuffle = () => {
    setMultipleChoiceQuestions((current) =>
      [...current].sort(() => Math.random() - 0.5),
    );
    setTrueFalseQuestions((current) =>
      [...current].sort(() => Math.random() - 0.5),
    );
    setSelectedMcAnswers({});
    setSelectedTfAnswers({});
    setSubmissionResult("");
  };

  const handleReset = () => {
    setMultipleChoiceQuestions(midFinalExamMultipleChoiceQuestions);
    setTrueFalseQuestions(midFinalExamTrueFalseQuestions);
    setSelectedMcAnswers({});
    setSelectedTfAnswers({});
    setSubmissionResult("");
  };

  const handleMcAnswerChange = (questionId: number, answer: string) => {
    setSelectedMcAnswers((current) => ({
      ...current,
      [questionId]: answer,
    }));
  };

  const handleTfAnswerChange = (
    questionId: number,
    option: string,
    value: boolean,
  ) => {
    setSelectedTfAnswers((current) => ({
      ...current,
      [`${questionId}_${option}`]: value,
    }));
  };

  return (
    <div className="study-dashboard-shell beautiful-scrollbar h-svh min-h-svh overflow-y-auto overflow-x-hidden pb-24 text-foreground min-[390px]:pb-[6.5rem]">
      <header className="study-dashboard-topbar sticky top-0 z-20 mb-5 px-3.5 min-[390px]:mb-6 min-[390px]:px-4">
        <div className="mx-auto max-w-md">
          <DashboardGreetingHeader
            user={user}
            unreadCount={unreadCount}
            size="compact"
            onProfileClick={() => navigate("/profile")}
            onNotificationClick={() =>
              navigate("/home", { state: { openNotifications: true } })
            }
            notificationAriaLabel="Mở thông báo"
          />
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-5 px-4 pb-6 pt-2 min-[390px]:gap-6 min-[390px]:px-5">
        <section className="rounded-[2rem] border border-slate-200/70 bg-gradient-to-r from-sky-50 via-white to-rose-50 p-6 shadow-[0_30px_80px_-55px_hsl(220_80%_55%/_0.18)] backdrop-blur-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-black uppercase tracking-[0.3em] text-primary shadow-sm shadow-slate-200/70">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                trang luyện đề mới
              </div>
              <h1 className="mt-4 text-3xl font-black leading-tight text-foreground sm:text-4xl">
                Luyện đề giữa kì & cuối kì
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                Hệ thống bộ đề mô phỏng đề thi thật với phần trắc nghiệm và
                đúng/sai, giúp bạn luyện tập nhanh, lưu ý trọng tâm và kiểm tra
                tiến độ ngay trên điện thoại.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-foreground/90"
              onClick={() => navigate("/practice")}
            >
              Quay lại luyện tập
            </button>
          </div>
        </section>

        <section className="rounded-[1.4rem] border border-border/70 bg-card p-5 shadow-[0_24px_48px_-34px_hsl(var(--primary)/0.18)]">
          <div className="mb-4">
            <h2 className="text-base font-black text-foreground">
              PHẦN 1: TRẮC NGHIỆM
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Chọn đáp án phù hợp nhất cho mỗi câu. Nội dung được mô phỏng theo
              đề giữa kì/cuối kì.
            </p>
          </div>
          <div className="space-y-4">
            {multipleChoiceQuestions.map((item, index) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-[1.8rem] border border-slate-200/80 bg-white/95 p-5 shadow-[0_20px_60px_-40px_hsl(220_10%_20%/_0.14)]"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-sky-700">
                    Câu {index + 1}
                  </span>
                  <span className="text-sm font-semibold text-slate-500">
                    Trắc nghiệm
                  </span>
                </div>
                <p className="mt-4 text-base leading-7 text-foreground">
                  {item.prompt}
                </p>
                <div className="mt-5 grid gap-3">
                  {item.options.map((option, optionIndex) => {
                    const optionLabel = String.fromCharCode(65 + optionIndex);
                    const inputName = `mc-${item.id}`;
                    const selected = selectedMcAnswers[item.id] === optionLabel;
                    return (
                      <label
                        key={optionLabel}
                        className={`group flex cursor-pointer items-center gap-4 rounded-[1.5rem] border px-4 py-4 text-sm transition ${
                          selected
                            ? "border-primary bg-primary/5 shadow-[0_8px_20px_-16px_hsl(var(--primary)/0.9)]"
                            : "border-slate-200 bg-slate-50 hover:border-primary/70 hover:bg-primary/5"
                        }`}
                      >
                        <span
                          className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-black transition ${
                            selected
                              ? "border-primary bg-primary text-white"
                              : "border-slate-300 bg-white text-slate-500"
                          }`}
                        >
                          <input
                            type="radio"
                            name={inputName}
                            value={optionLabel}
                            checked={selected}
                            onChange={() =>
                              handleMcAnswerChange(item.id, optionLabel)
                            }
                            className="hidden"
                          />
                          {optionLabel}
                        </span>
                        <span className="text-foreground leading-7">
                          {option}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[1.4rem] border border-border/70 bg-card p-5 shadow-[0_24px_48px_-34px_hsl(var(--primary)/0.18)]">
          <div className="mb-4">
            <h2 className="text-base font-black text-foreground">
              PHẦN 2: ĐÚNG / SAI
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Xác định nhanh các phát biểu đúng hoặc sai theo kiến thức đề thi
              giữa kì/cuối kì.
            </p>
          </div>
          <div className="space-y-4">
            {trueFalseQuestions.map((item, index) => (
              <article
                key={item.id}
                className="rounded-[1.8rem] border border-border/70 bg-background/95 p-5 shadow-[0_20px_40px_-28px_hsl(var(--primary)/0.16)]"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="inline-flex items-center rounded-full bg-secondary/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-secondary">
                    Câu {index + 1}
                  </span>
                  <span className="text-sm font-semibold text-muted-foreground">
                    Đúng / Sai
                  </span>
                </div>
                <p className="mt-4 text-base leading-7 text-foreground">
                  {item.prompt}
                </p>
                <div className="mt-5 grid gap-3">
                  {item.statements.map((statement, statementIndex) => {
                    const optionLabel = String.fromCharCode(
                      65 + statementIndex,
                    );
                    const fieldName = `tf-${item.id}-${optionLabel}`;
                    return (
                      <div
                        key={optionLabel}
                        className="rounded-[1.75rem] border border-slate-200/80 bg-slate-50 p-5 shadow-sm"
                      >
                        <div className="grid grid-cols-[1fr_auto] items-start gap-4">
                          <p className="text-sm font-semibold text-foreground">
                            {optionLabel}. {statement}
                          </p>
                          <div className="flex min-w-[170px] flex-col gap-3">
                            {[
                              { label: "Đúng", value: true },
                              { label: "Sai", value: false },
                            ].map((choice) => {
                              const selected =
                                selectedTfAnswers[
                                  `${item.id}_${optionLabel}`
                                ] === choice.value;
                              return (
                                <label
                                  key={choice.label}
                                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-3 text-sm transition ${
                                    selected
                                      ? "border-secondary bg-secondary/10 text-secondary"
                                      : "border-slate-200 bg-white text-slate-600 hover:border-secondary/70 hover:bg-secondary/5"
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={fieldName}
                                    value={String(choice.value)}
                                    checked={selected}
                                    onChange={() =>
                                      handleTfAnswerChange(
                                        item.id,
                                        optionLabel,
                                        choice.value,
                                      )
                                    }
                                    className="h-4 w-4 accent-secondary"
                                  />
                                  <span className="font-semibold">
                                    {choice.label}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200/80 bg-slate-950/5 p-5 shadow-[0_30px_60px_-40px_hsl(220_10%_20%/_0.16)]">
          <div className="grid gap-4 rounded-[1.8rem] border border-slate-200/80 bg-white/95 p-5 shadow-sm sm:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h2 className="text-base font-black text-foreground">
                Hành động
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Nộp bài để xem điểm, hoặc làm mới đề thi ngay tức thì.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90"
                onClick={handleSubmit}
              >
                Nộp bài
              </button>
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-foreground transition hover:border-primary/70 hover:bg-slate-50"
                onClick={handleShuffle}
              >
                Đảo câu hỏi
              </button>
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-foreground transition hover:border-primary/70 hover:bg-slate-50"
                onClick={handleReset}
              >
                Thi lại
              </button>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl bg-gradient-to-br from-sky-50 to-white p-5 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200/80">
              <p className="font-semibold text-foreground">Trắc nghiệm</p>
              <p className="mt-2 text-2xl font-black text-foreground">
                {quizCount} câu
              </p>
            </div>
            <div className="rounded-3xl bg-gradient-to-br from-rose-50 to-white p-5 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200/80">
              <p className="font-semibold text-foreground">Đúng / Sai</p>
              <p className="mt-2 text-2xl font-black text-foreground">
                {trueFalseCount} câu
              </p>
            </div>
          </div>
          {submissionResult ? (
            <div className="mt-5 rounded-[1.8rem] border border-primary/20 bg-primary/5 p-5 text-sm font-semibold text-primary shadow-sm">
              {submissionResult}
            </div>
          ) : null}
        </section>
      </main>

      <MobileBottomNav items={mobileBottomNavItems} />
    </div>
  );
};

export default MidFinalExamPracticePage;

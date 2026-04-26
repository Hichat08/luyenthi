import MobileBottomNav, {
  type MobileBottomNavItem,
} from "@/components/navigation/MobileBottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isPracticeSubjectAvailable } from "@/lib/practiceAvailability";
import {
  createSubjectSlug,
  subjectExamFilterLabels,
} from "@/lib/subjectPractice";
import { cn } from "@/lib/utils";
import { examService } from "@/services/examService";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { useNotificationStore } from "@/stores/useNotificationStore";
import type {
  PracticeExamDetail,
  PracticeExamSummary,
  SubjectExamCategory,
  SubjectExamDifficulty,
} from "@/types/exam";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Clock3,
  EllipsisVertical,
  Home,
  ListOrdered,
  MessageCircle,
  Play,
  Search,
  Signal,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";

const getDifficultyClassName = (difficulty: SubjectExamDifficulty) => {
  if (difficulty === "Trung bình") {
    return "text-emerald-500";
  }

  if (difficulty === "Rất khó") {
    return "text-red-500";
  }

  return "text-orange-500";
};

const INFORMATICS_QUICK_START_QUESTION_COUNT = 40;
const INFORMATICS_QUICK_START_DURATION_MINUTES = 50;

const SubjectPracticePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { subjectSlug } = useParams();
  const user = useAuthStore((state) => state.user);
  const {
    chatUnreadCount,
    conversations,
    fetchCommunityConversation,
    fetchConversations,
  } = useChatStore();
  const { unreadCount, syncNotifications } = useNotificationStore();
  const [activeFilter, setActiveFilter] = useState<SubjectExamCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [examItems, setExamItems] = useState<PracticeExamSummary[]>([]);
  const [informaticsTemplate, setInformaticsTemplate] = useState<PracticeExamDetail | null>(null);
  const [resolvedSubjectName, setResolvedSubjectName] = useState("");
  const [isLoadingExams, setIsLoadingExams] = useState(false);
  const [isLoadingInformaticsConfig, setIsLoadingInformaticsConfig] = useState(false);
  const [selectedTopicLabels, setSelectedTopicLabels] = useState<string[]>([]);
  const [questionLimitInput, setQuestionLimitInput] = useState("40");
  const [durationMinutesInput, setDurationMinutesInput] = useState("50");

  const userSubjects = useMemo(
    () =>
      (
        user?.studyGoals?.selectedSubjects?.length
          ? user.studyGoals.selectedSubjects
          : user?.studyGoals?.subjects?.map((item) => item.subject) ?? []
      ).filter((subject, index, array) => Boolean(subject) && array.indexOf(subject) === index),
    [user?.studyGoals?.selectedSubjects, user?.studyGoals?.subjects]
  );

  const fallbackSubjectFromState =
    typeof location.state === "object" &&
    location.state &&
    "subjectName" in location.state &&
    typeof location.state.subjectName === "string"
      ? location.state.subjectName
      : "";

  const subjectName =
    userSubjects.find((subject) => createSubjectSlug(subject) === subjectSlug) ??
    fallbackSubjectFromState;

  const displaySubjectName = subjectName || resolvedSubjectName;

  const visibleItems = examItems.filter((item) => {
    const matchFilter = activeFilter === "all" || item.category === activeFilter;
    const matchSearch =
      searchQuery.trim().length === 0 ||
      item.title.toLowerCase().includes(searchQuery.trim().toLowerCase());

    return matchFilter && matchSearch;
  });

  const isInformaticsSubject = createSubjectSlug(displaySubjectName || subjectSlug || "") === "tin-hoc";

  useEffect(() => {
    const resolvedSubject = displaySubjectName || subjectSlug || "";

    if (!resolvedSubject) {
      return;
    }

    if (!isPracticeSubjectAvailable(resolvedSubject)) {
      toast.info("Môn này đang cập nhật.");
      navigate("/practice", { replace: true });
    }
  }, [displaySubjectName, navigate, subjectSlug]);

  const topicOptions = useMemo(() => {
    if (!informaticsTemplate) {
      return [];
    }

    return Array.from<string>(
      new Set(
        informaticsTemplate.questions
          .map((question) => question.topicLabel?.trim())
          .filter((label): label is string => Boolean(label))
      )
    );
  }, [informaticsTemplate]);

  const availableTopicQuestionCount = useMemo(() => {
    if (!informaticsTemplate || selectedTopicLabels.length === 0) {
      return 0;
    }

    const selectedSet = new Set(selectedTopicLabels);
    return informaticsTemplate.questions.filter((question) =>
      selectedSet.has(question.topicLabel?.trim() || "")
    ).length;
  }, [informaticsTemplate, selectedTopicLabels]);

  useEffect(() => {
    void fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    syncNotifications(user, conversations);
  }, [conversations, syncNotifications, user]);

  useEffect(() => {
    if (!subjectSlug && !subjectName) {
      navigate("/practice", { replace: true });
      return;
    }

    if (!isPracticeSubjectAvailable(displaySubjectName || subjectSlug || "")) {
      return;
    }

    let cancelled = false;

    const fetchExams = async () => {
      try {
        setIsLoadingExams(true);
        const exams = await examService.getExams({
          subjectSlug,
          subject: subjectName || fallbackSubjectFromState,
        });

        if (cancelled) {
          return;
        }

        setExamItems(exams);
        setResolvedSubjectName(exams[0]?.subject ?? "");

        if (
          createSubjectSlug((exams[0]?.subject ?? subjectName) || fallbackSubjectFromState) ===
            "tin-hoc" &&
          exams[0]?.examType === "multiple_choice"
        ) {
          setIsLoadingInformaticsConfig(true);
          const examDetail = await examService.getExamDetail(exams[0].examId);

          if (cancelled) {
            return;
          }

          const topics = Array.from<string>(
            new Set(
              examDetail.questions
                .map((question) => question.topicLabel?.trim())
                .filter((label): label is string => Boolean(label))
            )
          );

          setInformaticsTemplate(examDetail);
          setSelectedTopicLabels(topics);
          setQuestionLimitInput(`${Math.min(40, examDetail.questions.length)}`);
          setDurationMinutesInput("50");
          setIsLoadingInformaticsConfig(false);
        } else if (!cancelled) {
          setInformaticsTemplate(null);
          setSelectedTopicLabels([]);
          setIsLoadingInformaticsConfig(false);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Lỗi khi tải danh sách đề thi", error);
          toast.error("Không thể tải danh sách đề thi.");
          navigate("/practice", { replace: true });
          setIsLoadingInformaticsConfig(false);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingExams(false);
        }
      }
    };

    void fetchExams();

    return () => {
      cancelled = true;
    };
  }, [displaySubjectName, fallbackSubjectFromState, navigate, subjectName, subjectSlug]);

  const handleOpenCommunityChat = async () => {
    try {
      await fetchCommunityConversation();
      navigate("/chat");
    } catch (error) {
      console.error("Lỗi khi mở Community Live", error);
    }
  };

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
      active: true,
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
      onClick: () => void handleOpenCommunityChat(),
    },
    {
      key: "profile",
      label: "Cá nhân",
      icon: UserRound,
      onClick: () => navigate("/profile"),
    },
  ];

  if (!displaySubjectName) {
    return null;
  }

  const toggleTopic = (topicLabel: string) => {
    setSelectedTopicLabels((current) =>
      current.includes(topicLabel)
        ? current.filter((item) => item !== topicLabel)
        : [...current, topicLabel]
    );
  };

  const toggleAllTopics = () => {
    setSelectedTopicLabels((current) =>
      current.length === topicOptions.length ? [] : [...topicOptions]
    );
  };

  const handleStartTopicExam = () => {
    if (!informaticsTemplate) {
      toast.error("Chưa tải xong ngân hàng câu hỏi môn Tin.");
      return;
    }

    if (selectedTopicLabels.length === 0) {
      toast.error("Hãy chọn ít nhất một chuyên đề.");
      return;
    }

    navigate(`/practice/${informaticsTemplate.subjectSlug}/exam/${informaticsTemplate.examId}`, {
      state: {
        selectedTopicLabels,
        questionLimit: Math.min(
          Math.max(Number(questionLimitInput) || 1, 1),
          availableTopicQuestionCount
        ),
        durationMinutes: Math.min(Math.max(Number(durationMinutesInput) || 1, 1), 180),
        autoStart: true,
        initialExamDetail: informaticsTemplate,
      },
    });
  };

  const handleStartExamFromCard = (item: PracticeExamSummary) => {
    if (item.examType === "essay") {
      navigate(`/practice/${item.subjectSlug}/essay/${item.examId}`);
      return;
    }

    if (item.subjectSlug === "tin-hoc" && informaticsTemplate) {
      navigate(`/practice/${item.subjectSlug}/exam/${item.examId}`, {
        state: {
          selectedTopicLabels:
            topicOptions.length > 0 ? topicOptions : selectedTopicLabels,
          questionLimit: Math.min(
            INFORMATICS_QUICK_START_QUESTION_COUNT,
            informaticsTemplate.questions.length
          ),
          durationMinutes: INFORMATICS_QUICK_START_DURATION_MINUTES,
          autoStart: true,
          initialExamDetail: informaticsTemplate,
        },
      });
      return;
    }

    navigate(`/practice/${item.subjectSlug}/exam/${item.examId}`);
  };

  return (
    <div className="study-dashboard-shell beautiful-scrollbar h-svh min-h-svh overflow-y-auto overflow-x-hidden bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted)/0.4)_100%)] pb-24 text-foreground min-[390px]:pb-[6.5rem]">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/92 px-3.5 py-3.5 backdrop-blur-xl min-[390px]:px-4 min-[390px]:py-4">
        <div className="mx-auto flex max-w-md items-center justify-between gap-2.5 min-[390px]:gap-3">
          <button
            type="button"
            onClick={() => navigate("/practice")}
            className="grid size-9 shrink-0 place-items-center rounded-full text-foreground transition hover:bg-muted min-[390px]:size-10"
            aria-label="Quay lại danh sách môn"
          >
            <ArrowLeft className="size-4.5 min-[390px]:size-5" />
          </button>

          <h1 className="truncate text-center font-auth-heading text-[1.14rem] font-black tracking-[-0.05em] text-foreground min-[390px]:text-[1.32rem]">
            Thi thử môn {displaySubjectName}
          </h1>

          <button
            type="button"
            onClick={() => navigate("/home", { state: { openNotifications: true } })}
            className="relative grid size-9 shrink-0 place-items-center rounded-full text-foreground transition hover:bg-muted min-[390px]:size-10"
            aria-label="Mở thông báo"
          >
            <EllipsisVertical className="size-4.5 min-[390px]:size-5" />
            {unreadCount > 0 ? (
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive" />
            ) : null}
          </button>
        </div>
      </header>

      <main className="mx-auto flex max-w-md flex-col px-3 pb-8 pt-3.5 min-[390px]:px-4 min-[390px]:pt-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground min-[390px]:size-5" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Tìm kiếm đề thi..."
            className="h-12 rounded-[0.95rem] border-border/60 bg-card pl-11 pr-4 text-[0.88rem] shadow-[0_18px_36px_-28px_hsl(var(--foreground)/0.15)] min-[390px]:h-14 min-[390px]:rounded-[1.15rem] min-[390px]:pl-12 min-[390px]:text-[0.95rem]"
          />
        </div>

        <div className="beautiful-scrollbar -mx-1 mt-3.5 overflow-x-auto overflow-y-hidden pb-2.5 pr-1 [scrollbar-gutter:stable] min-[390px]:mt-5">
          <div className="flex min-w-max gap-2 px-1 min-[390px]:gap-3">
            {(Object.keys(subjectExamFilterLabels) as SubjectExamCategory[]).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  "rounded-full border px-3 py-2 text-[0.72rem] font-bold whitespace-nowrap transition-all min-[390px]:px-4 min-[390px]:py-2.5 min-[390px]:text-[0.82rem]",
                  activeFilter === filter
                    ? "border-primary bg-primary text-primary-foreground shadow-[0_20px_36px_-22px_hsl(var(--primary)/0.65)]"
                    : "border-border/70 bg-card text-foreground shadow-[0_12px_24px_-22px_hsl(var(--foreground)/0.16)]"
                )}
              >
                {subjectExamFilterLabels[filter]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3.5 space-y-3 min-[390px]:mt-5 min-[390px]:space-y-4">
          {isInformaticsSubject ? (
            <section className="rounded-[1.15rem] border border-primary/18 bg-[linear-gradient(180deg,hsl(var(--primary)/0.05)_0%,hsl(var(--background))_100%)] p-3 shadow-[0_24px_52px_-32px_hsl(var(--primary)/0.22)] min-[390px]:rounded-[1.45rem] min-[390px]:p-4">
              <div className="mb-3 flex flex-col gap-2.5 min-[390px]:mb-4 min-[390px]:gap-3.5">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="min-w-0">
                    <h2 className="font-auth-heading text-[0.98rem] font-black tracking-[-0.04em] text-foreground min-[390px]:text-[1.2rem]">
                    Tạo đề theo chủ đề
                    </h2>
                    <p className="mt-1 text-[0.74rem] font-medium leading-4.5 text-muted-foreground min-[390px]:text-[0.86rem]">
                      Chọn nhanh chuyên đề, số câu và thời gian rồi vào làm bài ngay.
                    </p>
                  </div>
                  <div className="shrink-0 rounded-[0.85rem] border border-primary/12 bg-primary/6 px-2.5 py-1.5 text-right">
                    <p className="text-[0.58rem] font-black uppercase tracking-[0.14em] text-primary/70">
                      Khả dụng
                    </p>
                    <p className="text-[0.86rem] font-black text-primary min-[390px]:text-[0.95rem]">
                      {informaticsTemplate ? `${availableTopicQuestionCount} câu` : "--"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleAllTopics}
                  disabled={!informaticsTemplate || isLoadingInformaticsConfig}
                  className="w-full rounded-[0.85rem] border border-primary/20 bg-white px-3.5 py-2 text-[0.78rem] font-bold text-primary shadow-[0_12px_26px_-24px_hsl(var(--primary)/0.35)] min-[390px]:w-fit min-[390px]:rounded-full min-[390px]:px-4 min-[390px]:py-2.5 min-[390px]:text-[0.88rem]"
                >
                  {selectedTopicLabels.length > 0 && selectedTopicLabels.length === topicOptions.length
                    ? "Bỏ chọn tất cả"
                    : "Chọn tất cả"}
                </button>
              </div>

              <div className="beautiful-scrollbar max-h-56 space-y-1.5 overflow-y-auto rounded-[0.9rem] border border-primary/12 bg-white/90 p-2 min-[390px]:max-h-64 min-[390px]:rounded-[1.15rem] min-[390px]:space-y-2 min-[390px]:p-3">
                {isLoadingInformaticsConfig
                  ? Array.from({ length: 5 }, (_, index) => (
                      <div
                        key={`topic-skeleton-${index}`}
                        className="h-10 animate-pulse rounded-[0.8rem] border border-primary/10 bg-primary/5 min-[390px]:h-11"
                      />
                    ))
                  : topicOptions.map((topicLabel) => {
                  const checked = selectedTopicLabels.includes(topicLabel);

                  return (
                    <label
                      key={topicLabel}
                      className={cn(
                        "flex cursor-pointer items-start gap-2.5 rounded-[0.8rem] border px-2.5 py-1.5 transition min-[390px]:gap-3 min-[390px]:rounded-[0.95rem] min-[390px]:py-2",
                        checked
                          ? "border-primary/18 bg-primary/5"
                          : "border-transparent hover:bg-primary/5"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleTopic(topicLabel)}
                        className="mt-1 size-4 accent-[hsl(var(--primary))]"
                      />
                      <span className="text-[0.8rem] font-medium leading-5 text-foreground min-[390px]:text-[0.95rem] min-[390px]:leading-6">
                        {topicLabel}
                      </span>
                    </label>
                  );
                })}
              </div>

              <div className="mt-3.5 grid grid-cols-1 gap-2.5 min-[390px]:mt-4 min-[390px]:grid-cols-2 min-[390px]:gap-4">
                <div>
                  <label className="mb-1.5 block text-[0.8rem] font-black text-muted-foreground min-[390px]:mb-2 min-[390px]:text-[0.95rem]">
                    Số câu hỏi
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={Math.max(1, availableTopicQuestionCount)}
                    value={questionLimitInput}
                    onChange={(event) => setQuestionLimitInput(event.target.value)}
                    disabled={!informaticsTemplate || isLoadingInformaticsConfig}
                    className="h-11 rounded-[0.85rem] border-border/70 bg-card text-[0.92rem] font-semibold min-[390px]:h-14 min-[390px]:rounded-[1rem] min-[390px]:text-[1.05rem]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[0.8rem] font-black text-muted-foreground min-[390px]:mb-2 min-[390px]:text-[0.95rem]">
                    Thời gian (phút)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={180}
                    value={durationMinutesInput}
                    onChange={(event) => setDurationMinutesInput(event.target.value)}
                    disabled={!informaticsTemplate || isLoadingInformaticsConfig}
                    className="h-11 rounded-[0.85rem] border-border/70 bg-card text-[0.92rem] font-semibold min-[390px]:h-14 min-[390px]:rounded-[1rem] min-[390px]:text-[1.05rem]"
                  />
                </div>
              </div>

              <Button
                type="button"
                onClick={handleStartTopicExam}
                disabled={!informaticsTemplate || isLoadingInformaticsConfig}
                className="mt-3.5 h-11 w-full rounded-[0.9rem] bg-gradient-to-r from-primary to-[hsl(var(--primary-glow))] px-4 text-[0.82rem] font-black leading-4.5 shadow-[0_24px_42px_-24px_hsl(var(--primary)/0.65)] min-[390px]:mt-5 min-[390px]:h-14 min-[390px]:rounded-[1.1rem] min-[390px]:text-[1.02rem]"
              >
                {isLoadingInformaticsConfig
                  ? "Đang tải chuyên đề..."
                  : `Thi theo chủ đề đã chọn (${Math.min(Math.max(Number(questionLimitInput) || 1, 1), availableTopicQuestionCount)} câu)`}
              </Button>
            </section>
          ) : null}

          {visibleItems.map((item) => (
            <article
              key={item.examId}
              className="overflow-hidden rounded-[1.1rem] border border-white/80 bg-card shadow-[0_24px_52px_-30px_hsl(var(--primary)/0.22)] min-[390px]:rounded-[1.45rem]"
            >
              {(() => {
                const isInformaticsQuickStart =
                  item.subjectSlug === "tin-hoc" && item.examType === "multiple_choice";
                const displayDuration = isInformaticsQuickStart
                  ? INFORMATICS_QUICK_START_DURATION_MINUTES
                  : item.durationMinutes;
                const displayQuestionCount = isInformaticsQuickStart
                  ? Math.min(
                      INFORMATICS_QUICK_START_QUESTION_COUNT,
                      informaticsTemplate?.questions.length ?? item.questionCount
                    )
                  : item.questionCount;

                return (
                  <>
              <div className="relative h-32 overflow-hidden min-[390px]:h-40">
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                {item.badge ? (
                  <span className="absolute left-3 top-3 z-20 rounded-lg bg-primary px-2.5 py-1 text-[0.6rem] font-black uppercase tracking-[0.12em] text-primary-foreground min-[390px]:left-3.5 min-[390px]:top-3.5 min-[390px]:text-[0.62rem]">
                    {item.badge}
                  </span>
                ) : null}
                <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 text-white min-[390px]:bottom-3.5 min-[390px]:left-3.5">
                  <div className="flex -space-x-2">
                    <span className="size-6 rounded-full border-2 border-white bg-slate-300" />
                    <span className="size-6 rounded-full border-2 border-white bg-slate-400" />
                    <span className="size-6 rounded-full border-2 border-white bg-slate-500" />
                  </div>
                  <span className="max-w-[9rem] truncate text-[0.74rem] font-semibold min-[390px]:max-w-none min-[390px]:text-[0.82rem]">
                    {item.attemptsLabel}
                  </span>
                </div>
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="p-3 min-[390px]:p-4">
                <h2 className="font-auth-heading text-[0.96rem] font-black leading-[1.22] tracking-[-0.04em] text-foreground min-[390px]:text-[1.28rem]">
                  {item.title}
                </h2>

                <div className="mt-2 flex flex-wrap gap-x-2.5 gap-y-1.5 text-[0.7rem] text-muted-foreground min-[390px]:mt-2.5 min-[390px]:gap-x-4 min-[390px]:gap-y-1.5 min-[390px]:text-[0.82rem]">
                  <div className="flex items-center gap-1.5">
                    <Clock3 className="size-3.5 min-[390px]:size-4" />
                    <span>{displayDuration} phút</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ListOrdered className="size-3.5 min-[390px]:size-4" />
                    <span>{displayQuestionCount} câu</span>
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-1.5 font-bold",
                      getDifficultyClassName(item.difficulty)
                    )}
                  >
                    <Signal className="size-4" />
                    <span>{item.difficulty}</span>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => handleStartExamFromCard(item)}
                  className="mt-3 h-10 w-full rounded-[0.85rem] bg-gradient-to-r from-primary to-[hsl(var(--primary-glow))] text-[0.82rem] font-black shadow-[0_24px_40px_-24px_hsl(var(--primary)/0.65)] min-[390px]:mt-4 min-[390px]:h-12 min-[390px]:rounded-[1rem] min-[390px]:text-[0.92rem]"
                >
                  Thi ngay
                  <Play className="size-4 fill-current" />
                </Button>
              </div>
                  </>
                );
              })()}
            </article>
          ))}

          {isLoadingExams ? (
            <div className="rounded-[1.5rem] border border-dashed border-border/80 bg-card/80 px-5 py-8 text-center">
              <p className="text-sm font-semibold text-muted-foreground">
                Đang tải danh sách đề thi...
              </p>
            </div>
          ) : null}

          {!isLoadingExams && visibleItems.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-border/80 bg-card/80 px-5 py-8 text-center">
              <p className="text-sm font-semibold text-muted-foreground">
                Không tìm thấy đề thi phù hợp cho bộ lọc hiện tại.
              </p>
            </div>
          ) : null}
        </div>
      </main>

      <MobileBottomNav items={mobileBottomNavItems} />
    </div>
  );
};

export default SubjectPracticePage;

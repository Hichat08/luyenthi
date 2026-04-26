import MobileBottomNav, {
  type MobileBottomNavItem,
} from "@/components/navigation/MobileBottomNav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  rankingService,
  type ResultHistoryItem,
  type ResultsOverview,
  type ResultsOverviewPeriod,
} from "@/services/rankingService";
import { useChatStore } from "@/stores/useChatStore";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  CheckCircle2,
  FlaskConical,
  Home,
  Languages,
  MessageCircle,
  Share2,
  Sigma,
  UserRound,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

const resultFilters: Array<{ id: ResultsOverviewPeriod; label: string }> = [
  { id: "all", label: "Tất cả" },
  { id: "weekly", label: "Tuần này" },
  { id: "monthly", label: "Tháng này" },
];

const formatScore = (value: number) => value.toFixed(1);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));

const formatDurationLabel = (seconds: number) => {
  const safeSeconds = Math.max(Math.round(seconds || 0), 0);
  const minutes = Math.floor(safeSeconds / 60);

  if (minutes <= 0) {
    return "Dưới 1 phút";
  }

  return `${minutes} phút`;
};

const getAttemptScore = (attempt: ResultHistoryItem) =>
  attempt.totalQuestions > 0 ? (attempt.correctCount / attempt.totalQuestions) * 10 : 0;

const getScoreBadge = (score: number) => {
  if (score >= 8.5) {
    return {
      label: "Giỏi",
      className: "bg-emerald-100 text-emerald-600",
    };
  }

  if (score >= 7) {
    return {
      label: "Khá",
      className: "bg-blue-100 text-blue-600",
    };
  }

  return {
    label: "Trung bình",
    className: "bg-amber-100 text-amber-700",
  };
};

const getSubjectVisual = (subject?: string) => {
  const normalized = `${subject ?? ""}`.toLowerCase();

  if (normalized.includes("toán")) {
    return {
      icon: Sigma,
      className: "bg-orange-100 text-orange-600",
    };
  }

  if (normalized.includes("lý")) {
    return {
      icon: Zap,
      className: "bg-blue-100 text-blue-600",
    };
  }

  if (normalized.includes("hóa")) {
    return {
      icon: FlaskConical,
      className: "bg-purple-100 text-purple-600",
    };
  }

  if (normalized.includes("anh")) {
    return {
      icon: Languages,
      className: "bg-emerald-100 text-emerald-600",
    };
  }

  return {
    icon: BookOpen,
    className: "bg-primary/12 text-primary",
  };
};

const buildChartPath = (points: Array<{ x: number; y: number }>) => {
  if (points.length === 0) {
    return "";
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const controlX = (current.x + next.x) / 2;

    path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
  }

  return path;
};

const RankingPage = () => {
  const navigate = useNavigate();
  const { chatUnreadCount, fetchCommunityConversation } = useChatStore();
  const [activeFilter, setActiveFilter] = useState<ResultsOverviewPeriod>("all");
  const [results, setResults] = useState<ResultsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const data = await rankingService.getResultsOverview(activeFilter, 8);
        setResults(data);
      } catch (error) {
        console.error("Lỗi khi lấy kết quả luyện thi", error);
        setResults(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchResults();
  }, [activeFilter]);

  const handleOpenCommunityChat = async () => {
    try {
      await fetchCommunityConversation();
      navigate("/chat");
    } catch (error) {
      console.error("Lỗi khi mở Community Live", error);
    }
  };

  const handleShare = async () => {
    const shareText = results
      ? `Mình đã hoàn thành ${results.summary.totalAttempts} bài với điểm trung bình ${formatScore(
          results.summary.averageScore
        )} trên Lộ trình học tập.`
      : "Xem kết quả luyện thi của mình trên Lộ trình học tập.";

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Kết quả luyện thi",
          text: shareText,
        });
        return;
      }

      await navigator.clipboard.writeText(shareText);
      toast.success("Đã sao chép nội dung chia sẻ.");
    } catch (error) {
      console.error("Lỗi khi chia sẻ kết quả", error);
    }
  };

  const trendPoints = useMemo(() => {
    const items = results?.trend ?? [];
    if (items.length === 0) {
      return [];
    }

    const width = 400;
    const height = 100;
    const maxScore = Math.max(...items.map((item) => item.score), 10);
    const minScore = Math.min(...items.map((item) => item.score), 0);
    const scoreRange = Math.max(maxScore - minScore, 1);

    return items.map((item, index) => ({
      label: item.label,
      score: item.score,
      x: (index / Math.max(items.length - 1, 1)) * width,
      y: height - ((item.score - minScore) / scoreRange) * 72 - 14,
    }));
  }, [results?.trend]);

  const chartLinePath = buildChartPath(trendPoints);
  const chartAreaPath =
    trendPoints.length > 1
      ? `${chartLinePath} L ${trendPoints[trendPoints.length - 1].x} 100 L 0 100 Z`
      : "";

  const mobileBottomNavItems: MobileBottomNavItem[] = [
    {
      key: "home",
      label: "Trang chủ",
      icon: Home,
      onClick: () => navigate("/home"),
    },
    {
      key: "roadmap",
      label: "Luyện tập",
      icon: BookOpen,
      onClick: () => navigate("/practice"),
    },
    {
      key: "stats",
      label: "Kết quả",
      icon: BarChart3,
      active: true,
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

  return (
    <div className="min-h-svh bg-[linear-gradient(180deg,#f8f8fb_0%,#f3f4f8_100%)] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/88 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="inline-flex size-9 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100"
            aria-label="Quay lại"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="min-w-0 flex-1 font-auth-heading text-[1.15rem] font-black tracking-[-0.04em] text-slate-900">
            Kết quả luyện thi
          </h1>
          <button
            type="button"
            onClick={() => void handleShare()}
            className="inline-flex size-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100"
            aria-label="Chia sẻ kết quả"
          >
            <Share2 className="size-4.5" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pb-32 pt-5">
        {loading ? (
          <div className="py-16 text-center text-sm font-semibold text-slate-500">
            Đang tải kết quả luyện thi...
          </div>
        ) : !results ? (
          <div className="rounded-[1.3rem] border border-slate-200 bg-white p-5 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Chưa thể tải dữ liệu kết quả. Hãy thử lại sau.
            </p>
          </div>
        ) : (
          <>
            <section className="grid grid-cols-3 gap-2.5">
              <div className="rounded-[1.05rem] border border-slate-100 bg-white px-3 py-4 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.18)]">
                <p className="text-[0.74rem] font-semibold text-slate-500">Tổng số bài</p>
                <p className="mt-1.5 text-[1.75rem] font-black leading-none tracking-[-0.04em] text-primary">
                  {results.summary.totalAttempts}
                </p>
              </div>
              <div className="rounded-[1.05rem] border border-slate-100 bg-white px-3 py-4 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.18)]">
                <p className="text-[0.74rem] font-semibold text-slate-500">Điểm TB</p>
                <p className="mt-1.5 text-[1.75rem] font-black leading-none tracking-[-0.04em] text-primary">
                  {formatScore(results.summary.averageScore)}
                </p>
              </div>
              <div className="rounded-[1.05rem] border border-slate-100 bg-white px-3 py-4 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.18)]">
                <p className="text-[0.74rem] font-semibold text-slate-500">Hoàn thành</p>
                <p className="mt-1.5 text-[1.75rem] font-black leading-none tracking-[-0.04em] text-primary">
                  {results.summary.completionRate}%
                </p>
              </div>
            </section>

            <section className="mt-6 rounded-[1.3rem] border border-slate-100 bg-white p-4 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.18)]">
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <h2 className="text-[0.84rem] font-bold text-slate-500">Xu hướng điểm số</h2>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[1.7rem] font-black leading-none tracking-[-0.04em] text-slate-900">
                      {formatScore(results.summary.averageScore)}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[0.68rem] font-black",
                        results.summary.scoreDeltaPercent >= 0
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-rose-100 text-rose-600"
                      )}
                    >
                      {results.summary.scoreDeltaPercent >= 0 ? "+" : ""}
                      {results.summary.scoreDeltaPercent}%
                    </span>
                  </div>
                </div>
                <span className="text-[0.78rem] font-semibold text-slate-400">7 ngày qua</span>
              </div>

              <div className="relative h-32 w-full">
                <svg className="h-full w-full overflow-visible" viewBox="0 0 400 100">
                  <defs>
                    <linearGradient id="resultsChartGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {chartAreaPath ? (
                    <path d={chartAreaPath} fill="url(#resultsChartGradient)" />
                  ) : null}
                  {chartLinePath ? (
                    <path
                      d={chartLinePath}
                      fill="none"
                      stroke="#145af2"
                      strokeLinecap="round"
                      strokeWidth="3"
                    />
                  ) : null}
                  {trendPoints.length > 0 ? (
                    <circle
                      cx={trendPoints[trendPoints.length - 1].x}
                      cy={trendPoints[trendPoints.length - 1].y}
                      r="4"
                      fill="#145af2"
                    />
                  ) : null}
                </svg>
              </div>

              <div className="mt-1.5 flex justify-between px-1">
                {(results.trend ?? []).map((item) => (
                  <span
                    key={item.key}
                    className="text-[0.64rem] font-bold text-slate-400"
                  >
                    {item.label}
                  </span>
                ))}
              </div>
            </section>

            <section className="mt-4 flex gap-2.5 overflow-x-auto pb-1">
              {resultFilters.map((filter) => {
                const active = filter.id === activeFilter;

                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setActiveFilter(filter.id)}
                    className={cn(
                      "whitespace-nowrap rounded-full border px-5 py-2.5 text-[0.84rem] font-bold transition",
                      active
                        ? "border-primary bg-primary text-white shadow-[0_18px_28px_-22px_hsl(var(--primary)/0.55)]"
                        : "border-slate-200 bg-white text-slate-600"
                    )}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </section>

            <section className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-auth-heading text-[1.5rem] font-black tracking-[-0.04em] text-slate-900">
                  Lịch sử luyện thi
                </h3>
                {results.hasMore ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="px-0 text-[0.88rem] font-bold text-primary hover:bg-transparent hover:text-primary/85"
                  >
                    Xem thêm
                  </Button>
                ) : null}
              </div>

              <div className="space-y-3">
                {results.attempts.length === 0 ? (
                  <div className="rounded-[1.2rem] border border-slate-100 bg-white p-5 text-center shadow-sm">
                    <p className="text-sm font-semibold text-slate-500">
                      Chưa có bài làm nào trong bộ lọc này.
                    </p>
                  </div>
                ) : (
                  results.attempts.map((attempt) => {
                    const score = getAttemptScore(attempt);
                    const badge = getScoreBadge(score);
                    const visual = getSubjectVisual(attempt.subject);
                    const Icon = visual.icon;

                    return (
                      <article
                        key={attempt._id}
                        className="flex items-center gap-3 rounded-[1.2rem] border border-slate-100 bg-white p-3.5 shadow-[0_14px_32px_-26px_rgba(15,23,42,0.18)]"
                      >
                        <div
                          className={cn(
                            "flex size-12 shrink-0 items-center justify-center rounded-[0.9rem]",
                            visual.className
                          )}
                        >
                          <Icon className="size-6" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="truncate font-auth-heading text-[0.94rem] font-black tracking-[-0.03em] text-slate-900">
                            {attempt.subject?.trim() || attempt.examTitle?.trim() || "Bài luyện tập"}
                          </h4>
                          <p className="mt-0.5 text-[0.76rem] font-medium text-slate-500">
                            {formatDate(attempt.submittedAt)} • {formatDurationLabel(attempt.timeSpentSeconds)}
                          </p>
                          <div className="mt-1 flex items-center gap-1.5">
                            <CheckCircle2
                              className={cn(
                                "size-3.5",
                                score >= 7 ? "text-emerald-500" : "text-amber-500"
                              )}
                            />
                            <span className="text-[0.76rem] font-bold text-slate-700">
                              {attempt.correctCount}/{attempt.totalQuestions} câu đúng
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-[1.65rem] font-black leading-none tracking-[-0.04em] text-primary">
                            {formatScore(score)}
                          </p>
                          <span
                            className={cn(
                              "mt-1.5 inline-flex rounded-lg px-2 py-0.5 text-[0.62rem] font-black uppercase tracking-[0.06em]",
                              badge.className
                            )}
                          >
                            {badge.label}
                          </span>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          </>
        )}
      </main>

      <MobileBottomNav items={mobileBottomNavItems} />
    </div>
  );
};

export default RankingPage;

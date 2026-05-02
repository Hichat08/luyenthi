import MobileBottomNav, {
  type MobileBottomNavItem,
} from "@/components/navigation/MobileBottomNav";
import DashboardGreetingHeader from "@/components/navigation/DashboardGreetingHeader";
import { isPracticeSubjectAvailable } from "@/lib/practiceAvailability";
import { createSubjectSlug } from "@/lib/subjectPractice";
import {
  readTodayProgressCache,
  saveTodayProgressCache,
  subscribeTodayProgress,
} from "@/lib/todayProgressStorage";
import { rankingService, type DailyProgress } from "@/services/rankingService";
import {
  getPracticeSubjectClassName,
  getSubjectIcon,
  normalizeSubjectKey,
} from "@/lib/subjectMeta";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { useNotificationStore } from "@/stores/useNotificationStore";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  ChevronRight,
  Home,
  MessageCircle,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

type PracticeSubjectItem = {
  label: string;
  icon: LucideIcon;
  className: string;
  available: boolean;
};

const getPracticeSubjectItem = (subject: string): PracticeSubjectItem => {
  return {
    label: subject,
    icon: getSubjectIcon(subject) ?? BookOpen,
    className: getPracticeSubjectClassName(subject),
    available: isPracticeSubjectAvailable(subject),
  };
};

type UpcomingExam = {
  month: string;
  day: string;
  title: string;
  meta: string;
  remaining: string;
  accentClassName: string;
  dateClassName: string;
  pillClassName: string;
};

const upcomingExams: UpcomingExam[] = [];
const ALWAYS_AVAILABLE_PRACTICE_SUBJECTS = ["Tin học"];

const canonicalizePracticeSubject = (subject: string) => {
  const normalized = normalizeSubjectKey(subject);

  if (normalized === "tin" || normalized === "tin học") {
    return "Tin học";
  }

  return subject;
};

const PracticePage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const {
    chatUnreadCount,
    conversations,
    fetchCommunityConversation,
    fetchConversations,
  } = useChatStore();
  const { unreadCount, syncNotifications } = useNotificationStore();
  const [dailyProgress, setDailyProgress] = useState<DailyProgress>(
    () =>
      readTodayProgressCache() ?? {
        completedExams: 0,
        dailyTarget: 10,
        remainingExams: 10,
        progressPercentage: 0,
      },
  );
  const practiceSubjects = [
    ...(user?.studyGoals?.selectedSubjects?.length
      ? user.studyGoals.selectedSubjects
      : (user?.studyGoals?.subjects?.map((item) => item.subject) ?? [])),
    ...ALWAYS_AVAILABLE_PRACTICE_SUBJECTS,
  ]
    .filter((subject): subject is string => Boolean(subject))
    .map(canonicalizePracticeSubject)
    .filter(
      (subject, index, array) =>
        array.findIndex(
          (item) => normalizeSubjectKey(item) === normalizeSubjectKey(subject),
        ) === index,
    )
    .map(getPracticeSubjectItem);

  useEffect(() => {
    void fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    syncNotifications(user, conversations);
  }, [conversations, syncNotifications, user]);

  useEffect(() => {
    let cancelled = false;

    const fetchTodayProgress = async () => {
      try {
        const progress = await rankingService.getTodayProgress();

        if (!cancelled) {
          setDailyProgress(progress);
          saveTodayProgressCache(progress);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Lỗi khi tải tiến độ hôm nay", error);
        }
      }
    };

    void fetchTodayProgress();

    const interval = window.setInterval(() => {
      void fetchTodayProgress();
    }, 30000);

    const handleFocus = () => {
      void fetchTodayProgress();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  useEffect(() => subscribeTodayProgress(setDailyProgress), []);

  const handleOpenCommunityChat = async () => {
    try {
      await fetchCommunityConversation();
      navigate("/chat");
    } catch (error) {
      console.error("Lỗi khi mở Community Live", error);
    }
  };

  const handleOpenSubject = (label: string) => {
    if (!isPracticeSubjectAvailable(label)) {
      toast.info("Môn này đang cập nhật.");
      return;
    }

    navigate(`/practice/${createSubjectSlug(label)}`, {
      state: { subjectName: label },
    });
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

      <main className="mx-auto flex max-w-md flex-col gap-4 px-3.5 pt-5 min-[390px]:gap-5 min-[390px]:px-4 min-[390px]:pt-6">
        <section className="rounded-[1.25rem] border border-primary/14 bg-[linear-gradient(135deg,hsl(var(--primary)/0.18)_0%,hsl(var(--primary-glow)/0.14)_52%,hsl(var(--background))_100%)] p-3 text-foreground shadow-[0_24px_48px_-34px_hsl(var(--primary)/0.28)] min-[390px]:rounded-[1.4rem] min-[390px]:p-3.5">
          <div className="flex items-center justify-between gap-2.5 min-[390px]:gap-3">
            <div className="min-w-0 space-y-3">
              <div>
                <h2 className="font-auth-heading text-[1.08rem] font-black leading-tight min-[390px]:text-[1.22rem]">
                  Lộ trình học tập
                </h2>
                <p className="mt-1 max-w-[9rem] font-auth-body text-[0.72rem] font-medium leading-4.5 text-muted-foreground min-[390px]:max-w-[10rem] min-[390px]:text-[0.8rem]">
                  {dailyProgress.remainingExams > 0
                    ? `Hôm nay đã làm ${dailyProgress.completedExams}/${dailyProgress.dailyTarget} đề`
                    : `Hôm nay bạn đã hoàn thành đủ ${dailyProgress.dailyTarget} đề`}
                </p>
              </div>
              <button
                type="button"
                className="rounded-xl bg-primary px-3 py-2 font-auth-body text-[0.72rem] font-bold text-white shadow-[0_18px_30px_-26px_hsl(var(--primary)/0.58)] transition active:scale-[0.98] min-[390px]:px-3.5 min-[390px]:text-[0.8rem]"
              >
                Chi tiết lộ trình
              </button>
            </div>

            <div
              className="grid size-14 shrink-0 place-items-center rounded-full bg-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_16px_30px_-24px_hsl(var(--primary)/0.38)] min-[390px]:size-16"
              style={{
                background: `conic-gradient(#facc15 0 ${dailyProgress.progressPercentage}%, hsl(var(--primary) / 0.16) ${dailyProgress.progressPercentage}% 100%)`,
              }}
              aria-label={`Tiến độ ${dailyProgress.progressPercentage}%`}
            >
              <div className="grid size-10 place-items-center rounded-full bg-[hsl(var(--background))] text-[0.82rem] font-black text-primary shadow-[0_12px_24px_-18px_hsl(var(--primary)/0.24)] min-[390px]:size-12 min-[390px]:text-sm">
                {dailyProgress.progressPercentage}%
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between min-[390px]:mb-4">
            <h2 className="font-auth-heading text-base font-black text-foreground min-[390px]:text-lg">
              Môn học trọng tâm
            </h2>
            <button
              type="button"
              className="font-auth-body text-[0.82rem] font-bold text-primary min-[390px]:text-sm"
            >
              Tất cả
            </button>
          </div>

          {practiceSubjects.length > 0 ? (
            <div className="grid grid-cols-4 gap-2 min-[390px]:gap-3">
              {practiceSubjects.map(
                ({ className, icon: Icon, label, available }) => (
                  <button
                    key={label}
                    type="button"
                    className="flex min-w-0 flex-col items-center gap-1.5 min-[390px]:gap-2"
                    onClick={() => handleOpenSubject(label)}
                    aria-label={
                      available
                        ? `Mở môn ${label}`
                        : `Môn ${label} đang cập nhật`
                    }
                  >
                    <span
                      className={`relative grid size-12 place-items-center rounded-xl border shadow-sm transition min-[390px]:size-14 ${
                        available
                          ? className
                          : `${className} opacity-55 grayscale`
                      }`}
                    >
                      <Icon className="size-6 min-[390px]:size-7" />
                      {!available ? (
                        <span className="absolute -right-1.5 -top-1.5 rounded-full border border-white/80 bg-amber-100 px-1.5 py-0.5 text-[0.48rem] font-black uppercase tracking-[0.08em] text-amber-700 shadow-sm min-[390px]:text-[0.52rem]">
                          Mới
                        </span>
                      ) : null}
                    </span>
                    <span
                      className={`font-auth-body text-[0.7rem] font-bold leading-tight min-[390px]:text-xs ${
                        available
                          ? "text-muted-foreground"
                          : "text-muted-foreground/80"
                      }`}
                    >
                      {label}
                    </span>
                    {!available ? (
                      <span className="text-[0.58rem] font-black uppercase tracking-[0.08em] text-amber-700/90 min-[390px]:text-[0.62rem]">
                        Đang cập nhật
                      </span>
                    ) : null}
                  </button>
                ),
              )}
            </div>
          ) : (
            <div className="rounded-[1.2rem] border border-dashed border-border/80 bg-card/70 px-4 py-5 text-center shadow-[0_14px_34px_-28px_hsl(var(--primary)/0.18)]">
              <p className="font-auth-body text-sm font-semibold text-muted-foreground">
                Chưa có môn thi nào được chọn.
              </p>
            </div>
          )}
        </section>

        <section className="rounded-[1.4rem] border border-border/70 bg-card p-4 shadow-[0_24px_48px_-34px_hsl(var(--primary)/0.18)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary/80">
                Trang mới
              </p>
              <h2 className="mt-2 text-lg font-black text-foreground">
                Luyện đề giữa kì & cuối kì
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Mở trang riêng để luyện đề giữa kì và cuối kì theo mẫu đề thi
                thử.
              </p>
            </div>
            <button
              type="button"
              className="rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
              onClick={() => navigate("/practice/luyen-de-giua-cuoi-ki")}
            >
              Xem trang
            </button>
          </div>
        </section>

        <section className="space-y-3.5 min-[390px]:space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-auth-heading text-base font-black text-foreground min-[390px]:text-lg">
              Kỳ thi sắp tới
            </h2>
            <button
              type="button"
              className="font-auth-body text-[0.82rem] font-bold text-primary min-[390px]:text-sm"
            >
              Lịch thi
            </button>
          </div>

          {upcomingExams.map(
            ({
              accentClassName,
              dateClassName,
              day,
              meta,
              month,
              pillClassName,
              remaining,
              title,
            }) => (
              <article
                key={title}
                className="relative overflow-hidden rounded-[1.2rem] border border-border/80 bg-card p-3.5 shadow-[0_14px_34px_-28px_hsl(var(--primary)/0.28)] min-[390px]:rounded-[1.35rem] min-[390px]:p-4"
              >
                <span
                  className={`absolute left-0 top-0 h-full w-1.5 ${accentClassName}`}
                />
                <div className="flex items-center gap-2.5 pl-1.5 min-[390px]:gap-3 min-[390px]:pl-2">
                  <div
                    className={`grid size-14 shrink-0 place-items-center rounded-2xl min-[390px]:size-16 ${dateClassName}`}
                  >
                    <div className="text-center">
                      <p className="font-auth-body text-[0.65rem] font-black uppercase leading-tight min-[390px]:text-xs">
                        {month}
                      </p>
                      <p className="font-auth-heading text-xl font-black leading-tight min-[390px]:text-2xl">
                        {day}
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-auth-heading text-sm font-black leading-snug text-foreground min-[390px]:text-base">
                      {title}
                    </h3>
                    <p className="mt-0.5 font-auth-body text-xs font-semibold leading-5 text-muted-foreground min-[390px]:text-sm">
                      {meta}
                    </p>
                    <span
                      className={`mt-2.5 inline-flex rounded-full px-2.5 py-1.5 font-auth-body text-[0.6rem] font-black uppercase tracking-[0.1em] min-[390px]:mt-3 min-[390px]:px-3 min-[390px]:text-[0.65rem] ${pillClassName}`}
                    >
                      {remaining}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground transition hover:bg-primary hover:text-white min-[390px]:size-9"
                    aria-label={`Mở ${title}`}
                  >
                    <ChevronRight className="size-4 min-[390px]:size-5" />
                  </button>
                </div>
              </article>
            ),
          )}
        </section>
      </main>

      <MobileBottomNav items={mobileBottomNavItems} />
    </div>
  );
};

export default PracticePage;

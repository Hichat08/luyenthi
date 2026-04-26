import NotificationsScreen from "@/components/chat/NotificationsScreen";
import SchoolScheduleSetupDialog from "@/components/chat/SchoolScheduleSetupDialog";
import { HomeDailyProgressCard } from "@/components/home/HomeDailyProgressCard";
import { HomeInformaticsHero } from "@/components/home/HomeInformaticsHero";
import DashboardGreetingHeader from "@/components/navigation/DashboardGreetingHeader";
import MobileBottomNav, {
  type MobileBottomNavItem,
} from "@/components/navigation/MobileBottomNav";
import { createSubjectSlug } from "@/lib/subjectPractice";
import {
  readTodayProgressCache,
  saveTodayProgressCache,
  subscribeTodayProgress,
} from "@/lib/todayProgressStorage";
import {
  rankingService,
  type DailyProgress,
} from "@/services/rankingService";
import { userService } from "@/services/userService";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { BarChart3, BookOpen, Home, MessageCircle, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";

type HomeLocationState = {
  focusSection?: string;
  openNotifications?: boolean;
};

type InformaticsHighlight = {
  id: string;
  title: string;
  description: string;
};

const formatToday = () =>
  new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());

const formatClock = () =>
  new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date());

const informaticsHighlights: InformaticsHighlight[] = [
  {
    id: "topic-mode",
    title: "Điểm nổi bật",
    description:
      "Hỗ trợ thi theo chuyên đề, mặc định 40 câu trong 50 phút và vào thẳng màn hình môn Tin khi bấm.",
  },
  {
    id: "question-bank",
    title: "Ngân hàng câu hỏi",
    description:
      "Bộ đề môn Tin đã được cập nhật để chọn nhanh chuyên đề và bắt đầu ôn tập ngay từ trang chủ.",
  },
  {
    id: "quick-start",
    title: "Bắt đầu nhanh",
    description:
      "Chạm một lần để vào thẳng môn Tin, không cần qua bước lọc trung gian hay tìm lại đúng môn.",
  },
];

const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = (location.state ?? null) as HomeLocationState | null;
  const user = useAuthStore((state) => state.user);
  const {
    chatUnreadCount,
    conversations,
    fetchCommunityConversation,
    fetchConversations,
  } = useChatStore();
  const {
    items: notificationItems,
    unreadCount,
    syncNotifications,
    setRemoteNotifications,
  } = useNotificationStore();
  const [showNotifications, setShowNotifications] = useState(
    Boolean(routeState?.openNotifications)
  );
  const [notificationReadIds, setNotificationReadIds] = useState<string[]>([]);
  const [showSubjectSetup, setShowSubjectSetup] = useState(false);
  const [clock, setClock] = useState(() => formatClock());
  const [activeInformaticsHighlightIndex, setActiveInformaticsHighlightIndex] = useState(0);
  const [dailyProgress, setDailyProgress] = useState<DailyProgress>(
    () =>
      readTodayProgressCache() ?? {
        completedExams: 0,
        dailyTarget: 10,
        remainingExams: 10,
        progressPercentage: 0,
      }
  );
  const studyGoals = user?.studyGoals?.subjects ?? [];
  const selectedSubjects = useMemo(() => {
    if (studyGoals.length > 0) {
      return studyGoals;
    }

    return (user?.studyGoals?.selectedSubjects ?? []).map((subject) => ({
      subject,
      currentScore: 0,
      targetScore: 10,
    }));
  }, [studyGoals, user?.studyGoals?.selectedSubjects]);
  const hasStudyGoals =
    selectedSubjects.length > 0 || (user?.studyGoals?.selectedSubjects?.length ?? 0) > 0;
  const subjectSetupInitialValue = useMemo(
    () => ({
      morning: user?.schoolSchedule?.morning,
      afternoon: user?.schoolSchedule?.afternoon,
      selectedSubjects: user?.studyGoals?.selectedSubjects,
      subjects: user?.studyGoals?.subjects,
    }),
    [
      user?.schoolSchedule?.afternoon,
      user?.schoolSchedule?.morning,
      user?.studyGoals?.selectedSubjects,
      user?.studyGoals?.subjects,
    ]
  );

  const activeInformaticsHighlight =
    informaticsHighlights[activeInformaticsHighlightIndex] ?? informaticsHighlights[0];
  useEffect(() => {
    void fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    syncNotifications(user, conversations);
  }, [conversations, syncNotifications, user]);

  useEffect(() => {
    let cancelled = false;

    const fetchRemoteNotifications = async () => {
      try {
        const notifications = await userService.getNotifications();

        if (!cancelled) {
          setRemoteNotifications(notifications, user, conversations);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Lỗi khi tải notification từ server", error);
        }
      }
    };

    if (user?._id) {
      void fetchRemoteNotifications();
    }

    return () => {
      cancelled = true;
    };
  }, [setRemoteNotifications, user]);

  useEffect(() => {
    let cancelled = false;

    const fetchDashboardStats = async () => {
      try {
        const progress = await rankingService.getTodayProgress();

        if (!cancelled) {
          setDailyProgress(progress);
          saveTodayProgressCache(progress);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Lỗi khi tải thống kê dashboard", error);
        }
      }
    };

    void fetchDashboardStats();

    const interval = window.setInterval(() => {
      void fetchDashboardStats();
    }, 30000);

    const handleFocus = () => {
      void fetchDashboardStats();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  useEffect(() => subscribeTodayProgress(setDailyProgress), []);

  useEffect(() => {
    if (!user) {
      return;
    }

    setShowSubjectSetup(!hasStudyGoals);
  }, [hasStudyGoals, user]);

  useEffect(() => {
    if (informaticsHighlights.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveInformaticsHighlightIndex(
        (current) => (current + 1) % informaticsHighlights.length
      );
    }, 3000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClock(formatClock());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (routeState?.openNotifications) {
      setNotificationReadIds(
        notificationItems.filter((item) => item.unread).map((item) => item.id)
      );
      setShowNotifications(true);
    }
  }, [notificationItems, routeState?.openNotifications]);

  const openNotifications = () => {
    setNotificationReadIds(
      notificationItems.filter((item) => item.unread).map((item) => item.id)
    );
    setShowNotifications(true);
  };

  useEffect(() => {
    const sectionId = routeState?.focusSection;

    if (!sectionId) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [routeState?.focusSection]);

  const handleOpenCommunityChat = async () => {
    try {
      await fetchCommunityConversation();
      navigate("/chat");
    } catch (error) {
      console.error("Lỗi khi mở Community Live", error);
    }
  };

  const handleOpenInformatics = () => {
    navigate(`/practice/${createSubjectSlug("Tin học")}`, {
      state: { subjectName: "Tin học" },
    });
  };

  const mobileBottomNavItems: MobileBottomNavItem[] = [
    {
      key: "home",
      label: "Trang chủ",
      icon: Home,
      active: true,
      onClick: () => {
        setShowNotifications(false);
        navigate("/home");
      },
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
      onClick: () => void handleOpenCommunityChat(),
    },
    {
      key: "profile",
      label: "Cá nhân",
      icon: UserRound,
      onClick: () => navigate("/profile"),
    },
  ];

  if (showNotifications) {
    return (
      <div className="study-dashboard-shell flex h-svh min-h-svh flex-col overflow-hidden bg-background text-foreground">
        <NotificationsScreen
          user={user}
          initialReadIds={notificationReadIds}
          onBack={() => setShowNotifications(false)}
          onOpenSettings={() => navigate("/profile")}
        />
        <MobileBottomNav items={mobileBottomNavItems} />
      </div>
    );
  }

  return (
    <div className="study-dashboard-shell beautiful-scrollbar h-svh min-h-svh overflow-y-auto overflow-x-hidden pb-24 text-foreground min-[390px]:pb-[6.5rem]">
      <header className="study-dashboard-topbar sticky top-0 z-20 mb-5 px-3.5 min-[390px]:mb-6 min-[390px]:px-4">
        <div className="mx-auto max-w-md">
          <DashboardGreetingHeader
            user={user}
            unreadCount={unreadCount}
            size="compact"
            onProfileClick={() => navigate("/profile")}
            onNotificationClick={openNotifications}
            notificationAriaLabel="Mở thông báo"
          />
        </div>
      </header>

      <main className="mx-auto flex max-w-md flex-col gap-5 px-3.5 pt-5 min-[390px]:gap-6 min-[390px]:px-4 min-[390px]:pt-6">
        <section
          id="dashboard-home"
          className="space-y-4"
        >
          <div className="space-y-2">
            <h1 className="font-auth-heading text-[2.1rem] font-black leading-[0.95] tracking-[-0.05em] text-foreground">
              Chào mừng trở lại!
            </h1>
            <p className="max-w-[18rem] text-sm leading-6 text-muted-foreground">
              Tiếp tục lộ trình học với màu sắc và nhịp giao diện đồng bộ cùng toàn bộ app.
            </p>
          </div>
        </section>

        <HomeDailyProgressCard
          clock={clock}
          todayLabel={formatToday()}
          dailyProgress={dailyProgress}
        />

        <section className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <button
              type="button"
              className="study-dashboard-primary-button px-3 text-center"
              onClick={() => navigate("/practice")}
            >
              Bắt đầu học ngay
            </button>
          </div>

          <HomeInformaticsHero
            highlightTitle={activeInformaticsHighlight.title}
            highlightDescription={activeInformaticsHighlight.description}
            onOpen={handleOpenInformatics}
          />
        </section>
      </main>

      <SchoolScheduleSetupDialog
        open={showSubjectSetup}
        onOpenChange={setShowSubjectSetup}
        mode="subjects-only"
        initialValue={subjectSetupInitialValue}
      />

      <MobileBottomNav items={mobileBottomNavItems} />
    </div>
  );
};

export default HomePage;

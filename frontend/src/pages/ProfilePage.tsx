import AvatarUploader from "@/components/profile/AvatarUploader";
import UserAvatar from "@/components/chat/UserAvatar";
import MobileBottomNav, {
  type MobileBottomNavItem,
} from "@/components/navigation/MobileBottomNav";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { rankingService } from "@/services/rankingService";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { useThemeStore } from "@/stores/useThemeStore";
import { useUserStore } from "@/stores/useUserStore";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  BookOpen,
  ChevronRight,
  CircleHelp,
  IdCard,
  Home,
  LogOut,
  MessageCircle,
  Settings,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

type MenuItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  iconClassName: string;
  action: () => void;
  badgeCount?: number;
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const { updateProfile } = useUserStore();
  const {
    chatUnreadCount,
    fetchCommunityConversation,
    fetchConversations,
  } = useChatStore();
  const { toggleTheme } = useThemeStore();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    displayName: "",
    dateOfBirth: "",
    classroom: "",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [rankingStats, setRankingStats] = useState<{
    rank: number | null;
    totalExams: number;
    totalSubmissions?: number;
    accumulatedScore: number;
  } | null>(null);

  useEffect(() => {
    void fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const data = await rankingService.getLeaderboard("all");
        setRankingStats(data.currentUser ?? null);
      } catch (error) {
        console.error("Lỗi khi fetch ranking cho profile", error);
        setRankingStats(null);
      }
    };

    void fetchRanking();
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    setProfileForm({
      displayName: user.displayName ?? "",
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : "",
      classroom: user.classroom ?? "",
    });
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/signin");
  };

  const handleOpenCommunityChat = async () => {
    try {
      await fetchCommunityConversation();
      navigate("/chat");
    } catch (error) {
      console.error("Lỗi khi mở Community Live", error);
    }
  };

  const handleSaveProfile = async () => {
    if (isSavingProfile) {
      return;
    }

    setIsSavingProfile(true);
    const success = await updateProfile(profileForm);

    if (success) {
      setProfileDialogOpen(false);
    }

    setIsSavingProfile(false);
  };

  if (!user) {
    return null;
  }
  const completedCount = rankingStats?.totalSubmissions ?? rankingStats?.totalExams ?? 0;
  const currentRank = rankingStats?.rank;
  const accumulatedScore = rankingStats?.accumulatedScore ?? 0;
  const classroomLabel = user.classroom?.trim() ? `Học sinh lớp ${user.classroom}` : "Học sinh lớp 12";

  const menuItems: MenuItem[] = [
    {
      key: "personal",
      label: "Thông tin cá nhân",
      icon: UserRound,
      iconClassName: "bg-blue-50 text-blue-600",
      action: () => setProfileDialogOpen(true),
    },
    {
      key: "results",
      label: "Kết quả luyện thi",
      icon: BarChart3,
      iconClassName: "bg-blue-50 text-blue-600",
      action: () => navigate("/ranking"),
    },
    {
      key: "saved",
      label: "Đã lưu",
      icon: BookOpen,
      iconClassName: "bg-pink-50 text-pink-500",
      action: () => navigate("/practice"),
    },
    {
      key: "notifications",
      label: "Thông báo",
      icon: Bell,
      iconClassName: "bg-indigo-50 text-indigo-500",
      badgeCount: chatUnreadCount,
      action: () =>
        navigate("/home", {
          state: {
            openNotifications: true,
          },
        }),
    },
    {
      key: "help",
      label: "Trợ giúp & Phản hồi",
      icon: CircleHelp,
      iconClassName: "bg-emerald-50 text-emerald-600",
      action: () => {
        void handleOpenCommunityChat();
      },
    },
  ];

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
      onClick: () => void handleOpenCommunityChat(),
    },
    {
      key: "profile",
      label: "Cá nhân",
      icon: UserRound,
      active: true,
      onClick: () => navigate("/profile"),
    },
  ];

  return (
    <>
      <div className="beautiful-scrollbar min-h-svh overflow-y-auto bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted)/0.36)_100%)] text-foreground">
        <div className="mx-auto max-w-[30rem] pb-32">
          <section className="relative overflow-hidden rounded-b-[2.15rem] border-b border-border/60 bg-card/94 px-4 pb-8 pt-5 shadow-[0_20px_55px_-42px_hsl(var(--foreground)/0.12)] backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.14),transparent_72%)]" />
            <div className="relative flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-primary/70">
                  Tài khoản
                </p>
                <p className="font-auth-heading text-[1.35rem] font-black leading-tight tracking-[-0.05em] text-foreground">
                  Hồ sơ cá nhân
                </p>
              </div>

              <button
                type="button"
                onClick={() => toggleTheme()}
                className="flex size-10 items-center justify-center rounded-full border border-border/80 bg-background/88 text-muted-foreground shadow-[0_16px_28px_-24px_hsl(var(--foreground)/0.32)] transition hover:border-primary/20 hover:text-primary"
                aria-label="Cài đặt giao diện"
              >
                <Settings className="size-5.5" />
              </button>
            </div>

            <div className="relative mt-5 overflow-hidden rounded-[1.6rem] border border-border/60 bg-background/72 px-4 pb-5 pt-6 text-center shadow-[inset_0_1px_0_hsl(var(--background)/0.85),0_18px_34px_-30px_hsl(var(--foreground)/0.2)]">
              <div className="pointer-events-none absolute inset-x-8 top-0 h-16 rounded-full bg-primary/8 blur-2xl" />
              <div className="relative mx-auto w-fit">
                <div className="rounded-full border-[4px] border-primary/18 bg-background p-1 shadow-[0_18px_34px_-24px_hsl(var(--primary)/0.38)]">
                  <div className="rounded-full border-[3px] border-background bg-[linear-gradient(135deg,hsl(var(--primary)/0.22),hsl(var(--primary-glow)/0.14))] p-1">
                    <UserAvatar
                      type="profile"
                      name={user.displayName}
                      avatarUrl={user.avatarUrl}
                      className="size-24 border-0 bg-transparent text-[1.7rem] shadow-none"
                    />
                  </div>
                </div>

                <div className="absolute -bottom-1 -right-1">
                  <AvatarUploader />
                </div>
              </div>

              <h1 className="mt-4 font-auth-heading text-[1.72rem] font-black leading-none tracking-[-0.05em] text-foreground">
                {user.displayName}
              </h1>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/90 px-3 py-1.5 text-[0.72rem] font-bold text-muted-foreground">
                  <IdCard className="size-3.5 text-primary" />
                  <span>ID: {user.userCode ?? "2024SC123456"}</span>
                </div>
                <div className="inline-flex rounded-full border border-primary/15 bg-primary/10 px-3.5 py-1.5 text-[0.7rem] font-black uppercase tracking-[0.12em] text-primary shadow-[inset_0_1px_0_hsl(var(--background)/0.8)]">
                  {classroomLabel}
                </div>
              </div>
            </div>
          </section>

          <section className="-mt-5 px-4">
            <div className="grid grid-cols-3 gap-2 rounded-[1.4rem] border border-border/60 bg-card/85 p-2 shadow-[0_18px_34px_-26px_hsl(var(--foreground)/0.12)] backdrop-blur">
              {[
                { value: completedCount, label: "Số đề đã làm" },
                { value: currentRank, label: "Hạng hiện tại" },
                { value: accumulatedScore, label: "Điểm tích lũy" },
              ].map((stat, index) => (
                <div
                  key={stat.label}
                  className={cn(
                    "rounded-[1rem] bg-background px-2 py-3.5 text-center shadow-[inset_0_1px_0_hsl(var(--background)/0.92)]",
                    index === 1 && "bg-primary/[0.07]"
                  )}
                >
                  <p className="font-auth-heading text-[1.28rem] font-black leading-none tracking-[-0.05em] text-primary">
                    {stat.value ?? "-"}
                  </p>
                  <p className="mt-1 text-[0.58rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <main className="px-4 pt-7">
            <section>
              <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-muted-foreground">
                Quản lý tài khoản
              </p>

              <div className="mt-4 overflow-hidden rounded-[1.35rem] border border-border/70 bg-card/96 shadow-[0_18px_34px_-28px_hsl(var(--foreground)/0.12)]">
                {menuItems.map(({ key, label, icon: Icon, iconClassName, action, badgeCount }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={action}
                    className={`flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-muted/35 ${
                      key !== menuItems[menuItems.length - 1]?.key
                        ? "border-b border-border/60"
                        : ""
                    }`}
                  >
                    <span
                      className={`flex size-10 shrink-0 items-center justify-center rounded-[0.9rem] ${iconClassName}`}
                    >
                      <Icon className="size-4.5" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-[0.9rem] font-bold text-foreground">
                        {label}
                      </span>
                    </div>

                    {badgeCount && badgeCount > 0 ? (
                      <span className="mr-1 inline-flex min-w-7 items-center justify-center rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
                        {badgeCount > 9 ? "9+" : badgeCount}
                      </span>
                    ) : null}

                    <ChevronRight className="size-4.5 shrink-0 text-muted-foreground/55" />
                  </button>
                ))}
              </div>
            </section>

            <button
              type="button"
              onClick={handleSignOut}
              className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-[1.25rem] border border-destructive/12 bg-destructive/7 px-5 py-3.5 text-[0.9rem] font-black text-destructive shadow-[0_14px_30px_-28px_rgba(220,38,38,0.55)] transition hover:bg-destructive/12"
            >
              <LogOut className="size-5" />
              Đăng xuất
            </button>
          </main>
        </div>

        <MobileBottomNav items={mobileBottomNavItems} />
      </div>

      <Dialog
        open={profileDialogOpen}
        onOpenChange={(open) => {
          setProfileDialogOpen(open);

          if (open) {
            setProfileForm({
              displayName: user.displayName ?? "",
              dateOfBirth: user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : "",
              classroom: user.classroom ?? "",
            });
          }
        }}
      >
        <DialogContent className="max-w-[calc(100%-1rem)] rounded-[1.5rem] border border-primary/10 p-0 shadow-[0_26px_70px_-32px_hsl(var(--primary)/0.35)] sm:max-w-[30rem]">
          <div className="bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted)/0.28)_100%)] p-5 sm:p-6">
            <DialogHeader className="text-left">
              <DialogTitle className="font-auth-heading text-[1.45rem] font-black tracking-[-0.05em] text-foreground">
                Chỉnh sửa thông tin cá nhân
              </DialogTitle>
              <DialogDescription className="text-sm leading-6 text-muted-foreground">
                Cập nhật tên hiển thị, ngày sinh và lớp. Hệ thống sẽ lưu lại cho đến lần bạn sửa tiếp theo.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="profile-display-name"
                  className="text-[0.78rem] font-black uppercase tracking-[0.16em] text-muted-foreground"
                >
                  Tên hiển thị
                </label>
                <Input
                  id="profile-display-name"
                  value={profileForm.displayName}
                  onChange={(event) =>
                    setProfileForm((current) => ({
                      ...current,
                      displayName: event.target.value,
                    }))
                  }
                  className="h-12 rounded-[1rem] border-primary/15 bg-card"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="profile-date-of-birth"
                  className="text-[0.78rem] font-black uppercase tracking-[0.16em] text-muted-foreground"
                >
                  Ngày sinh
                </label>
                <Input
                  id="profile-date-of-birth"
                  type="date"
                  value={profileForm.dateOfBirth}
                  onChange={(event) =>
                    setProfileForm((current) => ({
                      ...current,
                      dateOfBirth: event.target.value,
                    }))
                  }
                  className="h-12 rounded-[1rem] border-primary/15 bg-card"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="profile-classroom"
                  className="text-[0.78rem] font-black uppercase tracking-[0.16em] text-muted-foreground"
                >
                  Lớp
                </label>
                <Input
                  id="profile-classroom"
                  value={profileForm.classroom}
                  onChange={(event) =>
                    setProfileForm((current) => ({
                      ...current,
                      classroom: event.target.value,
                    }))
                  }
                  className="h-12 rounded-[1rem] border-primary/15 bg-card"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setProfileDialogOpen(false)}
                className="h-11 rounded-[1rem]"
              >
                Hủy
              </Button>
              <Button
                type="button"
                onClick={() => void handleSaveProfile()}
                disabled={isSavingProfile}
                className="h-11 rounded-[1rem] px-5 font-black"
              >
                {isSavingProfile ? "Đang lưu..." : "Lưu thông tin"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfilePage;

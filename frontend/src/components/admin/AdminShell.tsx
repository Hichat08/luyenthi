import { useAuthStore } from "@/stores/useAuthStore";
import {
  Bell,
  ChartColumnBig,
  FilePlus2,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";

type AdminMenuItem = {
  key: string;
  label: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  path: string;
  disabled?: boolean;
};

const adminMenuItems: AdminMenuItem[] = [
  {
    key: "dashboard",
    label: "Tổng quan",
    description: "Theo dõi số liệu nhanh",
    icon: LayoutDashboard,
    path: "/admin",
  },
  {
    key: "users",
    label: "Người dùng",
    description: "Quản lý tài khoản",
    icon: Users,
    path: "/admin/users",
    disabled: true,
  },
  {
    key: "analytics",
    label: "Thống kê",
    description: "Báo cáo hoạt động",
    icon: ChartColumnBig,
    path: "/admin/analytics",
  },
  {
    key: "exams",
    label: "Tạo đề",
    description: "Thêm đề thi mới",
    icon: FilePlus2,
    path: "/admin/exams/new",
  },
  {
    key: "notifications",
    label: "Thông báo",
    description: "Gửi nhắc nhở và bài mới",
    icon: Bell,
    path: "/admin/notifications",
  },
  {
    key: "settings",
    label: "Cài đặt",
    description: "Thiết lập quản trị",
    icon: Settings,
    path: "/admin/settings",
    disabled: true,
  },
];

type AdminShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
  headerAside?: ReactNode;
};

export default function AdminShell({
  eyebrow = "EduPath Admin",
  title,
  description,
  headerAside,
  children,
}: AdminShellProps) {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/signin");
  };

  return (
    <div className="study-dashboard-shell min-h-svh p-3 text-foreground sm:p-4 lg:p-5">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 lg:flex-row">
        <aside className="w-full shrink-0 rounded-[1.45rem] border border-border/75 bg-card/88 p-3.5 text-foreground shadow-[0_26px_54px_-36px_hsl(var(--primary)/0.22)] backdrop-blur lg:sticky lg:top-5 lg:min-h-[calc(100svh-2.5rem)] lg:w-[248px] lg:self-start">
          <div className="flex items-center gap-3 rounded-[1.1rem] border border-primary/12 bg-[linear-gradient(135deg,hsl(var(--primary)/0.12)_0%,hsl(var(--primary-glow)/0.1)_100%)] px-3 py-3">
            <div className="flex size-9 items-center justify-center rounded-[0.95rem] bg-primary/12 text-primary">
              <ShieldCheck className="size-[18px]" strokeWidth={2.1} />
            </div>
            <div>
              <p className="text-[0.95rem] font-black tracking-[-0.04em] text-primary">
                EduPath Admin
              </p>
              <p className="text-[12px] text-muted-foreground">
                Quản trị hệ thống học tập
              </p>
            </div>
          </div>

          <div className="mt-5">
            <p className="px-2 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground/75">
              Điều hướng
            </p>
            <nav className="mt-3 space-y-2">
              {adminMenuItems.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path;

                return (
                  <button
                    key={item.key}
                    type="button"
                    disabled={item.disabled}
                    className={`flex w-full items-center gap-3 rounded-[1.2rem] px-3.5 py-2.5 text-left transition ${
                      active
                        ? "bg-[linear-gradient(135deg,hsl(var(--primary)/0.14)_0%,hsl(var(--primary-glow)/0.12)_100%)] text-foreground shadow-[0_18px_34px_-28px_hsl(var(--primary)/0.35)]"
                        : "bg-transparent text-muted-foreground hover:bg-primary/6 hover:text-primary"
                    } ${item.disabled ? "cursor-not-allowed opacity-55" : ""}`}
                    onClick={() => {
                      if (!item.disabled) {
                        navigate(item.path);
                      }
                    }}
                  >
                    <div
                      className={`flex size-10 shrink-0 items-center justify-center rounded-[1.1rem] ${
                        active
                          ? "bg-primary/12 text-primary"
                          : "bg-muted/55 text-muted-foreground"
                      }`}
                    >
                      <Icon className="size-[18px]" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold">{item.label}</p>
                      <p className="text-xs text-muted-foreground/78">
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mt-6 rounded-[1.15rem] border border-border/70 bg-background/72 p-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground/78">
              Phiên hiện tại
            </p>
            <p className="mt-1.5 text-[0.92rem] font-bold">
              {user?.displayName}
            </p>
            <p className="text-[12px] text-muted-foreground">
              @{user?.username}
            </p>
            <button
              type="button"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-[0.95rem] border border-primary/16 bg-background px-4 py-2.5 text-[12px] font-bold text-primary transition hover:bg-primary/8"
              onClick={() => void handleSignOut()}
            >
              <LogOut className="size-4" strokeWidth={2.2} />
              Đăng xuất
            </button>
          </div>
        </aside>

        <main className="flex-1 space-y-4">
          <header className="rounded-[1.45rem] border border-border/75 bg-card/88 px-4 py-4 shadow-[0_22px_46px_-34px_hsl(var(--primary)/0.24)] backdrop-blur">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/72">
              {eyebrow}
            </p>
            <div className="mt-2 flex flex-col gap-2.5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-[1.55rem] font-black tracking-[-0.05em] text-foreground lg:text-[1.7rem]">
                  {title}
                </h1>
                <p className="mt-1 max-w-2xl text-[12px] leading-5 text-muted-foreground">
                  {description}
                </p>
              </div>
              {headerAside ?? (
                <div className="rounded-[1rem] border border-primary/12 bg-[linear-gradient(135deg,hsl(var(--primary)/0.12)_0%,hsl(var(--background))_100%)] px-3 py-2 text-foreground">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-primary/68">
                    Đăng nhập với
                  </p>
                  <p className="mt-1 text-[13px] font-bold">
                    {user?.displayName}
                  </p>
                </div>
              )}
            </div>
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}

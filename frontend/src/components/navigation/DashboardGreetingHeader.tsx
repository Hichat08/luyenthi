import { cn } from "@/lib/utils";
import type { User } from "@/types/user";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

type DashboardGreetingHeaderProps = {
  user?: User | null;
  unreadCount?: number;
  onProfileClick?: () => void;
  onNotificationClick?: () => void;
  className?: string;
  notificationAriaLabel?: string;
  size?: "default" | "compact";
};

const getDisplayName = (user?: User | null) =>
  user?.displayName?.trim() || user?.username || "Học viên";

const getInitial = (name: string) => name.charAt(0).toUpperCase();

const getGreetingByHour = (hour: number) => {
  if (hour < 11) {
    return "Xin chào buổi sáng,";
  }

  if (hour < 13) {
    return "Xin chào buổi trưa,";
  }

  if (hour < 18) {
    return "Xin chào buổi chiều,";
  }

  return "Xin chào buổi tối,";
};

export default function DashboardGreetingHeader({
  user,
  unreadCount = 0,
  onProfileClick,
  onNotificationClick,
  className,
  notificationAriaLabel = "Mở thông báo",
  size = "default",
}: DashboardGreetingHeaderProps) {
  const displayName = getDisplayName(user);
  const userInitial = getInitial(displayName);
  const isCompact = size === "compact";
  const [greeting, setGreeting] = useState(() =>
    getGreetingByHour(new Date().getHours())
  );

  useEffect(() => {
    const syncGreeting = () => {
      setGreeting(getGreetingByHour(new Date().getHours()));
    };

    syncGreeting();

    const timer = window.setInterval(syncGreeting, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  const profileContent = (
    <>
      <span className="relative shrink-0">
        <Avatar
          className={cn(
            "border border-white/80 bg-white/65 shadow-[0_20px_34px_-26px_rgba(79,70,229,0.55)]",
            isCompact
              ? "size-[2.4rem] rounded-[0.95rem] min-[390px]:size-[2.55rem] sm:size-[2.8rem] md:size-[3.1rem]"
              : "size-[2.7rem] rounded-[1.05rem] min-[390px]:size-[2.85rem] sm:size-[3.15rem] md:size-[3.5rem]"
          )}
        >
          <AvatarImage
            src={user?.avatarUrl}
            alt={displayName}
            className={cn(
              "object-cover",
              isCompact
                ? "rounded-[0.82rem] min-[390px]:rounded-[0.88rem] sm:rounded-[0.98rem] md:rounded-[1.05rem]"
                : "rounded-[0.92rem] min-[390px]:rounded-[0.98rem] sm:rounded-[1.08rem] md:rounded-[1.18rem]"
            )}
          />
          <AvatarFallback
            className={cn(
              "bg-[linear-gradient(160deg,#9333ea_0%,#6d28d9_100%)] font-auth-heading font-black text-white",
              isCompact
                ? "rounded-[0.82rem] text-[0.96rem] min-[390px]:rounded-[0.88rem] min-[390px]:text-[1.04rem] sm:rounded-[0.98rem] sm:text-[1.12rem] md:rounded-[1.05rem] md:text-[1.22rem]"
                : "rounded-[0.92rem] text-[1.08rem] min-[390px]:rounded-[0.98rem] min-[390px]:text-[1.16rem] sm:rounded-[1.08rem] sm:text-[1.28rem] md:rounded-[1.18rem] md:text-[1.42rem]"
            )}
          >
            {userInitial}
          </AvatarFallback>
        </Avatar>
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-background bg-emerald-400 shadow-[0_8px_16px_-10px_rgba(16,185,129,0.9)] sm:border-[3px]",
            isCompact
              ? "size-[0.68rem] min-[390px]:size-[0.76rem] sm:size-[0.84rem]"
              : "size-[0.76rem] min-[390px]:size-[0.84rem] sm:size-[0.92rem]"
          )}
        />
      </span>

      <span className="min-w-0 text-left">
        <span
          className={cn(
            "block truncate font-auth-body font-semibold text-slate-500",
            isCompact
              ? "text-[0.62rem] leading-3.5 min-[390px]:text-[0.68rem] min-[390px]:leading-4 sm:text-[0.76rem] md:text-[0.86rem]"
              : "text-[0.68rem] leading-4 min-[390px]:text-[0.74rem] min-[390px]:leading-5 sm:text-[0.82rem] md:text-[0.94rem]"
          )}
        >
          {greeting}
        </span>
        <span
          className={cn(
            "block truncate font-auth-heading font-black leading-[0.96] tracking-[-0.05em] text-slate-800",
            isCompact
              ? "text-[0.82rem] min-[390px]:text-[0.92rem] sm:text-[1.08rem] md:text-[1.38rem]"
              : "text-[0.92rem] min-[390px]:text-[1.02rem] sm:text-[1.24rem] md:text-[1.62rem]"
          )}
        >
          {displayName}
        </span>
      </span>
    </>
  );

  return (
    <div
      className={cn(
        "flex w-full items-center justify-between",
        isCompact ? "gap-2 min-[390px]:gap-2.5" : "gap-2.5 min-[390px]:gap-3",
        className
      )}
    >
      {onProfileClick ? (
        <button
          type="button"
          className={cn(
            "flex min-w-0 items-center text-left transition hover:opacity-95",
            isCompact
              ? "gap-1.5 min-[390px]:gap-2"
              : "gap-2 min-[390px]:gap-2.5"
          )}
          onClick={onProfileClick}
          aria-label="Mở hồ sơ cá nhân"
        >
          {profileContent}
        </button>
      ) : (
        <div className="flex min-w-0 items-center gap-3">{profileContent}</div>
      )}

      <button
        type="button"
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center self-center rounded-full border border-slate-200/80 bg-white/88 text-slate-500 shadow-[0_18px_34px_-28px_rgba(71,85,105,0.55)] backdrop-blur transition hover:-translate-y-0.5 hover:border-primary/20 hover:text-primary",
          isCompact
            ? "size-[2.35rem] min-[390px]:size-[2.5rem] sm:size-[2.75rem] md:size-[3rem]"
            : "size-[2.65rem] min-[390px]:size-[2.8rem] sm:size-[3rem] md:size-[3.35rem]"
        )}
        onClick={onNotificationClick}
        aria-label={notificationAriaLabel}
      >
        <Bell
          className={cn(
            "translate-y-[-0.5px]",
            isCompact
              ? "size-[0.88rem] min-[390px]:size-[0.94rem] sm:size-[1rem] md:size-[1.1rem]"
              : "size-[0.98rem] min-[390px]:size-[1.04rem] sm:size-[1.1rem] md:size-[1.2rem]"
          )}
        />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-[0.65rem] font-bold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>
    </div>
  );
}

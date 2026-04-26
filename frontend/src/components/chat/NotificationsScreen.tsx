import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/stores/useChatStore";
import { useNotificationStore } from "@/stores/useNotificationStore";
import type { User } from "@/types/user";
import {
  ArrowLeft,
  Settings,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  filterLabels,
  type NotificationCategory,
  type NotificationItem,
} from "./notification-data";

export default function NotificationsScreen({
  user,
  onBack,
  onOpenSettings,
  initialReadIds = [],
}: {
  user?: User | null;
  onBack: () => void;
  onOpenSettings: () => void;
  initialReadIds?: string[];
}) {
  const [activeFilter, setActiveFilter] = useState<NotificationCategory>("all");
  const hasMarkedInitialRead = useRef(false);
  const conversations = useChatStore((state) => state.conversations);
  const { items: notifications, markAllAsRead, markAsRead, isRead, syncNotifications } =
    useNotificationStore();

  useEffect(() => {
    syncNotifications(user, conversations);
  }, [conversations, syncNotifications, user]);

  useEffect(() => {
    if (hasMarkedInitialRead.current || !initialReadIds.length) {
      return;
    }

    markAsRead(initialReadIds);
    hasMarkedInitialRead.current = true;
  }, [initialReadIds, markAsRead]);

  const visibleNotifications = notifications.filter(
    (item) => activeFilter === "all" || item.category === activeFilter
  );

  const todayItems = visibleNotifications.filter((item) => item.section === "today");
  const yesterdayItems = visibleNotifications.filter(
    (item) => item.section === "yesterday"
  );

  return (
    <div className="beautiful-scrollbar h-full min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1 pb-24 [scrollbar-gutter:stable] min-[390px]:pb-[6.5rem]">
      <div className="mx-auto flex min-h-full w-full max-w-[880px] flex-col px-4 sm:px-5 lg:px-6">
        <header className="study-dashboard-topbar sticky top-0 z-30 -mx-4 mb-4 flex items-center justify-between px-4 sm:-mx-5 sm:mb-5 sm:px-5 lg:-mx-6 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="study-dashboard-icon-button"
              onClick={onBack}
              aria-label="Quay lại trang chủ"
            >
              <ArrowLeft className="size-[1.125rem] text-primary" />
            </button>
            <button
              type="button"
              className="flex items-center gap-2.5"
              onClick={onBack}
            >
              <span className="font-auth-heading text-[0.96rem] font-extrabold tracking-[-0.04em] text-primary sm:text-[1.02rem]">
                Thông báo của bạn
              </span>
            </button>
          </div>

          <button
            type="button"
            className="study-dashboard-icon-button"
            onClick={onOpenSettings}
            aria-label="Mở cài đặt thông báo"
          >
            <Settings className="size-[1.125rem] text-primary" />
          </button>
        </header>

        <section className="pb-28">
          <div className="mb-4 flex justify-end">
            <Button
              type="button"
              variant="link"
              className="px-0 text-xs font-bold uppercase tracking-[0.18em]"
              onClick={markAllAsRead}
            >
              Đánh dấu đã đọc
            </Button>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            {(Object.keys(filterLabels) as NotificationCategory[]).map((filter) => {
              const active = activeFilter === filter;

              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[0.84rem] font-semibold transition-colors sm:px-3.5 sm:text-[0.88rem]",
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-[0_16px_26px_-18px_hsl(var(--primary)/0.6)]"
                      : "border-border bg-muted/40 text-foreground hover:border-primary/20 hover:text-primary"
                  )}
                >
                  {filterLabels[filter]}
                </button>
              );
            })}
          </div>

          <NotificationSection
            title="Hôm nay"
            items={todayItems}
            isRead={(item) => isRead(item.id, item.unread)}
          />
          <NotificationSection
            title="Hôm qua"
            items={yesterdayItems}
            isRead={(item) => isRead(item.id, item.unread)}
          />
          {visibleNotifications.length === 0 ? (
            <div className="rounded-[1.2rem] border border-dashed border-border/80 bg-card/70 px-4 py-6 text-center shadow-[0_14px_34px_-28px_hsl(var(--primary)/0.18)]">
              <p className="text-sm font-semibold text-muted-foreground">
                Chưa có thông báo nào trong mục này.
              </p>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function NotificationSection({
  title,
  items,
  isRead,
}: {
  title: string;
  items: NotificationItem[];
  isRead: (item: NotificationItem) => boolean;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="mb-6">
      <p className="mb-2.5 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </p>

      <div className="space-y-2.5">
        {items.map((item) => {
          const read = isRead(item);

          return (
            <article
              key={item.id}
              className="relative rounded-[1.15rem] border border-border/80 bg-white p-3 pr-7 shadow-[0_18px_40px_-28px_hsl(var(--foreground)/0.12)] sm:rounded-[1.35rem] sm:p-4 sm:pr-9"
            >
              {!read ? (
                <span className="absolute right-3 top-3 size-2.5 rounded-full bg-primary sm:right-4 sm:top-4" />
              ) : null}

              <div className="flex items-start gap-3">
                {item.avatarUrl ? (
                  <Avatar className="size-11 border border-border/70 sm:size-12">
                    <AvatarImage
                      src={item.avatarUrl}
                      alt={item.title}
                    />
                    <AvatarFallback>KH</AvatarFallback>
                  </Avatar>
                ) : (
                  <span
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-[0.95rem] sm:size-12 sm:rounded-[1rem]",
                      item.iconClassName
                    )}
                  >
                    <item.icon className="size-4.5 sm:size-5" />
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-start justify-between gap-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        "border-0 px-0 py-0 text-[0.76rem] font-bold uppercase tracking-[0.14em] sm:text-[0.8rem]",
                        item.category === "study" && "text-primary",
                        item.category === "community" && "text-sky-700",
                        item.category === "system" && "text-orange-700"
                      )}
                    >
                      {item.detail ?? categoryTitle(item.category)}
                    </Badge>
                    <span className="pt-0.5 text-[0.76rem] font-medium text-muted-foreground sm:text-[0.82rem]">
                      {item.timeLabel}
                    </span>
                  </div>

                  <h3 className="font-auth-heading text-[0.94rem] font-bold leading-5 tracking-[-0.03em] text-foreground sm:text-[1.02rem] sm:leading-6">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-[0.86rem] leading-5 text-foreground/80 sm:text-[0.92rem] sm:leading-6">
                    {item.body}
                  </p>

                  {item.progress !== undefined ? (
                    <div className="mt-4">
                      <div className="h-2.5 overflow-hidden rounded-full bg-border/70">
                        <div
                          className="h-full rounded-full bg-gradient-primary"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  ) : null}

                  {item.ctaPrimary || item.ctaSecondary ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.ctaPrimary ? (
                        <Button
                          type="button"
                          className="rounded-xl px-3.5 text-[0.72rem] font-bold uppercase tracking-[0.08em] sm:px-4 sm:text-[0.78rem]"
                        >
                          {item.ctaPrimary}
                        </Button>
                      ) : null}
                      {item.ctaSecondary ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl px-3.5 text-[0.72rem] font-bold uppercase tracking-[0.08em] text-primary sm:px-4 sm:text-[0.78rem]"
                        >
                          {item.ctaSecondary}
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function categoryTitle(category: Exclude<NotificationCategory, "all">) {
  if (category === "study") {
    return "Học tập";
  }

  if (category === "community") {
    return "Cộng đồng";
  }

  return "Hệ thống";
}

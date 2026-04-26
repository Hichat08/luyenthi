import AdminShell from "@/components/admin/AdminShell";
import { adminService, type AdminAnalyticsResponse } from "@/services/adminService";
import { AlertTriangle, Ban, ChartColumnBig, Target, TimerReset } from "lucide-react";
import { useEffect, useState } from "react";

const statCards = [
  { key: "inactiveTodayCount", label: "Chưa vào app hôm nay", icon: Ban },
  { key: "underTargetCount", label: "Chưa đủ 10 đề/ngày", icon: Target },
  { key: "suspiciousAttemptCount", label: "Ca nghi gian lận", icon: AlertTriangle },
  { key: "totalUsers", label: "Tổng học viên", icon: ChartColumnBig },
] as const;

const formatDateTime = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "Chưa vào hôm nay";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AdminAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const response = await adminService.getAnalytics();
        if (!cancelled) {
          setData(response);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Không thể tải analytics admin", error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminShell
      title="Thống kê và cảnh báo"
      description="Theo dõi học viên chưa vào app, chưa đủ 10 đề trong ngày, điểm trung bình và các ca có dấu hiệu rời khỏi bài thi."
    >
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          const value = data?.summary?.[card.key] ?? 0;

          return (
            <article
              key={card.key}
              className="rounded-[1.2rem] border border-border/75 bg-card/92 p-3.5 shadow-[0_18px_38px_-32px_hsl(var(--primary)/0.18)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="rounded-[0.9rem] bg-primary/10 p-2 text-primary">
                  <Icon className="size-4.5" strokeWidth={2} />
                </div>
                <span className="rounded-full bg-primary/8 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary/80">
                  Live
                </span>
              </div>
              <p className="mt-3 text-[12px] font-medium text-muted-foreground">{card.label}</p>
              <p className="mt-1 text-[1.55rem] font-black tracking-[-0.05em] text-primary">
                {loading ? "--" : value.toLocaleString("vi-VN")}
              </p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-[1.45rem] border border-border/75 bg-card/92 px-4 py-4 shadow-[0_20px_42px_-34px_hsl(var(--primary)/0.18)]">
          <h2 className="text-[1rem] font-black tracking-[-0.04em] text-foreground">
            Học viên chưa đủ 10 đề hôm nay
          </h2>
          <div className="mt-4 space-y-2.5">
            {(data?.usersMissingDailyTarget ?? []).slice(0, 12).map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between rounded-[1rem] border border-border/70 bg-background/75 px-3 py-2.5"
              >
                <div>
                  <p className="text-[13px] font-bold text-foreground">{user.displayName}</p>
                  <p className="text-[12px] text-muted-foreground">
                    @{user.username}
                    {user.userCode ? ` • ${user.userCode}` : ""}
                  </p>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                  {user.todayExamCount}/10 đề
                </span>
              </div>
            ))}
            {(data?.usersMissingDailyTarget?.length ?? 0) === 0 ? (
              <div className="rounded-[1rem] border border-dashed border-border/75 bg-background/70 px-4 py-5 text-[12px] text-muted-foreground">
                Không có học viên nào dưới mục tiêu hôm nay.
              </div>
            ) : null}
          </div>
        </article>

        <article className="rounded-[1.45rem] border border-border/75 bg-card/92 px-4 py-4 shadow-[0_20px_42px_-34px_hsl(var(--primary)/0.18)]">
          <h2 className="text-[1rem] font-black tracking-[-0.04em] text-foreground">
            Học viên chưa vào app hôm nay
          </h2>
          <div className="mt-4 space-y-2.5">
            {(data?.inactiveUsers ?? []).slice(0, 12).map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between rounded-[1rem] border border-border/70 bg-background/75 px-3 py-2.5"
              >
                <div>
                  <p className="text-[13px] font-bold text-foreground">{user.displayName}</p>
                  <p className="text-[12px] text-muted-foreground">
                    @{user.username}
                    {user.classroom ? ` • ${user.classroom}` : ""}
                  </p>
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {formatDateTime(user.lastActiveAt)}
                </span>
              </div>
            ))}
            {(data?.inactiveUsers?.length ?? 0) === 0 ? (
              <div className="rounded-[1rem] border border-dashed border-border/75 bg-background/70 px-4 py-5 text-[12px] text-muted-foreground">
                Tất cả học viên đã vào app hôm nay.
              </div>
            ) : null}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-[1.45rem] border border-border/75 bg-card/92 px-4 py-4 shadow-[0_20px_42px_-34px_hsl(var(--primary)/0.18)]">
          <h2 className="text-[1rem] font-black tracking-[-0.04em] text-foreground">
            Điểm trung bình mỗi học viên
          </h2>
          <div className="mt-4 overflow-hidden rounded-[1rem] border border-border/70">
            <table className="min-w-full divide-y divide-border/70">
              <thead className="bg-muted/36">
                <tr className="text-left text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  <th className="px-4 py-3">Học viên</th>
                  <th className="px-4 py-3">Điểm TB</th>
                  <th className="px-4 py-3">Hôm nay</th>
                  <th className="px-4 py-3">Số đề hôm nay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70 bg-card/95">
                {(data?.userScores ?? []).slice(0, 16).map((user) => (
                  <tr key={user._id}>
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-bold text-foreground">{user.displayName}</p>
                      <p className="text-[12px] text-muted-foreground">@{user.username}</p>
                    </td>
                    <td className="px-4 py-3 text-[12px] font-bold text-primary">
                      {user.averageScore.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-muted-foreground">
                      {user.todayAverageScore.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-muted-foreground">
                      {user.todayExamCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-[1.45rem] border border-border/75 bg-card/92 px-4 py-4 shadow-[0_20px_42px_-34px_hsl(var(--primary)/0.18)]">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-[0.85rem] bg-destructive/10 text-destructive">
              <TimerReset className="size-4" />
            </span>
            <div>
              <h2 className="text-[1rem] font-black tracking-[-0.04em] text-foreground">
                Cảnh báo gian lận
              </h2>
              <p className="text-[12px] text-muted-foreground">
                3 lần rời app sẽ tự động nộp bài và đánh dấu cần kiểm tra.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {(data?.suspiciousAttempts ?? []).slice(0, 12).map((attempt) => (
              <article
                key={attempt._id}
                className="rounded-[1rem] border border-destructive/15 bg-destructive/5 px-3 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-bold text-foreground">{attempt.displayName}</p>
                    <p className="text-[12px] text-muted-foreground">
                      @{attempt.username}
                      {attempt.userCode ? ` • ${attempt.userCode}` : ""}
                    </p>
                  </div>
                  <span className="rounded-full bg-destructive/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-destructive">
                    {attempt.suspiciousExitCount} lần thoát
                  </span>
                </div>
                <p className="mt-2 text-[12px] text-foreground/85">
                  {attempt.examTitle || "Bài thi"} {attempt.subject ? `• ${attempt.subject}` : ""}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {attempt.autoSubmittedForCheating
                    ? "Đã tự động nộp bài do vượt ngưỡng 3 lần rời app."
                    : "Đã bị đánh dấu cần admin kiểm tra."}
                </p>
              </article>
            ))}
            {(data?.suspiciousAttempts?.length ?? 0) === 0 ? (
              <div className="rounded-[1rem] border border-dashed border-border/75 bg-background/70 px-4 py-5 text-[12px] text-muted-foreground">
                Chưa ghi nhận ca nghi gian lận nào.
              </div>
            ) : null}
          </div>
        </article>
      </section>
    </AdminShell>
  );
}

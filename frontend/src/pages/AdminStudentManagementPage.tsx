import AdminShell from "@/components/admin/AdminShell";
import {
  adminService,
  type AdminStudentManagementResponse,
} from "@/services/adminService";

import {
  Activity,
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock3,
  Eye,
  ShieldAlert,
  Trophy,
  Users,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function AdminStudentManagementPage() {
  const [data, setData] =
    useState<AdminStudentManagementResponse | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [fetchError, setFetchError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadData = async (
      showError = true
    ) => {
      try {
        if (showError) {
          setLoading(true);
        }

        const response =
          await adminService.getStudentManagement();

        if (!cancelled) {
          setData(response);
          setFetchError(null);
        }
      } catch (error) {
        console.error(
          "Không thể tải dữ liệu quản lý học viên",
          error
        );

        if (!cancelled) {
          setFetchError(
            "Không thể tải dữ liệu realtime từ máy chủ."
          );
        }

        if (showError && !cancelled) {
          toast.error(
            "Không thể tải dữ liệu quản lý học viên."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadData(true);

    const intervalId =
      window.setInterval(() => {
        void loadData(false);
      }, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const quickStats = useMemo(
    () => [
      {
        label: "Thí sinh online",
        value:
          data?.stats.onlineCandidates ?? 0,
        icon: Users,
      },

      {
        label: "Đang làm bài",
        value:
          data?.stats
            .currentlyTakingExamCount ?? 0,
        icon: Activity,
      },

      {
        label: "Đã nộp hôm nay",
        value:
          data?.stats.submittedTodayCount ??
          0,
        icon: CheckCircle2,
      },

      {
        label: "Điểm trung bình",
        value: (
          data?.stats.averageScore ?? 0
        ).toFixed(2),
        icon: Award,
      },

      {
        label: "Điểm cao nhất",
        value: (
          data?.stats.highestScore ?? 0
        ).toFixed(2),
        icon: Trophy,
      },

      {
        label: "Tỉ lệ hoàn thành",
        value: `${
          data?.stats.completionRate ?? 0
        }%`,
        icon: Clock3,
      },

      {
        label: "Cảnh báo hôm nay",
        value:
          data?.stats
            .fraudAlertsTodayCount ?? 0,
        icon: ShieldAlert,
      },
    ],
    [data]
  );

  const studentRows =
    data?.studentRealtimeRows ?? [];

  const latestSubmissions =
    data?.latestSubmissions ?? [];

  const suspiciousAttempts =
    data?.suspiciousAttempts ?? [];

  const getStatusMeta = (
    status: string,
    warnings: number
  ) => {
    if (warnings >= 3) {
      return {
        label: "Nghi gian lận",
        tone: "text-rose-600",
      };
    }

    if (status === "submitted") {
      return {
        label: "Đã nộp",
        tone: "text-amber-600",
      };
    }

    if (status === "taking_exam") {
      return {
        label: "Đang thi",
        tone: "text-emerald-600",
      };
    }

    if (status === "online") {
      return {
        label: "Online",
        tone: "text-sky-600",
      };
    }

    return {
      label: "Offline",
      tone: "text-slate-500",
    };
  };

  return (
    <AdminShell
      title="Quản lý học viên"
      description="Theo dõi thí sinh realtime, nhận điểm ngay khi nộp bài và giám sát cảnh báo gian lận trên một màn hình điều hành tập trung."
    >
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {quickStats.map(
          ({ label, value, icon: Icon }) => (
            <article
              key={label}
              className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {label}
                </p>

                <Icon className="size-4 text-primary" />
              </div>

              <p className="mt-2 text-2xl font-black">
                {value}
              </p>
            </article>
          )
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <article className="rounded-2xl border border-border/70 bg-card p-4">
          <h2 className="text-base font-black">
            Danh sách thí sinh realtime
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            Ưu tiên hiển thị học viên mới nộp
            bài ở đầu danh sách.
          </p>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-b border-border/70 text-left text-muted-foreground">
                  <th className="py-2">
                    Họ tên
                  </th>

                  <th>Trạng thái</th>

                  <th>Thời gian</th>

                  <th>Điểm</th>

                  <th>Cảnh báo</th>
                </tr>
              </thead>

              <tbody>
                {studentRows.map((row) => {
                  const statusMeta =
                    getStatusMeta(
                      row.status,
                      row.warningCount
                    );

                  const timeLabel =
                    row.timeSpentSeconds > 0
                      ? `${Math.round(
                          row.timeSpentSeconds /
                            60
                        )} phút`
                      : "-";

                  return (
                    <tr
                      key={row.userId}
                      className="border-b border-border/50 last:border-b-0"
                    >
                      <td className="py-3 font-semibold">
                        {row.displayName}
                      </td>

                      <td
                        className={
                          statusMeta.tone
                        }
                      >
                        {statusMeta.label}
                      </td>

                      <td>{timeLabel}</td>

                      <td>
                        {typeof row.score ===
                        "number"
                          ? row.score.toFixed(2)
                          : "-"}
                      </td>

                      <td>
                        {row.warningCount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-2xl border border-border/70 bg-card p-4">
          <h2 className="text-base font-black">
            Thông báo trực tiếp
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            Cập nhật lần cuối:{" "}
            {data?.serverTime
              ? new Date(
                  data.serverTime
                ).toLocaleString("vi-VN")
              : "--"}
          </p>

          <div className="mt-3 space-y-2">
            {latestSubmissions.map((item) => (
              <div
                key={item.attemptId}
                className="rounded-xl border border-amber-200/70 bg-amber-50/60 p-3 text-sm"
              >
                <p className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 size-4 text-amber-600" />

                  <span>
                    [THÔNG BÁO MỚI]{" "}
                    {item.displayName} vừa nộp
                    bài -{" "}
                    {item.subject ||
                      "Chưa rõ môn"}{" "}
                    - {item.score.toFixed(2)}{" "}
                    điểm -{" "}
                    {Math.round(
                      item.timeSpentSeconds / 60
                    )}{" "}
                    phút
                  </span>
                </p>
              </div>
            ))}

            {!loading &&
            latestSubmissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Chưa có bài nộp mới trong hôm
                nay.
              </p>
            ) : null}

            {fetchError ? (
              <p className="text-sm font-semibold text-rose-600">
                {fetchError}
              </p>
            ) : null}
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-border/70 bg-card p-4">
          <h3 className="font-black">
            Cảnh báo gian lận mới nhất
          </h3>

          <div className="mt-2 space-y-2 text-sm text-muted-foreground">
            {suspiciousAttempts
              .slice(0, 3)
              .map((item) => (
                <p key={item._id}>
                  {item.subject ||
                    "Chưa rõ môn"}{" "}
                  •{" "}
                  {
                    item.suspiciousExitCount
                  }{" "}
                  lần rời tab
                </p>
              ))}

            {suspiciousAttempts.length ===
            0 ? (
              <p>
                Chưa có cảnh báo mới trong hôm
                nay.
              </p>
            ) : null}
          </div>
        </article>

        <article className="rounded-2xl border border-border/70 bg-card p-4">
          <h3 className="font-black">
            Leaderboard realtime
          </h3>

          <p className="mt-2 text-sm text-muted-foreground">
            Top điểm cao, nộp nhanh, ổn định
            theo lớp/trường.
          </p>
        </article>

        <article className="rounded-2xl border border-border/70 bg-card p-4">
          <h3 className="font-black">
            Bảo mật & phân quyền
          </h3>

          <p className="mt-2 text-sm text-muted-foreground">
            JWT, rate limit, audit log, vai
            trò Super Admin / Giáo viên / Giám
            thị.
          </p>
        </article>
      </section>

      <section className="rounded-2xl border border-dashed border-primary/35 bg-primary/5 p-4 text-sm text-muted-foreground">
        <p className="flex items-center gap-2 font-semibold text-foreground">
          <Eye className="size-4 text-primary" />
          Gợi ý triển khai realtime
        </p>

        <p className="mt-2">
          Dùng Socket.IO để cập nhật nộp
          bài/cảnh báo không cần F5, lưu log
          hành vi (tab switch, copy/paste, IP,
          thiết bị) và bổ sung phân tích AI sau
          khi có dữ liệu thật.
        </p>
      </section>
    </AdminShell>
  );
}
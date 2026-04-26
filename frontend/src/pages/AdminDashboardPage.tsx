import AdminShell from "@/components/admin/AdminShell";
import { adminService, type AdminOverviewResponse } from "@/services/adminService";
import { ShieldCheck, Users, UserRoundCog, UserRoundPlus } from "lucide-react";
import { useEffect, useState } from "react";

const statCards = [
  { key: "totalUsers", label: "Tổng người dùng", icon: Users },
  { key: "totalStudents", label: "Tài khoản học viên", icon: ShieldCheck },
  { key: "totalAdmins", label: "Tài khoản admin", icon: UserRoundCog },
  { key: "newUsersThisMonth", label: "Người dùng mới tháng này", icon: UserRoundPlus },
] as const;

const formatRoleLabel = (role: "user" | "admin") => (role === "admin" ? "Admin" : "User");

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadOverview = async () => {
      try {
        setLoading(true);
        const data = await adminService.getOverview();
        if (!cancelled) {
          setOverview(data);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Không thể tải admin overview", error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadOverview();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminShell
      title="Bảng điều khiển quản trị"
      description="Theo dõi tài khoản, kiểm tra phân quyền và dùng route riêng cho admin."
    >
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          const value = overview?.stats?.[card.key] ?? 0;

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

      <section className="rounded-[1.45rem] border border-border/75 bg-card/92 px-4 py-4 shadow-[0_20px_42px_-34px_hsl(var(--primary)/0.18)]">
        <div>
          <h2 className="text-[1rem] font-black tracking-[-0.04em] text-foreground">
            Người dùng mới nhất
          </h2>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Danh sách này chỉ trả về khi tài khoản có role `admin`.
          </p>
        </div>

        <div className="mt-4 overflow-hidden rounded-[1rem] border border-border/70">
          <table className="min-w-full divide-y divide-border/70">
            <thead className="bg-muted/36">
              <tr className="text-left text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                <th className="px-4 py-3.5">Người dùng</th>
                <th className="px-4 py-3.5">Vai trò</th>
                <th className="px-4 py-3.5">Lớp</th>
                <th className="px-4 py-3.5">Tạo lúc</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70 bg-card/95">
              {(overview?.latestUsers ?? []).map((member) => (
                <tr key={member._id}>
                  <td className="px-4 py-3.5">
                    <p className="text-[13px] font-bold text-foreground">{member.displayName}</p>
                    <p className="text-[12px] text-muted-foreground">@{member.username}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                      {formatRoleLabel(member.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-[12px] text-muted-foreground">
                    {member.classroom || "Chưa cập nhật"}
                  </td>
                  <td className="px-4 py-3.5 text-[12px] text-muted-foreground">
                    {member.createdAt
                      ? new Intl.DateTimeFormat("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(member.createdAt))
                      : "--"}
                  </td>
                </tr>
              ))}
              {!loading && (overview?.latestUsers?.length ?? 0) === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-[12px] text-muted-foreground" colSpan={4}>
                    Chưa có dữ liệu người dùng.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}

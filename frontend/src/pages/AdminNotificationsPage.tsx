import AdminShell from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { adminService, type AdminNotificationRecord, type AdminNotificationTargetUser } from "@/services/adminService";
import { toast } from "sonner";
import { BellRing, BookOpen, Search, Send, Sparkles, UserRoundX, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const notificationTemplates = [
  {
    key: "new-lesson",
    label: "Thêm bài mới",
    category: "study" as const,
    title: "Đã có bài mới trong lộ trình học",
    body: "Hệ thống vừa cập nhật bài mới. Vào ngay mục luyện tập để không bỏ lỡ tiến độ hôm nay.",
  },
  {
    key: "practice-reminder",
    label: "Nhắc luyện tập",
    category: "study" as const,
    title: "Đã đến giờ luyện tập",
    body: "Bạn hãy dành ít nhất 30 phút để làm bài và giữ nhịp ôn thi trong hôm nay.",
  },
  {
    key: "system-update",
    label: "Thông báo hệ thống",
    category: "system" as const,
    title: "Thông báo mới từ quản trị viên",
    body: "Hệ thống có cập nhật mới. Hãy kiểm tra ứng dụng để theo dõi thay đổi mới nhất.",
  },
];

const formatDateTime = (value?: string) =>
  value
    ? new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "--";

export default function AdminNotificationsPage() {
  const [audience, setAudience] = useState<"all" | "selected">("all");
  const [category, setCategory] = useState<"study" | "system">("study");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [query, setQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<AdminNotificationTargetUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<AdminNotificationTargetUser[]>([]);
  const [history, setHistory] = useState<AdminNotificationRecord[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadHistory = async () => {
    try {
      const notifications = await adminService.listNotifications();
      setHistory(notifications);
    } catch (error) {
      console.error("Không thể tải lịch sử notification", error);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  useEffect(() => {
    if (audience !== "selected") {
      setSearchResults([]);
      return;
    }

    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      setSearchResults([]);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        setSearchLoading(true);
        const users = await adminService.searchUsersForNotification(normalizedQuery);

        if (!cancelled) {
          setSearchResults(users);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Không thể tìm user cho notification", error);
        }
      } finally {
        if (!cancelled) {
          setSearchLoading(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [audience, query]);

  const selectedUserIds = useMemo(
    () => selectedUsers.map((user) => user._id),
    [selectedUsers]
  );

  const applyTemplate = (template: (typeof notificationTemplates)[number]) => {
    setCategory(template.category);
    setTitle(template.title);
    setBody(template.body);
  };

  const addRecipient = (user: AdminNotificationTargetUser) => {
    setSelectedUsers((current) =>
      current.some((member) => member._id === user._id) ? current : [...current, user]
    );
    setQuery("");
    setSearchResults([]);
  };

  const removeRecipient = (userId: string) => {
    setSelectedUsers((current) => current.filter((member) => member._id !== userId));
  };

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();

    if (!trimmedTitle || !trimmedBody) {
      toast.error("Cần nhập tiêu đề và nội dung thông báo.");
      return;
    }

    if (audience === "selected" && selectedUserIds.length === 0) {
      toast.error("Hãy chọn ít nhất một người dùng.");
      return;
    }

    try {
      setSubmitting(true);
      await adminService.createNotification({
        title: trimmedTitle,
        body: trimmedBody,
        category,
        audience,
        recipientIds: selectedUserIds,
      });
      toast.success("Đã gửi thông báo.");
      setTitle("");
      setBody("");
      setQuery("");
      setSelectedUsers([]);
      await loadHistory();
    } catch (error) {
      console.error("Không thể gửi notification", error);
      toast.error("Gửi thông báo thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminShell
      title="Thông báo quản trị"
      description="Gửi thông báo tới toàn bộ học viên hoặc gọi tên, username, userCode và ID để gửi đúng người cần nhắc."
    >
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <article className="rounded-[1.45rem] border border-border/75 bg-card/92 p-4 shadow-[0_20px_42px_-34px_hsl(var(--primary)/0.18)]">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-[0.85rem] bg-primary/10 text-primary">
              <BellRing className="size-4" />
            </span>
            <div>
              <h2 className="text-[0.98rem] font-black tracking-[-0.04em] text-foreground">
                Tạo thông báo mới
              </h2>
              <p className="text-[12px] text-muted-foreground">
                Dùng mẫu nhanh hoặc soạn nội dung riêng.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {notificationTemplates.map((template) => (
              <button
                key={template.key}
                type="button"
                className="rounded-full border border-primary/16 bg-primary/6 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-primary transition hover:bg-primary/10"
                onClick={() => applyTemplate(template)}
              >
                {template.label}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Loại thông báo
              </p>
              <div className="flex gap-2">
                {[
                  { value: "study", label: "Học tập", icon: BookOpen },
                  { value: "system", label: "Hệ thống", icon: Sparkles },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = category === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      className={`flex flex-1 items-center justify-center gap-2 rounded-[0.95rem] border px-3 py-2 text-[12px] font-bold transition ${
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:border-primary/16 hover:text-primary"
                      }`}
                      onClick={() => setCategory(item.value as "study" | "system")}
                    >
                      <Icon className="size-4" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Người nhận
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`flex flex-1 items-center justify-center gap-2 rounded-[0.95rem] border px-3 py-2 text-[12px] font-bold transition ${
                    audience === "all"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/16 hover:text-primary"
                  }`}
                  onClick={() => setAudience("all")}
                >
                  <Users className="size-4" />
                  Toàn bộ user
                </button>
                <button
                  type="button"
                  className={`flex flex-1 items-center justify-center gap-2 rounded-[0.95rem] border px-3 py-2 text-[12px] font-bold transition ${
                    audience === "selected"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/16 hover:text-primary"
                  }`}
                  onClick={() => setAudience("selected")}
                >
                  <Search className="size-4" />
                  Gọi tên user
                </button>
              </div>
            </div>
          </div>

          {audience === "selected" ? (
            <div className="mt-4 rounded-[1.1rem] border border-border/70 bg-background/72 p-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Tìm theo tên, username, userCode hoặc ID
              </p>
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A, 12345678, username..."
                  className="h-10 rounded-[0.95rem] border-border/75 bg-background pl-9 text-[13px]"
                />
              </div>

              {selectedUsers.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedUsers.map((user) => (
                    <span
                      key={user._id}
                      className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-bold text-primary"
                    >
                      {user.displayName}
                      <button
                        type="button"
                        className="text-primary/80 hover:text-primary"
                        onClick={() => removeRecipient(user._id)}
                      >
                        <UserRoundX className="size-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="mt-3 space-y-2">
                {searchLoading ? (
                  <p className="text-[12px] text-muted-foreground">Đang tìm người dùng...</p>
                ) : null}
                {!searchLoading && searchResults.length > 0
                  ? searchResults.map((user) => (
                      <button
                        key={user._id}
                        type="button"
                        className="flex w-full items-center justify-between rounded-[0.95rem] border border-border/70 bg-card px-3 py-2.5 text-left transition hover:border-primary/18 hover:bg-primary/6"
                        onClick={() => addRecipient(user)}
                      >
                        <div>
                          <p className="text-[13px] font-bold text-foreground">{user.displayName}</p>
                          <p className="text-[12px] text-muted-foreground">
                            @{user.username}
                            {user.userCode ? ` • ID ${user.userCode}` : ""}
                          </p>
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
                          Chọn
                        </span>
                      </button>
                    ))
                  : null}
                {!searchLoading && query.trim() && searchResults.length === 0 ? (
                  <p className="text-[12px] text-muted-foreground">Không tìm thấy người dùng phù hợp.</p>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Tiêu đề
              </p>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ví dụ: Đã có bài mới trong hệ thống"
                className="h-10 rounded-[0.95rem] border-border/75 bg-background text-[13px]"
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Nội dung
              </p>
              <Textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Nhập lời nhắc, thông báo thêm bài mới hoặc yêu cầu luyện tập..."
                className="min-h-28 rounded-[1rem] border-border/75 bg-background px-3 py-2.5 text-[13px]"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              disabled={submitting}
              className="h-10 rounded-[0.95rem] px-4 text-[12px] font-bold uppercase tracking-[0.14em] shadow-[0_18px_34px_-24px_hsl(var(--primary)/0.55)]"
              onClick={() => void handleSubmit()}
            >
              <Send className="size-4" />
              Gửi thông báo
            </Button>
          </div>
        </article>

        <article className="rounded-[1.45rem] border border-border/75 bg-card/92 px-4 py-4 shadow-[0_20px_42px_-34px_hsl(var(--primary)/0.18)]">
          <div>
            <h2 className="text-[0.98rem] font-black tracking-[-0.04em] text-foreground">
              Lịch sử gửi gần đây
            </h2>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Theo dõi thông báo đã phát cho toàn user hoặc từng người dùng cụ thể.
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {history.map((item) => (
              <article
                key={item.id}
                className="rounded-[1.1rem] border border-border/70 bg-background/78 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-bold text-foreground">{item.title}</p>
                    <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
                      {item.body}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                    {item.category === "study" ? "Học tập" : "Hệ thống"}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                  <span className="rounded-full bg-muted px-2.5 py-1">
                    {item.audience === "all" ? "Toàn bộ user" : `${item.recipients.length} người nhận`}
                  </span>
                  <span className="rounded-full bg-muted px-2.5 py-1">
                    {formatDateTime(item.createdAt)}
                  </span>
                </div>

                {item.audience === "selected" && item.recipients.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.recipients.slice(0, 4).map((recipient) => (
                      <span
                        key={recipient._id}
                        className="rounded-full bg-primary/8 px-2.5 py-1 text-[10px] font-bold text-primary"
                      >
                        {recipient.displayName}
                      </span>
                    ))}
                    {item.recipients.length > 4 ? (
                      <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
                        +{item.recipients.length - 4}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </article>
            ))}

            {history.length === 0 ? (
              <div className="rounded-[1.1rem] border border-dashed border-border/75 bg-background/70 px-4 py-6 text-center text-[12px] text-muted-foreground">
                Chưa có thông báo nào được gửi.
              </div>
            ) : null}
          </div>
        </article>
      </section>
    </AdminShell>
  );
}

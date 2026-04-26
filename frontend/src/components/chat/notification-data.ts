import type { User } from "@/types/user";
import type { Conversation, Message } from "@/types/chat";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Clock3,
  Megaphone,
  MessageCircleMore,
  Settings,
  Users,
} from "lucide-react";

export type NotificationCategory = "all" | "study" | "community" | "system";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  detail?: string;
  section: "today" | "yesterday";
  timeLabel: string;
  category: Exclude<NotificationCategory, "all">;
  unread: boolean;
  icon: LucideIcon;
  iconClassName: string;
  progress?: number;
  avatarUrl?: string;
  ctaPrimary?: string;
  ctaSecondary?: string;
};

export type RemoteNotificationPayload = {
  id: string;
  title: string;
  body: string;
  category: Exclude<NotificationCategory, "all" | "community">;
  createdAt?: string;
};

export const filterLabels: Record<NotificationCategory, string> = {
  all: "Tất cả",
  study: "Học tập",
  community: "Cộng đồng",
  system: "Hệ thống",
};

const getNotificationSection = (dateValue?: string | null): "today" | "yesterday" => {
  if (!dateValue) {
    return "today";
  }

  const date = new Date(dateValue);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return date >= startOfToday ? "today" : "yesterday";
};

const getRelativeTimeLabel = (dateValue?: string | null) => {
  if (!dateValue) {
    return "Vừa xong";
  }

  const diffMs = Date.now() - new Date(dateValue).getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));

  if (diffMinutes < 1) {
    return "Vừa xong";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} phút trước`;
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} ngày trước`;
};

const getUniqueSelectedSubjects = (user?: User | null) =>
  (
    user?.studyGoals?.selectedSubjects?.length
      ? user.studyGoals.selectedSubjects
      : user?.studyGoals?.subjects?.map((item) => item.subject) ?? []
  ).filter((subject, index, array) => Boolean(subject) && array.indexOf(subject) === index);

export const buildRemoteNotificationItem = (
  notification: RemoteNotificationPayload
): NotificationItem => ({
  id: `admin-${notification.id}`,
  title: notification.title,
  body: notification.body,
  detail: notification.category === "study" ? "Thông báo học tập" : "Thông báo hệ thống",
  section: getNotificationSection(notification.createdAt),
  timeLabel: getRelativeTimeLabel(notification.createdAt),
  category: notification.category,
  unread: true,
  icon: notification.category === "study" ? BookOpen : Megaphone,
  iconClassName:
    notification.category === "study"
      ? "bg-primary/10 text-primary"
      : "bg-primary/12 text-primary",
  ctaPrimary: notification.category === "study" ? "Mở lộ trình" : undefined,
});

export function buildNotifications(
  user?: User | null,
  conversations: Conversation[] = []
): NotificationItem[] {
  const userId = user?._id;
  const selectedSubjects = getUniqueSelectedSubjects(user);
  const items: NotificationItem[] = [];

  if (!selectedSubjects.length) {
    items.push({
      id: "system-missing-subjects",
      title: "Bạn chưa chọn môn ôn thi",
      body: "Hãy chọn môn ôn thi để hệ thống cá nhân hóa lộ trình học và gợi ý nội dung phù hợp.",
      detail: "Thiết lập cá nhân",
      section: "today",
      timeLabel: "Hôm nay",
      category: "system",
      unread: true,
      icon: Settings,
      iconClassName: "bg-orange-100 text-orange-700",
      ctaPrimary: "Chọn môn ngay",
    });
  } else {
    items.push({
      id: "study-selected-subjects",
      title: `Bạn đang theo dõi ${selectedSubjects.length} môn ôn thi`,
      body: `Các môn hiện tại: ${selectedSubjects.join(", ")}.`,
      detail: "Môn ôn thi",
      section: "today",
      timeLabel: "Hôm nay",
      category: "study",
      unread: false,
      icon: BookOpen,
      iconClassName: "bg-primary/10 text-primary",
    });
  }

  if (!user?.schoolSchedule?.hasCompletedSetup) {
    items.push({
      id: "system-missing-schedule",
      title: "Bạn chưa hoàn tất thời gian biểu tại trường",
      body: "Thiết lập giờ học cố định để ứng dụng tránh xếp lịch học cá nhân chồng lên lịch trên lớp.",
      detail: "Thiết lập cá nhân",
      section: "today",
      timeLabel: "Hôm nay",
      category: "system",
      unread: true,
      icon: Clock3,
      iconClassName: "bg-orange-100 text-orange-700",
      ctaPrimary: "Thiết lập ngay",
    });
  }

  conversations.forEach((conversation) => {
    const unreadCount = userId ? Math.max(0, conversation.unreadCounts?.[userId] ?? 0) : 0;
    const lastMessageAt = conversation.lastMessageAt ?? conversation.updatedAt;
    const lastMessage = conversation.lastMessage;

    if (unreadCount <= 0 || !lastMessage) {
      return;
    }

    const isCommunityConversation =
      conversation.isCommunity || conversation.type === "community";
    const senderName = lastMessage.sender?.displayName?.trim() || "Một thành viên";
    const body = lastMessage.content?.trim() || "Bạn có một tin nhắn mới.";

    let title = `${senderName} đã gửi ${unreadCount} tin nhắn mới`;
    let detail = "Tin nhắn trực tiếp";
    let icon: LucideIcon = MessageCircleMore;
    let iconClassName = "bg-primary/10 text-primary";

    if (isCommunityConversation) {
      title = `${senderName} đang hoạt động trong Community Live`;
      detail = "Cộng đồng";
      icon = Users;
      iconClassName = "bg-sky-100 text-sky-700";
    } else if (conversation.type === "group") {
      const groupName = conversation.group?.name?.trim() || "nhóm học tập";
      title = `${groupName} có ${unreadCount} tin nhắn chưa đọc`;
      detail = "Nhóm học tập";
      icon = Users;
      iconClassName = "bg-sky-100 text-sky-700";
    }

    items.push({
      id: lastMessage._id
        ? `message-${lastMessage._id}`
        : `conversation-${conversation._id}-${lastMessageAt ?? "latest"}`,
      title,
      body,
      detail,
      section: getNotificationSection(lastMessageAt),
      timeLabel: getRelativeTimeLabel(lastMessageAt),
      category: "community",
      unread: true,
      icon,
      iconClassName,
      avatarUrl: conversation.type === "direct" ? lastMessage.sender?.avatarUrl ?? undefined : undefined,
      ctaPrimary: "Mở cuộc trò chuyện",
    });
  });

  return items.sort((a, b) => {
    if (a.section === b.section) {
      return Number(b.unread) - Number(a.unread);
    }

    return a.section === "today" ? -1 : 1;
  });
}

export function buildMessageNotification({
  conversation,
  message,
  currentUserId,
}: {
  conversation: Partial<Conversation> &
    Pick<Conversation, "_id"> & {
      participants?: Conversation["participants"];
    };
  message: Message;
  currentUserId?: string | null;
}): NotificationItem | null {
  const senderFromMessage =
    message.sender ??
    (typeof message.senderId === "object" && message.senderId ? message.senderId : null);
  const senderId =
    typeof message.senderId === "string" ? message.senderId : message.senderId?._id;

  if (!senderId || (currentUserId && senderId === currentUserId)) {
    return null;
  }

  const senderFromParticipants = (conversation.participants ?? []).find(
    (participant) => participant._id === senderId
  );
  const senderName =
    senderFromMessage?.displayName?.trim() ||
    senderFromParticipants?.displayName?.trim() ||
    "Một thành viên";
  const avatarUrl =
    senderFromMessage?.avatarUrl ?? senderFromParticipants?.avatarUrl ?? undefined;
  const body =
    message.content?.trim() ||
    (message.imgUrl ? "Đã gửi một hình ảnh." : "Bạn có một tin nhắn mới.");
  const isCommunityConversation =
    conversation.isCommunity || conversation.type === "community";

  let title = `${senderName} đã gửi cho bạn một tin nhắn mới`;
  let detail = "Tin nhắn trực tiếp";

  if (isCommunityConversation) {
    title = `${senderName} vừa nhắn trong Community Live`;
    detail = "Cộng đồng";
  } else if (conversation.type === "group") {
    const groupName = conversation.group?.name?.trim() || "nhóm học tập";
    title = `${senderName} vừa nhắn trong ${groupName}`;
    detail = "Nhóm học tập";
  }

  return {
    id: `message-${message._id}`,
    title,
    body,
    detail,
    section: "today",
    timeLabel: "Vừa xong",
    category: "community",
    unread: true,
    icon: isCommunityConversation || conversation.type === "group" ? Users : MessageCircleMore,
    iconClassName: isCommunityConversation || conversation.type === "group"
      ? "bg-sky-100 text-sky-700"
      : "bg-primary/10 text-primary",
    avatarUrl,
  };
}

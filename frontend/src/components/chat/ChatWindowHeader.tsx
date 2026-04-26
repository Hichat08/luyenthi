import type { Conversation } from "@/types/chat";
import { useAuthStore } from "@/stores/useAuthStore";
import UserAvatar from "./UserAvatar";
import StatusBadge from "./StatusBadge";
import GroupChatAvatar from "./GroupChatAvatar";
import { useSocketStore } from "@/stores/useSocketStore";
import { ArrowLeft, Users } from "lucide-react";
import { useNavigate } from "react-router";

const ChatWindowHeader = ({ chat }: { chat?: Conversation }) => {
  const { user } = useAuthStore();
  const { onlineUsers } = useSocketStore();
  const navigate = useNavigate();

  let otherUser;

  if (!chat) {
    return null;
  }

  if (chat.type === "community") {
    return (
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border/70 bg-background px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/8"
            onClick={() => navigate("/home")}
            aria-label="Quay lại trang chủ"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <h2 className="font-auth-heading text-[1.3rem] font-extrabold tracking-[-0.04em] text-primary">
              Community Live
            </h2>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Phòng chat học tập mở
            </p>
          </div>
        </div>

        <div className="flex size-10 items-center justify-center rounded-full border border-primary/15 bg-primary/5 text-primary">
          <Users className="size-5" />
        </div>
      </header>
    );
  }

  if (chat.type === "direct") {
    const otherUsers = chat.participants.filter((p) => p._id !== user?._id);
    otherUser = otherUsers.length > 0 ? otherUsers[0] : null;

    if (!user || !otherUser) return;
  }

  return (
    <header className="sticky top-0 z-10 px-4 py-2 flex items-center bg-background">
      <div className="flex w-full items-center gap-3 p-2">
        <button
          type="button"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/8"
          onClick={() => navigate("/home")}
          aria-label="Quay lại trang chủ"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="relative">
          {chat.type === "direct" ? (
            <>
              <UserAvatar
                type={"sidebar"}
                name={otherUser?.displayName || "Lộ trình học tập"}
                avatarUrl={otherUser?.avatarUrl || undefined}
              />
              <StatusBadge
                status={
                  onlineUsers.includes(otherUser?._id ?? "") ? "online" : "offline"
                }
              />
            </>
          ) : (
            <GroupChatAvatar
              participants={chat.participants}
              type="sidebar"
            />
          )}
        </div>

        <h2 className="font-semibold text-foreground">
          {chat.type === "direct" ? otherUser?.displayName : chat.group?.name}
        </h2>
      </div>
    </header>
  );
};

export default ChatWindowHeader;

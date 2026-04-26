import { create } from "zustand";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "./useAuthStore";
import type { SocketState } from "@/types/store";
import { useChatStore } from "./useChatStore";
import { useNotificationStore } from "./useNotificationStore";
import { buildMessageNotification } from "@/components/chat/notification-data";
import type { Conversation } from "@/types/chat";

const baseURL = import.meta.env.VITE_SOCKET_URL;

const normalizeSocketId = (value: unknown): string => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    const record = value as { _id?: unknown; toString?: () => string };

    if ("_id" in record && record._id) {
      return normalizeSocketId(record._id);
    }

    if (typeof record.toString === "function") {
      const normalized = record.toString();
      return normalized === "[object Object]" ? "" : normalized;
    }
  }

  return String(value);
};

const buildConversationUpdatePayload = (
  conversation: {
    _id?: unknown;
    lastMessage?: {
      _id?: unknown;
      content?: string | null;
      createdAt?: string | Date | null;
      senderId?: unknown;
    } | null;
    lastMessageAt?: string | Date;
    unreadCounts?: Record<string, number>;
    seenBy?: Conversation["seenBy"];
  },
  unreadCounts?: Record<string, number>
): Partial<Conversation> & Pick<Conversation, "_id"> => ({
  ...conversation,
  _id: normalizeSocketId(conversation?._id),
  lastMessage: conversation?.lastMessage
    ? {
        _id: normalizeSocketId(conversation.lastMessage._id),
        content: conversation.lastMessage.content ?? "",
        createdAt:
          conversation.lastMessage.createdAt instanceof Date
            ? conversation.lastMessage.createdAt.toISOString()
            : conversation.lastMessage.createdAt ?? "",
        sender: {
          _id: normalizeSocketId(conversation.lastMessage.senderId),
          displayName: "",
          avatarUrl: null,
        },
      }
    : null,
  lastMessageAt:
    conversation?.lastMessageAt instanceof Date
      ? conversation.lastMessageAt.toISOString()
      : conversation?.lastMessageAt,
  unreadCounts: unreadCounts ?? conversation?.unreadCounts ?? {},
});

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  onlineUsers: [],
  connectSocket: () => {
    const accessToken = useAuthStore.getState().accessToken;
    const existingSocket = get().socket;

    if (existingSocket) return; // tránh tạo nhiều socket

    const socket: Socket = io(baseURL, {
      auth: { token: accessToken },
      transports: ["websocket"],
    });

    set({ socket });

    socket.on("connect", () => {
      console.log("Đã kết nối với socket");
    });

    socket.on("connect_error", (error) => {
      const errorCode =
        typeof error === "object" && error && "data" in error
          ? (error.data as { code?: string } | undefined)?.code
          : undefined;

      console.error("Lỗi kết nối socket:", errorCode ?? error.message);

      if (
        errorCode === "TOKEN_EXPIRED" ||
        errorCode === "INVALID_TOKEN" ||
        errorCode === "DB_UNAVAILABLE"
      ) {
        socket.disconnect();
        set({ socket: null });
      }
    });

    // online users
    socket.on("online-users", (userIds) => {
      set({ onlineUsers: userIds });
    });

    // new message
    socket.on("new-message", ({ message, conversation, unreadCounts }) => {
      useChatStore.getState().addMessage(message);
      const { user } = useAuthStore.getState();
      const { activeConversationId, chatWindowOpen } = useChatStore.getState();
      const incomingConversationId = normalizeSocketId(
        conversation?._id ?? message?.conversationId
      );
      const hasConversationInState = useChatStore
        .getState()
        .conversations.some(
          (existingConversation) =>
            normalizeSocketId(existingConversation._id) === incomingConversationId
        );

      const updatedConversation = buildConversationUpdatePayload(
        {
          ...conversation,
          _id: incomingConversationId,
        },
        unreadCounts
      );

      if (
        chatWindowOpen &&
        activeConversationId === normalizeSocketId(message.conversationId)
      ) {
        useChatStore.getState().markAsSeen();
      } else {
        const notification = buildMessageNotification({
          conversation: updatedConversation,
          message,
          currentUserId: user?._id,
        });

        if (notification) {
          useNotificationStore
            .getState()
            .addLiveNotification(
              notification,
              user,
              useChatStore.getState().conversations
            );
        }
      }

      useChatStore.getState().updateConversation(updatedConversation);

      if (!hasConversationInState) {
        void useChatStore.getState().fetchConversations();
      }
    });

    socket.on("conversation-updated", ({ conversation, unreadCounts }) => {
      const updatedConversation = buildConversationUpdatePayload(
        conversation,
        unreadCounts
      );
      const hasConversationInState = useChatStore
        .getState()
        .conversations.some(
          (existingConversation) =>
            normalizeSocketId(existingConversation._id) ===
            normalizeSocketId(updatedConversation._id)
        );

      useChatStore.getState().updateConversation(updatedConversation);

      if (!hasConversationInState) {
        void useChatStore.getState().fetchConversations();
      }
    });

    // read message
    socket.on("read-message", ({ conversation, lastMessage }) => {
      const updated = {
        _id: normalizeSocketId(conversation._id),
        lastMessage,
        lastMessageAt: conversation.lastMessageAt,
        unreadCounts: conversation.unreadCounts,
        seenBy: conversation.seenBy,
      };

      useChatStore.getState().updateConversation(updated);
    });

    // new group chat
    socket.on("new-group", (conversation) => {
      useChatStore.getState().addConvo(conversation);
      socket.emit("join-conversation", conversation._id);
    });
  },
  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));

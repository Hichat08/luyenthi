import { chatService } from "@/services/chatService";
import type { ChatState } from "@/types/store";
import type { Conversation, Message } from "@/types/chat";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";
import { useSocketStore } from "./useSocketStore";

const getNormalizedId = (value: unknown): string => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    const record = value as { _id?: unknown; toString?: () => string };

    if ("_id" in record && record._id) {
      return getNormalizedId(record._id);
    }

    if (typeof record.toString === "function") {
      const normalized = record.toString();
      return normalized === "[object Object]" ? "" : normalized;
    }
  }

  return String(value);
};

const normalizeIncomingMessage = (
  message: Message,
  currentUserId?: string | null
): Message => {
  const senderId = getNormalizedId(message.senderId);
  const senderFromSenderId =
    typeof message.senderId === "object" && message.senderId
      ? {
          _id: senderId,
          displayName:
            "displayName" in message.senderId &&
            typeof message.senderId.displayName === "string"
              ? message.senderId.displayName
              : "",
          avatarUrl:
            "avatarUrl" in message.senderId &&
            (typeof message.senderId.avatarUrl === "string" ||
              message.senderId.avatarUrl === null)
              ? message.senderId.avatarUrl
              : null,
          classroom:
            "classroom" in message.senderId &&
            (typeof message.senderId.classroom === "string" ||
              message.senderId.classroom === null)
              ? message.senderId.classroom
              : null,
        }
      : null;

  return {
    ...message,
    conversationId: getNormalizedId(message.conversationId),
    senderId,
    sender: message.sender ?? senderFromSenderId,
    isOwn: senderId === getNormalizedId(currentUserId),
  };
};

const mergeUniqueMessages = (...lists: Message[][]): Message[] => {
  const merged: Message[] = [];
  const seen = new Set<string>();

  lists.forEach((list) => {
    list.forEach((message) => {
      if (message._id && seen.has(message._id)) {
        return;
      }

      if (message._id) {
        seen.add(message._id);
      }

      merged.push(message);
    });
  });

  return merged;
};

const sortConversationsByLatest = (conversations: Conversation[]) =>
  [...conversations].sort((a, b) => {
    const aTime = new Date(a.lastMessageAt ?? a.updatedAt ?? a.createdAt).getTime();
    const bTime = new Date(b.lastMessageAt ?? b.updatedAt ?? b.createdAt).getTime();

    return bTime - aTime;
  });

const isCompleteConversation = (
  conversation: Partial<Conversation>
): conversation is Conversation =>
  Array.isArray(conversation.participants) &&
  typeof conversation.type === "string" &&
  conversation.lastMessageAt !== undefined &&
  conversation.seenBy !== undefined &&
  conversation.unreadCounts !== undefined &&
  conversation.createdAt !== undefined &&
  conversation.updatedAt !== undefined;

const getChatUnreadCount = (
  conversations: Conversation[],
  currentUserId?: string | null
) => {
  if (!currentUserId) {
    return 0;
  }

  return conversations.reduce((sum, conversation) => {
    return sum + Math.max(0, conversation.unreadCounts?.[currentUserId] ?? 0);
  }, 0);
};

let fetchConversationsPromise: Promise<void> | null = null;
let fetchCommunityConversationPromise: Promise<void> | null = null;
const messageRequestLocks = new Map<string, Promise<void>>();
const seenRequestLocks = new Set<string>();

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      messages: {},
      activeConversationId: null,
      chatWindowOpen: false,
      chatUnreadCount: 0,
      convoLoading: false, // convo loading
      messageLoading: false,
      loading: false,

      setActiveConversation: (id) => set({ activeConversationId: id }),
      setChatWindowOpen: (open) => set({ chatWindowOpen: open }),
      reset: () => {
        set({
          conversations: [],
          messages: {},
          activeConversationId: null,
          chatWindowOpen: false,
          chatUnreadCount: 0,
          convoLoading: false,
          messageLoading: false,
        });
      },
      fetchConversations: async () => {
        if (fetchConversationsPromise) {
          return fetchConversationsPromise;
        }

        fetchConversationsPromise = (async () => {
          try {
            set({ convoLoading: true });
            const { conversations } = await chatService.fetchConversations();
            const { user } = useAuthStore.getState();

            set({
              conversations,
              chatUnreadCount: getChatUnreadCount(conversations, user?._id),
              convoLoading: false,
            });
          } catch (error) {
            console.error("Lỗi xảy ra khi fetchConversations:", error);
            set({ convoLoading: false });
          } finally {
            fetchConversationsPromise = null;
          }
        })();

        return fetchConversationsPromise;
      },
      fetchCommunityConversation: async () => {
        if (fetchCommunityConversationPromise) {
          return fetchCommunityConversationPromise;
        }

        fetchCommunityConversationPromise = (async () => {
          try {
            set({ convoLoading: true });
            const conversation = await chatService.fetchCommunityConversation();
            const { user } = useAuthStore.getState();

            set((state) => {
              const exists = state.conversations.some((c) => c._id === conversation._id);
              const nextConversations = exists
                ? state.conversations.map((c) =>
                    c._id === conversation._id ? conversation : c
                  )
                : [conversation, ...state.conversations];

              return {
                conversations: nextConversations,
                activeConversationId: conversation._id,
                chatUnreadCount: getChatUnreadCount(nextConversations, user?._id),
                convoLoading: false,
              };
            });

            if (!get().messages[conversation._id]?.hydrated) {
              await get().fetchMessages(conversation._id);
            }

            useSocketStore
              .getState()
              .socket?.emit("join-conversation", conversation._id);
          } catch (error) {
            console.error("Lỗi khi fetchCommunityConversation:", error);
            set({ convoLoading: false });
          } finally {
            fetchCommunityConversationPromise = null;
          }
        })();

        return fetchCommunityConversationPromise;
      },
      fetchMessages: async (conversationId) => {
        const { activeConversationId, messages } = get();
        const { user } = useAuthStore.getState();

        const convoId = conversationId ?? activeConversationId;

        if (!convoId) return;

        const current = messages?.[convoId];
        const nextCursor =
          current?.nextCursor === undefined ? "" : current?.nextCursor;

        if (nextCursor === null) return;

        const requestKey = `${convoId}:${nextCursor ?? ""}`;

        if (messageRequestLocks.has(requestKey)) {
          return messageRequestLocks.get(requestKey);
        }

        const request = (async () => {
          set({ messageLoading: true });

          try {
            const { messages: fetched, cursor } = await chatService.fetchMessages(
              convoId,
              nextCursor
            );

            const processed = fetched.map((message) =>
              normalizeIncomingMessage(message, user?._id)
            );

            set((state) => {
              const prev = state.messages[convoId]?.items ?? [];
              const merged = mergeUniqueMessages(processed, prev);

              return {
                messages: {
                  ...state.messages,
                  [convoId]: {
                    items: merged,
                    hasMore: !!cursor,
                    nextCursor: cursor ?? null,
                    hydrated: true,
                  },
                },
              };
            });
          } catch (error) {
            console.error("Lỗi xảy ra khi fetchMessages:", error);
          } finally {
            set({ messageLoading: false });
            messageRequestLocks.delete(requestKey);
          }
        })();

        messageRequestLocks.set(requestKey, request);

        return request;
      },
      sendDirectMessage: async (recipientId, content, imgUrl) => {
        try {
          const { activeConversationId } = get();
          await chatService.sendDirectMessage(
            recipientId,
            content,
            imgUrl,
            activeConversationId || undefined
          );
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c._id === activeConversationId ? { ...c, seenBy: [] } : c
            ),
          }));
        } catch (error) {
          console.error("Lỗi xảy ra khi gửi direct message", error);
        }
      },
      sendGroupMessage: async (conversationId, content, imgUrl) => {
        try {
          await chatService.sendGroupMessage(conversationId, content, imgUrl);
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c._id === get().activeConversationId ? { ...c, seenBy: [] } : c
            ),
          }));
        } catch (error) {
          console.error("Lỗi xảy ra gửi group message", error);
        }
      },
      sendCommunityMessage: async (content) => {
        try {
          await chatService.sendCommunityMessage(content);
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c._id === get().activeConversationId ? { ...c, seenBy: [] } : c
            ),
          }));
        } catch (error) {
          console.error("Lỗi xảy ra gửi community message", error);
        }
      },
      addMessage: async (message) => {
        try {
          const { user } = useAuthStore.getState();
          const normalizedMessage = normalizeIncomingMessage(message, user?._id);
          const convoId = normalizedMessage.conversationId;

          if (!convoId) {
            return;
          }

          set((state) => {
            const currentBucket = state.messages[convoId];
            const prevItems = currentBucket?.items ?? [];

            if (prevItems.some((m) => m._id === normalizedMessage._id)) {
              return state;
            }

            return {
              messages: {
                ...state.messages,
                [convoId]: {
                  items: mergeUniqueMessages(prevItems, [normalizedMessage]),
                  hasMore: currentBucket?.hasMore ?? true,
                  nextCursor: currentBucket ? (currentBucket.nextCursor ?? null) : "",
                  hydrated: currentBucket?.hydrated ?? false,
                },
              },
            };
          });
        } catch (error) {
          console.error("Lỗi xảy khi ra add message:", error);
        }
      },
      updateConversation: (conversation: Partial<Conversation> & Pick<Conversation, "_id">) => {
        set((state) => {
          const { user } = useAuthStore.getState();
          const normalizedConversationId = getNormalizedId(conversation._id);

          if (!normalizedConversationId) {
            return state;
          }

          const normalizedConversation = {
            ...conversation,
            _id: normalizedConversationId,
          };

          const existingIndex = state.conversations.findIndex(
            (c) => getNormalizedId(c._id) === normalizedConversationId
          );

          if (existingIndex >= 0) {
            const updatedConversations = state.conversations.map((c) =>
              getNormalizedId(c._id) === normalizedConversationId
                ? { ...c, ...normalizedConversation }
                : c
            );
            const sortedConversations = sortConversationsByLatest(updatedConversations);

            return {
              conversations: sortedConversations,
              chatUnreadCount: getChatUnreadCount(sortedConversations, user?._id),
            };
          }

          if (!isCompleteConversation(normalizedConversation)) {
            return state;
          }

          const sortedConversations = sortConversationsByLatest([
            normalizedConversation,
            ...state.conversations,
          ]);

          return {
            conversations: sortedConversations,
            chatUnreadCount: getChatUnreadCount(sortedConversations, user?._id),
          };
        });
      },
      markAsSeen: async () => {
        let currentConversationId: string | null = null;
        try {
          const { user } = useAuthStore.getState();
          const { activeConversationId, conversations } = get();

          if (!activeConversationId || !user) {
            return;
          }

          const convo = conversations.find((c) => c._id === activeConversationId);

          if (!convo) {
            return;
          }

          if ((convo.unreadCounts?.[user._id] ?? 0) === 0) {
            return;
          }

          if (seenRequestLocks.has(activeConversationId)) {
            return;
          }

          currentConversationId = activeConversationId;
          seenRequestLocks.add(activeConversationId);
          const result = await chatService.markAsSeen(
            activeConversationId,
            convo.lastMessage?._id ?? null
          );
          const nextUnreadCount =
            typeof result?.myUnreadCount === "number" ? result.myUnreadCount : 0;

          set((state) => {
            const nextConversations = state.conversations.map((c) =>
              c._id === activeConversationId && c.lastMessage
                ? {
                    ...c,
                    unreadCounts: {
                      ...c.unreadCounts,
                      [user._id]: nextUnreadCount,
                    },
                  }
                : c
            );

            return {
              conversations: nextConversations,
              chatUnreadCount: getChatUnreadCount(nextConversations, user._id),
            };
          });
        } catch (error) {
          console.error("Lỗi xảy ra khi gọi markAsSeen trong store", error);
        } finally {
          if (currentConversationId) {
            seenRequestLocks.delete(currentConversationId);
          }
        }
      },
      addConvo: (convo) => {
        set((state) => {
          const { user } = useAuthStore.getState();
          const exists = state.conversations.some(
            (c) => c._id.toString() === convo._id.toString()
          );
          const nextConversations = exists
            ? sortConversationsByLatest(
                state.conversations.map((c) =>
                  c._id.toString() === convo._id.toString() ? { ...c, ...convo } : c
                )
              )
            : sortConversationsByLatest([convo, ...state.conversations]);

          return {
            conversations: nextConversations,
            activeConversationId: state.activeConversationId,
            chatUnreadCount: getChatUnreadCount(nextConversations, user?._id),
          };
        });
      },
      createConversation: async (type, name, memberIds) => {
        try {
          set({ loading: true });
          const conversation = await chatService.createConversation(
            type,
            name,
            memberIds
          );

          get().addConvo(conversation);
          get().setActiveConversation(conversation._id);

          useSocketStore
            .getState()
            .socket?.emit("join-conversation", conversation._id);
        } catch (error) {
          console.error("Lỗi xảy ra khi gọi createConversation trong store", error);
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: "chat-storage",
      partialize: (state) => ({ conversations: state.conversations }),
    }
  )
);

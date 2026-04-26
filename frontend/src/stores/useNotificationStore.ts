import { buildNotifications, type NotificationItem } from "@/components/chat/notification-data";
import type { Conversation } from "@/types/chat";
import type { User } from "@/types/user";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type NotificationState = {
  items: NotificationItem[];
  liveItems: NotificationItem[];
  seenIds: string[];
  syncNotifications: (user?: User | null, conversations?: Conversation[]) => void;
  addLiveNotification: (
    item: NotificationItem,
    user?: User | null,
    conversations?: Conversation[]
  ) => void;
  markAsRead: (ids: string[]) => void;
  markAllAsRead: () => void;
  unreadCount: number;
  isRead: (id: string, unreadByDefault: boolean) => boolean;
  reset: () => void;
};

const buildMergedItems = (
  user: User | null | undefined,
  conversations: Conversation[],
  liveItems: NotificationItem[]
) => {
  const mergedItems = [...liveItems, ...buildNotifications(user, conversations)];
  const uniqueItems = new Map<string, NotificationItem>();

  mergedItems.forEach((item) => {
    if (!uniqueItems.has(item.id)) {
      uniqueItems.set(item.id, item);
    }
  });

  return Array.from(uniqueItems.values());
};

const getUnreadCount = (items: NotificationItem[], seenIds: string[]) =>
  items.filter((item) => item.unread && !seenIds.includes(item.id)).length;

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      items: [],
      liveItems: [],
      seenIds: [],
      unreadCount: 0,
      syncNotifications: (user, conversations = []) => {
        const items = buildMergedItems(user, conversations, get().liveItems);
        const seenIds = get().seenIds;
        const unreadCount = getUnreadCount(items, seenIds);

        set({ items, unreadCount });
      },
      addLiveNotification: (item, user, conversations = []) => {
        const liveItems = [
          item,
          ...get().liveItems.filter((existingItem) => existingItem.id !== item.id),
        ].slice(0, 20);
        const items = buildMergedItems(user, conversations, liveItems);
        const seenIds = get().seenIds;

        set({
          liveItems,
          items,
          unreadCount: getUnreadCount(items, seenIds),
        });
      },
      markAsRead: (ids) => {
        if (!ids.length) {
          return;
        }

        const nextSeenIds = Array.from(new Set([...get().seenIds, ...ids]));
        const unreadCount = getUnreadCount(get().items, nextSeenIds);

        set({
          seenIds: nextSeenIds,
          unreadCount,
        });
      },
      markAllAsRead: () => {
        const unreadIds = get()
          .items.filter((item) => item.unread)
          .map((item) => item.id);

        get().markAsRead(unreadIds);
      },
      isRead: (id, unreadByDefault) => !unreadByDefault || get().seenIds.includes(id),
      reset: () => {
        set({
          items: [],
          liveItems: [],
          seenIds: [],
          unreadCount: 0,
        });
      },
    }),
    {
      name: "notification-storage",
      partialize: (state) => ({ seenIds: state.seenIds }),
    }
  )
);

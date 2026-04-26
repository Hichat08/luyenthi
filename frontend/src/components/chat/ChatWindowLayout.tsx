import { useChatStore } from "@/stores/useChatStore";
import { SidebarInset } from "../ui/sidebar";
import ChatWindowHeader from "./ChatWindowHeader";
import ChatWindowBody from "./ChatWindowBody";
import MessageInput from "./MessageInput";
import { useEffect, useState } from "react";
import ChatWindowSkeleton from "../skeleton/ChatWindowSkeleton";

const ChatWindowLayout = () => {
  const {
    activeConversationId,
    conversations,
    messages,
    convoLoading,
    fetchCommunityConversation,
    fetchMessages,
    messageLoading: loading,
    markAsSeen,
    setActiveConversation,
    setChatWindowOpen,
  } = useChatStore();
  const [bootstrapping, setBootstrapping] = useState(true);

  const selectedConvo =
    conversations.find((c) => c._id === activeConversationId) ??
    conversations.find((c) => c.type === "community") ??
    null;

  useEffect(() => {
    if (!bootstrapping) {
      return;
    }

    const loadCommunityConversation = async () => {
      try {
        const cachedCommunityConversation = conversations.find(
          (conversation) => conversation.type === "community"
        );

        if (cachedCommunityConversation) {
          setActiveConversation(cachedCommunityConversation._id);

          if (!messages[cachedCommunityConversation._id]?.hydrated) {
            await fetchMessages(cachedCommunityConversation._id);
          }

          return;
        }

        await fetchCommunityConversation();
      } catch (error) {
        console.error("Lỗi khi load community conversation", error);
      } finally {
        setBootstrapping(false);
      }
    };

    loadCommunityConversation();
  }, [
    bootstrapping,
    conversations,
    fetchCommunityConversation,
    fetchMessages,
    messages,
    setActiveConversation,
  ]);

  useEffect(() => {
    if (!selectedConvo) {
      return;
    }

    const markSeen = async () => {
      try {
        await markAsSeen();
      } catch (error) {
        console.error("Lỗi khi markSeen", error);
      }
    };

    markSeen();
  }, [markAsSeen, selectedConvo]);

  useEffect(() => {
    setChatWindowOpen(true);

    return () => {
      setChatWindowOpen(false);
      setActiveConversation(null);
    };
  }, [setActiveConversation, setChatWindowOpen]);

  if (bootstrapping || (!selectedConvo && convoLoading)) {
    return <ChatWindowSkeleton />;
  }

  if (!selectedConvo) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background text-muted-foreground">
        Không thể tải phòng chat.
      </div>
    );
  }

  if (loading) {
    return <ChatWindowSkeleton />;
  }

  return (
    <SidebarInset className="flex h-full flex-1 flex-col overflow-hidden">
      {/* Header */}
      <ChatWindowHeader chat={selectedConvo} />

      {/* Body */}
      <div className="flex-1 overflow-y-auto bg-primary-foreground">
        <ChatWindowBody />
      </div>

      {/* Footer */}
      <MessageInput selectedConvo={selectedConvo} />
    </SidebarInset>
  );
};

export default ChatWindowLayout;

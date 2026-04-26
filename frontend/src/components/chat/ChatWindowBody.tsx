import { useChatStore } from "@/stores/useChatStore";
import ChatWelcomeScreen from "./ChatWelcomeScreen";
import MessageItem from "./MessageItem";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";

const ChatWindowBody = () => {
  const {
    activeConversationId,
    conversations,
    messages: allMessages,
    fetchMessages,
  } = useChatStore();
  const [lastMessageStatus, setLastMessageStatus] = useState<"delivered" | "seen">(
    "delivered"
  );

  const messages = allMessages[activeConversationId!]?.items ?? [];
  const reversedMessages = [...messages].reverse();
  const hasMore = allMessages[activeConversationId!]?.hasMore ?? false;
  const selectedConvo = conversations.find((c) => c._id === activeConversationId);
  const firstMessageId = messages[0]?._id ?? null;
  const lastMessageId = messages[messages.length - 1]?._id ?? null;

  // ref
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previousConversationIdRef = useRef<string | null>(null);
  const previousFirstMessageIdRef = useRef<string | null>(null);
  const previousLastMessageIdRef = useRef<string | null>(null);
  const preserveScrollRef = useRef<{
    scrollHeight: number;
    scrollTop: number;
  } | null>(null);

  // seen status
  useEffect(() => {
    const lastMessage = selectedConvo?.lastMessage;
    if (!lastMessage) {
      return;
    }

    const seenBy = selectedConvo?.seenBy ?? [];

    setLastMessageStatus(seenBy.length > 0 ? "seen" : "delivered");
  }, [selectedConvo]);

  const fetchMoreMessages = async () => {
    if (!activeConversationId) {
      return;
    }

    try {
      const container = containerRef.current;

      if (container) {
        preserveScrollRef.current = {
          scrollHeight: container.scrollHeight,
          scrollTop: container.scrollTop,
        };
      }

      await fetchMessages(activeConversationId);
    } catch (error) {
      console.error("Lỗi xảy ra khi fetch thêm tin", error);
    }
  };

  useLayoutEffect(() => {
    const container = containerRef.current;
    const previousConversationId = previousConversationIdRef.current;
    const previousFirstMessageId = previousFirstMessageIdRef.current;
    const previousLastMessageId = previousLastMessageIdRef.current;
    const hasConversationChanged = previousConversationId !== activeConversationId;
    const hasLoadedOlderMessages =
      preserveScrollRef.current &&
      previousFirstMessageId !== null &&
      firstMessageId !== previousFirstMessageId &&
      lastMessageId === previousLastMessageId;

    if (container && hasLoadedOlderMessages) {
      const snapshot = preserveScrollRef.current;
      if (snapshot) {
        const heightDiff = container.scrollHeight - snapshot.scrollHeight;
        container.scrollTop = snapshot.scrollTop + heightDiff;
        preserveScrollRef.current = null;
      }
    } else if (
      hasConversationChanged ||
      (lastMessageId !== null && lastMessageId !== previousLastMessageId)
    ) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: hasConversationChanged ? "auto" : "smooth",
          block: "end",
        });
      });
    }

    previousConversationIdRef.current = activeConversationId;
    previousFirstMessageIdRef.current = firstMessageId;
    previousLastMessageIdRef.current = lastMessageId;
  }, [activeConversationId, firstMessageId, lastMessageId]);

  if (!selectedConvo) {
    return <ChatWelcomeScreen />;
  }

  if (!messages?.length) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground ">
        Chưa có tin nhắn nào trong cuộc trò chuyện này.
      </div>
    );
  }

  return (
    <div className="p-4 bg-primary-foreground h-full flex flex-col overflow-hidden">
      <div
        id="scrollableDiv"
        ref={containerRef}
        className="flex flex-col-reverse overflow-y-auto overflow-x-hidden beautiful-scrollbar"
      >
        <div ref={messagesEndRef}></div>
        <InfiniteScroll
          dataLength={messages.length}
          next={fetchMoreMessages}
          hasMore={hasMore}
          scrollableTarget="scrollableDiv"
          loader={<p>Đang tải...</p>}
          inverse={true}
          style={{
            display: "flex",
            flexDirection: "column-reverse",
            overflow: "visible",
          }}
        >
          {reversedMessages.map((message, index) => (
            <MessageItem
              key={message._id ?? index}
              message={message}
              index={index}
              messages={reversedMessages}
              selectedConvo={selectedConvo}
              lastMessageStatus={lastMessageStatus}
            />
          ))}
        </InfiniteScroll>
      </div>
    </div>
  );
};

export default ChatWindowBody;

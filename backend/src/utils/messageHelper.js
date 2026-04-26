const serializeUnreadCounts = (value) =>
  value instanceof Map ? Object.fromEntries(value) : value || {};

const toIdString = (value) => (value ? value.toString() : "");

const buildConversationSocketPayload = (conversation) => ({
  _id: toIdString(conversation._id),
  lastMessage: conversation.lastMessage
    ? {
        ...conversation.lastMessage.toObject?.(),
        _id: toIdString(conversation.lastMessage._id),
        senderId: toIdString(conversation.lastMessage.senderId),
      }
    : null,
  lastMessageAt: conversation.lastMessageAt,
});

export const updateConversationAfterCreateMessage = (
  conversation,
  message,
  senderId
) => {
  conversation.set({
    seenBy: [],
    lastMessageAt: message.createdAt,
    lastMessage: {
      _id: message._id,
      content: message.content,
      senderId,
      createdAt: message.createdAt,
    },
  });

  conversation.participants.forEach((p) => {
    const memberId = p.userId.toString();
    const isSender = memberId === senderId.toString();
    const prevCount = conversation.unreadCounts.get(memberId) || 0;
    conversation.unreadCounts.set(memberId, isSender ? 0 : prevCount + 1);
  });
};

export const emitNewMessage = (io, conversation, message) => {
  const conversationPayload = buildConversationSocketPayload(conversation);
  const unreadCounts = serializeUnreadCounts(conversation.unreadCounts);

  io.to(conversation._id.toString()).emit("new-message", {
    message,
    conversation: conversationPayload,
    unreadCounts,
  });

  conversation.participants.forEach((participant) => {
    const memberId = toIdString(participant.userId);

    if (!memberId) {
      return;
    }

    io.to(memberId).emit("conversation-updated", {
      conversation: conversationPayload,
      unreadCounts,
    });
  });
};

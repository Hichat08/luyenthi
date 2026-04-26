import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { io } from "../socket/index.js";

const COMMUNITY_ROOM_NAME = "Community Live";

const serializeUnreadCounts = (value) =>
  value instanceof Map ? Object.fromEntries(value) : value || {};

const toIdString = (value) => (value ? value.toString() : "");

export const formatConversation = async (conversation) => {
  await conversation.populate([
    { path: "participants.userId", select: "displayName avatarUrl classroom" },
    {
      path: "seenBy",
      select: "displayName avatarUrl",
    },
    { path: "lastMessage.senderId", select: "displayName avatarUrl classroom" },
  ]);

  const participants = (conversation.participants || []).map((p) => ({
    _id: p.userId?._id,
    displayName: p.userId?.displayName,
    avatarUrl: p.userId?.avatarUrl ?? null,
    classroom: p.userId?.classroom ?? null,
    joinedAt: p.joinedAt,
  }));

  return {
    ...conversation.toObject(),
    unreadCounts: serializeUnreadCounts(conversation.unreadCounts),
    participants,
  };
};

export const ensureCommunityConversation = async (userId) => {
  let conversation = await Conversation.findOneAndUpdate(
    { isCommunity: true },
    {
      $setOnInsert: {
        type: "community",
        isCommunity: true,
        participants: [],
        group: {
          name: COMMUNITY_ROOM_NAME,
          createdBy: userId ?? null,
        },
        lastMessageAt: new Date(),
        unreadCounts: new Map(),
      },
    },
    {
      new: true,
      upsert: true,
    }
  );

  if (userId) {
    const joinResult = await Conversation.updateOne(
      {
        _id: conversation._id,
        "participants.userId": { $ne: userId },
      },
      {
        $push: {
          participants: { userId, joinedAt: new Date() },
        },
      }
    );

    if (joinResult.modifiedCount > 0) {
      conversation = await Conversation.findById(conversation._id);
    }
  }

  return conversation;
};

export const createConversation = async (req, res) => {
  try {
    const { type, name, memberIds } = req.body;
    const userId = req.user._id;

    if (
      !type ||
      (type === "group" && !name) ||
      !memberIds ||
      !Array.isArray(memberIds) ||
      memberIds.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "Tên nhóm và danh sách thành viên là bắt buộc" });
    }

    let conversation;

    if (type === "direct") {
      const participantId = memberIds[0];

      conversation = await Conversation.findOne({
        type: "direct",
        "participants.userId": { $all: [userId, participantId] },
      });

      if (!conversation) {
        conversation = new Conversation({
          type: "direct",
          participants: [{ userId }, { userId: participantId }],
          lastMessageAt: new Date(),
        });

        await conversation.save();
      }
    }

    if (type === "group") {
      conversation = new Conversation({
        type: "group",
        participants: [{ userId }, ...memberIds.map((id) => ({ userId: id }))],
        group: {
          name,
          createdBy: userId,
        },
        lastMessageAt: new Date(),
      });

      await conversation.save();
    }

    if (!conversation) {
      return res.status(400).json({ message: "Conversation type không hợp lệ" });
    }

    await conversation.populate([
      { path: "participants.userId", select: "displayName avatarUrl classroom" },
      {
        path: "seenBy",
        select: "displayName avatarUrl",
      },
      { path: "lastMessage.senderId", select: "displayName avatarUrl classroom" },
    ]);

    const participants = (conversation.participants || []).map((p) => ({
      _id: p.userId?._id,
      displayName: p.userId?.displayName,
      avatarUrl: p.userId?.avatarUrl ?? null,
      classroom: p.userId?.classroom ?? null,
      joinedAt: p.joinedAt,
    }));

    const formatted = { ...conversation.toObject(), participants };

    if (type === "group") {
      memberIds.forEach((userId) => {
        io.to(userId).emit("new-group", formatted);
      });
    }

    if (type === "direct") {
      io.to(userId).emit("new-group", formatted);
      io.to(memberIds[0]).emit("new-group", formatted);
    }

    return res.status(201).json({ conversation: formatted });
  } catch (error) {
    console.error("Lỗi khi tạo conversation", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    await ensureCommunityConversation(userId);
    const conversations = await Conversation.find({
      $or: [{ "participants.userId": userId }, { isCommunity: true }],
    })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .populate({
        path: "participants.userId",
        select: "displayName avatarUrl classroom",
      })
      .populate({
        path: "lastMessage.senderId",
        select: "displayName avatarUrl classroom",
      })
      .populate({
        path: "seenBy",
        select: "displayName avatarUrl",
      })
      .lean();

    const formatted = conversations.map((convo) => {
      const participants = (convo.participants || []).map((p) => ({
        _id: p.userId?._id,
        displayName: p.userId?.displayName,
        avatarUrl: p.userId?.avatarUrl ?? null,
        classroom: p.userId?.classroom ?? null,
        joinedAt: p.joinedAt,
      }));

      return {
        ...convo,
        unreadCounts: serializeUnreadCounts(convo.unreadCounts),
        participants,
      };
    });

    return res.status(200).json({ conversations: formatted });
  } catch (error) {
    console.error("Lỗi xảy ra khi lấy conversations", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getCommunityConversation = async (req, res) => {
  try {
    const conversation = await ensureCommunityConversation(req.user._id);
    const formatted = await formatConversation(conversation);

    return res.status(200).json({ conversation: formatted });
  } catch (error) {
    console.error("Lỗi khi getCommunityConversation", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, cursor } = req.query;

    const query = { conversationId };

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    let messages = await Message.find(query)
      .populate("senderId", "displayName avatarUrl classroom")
      .sort({ createdAt: -1 })
      .limit(Number(limit) + 1)
      .lean();

    let nextCursor = null;

    if (messages.length > Number(limit)) {
      const nextMessage = messages[messages.length - 1];
      nextCursor = nextMessage.createdAt.toISOString();
      messages.pop();
    }

    messages = messages.reverse();

    const formattedMessages = messages.map((message) => ({
      ...message,
      sender: message.senderId
        ? {
            _id: message.senderId._id,
            displayName: message.senderId.displayName,
            avatarUrl: message.senderId.avatarUrl ?? null,
            classroom: message.senderId.classroom ?? null,
          }
        : null,
      senderId: message.senderId?._id ?? message.senderId,
    }));

    return res.status(200).json({
      messages: formattedMessages,
      nextCursor,
    });
  } catch (error) {
    console.error("Lỗi xảy ra khi lấy messages", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getUserConversationsForSocketIO = async (userId) => {
  try {
    await ensureCommunityConversation(userId);
    const conversations = await Conversation.find(
      { $or: [{ "participants.userId": userId }, { isCommunity: true }] },
      { _id: 1 }
    ).lean();

    return conversations.map((c) => c._id.toString());
  } catch (error) {
    console.error("Lỗi khi fetch conversations: ", error);
    return [];
  }
};

export const markAsSeen = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { lastMessageId } = req.body ?? {};
    const userId = req.user._id.toString();

    const conversation = await Conversation.findById(conversationId).lean();

    if (!conversation) {
      return res.status(404).json({ message: "Conversation không tồn tại" });
    }

    const last = conversation.lastMessage;

    if (!last) {
      return res.status(200).json({ message: "Không có tin nhắn để mark as seen" });
    }

    if (last.senderId.toString() === userId) {
      return res.status(200).json({ message: "Sender không cần mark as seen" });
    }

    if (lastMessageId && last._id?.toString() !== lastMessageId.toString()) {
      return res.status(200).json({
        message: "Bỏ qua mark as seen cũ vì đã có tin nhắn mới hơn",
        myUnreadCount:
          serializeUnreadCounts(conversation.unreadCounts)?.[userId] || 0,
      });
    }

    const updated = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $addToSet: { seenBy: userId },
        $set: { [`unreadCounts.${userId}`]: 0 },
      },
      {
        new: true,
      },
    );

    io.to(conversationId).emit("read-message", {
      conversation: {
        ...updated?.toObject(),
        _id: toIdString(updated?._id),
        unreadCounts: serializeUnreadCounts(updated?.unreadCounts),
      },
      lastMessage: {
        _id: toIdString(updated?.lastMessage?._id),
        content: updated?.lastMessage.content,
        createdAt: updated?.lastMessage.createdAt,
        sender: {
          _id: toIdString(updated?.lastMessage?.senderId),
        },
      },
    });

    return res.status(200).json({
      message: "Marked as seen",
      seenBy: updated?.sennBy || [],
      myUnreadCount: updated?.unreadCounts[userId] || 0,
    });
  } catch (error) {
    console.error("Lỗi khi mark as seen", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

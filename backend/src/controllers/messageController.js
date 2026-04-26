import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import {
  emitNewMessage,
  updateConversationAfterCreateMessage,
} from "../utils/messageHelper.js";
import { io } from "../socket/index.js";
import {
  ensureCommunityConversation,
  formatConversation,
} from "./conversationController.js";

export const sendDirectMessage = async (req, res) => {
  try {
    const { recipientId, content, conversationId } = req.body;
    const senderId = req.user._id;

    let conversation;
    let conversationCreated = false;

    if (!content) {
      return res.status(400).json({ message: "Thiếu nội dung" });
    }

    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    }

    if (!conversation) {
      conversation = await Conversation.create({
        type: "direct",
        participants: [
          { userId: senderId, joinedAt: new Date() },
          { userId: recipientId, joinedAt: new Date() },
        ],
        lastMessageAt: new Date(),
        unreadCounts: new Map(),
      });
      conversationCreated = true;
    }

    const message = await Message.create({
      conversationId: conversation._id,
      senderId,
      content,
    });

    updateConversationAfterCreateMessage(conversation, message, senderId);

    await conversation.save();

    if (conversationCreated) {
      const formattedConversation = await formatConversation(conversation);
      io.to(senderId.toString()).emit("new-group", formattedConversation);
      io.to(recipientId.toString()).emit("new-group", formattedConversation);
    }

    emitNewMessage(io, conversation, message);

    return res.status(201).json({ message });
  } catch (error) {
    console.error("Lỗi xảy ra khi gửi tin nhắn trực tiếp", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    const senderId = req.user._id;
    const conversation = req.conversation;

    if (!content) {
      return res.status(400).json("Thiếu nội dung");
    }

    const message = await Message.create({
      conversationId,
      senderId,
      content,
    });

    updateConversationAfterCreateMessage(conversation, message, senderId);

    await conversation.save();
    emitNewMessage(io, conversation, message);

    return res.status(201).json({ message });
  } catch (error) {
    console.error("Lỗi xảy ra khi gửi tin nhắn nhóm", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const sendCommunityMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const senderId = req.user._id;

    if (!content) {
      return res.status(400).json("Thiếu nội dung");
    }

    const conversation = await ensureCommunityConversation(senderId);

    const message = await Message.create({
      conversationId: conversation._id,
      senderId,
      content,
    });

    const populatedMessage = await Message.findById(message._id).populate(
      "senderId",
      "displayName avatarUrl classroom"
    );

    updateConversationAfterCreateMessage(conversation, message, senderId);
    await conversation.save();
    emitNewMessage(io, conversation, populatedMessage ?? message);

    return res.status(201).json({
      message: populatedMessage ?? message,
      conversationId: conversation._id,
    });
  } catch (error) {
    console.error("Lỗi xảy ra khi gửi community message", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

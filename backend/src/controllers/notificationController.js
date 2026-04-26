import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { emitAdminNotification } from "../socket/index.js";

const buildNotificationPayload = (notification) => ({
  id: notification._id,
  title: notification.title,
  body: notification.body,
  category: notification.category,
  audience: notification.audience,
  createdAt: notification.createdAt,
});

export const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({
      $or: [{ audience: "all" }, { recipients: userId }],
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .select("title body category audience createdAt");

    return res.status(200).json({
      notifications: notifications.map(buildNotificationPayload),
    });
  } catch (error) {
    console.error("Lỗi khi tải notification của user", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

const normalizeQuery = (value) => `${value ?? ""}`.trim();

export const searchUsersForNotification = async (req, res) => {
  try {
    const query = normalizeQuery(req.query?.q);

    if (!query) {
      return res.status(200).json({ users: [] });
    }

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchConditions = [
      { displayName: { $regex: escapedQuery, $options: "i" } },
      { username: { $regex: escapedQuery, $options: "i" } },
      { userCode: { $regex: escapedQuery, $options: "i" } },
    ];

    if (mongoose.Types.ObjectId.isValid(query)) {
      searchConditions.push({ _id: query });
    }

    const users = await User.find({
      role: "user",
      $or: searchConditions,
    })
      .sort({ createdAt: -1 })
      .limit(12)
      .select("_id displayName username userCode classroom avatarUrl");

    return res.status(200).json({ users });
  } catch (error) {
    console.error("Lỗi khi search user cho notification", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const createNotification = async (req, res) => {
  try {
    const title = `${req.body?.title ?? ""}`.trim();
    const body = `${req.body?.body ?? ""}`.trim();
    const category = req.body?.category === "study" ? "study" : "system";
    const audience = req.body?.audience === "selected" ? "selected" : "all";
    const recipientIds = Array.isArray(req.body?.recipientIds)
      ? req.body.recipientIds
      : [];

    if (!title || !body) {
      return res.status(400).json({ message: "Tiêu đề và nội dung không được để trống." });
    }

    let recipients = [];
    let recipientIdsForEmit = [];

    if (audience === "selected") {
      const uniqueRecipientIds = Array.from(
        new Set(
          recipientIds
            .map((value) => `${value ?? ""}`.trim())
            .filter((value) => mongoose.Types.ObjectId.isValid(value))
        )
      );

      if (uniqueRecipientIds.length === 0) {
        return res.status(400).json({ message: "Cần chọn ít nhất một người dùng." });
      }

      const matchedUsers = await User.find({
        _id: { $in: uniqueRecipientIds },
        role: "user",
      }).select("_id");

      recipients = matchedUsers.map((user) => user._id);
      recipientIdsForEmit = recipients.map((id) => id.toString());

      if (recipients.length === 0) {
        return res.status(400).json({ message: "Không tìm thấy người nhận hợp lệ." });
      }
    } else {
      const users = await User.find({ role: "user" }).select("_id");
      recipientIdsForEmit = users.map((user) => user._id.toString());
    }

    const notification = await Notification.create({
      title,
      body,
      category,
      audience,
      recipients,
      createdBy: req.user._id,
    });

    const payload = buildNotificationPayload(notification);
    emitAdminNotification({
      audience,
      recipientIds: recipientIdsForEmit,
      payload,
    });

    return res.status(201).json({
      notification: payload,
      message: "Đã gửi thông báo thành công.",
    });
  } catch (error) {
    console.error("Lỗi khi tạo notification từ admin", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const listAdminNotifications = async (_req, res) => {
  try {
    const notifications = await Notification.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("createdBy", "displayName username")
      .populate("recipients", "displayName username userCode");

    return res.status(200).json({
      notifications: notifications.map((notification) => ({
        id: notification._id,
        title: notification.title,
        body: notification.body,
        category: notification.category,
        audience: notification.audience,
        createdAt: notification.createdAt,
        createdBy: notification.createdBy
          ? {
              _id: notification.createdBy._id,
              displayName: notification.createdBy.displayName,
              username: notification.createdBy.username,
            }
          : null,
        recipients:
          notification.audience === "selected"
            ? (notification.recipients ?? []).map((recipient) => ({
                _id: recipient._id,
                displayName: recipient.displayName,
                username: recipient.username,
                userCode: recipient.userCode,
              }))
            : [],
      })),
    });
  } catch (error) {
    console.error("Lỗi khi tải lịch sử notification admin", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

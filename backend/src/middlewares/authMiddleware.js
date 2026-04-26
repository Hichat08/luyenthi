// @ts-nocheck
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ensureUserCode } from "../utils/userCode.js";

const isMongoConnectivityError = (error) =>
  error?.name === "MongoServerSelectionError" ||
  error?.name === "MongoNetworkTimeoutError" ||
  error?.name === "MongooseServerSelectionError";

// authorization - xác minh user là ai
export const protectedRoute = async (req, res, next) => {
  try {
    // lấy token từ header
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

    if (!token) {
      return res.status(401).json({ message: "Không tìm thấy access token" });
    }

    // xác nhận token hợp lệ
    const decodedUser = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // tìm user
    const user = await User.findById(decodedUser.userId).select("-hashedPassword");

    if (!user) {
      return res.status(404).json({ message: "người dùng không tồn tại." });
    }

    if (!user.role) {
      user.role = "user";
      await user.save();
    }

    await ensureUserCode(user);

    const shouldTouchActivity =
      !user.lastActiveAt || Date.now() - new Date(user.lastActiveAt).getTime() > 5 * 60 * 1000;

    if (shouldTouchActivity) {
      user.lastActiveAt = new Date();
      await user.save();
    }

    // trả user về trong req
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError || error instanceof jwt.JsonWebTokenError) {
      return res
        .status(403)
        .json({ message: "Access token hết hạn hoặc không đúng" });
    }

    if (isMongoConnectivityError(error)) {
      console.error("Lỗi kết nối CSDL trong authMiddleware:", error.message);
      return res.status(503).json({ message: "CSDL đang tạm thời không khả dụng" });
    }

    console.error("Lỗi khi xác minh JWT trong authMiddleware", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const authorizeRoles =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Bạn chưa đăng nhập." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Bạn không có quyền truy cập." });
    }

    next();
  };

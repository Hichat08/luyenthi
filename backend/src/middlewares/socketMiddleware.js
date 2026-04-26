import jwt from "jsonwebtoken";
import User from "../models/User.js";

const isMongoConnectivityError = (error) =>
  error?.name === "MongoServerSelectionError" ||
  error?.name === "MongoNetworkTimeoutError" ||
  error?.name === "MongooseServerSelectionError";

export const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Unauthorized - Token không tồn tại"));
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (!decoded) {
      return next(new Error("Unauthorized - Token không hợp lệ hoặc đã hết hạn"));
    }

    const user = await User.findById(decoded.userId).select("-hashedPassword");

    if (!user) {
      return next(new Error("User không tồn tại"));
    }

    socket.user = user;

    next();
  } catch (error) {
    const authError = new Error("Unauthorized");

    if (error instanceof jwt.TokenExpiredError) {
      authError.data = {
        code: "TOKEN_EXPIRED",
        message: "Access token da het han",
        expiredAt: error.expiredAt,
      };

      return next(authError);
    }

    if (error instanceof jwt.JsonWebTokenError) {
      authError.data = {
        code: "INVALID_TOKEN",
        message: "Access token khong hop le",
      };

      return next(authError);
    }

    if (isMongoConnectivityError(error)) {
      console.error("Lỗi kết nối CSDL trong socketMiddleware:", error.message);
      authError.data = {
        code: "DB_UNAVAILABLE",
        message: "CSDL tam thoi khong kha dung",
      };

      return next(authError);
    }

    console.error("Loi khi verify JWT trong socketMiddleware", error);
    authError.data = {
      code: "SOCKET_AUTH_ERROR",
      message: "Khong the xac thuc ket noi socket",
    };

    next(authError);
  }
};

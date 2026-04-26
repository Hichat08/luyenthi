import { Server } from "socket.io";
import http from "http";
import express from "express";
import { socketAuthMiddleware } from "../middlewares/socketMiddleware.js";
import { getUserConversationsForSocketIO } from "../controllers/conversationController.js";

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

io.use(socketAuthMiddleware);

const onlineUsers = new Map(); // {userId: Set<socketId>}
const emitOnlineUsers = () => {
  io.emit("online-users", Array.from(onlineUsers.keys()));
};

io.on("connection", async (socket) => {
  try {
    const user = socket.user;
    const userId = user._id.toString();

    // console.log(`${user.displayName} online với socket ${socket.id}`);

    const activeSockets = onlineUsers.get(userId) ?? new Set();
    activeSockets.add(socket.id);
    onlineUsers.set(userId, activeSockets);

    emitOnlineUsers();

    const conversationIds = await getUserConversationsForSocketIO(user._id);
    conversationIds.forEach((id) => {
      socket.join(id);
    });

    socket.on("join-conversation", (conversationId) => {
      socket.join(conversationId);
    });

    socket.join(userId);

    socket.on("disconnect", () => {
      const connectedSockets = onlineUsers.get(userId);

      if (!connectedSockets) {
        return;
      }

      connectedSockets.delete(socket.id);

      if (connectedSockets.size === 0) {
        onlineUsers.delete(userId);
      } else {
        onlineUsers.set(userId, connectedSockets);
      }

      emitOnlineUsers();
      /* console.log(`socket disconnected: ${socket.id}`); */
    });
  } catch (error) {
    console.error("Lỗi khi khởi tạo socket connection:", error);
    socket.emit("socket-init-error", {
      code: "SOCKET_INIT_ERROR",
      message: "Khong the khoi tao du lieu socket",
    });
    socket.disconnect(true);
  }
});

const emitAdminNotification = ({ audience, recipientIds = [], payload }) => {
  if (audience === "all") {
    recipientIds.forEach((recipientId) => {
      io.to(`${recipientId}`).emit("admin-notification", payload);
    });
    return;
  }

  recipientIds.forEach((recipientId) => {
    io.to(`${recipientId}`).emit("admin-notification", payload);
  });
};

export { io, app, server, emitAdminNotification };

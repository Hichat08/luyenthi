// @ts-nocheck
import bcrypt from "bcrypt";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Session from "../models/Session.js";
import { createUniqueUserCode } from "../utils/userCode.js";

const ACCESS_TOKEN_TTL = "30m"; // thuờng là dưới 15m
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; // 14 ngày

const resolveRequestedRole = (requestedRole, adminSecret) => {
  if (requestedRole !== "admin") {
    return "user";
  }

  if (
    process.env.ADMIN_REGISTRATION_SECRET &&
    adminSecret === process.env.ADMIN_REGISTRATION_SECRET
  ) {
    return "admin";
  }

  return null;
};

export const signUp = async (req, res) => {
  try {
    const {
      username,
      password,
      email,
      firstName,
      lastName,
      classroom,
      role: requestedRole,
      adminSecret,
    } = req.body;

    if (!username || !password || !email || !firstName || !lastName || !classroom) {
      return res.status(400).json({
        message:
          "Không thể thiếu username, password, email, firstName, lastName và classroom",
      });
    }

    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();
    const role = resolveRequestedRole(requestedRole, adminSecret);

    if (!role) {
      return res.status(403).json({
        message: "Không đủ quyền để tạo tài khoản admin.",
      });
    }

    // kiểm tra username tồn tại chưa
    const duplicate = await User.findOne({ username: normalizedUsername });

    if (duplicate) {
      return res.status(409).json({ message: "username đã tồn tại" });
    }

    // mã hoá password
    const hashedPassword = await bcrypt.hash(password, 10); // salt = 10

    let createdUser = null;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        createdUser = await User.create({
          username: normalizedUsername,
          hashedPassword,
          email: normalizedEmail,
          displayName: `${lastName} ${firstName}`,
          classroom: `${classroom}`.trim(),
          role,
          userCode: await createUniqueUserCode(),
        });
        break;
      } catch (createError) {
        if (createError?.code === 11000 && createError?.keyPattern?.userCode) {
          continue;
        }

        throw createError;
      }
    }

    if (!createdUser) {
      throw new Error("Không thể tạo userCode duy nhất cho tài khoản mới.");
    }

    // return
    return res.sendStatus(204);
  } catch (error) {
    console.error("Lỗi khi gọi signUp", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const signIn = async (req, res) => {
  try {
    // lấy inputs
    const { username, password, remember = true } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Thiếu username hoặc password." });
    }

    const normalizedUsername = username.trim().toLowerCase();

    // lấy hashedPassword trong db để so với password input
    const user = await User.findOne({ username: normalizedUsername });

    if (!user) {
      return res
        .status(401)
        .json({ message: "username hoặc password không chính xác" });
    }

    // kiểm tra password
    const passwordCorrect = await bcrypt.compare(password, user.hashedPassword);

    if (!passwordCorrect) {
      return res
        .status(401)
        .json({ message: "username hoặc password không chính xác" });
    }

    if (!user.role) {
      user.role = "user";
      await user.save();
    }

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          "preferences.rememberLogin": Boolean(remember),
          "preferences.lastLoginUsername": normalizedUsername,
          lastActiveAt: new Date(),
        },
      }
    );

    // nếu khớp, tạo accessToken với JWT
    const accessToken = jwt.sign(
      { userId: user._id, role: user.role },
      // @ts-ignore
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    // tạo refresh token
    const refreshToken = crypto.randomBytes(64).toString("hex");

    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "none", //backend, frontend deploy riêng
    };

    if (remember) {
      cookieOptions.maxAge = REFRESH_TOKEN_TTL;
    }

    // tạo session mới để lưu refresh token
    await Session.create({
      userId: user._id,
      refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
    });

    // trả refresh token về trong cookie
    res.cookie("refreshToken", refreshToken, cookieOptions);

    // trả access token về trong res
    return res
      .status(200)
      .json({
        message: `User ${user.displayName} đã logged in!`,
        accessToken,
        rememberedUsername: remember ? normalizedUsername : "",
      });
  } catch (error) {
    console.error("Lỗi khi gọi signIn", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const signOut = async (req, res) => {
  try {
    // lấy refresh token từ cookie
    const token = req.cookies?.refreshToken;

    if (token) {
      // xoá refresh token trong Session
      await Session.deleteOne({ refreshToken: token });

      // xoá cookie
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });
    }

    return res.sendStatus(204);
  } catch (error) {
    console.error("Lỗi khi gọi signOut", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// tạo access token mới từ refresh token
export const refreshToken = async (req, res) => {
  try {
    // lấy refresh token từ cookie
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ message: "Token không tồn tại." });
    }

    // so với refresh token trong db
    const session = await Session.findOne({ refreshToken: token });

    if (!session) {
      return res.status(403).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }

    // kiểm tra hết hạn chưa
    if (session.expiresAt < new Date()) {
      return res.status(403).json({ message: "Token đã hết hạn." });
    }

    // tạo access token mới
    const accessToken = jwt.sign(
      {
        userId: session.userId,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    // return
    return res.status(200).json({ accessToken });
  } catch (error) {
    console.error("Lỗi khi gọi refreshToken", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

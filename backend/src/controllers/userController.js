import { uploadImageFromBuffer } from "../middlewares/uploadMiddleware.js";
import Subject from "../models/Subject.js";
import User from "../models/User.js";

const defaultSubjectNames = ["Toán", "Văn", "Anh", "Lý", "Hóa", "Sinh", "Sử"];

const normalizeSubjectName = (value) =>
  `${value ?? ""}`
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

export const authMe = async (req, res) => {
  try {
    const user = req.user; // lấy từ authMiddleware

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Lỗi khi gọi authMe", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const searchUserByUsername = async (req, res) => {
  try {
    const { username } = req.query;

    if (!username || username.trim() === "") {
      return res.status(400).json({ message: "Cần cung cấp username trong query." });
    }

    const user = await User.findOne({ username }).select(
      "_id displayName username avatarUrl"
    );

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Lỗi xảy ra khi searchUserByUsername", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    const file = req.file;
    const userId = req.user._id;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await uploadImageFromBuffer(file.buffer);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        avatarUrl: result.secure_url,
        avatarId: result.public_id,
      },
      {
        new: true,
      }
    ).select("avatarUrl");

    if (!updatedUser.avatarUrl) {
      return res.status(400).json({ message: "Avatar trả về null" });
    }

    return res.status(200).json({ avatarUrl: updatedUser.avatarUrl });
  } catch (error) {
    console.error("Lỗi xảy ra khi upload avatar", error);
    return res.status(500).json({ message: "Upload failed" });
  }
};

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

const isValidTimeRange = (start, end) => {
  if (!timePattern.test(start) || !timePattern.test(end)) {
    return false;
  }

  return start < end;
};

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const normalizeProfileDate = (value) => {
  const trimmedValue = `${value ?? ""}`.trim();

  if (!trimmedValue) {
    return null;
  }

  if (!datePattern.test(trimmedValue)) {
    return undefined;
  }

  const parsed = new Date(`${trimmedValue}T00:00:00.000Z`);

  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const normalizeSelectedSubjects = (subjects) => {
  if (!Array.isArray(subjects)) {
    return [];
  }

  const uniqueSubjects = new Map();

  subjects.forEach((subject) => {
    const trimmedSubject = `${subject ?? ""}`.trim().replace(/\s+/g, " ");
    const normalizedName = normalizeSubjectName(trimmedSubject);

    if (!normalizedName || uniqueSubjects.has(normalizedName)) {
      return;
    }

    uniqueSubjects.set(normalizedName, trimmedSubject);
  });

  return Array.from(uniqueSubjects.values());
};

const normalizeSubjectGoals = (subjects) => {
  if (!Array.isArray(subjects)) {
    return [];
  }

  return subjects
    .map((item) => ({
      subject: `${item?.subject ?? ""}`.trim().replace(/\s+/g, " "),
      currentScore: Number(item?.currentScore ?? 0),
      targetScore: Number(item?.targetScore ?? 10),
    }))
    .filter((item) => item.subject);
};

const syncCustomSubjects = async (subjects, userId) => {
  const existingCustomSubjects = await Subject.find({
    normalizedName: {
      $in: subjects.map((subject) => normalizeSubjectName(subject)),
    },
  }).select("name normalizedName");

  const existingSubjectMap = new Map(
    existingCustomSubjects.map((subject) => [subject.normalizedName, subject.name])
  );

  const newSubjects = [];
  const resolvedSubjects = [];

  subjects.forEach((subject) => {
    const normalizedName = normalizeSubjectName(subject);
    const existingDefault = defaultSubjectNames.find(
      (subjectName) => normalizeSubjectName(subjectName) === normalizedName
    );

    if (existingDefault) {
      resolvedSubjects.push(existingDefault);
      return;
    }

    const existingCustomSubject = existingSubjectMap.get(normalizedName);

    if (existingCustomSubject) {
      resolvedSubjects.push(existingCustomSubject);
      return;
    }

    newSubjects.push({
      name: subject,
      normalizedName,
      createdBy: userId,
    });
    resolvedSubjects.push(subject);
  });

  if (newSubjects.length > 0) {
    try {
      await Subject.insertMany(newSubjects, { ordered: false });
    } catch (error) {
      if (error?.code !== 11000) {
        throw error;
      }
    }
  }

  return resolvedSubjects;
};

export const updateSchoolSchedule = async (req, res) => {
  try {
    const userId = req.user._id;
    const { morning, afternoon } = req.body ?? {};

    const morningStart = morning?.start?.trim?.() ?? "";
    const morningEnd = morning?.end?.trim?.() ?? "";
    const afternoonStart = afternoon?.start?.trim?.() ?? "";
    const afternoonEnd = afternoon?.end?.trim?.() ?? "";

    if (
      !isValidTimeRange(morningStart, morningEnd) ||
      !isValidTimeRange(afternoonStart, afternoonEnd)
    ) {
      return res.status(400).json({
        message:
          "Thời gian biểu không hợp lệ. Giờ bắt đầu phải nhỏ hơn giờ kết thúc.",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        schoolSchedule: {
          morning: {
            start: morningStart,
            end: morningEnd,
          },
          afternoon: {
            start: afternoonStart,
            end: afternoonEnd,
          },
          hasCompletedSetup: true,
          completedAt: new Date(),
        },
      },
      { new: true }
    ).select("-hashedPassword");

    return res.status(200).json({
      user: updatedUser,
    });
  } catch (error) {
    console.error("Lỗi khi updateSchoolSchedule", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const displayName = `${req.body?.displayName ?? ""}`.trim().replace(/\s+/g, " ");
    const classroom = `${req.body?.classroom ?? ""}`.trim().replace(/\s+/g, " ");
    const normalizedDateOfBirth = normalizeProfileDate(req.body?.dateOfBirth);

    if (!displayName) {
      return res.status(400).json({ message: "Tên hiển thị không được để trống." });
    }

    if (!classroom) {
      return res.status(400).json({ message: "Lớp không được để trống." });
    }

    if (normalizedDateOfBirth === undefined) {
      return res.status(400).json({ message: "Ngày sinh không hợp lệ." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        displayName,
        classroom,
        dateOfBirth: normalizedDateOfBirth,
      },
      {
        new: true,
      }
    );

    return res.status(200).json({
      message: "Cập nhật thông tin cá nhân thành công.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Lỗi khi updateProfile", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const updateStudyGoals = async (req, res) => {
  try {
    const userId = req.user._id;
    const { studyGoals } = req.body ?? {};

    const selectedSubjects = normalizeSelectedSubjects(studyGoals?.selectedSubjects);
    const subjectGoals = normalizeSubjectGoals(studyGoals?.subjects);

    if (selectedSubjects.length === 0 || subjectGoals.length === 0) {
      return res.status(400).json({
        message: "Vui lòng chọn ít nhất một môn học và nhập mục tiêu tương ứng.",
      });
    }

    const normalizedSelectedSubjectSet = new Set(
      selectedSubjects.map((subject) => normalizeSubjectName(subject))
    );

    const filteredSubjectGoals = subjectGoals.filter((item) =>
      normalizedSelectedSubjectSet.has(normalizeSubjectName(item.subject))
    );

    if (filteredSubjectGoals.length !== selectedSubjects.length) {
      return res.status(400).json({
        message: "Mỗi môn học được chọn cần có điểm thi thử và điểm mục tiêu.",
      });
    }

    const invalidScore = filteredSubjectGoals.some(
      (item) =>
        Number.isNaN(item.currentScore) ||
        Number.isNaN(item.targetScore) ||
        item.currentScore < 0 ||
        item.currentScore > 10 ||
        item.targetScore < 0 ||
        item.targetScore > 10
    );

    if (invalidScore) {
      return res.status(400).json({
        message: "Điểm thi thử và điểm mục tiêu phải nằm trong khoảng 0 đến 10.",
      });
    }

    const resolvedSubjects = await syncCustomSubjects(selectedSubjects, userId);
    const resolvedSubjectMap = new Map(
      resolvedSubjects.map((subject) => [normalizeSubjectName(subject), subject])
    );

    const resolvedGoals = filteredSubjectGoals.map((item) => ({
      ...item,
      subject: resolvedSubjectMap.get(normalizeSubjectName(item.subject)) ?? item.subject,
    }));

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        studyGoals: {
          selectedSubjects: resolvedSubjects,
          subjects: resolvedGoals,
        },
      },
      { new: true }
    ).select("-hashedPassword");

    return res.status(200).json({
      user: updatedUser,
    });
  } catch (error) {
    console.error("Lỗi khi updateStudyGoals", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const completeOnboarding = async (req, res) => {
  try {
    const userId = req.user._id;
    const { schoolSchedule, studyGoals } = req.body ?? {};

    const morningStart = schoolSchedule?.morning?.start?.trim?.() ?? "";
    const morningEnd = schoolSchedule?.morning?.end?.trim?.() ?? "";
    const afternoonStart = schoolSchedule?.afternoon?.start?.trim?.() ?? "";
    const afternoonEnd = schoolSchedule?.afternoon?.end?.trim?.() ?? "";

    if (
      !isValidTimeRange(morningStart, morningEnd) ||
      !isValidTimeRange(afternoonStart, afternoonEnd)
    ) {
      return res.status(400).json({
        message:
          "Thời gian biểu không hợp lệ. Giờ bắt đầu phải nhỏ hơn giờ kết thúc.",
      });
    }

    const selectedSubjects = normalizeSelectedSubjects(studyGoals?.selectedSubjects);
    const subjectGoals = normalizeSubjectGoals(studyGoals?.subjects);

    if (selectedSubjects.length === 0 || subjectGoals.length === 0) {
      return res.status(400).json({
        message: "Vui lòng chọn ít nhất một môn học và nhập mục tiêu tương ứng.",
      });
    }

    const invalidScore = subjectGoals.some(
      (item) =>
        Number.isNaN(item.currentScore) ||
        Number.isNaN(item.targetScore) ||
        item.currentScore < 0 ||
        item.currentScore > 10 ||
        item.targetScore < 0 ||
        item.targetScore > 10
    );

    if (invalidScore) {
      return res.status(400).json({
        message: "Điểm thi thử và điểm mục tiêu phải nằm trong khoảng 0 đến 10.",
      });
    }

    const resolvedSubjects = await syncCustomSubjects(selectedSubjects, userId);
    const resolvedSubjectMap = new Map(
      resolvedSubjects.map((subject) => [normalizeSubjectName(subject), subject])
    );

    const resolvedGoals = subjectGoals.map((item) => ({
      ...item,
      subject: resolvedSubjectMap.get(normalizeSubjectName(item.subject)) ?? item.subject,
    }));

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        schoolSchedule: {
          morning: {
            start: morningStart,
            end: morningEnd,
          },
          afternoon: {
            start: afternoonStart,
            end: afternoonEnd,
          },
          hasCompletedSetup: true,
          completedAt: new Date(),
        },
        studyGoals: {
          selectedSubjects: resolvedSubjects,
          subjects: resolvedGoals,
        },
      },
      { new: true }
    ).select("-hashedPassword");

    return res.status(200).json({
      user: updatedUser,
    });
  } catch (error) {
    console.error("Lỗi khi completeOnboarding", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

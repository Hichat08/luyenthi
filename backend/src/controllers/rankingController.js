import mongoose from "mongoose";
import PracticeAttempt from "../models/PracticeAttempt.js";

const DAILY_EXAM_TARGET = 10;

const getPeriodStart = (period) => {
  const now = new Date();

  if (period === "weekly") {
    const day = now.getDay();
    const distanceFromMonday = (day + 6) % 7;
    const start = new Date(now);
    start.setDate(now.getDate() - distanceFromMonday);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (period === "monthly") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return null;
};

const getTodayStart = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start;
};

const getPeriodMatchStage = (period) => {
  const periodStart = getPeriodStart(period);
  return periodStart ? { submittedAt: { $gte: periodStart } } : {};
};

const startOfDay = (date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const endOfDay = (date) => {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
};

const getRecentDayBuckets = (days = 7) => {
  const today = startOfDay(new Date());

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - index - 1));

    return {
      date,
      key: date.toISOString().slice(0, 10),
      label: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][date.getDay()],
    };
  });
};

const getTodayProgressSnapshot = async (userId) => {
  const todayStart = getTodayStart();
  const now = new Date();

  const attempts = await PracticeAttempt.find(
    { userId },
    { submissionHistory: 1, submittedAt: 1 }
  ).lean();

  const completedExams = attempts.reduce((sum, attempt) => {
    const hasSubmittedToday = (attempt.submissionHistory ?? []).some((submittedAt) => {
      const submittedDate = submittedAt ? new Date(submittedAt) : null;
      return submittedDate && submittedDate >= todayStart && submittedDate <= now;
    });

    if (hasSubmittedToday) {
      return sum + 1;
    }

    const submittedAt = attempt.submittedAt ? new Date(attempt.submittedAt) : null;
    const hasLegacySubmissionToday =
      submittedAt && submittedAt >= todayStart && submittedAt <= now;

    return sum + (hasLegacySubmissionToday ? 1 : 0);
  }, 0);

  return {
    completedExams,
    dailyTarget: DAILY_EXAM_TARGET,
    remainingExams: Math.max(DAILY_EXAM_TARGET - completedExams, 0),
    progressPercentage: Math.min(
      Math.round((completedExams / DAILY_EXAM_TARGET) * 100),
      100
    ),
  };
};

const buildLeaderboard = async (period, currentUserId) => {
  const matchStage = getPeriodMatchStage(period);

  const rows = await PracticeAttempt.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: "$userId",
        uniqueExamCount: { $sum: 1 },
        totalSubmissions: {
          $sum: {
            $cond: [
              { $gt: [{ $size: { $ifNull: ["$submissionHistory", []] } }, 0] },
              { $size: { $ifNull: ["$submissionHistory", []] } },
              1,
            ],
          },
        },
        totalCorrect: { $sum: "$correctCount" },
        totalWrong: { $sum: "$wrongCount" },
        averageTimeSpentSeconds: { $avg: { $ifNull: ["$timeSpentSeconds", 0] } },
        lastSubmittedAt: { $max: "$submittedAt" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $project: {
        _id: 0,
        userId: "$_id",
        totalExams: "$totalSubmissions",
        uniqueExamCount: 1,
        totalSubmissions: 1,
        totalCorrect: 1,
        totalWrong: 1,
        averageTimeSpentSeconds: { $round: ["$averageTimeSpentSeconds", 0] },
        accumulatedScore: { $multiply: ["$totalCorrect", 10] },
        streak: { $floor: { $divide: ["$totalSubmissions", 3] } },
        lastSubmittedAt: 1,
        displayName: "$user.displayName",
        username: "$user.username",
        avatarUrl: "$user.avatarUrl",
        userCode: "$user.userCode",
      },
    },
    {
      $sort: {
        totalSubmissions: -1,
        totalCorrect: -1,
        totalWrong: 1,
        lastSubmittedAt: 1,
      },
    },
  ]);

  const rankedRows = rows.map((row, index) => ({
    rank: index + 1,
    ...row,
  }));

  const currentUserRow = rankedRows.find(
    (row) => `${row.userId}` === `${currentUserId}`
  );

  const currentUserProfile = currentUserRow
    ? null
    : await PracticeAttempt.db
        .collection("users")
        .findOne(
          { _id: new mongoose.Types.ObjectId(currentUserId) },
          {
            projection: {
              displayName: 1,
              username: 1,
              avatarUrl: 1,
              userCode: 1,
            },
          }
        );

  return {
    leaderboard: rankedRows,
    currentUser:
      currentUserRow ??
      {
        rank: null,
        userId: currentUserId,
        totalExams: 0,
        uniqueExamCount: 0,
        totalSubmissions: 0,
        totalCorrect: 0,
        totalWrong: 0,
        averageTimeSpentSeconds: null,
        accumulatedScore: 0,
        streak: 0,
        displayName: currentUserProfile?.displayName,
        username: currentUserProfile?.username,
        avatarUrl: currentUserProfile?.avatarUrl,
        userCode: currentUserProfile?.userCode,
      },
  };
};

const buildResultsOverview = async (period, currentUserId, limit = 4) => {
  const matchStage = {
    userId: new mongoose.Types.ObjectId(currentUserId),
    ...getPeriodMatchStage(period),
  };

  const attempts = await PracticeAttempt.find(matchStage)
    .sort({ submittedAt: -1, updatedAt: -1 })
    .lean();

  const totalAttempts = attempts.length;
  const totalCorrect = attempts.reduce((sum, attempt) => sum + (attempt.correctCount ?? 0), 0);
  const totalWrong = attempts.reduce((sum, attempt) => sum + (attempt.wrongCount ?? 0), 0);
  const totalQuestions = totalCorrect + totalWrong;
  const totalScore = attempts.reduce((sum, attempt) => {
    const questionCount = (attempt.correctCount ?? 0) + (attempt.wrongCount ?? 0);
    const score = questionCount > 0 ? ((attempt.correctCount ?? 0) / questionCount) * 10 : 0;
    return sum + score;
  }, 0);

  const averageScore = totalAttempts > 0 ? totalScore / totalAttempts : 0;
  const completionRate = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

  const visibleAttempts = attempts.slice(0, limit).map((attempt) => ({
    _id: attempt._id,
    examId: attempt.examId,
    examTitle: attempt.examTitle,
    subject: attempt.subject,
    correctCount: attempt.correctCount,
    wrongCount: attempt.wrongCount,
    totalQuestions: (attempt.correctCount ?? 0) + (attempt.wrongCount ?? 0),
    timeSpentSeconds: attempt.timeSpentSeconds ?? 0,
    submittedAt: attempt.submittedAt,
  }));

  const recentDays = getRecentDayBuckets(7);
  const trend = recentDays.map(({ key, label, date }) => {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const dayAttempts = attempts.filter((attempt) => {
      const submittedAt = attempt.submittedAt ? new Date(attempt.submittedAt) : null;
      return submittedAt && submittedAt >= dayStart && submittedAt <= dayEnd;
    });

    const averageDayScore =
      dayAttempts.length > 0
        ? dayAttempts.reduce((sum, attempt) => {
            const questionCount = (attempt.correctCount ?? 0) + (attempt.wrongCount ?? 0);
            const score =
              questionCount > 0 ? ((attempt.correctCount ?? 0) / questionCount) * 10 : 0;
            return sum + score;
          }, 0) / dayAttempts.length
        : 0;

    return {
      key,
      label,
      score: Number(averageDayScore.toFixed(1)),
    };
  });

  const previousWindowStart = startOfDay(new Date(recentDays[0].date));
  previousWindowStart.setDate(previousWindowStart.getDate() - 7);
  const previousWindowEnd = endOfDay(new Date(recentDays[0].date));
  previousWindowEnd.setDate(previousWindowEnd.getDate() - 1);

  const previousAttempts = await PracticeAttempt.find({
    userId: new mongoose.Types.ObjectId(currentUserId),
    submittedAt: {
      $gte: previousWindowStart,
      $lte: previousWindowEnd,
    },
  }).lean();

  const currentTrendAverage =
    trend.length > 0 ? trend.reduce((sum, item) => sum + item.score, 0) / trend.length : 0;
  const previousTrendAverage =
    previousAttempts.length > 0
      ? previousAttempts.reduce((sum, attempt) => {
          const questionCount = (attempt.correctCount ?? 0) + (attempt.wrongCount ?? 0);
          const score =
            questionCount > 0 ? ((attempt.correctCount ?? 0) / questionCount) * 10 : 0;
          return sum + score;
        }, 0) / previousAttempts.length
      : 0;

  const scoreDeltaPercent =
    previousTrendAverage > 0
      ? Math.round(((currentTrendAverage - previousTrendAverage) / previousTrendAverage) * 100)
      : 0;

  return {
    period,
    summary: {
      totalAttempts,
      averageScore: Number(averageScore.toFixed(1)),
      completionRate: Math.round(completionRate),
      scoreDeltaPercent,
    },
    trend,
    attempts: visibleAttempts,
    hasMore: attempts.length > visibleAttempts.length,
  };
};

export const submitPracticeAttempt = async (req, res) => {
  try {
    const userId = req.user._id;
    const { examId, examTitle, subject, correctCount, wrongCount, timeSpentSeconds } =
      req.body ?? {};

    const normalizedExamId = `${examId ?? ""}`.trim();

    if (!normalizedExamId) {
      return res.status(400).json({ message: "examId là bắt buộc." });
    }

    const normalizedCorrectCount = Number(correctCount);
    const normalizedWrongCount = Number(wrongCount);
    const normalizedTimeSpentSeconds = Number(timeSpentSeconds ?? 0);

    if (
      Number.isNaN(normalizedCorrectCount) ||
      Number.isNaN(normalizedWrongCount) ||
      Number.isNaN(normalizedTimeSpentSeconds) ||
      normalizedCorrectCount < 0 ||
      normalizedWrongCount < 0 ||
      normalizedTimeSpentSeconds < 0
    ) {
      return res.status(400).json({
        message: "Dữ liệu bài làm phải là số không âm.",
      });
    }

    const existingAttempt = await PracticeAttempt.findOne({
      userId,
      examId: normalizedExamId,
    });
    const submittedAt = new Date();

    const attempt = await PracticeAttempt.findOneAndUpdate(
      { userId, examId: normalizedExamId },
      {
        $set: {
          examTitle: `${examTitle ?? ""}`.trim(),
          subject: `${subject ?? ""}`.trim(),
          correctCount: normalizedCorrectCount,
          wrongCount: normalizedWrongCount,
          timeSpentSeconds: normalizedTimeSpentSeconds,
          submittedAt,
        },
        $push: {
          submissionHistory: submittedAt,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    const { currentUser } = await buildLeaderboard("all", userId);
    const todayProgress = await getTodayProgressSnapshot(userId);

    return res.status(200).json({
      attempt,
      countedAsNewExam: !existingAttempt,
      rankingStats: currentUser,
      todayProgress,
    });
  } catch (error) {
    if (
      error instanceof mongoose.Error &&
      "code" in error &&
      error.code === 11000
    ) {
      return res.status(409).json({
        message: "Bài làm cho đề này đã tồn tại. Hãy cập nhật lại kết quả.",
      });
    }

    console.error("Lỗi khi submitPracticeAttempt", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const period = ["weekly", "monthly", "all"].includes(req.query?.period)
      ? req.query.period
      : "weekly";

    const { leaderboard, currentUser } = await buildLeaderboard(period, req.user._id);

    return res.status(200).json({
      period,
      leaderboard,
      currentUser,
    });
  } catch (error) {
    console.error("Lỗi khi getLeaderboard", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getTodayProgress = async (req, res) => {
  try {
    const progress = await getTodayProgressSnapshot(req.user._id);

    return res.status(200).json(progress);
  } catch (error) {
    console.error("Lỗi khi getTodayProgress", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getResultsOverview = async (req, res) => {
  try {
    const period = ["weekly", "monthly", "all"].includes(req.query?.period)
      ? req.query.period
      : "all";
    const limit = Math.max(Number(req.query?.limit ?? 4) || 4, 1);

    const overview = await buildResultsOverview(period, req.user._id, limit);

    return res.status(200).json(overview);
  } catch (error) {
    console.error("Lỗi khi getResultsOverview", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

import User from "../models/User.js";
import PracticeAttempt from "../models/PracticeAttempt.js";

const getMonthStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

const getTodayStart = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start;
};

const getTodayEnd = () => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return end;
};

const hasSubmissionToday = (attempt, todayStart, todayEnd) => {
  const history = Array.isArray(attempt.submissionHistory) ? attempt.submissionHistory : [];
  const inHistory = history.some((submittedAt) => {
    const submittedDate = submittedAt ? new Date(submittedAt) : null;
    return submittedDate && submittedDate >= todayStart && submittedDate <= todayEnd;
  });

  if (inHistory) {
    return true;
  }

  const submittedAt = attempt.submittedAt ? new Date(attempt.submittedAt) : null;
  return Boolean(submittedAt && submittedAt >= todayStart && submittedAt <= todayEnd);
};

const getAttemptScore = (attempt) => {
  const totalQuestions = (attempt.correctCount ?? 0) + (attempt.wrongCount ?? 0);
  return totalQuestions > 0 ? ((attempt.correctCount ?? 0) / totalQuestions) * 10 : 0;
};

export const getAdminOverview = async (_req, res) => {
  try {
    const monthStart = getMonthStart();

    const [totalUsers, totalAdmins, newUsersThisMonth, latestUsers] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ createdAt: { $gte: monthStart } }),
      User.find({})
        .sort({ createdAt: -1 })
        .limit(6)
        .select("displayName username role classroom createdAt avatarUrl"),
    ]);

    return res.status(200).json({
      stats: {
        totalUsers,
        totalAdmins,
        totalStudents: Math.max(totalUsers - totalAdmins, 0),
        newUsersThisMonth,
      },
      latestUsers,
    });
  } catch (error) {
    console.error("Lỗi khi tải admin overview", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getAdminAnalytics = async (_req, res) => {
  try {
    const todayStart = getTodayStart();
    const todayEnd = getTodayEnd();

    const [users, attempts] = await Promise.all([
      User.find({ role: "user" })
        .sort({ displayName: 1 })
        .select("displayName username userCode classroom avatarUrl lastActiveAt createdAt"),
      PracticeAttempt.find({})
        .sort({ submittedAt: -1 })
        .select(
          "userId examId examTitle subject correctCount wrongCount submittedAt submissionHistory suspiciousExitCount autoSubmittedForCheating flaggedForReview updatedAt"
        )
        .lean(),
    ]);

    const attemptsByUser = new Map();

    attempts.forEach((attempt) => {
      const userId = `${attempt.userId}`;
      const current = attemptsByUser.get(userId) ?? [];
      current.push(attempt);
      attemptsByUser.set(userId, current);
    });

    const userScoreRows = users.map((user) => {
      const userId = `${user._id}`;
      const userAttempts = attemptsByUser.get(userId) ?? [];
      const todayAttempts = userAttempts.filter((attempt) =>
        hasSubmissionToday(attempt, todayStart, todayEnd)
      );
      const totalAttempts = userAttempts.length;
      const averageScore =
        totalAttempts > 0
          ? userAttempts.reduce((sum, attempt) => sum + getAttemptScore(attempt), 0) /
            totalAttempts
          : 0;
      const todayAverageScore =
        todayAttempts.length > 0
          ? todayAttempts.reduce((sum, attempt) => sum + getAttemptScore(attempt), 0) /
            todayAttempts.length
          : 0;

      return {
        _id: user._id,
        displayName: user.displayName,
        username: user.username,
        userCode: user.userCode,
        classroom: user.classroom,
        lastActiveAt: user.lastActiveAt,
        todayExamCount: todayAttempts.length,
        averageScore: Number(averageScore.toFixed(1)),
        todayAverageScore: Number(todayAverageScore.toFixed(1)),
      };
    });

    const usersMissingDailyTarget = userScoreRows
      .filter((user) => user.todayExamCount < 10)
      .sort((a, b) => a.todayExamCount - b.todayExamCount)
      .slice(0, 30);

    const inactiveUsers = userScoreRows
      .filter((user) => !user.lastActiveAt || new Date(user.lastActiveAt) < todayStart)
      .slice(0, 30);

    const suspiciousAttempts = attempts
      .filter((attempt) => attempt.flaggedForReview || (attempt.suspiciousExitCount ?? 0) >= 3)
      .slice(0, 30)
      .map((attempt) => {
        const owner = users.find((user) => `${user._id}` === `${attempt.userId}`);
        return {
          _id: attempt._id,
          userId: attempt.userId,
          displayName: owner?.displayName ?? "Không rõ",
          username: owner?.username ?? "",
          userCode: owner?.userCode ?? "",
          examTitle: attempt.examTitle,
          subject: attempt.subject,
          suspiciousExitCount: attempt.suspiciousExitCount ?? 0,
          autoSubmittedForCheating: Boolean(attempt.autoSubmittedForCheating),
          flaggedForReview: Boolean(attempt.flaggedForReview),
          submittedAt: attempt.submittedAt,
        };
      });

    return res.status(200).json({
      summary: {
        totalUsers: users.length,
        inactiveTodayCount: inactiveUsers.length,
        underTargetCount: usersMissingDailyTarget.length,
        suspiciousAttemptCount: suspiciousAttempts.length,
      },
      usersMissingDailyTarget,
      inactiveUsers,
      userScores: userScoreRows
        .sort((a, b) => b.averageScore - a.averageScore || b.todayExamCount - a.todayExamCount)
        .slice(0, 50),
      suspiciousAttempts,
    });
  } catch (error) {
    console.error("Lỗi khi tải admin analytics", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

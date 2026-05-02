import api from "@/lib/axios";
import type { PracticeExamSummary, SubjectExamDifficulty } from "@/types/exam";
import type { User, UserRole } from "@/types/user";

export interface AdminOverviewStats {
  totalUsers: number;
  totalAdmins: number;
  totalStudents: number;
  newUsersThisMonth: number;
}

export interface AdminOverviewUser
  extends Pick<User, "_id" | "username" | "displayName" | "avatarUrl" | "classroom"> {
  role: UserRole;
  createdAt?: string;
}

export interface AdminOverviewResponse {
  stats: AdminOverviewStats;
  latestUsers: AdminOverviewUser[];
}

export type AdminNotificationTargetUser = Pick<
  User,
  "_id" | "username" | "displayName" | "avatarUrl" | "classroom" | "userCode"
>;

export interface AdminNotificationRecord {
  id: string;
  title: string;
  body: string;
  category: "study" | "system";
  audience: "all" | "selected";
  createdAt?: string;
  createdBy?: {
    _id: string;
    displayName: string;
    username: string;
  } | null;
  recipients: AdminNotificationTargetUser[];
}

export interface AdminAnalyticsUserScoreRow {
  _id: string;
  displayName: string;
  username: string;
  userCode?: string;
  classroom?: string;
  lastActiveAt?: string | null;
  todayExamCount: number;
  averageScore: number;
  todayAverageScore: number;
}

export interface AdminSuspiciousAttemptRow {
  _id: string;
  userId: string;
  displayName: string;
  username: string;
  userCode?: string;
  examTitle?: string;
  subject?: string;
  suspiciousExitCount: number;
  autoSubmittedForCheating: boolean;
  flaggedForReview: boolean;
  submittedAt?: string;
}

export interface AdminAnalyticsResponse {
  summary: {
    totalUsers: number;
    inactiveTodayCount: number;
    underTargetCount: number;
    suspiciousAttemptCount: number;
  };
  usersMissingDailyTarget: AdminAnalyticsUserScoreRow[];
  inactiveUsers: AdminAnalyticsUserScoreRow[];
  userScores: AdminAnalyticsUserScoreRow[];
  suspiciousAttempts: AdminSuspiciousAttemptRow[];
}

export interface AdminCreateExamQuestionPayload {
  topicLabel?: string;
  questionCode?: string;
  prompt: string;
  imageUrl?: string;
  hint?: string;
  options: string[];
  correctIndex: number;
  explanationTitle?: string;
  explanationSteps?: string[];
  explanationConclusion?: string;
  formula?: string;
}

export interface AdminCreateEssayContentPayload {
  readingPassage: string;
  readingQuestion: string;
  essayPrompt: string;
  checklist?: string[];
  statusNote?: string;
}

export interface AdminCreateExamPayload {
  subject: string;
  examType: "multiple_choice" | "essay";
  title: string;
  durationMinutes: number;
  difficulty: SubjectExamDifficulty;
  category: "illustration" | "specialized" | "self-study";
  imageUrl?: string;
  badge?: string;
  questions?: AdminCreateExamQuestionPayload[];
  essayContent?: AdminCreateEssayContentPayload;
}

export const adminService = {
  getOverview: async () => {
    const res = await api.get("/admin/overview", { withCredentials: true });
    return res.data as AdminOverviewResponse;
  },
  searchUsersForNotification: async (query: string) => {
    const res = await api.get("/admin/users/search", {
      params: { q: query },
      withCredentials: true,
    });

    return res.data.users as AdminNotificationTargetUser[];
  },
  createNotification: async (payload: {
    title: string;
    body: string;
    category: "study" | "system";
    audience: "all" | "selected";
    recipientIds?: string[];
  }) => {
    const res = await api.post("/admin/notifications", payload, {
      withCredentials: true,
    });

    return res.data as {
      notification: AdminNotificationRecord;
      message: string;
    };
  },
  listNotifications: async () => {
    const res = await api.get("/admin/notifications", {
      withCredentials: true,
    });

    return res.data.notifications as AdminNotificationRecord[];
  },
  getAnalytics: async () => {
    const res = await api.get("/admin/analytics", {
      withCredentials: true,
    });

    return res.data as AdminAnalyticsResponse;
  },
  createExam: async (payload: AdminCreateExamPayload) => {
    const res = await api.post("/admin/exams", payload, {
      withCredentials: true,
    });

    return res.data as {
      message: string;
      exam: PracticeExamSummary;
    };
  },
};

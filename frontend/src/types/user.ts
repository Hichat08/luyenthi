export type UserRole = "user" | "admin";

export interface SchoolSession {
  start: string;
  end: string;
}

export interface SchoolSchedule {
  morning: SchoolSession;
  afternoon: SchoolSession;
  hasCompletedSetup: boolean;
  completedAt?: string | null;
}

export interface StudyGoalSubject {
  subject: string;
  currentScore: number;
  targetScore: number;
}

export interface StudyGoals {
  selectedSubjects: string[];
  subjects: StudyGoalSubject[];
}

export interface User {
  _id: string;
  userCode?: string;
  username: string;
  role: UserRole;
  email: string;
  displayName: string;
  classroom?: string;
  dateOfBirth?: string | null;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  schoolSchedule?: SchoolSchedule;
  studyGoals?: StudyGoals;
  createdAt?: string;
  updatedAt?: string;
}

export interface Friend {
  _id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

export interface FriendRequest {
  _id: string;
  from?: {
    _id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  to?: {
    _id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  message: string;
  createdAt: string;
  updatedAt: string;
}

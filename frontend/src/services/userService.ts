import api from "@/lib/axios";
import type { RemoteNotificationPayload } from "@/components/chat/notification-data";

export const userService = {
  uploadAvatar: async (formData: FormData) => {
    const res = await api.post("/users/uploadAvatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res.status === 400) {
      throw new Error(res.data.message);
    }

    return res.data;
  },
  updateProfile: async (payload: {
    displayName: string;
    dateOfBirth: string;
    classroom: string;
  }) => {
    const res = await api.patch("/users/profile", payload, {
      withCredentials: true,
    });

    return res.data;
  },
  completeOnboarding: async (payload: {
    schoolSchedule: {
      morning: { start: string; end: string };
      afternoon: { start: string; end: string };
    };
    studyGoals: {
      selectedSubjects: string[];
      subjects: {
        subject: string;
        currentScore: number;
        targetScore: number;
      }[];
    };
  }) => {
    const res = await api.patch("/users/onboarding", payload, {
      withCredentials: true,
    });

    return res.data;
  },
  updateStudyGoals: async (payload: {
    studyGoals: {
      selectedSubjects: string[];
      subjects: {
        subject: string;
        currentScore: number;
        targetScore: number;
      }[];
    };
  }) => {
    const res = await api.patch("/users/study-goals", payload, {
      withCredentials: true,
    });

    return res.data;
  },
  getNotifications: async () => {
    const res = await api.get("/users/notifications", {
      withCredentials: true,
    });

    return res.data.notifications as RemoteNotificationPayload[];
  },
};

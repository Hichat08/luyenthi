import { userService } from "@/services/userService";
import type { UserState } from "@/types/store";
import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import { toast } from "sonner";
import { useChatStore } from "./useChatStore";

export const useUserStore = create<UserState>(() => ({
  updateAvatarUrl: async (formData) => {
    try {
      const { user, setUser } = useAuthStore.getState();
      const data = await userService.uploadAvatar(formData);

      if (user) {
        setUser({
          ...user,
          avatarUrl: data.avatarUrl,
        });

        useChatStore.getState().fetchConversations();
      }
    } catch (error) {
      console.error("Lỗi khi updateAvatarUrl", error);
      toast.error("Upload avatar không thành công!");
    }
  },
  updateProfile: async (payload) => {
    try {
      const { setUser } = useAuthStore.getState();
      const data = await userService.updateProfile(payload);

      if (data.user) {
        setUser(data.user);
        void useChatStore.getState().fetchConversations();
      }

      toast.success("Đã lưu thông tin cá nhân.");
      return true;
    } catch (error) {
      console.error("Lỗi khi updateProfile", error);
      toast.error("Không thể lưu thông tin cá nhân. Hãy thử lại!");
      return false;
    }
  },
  completeOnboarding: async (payload) => {
    try {
      const { setUser } = useAuthStore.getState();
      const data = await userService.completeOnboarding(payload);

      if (data.user) {
        setUser(data.user);
      }

      toast.success("Đã hoàn tất thiết lập lộ trình ban đầu.");
      return true;
    } catch (error) {
      console.error("Lỗi khi completeOnboarding", error);
      toast.error("Không thể hoàn tất thiết lập. Hãy thử lại!");
      return false;
    }
  },
  updateStudyGoals: async (payload) => {
    try {
      const { setUser } = useAuthStore.getState();
      const data = await userService.updateStudyGoals(payload);

      if (data.user) {
        setUser(data.user);
      }

      toast.success("Đã cập nhật môn ôn thi của bạn.");
      return true;
    } catch (error) {
      console.error("Lỗi khi updateStudyGoals", error);
      toast.error("Không thể cập nhật môn ôn thi. Hãy thử lại!");
      return false;
    }
  },
}));

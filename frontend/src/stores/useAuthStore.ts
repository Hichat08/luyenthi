import { create } from "zustand";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import type { AuthState } from "@/types/store";
import { persist } from "zustand/middleware";
import { useChatStore } from "./useChatStore";
import { useNotificationStore } from "./useNotificationStore";

const REMEMBER_SIGNIN_KEY = "remembered-signin";
const AUTH_STORAGE_KEYS = [
  "auth-storage",
  "chat-storage",
  "notification-storage",
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      loading: false,

      setAccessToken: (accessToken) => {
        set({ accessToken });
      },
      setUser: (user) => {
        set({ user });
      },
      clearState: () => {
        set({ accessToken: null, user: null, loading: false });
        useChatStore.getState().reset();
        useNotificationStore.getState().reset();
        AUTH_STORAGE_KEYS.forEach((key) => {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        });
      },
      signUp: async (
        username,
        password,
        email,
        firstName,
        lastName,
        classroom,
      ) => {
        try {
          set({ loading: true });

          //  gọi api
          await authService.signUp(
            username,
            password,
            email,
            firstName,
            lastName,
            classroom,
          );

          toast.success(
            "Đăng ký thành công! Bạn sẽ được chuyển sang trang đăng nhập.",
          );
          return true;
        } catch (error) {
          console.error(error);
          toast.error("Đăng ký không thành công");
          return false;
        } finally {
          set({ loading: false });
        }
      },
      signIn: async (username, password, remember = true) => {
        try {
          get().clearState();
          set({ loading: true });

          const { accessToken, rememberedUsername } = await authService.signIn(
            username,
            password,
            remember,
          );

          if (remember && rememberedUsername) {
            localStorage.setItem(
              REMEMBER_SIGNIN_KEY,
              JSON.stringify({
                username: rememberedUsername,
                remember: true,
              }),
            );
          } else {
            localStorage.removeItem(REMEMBER_SIGNIN_KEY);
          }

          get().setAccessToken(accessToken);

          await get().fetchMe();
          await useChatStore.getState().fetchConversations();

          toast.success("Chào mừng bạn quay lại với Lộ trình học tập 🎉");
          return true;
        } catch (error) {
          console.error(error);
          toast.error("Đăng nhập không thành công!");
          return false;
        } finally {
          set({ loading: false });
        }
      },
      signInWithGoogle: async (idToken, remember = true) => {
        try {
          get().clearState();
          set({ loading: true });

          const { accessToken } = await authService.signInWithGoogle(
            idToken,
            remember,
          );

          get().setAccessToken(accessToken);
          await get().fetchMe();
          await useChatStore.getState().fetchConversations();

          toast.success("Đăng nhập Google thành công! Chào mừng bạn.");
          return true;
        } catch (error) {
          console.error(error);
          toast.error("Đăng nhập Google không thành công!");
          return false;
        } finally {
          set({ loading: false });
        }
      },
      signOut: async () => {
        try {
          get().clearState();
          await authService.signOut();
          toast.success("Logout thành công!");
        } catch (error) {
          console.error(error);
          toast.error("Lỗi xảy ra khi logout. Hãy thử lại!");
        }
      },
      fetchMe: async () => {
        try {
          set({ loading: true });
          const user = await authService.fetchMe();

          set({ user });
        } catch (error) {
          console.error(error);
          set({ user: null, accessToken: null });
          toast.error("Lỗi xảy ra khi lấy dữ liệu người dùng. Hãy thử lại!");
        } finally {
          set({ loading: false });
        }
      },
      refresh: async () => {
        try {
          set({ loading: true });
          const { user, fetchMe, setAccessToken } = get();
          const accessToken = await authService.refresh();

          setAccessToken(accessToken);

          if (!user || !user.userCode) {
            await fetchMe();
          }
        } catch (error) {
          console.error(error);
          toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
          get().clearState();
        } finally {
          set({ loading: false });
        }
      },
      restoreSession: async () => {
        try {
          set({ loading: true });
          const { user, fetchMe, setAccessToken } = get();
          const accessToken = await authService.refresh();

          setAccessToken(accessToken);

          if (!user || !user.userCode) {
            await fetchMe();
          }

          return true;
        } catch {
          set({ accessToken: null, user: null });
          return false;
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user }), // chỉ persist user
    },
  ),
);

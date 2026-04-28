import { Button } from "@/components/ui/button";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/stores/useAuthStore";
import { Link, useNavigate } from "react-router";
import { AuthInputField } from "./auth-field";
import { GraduationCap, Lock, UserRound } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

const REMEMBER_SIGNIN_KEY = "remembered-signin";

const signInSchema = z.object({
  username: z.string().min(3, "Tên đăng nhập phải có ít nhất 3 ký tự"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  remember: z.boolean().optional(),
});

type SignInFormValues = z.infer<typeof signInSchema>;

export function SigninForm() {
  const { signIn, signInWithGoogle } = useAuthStore();
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      remember: true,
    },
  });

  const remember = watch("remember");
  const googleInitialized = useRef(false);

  const handleGoogleSignIn = useCallback(
    async (response: { credential?: string }) => {
      const token = response?.credential;
      if (!token) {
        toast.error("Đăng nhập Google không thành công.");
        return;
      }

      const success = await signInWithGoogle(token);

      if (success) {
        const role = useAuthStore.getState().user?.role;
        navigate(role === "admin" ? "/admin" : "/home");
      }
    },
    [navigate, signInWithGoogle],
  );

  const handleGoogleButtonClick = () => {
    if (!googleInitialized.current) {
      toast.error("Google chưa sẵn sàng, hãy thử lại sau.");
      return;
    }

    const google = (window as any).google;
    if (!google?.accounts?.id) {
      toast.error("Google chưa sẵn sàng, hãy thử lại sau.");
      return;
    }

    google.accounts.id.prompt();
  };

  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_SIGNIN_KEY);

    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved) as {
        username?: string;
        remember?: boolean;
      };

      setValue("username", parsed.username ?? "");
      setValue("remember", parsed.remember ?? true);
    } catch {
      localStorage.removeItem(REMEMBER_SIGNIN_KEY);
    }
  }, [setValue]);

  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      const google = (window as any).google;

      if (!google?.accounts?.id) {
        return;
      }

      google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleSignIn,
        ux_mode: "popup",
        auto_select: false,
      });
      googleInitialized.current = true;
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [handleGoogleSignIn]);

  useEffect(() => {
    if (remember) {
      return;
    }

    localStorage.removeItem(REMEMBER_SIGNIN_KEY);
  }, [remember]);

  const storeBrowserCredential = async () => {
    if (
      !formRef.current ||
      !("PasswordCredential" in window) ||
      !navigator.credentials
    ) {
      return;
    }

    try {
      const PasswordCredentialCtor = (
        window as Window & {
          PasswordCredential?: new (form: HTMLFormElement) => any;
        }
      ).PasswordCredential;

      if (!PasswordCredentialCtor) {
        return;
      }

      const credential = new PasswordCredentialCtor(formRef.current);
      await navigator.credentials.store(credential);
    } catch (error) {
      console.error("Không thể lưu credential cho trình duyệt:", error);
    }
  };

  const onSubmit = async (data: SignInFormValues) => {
    const { username, password, remember } = data;

    const success = await signIn(username, password, remember ?? true);

    if (success) {
      if (remember) {
        await storeBrowserCredential();
      }

      const role = useAuthStore.getState().user?.role;
      navigate(role === "admin" ? "/admin" : "/home");
    }
  };

  return (
    <>
      <section className="auth-card">
        <div className="auth-card-topbar" />

        <div className="px-5 pb-6 pt-7 sm:px-8 sm:pb-8 sm:pt-10">
          <div className="auth-hero">
            <div className="auth-icon-frame mb-6">
              <GraduationCap
                className="size-10 text-primary"
                strokeWidth={1.8}
              />
            </div>

            <p className="mb-3 font-auth-body text-[0.76rem] font-semibold uppercase tracking-[0.22em] text-primary/75 sm:text-[0.84rem] sm:tracking-[0.28em]">
              Tiếp tục hành trình học tập
            </p>

            <h1 className="font-auth-heading text-[clamp(2.2rem,9vw,4rem)] font-extrabold uppercase tracking-[-0.05em] text-primary">
              Đăng nhập
            </h1>

            <p className="mt-3 font-auth-body text-[1rem] font-semibold leading-6 tracking-[0.01em] text-foreground/72 sm:text-[1.18rem] sm:leading-7">
              Chào mừng trở lại
            </p>
          </div>

          <form
            ref={formRef}
            className="space-y-5 sm:space-y-6"
            onSubmit={handleSubmit(onSubmit)}
            autoComplete="on"
            noValidate
          >
            <AuthInputField
              label="Tên đăng nhập"
              icon={UserRound}
              placeholder="Nhập tên đăng nhập của bạn"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              {...register("username")}
              error={errors.username?.message}
            />

            <AuthInputField
              label="Mật khẩu"
              icon={Lock}
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              spellCheck={false}
              {...register("password")}
              error={errors.password?.message}
            />

            <div className="flex items-start justify-between gap-3 pt-0.5 sm:gap-4 sm:pt-1">
              <label className="flex items-start gap-2.5 font-auth-body text-[0.9rem] font-medium leading-5 text-foreground/80 sm:gap-3 sm:text-[0.95rem] sm:leading-6">
                <input
                  type="checkbox"
                  className="mt-0.5 h-[18px] w-[18px] rounded-md border border-[hsl(var(--border)/0.85)] accent-[hsl(var(--primary))] sm:mt-1 sm:h-5 sm:w-5"
                  {...register("remember")}
                />
                <span>Ghi nhớ đăng nhập</span>
              </label>

              <button
                type="button"
                className="auth-mini-link text-[0.9rem] sm:text-[0.95rem]"
              >
                Quên mật khẩu?
              </button>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="group h-14 w-full rounded-[1.25rem] bg-gradient-primary font-auth-body text-base font-bold uppercase tracking-[0.22em] text-white shadow-[0_18px_34px_-18px_hsl(var(--primary)/0.75)] transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_38px_-18px_hsl(var(--primary)/0.85)] sm:h-16 sm:rounded-[1.5rem] sm:text-lg sm:tracking-[0.28em]"
            >
              Đăng nhập
            </Button>

            <div className="mt-4 flex flex-col items-center gap-3 text-center">
              <span className="text-sm text-foreground/70">
                Hoặc đăng nhập bằng
              </span>
              <Button
                type="button"
                variant="secondary"
                className="group h-14 w-full max-w-[28rem] rounded-[1.25rem] border border-border/70 bg-background/85 px-4 font-auth-body text-base font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:bg-background dark:bg-muted/30 sm:h-16 sm:text-lg"
                onClick={handleGoogleButtonClick}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm">
                    <svg
                      viewBox="0 0 46 46"
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                    >
                      <path
                        d="M23 9.5c3.9 0 7 1.5 9.1 3.6l6.6-6.6C34.6 2.5 29.1 0 23 0 14.5 0 7.1 4.9 3.2 12.1l7.7 6c1.6-4.7 6-8.6 12.1-8.6z"
                        fill="#EA4335"
                      />
                      <path
                        d="M45.9 23.5c0-1.6-.1-3.1-.4-4.5H23v8.5h12.5c-.5 2.8-2.1 5.2-4.5 6.8l7 5.4c4.1-3.8 6.5-9.4 6.5-16.2z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12.8 27.8c-.7-2.1-1-4.3-1-6.6s.4-4.5 1-6.6l-7.7-6C2.4 14.2 1 18.5 1 23.5s1.4 9.3 4.1 13.9l7.7-6.6z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M23 46c6.1 0 11.6-2 15.9-5.4l-7-5.4c-2.2 1.5-4.9 2.4-8.9 2.4-6.1 0-10.5-3.9-12.1-8.6l-7.7 6c3.9 7.2 11.3 12.1 19.8 12.1z"
                        fill="#34A853"
                      />
                    </svg>
                  </span>
                  Đăng nhập bằng Google
                </span>
              </Button>
            </div>
          </form>

          <div className="pt-7 text-center sm:pt-8">
            <p className="font-auth-body text-[0.98rem] text-foreground/85 sm:text-[1.05rem]">
              Chưa có tài khoản?{" "}
              <Link
                to="/signup"
                className="font-bold text-primary transition-opacity hover:opacity-80"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </section>

      <div className="mt-6 flex items-center justify-center gap-3 sm:mt-8 sm:gap-6">
        <button type="button" className="auth-support-link">
          Hỗ trợ
        </button>
        <span className="text-muted-foreground/35">•</span>
        <button type="button" className="auth-support-link">
          Điều khoản
        </button>
        <span className="text-muted-foreground/35">•</span>
        <button type="button" className="auth-support-link">
          Bảo mật
        </button>
      </div>
    </>
  );
}

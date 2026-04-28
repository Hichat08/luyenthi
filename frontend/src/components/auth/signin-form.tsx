import { Button } from "@/components/ui/button";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/stores/useAuthStore";
import { Link, useNavigate } from "react-router";
import { AuthInputField } from "./auth-field";
import { GraduationCap, Lock, UserRound } from "lucide-react";
import { useEffect, useRef } from "react";
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
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

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
      });

      if (googleButtonRef.current) {
        google.accounts.id.renderButton(googleButtonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          width: "100%",
        });
      }
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

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

  const handleGoogleSignIn = async (response: { credential?: string }) => {
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

            <div className="mt-4 flex flex-col gap-3 text-center">
              <span className="text-sm text-foreground/70">
                Hoặc đăng nhập bằng
              </span>
              <div ref={googleButtonRef} />
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

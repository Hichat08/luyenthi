import { Button } from "@/components/ui/button";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/stores/useAuthStore";
import { Link, useNavigate } from "react-router";
import { AuthInputField } from "./auth-field";
import {
  BookOpen,
  ChevronDown,
  GraduationCap,
  IdCard,
  LibraryBig,
  Lock,
  NotebookText,
  School,
  ScrollText,
  UserRound,
  Zap,
} from "lucide-react";

const classroomOptions = Array.from({ length: 10 }, (_, index) => `12B${index + 1}`);

const signUpSchema = z.object({
  fullName: z.string().min(2, "Họ và tên phải có ít nhất 2 ký tự"),
  username: z.string().min(3, "Tên đăng nhập phải có ít nhất 3 ký tự"),
  classroom: z.string().min(1, "Lớp bắt buộc phải có"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  acceptTerms: z.boolean().refine((value) => value, {
    message: "Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách bảo mật",
  }),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

const splitFullName = (value: string) => {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return { firstName: "Học viên", lastName: "Học viên" };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: parts[0] };
  }

  return {
    firstName: parts[parts.length - 1],
    lastName: parts.slice(0, -1).join(" "),
  };
};

const buildInternalEmail = (username: string) => {
  const safeUsername =
    username
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "") || "student";

  return `${safeUsername}@student.lotrinhhoctap.local`;
};

export function SignupForm() {
  const { signUp } = useAuthStore();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      classroom: "",
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: SignUpFormValues) => {
    const { fullName, username, password, classroom } = data;
    const { firstName, lastName } = splitFullName(fullName);
    const email = buildInternalEmail(username);

    const success = await signUp(
      username,
      password,
      email,
      firstName,
      lastName,
      classroom
    );

    if (success) {
      navigate("/signin");
    }
  };

  return (
    <>
      <section className="auth-card">
        <div className="auth-card-topbar" />

        <div className="px-5 pb-6 pt-7 sm:px-8 sm:pb-8 sm:pt-10">
          <div className="auth-hero">
            <div className="auth-icon-frame auth-icon-frame-tilted mb-6 transition-transform duration-300">
              <GraduationCap
                className="size-9 text-primary"
                strokeWidth={1.8}
              />
            </div>

            <h1 className="font-auth-heading text-[clamp(1.95rem,8.3vw,3.5rem)] font-extrabold uppercase tracking-[-0.05em] text-primary">
              Lộ Trình Học Tập
            </h1>

            <p className="auth-hero-subtitle">
              Xây dựng tương lai tri thức của bạn
            </p>
          </div>

          <form
            className="space-y-5 sm:space-y-6"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <AuthInputField
              label="Họ và tên"
              icon={UserRound}
              placeholder="Nguyễn Văn A"
              autoComplete="name"
              {...register("fullName")}
              error={errors.fullName?.message}
            />

            <AuthInputField
              label="Tên đăng nhập"
              icon={IdCard}
              placeholder="nguyenvana12"
              autoComplete="username"
              {...register("username")}
              error={errors.username?.message}
            />

            <div className="space-y-2.5">
              <label
                htmlFor="classroom"
                className="pl-1 font-auth-body text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground/90 sm:text-[0.9rem] sm:tracking-[0.22em]"
              >
                Lớp
              </label>

              <div className="group relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-muted-foreground/70 transition-colors group-focus-within:text-primary sm:w-12">
                  <School
                    className="size-[18px] sm:size-5"
                    strokeWidth={1.9}
                  />
                </span>

                <select
                  id="classroom"
                  aria-invalid={Boolean(errors.classroom)}
                  className="h-14 w-full appearance-none rounded-[1.25rem] border border-[hsl(var(--border)/0.75)] bg-[hsl(var(--background))] pl-11 pr-12 font-auth-body text-[0.95rem] shadow-[0_12px_30px_-24px_hsl(var(--primary)/0.55)] outline-none transition-[color,box-shadow] focus-visible:border-primary/70 focus-visible:ring-[4px] focus-visible:ring-primary/10 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-[hsl(var(--muted)/0.55)] sm:h-16 sm:rounded-[1.5rem] sm:pl-12 sm:text-[1rem]"
                  {...register("classroom")}
                >
                  <option
                    value=""
                    disabled
                  >
                    Chọn lớp của bạn
                  </option>
                  {classroomOptions.map((classroom) => (
                    <option
                      key={classroom}
                      value={classroom}
                    >
                      {classroom}
                    </option>
                  ))}
                </select>

                <span className="pointer-events-none absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground/65 sm:w-12">
                  <ChevronDown className="size-[18px] sm:size-5" />
                </span>
              </div>

              {errors.classroom ? (
                <p className="pl-1 text-sm font-medium text-destructive">
                  {errors.classroom.message}
                </p>
              ) : null}
            </div>

            <AuthInputField
              label="Mật khẩu"
              icon={Lock}
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              {...register("password")}
              error={errors.password?.message}
            />

            <div className="space-y-2 pl-1">
              <label className="flex items-start gap-3 font-auth-body">
                <input
                  type="checkbox"
                  className="mt-0.5 h-[18px] w-[18px] rounded-md border border-[hsl(var(--border)/0.85)] accent-[hsl(var(--primary))] sm:h-5 sm:w-5"
                  {...register("acceptTerms")}
                />

                <span className="min-w-0">
                  <span className="block text-[0.92rem] font-semibold leading-6 text-foreground/88 sm:text-[0.96rem] sm:leading-6.5">
                    Tôi đồng ý với{" "}
                    <span className="auth-consent-highlight">
                      Điều khoản dịch vụ
                    </span>{" "}
                    và{" "}
                    <span className="auth-consent-highlight">
                      Chính sách bảo mật
                    </span>
                  </span>

                  <span className="mt-1 block text-[0.78rem] leading-5 text-muted-foreground/78 sm:text-[0.82rem]">
                    Quyền riêng tư, thông tin tài khoản và dữ liệu học tập của
                    bạn sẽ được bảo vệ theo các cam kết của hệ thống.
                  </span>
                </span>
              </label>

              {errors.acceptTerms ? (
                <p className="pl-7 text-sm font-medium text-destructive sm:pl-8">
                  {errors.acceptTerms.message}
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="group h-14 w-full rounded-[1.25rem] bg-gradient-primary font-auth-body text-base font-bold uppercase tracking-[0.14em] text-white shadow-[0_18px_34px_-18px_hsl(var(--primary)/0.78)] transition-all hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_24px_38px_-18px_hsl(var(--primary)/0.88)] sm:h-16 sm:rounded-[1.5rem] sm:text-lg sm:tracking-[0.18em]"
            >
              Đăng ký ngay
              <Zap className="!size-5 fill-current transition-transform duration-200 group-hover:scale-110" />
            </Button>

            <div className="flex flex-col items-center gap-2 border-t border-border/35 pt-6 text-center sm:pt-7">
              <p className="font-auth-body text-[0.95rem] text-foreground/80 sm:text-[1rem]">
                Đã có tài khoản?{" "}
                <Link
                  to="/signin"
                  className="font-bold text-primary transition-opacity hover:opacity-80"
                >
                  Đăng nhập
                </Link>
              </p>

            </div>
          </form>
        </div>
      </section>

      <div className="mt-6 flex items-center justify-center gap-4 text-muted-foreground/45 sm:mt-8 sm:gap-8">
        <BookOpen className="size-5 sm:size-6" />
        <NotebookText className="size-5 sm:size-6" />
        <ScrollText className="size-5 sm:size-6" />
        <LibraryBig className="size-5 sm:size-6" />
      </div>
    </>
  );
}

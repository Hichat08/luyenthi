import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";
import { forwardRef, useState } from "react";

type AuthInputFieldProps = React.ComponentProps<typeof Input> & {
  label: string;
  icon: LucideIcon;
  error?: string;
};

export const AuthInputField = forwardRef<HTMLInputElement, AuthInputFieldProps>(
  ({ label, icon: Icon, error, className, id, type, ...props }, ref) => {
    const inputId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, "-");
    const isPasswordField = type === "password";
    const [passwordVisible, setPasswordVisible] = useState(false);

    return (
      <div className="space-y-2.5">
        <Label
          htmlFor={inputId}
          className="pl-1 font-auth-body text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground/90 sm:text-[0.9rem] sm:tracking-[0.22em]"
        >
          {label}
        </Label>

        <div className="group relative">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-muted-foreground/70 transition-colors group-focus-within:text-primary sm:w-12">
            <Icon
              className="size-[18px] sm:size-5"
              strokeWidth={1.9}
            />
          </span>

          <Input
            ref={ref}
            id={inputId}
            aria-invalid={Boolean(error)}
            type={isPasswordField && passwordVisible ? "text" : type}
            className={cn(
              "h-14 rounded-[1.25rem] border border-[hsl(var(--border)/0.75)] bg-[hsl(var(--background))] pl-11 font-auth-body text-[0.95rem] shadow-[0_12px_30px_-24px_hsl(var(--primary)/0.55)] placeholder:text-muted-foreground/45 focus-visible:border-primary/70 focus-visible:ring-[4px] focus-visible:ring-primary/10 dark:bg-[hsl(var(--muted)/0.55)] sm:h-16 sm:rounded-[1.5rem] sm:pl-12 sm:text-[1rem]",
              isPasswordField ? "pr-12 sm:pr-14" : "pr-4",
              className
            )}
            {...props}
          />

          {isPasswordField ? (
            <button
              type="button"
              aria-label={passwordVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              aria-pressed={passwordVisible}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground/70 transition-colors hover:text-primary focus-visible:text-primary focus-visible:outline-none sm:w-12"
              onClick={() => setPasswordVisible((current) => !current)}
            >
              {passwordVisible ? (
                <EyeOff
                  className="size-[18px] sm:size-5"
                  strokeWidth={1.9}
                />
              ) : (
                <Eye
                  className="size-[18px] sm:size-5"
                  strokeWidth={1.9}
                />
              )}
            </button>
          ) : null}
        </div>

        {error ? (
          <p className="pl-1 text-sm font-medium text-destructive">{error}</p>
        ) : null}
      </div>
    );
  }
);

AuthInputField.displayName = "AuthInputField";

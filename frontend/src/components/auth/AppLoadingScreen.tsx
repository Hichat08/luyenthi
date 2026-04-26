import { AuthShell } from "@/components/auth/auth-shell";

type AppLoadingScreenProps = {
  message?: string;
};

export function AppLoadingScreen({
  message = "Đang tải trang...",
}: AppLoadingScreenProps) {
  return (
    <AuthShell className="max-w-[30rem]">
      <div className="auth-card">
        <div className="auth-card-topbar" />
        <div className="flex min-h-[24rem] flex-col items-center justify-center gap-4 px-6 py-10 text-center">
          <div className="flex size-20 items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_24px_60px_-32px_hsl(var(--primary)/0.4)]">
            <img
              src="/logo-lotrinh.png"
              alt="Lộ trình học tập"
              className="size-full scale-[1.35] animate-pulse object-cover object-center"
              draggable="false"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
            <span className="size-2.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
            <span className="size-2.5 animate-bounce rounded-full bg-primary" />
          </div>
          <p className="font-auth-body text-sm font-semibold tracking-[0.08em] text-foreground/72">
            {message}
          </p>
        </div>
      </div>
    </AuthShell>
  );
}

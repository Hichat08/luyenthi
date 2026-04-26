import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type AuthShellProps = {
  children: ReactNode;
  className?: string;
};

export function AuthShell({ children, className }: AuthShellProps) {
  return (
    <div className="auth-page-shell">
      <div
        aria-hidden="true"
        className="auth-page-pattern"
      />
      <div
        aria-hidden="true"
        className="auth-page-orb auth-page-orb-left"
      />
      <div
        aria-hidden="true"
        className="auth-page-orb auth-page-orb-right"
      />

      <main className="relative z-10 flex w-full items-center justify-center px-3 py-6 sm:px-6 sm:py-10">
        <div className={cn("w-full", className)}>{children}</div>
      </main>
    </div>
  );
}

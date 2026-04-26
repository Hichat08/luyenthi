import type { DailyProgress } from "@/services/rankingService";
import { CalendarDays, Goal, TimerReset } from "lucide-react";

type HomeDailyProgressCardProps = {
  clock: string;
  todayLabel: string;
  dailyProgress: DailyProgress;
};

export function HomeDailyProgressCard({
  clock,
  todayLabel,
  dailyProgress,
}: HomeDailyProgressCardProps) {
  return (
    <section className="study-dashboard-card rounded-[1.7rem] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <CalendarDays className="size-4 text-primary" />
            <span className="capitalize">{todayLabel}</span>
          </div>
          <p className="font-auth-heading text-[2.2rem] font-black leading-none tracking-[-0.05em] text-primary">
            {clock}
          </p>
          <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-muted-foreground">
            Giờ hệ thống
          </p>
        </div>

        <span className="mt-1 size-2.5 rounded-full bg-destructive shadow-[0_0_0_5px_hsl(var(--destructive)/0.14)]" />
      </div>

      <div className="mt-5 grid grid-cols-2 divide-x divide-border/80 rounded-[1.2rem] border border-border/70 bg-muted/30">
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            <TimerReset className="size-3.5 text-primary" />
            Còn lại
          </div>
          <p className="mt-2 text-lg font-black text-foreground">{dailyProgress.remainingExams} đề</p>
        </div>
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            <Goal className="size-3.5 text-primary" />
            Mục tiêu
          </div>
          <p className="mt-2 text-lg font-black text-foreground">{dailyProgress.dailyTarget} đề</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-foreground">Tiến độ ngày</span>
          <span className="text-sm font-black text-primary">{dailyProgress.progressPercentage}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-primary/10">
          <div
            className="h-full rounded-full bg-gradient-primary"
            style={{ width: `${dailyProgress.progressPercentage}%` }}
          />
        </div>
      </div>
    </section>
  );
}

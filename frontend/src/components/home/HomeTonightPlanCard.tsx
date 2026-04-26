type SessionPresentation = {
  eyebrow: string;
  title: string;
  description: string;
  badge: string;
  badgeClassName: string;
  panelClassName: string;
};

type HomeTonightPlanCardProps = {
  clock: string;
  sessionPresentation: SessionPresentation;
};

export function HomeTonightPlanCard({
  clock,
  sessionPresentation,
}: HomeTonightPlanCardProps) {
  return (
    <section className="study-dashboard-card rounded-[1.7rem] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-primary/70">
            Lộ trình học theo thời gian thực
          </p>
          <h2 className="mt-2 font-auth-heading text-[1.55rem] font-black leading-tight tracking-[-0.04em] text-foreground">
            Kế hoạch tối nay
          </h2>
        </div>
      </div>

      <div
        className={`mt-6 overflow-hidden rounded-[1.45rem] border p-4 shadow-[0_22px_46px_-34px_hsl(var(--foreground)/0.22)] ${sessionPresentation.panelClassName}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-primary/72">
              {sessionPresentation.eyebrow}
            </p>
            <h3 className="mt-2 max-w-[14rem] font-auth-heading text-[1.28rem] font-black leading-tight tracking-[-0.04em] text-foreground">
              {sessionPresentation.title}
            </h3>
            <p className="mt-3 max-w-[16rem] text-sm leading-6 text-muted-foreground">
              {sessionPresentation.description}
            </p>
          </div>

          <div className="shrink-0 rounded-[1.1rem] border border-white/45 bg-white/75 px-3 py-2 text-right shadow-[0_16px_28px_-24px_rgba(15,23,42,0.18)] backdrop-blur">
            <div className="flex items-center justify-end gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-[0.14em] ${sessionPresentation.badgeClassName}`}
              >
                {sessionPresentation.badge}
              </span>
            </div>
            <p className="mt-2 font-auth-heading text-[1.2rem] font-black tracking-[-0.04em] text-foreground">
              {clock}
            </p>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Realtime
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

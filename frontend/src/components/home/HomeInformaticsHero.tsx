import { Sparkles } from "lucide-react";

type HomeInformaticsHeroProps = {
  highlightTitle: string;
  highlightDescription: string;
  onOpen: () => void;
};

export function HomeInformaticsHero({
  highlightTitle,
  highlightDescription,
  onOpen,
}: HomeInformaticsHeroProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="study-dashboard-hero-visual rounded-[1.7rem] p-3 text-left transition hover:scale-[1.01]"
    >
      <div className="study-dashboard-hero-panel rounded-[1.45rem] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-primary-foreground/70">
              Môn mới cập nhật
            </p>
            <h2 className="mt-2 max-w-[13rem] font-auth-heading text-[1.35rem] font-black leading-tight text-white">
              Tin học: luyện đề theo chuyên đề
            </h2>
            <p className="mt-3 max-w-[15rem] text-sm leading-6 text-white/78">
              Ngân hàng câu hỏi môn Tin đã được cập nhật. Vào thẳng để chọn chuyên đề, số câu và
              bắt đầu làm đề ngay.
            </p>
          </div>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-white">
            Vào ngay
          </span>
        </div>

        <div className="mt-6 rounded-[1.2rem] border border-white/10 bg-white/8 p-4 text-white/92">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-primary-glow">
              <Sparkles className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/68">
                {highlightTitle}
              </p>
              <p className="mt-1 text-sm leading-6 text-white/78">{highlightDescription}</p>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

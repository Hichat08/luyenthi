import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const DOT_COLORS = ["#ff5a1f", "#ffb11c", "#2583eb", "#1d8b41"];
const TRAVEL_PATTERN = [0, 1, 2, 3, 2, 1];

type LoaderMode = "compact" | "reactions";
type LabelPlacement = "inline" | "below";

type PingPongDotsLoaderProps = {
  className?: string;
  dotClassName?: string;
  label?: string;
  labelClassName?: string;
  mode?: LoaderMode;
  labelPlacement?: LabelPlacement;
};

type FaceConfig = {
  color: string;
  mouth: "sad" | "flat" | "smile" | "wink";
};

const FACE_CONFIGS: FaceConfig[] = [
  { color: "#ff4b12", mouth: "sad" },
  { color: "#ffb11c", mouth: "flat" },
  { color: "#2583eb", mouth: "smile" },
  { color: "#1f8a3b", mouth: "wink" },
];

function Face({
  color,
  mouth,
  index,
  activeIndex,
}: FaceConfig & {
  index: number;
  activeIndex: number;
}) {
  const isActive = index === activeIndex;
  const distance = Math.abs(index - activeIndex);

  return (
    <span
      className={cn(
        "relative flex size-[4.5rem] items-center justify-center rounded-full transition-transform duration-300 ease-out sm:size-[5rem]",
        isActive && "-translate-y-3",
        !isActive && distance === 1 && "translate-y-0.5",
        !isActive && distance > 1 && "translate-y-1"
      )}
      style={{ backgroundColor: color }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          boxShadow: "inset 0 10px 18px rgba(255,255,255,0.12)",
        }}
      />

      <span className="absolute left-1/2 top-[38%] flex w-8 -translate-x-1/2 items-center justify-between sm:w-9">
        <span className="size-2.5 rounded-full bg-[#34130d]" />
        {mouth === "wink" ? (
          <span className="mt-0.5 h-1 w-3 rounded-full bg-[#34130d]" />
        ) : (
          <span className="size-2.5 rounded-full bg-[#34130d]" />
        )}
      </span>

      {mouth === "sad" ? (
        <span className="absolute left-1/2 top-[58%] h-3.5 w-5 -translate-x-1/2 rounded-full border-[3px] border-b-0 border-[#34130d]" />
      ) : null}

      {mouth === "flat" ? (
        <span className="absolute left-1/2 top-[61%] h-1.5 w-5 -translate-x-1/2 rounded-full bg-[#34130d]" />
      ) : null}

      {mouth === "smile" ? (
        <span className="absolute left-1/2 top-[55%] h-3.5 w-5 -translate-x-1/2 rounded-full border-[3px] border-t-0 border-[#34130d]" />
      ) : null}

      {mouth === "wink" ? (
        <span className="absolute left-1/2 top-[55%] h-4 w-5 -translate-x-1/2 overflow-hidden rounded-full bg-[#34130d]">
          <span className="absolute bottom-0 left-1/2 h-2.5 w-3.5 -translate-x-1/2 rounded-t-full bg-[#ff7a22]" />
        </span>
      ) : null}
    </span>
  );
}

const PingPongDotsLoader = ({
  className,
  dotClassName,
  label,
  labelClassName,
  mode = "compact",
  labelPlacement = "inline",
}: PingPongDotsLoaderProps) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStep((current) => (current + 1) % TRAVEL_PATTERN.length);
    }, mode === "reactions" ? 320 : 170);

    return () => window.clearInterval(timer);
  }, [mode]);

  const activeIndex = TRAVEL_PATTERN[step];
  const isStacked = labelPlacement === "below";

  if (mode === "reactions") {
    return (
      <span
        role="status"
        aria-label={label ?? "Đang tải"}
        className={cn(
          "inline-flex items-center justify-center",
          isStacked ? "flex-col gap-6" : "gap-4",
          className
        )}
      >
        <span
          aria-hidden="true"
          className="inline-flex items-end justify-center gap-3 sm:gap-5"
        >
          {FACE_CONFIGS.map((face, index) => (
            <Face
              key={face.color}
              {...face}
              index={index}
              activeIndex={activeIndex}
            />
          ))}
        </span>

        {label ? (
          <span
            className={cn(
              "text-base font-semibold tracking-[0.12em] text-slate-600",
              labelClassName
            )}
          >
            {label}
          </span>
        ) : null}
      </span>
    );
  }

  return (
    <span
      role="status"
      aria-label={label ?? "Đang tải"}
      className={cn(
        "inline-flex items-center",
        isStacked ? "flex-col gap-2" : "gap-2.5",
        className
      )}
    >
      <span
        aria-hidden="true"
        className="inline-flex items-center gap-1.5"
      >
        {DOT_COLORS.map((color, index) => {
          const distance = Math.abs(index - activeIndex);

          return (
            <span
              key={color}
              className={cn(
                "size-2.5 rounded-full transition-all duration-200 ease-out",
                distance === 0 && "-translate-y-0.5 scale-125 opacity-100",
                distance === 1 && "scale-105 opacity-80",
                distance > 1 && "scale-90 opacity-45",
                dotClassName
              )}
              style={{ backgroundColor: color }}
            />
          );
        })}
      </span>

      {label ? (
        <span className={cn("text-sm font-semibold", labelClassName)}>
          {label}
        </span>
      ) : null}
    </span>
  );
};

export default PingPongDotsLoader;

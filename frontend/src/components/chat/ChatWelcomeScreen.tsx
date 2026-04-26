import { BookOpenText, MessageCircleMore, Sparkles, Users } from "lucide-react";
import { Link } from "react-router";

const quickLinks = [
  {
    to: "/chat",
    icon: MessageCircleMore,
    title: "Mở phòng chat",
    description: "Tiếp tục trao đổi bài vở và theo dõi cuộc trò chuyện gần đây.",
  },
  {
    to: "/practice",
    icon: BookOpenText,
    title: "Vào luyện tập",
    description: "Ôn lại kiến thức theo môn học với lộ trình đang có.",
  },
];

const highlights = [
  {
    icon: Sparkles,
    label: "Lộ trình rõ ràng",
    detail: "Theo dõi tiến độ học từng bước thay vì học rời rạc.",
  },
  {
    icon: Users,
    label: "Trao đổi nhanh",
    detail: "Kết nối bạn học và cộng đồng ngay trong cùng một không gian.",
  },
];

const ChatWelcomeScreen = () => {
  return (
    <main className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.16),_transparent_32%),linear-gradient(180deg,_hsl(var(--background)),_hsl(var(--muted)/0.45))]">
      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-5 py-8 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:items-center">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/80 px-3.5 py-1.5 text-xs font-semibold text-primary shadow-sm backdrop-blur sm:text-sm">
              <Sparkles className="size-4" />
              Lộ trình học tập
            </div>

            <div className="space-y-3">
              <h1 className="max-w-3xl text-3xl font-black tracking-[-0.04em] text-foreground sm:text-[2.65rem]">
                Tập trung vào học tập, trao đổi nhanh, và giữ tiến độ mỗi ngày.
              </h1>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                Chọn một khu vực để tiếp tục. Bạn có thể vào phòng chat cộng đồng,
                mở cuộc trò chuyện gần nhất hoặc chuyển sang phần luyện tập.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row">
              {quickLinks.map(({ to, icon: Icon, title, description }) => (
                <Link
                  key={to}
                  to={to}
                  className="group flex min-h-24 flex-1 items-start gap-3 rounded-[1.15rem] border border-border/70 bg-background/88 p-4 shadow-[0_20px_60px_-42px_hsl(var(--foreground)/0.35)] transition-transform duration-200 hover:-translate-y-0.5 hover:border-primary/30"
                >
                  <div className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-[1rem] bg-primary/10 text-primary">
                    <Icon className="size-4.5" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-[0.95rem] font-bold text-foreground">{title}</h2>
                    <p className="text-[0.82rem] leading-5 text-muted-foreground sm:text-sm">
                      {description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            {highlights.map(({ icon: Icon, label, detail }) => (
              <div
                key={label}
                className="rounded-[1.15rem] border border-border/70 bg-background/88 p-4 shadow-[0_20px_60px_-42px_hsl(var(--foreground)/0.35)] backdrop-blur"
              >
                <div className="mb-2.5 inline-flex size-10 items-center justify-center rounded-[1rem] bg-primary/10 text-primary">
                  <Icon className="size-4.5" />
                </div>
                <h3 className="text-base font-bold text-foreground">{label}</h3>
                <p className="mt-1.5 text-[0.82rem] leading-5 text-muted-foreground sm:text-sm">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default ChatWelcomeScreen;

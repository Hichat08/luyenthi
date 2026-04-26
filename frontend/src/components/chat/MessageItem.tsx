import { cn, formatMessageTime } from "@/lib/utils";
import type { Conversation, Message, Participant } from "@/types/chat";
import UserAvatar from "./UserAvatar";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  parseCommunityExamMessage,
  parseCommunityExamResultMessage,
} from "./community-exam-message";
import { Button } from "../ui/button";
import { examService } from "@/services/examService";
import { useNavigate } from "react-router";
import { useState } from "react";
import { BookOpen, Clock3, ListOrdered, Target, Trophy } from "lucide-react";
import { toast } from "sonner";

interface MessageItemProps {
  message: Message;
  index: number;
  messages: Message[];
  selectedConvo: Conversation;
  lastMessageStatus: "delivered" | "seen";
}

const MessageItem = ({
  message,
  index,
  messages,
  selectedConvo,
  lastMessageStatus,
}: MessageItemProps) => {
  const prev = index + 1 < messages.length ? messages[index + 1] : undefined;

  const isShowTime =
    index === 0 ||
    new Date(message.createdAt).getTime() -
      new Date(prev?.createdAt || 0).getTime() >
      300000; // 5 phút

  const isGroupBreak = isShowTime || message.senderId !== prev?.senderId;

  const participant = selectedConvo.participants.find(
    (p: Participant) => p._id.toString() === message.senderId.toString()
  );
  const author = message.sender ?? participant ?? null;
  const communityExam = parseCommunityExamMessage(message.content);
  const communityExamResult = parseCommunityExamResultMessage(message.content);
  const classroomLabel =
    author?.classroom?.trim() ? `Lớp ${author.classroom.trim()}` : null;
  const navigate = useNavigate();
  const [openingExam, setOpeningExam] = useState(false);

  const handleOpenCommunityExam = async () => {
    if (!communityExam) {
      return;
    }

    try {
      setOpeningExam(true);
      const exams = await examService.getExams({ subjectSlug: communityExam.subjectSlug });
      const firstExam = exams.find((item) => item.examType === "multiple_choice");

      if (!firstExam) {
        throw new Error("Không tìm thấy đề phù hợp.");
      }

      const examDetail = await examService.getExamDetail(firstExam.examId);

      navigate(`/practice/${communityExam.subjectSlug}/exam/${firstExam.examId}`, {
        state: {
          selectedTopicLabels: communityExam.selectedTopicLabels,
          questionLimit: communityExam.questionLimit,
          durationMinutes: communityExam.durationMinutes,
          autoStart: true,
          launchSource: "community",
          initialExamDetail: examDetail,
        },
      });
    } catch (error) {
      console.error("Lỗi khi mở đề cộng đồng", error);
      toast.error("Không thể mở đề cộng đồng.");
    } finally {
      setOpeningExam(false);
    }
  };

  return (
    <>
      {/* time */}
      {isShowTime && (
        <span className="flex justify-center text-xs text-muted-foreground px-1">
          {formatMessageTime(new Date(message.createdAt))}
        </span>
      )}

      <div
        className={cn(
          "flex gap-2 message-bounce mt-1",
          message.isOwn ? "justify-end" : "justify-start"
        )}
      >
        {/* avatar */}
        {!message.isOwn && (
          <div className="w-8">
            {isGroupBreak && (
              <UserAvatar
                type="chat"
                name={author?.displayName ?? "Lộ trình học tập"}
                avatarUrl={author?.avatarUrl ?? undefined}
              />
            )}
          </div>
        )}

        {/* tin nhắn */}
        <div
          className={cn(
            "max-w-xs lg:max-w-md space-y-1 flex flex-col",
            message.isOwn ? "items-end" : "items-start"
          )}
        >
          {!message.isOwn && isGroupBreak && author?.displayName ? (
            <p className="px-1 text-sm font-semibold text-primary">
              {author.displayName}
            </p>
          ) : null}
          {communityExam ? (
            <Card
              className={cn(
                "w-full max-w-sm border p-4 shadow-[0_18px_40px_-30px_hsl(var(--foreground)/0.35)]",
                message.isOwn
                  ? "border-primary/20 bg-[linear-gradient(180deg,hsl(var(--primary)/0.12)_0%,hsl(var(--background))_100%)]"
                  : "border-primary/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,hsl(var(--primary)/0.08)_100%)]"
              )}
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                    <BookOpen className="size-5" />
                  </span>
                  <div>
                    <p className="text-[0.72rem] font-black uppercase tracking-[0.14em] text-primary/75">
                      Đề cộng đồng
                    </p>
                    <h3 className="mt-1 font-auth-heading text-[1rem] font-black tracking-[-0.04em] text-foreground">
                      {communityExam.subjectName}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-foreground/80">
                      Bộ đề do thành viên cộng đồng chia sẻ để cùng luyện ngay trong phòng chat.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-muted-foreground">
                  <div className="flex items-center gap-2 rounded-xl bg-background/70 px-3 py-2">
                    <ListOrdered className="size-4 text-primary" />
                    <span>{communityExam.questionLimit} câu</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-background/70 px-3 py-2">
                    <Clock3 className="size-4 text-primary" />
                    <span>{communityExam.durationMinutes} phút</span>
                  </div>
                </div>

                <p className="text-xs leading-5 text-muted-foreground">
                  {communityExam.selectedTopicLabels.length} chuyên đề được chọn
                </p>

                <Button
                  type="button"
                  onClick={() => void handleOpenCommunityExam()}
                  disabled={openingExam}
                  className="w-full rounded-xl"
                >
                  {openingExam ? "Đang mở đề..." : "Làm đề này"}
                </Button>
              </div>
            </Card>
          ) : communityExamResult ? (
            <Card
              className={cn(
                "w-full max-w-sm overflow-hidden border p-0 shadow-[0_18px_40px_-30px_hsl(var(--foreground)/0.35)]",
                message.isOwn
                  ? "border-primary/20 bg-[linear-gradient(180deg,hsl(var(--primary)/0.12)_0%,hsl(var(--background))_100%)]"
                  : "border-amber-200/80 bg-[linear-gradient(180deg,rgba(255,248,229,0.95)_0%,hsl(var(--background))_100%)]"
              )}
            >
              <div className="border-b border-black/5 px-4 py-3">
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-2xl shadow-sm",
                      message.isOwn
                        ? "bg-primary text-primary-foreground"
                        : "bg-amber-400 text-amber-950"
                    )}
                  >
                    <Trophy className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.7rem] font-black uppercase tracking-[0.16em] text-primary/70">
                      Kết quả luyện đề
                    </p>
                    <h3 className="mt-1 max-h-12 overflow-hidden text-[0.98rem] font-black leading-6 tracking-[-0.03em] text-foreground">
                      {communityExamResult.examTitle}
                    </h3>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">
                      {communityExamResult.displayName} đã hoàn thành bài luyện và chia sẻ kết quả trong phòng chat.
                    </p>
                    {classroomLabel ? (
                      <p className="mt-2 inline-flex rounded-full bg-primary/8 px-2.5 py-1 text-[0.72rem] font-bold text-primary">
                        {classroomLabel}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 px-4 py-3">
                <div className="rounded-2xl bg-background/80 px-3 py-2 text-center">
                  <p className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-muted-foreground">
                    Điểm
                  </p>
                  <p className="mt-1 text-base font-black text-primary">
                    {communityExamResult.score}/10
                  </p>
                </div>
                <div className="rounded-2xl bg-background/80 px-3 py-2 text-center">
                  <p className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-muted-foreground">
                    Chính xác
                  </p>
                  <p className="mt-1 text-base font-black text-foreground">
                    {communityExamResult.correctCount}/{communityExamResult.totalQuestions}
                  </p>
                </div>
                <div className="rounded-2xl bg-background/80 px-3 py-2 text-center">
                  <p className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-muted-foreground">
                    Thời gian
                  </p>
                  <p className="mt-1 text-base font-black text-foreground">
                    {communityExamResult.durationLabel}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-black/5 px-4 py-3 text-xs font-semibold text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Target className="size-3.5 text-primary" />
                  {communityExamResult.totalQuestions > 0
                    ? `${Math.round(
                        (communityExamResult.correctCount /
                          communityExamResult.totalQuestions) *
                          100
                      )}% câu đúng`
                    : "Chưa có dữ liệu"}
                </span>
                <span className="font-black text-primary/80">Thành tích mới</span>
              </div>
            </Card>
          ) : (
            <Card
              className={cn(
                "p-3",
                message.isOwn ? "chat-bubble-sent border-0" : "chat-bubble-received"
              )}
            >
              <p className="text-sm leading-relaxed break-words">{message.content}</p>
            </Card>
          )}

          {/* seen/ delivered */}
          {message.isOwn && message._id === selectedConvo.lastMessage?._id && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs px-1.5 py-0.5 h-4 border-0",
                lastMessageStatus === "seen"
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {lastMessageStatus === "seen" ? "Đã xem" : "Đã gửi"}
            </Badge>
          )}
        </div>
      </div>
    </>
  );
};

export default MessageItem;

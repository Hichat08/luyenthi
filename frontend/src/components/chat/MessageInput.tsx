import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation } from "@/types/chat";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Plus, Send } from "lucide-react";
import { Input } from "../ui/input";
import EmojiPicker from "./EmojiPicker";
import { useChatStore } from "@/stores/useChatStore";
import { toast } from "sonner";
import { examService } from "@/services/examService";
import type { PracticeExamDetail } from "@/types/exam";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  buildCommunityExamMessage,
} from "./community-exam-message";

const MessageInput = ({ selectedConvo }: { selectedConvo: Conversation }) => {
  const { user } = useAuthStore();
  const { sendCommunityMessage, sendDirectMessage, sendGroupMessage } = useChatStore();
  const [value, setValue] = useState("");
  const [createExamOpen, setCreateExamOpen] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [sendingExam, setSendingExam] = useState(false);
  const [informaticsTemplate, setInformaticsTemplate] = useState<PracticeExamDetail | null>(null);
  const [selectedTopicLabels, setSelectedTopicLabels] = useState<string[]>([]);
  const [questionLimitInput, setQuestionLimitInput] = useState("40");
  const [durationMinutesInput, setDurationMinutesInput] = useState("50");

  if (!user) return;

  const topicOptions = useMemo(() => {
    if (!informaticsTemplate) {
      return [];
    }

    return Array.from(
      new Set(
        informaticsTemplate.questions
          .map((question) => question.topicLabel?.trim())
          .filter((label): label is string => Boolean(label))
      )
    );
  }, [informaticsTemplate]);

  const availableTopicQuestionCount = useMemo(() => {
    if (!informaticsTemplate || selectedTopicLabels.length === 0) {
      return 0;
    }

    const selectedSet = new Set(selectedTopicLabels);
    return informaticsTemplate.questions.filter((question) =>
      selectedSet.has(question.topicLabel?.trim() || "")
    ).length;
  }, [informaticsTemplate, selectedTopicLabels]);

  useEffect(() => {
    if (!createExamOpen || selectedConvo.type !== "community" || informaticsTemplate) {
      return;
    }

    let cancelled = false;

    const fetchInformaticsTemplate = async () => {
      try {
        setLoadingTemplate(true);
        const exams = await examService.getExams({ subjectSlug: "tin-hoc" });
        const firstExam = exams.find((item) => item.examType === "multiple_choice");

        if (!firstExam) {
          throw new Error("Không tìm thấy đề môn Tin học.");
        }

        const examDetail = await examService.getExamDetail(firstExam.examId);

        if (cancelled) {
          return;
        }

        const topics = Array.from(
          new Set(
            examDetail.questions
              .map((question) => question.topicLabel?.trim())
              .filter((label): label is string => Boolean(label))
          )
        );

        setInformaticsTemplate(examDetail);
        setSelectedTopicLabels(topics);
        setQuestionLimitInput(`${Math.min(40, examDetail.questions.length)}`);
        setDurationMinutesInput("50");
      } catch (error) {
        if (!cancelled) {
          console.error("Lỗi khi tải cấu hình đề cộng đồng", error);
          toast.error("Không thể tải cấu hình đề cộng đồng.");
          setCreateExamOpen(false);
        }
      } finally {
        if (!cancelled) {
          setLoadingTemplate(false);
        }
      }
    };

    void fetchInformaticsTemplate();

    return () => {
      cancelled = true;
    };
  }, [createExamOpen, informaticsTemplate, selectedConvo.type]);

  const sendMessage = async () => {
    if (!value.trim()) return;
    const currValue = value;
    setValue("");

    try {
      if (selectedConvo.type === "community") {
        await sendCommunityMessage(currValue);
      } else if (selectedConvo.type === "direct") {
        const participants = selectedConvo.participants;
        const otherUser = participants.filter((p) => p._id !== user._id)[0];
        await sendDirectMessage(otherUser._id, currValue);
      } else {
        await sendGroupMessage(selectedConvo._id, currValue);
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi xảy ra khi gửi tin nhắn. Bạn hãy thử lại!");
    }
  };

  const handleToggleTopic = (topicLabel: string) => {
    setSelectedTopicLabels((current) =>
      current.includes(topicLabel)
        ? current.filter((item) => item !== topicLabel)
        : [...current, topicLabel]
    );
  };

  const handleToggleAllTopics = () => {
    setSelectedTopicLabels((current) =>
      current.length === topicOptions.length ? [] : [...topicOptions]
    );
  };

  const handleOpenPlusAction = () => {
    if (selectedConvo.type !== "community") {
      toast.info("Tạo đề cộng đồng hiện chỉ áp dụng trong Community Live.");
      return;
    }

    setCreateExamOpen(true);
  };

  const handleSendCommunityExam = async () => {
    if (!informaticsTemplate) {
      return;
    }

    if (selectedTopicLabels.length === 0) {
      toast.error("Hãy chọn ít nhất một chuyên đề.");
      return;
    }

    const questionLimit = Math.min(
      Math.max(Number(questionLimitInput) || 1, 1),
      availableTopicQuestionCount
    );
    const durationMinutes = Math.min(
      Math.max(Number(durationMinutesInput) || 1, 1),
      180
    );

    try {
      setSendingExam(true);
      await sendCommunityMessage(
        buildCommunityExamMessage({
          subjectSlug: informaticsTemplate.subjectSlug,
          subjectName: informaticsTemplate.subject,
          questionLimit,
          durationMinutes,
          selectedTopicLabels,
        })
      );
      setCreateExamOpen(false);
      toast.success("Đã gửi đề cộng đồng.");
    } catch (error) {
      console.error(error);
      toast.error("Không thể gửi đề cộng đồng.");
    } finally {
      setSendingExam(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 min-h-[56px] bg-background">
      <Button
        variant="ghost"
        size="icon"
        className="hover:bg-primary/10 transition-smooth"
        onClick={handleOpenPlusAction}
      >
        <Plus className="size-4" />
      </Button>

      <div className="flex-1 relative">
        <Input
          onKeyPress={handleKeyPress}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={
            selectedConvo.type === "community"
              ? "Nhập tin nhắn học tập..."
              : "Soạn tin nhắn..."
          }
          className="pr-20 h-9 bg-white border-border/50 focus:border-primary/50 transition-smooth resize-none"
        ></Input>
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="size-8 hover:bg-primary/10 transition-smooth"
          >
            <div>
              <EmojiPicker
                onChange={(emoji: string) => setValue(`${value}${emoji}`)}
              />
            </div>
          </Button>
        </div>
      </div>

      <Button
        onClick={sendMessage}
        className="bg-gradient-chat hover:shadow-glow transition-smooth hover:scale-105"
        disabled={!value.trim()}
      >
        <Send className="size-4 text-white" />
      </Button>

      <Dialog
        open={createExamOpen}
        onOpenChange={setCreateExamOpen}
      >
        <DialogContent className="max-h-[85vh] overflow-hidden rounded-[1.4rem] p-0 sm:max-w-xl">
          <div className="beautiful-scrollbar max-h-[85vh] overflow-y-auto p-5">
            <DialogHeader>
              <DialogTitle className="font-auth-heading text-[1.3rem] font-black tracking-[-0.04em] text-foreground">
                Tạo đề cho cộng đồng
              </DialogTitle>
              <DialogDescription>
                Tạo nhanh đề Tin học để chia sẻ trong Community Live. Mặc định 40 câu và 50 phút.
              </DialogDescription>
            </DialogHeader>

            {loadingTemplate ? (
              <div className="py-8 text-center text-sm font-semibold text-muted-foreground">
                Đang tải ngân hàng câu hỏi...
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="flex items-start justify-between gap-3 rounded-[1.1rem] border border-primary/15 bg-primary/5 px-4 py-3">
                  <div>
                    <p className="text-[0.72rem] font-black uppercase tracking-[0.16em] text-primary/70">
                      Môn học
                    </p>
                    <p className="mt-1 font-auth-heading text-[1.1rem] font-black tracking-[-0.04em] text-foreground">
                      {informaticsTemplate?.subject ?? "Tin học"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleAllTopics}
                    className="rounded-full border border-primary/20 bg-white px-3 py-1.5 text-[0.76rem] font-bold text-primary"
                  >
                    {selectedTopicLabels.length === topicOptions.length
                      ? "Bỏ chọn tất cả"
                      : "Chọn tất cả"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-foreground">
                      Số câu
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={Math.max(1, availableTopicQuestionCount)}
                      value={questionLimitInput}
                      onChange={(event) => setQuestionLimitInput(event.target.value)}
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-foreground">
                      Thời gian
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={180}
                      value={durationMinutesInput}
                      onChange={(event) => setDurationMinutesInput(event.target.value)}
                      className="h-11 rounded-xl"
                    />
                  </div>
                </div>

                <div className="rounded-[1.1rem] border border-border/70 bg-card p-3">
                  <p className="mb-3 text-sm font-bold text-foreground">
                    Chuyên đề
                  </p>
                  <div className="beautiful-scrollbar max-h-64 space-y-2 overflow-y-auto pr-1">
                    {topicOptions.map((topicLabel) => {
                      const checked = selectedTopicLabels.includes(topicLabel);

                      return (
                        <label
                          key={topicLabel}
                          className={checked
                            ? "flex cursor-pointer items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2"
                            : "flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 px-3 py-2"}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleTopic(topicLabel)}
                            className="mt-1 size-4 accent-[hsl(var(--primary))]"
                          />
                          <span className="text-sm leading-6 text-foreground">
                            {topicLabel}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="mt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateExamOpen(false)}
                className="rounded-xl"
              >
                Hủy
              </Button>
              <Button
                type="button"
                onClick={handleSendCommunityExam}
                disabled={
                  loadingTemplate ||
                  sendingExam ||
                  !informaticsTemplate ||
                  selectedTopicLabels.length === 0
                }
                className="rounded-xl"
              >
                {sendingExam ? "Đang gửi..." : "Gửi đề vào cộng đồng"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MessageInput;

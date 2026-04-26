import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";

type ExamSubmitConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  completedCount: number;
  totalCount: number;
  unitLabel: string;
  remainingLabel: string;
  isSubmitting?: boolean;
  onConfirm: () => void | Promise<void>;
};

const ExamSubmitConfirmDialog = ({
  open,
  onOpenChange,
  completedCount,
  totalCount,
  unitLabel,
  remainingLabel,
  isSubmitting = false,
  onConfirm,
}: ExamSubmitConfirmDialogProps) => {
  const remainingCount = Math.max(totalCount - completedCount, 0);
  const hasIncompleteItems = remainingCount > 0;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isSubmitting && onOpenChange(nextOpen)}>
      <DialogContent
        showCloseButton={false}
        aria-describedby="exam-submit-confirm-description"
        className="max-w-[24rem] overflow-hidden rounded-[1.6rem] border border-primary/10 p-0 shadow-[0_24px_52px_-30px_rgba(25,27,36,0.3)]"
      >
        <div className="border-b border-border/60 px-5 pb-6 pt-6 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-[1rem] bg-[#feb3001f] text-[#f4a300]">
            <svg
              viewBox="0 0 64 64"
              aria-hidden="true"
              className="size-9"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M27.6699 10.5C29.5944 7.16667 34.4056 7.16667 36.3301 10.5L54.5167 42C56.4412 45.3333 54.0356 49.5 50.1865 49.5H13.8135C9.96436 49.5 7.55876 45.3333 9.48334 42L27.6699 10.5Z"
                fill="#F6A800"
              />
              <path
                d="M32 22V32.5"
                stroke="white"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
              <circle cx="32" cy="39.5" r="2.8" fill="white" />
            </svg>
          </div>
          <DialogTitle className="font-auth-heading text-[1.8rem] font-black tracking-[-0.05em] text-foreground">
            Xác nhận nộp bài
          </DialogTitle>
          <DialogDescription
            id="exam-submit-confirm-description"
            className="mt-2.5 text-[1.05rem] leading-7 text-foreground"
          >
            Bạn đã hoàn thành{" "}
            <span className="font-black text-primary">
              {completedCount}/{totalCount}
            </span>{" "}
            {unitLabel}.
          </DialogDescription>
        </div>

        <div className="bg-muted/20 px-5 py-5">
          <div
            className={`rounded-[0.95rem] border px-4 py-4 ${
              hasIncompleteItems
                ? "border-destructive/20 bg-rose-50/55"
                : "border-emerald-200/70 bg-emerald-50/70"
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${
                  hasIncompleteItems
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-emerald-500 text-white"
                }`}
              >
                <AlertCircle className="size-4" />
              </span>

              <p className="text-[0.95rem] font-medium leading-8 text-foreground">
                {hasIncompleteItems ? (
                  <>
                    Bạn vẫn còn{" "}
                    <span className="font-black text-destructive">{remainingCount}</span>{" "}
                    {remainingLabel}. Bạn có chắc chắn muốn nộp bài không?
                  </>
                ) : (
                  <>Bạn đã hoàn thành toàn bộ bài làm. Xác nhận nộp bài ngay bây giờ?</>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 px-5 pb-5 pt-5">
          <Button
            type="button"
            onClick={() => void onConfirm()}
            disabled={isSubmitting}
            className="h-13 w-full rounded-[0.95rem] text-lg font-black shadow-[0_14px_26px_-20px_hsl(var(--primary)/0.58)]"
          >
            {isSubmitting ? "Đang nộp bài..." : "Nộp bài ngay"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="h-13 w-full rounded-[0.95rem] border-2 border-primary/20 bg-background text-lg font-black text-primary hover:bg-primary/5 hover:text-primary"
          >
            Tiếp tục làm bài
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExamSubmitConfirmDialog;

import { Fragment } from "react";

type RichQuestionContentProps = {
  content: string;
  className?: string;
};

export const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const renderTextWithBreaks = (text: string, keyPrefix: string) => {
  const normalized = decodeHtmlEntities(text).replace(/<br\s*\/?>/gi, "\n");
  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {lines.map((line, index) => (
        <p key={`${keyPrefix}-${index}`}>{line}</p>
      ))}
    </div>
  );
};

const RichQuestionContent = ({ content, className }: RichQuestionContentProps) => {
  const blocks: Array<{ type: "text" | "code"; value: string }> = [];
  const codeBlockRegex = /<pre>\s*<code>([\s\S]*?)<\/code>\s*<\/pre>/gi;

  let lastIndex = 0;
  let match: RegExpExecArray | null = null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const before = content.slice(lastIndex, match.index);
    if (before.trim()) {
      blocks.push({ type: "text", value: before });
    }

    blocks.push({ type: "code", value: match[1] });
    lastIndex = match.index + match[0].length;
  }

  const after = content.slice(lastIndex);
  if (after.trim()) {
    blocks.push({ type: "text", value: after });
  }

  if (blocks.length === 0) {
    return <div className={className}>{renderTextWithBreaks(content, "plain")}</div>;
  }

  return (
    <div className={className}>
      {blocks.map((block, index) => (
        <Fragment key={`${block.type}-${index}`}>
          {block.type === "text" ? (
            renderTextWithBreaks(block.value, `text-${index}`)
          ) : (
            <pre className="overflow-x-auto rounded-[1rem] border border-primary/12 bg-slate-950 px-4 py-3 text-sm leading-7 text-slate-100 shadow-[0_16px_32px_-28px_rgba(15,23,42,0.8)]">
              <code>{decodeHtmlEntities(block.value).replace(/<br\s*\/?>/gi, "\n").trim()}</code>
            </pre>
          )}
        </Fragment>
      ))}
    </div>
  );
};

export default RichQuestionContent;

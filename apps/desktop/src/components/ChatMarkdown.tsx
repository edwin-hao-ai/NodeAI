import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMarkdownProps {
  text: string;
}

export function ChatMarkdown({ text }: ChatMarkdownProps) {
  return (
    <div className="chat-md">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
}

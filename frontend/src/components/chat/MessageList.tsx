import { useRef, useEffect } from "react";
import FileMessage from "../FileMessage";

export default function MessageList({
  messages,
  user,
  isGroup,
  onRightClick,
  hasMore,
  loadMoreMessages,
  loadingMore,
}: {
  messages: any[];
  user: any;
  isGroup: boolean;
  onRightClick: (e: React.MouseEvent, msgId: string, isMine: boolean) => void;
  hasMore: boolean;
  loadMoreMessages: () => void;
  loadingMore: boolean;
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeight = useRef<number>(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length === 0 || messages[messages.length - 1]?._id]);

  useEffect(() => {
    if (containerRef.current && prevScrollHeight.current) {
      const newScrollHeight = containerRef.current.scrollHeight;
      containerRef.current.scrollTop = newScrollHeight - prevScrollHeight.current;
      prevScrollHeight.current = 0;
    }
  }, [messages]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    if (containerRef.current.scrollTop === 0 && hasMore && !loadingMore) {
      prevScrollHeight.current = containerRef.current.scrollHeight;
      loadMoreMessages();
    }
  };

  // ✅ Helper to get reply preview text
  const getReplyPreview = (replyTo: any) => {
    if (!replyTo) return null;
    if (replyTo.fileType === "image") return "📷 Photo";
    if (replyTo.fileType === "pdf") return "📄 PDF";
    if (replyTo.fileType === "word") return "📝 Document";
    if (replyTo.text) return replyTo.text.length > 60
      ? replyTo.text.slice(0, 60) + "..."
      : replyTo.text;
    return "📎 File";
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-3 md:p-4"
    >
      {loadingMore && (
        <p className="text-center text-[#8696a0] text-xs py-2">
          Loading older messages...
        </p>
      )}

      {!hasMore && messages.length > 0 && (
        <p className="text-center text-[#8696a0] text-xs py-2">
          No more messages
        </p>
      )}

      {messages.length === 0 && (
        <p className="text-center text-[#8696a0] text-sm mt-10">
          No messages yet. Say hello! 👋
        </p>
      )}

      {messages.map((msg, i) => {
        const senderId = msg.sender?._id || msg.sender;
        const isMine = senderId?.toString() === user?._id?.toString();
        const hasFile = !!msg.fileUrl;
        const isImageMsg = msg.fileType === "image";
        const replyPreview = getReplyPreview(msg.replyTo);

        return (
          <div
            key={msg._id || i}
            onContextMenu={(e) => onRightClick(e, msg._id, isMine)}
            style={{
              display: "flex",
              justifyContent: isMine ? "flex-end" : "flex-start",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                padding: hasFile && isImageMsg ? "4px" : "8px 12px",
                borderRadius: "8px",
                maxWidth: "75%",
                backgroundColor: isMine ? "#005c4b" : "#202c33",
                color: "white",
                cursor: "context-menu",
                wordBreak: "break-word",
              }}
            >
              {isGroup && !isMine && (
                <p style={{
                  fontSize: "11px",
                  color: "#00a884",
                  marginBottom: "2px",
                  padding: hasFile ? "4px 8px 0" : "0",
                }}>
                  {msg.sender?.username || ""}
                </p>
              )}

              {/* ✅ Reply preview block */}
              {replyPreview && (
                <div style={{
                  borderLeft: "3px solid #00a884",
                  backgroundColor: isMine ? "#004a3b" : "#1a2830",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  marginBottom: "6px",
                  maxWidth: "100%",
                }}>
                  <p style={{ fontSize: "11px", color: "#00a884", marginBottom: "2px" }}>
                    {msg.replyTo?.sender?.username || "Unknown"}
                  </p>
                  <p style={{
                    fontSize: "12px",
                    color: "#8696a0",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {replyPreview}
                  </p>
                </div>
              )}

              {hasFile ? (
                <FileMessage msg={msg} />
              ) : (
                <p style={{ fontSize: "14px" }}>{msg.text}</p>
              )}

              <p style={{
                fontSize: "10px",
                color: "#8696a0",
                textAlign: "right",
                marginTop: "2px",
                padding: hasFile && isImageMsg ? "0 4px 4px" : "0",
              }}>
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
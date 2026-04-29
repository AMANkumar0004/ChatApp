import { useEffect, useState, useRef } from "react";
import { socket } from "../socket";
import { api } from "../services/api";
import { toast } from "react-toastify";

export default function ChatWindow({
  receiver,
  onClose,
}: {
  receiver: any;
  onClose: () => void;
}) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [receiverStatus, setReceiverStatus] = useState<{ lastSeen: Date | null } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [headerMenu, setHeaderMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    msgId: string;
    isMine: boolean;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const isGroup = receiver?.isGroup === true;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleClick = () => {
      setContextMenu(null);
      setHeaderMenu(false);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await api.get("/auth/me");
        const currentUser = res.data.user;
        setUser(currentUser);

        let convId: string;

        if (isGroup) {
          convId = receiver.conversationId;
          setConversationId(convId);
          setReceiverStatus(null);
        } else {
          const convRes = await api.post("/conversations", { receiverId: receiver._id });
          convId = convRes.data.conversation._id;
          setConversationId(convId);
          const statusRes = await api.get(`/users/${receiver._id}/status`);
          setReceiverStatus(statusRes.data);
        }

        const msgRes = await api.get(`/conversations/${convId}/messages`);
        setMessages(msgRes.data.messages);

        const joinRoom = () => {
          socket.emit("register_user", currentUser._id);
          socket.emit("join_conversation", convId);
        };

        if (socket.connected) joinRoom();
        else { socket.connect(); socket.once("connect", joinRoom); }

        socket.on("connect", () => socket.emit("register_user", currentUser._id));

        socket.off("receive_message");
        socket.on("receive_message", (data) => {
          setMessages((prev) => [...prev, data]);
        });

        socket.off("message_deleted");
        socket.on("message_deleted", ({ messageId }) => {
          setMessages((prev) => prev.filter((m) => m._id !== messageId));
        });

        socket.off("chat_cleared");
        socket.on("chat_cleared", ({ conversationId: clearedId }) => {
          if (clearedId === convId) setMessages([]);
        });

        socket.off("user_status_change");
        if (!isGroup) {
          socket.on("user_status_change", (data) => {
            if (data.userId === receiver._id) {
              setReceiverStatus({ lastSeen: data.lastSeen });
            }
          });
        }
      } catch (err: any) {
        console.log("Error:", err.response?.data || err.message);
      }
    };

    init();

    return () => {
      socket.off("receive_message");
      socket.off("connect");
      socket.off("user_status_change");
      socket.off("message_deleted");
      socket.off("chat_cleared");
    };
  }, [receiver?.isGroup ? receiver.conversationId : receiver._id]);

  const sendMessage = () => {
    if (!message.trim() || !user || !conversationId) return;
    socket.emit("send_message", {
      conversationId,
      text: message,
      senderId: user._id,
      receiverId: isGroup ? null : receiver._id,
    });
    setMessage("");
  };

  const deleteMessage = async (msgId: string) => {
    setContextMenu(null);
    try {
      await api.delete(`/messages/${msgId}`);
      socket.emit("delete_message", { messageId: msgId, conversationId });
      setMessages((prev) => prev.filter((m) => m._id !== msgId));
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Could not delete message");
    }
  };

  const clearChat = async () => {
    if (!conversationId) return;
    try {
      await api.delete(`/messages/clear/${conversationId}`);
      socket.emit("clear_chat", { conversationId });
      setMessages([]);
      setShowClearConfirm(false);
      toast.success("Chat cleared");
    } catch (err: any) {
      toast.error("Could not clear chat");
    }
  };

  const handleRightClick = (
    e: React.MouseEvent,
    msgId: string,
    isMine: boolean
  ) => {
    e.preventDefault();
    const container = chatContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    const menuWidth = 150;
    const menuHeight = isMine ? 80 : 40;
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    if (x + menuWidth > rect.width) x = rect.width - menuWidth - 8;
    if (y + menuHeight > rect.height) y = y - menuHeight;

    setContextMenu({ visible: true, x, y, msgId, isMine });
  };

  const formatLastSeen = (lastSeen: Date | string) => {
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "last seen just now";
    if (diffMins < 60) return `last seen ${diffMins} min ago`;
    if (diffHours < 24) return `last seen today at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    if (diffDays === 1) return `last seen yesterday at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    if (diffDays < 7) return `last seen ${diffDays} days ago`;
    return `last seen on ${date.toLocaleDateString([], { day: "numeric", month: "short" })}`;
  };

  return (
    <div ref={chatContainerRef} className="h-full flex flex-col bg-[#111b21] text-white relative">

      {/* ── Header ── */}
      <div
        className="p-3 md:p-4 border-b border-[#2a3942] flex items-center justify-between flex-shrink-0"
        onContextMenu={(e) => { e.preventDefault(); setHeaderMenu(true); }}
      >
        {/* Left — back arrow (mobile) + avatar + name */}
        <div className="flex items-center gap-2 md:gap-3 min-w-0">

          {/* Back arrow — mobile only */}
          <button
            onClick={onClose}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#2a3942] transition text-white flex-shrink-0"
          >
            ←
          </button>

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#00a884] flex items-center justify-center font-bold uppercase overflow-hidden">
              {isGroup ? (
                receiver.groupName[0]
              ) : receiver.profilePic ? (
                <img src={receiver.profilePic} className="w-full h-full object-cover" />
              ) : (
                receiver.username[0]
              )}
            </div>
            {!isGroup && receiverStatus?.lastSeen === null && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 md:w-3 md:h-3 bg-green-400 rounded-full border-2 border-[#111b21]" />
            )}
          </div>

          {/* Name + status */}
          <div className="min-w-0">
            <p className="font-medium text-sm md:text-base truncate">
              {isGroup ? receiver.groupName : receiver.username}
            </p>
            <p className="text-xs text-[#8696a0] truncate">
              {isGroup
                ? `${receiver.participants?.length} members`
                : receiverStatus?.lastSeen === null
                ? "online"
                : receiverStatus?.lastSeen
                ? formatLastSeen(receiverStatus.lastSeen)
                : "offline"}
            </p>
          </div>
        </div>

        {/* Right — buttons */}
        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          <button
            onClick={() => setShowClearConfirm(true)}
            className="hidden sm:block text-xs px-2 md:px-3 py-1 rounded-md bg-[#2a3942] text-[#8696a0] hover:bg-red-600 hover:text-white transition-colors"
          >
            Clear
          </button>
          {/* Close button — desktop only (mobile uses back arrow) */}
          <button
            onClick={onClose}
            className="hidden md:flex w-7 h-7 items-center justify-center rounded-md bg-[#2a3942] text-[#8696a0] hover:bg-[#3a4952] hover:text-white transition-colors text-sm"
          >
            ✕
          </button>
          {/* 3-dot menu — mobile */}
          <button
            onClick={(e) => { e.stopPropagation(); setHeaderMenu(!headerMenu); }}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#2a3942] transition text-[#8696a0]"
          >
            ⋮
          </button>
        </div>
      </div>

      {/* ── Header menu (right-click on desktop, 3-dot on mobile) ── */}
      {headerMenu && (
        <>
          <div className="absolute inset-0 z-40" onClick={() => setHeaderMenu(false)} />
          <div
            className="absolute top-14 right-4 z-50 bg-[#233138] rounded-lg shadow-xl overflow-hidden"
            style={{ width: "160px", border: "1px solid #2a3942" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-[#2a3942] flex items-center gap-2"
              onClick={() => { setShowClearConfirm(true); setHeaderMenu(false); }}
            >
               Clear Chat
            </button>
            <button
              className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-[#2a3942] flex items-center gap-2"
              onClick={() => { onClose(); setHeaderMenu(false); }}
            >
               Close Chat
            </button>
          </div>
        </>
      )}

      {/* ── Clear Chat Confirm ── */}
      {showClearConfirm && (
        <>
          <div
            className="absolute inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.45)" }}
            onClick={() => setShowClearConfirm(false)}
          />
          <div
            className="absolute z-50 bg-[#202c33] rounded-xl p-5 flex flex-col gap-4 shadow-2xl"
            style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "280px" }}
          >
            <p className="text-white font-semibold text-sm">Clear all messages?</p>
            <p className="text-[#8696a0] text-xs leading-relaxed">
              This will delete all messages for everyone. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2 rounded-lg bg-[#2a3942] text-white text-sm hover:bg-[#3a4952]"
              >
                Cancel
              </button>
              <button
                onClick={clearChat}
                className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
              >
                Clear
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Message right-click context menu ── */}
      {contextMenu?.visible && (
        <div
          className="absolute z-50 bg-[#233138] rounded-lg shadow-xl overflow-hidden"
          style={{ top: contextMenu.y, left: contextMenu.x, width: "150px", border: "1px solid #2a3942" }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full text-left px-4 py-2 text-sm text-white hover:bg-[#2a3942] flex items-center gap-2"
            onClick={() => {
              const msg = messages.find((m) => m._id === contextMenu.msgId);
              if (msg?.text) navigator.clipboard.writeText(msg.text);
              toast.success("Copied!");
              setContextMenu(null);
            }}
          >
             Copy
          </button>
          {contextMenu.isMine && (
            <button
              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[#2a3942] flex items-center gap-2"
              onClick={() => deleteMessage(contextMenu.msgId)}
            >
               Delete
            </button>
          )}
        </div>
      )}

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4">
        {messages.length === 0 && (
          <p className="text-center text-[#8696a0] text-sm mt-10">
            No messages yet. Say hello! 👋
          </p>
        )}
        {messages.map((msg, i) => {
          const senderId = msg.sender?._id || msg.sender;
          const isMine = senderId?.toString() === user?._id?.toString();

          return (
            <div
              key={msg._id || i}
              onContextMenu={(e) => handleRightClick(e, msg._id, isMine)}
              style={{
                display: "flex",
                justifyContent: isMine ? "flex-end" : "flex-start",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  maxWidth: "75%",
                  backgroundColor: isMine ? "#005c4b" : "#202c33",
                  color: "white",
                  cursor: "context-menu",
                  wordBreak: "break-word",
                }}
              >
                {isGroup && !isMine && (
                  <p style={{ fontSize: "11px", color: "#00a884", marginBottom: "2px" }}>
                    {msg.sender?.username || ""}
                  </p>
                )}
                <p style={{ fontSize: "14px" }}>{msg.text}</p>
                <p style={{ fontSize: "10px", color: "#8696a0", textAlign: "right", marginTop: "2px" }}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ── */}
      <div className="p-2 md:p-4 flex gap-2 border-t border-[#2a3942] flex-shrink-0">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 p-2 md:p-3 bg-[#2a3942] rounded-lg text-white outline-none placeholder-[#8696a0] text-sm"
          placeholder="Type a message..."
        />
        <button
          onClick={sendMessage}
          className="bg-[#00a884] px-3 md:px-4 py-2 rounded-lg text-white font-medium hover:bg-[#009070] transition text-sm"
        >
          Send
        </button>
      </div>

    </div>
  );
}
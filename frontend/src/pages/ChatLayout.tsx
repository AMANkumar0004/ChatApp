import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import { socket } from "../socket";
import { api } from "../services/api";

export default function ChatLayout() {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userStatuses, setUserStatuses] = useState<Record<string, Date | null>>({});

  useEffect(() => {
    const registerUser = async () => {
      try {
        const res = await api.get("/auth/me");
        const currentUser = res.data.user;

        if (!socket.connected) socket.connect();
        setCurrentUser(res.data.user);

        const register = () => socket.emit("register_user", currentUser._id);

        if (socket.connected) register();
        else socket.once("connect", register);

        socket.on("connect", register);
      } catch (err) {
        console.log("Failed to register user:", err);
      }
    };

    registerUser();

    socket.on("user_status_change", (data) => {
      setUserStatuses((prev) => ({ ...prev, [data.userId]: data.lastSeen }));
    });

    return () => {
      socket.off("connect");
      socket.off("user_status_change");
    };
  }, []);

  return (
    <div className="h-screen flex bg-[#111b21] text-white">

      {/* LEFT — Sidebar */}
      <div className="w-87.5 border-r border-[#2a3942]">
        <Sidebar
          onSelectUser={setSelectedUser}
          selectedUser={selectedUser}
          currentUser={currentUser}
          userStatuses={userStatuses}
        />
      </div>

      {/* RIGHT — Chat Window */}
      <div className="flex-1">
        {selectedUser ? (
          <ChatWindow
            receiver={selectedUser}
            onClose={() => setSelectedUser(null)} 
          />
        ) : (
          <div className="h-full flex items-center justify-center text-[#8696a0] flex-col gap-3">
            <div className="w-16 h-16 rounded-full bg-[#202c33] flex items-center justify-center text-3xl">
              <i className="fa-solid fa-message"></i>
            </div>
            <p className="text-lg font-medium">Welcome to ChatApp</p>
            <p className="text-sm">Select a contact to start chatting</p>
          </div>
        )}
      </div>

    </div>
  );
}
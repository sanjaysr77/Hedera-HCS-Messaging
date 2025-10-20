
import { useEffect, useState } from "react";
import ChatWindow from "./components/ChatWindow";
import MessageInput from "./components/MessageInput";
import { addMessageListener, type MsgObj } from "./utils/wsClient";
import { fetchMessages } from "./utils/api";

export default function App() {

  const [messages, setMessages] = useState<MsgObj[]>([]);

  useEffect(() => {
    // Load past messages
    fetchMessages().then((msgs) => setMessages(msgs));

    // Listen for new messages, but deduplicate
    addMessageListener((msg) =>
      setMessages((prev) => {
        // Check for duplicate by message+timestamp
        if (prev.some((m) => m.message === msg.message && m.timestamp === msg.timestamp)) {
          return prev;
        }
        return [...prev, msg];
      })
    );
  }, []);

  return (
    <div className="h-screen flex flex-col">
      <ChatWindow messages={messages} />
      <MessageInput />
    </div>
  );
}

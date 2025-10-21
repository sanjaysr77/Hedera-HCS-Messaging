import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ChatWindow from "./components/ChatWindow";
import MessageInput from "./components/MessageInput";
import { addMessageListener, type MsgObj, sendFilter } from "./utils/wsClient";
import { fetchMessagesWithMeta } from "./utils/api";
import LandingPage from "./pages/LandingPage";

export default function App() {
  const [messages, setMessages] = useState<MsgObj[]>([]);
  const [keyword, setKeyword] = useState("");
  const [topicId, setTopicId] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetchMessagesWithMeta().then(({ topicId: tid, messages: msgs }) => {
      setTopicId(tid);
      setMessages(msgs);
    });

    addMessageListener((msg) =>
      setMessages((prev) => {
        if (prev.some((m) => m.message === msg.message && m.timestamp === msg.timestamp)) {
          return prev;
        }
        return [...prev, msg];
      })
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    const doFetch = async () => {
      await new Promise((r) => setTimeout(r, 250));
      if (cancelled) return;
      try {
        const resp = await fetchMessagesWithMeta(keyword);
        setTopicId(resp.topicId);
        setMessages(resp.messages);
        sendFilter(keyword);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };
    doFetch();
    return () => {
      cancelled = true;
    };
  }, [keyword]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/messaging"
          element={
            <div className="h-screen flex flex-col">
              <div className="p-2 bg-white border-b flex items-center space-x-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
                  />
                </svg>
                <input
                  aria-label="Search messages"
                  className="flex-1 p-2 rounded border"
                  placeholder="Search messages..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
                {keyword && (
                  <button
                    onClick={() => setKeyword("")}
                    className="text-sm text-gray-500 px-2"
                  >
                    Clear
                  </button>
                )}
                <div className="text-xs text-gray-400 ml-2">
                  Topic: {topicId ?? "(not created yet)"}
                </div>
              </div>
              <ChatWindow messages={messages} />
              <MessageInput />
            </div>
          }
        />
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  );
}

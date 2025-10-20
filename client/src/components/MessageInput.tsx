import { useState } from "react";
import { sendMessage } from "../utils/wsClient";

export default function MessageInput() {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(text);
    setText("");
  };

  return (
    <div className="p-2 bg-gray-200 flex">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="flex-1 p-2 rounded"
        placeholder="Type a message..."
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
      />
      <button onClick={handleSend} className="ml-2 px-4 bg-blue-500 text-white rounded">
        Send
      </button>
    </div>
  );
}

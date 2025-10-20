
import { type MsgObj } from "../utils/wsClient";

interface Props {
  messages: MsgObj[];
}

export default function ChatWindow({ messages }: Props) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-100">
      {messages.map((msg, idx) => (
        <div key={idx} className="p-2 rounded bg-white shadow">
          <div className="text-gray-800">{msg.message}</div>
          <div className="text-gray-400 text-xs">{new Date(msg.timestamp).toLocaleTimeString()}</div>
        </div>
      ))}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";

interface MsgObj {
    message: string;
    timestamp: string;
}

const WS_URL = "ws://localhost:8080";

export default function HederaChatViewer() {
    const [messages, setMessages] = useState<MsgObj[]>([]);
    const chatEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const ws = new WebSocket(WS_URL);
        ws.onmessage = (event) => {
            const msgObj: MsgObj = JSON.parse(event.data);
            setMessages((prev) => {
                if (prev.some((m) => m.message === msgObj.message && m.timestamp === msgObj.timestamp)) {
                    return prev;
                }
                return [...prev, msgObj];
            });
        };
        return () => ws.close();
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="h-full w-full flex flex-col bg-gray-100 p-4 overflow-y-auto">
            {messages.map((msg, idx) => (
                <div
                    key={msg.timestamp + msg.message + idx}
                    className="mb-2 flex flex-col items-start"
                >
                    <div className="bg-white rounded-lg shadow px-4 py-2 max-w-xl">
                        <div className="text-gray-800 text-base">{msg.message}</div>
                        <div className="text-xs text-gray-400 mt-1">
                            {new Date(msg.timestamp).toLocaleString()}
                        </div>
                    </div>
                </div>
            ))}
            <div ref={chatEndRef} />
        </div>
    );
}

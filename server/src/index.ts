//Tested using both Hopscotch and Postman. The websockets part is working fine.
//Try adding MONGO for storing messages if time permits.

import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { encryptMessage, decryptMessage } from "./crypto";
import { WebSocketServer, WebSocket } from "ws";
import { Client, TopicCreateTransaction, TopicMessageSubmitTransaction, TopicMessageQuery, } from "@hashgraph/sdk";
import http from "http";

dotenv.config();

const app = express();
// PORT will be provided by Render in production. Use 8080 as a fallback.
const PORT = process.env.PORT ? Number(process.env.PORT) : Number(process.env.PORT || 8080);

// Configure CORS to allow only the frontend origin in production. The frontend URL
// should be set in server/.env (FRONTEND_URL) or via Render environment variables.
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (like server-to-server or curl)
            if (!origin) return callback(null, true);
            if (origin === FRONTEND_URL) return callback(null, true);
            // Allow localhost dev origins (optional)
            if (origin.startsWith("http://localhost")) return callback(null, true);
            return callback(new Error("CORS policy: origin not allowed"));
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "Origin", "Accept"],
    })
);

// Parse JSON bodies if you add endpoints accepting JSON in future
app.use(express.json());

const client = Client.forTestnet();
client.setOperator(process.env.OPERATOR_ID!, process.env.OPERATOR_KEY!);

let topicId: string | null = null;
let isSubscribed = false;

async function initTopic() {
    try {
        const tx = await new TopicCreateTransaction().execute(client);
        const receipt = await tx.getReceipt(client);
        topicId = receipt.topicId!.toString();
        console.log("Topic Created:", topicId);

        await new Promise((r) => setTimeout(r, 2000));
        subscribeToHederaMessages();
    } catch (err) {
        console.error("Error creating topic:", err);
    }
}
initTopic();

const messageHistory: { message: string; timestamp: string }[] = [];
const MESSAGE_HISTORY_SIZE = 50;

app.get("/messages", (req, res) => {
    const keyword = (req.query.keyword || "") as string;
    const filtered = messageHistory.filter((msgObj) => {
        return (
            !keyword ||
            msgObj.message.toLowerCase().includes(keyword.toLowerCase())
        );
    });
    res.json({
        topicId: topicId || "Topic not created yet",
        messages: filtered,
    });
});

// Create a single HTTP server and attach the WebSocket server to it. This plays nicer
// with hosting providers that expect a single port (Render provides PORT env var).
const server = http.createServer(app);

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Messages endpoint: http://localhost:${PORT}/messages`);
});

const wss = new WebSocketServer({ server });
console.log(`WebSocket server attached to same HTTP server`);

type FilterWebSocket = WebSocket & { keyword?: string };

wss.on("connection", (ws: FilterWebSocket) => {
    console.log("New client connected");
    ws.keyword = "";

    const filteredHistory = messageHistory.filter((msgObj) => {
        return (
            !ws.keyword ||
            msgObj.message.toLowerCase().includes(ws.keyword.toLowerCase())
        );
    });
    filteredHistory.forEach((msgObj) => ws.send(JSON.stringify(msgObj)));

    ws.on("message", async (data) => {
        try {
            const message = data.toString().trim();

            if (message.startsWith("/filter")) {
                const newKeyword = message.slice(8).trim();
                ws.keyword = newKeyword;
                ws.send(
                    JSON.stringify({
                        system: true,
                        message: `Filter set to: ${newKeyword || "none"}`,
                    })
                );
                return;
            }

            if (!topicId) {
                ws.send(JSON.stringify({ system: true, message: "Topic not ready yet" }));
                return;
            }

            const msgObj = {
                message,
                timestamp: new Date().toISOString(),
            };

            const encrypted = encryptMessage(JSON.stringify(msgObj));

            await new TopicMessageSubmitTransaction()
                .setTopicId(topicId)
                .setMessage(JSON.stringify(encrypted))
                .execute(client);

            console.log(`Sent to Hedera [${msgObj.timestamp}]:`, msgObj.message);
        } catch (err) {
            console.error("Error sending message:", err);
        }
    });

    ws.on("close", () => {
        console.log("Client disconnected");
    });
});

function subscribeToHederaMessages() {
    if (isSubscribed || !topicId) return;
    isSubscribed = true;

    console.log("Subscribing to Hedera topic messages...");

    new TopicMessageQuery()
        .setTopicId(topicId)
        .subscribe(client, null, (message) => {
            try {
                if (!message.contents) return;

                const buf = Buffer.from(message.contents as Uint8Array);
                const encrypted = JSON.parse(buf.toString("utf8"));
                const decrypted = decryptMessage(encrypted);
                const msgObj = JSON.parse(decrypted);

                messageHistory.push(msgObj);
                if (messageHistory.length > MESSAGE_HISTORY_SIZE) {
                    messageHistory.shift();
                }

                wss.clients.forEach((client: FilterWebSocket) => {
                    if (client.readyState === WebSocket.OPEN) {
                        if (
                            !client.keyword ||
                            msgObj.message
                                .toLowerCase()
                                .includes(client.keyword.toLowerCase())
                        ) {
                            client.send(JSON.stringify(msgObj));
                        }
                    }
                });

                console.log(`Received [${msgObj.timestamp}]:`, msgObj.message);
            } catch (err) {
                console.error("Error processing message:", err);
            }
        });
}

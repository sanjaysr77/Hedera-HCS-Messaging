import dotenv from "dotenv";
dotenv.config();

import { WebSocketServer, WebSocket } from "ws";
import {
    Client,
    TopicCreateTransaction,
    TopicMessageSubmitTransaction,
    TopicMessageQuery,
    TopicId,
} from "@hashgraph/sdk";

import { encryptMessage, decryptMessage } from "./crypto";

// ------------------- CONFIG -------------------
const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;

// ------------------- HEDERA SETUP -------------------
const client = Client.forTestnet();
client.setOperator(process.env.OPERATOR_ID!, process.env.OPERATOR_KEY!);

let topicId!: string; // definite assignment assertion

async function initTopic() {
    try {
        const tx = await new TopicCreateTransaction().execute(client);
        const receipt = await tx.getReceipt(client);
        topicId = receipt.topicId!.toString();
        console.log("🧭 Topic Created:", topicId);

        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Start Hedera subscription after topic is created
        subscribeToHederaMessages();
    } catch (err) {
        console.error("❌ Error creating topic:", err);
    }
}
initTopic();

// ------------------- WEBSOCKET SERVER -------------------

const MESSAGE_HISTORY_SIZE = 50;
const messageHistory: { message: string; timestamp: string }[] = [];

const wss = new WebSocketServer({ port: PORT });
console.log(`✅ WebSocket server running on ws://localhost:${PORT}`);

// Extend the WebSocket type to include keyword
type FilterWebSocket = WebSocket & { keyword?: string };

wss.on("connection", (ws: FilterWebSocket) => {
    console.log("👤 New client connected");
    ws.keyword = ""; // Initialize with empty keyword (receives all messages)

    // Send filtered message history to client on connect
    const filteredHistory = messageHistory.filter(msgObj => {
        return !ws.keyword || msgObj.message.toLowerCase().includes(ws.keyword.toLowerCase());
    });
    filteredHistory.forEach(msgObj => {
        ws.send(JSON.stringify(msgObj));
    });

    ws.on("message", async (data) => {
        try {
            const message = data.toString();

            // Handle filter command
            if (message.startsWith("/filter")) {
                const newKeyword = message.slice(8).trim();
                ws.keyword = newKeyword;
                ws.send(`🔍 Filter set to: ${newKeyword || "none"}`);
                return;
            }

            // Create message object with timestamp
            const msgObj = {
                message: message,
                timestamp: new Date().toISOString(),
            };
            const encrypted = encryptMessage(JSON.stringify(msgObj));

            // Send encrypted message to Hedera
            await new TopicMessageSubmitTransaction()
                .setTopicId(topicId)
                .setMessage(JSON.stringify(encrypted))
                .execute(client);

            console.log(`📤 Sent to Hedera [${msgObj.timestamp}]:`, msgObj.message);
        } catch (err) {
            console.error("❌ Error sending message:", err);
        }
    });
});

// ------------------- HEDERA SUBSCRIPTION -------------------
function subscribeToHederaMessages() {
    new TopicMessageQuery()
        .setTopicId(topicId)
        .subscribe(client, null, (message) => {
            try {
                // Hedera gives message.contents as Uint8Array
                const buf = Buffer.from(message.contents as Uint8Array);
                const encrypted = JSON.parse(buf.toString("utf8"));
                const decrypted = decryptMessage(encrypted);
                const msgObj = JSON.parse(decrypted);

                // Store in message history (keep last N)
                messageHistory.push(msgObj);
                if (messageHistory.length > MESSAGE_HISTORY_SIZE) {
                    messageHistory.shift();
                }

                // Broadcast to clients based on their keywords
                wss.clients.forEach((client: FilterWebSocket) => {
                    if (client.readyState === WebSocket.OPEN) {
                        // Send if client has no keyword filter or if message contains their keyword
                        if (!client.keyword || msgObj.message.toLowerCase().includes(client.keyword.toLowerCase())) {
                            client.send(JSON.stringify(msgObj));
                        }
                    }
                });

                console.log(`📥 Received from Hedera [${msgObj.timestamp}]:`, msgObj.message);
            } catch (err) {
                console.error("❌ Error processing message:", err);
            }
        });
}

//Tested using both Hopscotch and Postman. The websockets part is working fine.
//Try adding MONGO for storing messages if time permits.

import dotenv from "dotenv";
import express from "express";
import { encryptMessage, decryptMessage } from "./crypto";
import { WebSocketServer, WebSocket } from "ws";
import {Client, TopicCreateTransaction, TopicMessageSubmitTransaction, TopicMessageQuery,} from "@hashgraph/sdk";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
});

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

app.listen(PORT + 1, () => {
    console.log(`HTTP Running on http://localhost:${PORT + 1}/messages`);
});

const wss = new WebSocketServer({ port: PORT });
console.log(`WebSocket server running on ws://localhost:${PORT}`);

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

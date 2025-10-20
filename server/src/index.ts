import dotenv from "dotenv";
dotenv.config();

import { WebSocketServer } from "ws";
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
const wss = new WebSocketServer({ port: PORT });
console.log(`✅ WebSocket server running on ws://localhost:${PORT}`);

wss.on("connection", (ws) => {
  console.log("👤 New client connected");

  ws.on("message", async (data) => {
    try {
      const message = data.toString();
      const encrypted = encryptMessage(message);

      // Send encrypted message to Hedera
      await new TopicMessageSubmitTransaction()
        .setTopicId(topicId)
        .setMessage(JSON.stringify(encrypted))
        .execute(client);

      console.log("📤 Sent to Hedera:", message);
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

        // Broadcast to all connected WebSocket clients
        wss.clients.forEach((client) => {
          if (client.readyState === client.OPEN) client.send(decrypted);
        });

        console.log("📥 Received from Hedera:", decrypted);
      } catch (err) {
        console.error("❌ Error processing message:", err);
      }
    });
}

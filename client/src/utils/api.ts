import { type MsgObj } from "./wsClient";

const API_URL = "http://localhost:8081/messages";

export async function fetchMessages(keyword = ""): Promise<MsgObj[]> {
  const res = await fetch(`${API_URL}?keyword=${keyword}`);
  const data = await res.json();

  if (!data) return [];
  if (Array.isArray(data)) return data as MsgObj[];
  if (data.messages && Array.isArray(data.messages)) return data.messages as MsgObj[];

  console.warn("fetchMessages: unexpected response shape", data);
  return [];
}

export type MessagesResponse = { topicId?: string; messages: MsgObj[] };

export async function fetchMessagesWithMeta(
  keyword = ""
): Promise<MessagesResponse> {
  const res = await fetch(`${API_URL}?keyword=${keyword}`);
  const data = await res.json();

  if (!data) return { topicId: undefined, messages: [] };
  if (Array.isArray(data)) return { topicId: undefined, messages: data as MsgObj[] };
  if (data.messages && Array.isArray(data.messages))
    return { topicId: data.topicId, messages: data.messages as MsgObj[] };

  console.warn("fetchMessagesWithMeta: unexpected response shape", data);
  return { topicId: undefined, messages: [] };
}

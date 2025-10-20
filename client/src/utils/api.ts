import { type MsgObj } from "./wsClient";

const API_URL = "http://localhost:8081/messages";

export async function fetchMessages(keyword = ""): Promise<MsgObj[]> {
  const res = await fetch(`${API_URL}?keyword=${keyword}`);
  return res.json();
}

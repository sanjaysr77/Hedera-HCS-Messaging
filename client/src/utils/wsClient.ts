export type MsgObj = { message: string; timestamp: string };

// Derive WebSocket URL from Vite API base URL. If VITE_API_BASE_URL is set to
// https://api.example.com then the WS URL will be wss://api.example.com (same host).
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";
function toWsUrl(base: string) {
  try {
    const u = new URL(base);
    const protocol = u.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${u.host.replace(/:\d+$/, ":8080")}`; // default ws port used by server
  } catch (err) {
    // fallback
    return "ws://localhost:8080";
  }
}

const WS_URL = toWsUrl(BASE_URL);
const ws = new WebSocket(WS_URL);

const listeners: ((msg: MsgObj) => void)[] = [];

ws.onopen = () => console.log("Connected to WS");

ws.onmessage = (event) => {
  try {
    const parsed = JSON.parse(event.data);
    if (parsed && parsed.system) {
      return;
    }
    const msgObj: MsgObj = parsed as MsgObj;
    listeners.forEach((fn) => fn(msgObj));
  } catch (err) {
    console.warn("wsClient: failed to parse message", err);
  }
};

export function sendMessage(msg: string) {
  if (ws.readyState === WebSocket.OPEN) {
    console.debug("wsClient: sendMessage ->", msg);
    ws.send(msg);
    return;
  }
  let attempts = 0;
  const trySend = () => {
    attempts++;
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    } else if (attempts < 10) {
      setTimeout(trySend, 100);
    } else {
      console.warn("WebSocket not open - message not sent");
    }
  };
  trySend();
}

export function addMessageListener(fn: (msg: MsgObj) => void) {
  listeners.push(fn);
}

export function sendFilter(keyword: string) {
  const cmd = `/filter ${keyword}`;
  console.debug("wsClient: sendFilter ->", cmd, "readyState:", ws.readyState);
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(cmd);
    return;
  }
  let attempts = 0;
  const trySend = () => {
    attempts++;
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(cmd);
    } else if (attempts < 10) {
      setTimeout(trySend, 100);
    } else {
      console.warn("WebSocket not open - filter not sent");
    }
  };
  trySend();
}

export function getReadyState() {
  return ws.readyState;
}

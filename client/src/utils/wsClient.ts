export type MsgObj = { message: string; timestamp: string };

const WS_URL = "ws://localhost:8080";
const ws = new WebSocket(WS_URL);

const listeners: ((msg: MsgObj) => void)[] = [];

ws.onopen = () => console.log("Connected to WS");

ws.onmessage = (event) => {
  try {
    const parsed = JSON.parse(event.data);
    // Server may send system messages like { system: true, message: '...' }
    if (parsed && parsed.system) {
      // ignore system messages for the standard message listeners
      return;
    }
    const msgObj: MsgObj = parsed as MsgObj;
    listeners.forEach((fn) => fn(msgObj));
  } catch (err) {
    console.warn("wsClient: failed to parse message", err);
  }
};

export function sendMessage(msg: string) {
  // Ensure socket open before sending
  if (ws.readyState === WebSocket.OPEN) {
    console.debug("wsClient: sendMessage ->", msg);
    ws.send(msg);
    return;
  }
  // Retry a few times if not open yet
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

// Send a filter command to the server to control which messages are broadcast
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

export type MsgObj = { message: string; timestamp: string };

const WS_URL = "ws://localhost:8080";
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

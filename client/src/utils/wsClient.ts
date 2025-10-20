export type MsgObj = { message: string; timestamp: string };

const WS_URL = "ws://localhost:8080";
const ws = new WebSocket(WS_URL);

const listeners: ((msg: MsgObj) => void)[] = [];

ws.onopen = () => console.log("Connected to WS");

ws.onmessage = (event) => {
  const msgObj: MsgObj = JSON.parse(event.data);
  listeners.forEach((fn) => fn(msgObj));
};

export function sendMessage(msg: string) {
  ws.send(msg);
}

export function addMessageListener(fn: (msg: MsgObj) => void) {
  listeners.push(fn);
}

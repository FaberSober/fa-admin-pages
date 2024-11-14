import { createContext } from 'react';
import { ReadyState } from "ahooks/es/useWebSocket";

export interface WebSocketLayoutContextProps {
  readyState: ReadyState;
  latestMessage?: WebSocketEventMap['message'];
  sendMessage: WebSocket['send']; // 发送websocket信息的方法
  messageHistory: any[],
}

const WebSocketLayoutContext = createContext<WebSocketLayoutContextProps>({
  readyState: ReadyState.Closed,
  sendMessage: (_msg: string) => {},
  messageHistory: [],
});

export default WebSocketLayoutContext

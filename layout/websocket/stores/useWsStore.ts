// stores/useWsStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { ReadyState } from 'ahooks/lib/useWebSocket';
import { dispatch } from 'use-bus';
import { FaUtils, getToken } from '@fa/ui';

interface WsState {
  readyState: ReadyState;
  latestMessage?: WebSocketEventMap['message'];
  latestMessageObj?: any;
  messageHistory: any[];
  sendMessage: (msg: any) => void;
  // 手动控制连接（可选）
  connect: () => void;
  disconnect: () => void;
  // 只订阅某种 type 的消息（超级实用）
  subscribe: (type: string, callback: (data: any) => void) => () => void;
}

export const useWsStore = create<WsState>()(
  devtools(
    persist(
      (set, get) => ({
        readyState: ReadyState.Connecting,
        latestMessage: undefined,
        latestMessageObj: undefined,
        messageHistory: [],

        sendMessage: (msg: any) => {
          const ws = (globalThis as any)._ws_instance;
          if (ws && get().readyState === ReadyState.Open) {
            ws.send(typeof msg === 'string' ? msg : JSON.stringify(msg));
          }
        },

        connect: () => (globalThis as any)._ws_instance?.connect?.(),
        disconnect: () => (globalThis as any)._ws_instance?.disconnect?.(),

        // 内部更新方法，由 WebSocketProvider 调用
        _update: (updates: Partial<WsState>) => set(updates),

        // 订阅特定 type 的消息（类似 event bus，但性能完美）
        subscribe: (type: string, callback: (data: any) => void) => {
          const listener = (e: any) => {
            const msg = FaUtils.tryParseJson(e.data, {});
            if (msg.type === type) {
              callback(msg.data);
            }
          };
          window.addEventListener('ws-message', listener as any);
          return () => window.removeEventListener('ws-message', listener as any);
        },
      }),
      {
        name: 'ws-storage',
        partialize: (state) => ({ messageHistory: state.messageHistory.slice(-100) }), // 只存最近100条
      }
    ),
    { name: 'WebSocket Store' }
  )
);

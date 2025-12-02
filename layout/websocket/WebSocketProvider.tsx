// components/WebSocketProvider.tsx（原来 WebSocketLayout 的进化版）
import { useEffect, useRef } from 'react';
import { useWebSocket } from 'ahooks';
import { useWsStore } from './stores/useWsStore';
import { FaUtils, getToken } from '@fa/ui';
import { dispatch } from 'use-bus';

let hasInited = false;

export default function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const messageHistory = useRef<any[]>([]);
  const set = useWsStore.setState;
  const update = useWsStore.getState()._update; // 私有更新方法

  const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const url = `${wsProtocol}://${window.location.host}/api/websocket/base/${getToken()}`;

  const { readyState, sendMessage, latestMessage, disconnect, connect } = useWebSocket(url, {
    // 关键：只在全局初始化一次，防止重复创建
    manual: hasInited,
    onOpen: () => hasInited = true,
  });

  // 暴露实例给 store 使用
  useEffect(() => {
    (globalThis as any)._ws_instance = { sendMessage, connect, disconnect };
  }, [sendMessage, connect, disconnect]);

  // 同步状态到 zustand
  useEffect(() => {
    update({ readyState });
  }, [readyState]);

  useEffect(() => {
    if (!latestMessage) return;

    try {
      const obj = FaUtils.tryParseJson(latestMessage.data, {});
      update({
        latestMessage,
        latestMessageObj: obj,
        messageHistory: [...messageHistory.current, latestMessage],
      });

      const { type, channel, code, msg, data, timestamp } = obj;
      dispatch({ type: `@@ws/RECEIVE/${type}`, payload: data, channel, code, msg, timestamp });

      // 派发全局事件，供 subscribe 使用
      window.dispatchEvent(new CustomEvent('ws-message', { detail: latestMessage }));
    } catch (e) {
      console.error('ws parse error', e);
    }
  }, [latestMessage]);

  // 心跳 + 重连
  useEffect(() => {
    const timer = setInterval(() => {
      if (readyState === ReadyState.Closed) connect();
      if (readyState === ReadyState.Open) sendMessage('ping');
    }, 10000);
    return () => clearInterval(timer);
  }, [readyState, sendMessage, connect]);

  // 组件卸载时断开（可选）
  // useEffect(() => () => disconnect(), []);

  return <>{children}</>;
}

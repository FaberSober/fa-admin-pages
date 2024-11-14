import React, { useEffect, useMemo, useRef } from 'react';
import { Fa, getToken } from "@fa/ui";
import WebSocketLayoutContext, { WebSocketLayoutContextProps } from './context/WebSocketLayoutContext';
import { useInterval, useWebSocket } from "ahooks";
import { ReadyState } from "ahooks/lib/useWebSocket";


/**
 * websocket layout
 * @author xu.pengfei
 * @date 2024/11/14 16:49
 */
export default function WebSocketLayout({ children }: Fa.BaseChildProps) {
  const messageHistory = useRef<any[]>([]);

  const { readyState, sendMessage, latestMessage, disconnect, connect } = useWebSocket(
    'ws://' + window.location.host + `/api/websocket/${getToken()}`,
  );

  messageHistory.current = useMemo(
    () => messageHistory.current.concat(latestMessage),
    [latestMessage],
  );

  useEffect(() => {
    return () => disconnect()
  }, [])

  useInterval(() => {
    if (readyState === ReadyState.Closed) {
      connect()
    }
    // send heartbeat
  }, 5000)

  const contextValue: WebSocketLayoutContextProps = {
    readyState,
    sendMessage,
    latestMessage,
    messageHistory: messageHistory.current,
  };

  return (
    <WebSocketLayoutContext.Provider value={contextValue}>
      {children}
    </WebSocketLayoutContext.Provider>
  )
}

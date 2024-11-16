import React, { useEffect, useMemo, useRef } from 'react';
import { Fa, FaUtils, getToken } from "@fa/ui";
import WebSocketLayoutContext, { WebSocketLayoutContextProps } from './context/WebSocketLayoutContext';
import { useInterval, useWebSocket } from "ahooks";
import { ReadyState } from "ahooks/lib/useWebSocket";
import {dispatch} from 'use-bus'


/**
 * websocket layout
 * @author xu.pengfei
 * @date 2024/11/14 16:49
 */
export default function WebSocketLayout({ children }: Fa.BaseChildProps) {
  const messageHistory = useRef<any[]>([]);

  const { readyState, sendMessage, latestMessage, disconnect, connect } = useWebSocket(
    'ws://' + window.location.host + `/api/websocket/base/${getToken()}`,
  );

  messageHistory.current = useMemo(
    () => {
      // parse message
      try {
        const ret = FaUtils.tryParseJson(latestMessage?.data, {});
        const { type, code, msg, data } = ret;
        // send msg throw bus event
        dispatch({ type: `@@ws/RECEIVE/${type}`, payload: data, code, msg })
      } catch (e) {
        console.error(e)
      }
      return messageHistory.current.concat(latestMessage)
    },
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
    sendMessage('ping')
  }, 10000)

  const contextValue: WebSocketLayoutContextProps = {
    readyState,
    sendMessage: (msg: Record<any, any>) => sendMessage(JSON.stringify(msg)),
    latestMessage,
    messageHistory: messageHistory.current,
  };

  return (
    <WebSocketLayoutContext.Provider value={contextValue}>
      {children}
    </WebSocketLayoutContext.Provider>
  )
}

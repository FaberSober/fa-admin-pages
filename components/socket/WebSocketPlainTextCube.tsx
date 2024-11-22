import React, { CSSProperties, useState } from 'react';
import useBus from "use-bus";


export interface WebSocketPlainTextCubeProps {
  style?: CSSProperties;
  className?: string;
}

/**
 * @author xu.pengfei
 * @date 2024/11/22 11:13
 */
export default function WebSocketPlainTextCube({ style, className }: WebSocketPlainTextCubeProps) {
  const [array, setArray] = useState<string[]>([])

  useBus(
    ['@@ws/RECEIVE/PLAIN_TEXT'],
    ({ payload }) => {
      setArray([ ...array, payload ])
    },
    [array],
  )

  return (
    <div style={{ maxHeight: 400, overflowY: 'auto', ...style }} className={className}>
      {array.map(item => <div key={item}>{item}</div>)}
    </div>
  )
}

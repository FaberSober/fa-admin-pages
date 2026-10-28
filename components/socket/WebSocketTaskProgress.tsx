import type { Fa } from '@/types';
import { sendMessage } from '@features/fa-admin-pages/layout/websocket';
import { Progress, type ProgressProps } from 'antd';
import { useEffect } from 'react';
import useBus from 'use-bus';

export interface WebSocketTaskProgressProps extends ProgressProps {
  task: Fa.SocketTaskVo;
  onTaskChange?: (task: Fa.SocketTaskVo) => void;
}

/**
 * @author xu.pengfei
 * @date 2024/11/16 21:29
 */
export default function WebSocketTaskProgress({ task, onTaskChange, ...props }: WebSocketTaskProgressProps) {
  useEffect(() => {
    if (task === undefined) return;
    sendMessage({ type: 'WebSocketTaskDemo', data: { taskId: task.taskId } }); // 发送socket绑定任务ID
  }, [task?.taskId]);

  useBus(
    ['@@ws/RECEIVE/WebSocketTaskDemo'],
    ({ payload }) => {
      if (payload.taskId !== task?.taskId) return;
      if (onTaskChange) {
        onTaskChange(payload);
      }
    },
    [task.taskId],
  );

  function getPer() {
    if (task === undefined) return 0;
    if (task.status === 'COMPLETED') return 100;
    if (task.total <= 0) return 0;
    return Math.min(task.status === 'RUNNING' ? 99 : 100, Math.max(0, Math.round((task.cur / task.total) * 100)));
  }

  const status = task.status === 'COMPLETED' ? 'success' : task.status === 'FAILED' ? 'exception' : props.status;
  return <Progress {...props} percent={getPer()} status={status} />;
}

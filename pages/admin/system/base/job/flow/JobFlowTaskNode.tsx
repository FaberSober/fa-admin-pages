import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { LoginOutlined } from '@ant-design/icons';
import { theme } from 'antd';

export type JobFlowTaskNodeType = Node<{ label: string; clazzPath: string; isEntry?: boolean }>;

export default function JobFlowTaskNode({ data, selected }: NodeProps<JobFlowTaskNodeType>) {
  const { token } = theme.useToken();
  return (
    <div
      className="job-flow-task-node"
      style={{
        background: token.colorBgContainer,
        color: token.colorText,
        borderColor: selected ? token.colorPrimary : data.isEntry ? token.colorSuccess : token.colorBorder,
        boxShadow: selected ? `0 0 0 1px ${token.colorPrimary}` : undefined,
      }}
    >
      <Handle type="target" position={Position.Left} />
      {data.isEntry && (
        <span
          className="job-flow-entry-badge"
          style={{ color: token.colorSuccessText, background: token.colorSuccessBg, borderColor: token.colorSuccessBorder }}
          title="没有前驱，可作为流程入口启动"
        >
          <LoginOutlined />
          入口
        </span>
      )}
      <div title={data.clazzPath}>{data.label}</div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

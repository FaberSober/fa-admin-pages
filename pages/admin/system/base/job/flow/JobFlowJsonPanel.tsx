import { useId, useState } from 'react';
import { CloseOutlined, CodeOutlined, CompressOutlined, ExpandOutlined } from '@ant-design/icons';
import { Button, Space, Typography, theme } from 'antd';
import { FaJsonView, FaResizeHorizontal } from '@fa/ui';

/** 画布内只读快照面板，沿用编排属性面板的悬浮布局。 */
export default function JobFlowJsonPanel({ source, onClose }: { source: string; onClose: () => void }) {
  const panelId = useId();
  const [expanded, setExpanded] = useState(false);
  const { token } = theme.useToken();
  return (
    <div className={`job-flow-json-panel ${expanded ? 'job-flow-json-panel--expanded' : ''}`}>
      {!expanded && <FaResizeHorizontal domId={panelId} position="left" minWidth={420} maxWidth={1000} />}
      <section
        id={panelId}
        aria-label="查看流程定义 JSON"
        className="job-flow-json-frame"
        style={{ width: expanded ? '100%' : 720, borderColor: token.colorBorderSecondary, boxShadow: token.boxShadowSecondary }}
      >
        <header className="job-flow-json-header">
          <Space>
            <span className="job-flow-json-icon">
              <CodeOutlined />
            </span>
            <Typography.Text strong>查看编排 JSON</Typography.Text>
          </Space>
          <Space size={4}>
            <Button
              type="text"
              size="small"
              icon={expanded ? <CompressOutlined /> : <ExpandOutlined />}
              aria-label={expanded ? '还原 JSON 面板' : '展开 JSON 至画布'}
              onClick={() => setExpanded((value) => !value)}
            />
            <Button type="text" size="small" icon={<CloseOutlined />} aria-label="关闭 JSON 面板" onClick={onClose} />
          </Space>
        </header>
        <div className="job-flow-json-body">
          <Typography.Text type="secondary">当前为只读查看。示例任务 ID 不可用于真实调度；修改画布后请重新打开以查看最新定义。</Typography.Text>
          <div className="job-flow-json-content">
            <FaJsonView data={source} defaultExpandDepth={2} />
          </div>
        </div>
        <footer className="job-flow-json-footer">
          <Button onClick={onClose}>关闭</Button>
        </footer>
      </section>
    </div>
  );
}

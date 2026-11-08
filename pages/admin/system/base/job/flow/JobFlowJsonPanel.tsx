import { useId, useMemo, useState } from 'react';
import { CloseOutlined, CodeOutlined, CompressOutlined, ExpandOutlined } from '@ant-design/icons';
import { Alert, Button, Segmented, Space, Typography, theme } from 'antd';
import { FaJsonEdit, FaJsonView, FaResizeHorizontal } from '@fa/ui';

import { parseFlowDefinition, type FlowDefinition } from './flowDefinition';

/** 画布内 JSON 面板，沿用编排属性面板的悬浮布局。 */
export default function JobFlowJsonPanel({
  source,
  allowedJobIds,
  onApply,
  onClose,
}: {
  source: string;
  allowedJobIds: readonly number[];
  onApply: (definition: FlowDefinition) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(source);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const validation = useMemo(() => {
    try {
      return { definition: parseFlowDefinition(draft, allowedJobIds) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : '流程定义无效' };
    }
  }, [draft, allowedJobIds]);
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
            <Typography.Text strong>{mode === 'edit' ? '编辑编排 JSON' : '查看编排 JSON'}</Typography.Text>
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
          <Space style={{ justifyContent: 'space-between' }}>
            <Typography.Text type="secondary">仅修改当前页面，示例任务 ID 不可用于真实调度。切换模式保留修改，关闭面板丢弃未应用修改。</Typography.Text>
            <Segmented<'view' | 'edit'>
              aria-label="JSON 查看或编辑"
              value={mode}
              options={[
                { label: '查看', value: 'view' },
                { label: '编辑', value: 'edit' },
              ]}
              onChange={setMode}
            />
          </Space>
          {validation.error && <Alert type="error" showIcon title={validation.error} />}
          <div className="job-flow-json-content">
            {mode === 'edit' ? (
              <FaJsonEdit value={draft} onChange={setDraft} defaultMode="text" defaultExpandDepth={2} />
            ) : (
              <FaJsonView data={draft} defaultExpandDepth={2} />
            )}
          </div>
        </div>
        <footer className="job-flow-json-footer">
          <Button onClick={onClose}>关闭</Button>
          {mode === 'edit' && (
            <Button
              type="primary"
              disabled={!validation.definition}
              onClick={() => {
                if (validation.definition) onApply(validation.definition);
              }}
            >
              应用到画布
            </Button>
          )}
        </footer>
      </section>
    </div>
  );
}

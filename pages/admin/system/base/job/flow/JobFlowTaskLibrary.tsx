import { useId, useState } from 'react';
import { CloseOutlined, ReloadOutlined } from '@ant-design/icons';
import { Alert, Button, Checkbox, Empty, Input, Space, Spin, Tag, Tooltip, Typography } from 'antd';
import { FaResizeHorizontal } from '@fa/ui';
import type { Admin } from '@/types';
import { catalogGroup, filterCatalog } from './jobCatalog';

export default function JobFlowTaskLibrary({ tasks, loading, failed, counts, onRefresh, onAdd, onClose, full }: {
  tasks: Admin.RegisteredJob[]; loading: boolean; failed: boolean; counts: Record<string, number>;
  onRefresh: () => void; onAdd: (task: Admin.RegisteredJob) => void; onClose: () => void; full: boolean;
}) {
  const id = useId();
  const [width, setWidth] = useState(680);
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<string>();
  const [showDeprecated, setShowDeprecated] = useState(false);
  const matches = filterCatalog(tasks, query, showDeprecated);
  const groups = [...new Set(tasks.filter(task => showDeprecated || !task.deprecated).map(catalogGroup))].sort();
  const selectedGroup = group !== undefined && groups.includes(group) ? group : undefined;
  const visible = selectedGroup === undefined ? matches : matches.filter(task => catalogGroup(task) === selectedGroup);
  return <div className="job-flow-json-panel">
    <FaResizeHorizontal domId={id} position="left" minWidth={400} maxWidth={960} onWidthChange={setWidth} />
    <section id={id} className="job-flow-json-frame" style={{ width }} aria-label="注册任务库">
      <header className="job-flow-json-header"><Typography.Text strong>任务库</Typography.Text><Space size={4}>
        <Button type="text" size="small" icon={<ReloadOutlined />} loading={loading} aria-label="刷新任务库" onClick={onRefresh} />
        <Button type="text" size="small" icon={<CloseOutlined />} aria-label="关闭任务库" onClick={onClose} />
      </Space></header>
      <div className="job-flow-library-search"><Input.Search allowClear placeholder="搜索任务名称、描述、标签或类名" aria-label="搜索注册任务" value={query} onChange={event => setQuery(event.target.value)} />
        <Checkbox checked={showDeprecated} onChange={event => setShowDeprecated(event.target.checked)}>显示已弃用</Checkbox>
        {full && <Typography.Text type="warning">已达到 100 个节点上限</Typography.Text>}
        {failed && <Alert type="error" title="任务加载失败，请刷新重试" />}
      </div>
      <div className="job-flow-library-content">
        <nav className="job-flow-library-groups" aria-label="任务分组">
          {[undefined, ...groups].map(value => <button key={value ?? '__all'} type="button" className={selectedGroup === value ? 'is-active' : ''} aria-pressed={selectedGroup === value} onClick={() => setGroup(value)}>
            <span>{value ?? '全部'}</span><small>{value === undefined ? matches.length : matches.filter(task => catalogGroup(task) === value).length}</small>
          </button>)}
        </nav>
        <div className="job-flow-library-list"><Spin spinning={loading}>
          {!loading && !failed && visible.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无匹配任务" />}
          <div className="job-flow-library-grid">{visible.map(task => <article key={task.clazzPath} className={`job-flow-library-task${loading || failed || full ? ' is-disabled' : ''}`}>
            <button type="button" className="job-flow-library-add" disabled={loading || failed || full} aria-label={`添加 ${task.name}`} title={`${task.name}\n${task.description}`} onClick={() => onAdd(task)} />
            <div className="job-flow-library-task-main"><div className="job-flow-library-task-title"><Typography.Text strong ellipsis>{task.name}</Typography.Text>{task.deprecated && <Tag color="warning" className="job-flow-library-deprecated">已弃用</Tag>}</div>
              <div className="job-flow-library-description">{task.description || '暂无任务说明'}</div>
              <span className="job-flow-library-copy"><Tooltip title={task.clazzPath}><Typography.Text className="job-flow-library-class" type="secondary" copyable={{ text: task.clazzPath }}>{task.clazzPath.split('.').at(-1)}</Typography.Text></Tooltip></span>
              <div className="job-flow-library-task-footer"><Space size={4} wrap>{task.tags.slice(0, 2).map(tag => <Tag key={tag}>{tag}</Tag>)}{task.tags.length > 2 && <Tag>+{task.tags.length - 2}</Tag>}</Space>{counts[task.clazzPath] > 0 && <Typography.Text className="job-flow-library-added" type="secondary">已添加 {counts[task.clazzPath]}</Typography.Text>}</div>
            </div>
          </article>)}</div>
        </Spin></div>
      </div>
    </section>
  </div>;
}

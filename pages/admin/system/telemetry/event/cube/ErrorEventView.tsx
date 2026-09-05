import { TelemetryAppName, clientTypes, environments, telemetryLabel } from '@features/fa-admin-pages/components/telemetry';
import { Alert, Button, Descriptions, Skeleton } from 'antd';
import { useEffect, useState } from 'react';
import type { Admin } from '@/types';
import { FaJsonView } from '@fa/ui';
import { telemetryErrorEventApi as api } from '@features/fa-admin-pages/services';
import './ErrorEventView.css';

export default function ErrorEventView({ record }: { record: Admin.ClientErrorEvent }) {
  const [detail, setDetail] = useState<Admin.ClientErrorEvent>();
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setFailed(false);
    setDetail(undefined);
    async function load() {
      try {
        const res = await api.getDetail(record.id);
        if (res.status !== 200 || !res.data) throw new Error('加载失败');
        if (active) setDetail(res.data);
      } catch {
        if (active) setFailed(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [record.id, retry]);

  if (loading) return <Skeleton active paragraph={{ rows: 9 }} />;
  if (failed || !detail) return <Alert type="error" showIcon title="详情加载失败" action={<Button onClick={() => setRetry(value => value + 1)}>重试</Button>} />;
  return <Descriptions bordered column={1} className="fa-json-view-descriptions" styles={{ label: { width: 120 } }}>
    <Descriptions.Item label="异常类型">{detail.errorType}</Descriptions.Item>
    <Descriptions.Item label="消息"><Alert type="error" showIcon title={detail.message} /></Descriptions.Item>
    <Descriptions.Item label="应用 / Issue"><TelemetryAppName appId={detail.appId} /> / {detail.issueId}</Descriptions.Item>
    <Descriptions.Item label="客户端 / 环境">{telemetryLabel(clientTypes, detail.clientType)} / {telemetryLabel(environments, detail.environment)}</Descriptions.Item>
    <Descriptions.Item label="版本">{detail.release}</Descriptions.Item>
    <Descriptions.Item label="用户 / 会话">{detail.userId || '-'} / {detail.sessionId}</Descriptions.Item>
    <Descriptions.Item label="发生时间">{detail.occurTime}</Descriptions.Item>
    <Descriptions.Item label="异常堆栈"><pre className="fa-break-word" style={{ margin: 0, maxHeight: 280, overflow: 'auto' }}>{detail.stack || '-'}</pre></Descriptions.Item>
    <Descriptions.Item label="上下文"><FaJsonView data={detail.context} /></Descriptions.Item>
    <Descriptions.Item label="行为轨迹"><FaJsonView data={detail.breadcrumbs} defaultExpandDepth={1} /></Descriptions.Item>
  </Descriptions>;
}

import { TelemetryAppName, TelemetryIssueStatusTag, clientTypes, telemetryLabel } from '@features/fa-admin-pages/components/telemetry';
import { Alert, Button, Descriptions, Skeleton } from 'antd';
import { useEffect, useState } from 'react';
import type { Admin } from '@/types';
import { telemetryErrorEventApi, telemetryIssueApi as api } from '@features/fa-admin-pages/services';

export default function IssueView({ record }: { record: Admin.ClientErrorIssue }) {
  const [detail, setDetail] = useState<Admin.ClientErrorIssue>();
  const [recentEvent, setRecentEvent] = useState<Admin.ClientErrorEvent>();

  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setFailed(false);
    setDetail(undefined);
    setRecentEvent(undefined);
    async function load() {
      try {
        const [issue, events] = await Promise.all([api.getDetail(record.id), telemetryErrorEventApi.recentByIssue(record.id)]);
        if (issue.status !== 200 || events.status !== 200 || !issue.data) throw new Error('加载失败');
        if (active) { setDetail(issue.data); setRecentEvent(events.data?.[0]); }
      } catch {
        if (active) setFailed(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [record.id, retry, record.status]);

  if (loading) return <Skeleton active paragraph={{ rows: 9 }} />;
  if (failed || !detail) return <Alert type="error" showIcon title="详情加载失败" action={<Button onClick={() => setRetry(value => value + 1)}>重试</Button>} />;
  return (
    <Descriptions bordered column={1} styles={{ label: { width: 120 } }}>
      <Descriptions.Item label="状态"><TelemetryIssueStatusTag status={detail.status} /></Descriptions.Item>
      <Descriptions.Item label="应用"><TelemetryAppName appId={detail.appId} /></Descriptions.Item>
      <Descriptions.Item label="客户端">{telemetryLabel(clientTypes, detail.clientType)}</Descriptions.Item>
      <Descriptions.Item label="异常类型">{detail.errorType}</Descriptions.Item>
      <Descriptions.Item label="异常标题"><Alert type="error" showIcon title={detail.title} /></Descriptions.Item>
      <Descriptions.Item label="异常指纹"><code>{detail.fingerprint}</code></Descriptions.Item>
      <Descriptions.Item label="首次出现">{detail.firstSeenTime}</Descriptions.Item>
      <Descriptions.Item label="最后出现">{detail.lastSeenTime}</Descriptions.Item>
      <Descriptions.Item label="事件数">{detail.eventCount}</Descriptions.Item>
      <Descriptions.Item label="受影响用户数">{detail.userCount}</Descriptions.Item>
      <Descriptions.Item label="最新版本">{detail.latestRelease}</Descriptions.Item>
      {!recentEvent && <Descriptions.Item label="最近异常明细">暂无异常明细</Descriptions.Item>}
      <Descriptions.Item label="最近堆栈"><pre className="fa-break-word" style={{ margin: 0, maxHeight: 220, overflow: 'auto' }}>{recentEvent?.stack || '-'}</pre></Descriptions.Item>
      <Descriptions.Item label="最近上下文"><pre className="fa-break-word" style={{ margin: 0, maxHeight: 180, overflow: 'auto' }}>{JSON.stringify(recentEvent?.context || {}, null, 2)}</pre></Descriptions.Item>
      <Descriptions.Item label="最近行为轨迹"><pre className="fa-break-word" style={{ margin: 0, maxHeight: 180, overflow: 'auto' }}>{JSON.stringify(recentEvent?.breadcrumbs || [], null, 2)}</pre></Descriptions.Item>
    </Descriptions>
  );
}

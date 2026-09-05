import { Alert, Descriptions, Skeleton, Tag } from 'antd';
import { useEffect, useState } from 'react';
import type { Admin } from '@/types';
import { telemetryErrorEventApi, telemetryIssueApi as api } from '@features/fa-admin-pages/services';

export default function IssueView({ record }: { record: Admin.ClientErrorIssue }) {
  const [detail, setDetail] = useState<Admin.ClientErrorIssue>();
  const [recentEvent, setRecentEvent] = useState<Admin.ClientErrorEvent>();

  useEffect(() => {
    Promise.all([api.getDetail(record.id), telemetryErrorEventApi.recentByIssue(record.id)])
      .then(([issue, events]) => {
        setDetail(issue.data);
        setRecentEvent(events.data[0]);
      })
      .catch(() => setDetail(undefined));
  }, [record.id]);

  if (!detail) return <Skeleton active paragraph={{ rows: 9 }} />;
  return (
    <Descriptions bordered column={1} styles={{ label: { width: 120 } }}>
      <Descriptions.Item label="状态"><Tag>{detail.status}</Tag></Descriptions.Item>
      <Descriptions.Item label="应用 ID">{detail.appId}</Descriptions.Item>
      <Descriptions.Item label="客户端">{detail.clientType}</Descriptions.Item>
      <Descriptions.Item label="异常类型">{detail.errorType}</Descriptions.Item>
      <Descriptions.Item label="异常标题"><Alert type="error" showIcon message={detail.title} /></Descriptions.Item>
      <Descriptions.Item label="Fingerprint"><code>{detail.fingerprint}</code></Descriptions.Item>
      <Descriptions.Item label="首次出现">{detail.firstSeenTime}</Descriptions.Item>
      <Descriptions.Item label="最后出现">{detail.lastSeenTime}</Descriptions.Item>
      <Descriptions.Item label="事件数">{detail.eventCount}</Descriptions.Item>
      <Descriptions.Item label="受影响用户">{detail.userCount}</Descriptions.Item>
      <Descriptions.Item label="最新版本">{detail.latestRelease}</Descriptions.Item>
      <Descriptions.Item label="最近 Stack"><pre className="fa-break-word" style={{ margin: 0, maxHeight: 220, overflow: 'auto' }}>{recentEvent?.stack || '-'}</pre></Descriptions.Item>
      <Descriptions.Item label="最近 Context"><pre className="fa-break-word" style={{ margin: 0, maxHeight: 180, overflow: 'auto' }}>{JSON.stringify(recentEvent?.context || {}, null, 2)}</pre></Descriptions.Item>
      <Descriptions.Item label="最近 Breadcrumb"><pre className="fa-break-word" style={{ margin: 0, maxHeight: 180, overflow: 'auto' }}>{JSON.stringify(recentEvent?.breadcrumbs || [], null, 2)}</pre></Descriptions.Item>
    </Descriptions>
  );
}

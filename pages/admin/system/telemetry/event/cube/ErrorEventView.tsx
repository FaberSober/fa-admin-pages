import { Alert, Descriptions, Skeleton } from 'antd';
import { useEffect, useState } from 'react';
import type { Admin } from '@/types';
import { telemetryErrorEventApi as api } from '@features/fa-admin-pages/services';

function JsonBlock({ value }: { value: unknown }) {
  return <pre className="fa-break-word" style={{ margin: 0, maxHeight: 240, overflow: 'auto' }}>{JSON.stringify(value ?? {}, null, 2)}</pre>;
}

export default function ErrorEventView({ record }: { record: Admin.ClientErrorEvent }) {
  const [detail, setDetail] = useState<Admin.ClientErrorEvent>();
  useEffect(() => {
    api.getDetail(record.id).then((res) => setDetail(res.data)).catch(() => setDetail(undefined));
  }, [record.id]);
  if (!detail) return <Skeleton active paragraph={{ rows: 12 }} />;
  return <Descriptions bordered column={1} styles={{ label: { width: 120 } }}>
    <Descriptions.Item label="异常类型">{detail.errorType}</Descriptions.Item>
    <Descriptions.Item label="消息"><Alert type="error" showIcon message={detail.message} /></Descriptions.Item>
    <Descriptions.Item label="应用 / Issue">{detail.appId} / {detail.issueId}</Descriptions.Item>
    <Descriptions.Item label="客户端 / 环境">{detail.clientType} / {detail.environment}</Descriptions.Item>
    <Descriptions.Item label="版本">{detail.release}</Descriptions.Item>
    <Descriptions.Item label="用户 / Session">{detail.userId || '-'} / {detail.sessionId}</Descriptions.Item>
    <Descriptions.Item label="发生时间">{detail.occurTime}</Descriptions.Item>
    <Descriptions.Item label="Stack"><pre className="fa-break-word" style={{ margin: 0, maxHeight: 280, overflow: 'auto' }}>{detail.stack || '-'}</pre></Descriptions.Item>
    <Descriptions.Item label="Context"><JsonBlock value={detail.context} /></Descriptions.Item>
    <Descriptions.Item label="Breadcrumb"><JsonBlock value={detail.breadcrumbs} /></Descriptions.Item>
  </Descriptions>;
}

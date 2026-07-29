import { CopyOutlined } from '@ant-design/icons';
import { FaUtils } from '@fa/ui';
import { systemUpdateLogApi as api } from '@features/fa-admin-pages/services';
import { Alert, Button, Descriptions, Skeleton, Space, Tag, Typography, theme } from 'antd';
import { useEffect, useState } from 'react';
import type { Admin } from '@/types';

export interface SystemUpdateLogViewProps {
  record: Admin.SystemUpdateLog;
}

/**
 * @author xu.pengfei
 * @date 2023/2/20 14:57
 */
export default function SystemUpdateLogView({ record }: SystemUpdateLogViewProps) {
  const [detail, setDetail] = useState<Admin.SystemUpdateLog>();
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const { token } = theme.useToken();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadFailed(false);
    api
      .getDetail(record.id)
      .then((res) => {
        if (active) setDetail(res.data);
      })
      .catch(() => {
        if (active) setLoadFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [record.id]);

  if (loading) {
    return <Skeleton active paragraph={{ rows: 12 }} />;
  }
  if (loadFailed || !detail) {
    return <Alert type="error" showIcon message="版本日志详情加载失败" />;
  }

  return (
    <Descriptions bordered column={1} styles={{ label: { width: 120 } }}>
      <Descriptions.Item label="执行状态">
        {detail.status === 1 && <Tag color="success">成功</Tag>}
        {detail.status === 9 && <Tag color="error">失败</Tag>}
        {detail.status == null && <Tag>未记录</Tag>}
      </Descriptions.Item>
      <Descriptions.Item label="模块编码">{detail.no}</Descriptions.Item>
      <Descriptions.Item label="模块名称">{detail.name}</Descriptions.Item>
      <Descriptions.Item label="版本号">{detail.ver}</Descriptions.Item>
      <Descriptions.Item label="版本编码">{detail.verNo}</Descriptions.Item>
      <Descriptions.Item label="SQL文件">{detail.fileName || '-'}</Descriptions.Item>
      <Descriptions.Item label="执行耗时">{detail.durationMs == null ? '-' : `${detail.durationMs} ms`}</Descriptions.Item>
      <Descriptions.Item label="内容校验和">
        {detail.checksum ? (
          <Typography.Text code copyable>
            {detail.checksum}
          </Typography.Text>
        ) : (
          '-'
        )}
      </Descriptions.Item>
      <Descriptions.Item label="备注信息">{detail.remark}</Descriptions.Item>
      <Descriptions.Item label="SQL执行内容">
        <Space orientation="vertical" style={{ width: '100%' }}>
          <Button size="small" icon={<CopyOutlined />} onClick={() => FaUtils.copyToClipboard(detail.log || '', 'SQL')}>
            复制SQL
          </Button>
          <pre
            className="fa-break-word"
            style={{
              margin: 0,
              maxHeight: '55vh',
              overflow: 'auto',
              padding: 12,
              borderRadius: 6,
              background: token.colorFillTertiary,
            }}
          >
            {detail.log || '-'}
          </pre>
        </Space>
      </Descriptions.Item>
      {detail.errorMsg && (
        <Descriptions.Item label="错误堆栈">
          <Alert
            type="error"
            showIcon
            message="SQL执行失败"
            description={
              <pre className="fa-break-word" style={{ maxHeight: '40vh', overflow: 'auto', margin: 0 }}>
                {detail.errorMsg}
              </pre>
            }
          />
        </Descriptions.Item>
      )}
    </Descriptions>
  );
}

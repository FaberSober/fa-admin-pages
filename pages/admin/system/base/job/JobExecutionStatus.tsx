import { Space, Tag, Tooltip } from 'antd';
import { formatJobCount, getJobExecutionPresentation } from './jobStatistics';

interface JobExecutionStatusProps {
  status?: number | null;
  trackingVersion?: number | null;
  legacyDuration?: string | number | null;
}

export default function JobExecutionStatus({ status, trackingVersion, legacyDuration }: JobExecutionStatusProps) {
  const { text, color, legacy, notice } = getJobExecutionPresentation(status, trackingVersion);
  if (text === '—') return text;
  const description = legacy && legacyDuration != null ? `原记录入口耗时：${formatJobCount(legacyDuration)} 秒。${notice}` : notice;
  return (
    <Tooltip title={description}>
      <Space size={0} wrap>
        <Tag color={color}>{text}</Tag>
        {legacy && <Tag>历史记录</Tag>}
      </Space>
    </Tooltip>
  );
}

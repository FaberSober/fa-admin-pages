import { Calendar, Card, Flex, Tag, Typography, theme } from 'antd';
import { mockExecutions } from './mock';

export default function JobVisual() {
  const { token } = theme.useToken();
  return (
    <div className="fa-full-content-p12 fa-content">
      <Flex gap={16} wrap="wrap" align="start">
        <Card title="选择日期" style={{ width: 300, flexShrink: 0 }}>
          <Calendar fullscreen={false} />
        </Card>
        <Card title="执行时间轴（模拟数据）" style={{ flex: '1 1 400px', minWidth: 0 }}>
          <Flex justify="space-between" style={{ marginLeft: 120 }}><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span></Flex>
          <Flex vertical gap={16} style={{ marginTop: 16 }}>
            {mockExecutions.map((item) => (
              <Flex key={item.name} align="center" gap={16} wrap="wrap">
                <Typography.Text strong style={{ width: 104 }}>{item.name}</Typography.Text>
                <div style={{ flex: 1, position: 'relative', height: 24, background: token.colorFillSecondary }} title={item.time}>
                  <div style={{ position: 'absolute', left: `${item.start}%`, width: `${item.width}%`, height: '100%', background: item.status === '成功' ? token.colorSuccess : token.colorError }} />
                </div>
                <Tag color={item.status === '成功' ? 'success' : 'error'}>{item.status}</Tag>
              </Flex>
            ))}
          </Flex>
        </Card>
      </Flex>
    </div>
  );
}

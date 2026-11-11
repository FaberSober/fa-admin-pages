import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Alert, Button, Calendar, Card, Flex, Input, Select, Tag, Typography, theme } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { jobApi } from '@features/fa-admin-pages/services';
import { mockExecutions } from './mock';
import { calendarStatus, type CalendarDay } from './calendar';
import './job-visual-calendar.scss';

export default function JobVisual() {
  const { token } = theme.useToken();
  const [selected, setSelected] = useState(dayjs());
  const month = selected.format('YYYY-MM');
  const [days, setDays] = useState<Record<string, CalendarDay>>({});
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setDays({});
    setError(false);
    jobApi.visualCalendar(month, controller.signal).then((response) => {
      if (response.status !== 200) throw new Error(response.message);
      if (!controller.signal.aborted) setDays(Object.fromEntries(response.data.map((day: CalendarDay) => [day.date, day])));
    }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [month]);
  return (
    <div className="fa-islands-grid job-visual-page">
        <div className="job-visual-sidebar">
        <Card className="fa-islands-panel job-visual-calendar-card" title="定时任务可视化">
          {error && <Alert type="error" message="日历数据加载失败" showIcon />}
          <Calendar className="job-visual-calendar" fullscreen={false} value={selected} onSelect={setSelected} onPanelChange={setSelected}
            headerRender={({ value, onChange }) => (
              <Flex align="center" justify="space-between" style={{ marginBottom: 4 }}>
                <Button aria-label="上个月" icon={<LeftOutlined />} onClick={() => onChange(value.subtract(1, 'month'))} />
                <Typography.Text strong>{value.format('YYYY 年 M 月')}</Typography.Text>
                <Button aria-label="下个月" icon={<RightOutlined />} onClick={() => onChange(value.add(1, 'month'))} />
              </Flex>
            )}
            fullCellRender={(date, info) => {
              if (info.type !== 'date') return info.originNode;
              const day = date.format('YYYY-MM') === month ? days[date.format('YYYY-MM-DD')] : undefined;
              const status = calendarStatus(day);
              return (
                <div className="ant-picker-cell-inner job-visual-calendar-date"
                  style={date.isSame(selected, 'day') ? { background: 'transparent', color: token.colorText, boxShadow: `inset 0 0 0 1px ${token.colorPrimary}` } : undefined}>
                  <span>{date.date()}</span>
                  {day && status && <span className="job-visual-calendar-dot" role="img"
                    aria-label={day.failed ? `失败 ${day.failed} 次` : `全部成功，共 ${day.total} 次`}
                    style={{ background: status === 'error' ? token.colorError : token.colorSuccess }} />}
                </div>
              );
            }} />
          <Flex className="job-visual-calendar-legend" gap={16} wrap="wrap" align="center">
            <span className="job-visual-today-legend" style={{ fontSize: 11, color: token.colorTextSecondary }}><span className="job-visual-legend-dot" style={{ background: token.colorSuccess }} aria-hidden="true" />全部成功</span>
            <span className="job-visual-today-legend" style={{ fontSize: 11, color: token.colorTextSecondary }}><span className="job-visual-legend-dot" style={{ background: token.colorError }} aria-hidden="true" />有失败</span>
            <span className="job-visual-today-legend" style={{ fontSize: 11, color: token.colorTextSecondary }}><span className="job-visual-today-mark" aria-hidden="true" />今天</span>
          </Flex>
        </Card>
        <Card className="fa-islands-panel" aria-label="查询条件">
          <Flex vertical gap={12}>
            <Select aria-label="任务类型" placeholder="任务类型" disabled />
            <Select aria-label="执行结果" placeholder="执行结果" disabled />
            <Input aria-label="任务名称" placeholder="任务名称" disabled />
          </Flex>
        </Card>
        <Card className="fa-islands-panel" aria-label="当日统计">
          <div className="job-visual-stats">
            {['总执行', '成功', '失败', '成功率', '平均耗时', '最长耗时'].map((label) => (
              <div className="job-visual-stat" key={label}>
                <Typography.Text type="secondary">{label}</Typography.Text>
                <Typography.Text strong>—</Typography.Text>
              </div>
            ))}
          </div>
        </Card>
        </div>
        <div className="job-visual-timeline">
          <section className="fa-islands-table job-visual-chart" aria-label="执行时间轴">
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
          </section>
        </div>
    </div>
  );
}

import { LeftOutlined, ReloadOutlined, RightOutlined } from '@ant-design/icons';
import { Alert, Button, Calendar, Card, Flex, Input, Select, Spin, Typography, theme } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { jobApi } from '@features/fa-admin-pages/services';
import JobTimeline from './components/JobTimeline';
import { timelineStatCards, timelineStatusOptions, timelineTypeOptions, type TimelineFilter, type TimelineResult } from './timeline';
import { calendarStatus, type CalendarDay } from './calendar';
import './job-visual-calendar.scss';

export default function JobVisual() {
  const { token } = theme.useToken();
  const [selected, setSelected] = useState(dayjs());
  const month = selected.format('YYYY-MM');
  const date = selected.format('YYYY-MM-DD');
  const [timeline, setTimeline] = useState<TimelineResult | null>(null);
  const [timelineError, setTimelineError] = useState(false);
  const [days, setDays] = useState<Record<string, CalendarDay>>({});
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<TimelineFilter>({});
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setDays({});
    setError(false);
    jobApi.visualCalendar(month, controller.signal).then((response) => {
      if (response.status !== 200) throw new Error(response.message);
      if (!controller.signal.aborted) setDays(Object.fromEntries(response.data.map((day: CalendarDay) => [day.date, day])));
    }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [month, refreshKey]);
  useEffect(() => {
    const controller = new AbortController();
    setTimeline(null); setTimelineError(false);
    jobApi.visualTimeline(date, filter, controller.signal).then((response) => {
      if (response.status !== 200) throw new Error(response.message);
      if (!controller.signal.aborted) setTimeline(response.data);
    }).catch(() => { if (!controller.signal.aborted) setTimelineError(true); });
    return () => controller.abort();
  }, [date, filter, refreshKey]);
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
            <Flex gap={8}>
              <Button block onClick={() => setSelected(dayjs())}>回到今天</Button>
              <Button block icon={<ReloadOutlined />} onClick={() => setRefreshKey((key) => key + 1)}>刷新</Button>
            </Flex>
            <Select aria-label="任务类型" placeholder="任务类型" allowClear options={timelineTypeOptions} value={filter.type}
              onChange={(type) => setFilter((value) => ({ ...value, type }))} />
            <Select aria-label="执行结果" placeholder="执行结果" allowClear options={timelineStatusOptions} value={filter.status}
              onChange={(status) => setFilter((value) => ({ ...value, status }))} />
            <Input.Search aria-label="任务名称" placeholder="任务名称，回车搜索" allowClear
              onSearch={(text) => setFilter((value) => ({ ...value, keyword: text.trim() || undefined }))} />
          </Flex>
        </Card>
        <Card className="fa-islands-panel" aria-label="当日统计">
          <div className="job-visual-stats">
            {timelineStatCards(timeline?.stats).map(({ label, value }) => (
              <div className="job-visual-stat" key={label}>
                <Typography.Text type="secondary">{label}</Typography.Text>
                <Typography.Text strong>{value}</Typography.Text>
              </div>
            ))}
          </div>
        </Card>
        </div>
        <div className="job-visual-timeline">
          <section className="fa-islands-table job-visual-chart" aria-label="执行时间轴">
            {timelineError ? <Alert type="error" message="时间轴加载失败" showIcon />
              : timeline ? <JobTimeline date={date} result={timeline} /> : <Spin /> }
          </section>
        </div>
    </div>
  );
}

import { LeftOutlined, ReloadOutlined, RightOutlined } from '@ant-design/icons';
import { Alert, Button, Calendar, Card, Flex, Input, Select, Spin, Typography, theme } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { jobApi } from '@features/fa-admin-pages/services';
import JobTimeline from './components/JobTimeline';
import { timelineStatCards, timelineWindow, timelineStatusOptions, timelineTypeOptions, type TimelineFilter, type TimelineResult } from './timeline';
import { calendarStatus, type CalendarDay } from './calendar';
import './job-visual-calendar.scss';

export default function JobVisual() {
  const { token } = theme.useToken();
  const [selected, setSelected] = useState(dayjs());
  const month = selected.format('YYYY-MM');
  const date = selected.format('YYYY-MM-DD');
  const [timelineData, setTimelineData] = useState<{ key: string; result: TimelineResult } | null>(null);
  const [fullDayData, setFullDayData] = useState<{ key: string; result: TimelineResult } | null>(null);
  const [hours, setHours] = useState(24);
  const [offset, setOffset] = useState(0);
  const win = timelineWindow(hours, offset);
  const [filter, setFilter] = useState<TimelineFilter>({});
  const [timelineError, setTimelineError] = useState(false);
  const [days, setDays] = useState<Record<string, CalendarDay>>({});
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const fullDayKey = `${date}|${JSON.stringify(filter)}|${refreshKey}`;
  const cachedDay = fullDayData?.key === fullDayKey ? fullDayData : null;
  const useFullDay = !!cachedDay && (hours === 24 || !cachedDay.result.buckets?.length);
  const timelineKey = useFullDay || hours === 24 ? fullDayKey : `${fullDayKey}|${hours}|${win.start}`;
  const currentData = useFullDay ? cachedDay : timelineData?.key === timelineKey ? timelineData : null;
  const timeline = currentData?.result ?? null;
  const displayedData = currentData ?? timelineData;
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
    setTimelineError(false);
    if (useFullDay) return () => controller.abort();
    // 全天无聚合时可直接复用明细；存在聚合时按窗口请求以获取更细的数据。
    const windowParams = hours === 24 ? {} : { windowStart: win.start, windowEnd: win.end };
    jobApi.visualTimeline(date, { ...filter, ...windowParams }, controller.signal).then((response) => {
      if (response.status !== 200) throw new Error(response.message);
      if (!controller.signal.aborted) {
        const data = { key: timelineKey, result: response.data };
        setTimelineData(data);
        if (hours === 24) setFullDayData(data);
      }
    }).catch(() => { if (!controller.signal.aborted) setTimelineError(true); });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timelineKey, refreshKey]);
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
                  style={{
                    ...(date.isSame(selected, 'day') ? { background: token.colorPrimary, color: token.colorTextLightSolid } : {}),
                    ...(date.isSame(dayjs(), 'day') ? { boxShadow: `inset 0 0 0 1px ${token.colorPrimary}` } : {}),
                  }}>
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
        <Card className="fa-islands-panel job-visual-filter-card" aria-label="查询条件">
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
        <Card className="fa-islands-panel job-visual-stats-card" aria-label="当日统计">
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
              : displayedData ? <JobTimeline date={displayedData.key.split('|')[0]} selectedDate={date} loading={!timeline} result={displayedData.result} fullDayResult={cachedDay?.result} hours={hours} offset={offset} onWindowChange={(h, o) => { setHours(h); setOffset(o); }} /> : <Spin /> }
          </section>
        </div>
    </div>
  );
}

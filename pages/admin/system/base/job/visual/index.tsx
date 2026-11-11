import { LeftOutlined, ReloadOutlined, RightOutlined } from '@ant-design/icons';
import { PageLoading, useQs } from '@fa/ui';
import { Alert, Button, Calendar, Card, Flex, Input, Select, Switch, Typography, theme } from 'antd';
import dayjs from 'dayjs';
import { useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { jobApi } from '@features/fa-admin-pages/services';
import { MenuLayoutContext, TabLeaveContext } from '@features/fa-admin-pages/layout/menu';
import JobTimeline from './components/JobTimeline';
import { timelineStatCards, timelineWindow, timelineStatusOptions, timelineTypeOptions, type PlanItem, type TimelineFilter, type TimelineResult } from './timeline';
import { calendarStatus, type CalendarDay } from './calendar';
import { parseTimelineLink, scheduleTimelineRefresh } from './historyLink';
import { loadTimelineSnapshot } from './timelineRefresh';
import './job-visual-calendar.scss';

export default function JobVisual() {
  const { token } = theme.useToken();
  const { curTab } = useContext(MenuLayoutContext);
  const tabKey = useContext(TabLeaveContext);
  const isActive = tabKey == null || curTab?.key === tabKey;
  const location = useLocation();
  const query = useQs();
  const [selected, setSelected] = useState(dayjs());
  const [highlightJobId, setHighlightJobId] = useState<number>();
  const [autoRefresh, setAutoRefresh] = useState(false);
  const month = selected.format('YYYY-MM');
  const date = selected.format('YYYY-MM-DD');
  const [timelineData, setTimelineData] = useState<{ key: string; scope: string; result: TimelineResult; receivedAt: number } | null>(null);
  const [fullDayData, setFullDayData] = useState<{ key: string; scope: string; result: TimelineResult; receivedAt: number } | null>(null);
  const [hours, setHours] = useState(24);
  const [offset, setOffset] = useState(0);
  const win = timelineWindow(hours, offset);
  const [filter, setFilter] = useState<TimelineFilter>({});
  const [timelineError, setTimelineError] = useState(false);
  const [days, setDays] = useState<Record<string, CalendarDay>>({});
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showPlan, setShowPlan] = useState(true);
  const [planData, setPlanData] = useState<{ key: string; items: PlanItem[] } | null>(null);
  const [planDays, setPlanDays] = useState<string[]>([]);
  const [planError, setPlanError] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [planCalendarError, setPlanCalendarError] = useState(false);
  const planVisible = showPlan && filter.status == null;
  const scope = JSON.stringify([date, filter]);
  const planKey = JSON.stringify([date, filter.type, filter.keyword]);
  const plans = planData?.key === planKey ? planData.items : [];
  const fullDayKey = `${date}|${JSON.stringify(filter)}|${refreshKey}`;
  const cachedDay = fullDayData?.key === fullDayKey ? fullDayData : null;
  const shownDay = cachedDay ?? (fullDayData?.scope === scope ? fullDayData : null);
  const useFullDay = !!cachedDay && (hours === 24 || !cachedDay.result.buckets?.length);
  const requestFullDay = !cachedDay || hours === 24;
  const timelineKey = useFullDay || requestFullDay ? fullDayKey : `${fullDayKey}|${hours}|${win.start}`;
  const currentData = useFullDay ? cachedDay : timelineData?.key === timelineKey ? timelineData : null;
  const timeline = currentData?.result ?? null;
  const displayedData = currentData ?? timelineData;
  const isToday = selected.isSame(dayjs(), 'day');
  useEffect(() => {
    if (!isActive || location.pathname !== '/admin/system/base/job/visual') return;
    const target = parseTimelineLink(query.date, query.jobId);
    if (target) {
      setSelected(dayjs(target.date)); setHighlightJobId(target.jobId);
      setHours(24); setOffset(0); setFilter({});
    }
    // useQs 读取当前地址；仅在地址或活动标签改变时应用跳转。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search, isActive]);
  useEffect(() => {
    if (!autoRefresh || !isActive || !isToday) return;
    return scheduleTimelineRefresh(
      () => ({ date, today: dayjs().format('YYYY-MM-DD'), active: isActive, visible: document.visibilityState === 'visible' }),
      () => setRefreshKey((key) => key + 1),
      () => setAutoRefresh(false),
    );
  }, [autoRefresh, date, isActive, isToday]);
  useEffect(() => {
    const controller = new AbortController();
    setError(false);
    jobApi.visualCalendar(month, controller.signal).then((response) => {
      if (response.status !== 200) throw new Error(response.message);
      if (!controller.signal.aborted) setDays(Object.fromEntries(response.data.map((day: CalendarDay) => [day.date, day])));
    }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [month, refreshKey]);
  useEffect(() => {
    const controller = new AbortController();
    setPlanCalendarError(false);
    if (planVisible) jobApi.visualPlanCalendar(month, controller.signal).then((response) => {
      if (response.status !== 200) throw new Error(response.message);
      if (!controller.signal.aborted) setPlanDays(response.data);
    }).catch(() => { if (!controller.signal.aborted) setPlanCalendarError(true); });
    return () => controller.abort();
  }, [month, refreshKey, planVisible]);
  useEffect(() => {
    const controller = new AbortController();
    setPlanError(false);
    setPlanLoading(planVisible);
    if (planVisible) jobApi.visualPlan(date, { type: filter.type, keyword: filter.keyword }, controller.signal).then((response) => {
      if (response.status !== 200) throw new Error(response.message);
      if (!controller.signal.aborted) setPlanData({ key: planKey, items: response.data.items });
    }).catch(() => { if (!controller.signal.aborted) setPlanError(true); })
      .finally(() => { if (!controller.signal.aborted) setPlanLoading(false); });
    return () => controller.abort();
  }, [date, filter.type, filter.keyword, refreshKey, planVisible]);
  useEffect(() => {
    const controller = new AbortController();
    setTimelineError(false);
    if (useFullDay || timelineData?.key === timelineKey) return () => controller.abort();
    // 全天无聚合时可直接复用明细；存在聚合时按窗口请求以获取更细的数据。
    let dayReceivedAt = 0;
    let windowReceivedAt = 0;
    const fetchTimeline = async (windowParams: { windowStart?: number; windowEnd?: number }) => {
      const response = await jobApi.visualTimeline(date, { ...filter, ...windowParams }, controller.signal);
      if (response.status !== 200) throw new Error(response.message);
      if (windowParams.windowStart == null) dayReceivedAt = Date.now();
      else windowReceivedAt = Date.now();
      return response.data;
    };
    const windowParams = { windowStart: win.start, windowEnd: win.end };
    const load = requestFullDay
      ? loadTimelineSnapshot(hours, () => fetchTimeline({}), () => fetchTimeline(windowParams))
      : fetchTimeline(windowParams).then((result) => ({ day: null, window: result }));
    load.then(({ day, window }) => {
      if (controller.signal.aborted) return;
      if (day) setFullDayData({ key: fullDayKey, scope, result: day, receivedAt: dayReceivedAt });
      const key = day && window !== day ? `${fullDayKey}|${hours}|${win.start}` : timelineKey;
      setTimelineData({ key, scope, result: window, receivedAt: day && window === day ? dayReceivedAt : windowReceivedAt });
    }).catch(() => { if (!controller.signal.aborted) setTimelineError(true); });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timelineKey, refreshKey, hours, win.start, win.end]);
  return (
    <div className="fa-islands-grid job-visual-page">
        <div className="job-visual-sidebar">
        <Card className="fa-islands-panel job-visual-calendar-card" title="定时任务可视化">
          {error && <Alert type="error" title="日历数据加载失败" showIcon action={<Button size="small" onClick={() => setRefreshKey((key) => key + 1)}>重试</Button>} />}
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
              const hasPlan = date.isAfter(dayjs(), 'day') && date.format('YYYY-MM') === month && planDays.includes(date.format('YYYY-MM-DD'));
              return (
                <div className="ant-picker-cell-inner job-visual-calendar-date"
                  style={{
                    ...(date.isSame(selected, 'day') ? { background: token.colorPrimary, color: token.colorTextLightSolid } : {}),
                    ...(date.isSame(dayjs(), 'day') ? { boxShadow: `inset 0 0 0 1px ${token.colorPrimary}` } : {}),
                  }}>
                  <span>{date.date()}</span>
                  {day && status && <span className={`job-visual-calendar-dot${hasPlan ? ' has-plan' : ''}`} role="img"
                    aria-label={day.failed ? `失败 ${day.failed} 次` : `全部成功，共 ${day.total} 次`}
                    style={{ background: status === 'error' ? token.colorError : token.colorSuccess }} />}
                  {hasPlan && <span className="job-visual-calendar-plan" role="img" aria-label="有计划" style={{ borderColor: date.isSame(selected, 'day') ? token.colorTextLightSolid : token.colorTextSecondary }} />}
                </div>
              );
            }} />
          <Flex className="job-visual-calendar-legend" gap={16} wrap="wrap" align="center">
            <span className="job-visual-today-legend" style={{ fontSize: 11, color: token.colorTextSecondary }}><span className="job-visual-legend-dot" style={{ background: token.colorSuccess }} aria-hidden="true" />全部成功</span>
            <span className="job-visual-today-legend" style={{ fontSize: 11, color: token.colorTextSecondary }}><span className="job-visual-legend-dot" style={{ background: token.colorError }} aria-hidden="true" />有失败</span>
            <button type="button" aria-label="回到今天" className="job-visual-today-legend job-visual-today-button" style={{ fontSize: 11, color: token.colorTextSecondary }} onClick={() => setSelected(dayjs())}><span className="job-visual-today-mark" aria-hidden="true" />今天</button>
            {planVisible && <span className="job-visual-today-legend" style={{ fontSize: 11, color: token.colorTextSecondary }}><span className="job-visual-calendar-plan-legend" style={{ borderColor: token.colorTextSecondary }} />有计划</span>}
          </Flex>
        </Card>
        <Card className="fa-islands-panel job-visual-filter-card" aria-label="查询条件">
          <Flex vertical gap={12}>
            <Flex justify="space-between" align="center"><span>显示计划</span><Switch aria-label="显示计划" checked={showPlan} onChange={setShowPlan} /></Flex>
            <Flex justify="space-between" align="center"><span>自动刷新（30 秒）</span><Switch aria-label="自动刷新" checked={autoRefresh && isToday} disabled={!isToday} onChange={setAutoRefresh} /></Flex>
            {showPlan && filter.status != null && <Typography.Text type="secondary">按执行结果筛选时隐藏计划</Typography.Text>}
            {(planError || planCalendarError) && planVisible && <Alert type="error" showIcon title="计划预览加载失败" action={<Button size="small" onClick={() => setRefreshKey((key) => key + 1)}>重试</Button>} />}
            <Select aria-label="任务类型" placeholder="任务类型" allowClear options={timelineTypeOptions} value={filter.type}
              onChange={(type) => setFilter((value) => ({ ...value, type }))} />
            <Select aria-label="执行结果" placeholder="执行结果" allowClear options={timelineStatusOptions} value={filter.status}
              onChange={(status) => setFilter((value) => ({ ...value, status }))} />
            <Flex gap={8}>
              <Input.Search aria-label="任务名称" placeholder="任务名称，回车搜索" allowClear style={{ flex: 1, minWidth: 0 }}
                onSearch={(text) => setFilter((value) => ({ ...value, keyword: text.trim() || undefined }))} />
              <Button aria-label="刷新" title="刷新" icon={<ReloadOutlined />} onClick={() => setRefreshKey((key) => key + 1)} />
            </Flex>
          </Flex>
        </Card>
        <Card className="fa-islands-panel job-visual-stats-card" aria-label="当日统计">
          <div className="job-visual-stats">
            {timelineStatCards((timeline ?? (displayedData?.scope === scope ? displayedData.result : null))?.stats).map(({ label, value }) => (
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
            {timelineError && <Alert type="error" title="时间轴加载失败" showIcon action={<Button size="small" onClick={() => setRefreshKey((key) => key + 1)}>重试</Button>} />}
            {(!timelineError || displayedData?.scope === scope) && (displayedData
              ? <JobTimeline date={displayedData.key.split('|')[0]} selectedDate={date} loading={!timeline && !timelineError} emptyPending={planVisible && !planError && (planLoading || planData?.key !== planKey)} result={displayedData.result} receivedAt={displayedData.receivedAt} fullDayResult={shownDay?.result} fullDayReceivedAt={shownDay?.receivedAt} plans={planVisible && displayedData.key.split('|')[0] === date ? plans : []} hours={hours} offset={offset} highlightJobId={highlightJobId} onWindowChange={(h, o) => { setHours(h); setOffset(o); }} />
              : !timelineError && <PageLoading tip="正在加载时间轴..." style={{ flex: 1 }} />)}
          </section>
        </div>
    </div>
  );
}

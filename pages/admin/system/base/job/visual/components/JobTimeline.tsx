import * as echarts from 'echarts';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { Segmented, Slider, Spin, theme } from 'antd';
import { bucketOpacity, timelineClickTarget, timelineModel, timelineWindow, type TimelineEntry, type TimelineResult } from '../timeline';
import JobTimelineDetail from './JobTimelineDetail';

type Props = { date: string; selectedDate: string; loading: boolean; result: TimelineResult; receivedAt: number; fullDayResult?: TimelineResult; fullDayReceivedAt?: number; hours: number; offset: number; onWindowChange: (hours: number, offset: number) => void };
const rowHeight = 44;
const timeLabel = (seconds: number) => `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor(seconds % 3600 / 60)).padStart(2, '0')}`;
const statusText: Record<number, string> = { 1: '执行中', 2: '成功', 3: '停止中', 7: '已停止', 8: '未确认', 9: '失败' };

export default function JobTimeline({ date, selectedDate, loading, result, receivedAt, fullDayResult, fullDayReceivedAt, hours, offset, onWindowChange }: Props) {
  const element = useRef<HTMLDivElement>(null);
  const { token } = theme.useToken();
  // 拖动滑块时只更新本地位置，松手后才通知父组件重新请求
  const [dragging, setDragging] = useState<number | null>(null);
  const [detail, setDetail] = useState<TimelineEntry | null>(null);
  const [now, setNow] = useState(result.serverTime);
  const [reducedMotion, setReducedMotion] = useState(false);
  const onWindowChangeRef = useRef(onWindowChange);
  onWindowChangeRef.current = onWindowChange;
  useEffect(() => { setDetail(null); }, [selectedDate]);
  const window = timelineWindow(hours, dragging ?? offset);
  const shown = window.start;
  const plotResult = (dragging !== null || loading) && fullDayResult ? fullDayResult : result;
  const plotReceivedAt = plotResult === fullDayResult ? fullDayReceivedAt ?? receivedAt : receivedAt;
  const hasRunning = plotResult.entries.some((entry) => entry.status === 1 || entry.status === 3);
  useEffect(() => {
    const base = dayjs(plotResult.serverTime);
    const update = () => setNow(base.add(Date.now() - plotReceivedAt, 'millisecond').format('YYYY-MM-DDTHH:mm:ss'));
    update();
    if (!hasRunning) return;
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [plotResult.serverTime, plotReceivedAt, hasRunning]);
  useEffect(() => {
    if (!globalThis.matchMedia) return;
    const media = globalThis.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const { names } = timelineModel(plotResult.entries, date, plotResult.buckets, now, fullDayResult);
  useEffect(() => {
    const target = element.current;
    return () => { if (target) echarts.getInstanceByDom(target)?.dispose(); };
  }, []);
  useEffect(() => {
    if (!element.current) return;
    const chart = echarts.getInstanceByDom(element.current) ?? echarts.init(element.current);
    const model = timelineModel(plotResult.entries, date, plotResult.buckets, now, fullDayResult);
    const { names, meta, rows, bucketRows } = model;
    const maxBucket = Math.max(0, ...bucketRows.map((item) => item.total));
    const currentTime = dayjs(now);
    const current = currentTime.format('YYYY-MM-DD') === date ? currentTime.hour() * 3600 + currentTime.minute() * 60 + currentTime.second() : null;
    const gridLines = () => {
      const width = chart.getWidth();
      const top = 32;
      const bottom = top + names.length * rowHeight;
      const divisions = hours === 24 ? 12 : 6;
      const horizontal = Array.from({ length: names.length + 1 }, (_, index) => ({
        id: `row-line-${index}`, type: 'line', silent: true,
        shape: { x1: 0, y1: top + index * rowHeight, x2: width, y2: top + index * rowHeight },
        style: { stroke: token.colorSplit, lineWidth: 1 },
      }));
      const vertical = Array.from({ length: divisions }, (_, index) => ({
        id: `time-line-${index}`, type: 'line', silent: true,
        shape: { x1: 130 + (width - 130) * index / divisions, y1: top, x2: 130 + (width - 130) * index / divisions, y2: bottom },
        style: { stroke: token.colorSplit, lineWidth: 1 },
      }));
      return [...horizontal, ...vertical];
    };
    chart.setOption({
      animation: false,
      grid: { left: 130, right: 0, top: 32, bottom: 4, containLabel: false },
      legend: { show: false },
      graphic: gridLines(),
      tooltip: { trigger: 'item', renderMode: 'richText', backgroundColor: token.colorBgElevated, borderColor: token.colorBorder, textStyle: { color: token.colorText }, formatter: (params: any) => {
        if (params.seriesName === '聚合执行') {
          const item = bucketRows[params.dataIndex];
          if (!item) return '';
          return `${names[item.row]}\n时段：${timeLabel(item.begin)} – ${timeLabel(item.end)}\n执行：${item.total} 次\n失败：${item.failed} 次\n点击放大到 1 小时查看明细（高频数据仍可能聚合）`;
        }
        const row = rows[params.dataIndex];
        if (params.seriesName !== '执行记录' || !row) return '';
        const e = row.entry;
        const duration = e.durationMs != null ? `${e.durationMs} 毫秒` : e.duration != null ? `${e.duration} 秒` : '未知';
        return `${e.jobName || (e.jobId == null ? `记录 #${e.id}` : `任务 #${e.jobId}`)}${e.crossDay ? '（跨天）' : ''}\n开始：${e.beginTime.replace('T', ' ')}\n结束：${e.endTime?.replace('T', ' ') || '未知'}\n耗时：${duration}\n结果：${statusText[e.status] || '未知'}`;
      } },
      xAxis: { type: 'value', min: window.start, max: window.end, interval: hours === 1 ? 600 : hours === 6 ? 3600 : 7200, position: 'top', axisTick: { show: false }, axisLine: { show: false }, axisLabel: { color: token.colorTextSecondary, align: 'center', formatter: (value: number) => value === window.end ? `{last|${timeLabel(value)}}` : timeLabel(value), rich: { last: { padding: [0, 32, 0, 0], color: token.colorTextSecondary } } }, splitLine: { show: false } },
      yAxis: { type: 'category', data: names, inverse: true, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: token.colorText, width: 110, align: 'left', margin: 120, overflow: 'truncate', lineHeight: 19, formatter: (name: string, index: number) => { const entry = meta[index]; const clean = (text: string) => text.replace(/[{}|\n\r]/g, ' '); return `{kind|${entry?.jobType === 1 ? '流' : entry?.jobType === 0 ? '任' : '—'}} ${clean(name)}\n{cron|${clean(entry?.cron || '无 Cron 信息')}}`; }, rich: { kind: { color: token.colorPrimary, fontWeight: 'bold' }, cron: { color: token.colorTextSecondary, fontSize: 11 } } }, splitLine: { show: false } },
      series: [
        { name: '执行记录', type: 'custom', renderItem: (params: any, api: any) => {
          const row = api.value(0); const start = api.coord([api.value(1), row]); const end = api.coord([api.value(2), row]);
          const height = Math.min(20, api.size([0, 1])[1] * 0.6);
          const rect = echarts.graphic.clipRectByRect({ x: start[0], y: start[1] - height / 2, width: Math.max(2, end[0] - start[0]), height }, { x: params.coordSys.x, y: params.coordSys.y, width: params.coordSys.width, height: params.coordSys.height });
          return rect ? { type: 'rect', shape: rect, style: api.style() } : null;
        }, data: rows.map((row) => ({ value: [row.row, row.begin, row.end], itemStyle: { color: row.entry.status === 2 ? token.colorSuccess : row.entry.status === 9 ? token.colorError : token.colorTextTertiary, opacity: row.running && !reducedMotion && currentTime.second() % 2 ? 0.45 : 1 } })) },
        { name: '聚合执行', type: 'custom', renderItem: (params: any, api: any) => {
          const row = api.value(0); const start = api.coord([api.value(1), row]); const end = api.coord([api.value(2), row]);
          const height = Math.min(20, api.size([0, 1])[1] * 0.6);
          const rect = echarts.graphic.clipRectByRect({ x: start[0], y: start[1] - height / 2, width: Math.max(2, end[0] - start[0] - 1), height }, { x: params.coordSys.x, y: params.coordSys.y, width: params.coordSys.width, height: params.coordSys.height });
          return rect ? { type: 'rect', shape: rect, style: api.style() } : null;
        }, data: bucketRows.map((item) => ({ value: [item.row, item.begin, item.end], itemStyle: { color: item.failed > 0 ? token.colorError : token.colorSuccess, opacity: bucketOpacity(item.total, maxBucket) } })) },
        ...[['成功', token.colorSuccess], ['失败', token.colorError], ['其他', token.colorTextTertiary]].map(([name, color]) => ({ name, type: 'scatter', data: [], itemStyle: { color } })),
        ...(current === null ? [] : [{ name: '当前时刻', type: 'scatter', data: [], itemStyle: { color: token.colorError }, markLine: { symbol: 'none', silent: true, label: { show: false }, lineStyle: { color: token.colorError, type: 'solid' }, data: [{ xAxis: current }] } }]),
      ],
    }, { notMerge: true });
    chart.off('click');
    chart.on('click', (params) => {
      if (loading || dragging !== null) return;
      const target = timelineClickTarget(params.seriesName, params.dataIndex, model);
      if (target?.type === 'detail') setDetail(target.entry);
      if (target?.type === 'zoom') onWindowChangeRef.current(1, target.start);
    });
    const observer = new ResizeObserver(() => {
      chart.resize();
      chart.setOption({ graphic: gridLines() });
    });
    observer.observe(element.current);
    return () => { observer.disconnect(); };
  }, [date, plotResult, fullDayResult, token, window.start, window.end, hours, loading, dragging, now, reducedMotion]);
  const isToday = dayjs(now).format('YYYY-MM-DD') === date;
  return (
    <div className="job-timeline-content">
      <div className="job-timeline-header" style={{ borderColor: token.colorSplit }}>
        <div>
          <div className="job-timeline-date">{dayjs(selectedDate).format('YYYY年M月D日')} 星期{['日', '一', '二', '三', '四', '五', '六'][dayjs(selectedDate).day()]} {loading && <Spin size="small" aria-label="时间轴加载中" />}</div>
          <div style={{ color: token.colorTextSecondary }}>当日共 {result.stats ? Number(result.stats.total ?? 0) : result.entries.length} 次执行，涉及 {names.length} 个任务</div>
        </div>
        <div className="job-timeline-controls">
          <span style={{ color: token.colorTextSecondary }}>时间范围</span>
          <Segmented aria-label="时间范围" value={hours} options={[{ label: '全天', value: 24 }, { label: '6 小时', value: 6 }, { label: '1 小时', value: 1 }]}
            onChange={(value) => { setDragging(null); onWindowChange(Number(value), 0); }} />
          {hours !== 24 && <><Slider aria-label="时间窗口起点" min={0} max={86400 - hours * 3600} step={600} value={shown} onChange={setDragging} onChangeComplete={(value) => { setDragging(null); onWindowChange(hours, value); }} tooltip={{ formatter: (value) => timeLabel(value ?? 0) }} style={{ width: 120, marginInline: 4 }} />
            <span style={{ color: token.colorTextSecondary }}>{timeLabel(shown)} – {timeLabel(shown + hours * 3600)}</span></>}
        </div>
      </div>
      <div className="job-timeline-plot">
        <div ref={element} role="img" aria-label={`${date} 任务执行时间轴`} style={{ width: '100%', height: Math.max(80, names.length * rowHeight + 36) }} />
      </div>
      <div className="job-timeline-legend" style={{ color: token.colorTextSecondary, borderColor: token.colorSplit }}>
        {[[token.colorSuccess, '成功'], [token.colorError, '失败'], [token.colorTextTertiary, '其他']].map(([color, label]) => (
          <span key={label}><i style={{ background: color }} />{label}</span>
        ))}
        {isToday && <span><i className="job-timeline-current" style={{ background: token.colorError }} />当前时刻</span>}
      </div>
      {detail && <JobTimelineDetail key={detail.id} id={detail.id} cron={detail.cron} onClose={() => setDetail(null)} />}
    </div>
  );
}
